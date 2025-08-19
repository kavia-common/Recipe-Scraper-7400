'use strict';

const cheerio = require('cheerio');
const { ParseError } = require('../errors');

/**
 * Attempt to parse Recipe data from JSON-LD scripts. Handles arrays and graph.
 * @param {string} url
 * @param {{ fetchHtml?: Function, scrape?: Function, name?: string }} strategy
 * @param {import('../../types').ScrapeOptions} [options]
 */
async function parseJsonLdRecipe(url, strategy, options = {}) {
  const { html } = await strategy.fetchHtml(url, options);
  const $ = cheerio.load(html);

  const scripts = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).contents().text())
    .get()
    .filter(Boolean);

  for (const content of scripts) {
    try {
      const data = JSON.parse(content.trim());
      const recipe = extractRecipeFromLd(data);
      if (recipe) {
        recipe.source = url;
        return recipe;
      }
    } catch {
      // ignore malformed json-ld blocks
    }
  }
  throw new ParseError('No JSON-LD Recipe schema found');
}

function extractRecipeFromLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = extractRecipeFromLd(item);
      if (r) return r;
    }
  } else if (data && typeof data === 'object') {
    const type = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
    if (type.includes('Recipe')) {
      return normalizeFromJsonLd(data);
    }
    // Look into @graph
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      for (const node of data['@graph']) {
        const r = extractRecipeFromLd(node);
        if (r) return r;
      }
    }
  }
  return null;
}

function normalizeFromJsonLd(ld) {
  const name = ld.name || undefined;
  const image = Array.isArray(ld.image) ? ld.image[0] : ld.image;
  const ingredients = Array.isArray(ld.recipeIngredient) ? ld.recipeIngredient : [];
  const instructions = parseInstructions(ld.recipeInstructions);

  const time = {
    total: ld.totalTime,
    prep: ld.prepTime,
    cook: ld.cookTime,
  };

  const tags = []
    .concat(ld.keywords ? String(ld.keywords).split(',').map((s) => s.trim()) : [])
    .concat(Array.isArray(ld.recipeCategory) ? ld.recipeCategory : ld.recipeCategory ? [ld.recipeCategory] : [])
    .concat(Array.isArray(ld.recipeCuisine) ? ld.recipeCuisine : ld.recipeCuisine ? [ld.recipeCuisine] : [])
    .filter(Boolean);

  return {
    name,
    image,
    ingredients,
    instructions,
    time,
    tags,
    yields: ld.recipeYield,
  };
}

function parseInstructions(instructions) {
  if (!instructions) return [];
  if (typeof instructions === 'string') {
    return instructions
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    const steps = [];
    for (const step of instructions) {
      if (typeof step === 'string') {
        steps.push(step.trim());
      } else if (step && typeof step === 'object') {
        // HowToStep or creative step types
        const text = step.text || step.name || '';
        if (text && typeof text === 'string') steps.push(text.trim());
        if (Array.isArray(step.itemListElement)) {
          for (const sub of step.itemListElement) {
            const subText = typeof sub === 'string' ? sub : sub?.text || sub?.name;
            if (subText) steps.push(String(subText).trim());
          }
        }
      }
    }
    return steps.filter(Boolean);
  }
  if (instructions && typeof instructions === 'object') {
    // ItemList { itemListElement: [...] }
    if (Array.isArray(instructions.itemListElement)) {
      return instructions.itemListElement
        .map((el) => (typeof el === 'string' ? el : el?.text || el?.name))
        .filter(Boolean)
        .map((s) => String(s).trim());
    }
  }
  return [];
}

module.exports = {
  parseJsonLdRecipe,
};
