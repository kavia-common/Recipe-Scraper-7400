'use strict';

/**
 * Normalize a raw scrape result (site scraper, generic strategy, or JSON-LD) to our schema.
 * @param {any} raw
 * @returns {import('../../types').Recipe}
 */
function normalizeRecipe(raw) {
  const name = strOrU(raw.name);
  const image = strOrU(raw.image);
  const ingredients = arrOfStrings(raw.ingredients);
  const instructions = arrOfStrings(raw.instructions);
  const yields = raw.yields ?? raw.servings ?? undefined;
  const tags = arrOfStrings(raw.tags);
  const time = normalizeTime(raw.time || raw.times || {});

  return {
    name,
    image,
    ingredients,
    instructions,
    yields,
    tags,
    time,
    source: strOrU(raw.source),
  };
}

function normalizeTime(t) {
  const out = {};
  if (!t) return out;
  if (t.total) out.total = String(t.total);
  if (t.prep) out.prep = String(t.prep);
  if (t.cook) out.cook = String(t.cook);
  return out;
}

function arrOfStrings(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v)
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function strOrU(v) {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

module.exports = {
  normalizeRecipe,
};
