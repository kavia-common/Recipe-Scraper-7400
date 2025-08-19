'use strict';

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} ScrapeOptions
 * @property {'cheerio'|'puppeteer'|'auto'} [strategy]
 * @property {Object.<string,string>} [headers]
 * @property {number} [requestTimeoutMs]
 * @property {number} [retryLimit]
 * @property {boolean} [rejectUnauthorized]
 * @property {number} [launchTimeoutMs]
 * @property {number} [pageTimeoutMs]
 * @property {string} [userAgent]
 * @property {boolean} [allowLocalNetwork]
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} RecipeTime
 * @property {string} [total]
 * @property {string} [prep]
 * @property {string} [cook]
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} Recipe
 * @property {string} [name]
 * @property {string} [image]
 * @property {string[]} ingredients
 * @property {string[]} instructions
 * @property {string|number} [yields]
 * @property {string[]} [tags]
 * @property {RecipeTime} [time]
 * @property {string} [source]
 */
