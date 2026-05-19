const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function refreshClient<TResponse>(
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Refresh request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
