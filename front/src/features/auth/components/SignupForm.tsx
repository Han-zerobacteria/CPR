"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { ApiError } from "@/lib/axios/api-client";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import { checkLoginId, checkNickname, signup } from "../api/signup-api";
import type { SignupField } from "../model/signup-types";
import {
  BIO_MAX_LENGTH,
  type FieldErrors,
  getFirstErrorMessage,
  validateBio,
  validateConfirmPassword,
  validateLoginId,
  validateNickname,
  validatePassword,
  validateProfileImage,
} from "../model/signup-validation";
import { ProfileImageUploader } from "./ProfileImageUploader";

type FormValues = {
  login_id: string;
  password: string;
  confirm_password: string;
  nickname: string;
  profile_image: File | null;
  bio: string;
};

type DuplicateStatus = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  checkedValue: string;
};

const initialValues: FormValues = {
  login_id: "",
  password: "",
  confirm_password: "",
  nickname: "",
  profile_image: null,
  bio: "",
};

const initialDuplicateStatus: DuplicateStatus = {
  status: "idle",
  message: "",
  checkedValue: "",
};

export function SignupForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [values, setValues] = useState<FormValues>(initialValues);
  const latestValuesRef = useRef<FormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loginIdCheck, setLoginIdCheck] = useState<DuplicateStatus>(
    initialDuplicateStatus,
  );
  const [nicknameCheck, setNicknameCheck] = useState<DuplicateStatus>(
    initialDuplicateStatus,
  );
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(
    () => ({
      login_id: validateLoginId(values.login_id),
      password: validatePassword(values.password),
      confirm_password: validateConfirmPassword(
        values.password,
        values.confirm_password,
      ),
      nickname: validateNickname(values.nickname),
      profile_image: validateProfileImage(values.profile_image),
      bio: validateBio(values.bio),
    }),
    [values],
  );

  const canSubmit =
    !isSubmitting &&
    loginIdCheck.status === "success" &&
    loginIdCheck.checkedValue === values.login_id &&
    nicknameCheck.status === "success" &&
    nicknameCheck.checkedValue === values.nickname &&
    Object.values(validationErrors).every((message) => !message);

  function updateValue<TField extends SignupField>(
    field: TField,
    value: FormValues[TField],
  ) {
    const nextValues = { ...latestValuesRef.current, [field]: value };
    latestValuesRef.current = nextValues;
    setValues(nextValues);
    setSubmitError("");
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "password" ? { confirm_password: undefined } : {}),
    }));

    if (field === "login_id") {
      setLoginIdCheck(initialDuplicateStatus);
    }

    if (field === "nickname") {
      setNicknameCheck(initialDuplicateStatus);
    }
  }

  function updateTouched(field: SignupField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleLoginIdBlur() {
    updateTouched("login_id");
    const loginId = latestValuesRef.current.login_id;
    const error = validateLoginId(loginId);

    if (error) {
      return;
    }

    if (loginIdCheck.status === "loading") {
      return;
    }

    setLoginIdCheck({
      status: "loading",
      message: "아이디를 확인하고 있습니다.",
      checkedValue: loginId,
    });

    try {
      const response = await checkLoginId(loginId);
      if (latestValuesRef.current.login_id !== loginId) {
        return;
      }

      setLoginIdCheck({
        status: response.available ? "success" : "error",
        message: response.available
          ? "사용 가능한 아이디입니다."
          : "이미 사용 중인 아이디입니다.",
        checkedValue: loginId,
      });
    } catch (error) {
      if (latestValuesRef.current.login_id !== loginId) {
        return;
      }

      setLoginIdCheck({
        status: "error",
        message: getApiErrorMessage(error, "아이디 확인 중 문제가 발생했습니다."),
        checkedValue: loginId,
      });
    }
  }

  async function handleNicknameBlur() {
    updateTouched("nickname");
    const nickname = latestValuesRef.current.nickname;
    const error = validateNickname(nickname);

    if (error) {
      return;
    }

    if (nicknameCheck.status === "loading") {
      return;
    }

    setNicknameCheck({
      status: "loading",
      message: "닉네임을 확인하고 있습니다.",
      checkedValue: nickname,
    });

    try {
      const response = await checkNickname(nickname);
      if (latestValuesRef.current.nickname !== nickname) {
        return;
      }

      setNicknameCheck({
        status: response.available ? "success" : "error",
        message: response.available
          ? "사용 가능한 닉네임입니다."
          : "이미 사용 중인 닉네임입니다.",
        checkedValue: nickname,
      });
    } catch (error) {
      if (latestValuesRef.current.nickname !== nickname) {
        return;
      }

      setNicknameCheck({
        status: "error",
        message: getApiErrorMessage(error, "닉네임 확인 중 문제가 발생했습니다."),
        checkedValue: nickname,
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      login_id: true,
      password: true,
      confirm_password: true,
      nickname: true,
      profile_image: true,
      bio: true,
    });

    const nextErrors = Object.fromEntries(
      Object.entries(validationErrors).filter(([, message]) => message),
    ) as FieldErrors;

    if (!canSubmit || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await signup(values);
      setSession({
        accessToken: response.accessToken,
        user: {
          id: String(response.user.id),
          username: response.user.login_id,
          nickname: response.profile.nickname,
          profileImageUrl: response.profile.profile_image_url ?? null,
        },
      });
      router.replace("/");
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      setSubmitError(
        Object.keys(fieldErrors).length > 0
          ? "입력값을 다시 확인해주세요."
          : getApiErrorMessage(error, "회원가입 중 문제가 발생했습니다."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-zinc-500">CPR 계정 만들기</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">회원가입</h1>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Field
            autoComplete="username"
            check={loginIdCheck}
            error={getDisplayError("login_id")}
            label="아이디"
            name="login_id"
            required
            value={values.login_id}
            onBlur={handleLoginIdBlur}
            onChange={(value) => updateValue("login_id", value)}
          />

          <Field
            autoComplete="new-password"
            error={getDisplayError("password")}
            label="비밀번호"
            name="password"
            required
            type="password"
            value={values.password}
            onBlur={() => updateTouched("password")}
            onChange={(value) => updateValue("password", value)}
          />

          <Field
            autoComplete="new-password"
            error={getDisplayError("confirm_password")}
            label="비밀번호 확인"
            name="confirm_password"
            required
            type="password"
            value={values.confirm_password}
            onBlur={() => updateTouched("confirm_password")}
            onChange={(value) => updateValue("confirm_password", value)}
          />

          <Field
            autoComplete="nickname"
            check={nicknameCheck}
            error={getDisplayError("nickname")}
            label="닉네임"
            name="nickname"
            required
            value={values.nickname}
            onBlur={handleNicknameBlur}
            onChange={(value) => updateValue("nickname", value)}
          />

          <div>
            <Label required={false}>프로필 이미지</Label>
            <div className="mt-2">
              <ProfileImageUploader
                error={getDisplayError("profile_image")}
                value={values.profile_image}
                onChange={(file, error) => {
                  updateTouched("profile_image");
                  updateValue("profile_image", file);
                  setErrors((current) => ({
                    ...current,
                    profile_image: error || undefined,
                  }));
                }}
              />
            </div>
          </div>

          <label className="block">
            <Label required={false}>자기소개</Label>
            <textarea
              className={cn(
                "mt-2 min-h-24 w-full resize-none rounded-md border px-3 py-3 text-sm outline-none transition focus:border-zinc-950",
                getDisplayError("bio") ? "border-red-500" : "border-zinc-300",
              )}
              maxLength={BIO_MAX_LENGTH}
              name="bio"
              value={values.bio}
              onBlur={() => updateTouched("bio")}
              onChange={(event) => updateValue("bio", event.target.value)}
            />
            <div className="mt-1 flex items-start justify-between gap-3 text-xs">
              <p className="min-h-4 text-red-600">{getDisplayError("bio")}</p>
              <p className="shrink-0 text-zinc-500">
                {values.bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
          </label>

          {submitError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {submitError}
            </p>
          ) : null}

          <button
            className="h-11 w-full rounded-md bg-zinc-950 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-600">
          이미 계정이 있나요?{" "}
          <Link className="font-semibold text-zinc-950 underline" href="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );

  function getDisplayError(field: SignupField) {
    if (errors[field]) {
      return errors[field];
    }

    if (!touched[field]) {
      return "";
    }

    return validationErrors[field];
  }
}

function Field({
  autoComplete,
  check,
  error,
  label,
  name,
  required,
  type = "text",
  value,
  onBlur,
  onChange,
}: {
  autoComplete: string;
  check?: DuplicateStatus;
  error?: string;
  label: string;
  name: string;
  required: boolean;
  type?: "text" | "password";
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const message = error || check?.message || "";
  const messageClassName = error
    ? "text-red-600"
    : check?.status === "success"
      ? "text-green-600"
      : check?.status === "error"
        ? "text-red-600"
        : "text-zinc-500";

  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      <input
        autoComplete={autoComplete}
        className={cn(
          "mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none transition focus:border-zinc-950",
          getInputBorderClassName(error, check),
        )}
        name={name}
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className={cn("mt-1 min-h-4 text-xs", messageClassName)}>{message}</p>
    </label>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required: boolean;
}) {
  return (
    <span className="text-sm font-medium text-zinc-700">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  );
}

function getInputBorderClassName(error?: string, check?: DuplicateStatus) {
  if (check?.status === "loading") {
    return "border-zinc-300";
  }

  if (error || check?.status === "error") {
    return "border-red-500";
  }

  if (check?.status === "success") {
    return "border-green-500";
  }

  return "border-zinc-300";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return getFirstErrorMessage(error.data) || fallback;
  }

  return fallback;
}

function getFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return {};
  }

  const data = error.data as Partial<Record<SignupField | "detail", unknown>>;
  const nextErrors: FieldErrors = {};

  for (const field of [
    "login_id",
    "password",
    "confirm_password",
    "nickname",
    "profile_image",
    "bio",
  ] satisfies SignupField[]) {
    const message = getFirstErrorMessage(data[field]);
    if (message) {
      nextErrors[field] = message;
    }
  }

  return nextErrors;
}
