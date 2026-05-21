import { apiClient } from "@/lib/axios/api-client";
import { fetchCurrentUser } from "./session-api";
import type { LoginPayload, LoginResponse } from "../model/login-types";

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
    retryOnUnauthorized: false,
  });
}

export function fetchMe() {
  return fetchCurrentUser();
}
