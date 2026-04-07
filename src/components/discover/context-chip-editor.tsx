"use client";

import { KeyboardEvent, useId, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const uniqueNonEmpty = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

type ContextChipListProps = {
  label: string;
  items: string[];
  emptyLabel: string;
  getItemMeta?: (item: string) => string | null;
  className?: string;
};

export const ContextChipList = ({
  label,
  items,
  emptyLabel,
  getItemMeta,
  className,
}: ContextChipListProps) => (
  <div className={cn("space-y-2", className)}>
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    {items.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const meta = getItemMeta?.(item);
          return (
            <Badge key={`${label}-${item}`} variant="secondary" className="gap-2 rounded-full px-3 py-1 text-xs">
              <span>{item}</span>
              {meta ? (
                <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {meta}
                </span>
              ) : null}
            </Badge>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    )}
  </div>
);

type EditableContextChipListProps = {
  label: string;
  items: string[];
  itemLabel: string;
  placeholder: string;
  helperText?: string;
  onChange: (values: string[]) => void;
  getItemMeta?: (item: string) => string | null;
};

export const EditableContextChipList = ({
  label,
  items,
  itemLabel,
  placeholder,
  helperText,
  onChange,
  getItemMeta,
}: EditableContextChipListProps) => {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  const addValues = (raw: string) => {
    const next = raw
      .split(/[,;\n]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    onChange(uniqueNonEmpty([...items, ...next]));
    setDraft("");
  };

  const removeValue = (value: string) => {
    onChange(items.filter((item) => item !== value));
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addValues(draft);
    }
    if ((event.key === "Backspace" || event.key === "Delete") && draft.length === 0 && items.length > 0) {
      event.preventDefault();
      onChange(items.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const meta = getItemMeta?.(item);
            return (
              <Button
                key={`${label}-${item}`}
                type="button"
                variant="outline"
                className="h-auto rounded-full px-3 py-1 text-xs"
                onClick={() => removeValue(item)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" || event.key === "Delete" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    removeValue(item);
                  }
                }}
                aria-label={`Remove ${item} ${itemLabel}`}
              >
                <span>{item}</span>
                {meta ? <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">{meta}</span> : null}
                <X className="ml-2 h-3.5 w-3.5" aria-hidden />
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {itemLabel}s added yet.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={() => addValues(draft)} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
};
