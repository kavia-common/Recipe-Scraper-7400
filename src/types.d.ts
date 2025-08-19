export interface ScrapeOptions {
  strategy?: 'cheerio' | 'puppeteer' | 'auto';
  headers?: Record<string, string>;
  requestTimeoutMs?: number;
  retryLimit?: number;
  rejectUnauthorized?: boolean;
  launchTimeoutMs?: number;
  pageTimeoutMs?: number;
  userAgent?: string;
  allowLocalNetwork?: boolean;
}

export interface RecipeTime {
  total?: string;
  prep?: string;
  cook?: string;
}

export interface Recipe {
  name?: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  yields?: string | number;
  tags?: string[];
  time?: RecipeTime;
  source?: string;
}

export interface ScraperStrategy {
  name: string;
  fetchHtml: (url: string, options?: ScrapeOptions) => Promise<{ $: any; html: string }>;
  scrape: (url: string, options?: ScrapeOptions) => Promise<Partial<Recipe>>;
}

export function scrapeRecipe(url: string, options?: ScrapeOptions): Promise<Recipe>;
export const errors: any;
