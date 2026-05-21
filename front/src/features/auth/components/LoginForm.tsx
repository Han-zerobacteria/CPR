"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ApiError } from "@/lib/axios/api-client";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import { fetchMe, login } from "../api/login-api";
import type { LoginField } from "../model/login-types";
import {
  type LoginFieldErrors,
  validateLoginId,
  validatePassword,
} from "../model/login-validation";

const LOGIN_FAILED_MESSAGE =
  "아이디 및 비밀번호가 잘못 되었습니다.\n아이디와 비밀번호를 정확히 입력해주세요";

const PROFILE_LOAD_FAILED_MESSAGE =
  "로그인 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

type LoginValues = {
  login_id: string;
  password: string;
};

const initialValues: LoginValues = {
  login_id: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>(
    {},
  );
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(
    () => ({
      login_id: validateLoginId(values.login_id),
      password: validatePassword(values.password),
    }),
    [values],
  );

  const canSubmit =
    !isSubmitting &&
    Object.values(validationErrors).every((message) => !message);

  function updateValue(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateTouched(field: LoginField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ login_id: true, password: true });

    const nextErrors = Object.fromEntries(
      Object.entries(validationErrors).filter(([, message]) => message),
    ) as LoginFieldErrors;

    if (!canSubmit || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const loginResponse = await login(values);
      setAccessToken(loginResponse.accessToken);

      const meResponse = await fetchMe();
      setSession({
        accessToken: loginResponse.accessToken,
        user: {
          id: String(meResponse.user.id),
          username: meResponse.user.login_id,
          nickname: meResponse.profile.nickname,
          profileImageUrl: meResponse.profile.profile_image_url ?? null,
        },
      });
      router.replace("/");
    } catch (error) {
      clearSession();
      setSubmitError(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-8">
      <section className="rounded-md border border-brand-border bg-brand-surface p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-brand-muted">
            CPR 계정으로 계속하기
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-brand-primary">
            로그인
          </h1>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Field
            autoComplete="username"
            error={getDisplayError("login_id")}
            label="아이디"
            name="login_id"
            required
            value={values.login_id}
            onBlur={() => updateTouched("login_id")}
            onChange={(value) => updateValue("login_id", value)}
          />

          <Field
            autoComplete="current-password"
            error={getDisplayError("password")}
            label="비밀번호"
            name="password"
            required
            type="password"
            value={values.password}
            onBlur={() => updateTouched("password")}
            onChange={(value) => updateValue("password", value)}
          />

          {submitError ? (
            <p className="whitespace-pre-line rounded-md border border-brand-danger-border bg-brand-danger-surface px-3 py-2 text-sm font-medium text-brand-danger">
              {submitError}
            </p>
          ) : null}

          <button
            className="h-11 w-full rounded-md bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-brand-muted">
          아직 계정이 없나요?{" "}
          <Link
            className="font-semibold text-brand-primary underline"
            href="/signup"
          >
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );

  function getDisplayError(field: LoginField) {
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
  error?: string;
  label: string;
  name: LoginField;
  required: boolean;
  type?: "text" | "password";
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  const errorId = `${name}-error`;

  return (
    <label className="block">
      <span className="text-sm font-medium text-brand-primary">
        {label}
        {required ? <span className="text-brand-danger"> *</span> : null}
      </span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          "mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-brand-primary outline-none transition placeholder:text-zinc-400 focus:border-brand-primary focus:ring-2 focus:ring-zinc-950/10",
          error ? "border-brand-danger" : "border-brand-border",
        )}
        name={name}
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={errorId} className="mt-1 min-h-4 text-xs text-brand-danger">
        {error}
      </p>
    </label>
  );
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return PROFILE_LOAD_FAILED_MESSAGE;
  }

  return LOGIN_FAILED_MESSAGE;
}
