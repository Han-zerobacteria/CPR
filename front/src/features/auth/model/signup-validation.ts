import type { SignupField } from "./signup-types";

export const LOGIN_ID_PATTERN = /^[a-z][a-z0-9_]{3,19}$/;
export const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_.]{2,20}$/;
export const BIO_MAX_LENGTH = 30;
export const ALLOWED_PROFILE_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
] as const;

export type FieldErrors = Partial<Record<SignupField, string>>;

export function validateLoginId(value: string) {
  if (!value.trim()) {
    return "아이디를 입력해주세요.";
  }

  if (value.length < 4) {
    return "아이디는 최소 4자 이상이어야 합니다.";
  }

  if (!LOGIN_ID_PATTERN.test(value)) {
    return "아이디는 소문자로 시작하고 소문자, 숫자, 밑줄만 사용할 수 있습니다.";
  }

  return "";
}

export function validatePassword(value: string) {
  if (!value) {
    return "비밀번호를 입력해주세요.";
  }

  if (value.length < 8) {
    return "비밀번호는 최소 8자 이상이어야 합니다.";
  }

  return "";
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return "비밀번호 확인을 입력해주세요.";
  }

  if (password !== confirmPassword) {
    return "비밀번호가 일치하지 않습니다.";
  }

  return "";
}

export function validateNickname(value: string) {
  if (!value.trim()) {
    return "닉네임을 입력해주세요.";
  }

  if (value.trim() !== value) {
    return "닉네임 앞뒤에는 공백을 사용할 수 없습니다.";
  }

  if (value.length < 2) {
    return "닉네임은 최소 2자 이상이어야 합니다.";
  }

  if (!NICKNAME_PATTERN.test(value)) {
    return "닉네임은 한글, 영문, 숫자, 밑줄, 마침표만 사용할 수 있습니다.";
  }

  return "";
}

export function validateBio(value: string) {
  if (value.length > BIO_MAX_LENGTH) {
    return `자기소개는 최대 ${BIO_MAX_LENGTH}자까지 입력할 수 있습니다.`;
  }

  return "";
}

export function validateProfileImage(file: File | null) {
  if (!file) {
    return "";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (
    !extension ||
    !ALLOWED_PROFILE_IMAGE_EXTENSIONS.includes(
      extension as (typeof ALLOWED_PROFILE_IMAGE_EXTENSIONS)[number],
    )
  ) {
    return "지원하지 않는 이미지 형식입니다.";
  }

  return "";
}

export function getFirstErrorMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(getFirstErrorMessage).find(Boolean) ?? "";
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(getFirstErrorMessage).find(Boolean) ?? "";
  }

  return "";
}
