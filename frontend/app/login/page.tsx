"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { clearAuth, goToGoogleLogin, setToken, setUser } from "@/lib/api";
import type { ApiUser } from "@/types/api";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;
    const user: ApiUser = {
      id: "",
      name: searchParams.get("name") ?? "",
      email: searchParams.get("email") ?? "",
      avatar_url: searchParams.get("avatar") || null,
    };
    setToken(token);
    setUser(user);
    router.replace("/dashboard");
  }, [token, searchParams, router]);

  useEffect(() => {
    if (searchParams.get("error")) {
      clearAuth();
    }
  }, [searchParams]);

  const error = searchParams.get("error")
    ? "Gagal masuk. Coba lagi."
    : null;

  return <AuthTemplate onLogin={goToGoogleLogin} error={error} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<AuthTemplate onLogin={goToGoogleLogin} isLoading />}
    >
      <LoginInner />
    </Suspense>
  );
}
