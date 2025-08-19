'use strict';

const { gotCheerioStrategy } = require('./strategies/gotCheerioStrategy');
const { puppeteerStrategy } = require('./strategies/puppeteerStrategy');

/**
 * PUBLIC_INTERFACE
 * @typedef {import('../../types').ScrapeOptions} ScrapeOptions
 */

/**
 * PUBLIC_INTERFACE
 * @param {ScrapeOptions} [options]
 */
function selectStrategy(options = {}) {
  const pref = (options.strategy || process.env.SCRAPER_STRATEGY || 'auto').toLowerCase();
  if (pref === 'cheerio') return gotCheerioStrategy;
  if (pref === 'puppeteer') return puppeteerStrategy;
  // auto: prefer cheaper got first, but expose name 'auto(got)'
  return {
    ...gotCheerioStrategy,
    name: 'auto(got)',
  };
}

module.exports = {
  selectStrategy,
};
