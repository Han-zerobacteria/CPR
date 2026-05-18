import { apiClient } from "@/lib/axios/api-client";
import type { DuplicateCheckResponse, SignupResponse } from "../model/signup-types";

type SignupPayload = {
  login_id: string;
  password: string;
  confirm_password: string;
  nickname: string;
  profile_image: File | null;
  bio: string;
};

export function checkLoginId(loginId: string) {
  return apiClient<DuplicateCheckResponse>(
    `/api/accounts/check-login-id/?login_id=${encodeURIComponent(loginId)}`,
    { retryOnUnauthorized: false },
  );
}

export function checkNickname(nickname: string) {
  return apiClient<DuplicateCheckResponse>(
    `/api/accounts/check-nickname/?nickname=${encodeURIComponent(nickname)}`,
    { retryOnUnauthorized: false },
  );
}

export function signup(payload: SignupPayload) {
  const formData = new FormData();

  formData.append("login_id", payload.login_id);
  formData.append("password", payload.password);
  formData.append("confirm_password", payload.confirm_password);
  formData.append("nickname", payload.nickname);
  formData.append("bio", payload.bio);

  if (payload.profile_image) {
    formData.append("profile_image", payload.profile_image);
  }

  return apiClient<SignupResponse>("/api/accounts/signup/", {
    method: "POST",
    body: formData,
    retryOnUnauthorized: false,
  });
}
