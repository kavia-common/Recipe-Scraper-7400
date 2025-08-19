'use strict';

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { NetworkError, ParseError } = require('../../errors');

/**
 * PUBLIC_INTERFACE
 * @typedef {import('../../../types').ScrapeOptions} ScrapeOptions
 */

/**
 * Fetch rendered HTML using puppeteer. Use minimal resources for server environments.
 * @param {string} url
 * @param {ScrapeOptions} [options]
 */
async function fetchHtml(url, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      timeout: options.launchTimeoutMs || 30000,
    });
    const page = await browser.newPage();
    if (options.userAgent) await page.setUserAgent(options.userAgent);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: options.pageTimeoutMs || 30000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    return { $, html };
  } catch (e) {
    throw new NetworkError(`Failed to fetch dynamic page: ${url}`, { cause: e });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        // ignore
      }
    }
  }
}

/**
 * Basic generic scrape similar to got+cheerio, but after JS rendering.
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
    throw new ParseError('Failed to parse rendered HTML using puppeteer strategy', { cause: e });
  }
}

const puppeteerStrategy = {
  name: 'puppeteer',
  fetchHtml,
  scrape,
};

module.exports = { puppeteerStrategy };
