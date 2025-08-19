'use strict';

/**
 * Base application error that supports causes and metadata.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: Error, code?: string, meta?: Record<string, any> }} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    if (options?.cause) this.cause = options.cause;
    if (options?.code) this.code = options.code;
    if (options?.meta) this.meta = options.meta;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      meta: this.meta,
      cause: this.cause ? { name: this.cause.name, message: this.cause.message } : undefined,
    };
  }
}

class InvalidURLError extends AppError {}
class SSRFBlockedError extends AppError {}
class UnsupportedDomainError extends AppError {}
class ScrapeError extends AppError {}
class NetworkError extends AppError {}
class ParseError extends AppError {}

module.exports = {
  AppError,
  InvalidURLError,
  SSRFBlockedError,
  UnsupportedDomainError,
  ScrapeError,
  NetworkError,
  ParseError,
};
