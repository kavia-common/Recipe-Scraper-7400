'use strict';

const { RecipeSchema } = require('../recipe/schema');

/**
 * Validate an object against the minimal RecipeSchema. Returns {ok, errors?}
 * Kept simple to avoid extra deps; callers can integrate Ajv if they need stronger checks.
 * @param {any} obj
 */
function validateRecipeShape(obj) {
  const errors = [];
  const props = RecipeSchema.properties;

  // ingredients and instructions are required arrays of strings
  if (!Array.isArray(obj.ingredients)) errors.push('ingredients must be an array');
  if (!Array.isArray(obj.instructions)) errors.push('instructions must be an array');

  // check array items
  if (Array.isArray(obj.ingredients) && !obj.ingredients.every((s) => typeof s === 'string')) {
    errors.push('ingredients items must be strings');
  }
  if (Array.isArray(obj.instructions) && !obj.instructions.every((s) => typeof s === 'string')) {
    errors.push('instructions items must be strings');
  }

  // optional string props
  for (const key of ['name', 'image', 'source']) {
    if (obj[key] != null && typeof obj[key] !== 'string') {
      errors.push(`${key} must be a string when present`);
    }
  }

  // tags
  if (obj.tags != null) {
    if (!Array.isArray(obj.tags) || !obj.tags.every((s) => typeof s === 'string')) {
      errors.push('tags must be an array of strings when present');
    }
  }

  // yields
  if (obj.yields != null) {
    if (typeof obj.yields !== 'string' && typeof obj.yields !== 'number') {
      errors.push('yields must be string or number when present');
    }
  }

  // time
  if (obj.time != null) {
    if (typeof obj.time !== 'object') {
      errors.push('time must be an object when present');
    } else {
      for (const k of ['total', 'prep', 'cook']) {
        if (obj.time[k] != null && typeof obj.time[k] !== 'string') {
          errors.push(`time.${k} must be a string when present`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

module.exports = {
  validateRecipeShape,
};
