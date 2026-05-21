import type { LoginField } from "./login-types";

export type LoginFieldErrors = Partial<Record<LoginField, string>>;

export function validateLoginId(value: string) {
  if (!value.trim()) {
    return "아이디를 입력해주세요.";
  }

  return "";
}

export function validatePassword(value: string) {
  if (!value) {
    return "비밀번호를 입력해주세요.";
  }

  return "";
}
