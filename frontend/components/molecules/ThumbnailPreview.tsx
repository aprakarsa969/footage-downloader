import { MonoText } from "@/components/atoms/MonoText";
import { cn } from "@/lib/utils";

export type ThumbnailPreviewProps = {
  src: string;
  alt?: string;
  duration?: string;
  className?: string;
};

export function ThumbnailPreview({ src, alt = "", duration, className }: ThumbnailPreviewProps) {
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-card bg-bg-card", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {duration ? (
        <div className="absolute bottom-2 right-2 rounded-full bg-bg-base/80 px-1.5 py-0.5">
          <MonoText className="text-helper text-text-primary">{duration}</MonoText>
        </div>
      ) : null}
    </div>
  );
}
