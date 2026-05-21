"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { fetchCurrentUser, refreshSession } from "../api/session-api";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) {
      return;
    }

    didBootstrap.current = true;

    async function bootstrapSession() {
      const auth = useAuthStore.getState();

      if (auth.status !== "idle") {
        return;
      }

      auth.startChecking();

      try {
        const refreshResponse = await refreshSession();
        useAuthStore.getState().setAccessToken(refreshResponse.accessToken);

        const meResponse = await fetchCurrentUser();
        useAuthStore.getState().setSession({
          accessToken: refreshResponse.accessToken,
          user: {
            id: String(meResponse.user.id),
            username: meResponse.user.login_id,
            nickname: meResponse.profile.nickname,
            profileImageUrl: meResponse.profile.profile_image_url ?? null,
          },
        });
      } catch {
        if (useAuthStore.getState().status === "checking") {
          useAuthStore.getState().clearSession();
        }
      }
    }

    void bootstrapSession();
  }, []);

  return <>{children}</>;
}
