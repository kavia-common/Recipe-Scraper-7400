# Local development usage

When working locally in this repository:

const { scrapeRecipe } = require('./src');

(async () => {
  const recipe = await scrapeRecipe('https://example.com/recipe');
  console.log(recipe);
})();
