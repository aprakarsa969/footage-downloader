"use client";

import { useState } from "react";

import { SettingsTemplate } from "@/components/templates/SettingsTemplate";
import { useToastStore } from "@/stores/toast";
import { useSession, useSessionStore } from "@/stores/session";

export default function SettingsPage() {
  const { user, token } = useSession();

  const [name, setName] = useState(user?.name ?? "");
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [notifInappEnabled, setNotifInappEnabled] = useState(true);

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
        if (user && token) {
          useSessionStore.getState().setSession(token, { ...user, name });
        }
        useToastStore.getState().push("Settings saved successfully");
      }}
    />
  );
}
