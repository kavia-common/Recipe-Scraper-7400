'use strict';

const got = require('got');
const cheerio = require('cheerio');
const { NetworkError, ParseError } = require('../../errors');

/**
 * PUBLIC_INTERFACE
 * @typedef {import('../../../types').ScrapeOptions} ScrapeOptions
 */

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/**
 * Fetches HTML using got and returns $ cheerio instance and raw html.
 * @param {string} url
 * @param {ScrapeOptions} [options]
 */
async function fetchHtml(url, options = {}) {
  try {
    const resp = await got(url, {
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
      timeout: { request: options.requestTimeoutMs || 15000 },
      retry: { limit: options.retryLimit ?? 2 },
      followRedirect: true,
      https: { rejectUnauthorized: options.rejectUnauthorized !== false },
    });
    const html = resp.body;
    const $ = cheerio.load(html);
    return { $, html };
  } catch (e) {
    throw new NetworkError(`Failed to fetch URL: ${url}`, { cause: e });
  }
}

/**
 * Heuristic generic scrape from HTML, attempting to pull title, image, ingredients, instructions.
 * Prefer JSON-LD elsewhere but this provides a basic fallback if site-specific scraper is absent.
 * @param {string} url
 * @param {ScrapeOptions} [options]
 */
async function scrape(url, options = {}) {
  const { $ } = await fetchHtml(url, options);

  try {
    const name =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim();

    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('img[src*="recipe"]').first().attr('src') ||
      $('img').first().attr('src');

    // Ingredients commonly in <li> under a heading
    let ingredients = [];
    const ingredientSelectors = [
      '[itemprop="recipeIngredient"]',
      '.ingredients li',
      'li.ingredient',
      'ul.ingredients li',
      'section.ingredients li',
    ];
    for (const sel of ingredientSelectors) {
      if (ingredients.length) break;
      ingredients = $(sel)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
    }

    // Instructions commonly in ordered list or paragraphs
    let instructions = [];
    const instructionSelectors = [
      '[itemprop="recipeInstructions"] li',
      'ol.instructions li',
      '.instructions li',
      'section.instructions li',
    ];
    for (const sel of instructionSelectors) {
      if (instructions.length) break;
      instructions = $(sel)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
    }
    if (!instructions.length) {
      // fallback paragraphs under instructions container
      const container =
        $('.instructions, [itemprop="recipeInstructions"]').first();
      if (container.length) {
        instructions = container
          .find('p')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(Boolean);
      }
    }

    return {
      name: name || undefined,
      image: image || undefined,
      ingredients,
      instructions,
      source: url,
    };
  } catch (e) {
    throw new ParseError('Failed to parse HTML using cheerio strategy', { cause: e });
  }
}

const gotCheerioStrategy = {
  name: 'got+cheerio',
  fetchHtml,
  scrape,
};

module.exports = { gotCheerioStrategy };
