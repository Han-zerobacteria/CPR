import { useAuthStore } from "@/stores/auth-store";
import { refreshClient } from "./refresh-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiRequestInit = RequestInit & {
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  access: string;
};

let refreshPromise: Promise<string> | null = null;

export async function apiClient<TResponse>(
  path: string,
  init: ApiRequestInit = {},
) {
  const response = await request(path, init);

  if (response.status !== 401 || init.retryOnUnauthorized === false) {
    return parseResponse<TResponse>(response);
  }

  const accessToken = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(accessToken);

  const retryResponse = await request(path, {
    ...init,
    retryOnUnauthorized: false,
  });

  return parseResponse<TResponse>(retryResponse);
}

async function request(path: string, init: ApiRequestInit) {
  const token = useAuthStore.getState().accessToken;

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function refreshAccessToken() {
  refreshPromise ??= refreshClient<RefreshResponse>("/api/auth/refresh/", {
    method: "POST",
  })
    .then((response) => response.access)
    .finally(() => {
      refreshPromise = null;
    });

  try {
    return await refreshPromise;
  } catch (error) {
    useAuthStore.getState().clearSession();
    throw error;
  }
}

async function parseResponse<TResponse>(response: Response) {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
