"use client";

import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { AppShell } from "@/components/templates/AppShell";
import { cn } from "@/lib/utils";
import { Bell, LogOut, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

function SectionHeader({ icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon icon={icon} size={16} className="text-primary" />
      </div>
      <h2 className="text-card-title font-medium text-text-primary">{title}</h2>
    </div>
  );
}

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
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-hover",
          checked ? "bg-primary" : "bg-bg-elevated"
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white transition-transform duration-hover",
            checked ? "translate-x-5" : "translate-x-0"
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
    <AppShell
      userName={userName}
      userAvatar={userAvatar}
      unreadCount={unreadCount}
      containerClassName="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="font-heading text-page-title text-text-primary">Settings</h1>
        <p className="mt-1 text-body text-text-muted">Manage your profile, preferences, and account settings.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 transition-all duration-hover hover:border-primary/30">
        <SectionHeader icon={User} title="Profile Settings" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-bg-base">
              <Avatar src={userAvatar} alt={userName} size="lg" />
            </div>
            <p className="text-helper text-text-muted">Profile picture synced from your Google account</p>
          </div>
          <div className="space-y-1">
            <label htmlFor="settings-name" className="text-caption text-text-secondary">
              Full Name
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
              Email Address
            </label>
            <Input id="settings-email" value={email} disabled readOnly />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 transition-all duration-hover hover:border-primary/30">
        <SectionHeader icon={Bell} title="Notification Preferences" />
        <div className="space-y-5">
          <Toggle
            checked={notifEmailEnabled}
            onToggle={onToggleEmailNotif}
            label="Email Notifications"
            description="Receive email summaries for completed downloads"
          />
          <Toggle
            checked={notifInappEnabled}
            onToggle={onToggleInappNotif}
            label="In-App Notifications"
            description="Show live notifications within the app interface"
          />
        </div>
      </div>

      <div className="glass-card-accent rounded-2xl p-6 transition-all duration-hover">
        <SectionHeader icon={LogOut} title="Account Actions" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={onSave} disabled={!onSave}>
            Save Changes
          </Button>
          <Button variant="danger" onClick={onLogout} disabled={!onLogout}>
            Log Out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
