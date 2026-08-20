"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Eraser, Plus, RotateCw, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  parseTimeToSeconds,
  toBatchLink,
  useLinkValidation,
} from "@/hooks/useLinkIntake";
import type { BatchCreateLink } from "@/types/api";

const timeSchema = z
  .string()
  .regex(/^\d+:\d{2}$/, "Use format m:ss");

const linkRowSchema = z.object({
  url: z.string().min(1, "URL is required").url("Invalid URL format"),
  mode: z.enum(["full", "timestamp"]),
  trimStart: timeSchema,
  trimEnd: timeSchema,
  resolution: z.string(),
});

const linkSchema = z.object({
  links: z.array(linkRowSchema).superRefine((links, ctx) => {
    links.forEach((link, index) => {
      if (link.mode !== "timestamp") return;
      const start = parseTimeToSeconds(link.trimStart);
      const end = parseTimeToSeconds(link.trimEnd);
      if (start != null && end != null && start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End must be greater than Start",
          path: ["links", index, "trimEnd"],
        });
      }
    });
  }),
});

type LinkFormValues = z.infer<typeof linkSchema>;

export type LinkInputFormProps = {
  onSubmit?: (links: BatchCreateLink[]) => void;
};

function LinkResultPreview({ result }: { result?: import("@/hooks/useLinkIntake").LinkResult }) {
  if (!result) return null;

  if (result.status === "checking") {
    return (
      <p className="flex items-center gap-1.5 text-helper text-text-muted">
        <Spinner size="sm" className="text-text-muted" />
        Checking link...
      </p>
    );
  }

  if (result.status === "invalid") {
    return <p className="text-helper text-status-danger">{result.error}</p>;
  }

  const { meta } = result;
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-bg-surface p-2.5">
      {meta.thumbnailUrl ? (
        <ThumbnailPreview
          src={meta.thumbnailUrl}
          className="w-24 shrink-0"
          duration={meta.durationSeconds != null ? formatDuration(meta.durationSeconds) : undefined}
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-caption font-medium text-text-primary">{meta.title}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <PlatformIcon platform={meta.platform} />
          {meta.availableResolutions.length > 0 ? (
            <span className="text-helper text-text-muted">
              {meta.availableResolutions.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function LinkInputForm({ onSubmit }: LinkInputFormProps) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      links: [
        {
          url: "",
          mode: "full",
          trimStart: "0:00",
          trimEnd: "0:30",
          resolution: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  const urls = useWatch({ control, name: "links" });

  const watchedUrls = urls.map((link) => link.url.trim());
  const { results, recheck, clearResult } = useLinkValidation(watchedUrls);

  const hasInvalid = fields.some((_, index) => {
    const row = errors.links?.[index];
    return Boolean(row?.url || row?.trimStart || row?.trimEnd);
  });

  const handleSubmitLinks = (values: LinkFormValues) => {
    const batchLinks = toBatchLink(
      values.links.map((l) => ({
        url: l.url,
        mode: l.mode,
        resolution: l.resolution,
        trimStart: l.trimStart,
        trimEnd: l.trimEnd,
      })),
    );
    onSubmit?.(batchLinks);
  };

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(handleSubmitLinks)}
    >
      <div className="space-y-3">
        {fields.map((field, index) => {
          const url = urls[index]?.url.trim() ?? "";
          const mode = urls[index]?.mode ?? "full";
          const result = results[url];
          const availableResolutions =
            result?.status === "valid" ? result.meta.availableResolutions : [];
          const isChecking = result?.status === "checking";
          return (
            <div key={field.id} className="space-y-3 rounded-card border border-border bg-bg-card p-3">
              {/* URL Input + Action Buttons */}
              <div className="flex items-center gap-2">
                <Input
                  {...register(`links.${index}.url`)}
                  placeholder="Paste YouTube, TikTok, or Instagram link..."
                  aria-invalid={Boolean(errors.links?.[index]?.url)}
                  className={cn(
                    "flex-1",
                    errors.links?.[index]?.url ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20" : undefined,
                  )}
                />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => recheck(url)}
                    disabled={!url || Boolean(isChecking)}
                    aria-label="Re-check link"
                    title="Re-check link"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded text-text-secondary transition-colors duration-hover hover:text-primary disabled:opacity-50"
                  >
                    <Icon
                      icon={RotateCw}
                      size={16}
                      className={isChecking ? "animate-spin text-primary" : undefined}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(`links.${index}.url`, "");
                      clearResult(url);
                    }}
                    disabled={!url}
                    aria-label="Clear URL"
                    title="Clear URL"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded text-text-secondary transition-colors duration-hover hover:text-primary disabled:opacity-50"
                  >
                    <Icon icon={Eraser} size={16} />
                  </button>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove link"
                    title="Remove link"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded text-status-danger transition-colors duration-hover hover:bg-status-danger/10"
                  >
                    <Icon icon={Trash2} size={16} />
                  </button>
                </div>
              </div>

              {/* Mode Download: Segmented Control */}
              <div>
                <label className="mb-1.5 block text-helper text-text-muted">
                  Mode download
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setValue(`links.${index}.mode`, "full")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-[7px] text-[13px] font-medium transition-colors duration-hover",
                      mode === "full"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary",
                    )}
                  >
                    Full video
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue(`links.${index}.mode`, "timestamp")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-[7px] text-[13px] font-medium transition-colors duration-hover",
                      mode === "timestamp"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary",
                    )}
                  >
                    Trim timestamp
                  </button>
                </div>
              </div>

              {/* Timestamp Inputs */}
              {mode === "timestamp" ? (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="Start (m:ss)"
                    placeholder="0:00"
                    className="w-24"
                    aria-invalid={Boolean(errors.links?.[index]?.trimStart)}
                    {...register(`links.${index}.trimStart`)}
                  />
                  <span className="text-text-muted">–</span>
                  <Input
                    aria-label="End (m:ss)"
                    placeholder="1:30"
                    className="w-24"
                    aria-invalid={Boolean(errors.links?.[index]?.trimEnd)}
                    {...register(`links.${index}.trimEnd`)}
                  />
                </div>
              ) : null}

              {/* Resolution */}
              {availableResolutions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {mode === "timestamp" ? null : (
                    <span className="text-helper text-text-muted">Resolution</span>
                  )}
                  {availableResolutions.map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setValue(`links.${index}.resolution`, String(res))}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-caption transition-colors duration-hover",
                        (urls[index]?.resolution ?? "") === String(res)
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-text-secondary hover:text-text-primary",
                      )}
                    >
                      {res}p
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Validation Errors */}
              {errors.links?.[index]?.trimStart?.message ? (
                <p className="text-helper text-status-danger">
                  {errors.links[index].trimStart.message}
                </p>
              ) : null}
              {errors.links?.[index]?.trimEnd?.message ? (
                <p className="text-helper text-status-danger">
                  {errors.links[index].trimEnd.message}
                </p>
              ) : null}

              {/* Link Result Preview */}
              {url ? <LinkResultPreview result={results[url]} /> : null}
            </div>
          );
        })}
      </div>

      {/* Global URL Error */}
      {errors.links?.[0]?.url ? (
        <p className="text-helper text-status-danger">{errors.links[0].url.message}</p>
      ) : null}

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              url: "",
              mode: "full",
              trimStart: "0:00",
              trimEnd: "0:30",
              resolution: "",
            })
          }
          icon={Plus}
          className="flex-1 justify-center"
        >
          Add Another Link
        </Button>
        <Button
          type="submit"
          disabled={fields.length === 0 || hasInvalid}
          icon={Download}
          className="flex-1 justify-center"
        >
          Download
        </Button>
      </div>
    </form>
  );
}
