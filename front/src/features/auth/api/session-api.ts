import { apiClient } from "@/lib/axios/api-client";
import { refreshClient } from "@/lib/axios/refresh-client";
import type { AuthMeResponse } from "../model/login-types";

type RefreshResponse = {
  accessToken: string;
};

export function refreshSession() {
  return refreshClient<RefreshResponse>("/api/auth/refresh/", {
    method: "POST",
  });
}

export function fetchCurrentUser() {
  return apiClient<AuthMeResponse>("/api/auth/me/");
}

export function logout() {
  return apiClient<null>("/api/auth/logout/", {
    method: "POST",
    retryOnUnauthorized: false,
  });
}
