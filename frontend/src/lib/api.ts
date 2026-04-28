const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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