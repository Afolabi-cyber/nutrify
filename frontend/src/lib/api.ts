// When served from Flask (production/unified mode), use relative URLs.
// When running Vite dev server separately, fall back to localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res.json();
}

export { BASE_URL };
