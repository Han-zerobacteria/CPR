"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils/cn";
import {
  ALLOWED_PROFILE_IMAGE_EXTENSIONS,
  validateProfileImage,
} from "../model/signup-validation";

type ProfileImageUploaderProps = {
  value: File | null;
  error?: string;
  onChange: (file: File | null, error: string) => void;
};

export function ProfileImageUploader({
  value,
  error,
  onChange,
}: ProfileImageUploaderProps) {
  const previewUrl = useMemo(() => {
    if (!value) {
      return null;
    }

    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 text-xs font-medium text-zinc-500">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="프로필 이미지 미리보기"
              className="size-full object-cover"
              src={previewUrl}
            />
          ) : (
            "기본"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-zinc-950 px-4 text-sm font-semibold text-zinc-950">
            이미지 선택
            <input
              accept={ALLOWED_PROFILE_IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(
                ",",
              )}
              className="sr-only"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onChange(file, validateProfileImage(file));
                event.target.value = "";
              }}
            />
          </label>
          {value ? (
            <button
              className="ml-2 h-10 rounded-md px-3 text-sm font-medium text-zinc-600 underline-offset-4 hover:underline"
              type="button"
              onClick={() => onChange(null, "")}
            >
              제거
            </button>
          ) : null}
          <p
            className={cn(
              "mt-2 text-xs",
              error ? "text-red-600" : "text-zinc-500",
            )}
          >
            {error || "jpg, jpeg, png, webp, avif 파일을 사용할 수 있습니다."}
          </p>
        </div>
      </div>
    </div>
  );
}
