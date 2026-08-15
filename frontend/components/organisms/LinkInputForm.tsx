"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { PlatformIcon } from "@/components/molecules/PlatformIcon";
import { ThumbnailPreview } from "@/components/molecules/ThumbnailPreview";
import { api } from "@/lib/api";
import type {
  ApiValidateResult,
  ApiValidateSuccess,
  BatchCreateLink,
} from "@/types/api";

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

type LinkResult =
  | { status: "checking" }
  | { status: "invalid"; error: string }
  | { status: "valid"; meta: ApiValidateSuccess };

function parseTimeToSeconds(value: string): number | null {
  const match = /^(\d+):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

const selectClassName =
  "h-12 rounded-input border border-border bg-bg-surface px-3 text-body text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function LinkResultPreview({ result }: { result?: LinkResult }) {
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

async function validateUrl(url: string): Promise<LinkResult> {
  try {
    const [result] = await api<ApiValidateResult[]>("/links/validate", {
      method: "POST",
      body: { urls: [url] },
    });
    return "error" in result
      ? { status: "invalid", error: result.error.message }
      : { status: "valid", meta: result };
  } catch {
    return { status: "invalid", error: "Failed to check link" };
  }
}

export function LinkInputForm({ onSubmit }: LinkInputFormProps) {
  const {
    register,
    control,
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
  const [results, setResults] = useState<Record<string, LinkResult>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const current = urls.map((link) => link.url.trim());

    Object.entries(timers.current).forEach(([url, timer]) => {
      if (!current.includes(url)) {
        clearTimeout(timer);
        delete timers.current[url];
      }
    });

    for (const url of current) {
      if (!url || timers.current[url]) continue;
      const existing = results[url];
      if (existing && existing.status !== "checking") continue;

      timers.current[url] = setTimeout(() => {
        void (async () => {
          setResults((prev) => ({ ...prev, [url]: { status: "checking" } }));
          const result = await validateUrl(url);
          setResults((prev) => ({ ...prev, [url]: result }));
          delete timers.current[url];
        })();
      }, 600);
    }
  }, [urls, results]);

  const handleRecheck = async (url: string) => {
    if (!url) return;
    setResults((prev) => ({ ...prev, [url]: { status: "checking" } }));
    const result = await validateUrl(url);
    setResults((prev) => ({ ...prev, [url]: result }));
  };

  const hasInvalid = fields.some((_, index) => {
    const row = errors.links?.[index];
    return Boolean(row?.url || row?.trimStart || row?.trimEnd);
  });

  const toBatchLink = (values: LinkFormValues): BatchCreateLink[] =>
    values.links.map((link) => {
      const base: BatchCreateLink = {
        url: link.url.trim(),
        mode: link.mode,
        resolution: link.resolution || undefined,
      };
      if (link.mode === "timestamp") {
        base.trim_start_seconds = parseTimeToSeconds(link.trimStart) ?? 0;
        base.trim_end_seconds = parseTimeToSeconds(link.trimEnd) ?? 0;
      }
      return base;
    });

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit((values) => onSubmit?.(toBatchLink(values)))}
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
            <div key={field.id} className="space-y-1.5 rounded-card border border-border bg-bg-card p-3">
              <div className="flex items-start gap-2">
                <Input
                  {...register(`links.${index}.url`)}
                  placeholder="https://youtube.com/watch?v=..."
                  aria-invalid={Boolean(errors.links?.[index]?.url)}
                  className={errors.links?.[index]?.url ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20" : undefined}
                />
                <button
                  type="button"
                  onClick={() => handleRecheck(url)}
                  disabled={!url || Boolean(isChecking)}
                  aria-label="Re-check link"
                  title="Re-check link"
                  className="rounded-button p-3 text-text-muted transition-colors duration-hover hover:text-primary disabled:opacity-50"
                >
                  <Icon
                    icon={RotateCw}
                    size={18}
                    className={isChecking ? "animate-spin text-primary" : undefined}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove link"
                  className="rounded-button p-3 text-text-muted transition-colors duration-hover hover:text-status-danger"
                >
                  <Icon icon={X} size={18} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Mode download"
                  className={selectClassName}
                  {...register(`links.${index}.mode`)}
                >
                  <option value="full">Full</option>
                  <option value="timestamp">Timestamp</option>
                </select>

                {mode === "timestamp" ? (
                  <>
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
                  </>
                ) : null}

                {availableResolutions.length > 0 ? (
                  <select
                    aria-label="Resolution"
                    className={selectClassName}
                    {...register(`links.${index}.resolution`)}
                  >
                    <option value="">Auto</option>
                    {availableResolutions.map((res) => (
                      <option key={res} value={String(res)}>
                        {res}p
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

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

              {url ? <LinkResultPreview result={results[url]} /> : null}
            </div>
          );
        })}
      </div>
      {errors.links?.[0]?.url ? (
        <p className="text-helper text-status-danger">{errors.links[0].url.message}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
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
        >
          Add Another Link
        </Button>
        <Button type="submit" disabled={fields.length === 0 || hasInvalid}>
          Download All
        </Button>
      </div>
    </form>
  );
}
