'use strict';

/**
 * PUBLIC_INTERFACE
 * scrapeRecipe(url: string, options?: ScrapeOptions): Promise<Recipe>
 *
 * This is the primary entry point. It validates the URL, selects an appropriate scraping
 * strategy (got+cheerio or puppeteer), falls back to JSON-LD extraction when applicable,
 * and returns a normalized Recipe object according to the central recipe schema.
 */

const { validateRecipeUrl } = require('./lib/validation/url');
const { UnsupportedDomainError, InvalidURLError, ScrapeError } = require('./lib/errors');
const { selectStrategy } = require('./lib/scrape/strategySelector');
const { normalizeRecipe } = require('./lib/recipe/normalize');
const { parseJsonLdRecipe } = require('./lib/jsonld/parser');
const { loadScraperForHostname } = require('./lib/scrape/scraperRegistry');

/**
 * PUBLIC_INTERFACE
 * @typedef {import('./types').ScrapeOptions} ScrapeOptions
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {import('./types').Recipe} Recipe
 */

/**
 * PUBLIC_INTERFACE
 * @param {string} url
 * @param {ScrapeOptions} [options]
 * @returns {Promise<import('./types').Recipe>}
 */
async function scrapeRecipe(url, options = {}) {
  // Validate and protect against SSRF and malformed URLs
  const validated = await validateRecipeUrl(url, options?.allowLocalNetwork === true);
  if (!validated.ok) {
    if (validated.reason === 'invalid') {
      throw new InvalidURLError(`Invalid URL: ${url}`);
    }
    if (validated.reason === 'ssrf') {
      throw new InvalidURLError(`Blocked potentially unsafe URL (SSRF): ${url}`);
    }
  }

  const { hostname } = new URL(url);

  // Attempt site-specific scraper first if available
  const siteScraper = loadScraperForHostname(hostname);

  // Strategy preference: options.strategy: 'cheerio' | 'puppeteer' | 'auto'
  const strategy = selectStrategy(options);

  // Try scraping using chosen strategy; if site scraper exists, prefer it
  let rawResult = null;
  let scrapeErrors = [];

  if (siteScraper && typeof siteScraper.scrape === 'function') {
    try {
      rawResult = await siteScraper.scrape(url, { strategy, ...options });
    } catch (err) {
      scrapeErrors.push(err);
    }
  }

  // If no site scraper or failed, try generic strategy scraping (HTML parse)
  if (!rawResult) {
    try {
      rawResult = await strategy.scrape(url, options);
    } catch (err) {
      scrapeErrors.push(err);
    }
  }

  // If still nothing, try JSON-LD fallback explicitly (works on many sites)
  let jsonLdResult = null;
  if (!rawResult || !rawResult.name) {
    try {
      jsonLdResult = await parseJsonLdRecipe(url, strategy, options);
    } catch (err) {
      scrapeErrors.push(err);
    }
  }

  const best = rawResult && rawResult.name ? rawResult : jsonLdResult;

  if (!best) {
    const last = scrapeErrors[scrapeErrors.length - 1];
    if (last instanceof UnsupportedDomainError) {
      throw last;
    }
    const msg =
      last?.message ||
      `Failed to scrape recipe from ${hostname}. Tried: site scraper, ${strategy.name}, and JSON-LD fallback.`;
    throw new ScrapeError(msg, { cause: last });
  }

  // Normalize to central schema
  return normalizeRecipe(best);
}

module.exports = {
  scrapeRecipe,
  // export errors and types helper for consumers
  errors: require('./lib/errors'),
};
