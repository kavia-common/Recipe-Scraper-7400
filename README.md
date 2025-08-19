# Recipe Scraper 7400

Production-ready Node.js recipe scraper package with:

- Modular architecture
- SSRF-safe URL validation
- Migration from deprecated `request` to `got`
- Dual scraping strategies: got+cheerio and puppeteer
- JSON-LD Recipe fallback parser
- Central recipe schema and normalization
- Strong API ergonomics with Promise-based API
- Type definitions (d.ts) and JSDoc
- ESLint + Prettier configuration

## Installation

```sh
npm install
```

If you are consuming as a package:

```sh
npm install recipe-scraper-7400
```

## Usage

CommonJS:

```js
const { scrapeRecipe, errors } = require('recipe-scraper-7400');

(async () => {
  try {
    const recipe = await scrapeRecipe('https://example.com/my-recipe', {
      strategy: 'auto', // 'cheerio' | 'puppeteer' | 'auto'
      requestTimeoutMs: 15000,
      retryLimit: 2,
      allowLocalNetwork: false
    });
    console.log(recipe);
  } catch (e) {
    if (e instanceof errors.InvalidURLError) {
      console.error('Invalid URL:', e.message);
    } else {
      console.error('Scrape failed:', e);
    }
  }
})();
```

TypeScript:

```ts
import { scrapeRecipe, type Recipe, type ScrapeOptions } from 'recipe-scraper-7400';
```

## API

- scrapeRecipe(url, options?): Promise<Recipe>

Options:
- strategy: 'cheerio' | 'puppeteer' | 'auto' (default 'auto', prefers got+cheerio)
- headers: custom HTTP headers for got
- requestTimeoutMs, retryLimit, rejectUnauthorized: got request behavior
- launchTimeoutMs, pageTimeoutMs, userAgent: puppeteer behavior
- allowLocalNetwork: default false; if true, disables private IP blocking (SSRF defense)

Recipe shape:

```ts
type Recipe = {
  name?: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  yields?: string | number;
  tags?: string[];
  time?: { total?: string; prep?: string; cook?: string };
  source?: string;
}
```

## Strategies

- got+cheerio: fast, lightweight, suitable for most static pages
- puppeteer: for dynamic pages that require JS rendering
- JSON-LD fallback: parser for schema.org/Recipe exposes many sites even without bespoke scrapers

## Errors

- InvalidURLError
- SSRFBlockedError
- UnsupportedDomainError
- ScrapeError
- NetworkError
- ParseError

All extend AppError and include optional cause and metadata.

## Environment

- SCRAPER_STRATEGY: 'cheerio' | 'puppeteer' | 'auto' (optional)
- REACT_APP_REACT_APP_API_BASE_URL: frontend-only variable; not used by this package.

You can set a .env in your host project if needed; this package does not read .env directly.

## Supported Websites

This package includes adapters to legacy site-specific scrapers found in the `scrapers/` folder and falls back to generic strategies + JSON-LD where possible.

## Development

- Lint: `npm run lint`
- Format: `npm run format`
- Tests: `npm test`

## License

MIT
