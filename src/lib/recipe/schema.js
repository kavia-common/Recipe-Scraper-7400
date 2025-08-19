'use strict';

/**
 * PUBLIC_INTERFACE
 * A minimal schema descriptor for Recipe shape for documentation and validation hooks.
 * Validation is intentionally lightweight to avoid heavy deps.
 */
const RecipeSchema = {
  properties: {
    name: { type: 'string', optional: true },
    image: { type: 'string', optional: true },
    ingredients: { type: 'array', items: 'string' },
    instructions: { type: 'array', items: 'string' },
    yields: { type: ['string', 'number'], optional: true },
    tags: { type: 'array', items: 'string', optional: true },
    time: {
      type: 'object',
      optional: true,
      properties: {
        total: { type: 'string', optional: true },
        prep: { type: 'string', optional: true },
        cook: { type: 'string', optional: true }
      }
    },
    source: { type: 'string', optional: true }
  }
};

module.exports = {
  RecipeSchema
};
