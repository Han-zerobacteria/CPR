import { useAuthStore } from "@/stores/auth-store";
import { refreshClient } from "./refresh-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ApiRequestInit = RequestInit & {
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  accessToken: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

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
  const isFormData = init.body instanceof FormData;

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

async function refreshAccessToken() {
  refreshPromise ??= refreshClient<RefreshResponse>("/api/auth/refresh/", {
    method: "POST",
  })
    .then((response) => response.accessToken)
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
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as TResponse;
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
