/**
 * Isomorphic Sleep Utility that works flawlessly in both Browser (Vite) and Node.js environments.
 * This avoids bundler errors like "node:timers/promises not found" while keeping the exact logic intact.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory cache with TTL
const cache = new Map();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Rate limiting configuration
const rateLimitConfig = {
  maxRequests: 5,
  timeWindow: 1000, // 1 second
  requestQueue: [],
  processing: false
};

/**
 * Enhanced fetch utility with caching, retry logic, and rate limiting
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} [cacheOptions] - Cache configuration
 * @param {boolean} [cacheOptions.useCache=true] - Whether to use cache
 * @param {number} [cacheOptions.ttl=DEFAULT_CACHE_TTL] - Cache TTL in milliseconds
 * @param {Object} [retryOptions] - Retry configuration
 * @param {number} [retryOptions.maxRetries=3] - Maximum number of retries
 * @param {number} [retryOptions.baseDelay=1000] - Base delay for exponential backoff in milliseconds
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const fetchData = async (
  url, 
  options = {}, 
  cacheOptions = { useCache: true, ttl: DEFAULT_CACHE_TTL },
  retryOptions = { maxRetries: 3, baseDelay: 1000 }
) => {
  const useCache = cacheOptions.useCache !== false;
  const ttl = cacheOptions.ttl || DEFAULT_CACHE_TTL;
  const maxRetries = retryOptions.maxRetries !== undefined ? retryOptions.maxRetries : 3;
  const baseDelay = retryOptions.baseDelay || 1000;

  // Generate cache key from URL and relevant options
  const cacheKey = generateCacheKey(url, options);

  // Check cache if enabled
  if (useCache && cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    if (cachedItem && cachedItem.expiry > Date.now()) {
      console.log(`Cache hit for ${url}`);
      return cachedItem.data;
    } else {
      // Clean up expired cache entry
      cache.delete(cacheKey);
    }
  }

  // Wait for our turn if rate limiting is active
  await waitForRateLimit();

  // Perform the fetch with retries
  let retryCount = 0;
  let lastError;

  while (retryCount <= maxRetries) {
    try {
      const data = await performFetch(url, options);

      // Cache the successful response if caching is enabled
      if (useCache) {
        cache.set(cacheKey, {
          data,
          expiry: Date.now() + ttl
        });
      }

      return data;
    } catch (error) {
      lastError = error;

      // Don't retry for client errors (4xx) except for 429 (Too Many Requests)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        break;
      }

      // Exit if this was our last retry
      if (retryCount >= maxRetries) {
        break;
      }

      // Calculate backoff delay with jitter for retry
      const delay = calculateBackoff(retryCount, baseDelay);
      console.warn(`Retry ${retryCount + 1}/${maxRetries} for ${url} after ${delay}ms`);
      await sleep(delay);
      retryCount++;
    }
  }

  // If we got here, all retries failed
  console.error(`Failed after ${retryCount} retries:`, lastError);
  throw lastError;
};

/**
 * Perform the actual fetch operation
 * @private
 */
async function performFetch(url, options) {
  const defaultHeaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "id-id,en;q=0.9",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"136\", \"Microsoft Edge\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    mode: "cors",
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const error = new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}

/**
 * Generate a cache key from URL and relevant options
 * @private
 */
function generateCacheKey(url, options) {
  // Include relevant parts of options that would affect the response
  const relevantOptions = {
    method: options.method || 'GET',
    body: options.body,
    headers: options.headers
  };

  return `${url}::${JSON.stringify(relevantOptions)}`;
}

/**
 * Calculate backoff time with jitter for retry mechanism
 * @private
 */
function calculateBackoff(retryCount, baseDelay) {
  // Exponential backoff with jitter
  const expBackoff = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.5 * expBackoff;
  return Math.min(expBackoff + jitter, 30000); // Cap at 30 seconds
}

/**
 * Implement rate limiting using queue
 * @private
 */
async function waitForRateLimit() {
  return new Promise((resolve) => {
    rateLimitConfig.requestQueue.push(resolve);
    processRateLimitQueue();
  });
}

/**
 * Process the rate limit queue
 * @private
 */
function processRateLimitQueue() {
  if (rateLimitConfig.processing) return;

  rateLimitConfig.processing = true;

  const processQueue = async () => {
    // Count recent requests
    let recentRequests = 0;
    while (rateLimitConfig.requestQueue.length > 0 && recentRequests < rateLimitConfig.maxRequests) {
      const nextResolve = rateLimitConfig.requestQueue.shift();
      if (nextResolve) {
        nextResolve();
        recentRequests++;
      }
    }

    // If queue is not empty, schedule next processing
    if (rateLimitConfig.requestQueue.length > 0) {
      await sleep(rateLimitConfig.timeWindow);
      await processQueue();
    } else {
      rateLimitConfig.processing = false;
    }
  };

  processQueue();
}

/**
 * Clear the cache
 */
export const clearCache = () => {
  cache.clear();
  console.log('Cache cleared');
};

/**
 * Set rate limit configuration
 * @param {Object} config - Rate limit configuration
 */
export const setRateLimit = (config = {}) => {
  Object.assign(rateLimitConfig, config);
  console.log(`Rate limit updated: ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.timeWindow}ms`);
};

/**
 * Helper to handle common HTTP errors and retry specific status codes
 * @param {Error} error - The error object
 * @returns {boolean} - Whether the request should be retried
 */
export const shouldRetry = (error) => {
  // Retry on network errors or specific status codes
  if (!error.status) return true; // Network error

  const retryStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryStatusCodes.includes(error.status);
};
