/**
 * Utility template for making remote fetches.
 * To bypass CORS errors inside the browser, this utility detects if it's running
 * on the client-side and proxies the call through our full-stack Express backend.
 * When running server-side, it executes the fetch directly with the required IDX headers.
 */

export async function fetchData(url, referrer) {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // Client-side browser execution: route via full-stack local express server to avoid CORS
    const proxyUrl = `/api/idx-proxy?url=${encodeURIComponent(url)}&referrer=${encodeURIComponent(referrer)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy error: HTTP status ${response.status}`);
    }
    return response.json();
  } else {
    // Server-side node execution: fetch directly with authentic headers to comply with IDX anti-scraping
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };

    if (referrer) {
      headers["Referer"] = referrer;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Direct fetch failed with HTTP status ${response.status}`);
    }
    return response.json();
  }
}
