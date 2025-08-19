'use strict';

/**
 * Loads site-specific scraper implementations if available. Adapts from existing scrapers/index.js.
 * Each site scraper must export a scrape(url, {strategy,...}) function returning raw recipe object.
 */

const path = require('path');
const fs = require('fs');

function loadScraperForHostname(hostname) {
  // Map hostname to module file name based on existing conventions
  // Try exact match first, then simplify (remove subdomain like www.)
  const simpleHost = hostname.replace(/^www\./i, '');

  // Build search order
  const candidates = [
    simpleHost,
    hostname,
    simpleHost.split('.').slice(-2).join('.'), // domain.tld
  ];

  const scrapersDir = path.join(__dirname, '../../../scrapers');

  // Use scrapers/index.js if present to resolve
  const indexPath = path.join(scrapersDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const registry = require(indexPath);
      if (registry && typeof registry.getScraper === 'function') {
        const scraper = registry.getScraper(hostname) || registry.getScraper(simpleHost);
        if (scraper) return adaptLegacyScraper(scraper);
      }
    } catch {
      // ignore registry loading errors
    }
  }

  // Fallback: attempt require by known aliases from filenames
  const files = fs.readdirSync(scrapersDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
  for (const file of files) {
    const base = path.basename(file, '.js');
    for (const c of candidates) {
      if (base.includes(c.replace(/\./g, ''))) {
        try {
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const mod = require(path.join(scrapersDir, file));
          return adaptLegacyScraper(mod);
        } catch {
          // ignore
        }
      }
    }
  }

  return null;
}

function adaptLegacyScraper(mod) {
  // If the module already has scrape(url, opts) return as-is
  if (mod && typeof mod.scrape === 'function') return mod;

  // Many legacy scrapers export a function (url) => Promise<recipe>
  if (typeof mod === 'function') {
    return {
      async scrape(url, opts) {
        // Best-effort pass strategy into legacy if it supports
        return mod(url, opts);
      },
    };
  }

  return null;
}

module.exports = {
  loadScraperForHostname,
};
