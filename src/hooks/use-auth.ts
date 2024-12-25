import { logEvent } from "@/lib/amplitude";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useCallback } from "react";

export function useAuth() {
  const { login, logout, authenticated, user, getAccessToken } = usePrivy();

  const updateUser = useCallback(async () => {
    if (!authenticated) return;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
    };

    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user?.id,
        }),
      }
    );
    if (userResponse.ok) {
      logEvent("user_signed_in", {
        teamId: process.env.NEXT_PUBLIC_TEAM_ID || "",
      });
    }
  }, [authenticated, getAccessToken, user?.id]);

  const memoizedSignIn = useCallback(async () => {
    if (!authenticated) return;
    login();
    await updateUser();
  }, [authenticated, login, updateUser]);

  useEffect(() => {
    memoizedSignIn();
  }, [memoizedSignIn]);

  return {
    login,
    logout,
    isAuthenticated: authenticated,
    user,
    getAccessToken,
  };
}
