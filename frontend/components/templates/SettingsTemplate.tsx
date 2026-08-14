"use client";

import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Navbar } from "@/components/organisms/Navbar";
import { Sidebar } from "@/components/organisms/Sidebar";
import { cn } from "@/lib/utils";

export type SettingsTemplateProps = {
  userName: string;
  userAvatar?: string;
  unreadCount?: number;
  name: string;
  email: string;
  notifEmailEnabled: boolean;
  notifInappEnabled: boolean;
  onChangeName?: (name: string) => void;
  onToggleEmailNotif?: () => void;
  onToggleInappNotif?: () => void;
  onSave?: () => void;
  onLogout?: () => void;
};

function Toggle({
  checked,
  onToggle,
  label,
  description,
}: {
  checked: boolean;
  onToggle?: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body text-text-primary">{label}</p>
        <p className="text-helper text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={!onToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-hover",
          checked ? "bg-primary" : "bg-bg-elevated"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-hover",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function SettingsTemplate({
  userName,
  userAvatar,
  unreadCount,
  name,
  email,
  notifEmailEnabled,
  notifInappEnabled,
  onChangeName,
  onToggleEmailNotif,
  onToggleInappNotif,
  onSave,
  onLogout,
}: SettingsTemplateProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar userName={userName} userAvatar={userAvatar} unreadCount={unreadCount} />
        <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-4">
          <h1 className="font-heading text-page-title text-text-primary">Pengaturan</h1>

          <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
            <h2 className="mb-4 text-caption font-medium text-text-primary">Profil</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={userAvatar} alt={userName} size="lg" />
                <p className="text-caption text-text-muted">Foto profil diambil dari akun Google</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="settings-name" className="text-caption text-text-secondary">
                  Nama
                </label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(event) => onChangeName?.(event.target.value)}
                  disabled={!onChangeName}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="settings-email" className="text-caption text-text-secondary">
                  Email
                </label>
                <Input id="settings-email" value={email} disabled readOnly />
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-bg-card p-6 shadow-card">
            <h2 className="mb-4 text-caption font-medium text-text-primary">Notifikasi</h2>
            <div className="space-y-5">
              <Toggle
                checked={notifEmailEnabled}
                onToggle={onToggleEmailNotif}
                label="Notifikasi email"
                description="Dapatkan ringkasan via email"
              />
              <Toggle
                checked={notifInappEnabled}
                onToggle={onToggleInappNotif}
                label="Notifikasi in-app"
                description="Pemberitahuan di dalam aplikasi"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={!onSave}>
              Simpan
            </Button>
            <Button variant="danger" onClick={onLogout} disabled={!onLogout}>
              Logout
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
