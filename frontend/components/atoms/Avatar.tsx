import { cva, type VariantProps } from "class-variance-authority";
import { useSyncExternalStore, useState } from "react";

import { cn } from "@/lib/utils";

export const avatarVariants = cva("rounded-full bg-bg-surface border border-border text-text-secondary flex items-center justify-center overflow-hidden", {
  variants: {
    size: {
      sm: "h-8 w-8 text-helper",
      default: "h-10 w-10 text-caption",
      lg: "h-12 w-12 text-body",
    },
  },
  defaultVariants: { size: "default" },
});

export type AvatarProps = {
  src?: string;
  alt: string;
  size?: VariantProps<typeof avatarVariants>["size"];
  className?: string;
};

export function Avatar({ src, alt, size, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {/* ponytail: localStorage user tidak ada saat SSR — render kosong dulu biar server & client cocok, baru tampil setelah mount */}
      {!mounted ? null : src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{alt.toUpperCase()}</span>
      )}
    </div>
  );
}
