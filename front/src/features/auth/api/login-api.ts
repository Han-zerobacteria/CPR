import { apiClient } from "@/lib/axios/api-client";
import type { AuthMeResponse, LoginPayload, LoginResponse } from "../model/login-types";

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
    retryOnUnauthorized: false,
  });
}

export function fetchMe() {
  return apiClient<AuthMeResponse>("/api/auth/me/");
}
