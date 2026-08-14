import type { LucideIcon } from "lucide-react";
import { AtSign, Camera, Link2, Music2, SquarePlay, ThumbsUp } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { cn } from "@/lib/utils";

const platformIcons: Record<string, LucideIcon> = {
  youtube: SquarePlay,
  tiktok: Music2,
  instagram: Camera,
  ig: Camera,
  twitter: AtSign,
  x: AtSign,
  facebook: ThumbsUp,
};

export type PlatformIconProps = {
  platform: string;
  size?: number;
  className?: string;
};

export function PlatformIcon({ platform, size = 18, className }: PlatformIconProps) {
  const icon = platformIcons[platform.toLowerCase().replace(/\s+/g, "")] ?? Link2;
  return <Icon icon={icon} size={size} className={cn("text-text-secondary", className)} />;
}
