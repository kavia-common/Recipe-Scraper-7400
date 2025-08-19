'use strict';

const dns = require('dns').promises;
const net = require('net');
const { InvalidURLError, SSRFBlockedError } = require('../errors');

const PRIVATE_IP_RANGES = [
  { cidr: '10.0.0.0/8' },
  { cidr: '172.16.0.0/12' },
  { cidr: '192.168.0.0/16' },
  { cidr: '127.0.0.0/8' }, // loopback
  { cidr: '169.254.0.0/16' }, // link-local
  { cidr: '::1/128' }, // IPv6 loopback
  { cidr: 'fc00::/7' }, // Unique local address
  { cidr: 'fe80::/10' }, // Link-local
];

/**
 * Check if an IP is in a CIDR block
 * @param {string} ip
 * @param {string} cidr
 * @returns {boolean}
 */
function ipInCidr(ip, cidr) {
  // Basic implementation for IPv4 ranges, with common private ranges only.
  // For production use of broad CIDR logic, consider a tiny dependency like ip-cidr or ipaddr.js
  try {
    // Handle IPv6 simplest blocks
    if (ip.includes(':')) {
      // Only block known ranges via prefix match to avoid heavy deps
      if (cidr === '::1/128') return ip === '::1';
      if (cidr === 'fc00::/7') return ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd');
      if (cidr === 'fe80::/10') return ip.toLowerCase().startsWith('fe80');
      return false;
    }
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    const ipNum = toLong(ip);
    const rangeNum = toLong(range);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

/**
 * Convert IPv4 string to 32-bit number
 * @param {string} ip
 */
function toLong(ip) {
  return ip
    .split('.')
    .map((octet) => parseInt(octet, 10))
    .reduce((acc, cur) => (acc << 8) + cur, 0) >>> 0;
}

/**
 * Validate URL syntax and defend against SSRF by resolving hostname and checking for private ranges.
 * @param {string} url
 * @param {boolean} allowLocalNetwork if true, skips private IP blocking for trusted environments
 * @returns {Promise<{ok: boolean, reason?: 'invalid' | 'ssrf'}>}
 */
async function validateRecipeUrl(url, allowLocalNetwork = false) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { ok: false, reason: 'invalid' };
  }
  // literal IP?
  if (net.isIP(parsed.hostname)) {
    if (!allowLocalNetwork) {
      for (const range of PRIVATE_IP_RANGES) {
        if (ipInCidr(parsed.hostname, range.cidr)) {
          return { ok: false, reason: 'ssrf' };
        }
      }
    }
    return { ok: true };
  }

  // resolve DNS and check each address
  try {
    const addrs = await dns.lookup(parsed.hostname, { all: true });
    if (!allowLocalNetwork) {
      for (const a of addrs) {
        if (net.isIP(a.address)) {
          for (const range of PRIVATE_IP_RANGES) {
            if (ipInCidr(a.address, range.cidr)) {
              return { ok: false, reason: 'ssrf' };
            }
          }
        }
      }
    }
    return { ok: true };
  } catch (e) {
    // DNS failure
    throw new InvalidURLError(`Could not resolve hostname: ${parsed.hostname}`, { cause: e });
  }
}

module.exports = {
  validateRecipeUrl,
};
