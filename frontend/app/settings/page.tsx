"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SettingsTemplate } from "@/components/templates/SettingsTemplate";
import { api, clearAuth, getUser, setUser } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useToastStore } from "@/stores/toast";
import type { ApiUser } from "@/types/api";

export default function SettingsPage() {
  const router = useRouter();
  const user = getUser<ApiUser>();

  const [name, setName] = useState(user?.name ?? "");
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifInappEnabled, setNotifInappEnabled] = useState(true);

  const logoutMutation = useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      disconnectSocket();
      clearAuth();
      router.push("/login");
    },
  });

  return (
    <SettingsTemplate
      userName={user?.name || "User"}
      userAvatar={user?.avatar_url ?? undefined}
      name={name}
      email={user?.email ?? ""}
      notifEmailEnabled={notifEmailEnabled}
      notifInappEnabled={notifInappEnabled}
      onChangeName={setName}
      onToggleEmailNotif={() => setNotifEmailEnabled((v) => !v)}
      onToggleInappNotif={() => setNotifInappEnabled((v) => !v)}
      onSave={() => {
        if (user) setUser({ ...user, name });
        useToastStore.getState().push("Settings saved successfully");
      }}
      onLogout={() => logoutMutation.mutate()}
    />
  );
}
