const puppeteer = require("puppeteer");

/**
 * Legacy helper kept for backward compatibility with existing scrapers.
 * New code should use src/lib/scrape/strategies/puppeteerStrategy.fetchHtml for richer options.
 */
const blockedResourceTypes = [
  "image",
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
  "stylesheet",
  "font"
];

const skippedResources = [
  "quantserve",
  "adzerk",
  "doubleclick",
  "adition",
  "exelator",
  "sharethrough",
  "cdn.api.twitter",
  "google-analytics",
  "googletagmanager",
  "google",
  "fontawesome",
  "facebook",
  "analytics",
  "optimizely",
  "clicktale",
  "mixpanel",
  "zedo",
  "clicksor",
  "tiqcdn"
];

const puppeteerFetch = async url => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);

  await page.on("request", req => {
    const requestUrl = req.url().split("?")[0].split("#")[0];
    if (
      blockedResourceTypes.indexOf(req.resourceType()) !== -1 ||
      skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const response = await page.goto(url, { waitUntil: "networkidle2" });

  if (response.status() < 400) {
    let html = await page.content();
    try {
      await browser.close();
    } finally {
      return html;
    } // avoid websocket error if browser already closed
  } else {
    const status = response.status();
    try {
      await browser.close();
    } finally {
      return Promise.reject(status);
    }
  }
};

module.exports = puppeteerFetch;
