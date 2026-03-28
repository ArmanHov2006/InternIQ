export interface TailorSuggestionPatch {
  id: string;
  section: string;
  original: string;
  suggested: string;
  rationale: string;
}

export interface AppliedResumeResult {
  mergedText: string;
  applied: TailorSuggestionPatch[];
  skipped: TailorSuggestionPatch[];
}

const normalizeForMatch = (value: string): string =>
  value
    .replace(/\r/g, "")
    .replace(/\u2192/g, "->")
    .replace(/\u2014|\u2013/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim()
    .toLowerCase();

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildLooseRegex = (original: string): RegExp => {
  const compact = original
    .replace(/\r/g, "")
    .replace(/\u2192/g, "->")
    .replace(/\u2014|\u2013/g, "-")
    .replace(/[ \t]+/g, " ")
    .trim();
  const pattern = escapeRegex(compact).replace(/\s+/g, "\\s+");
  return new RegExp(pattern, "i");
};

export const applyTailorSuggestions = (
  sourceText: string,
  suggestions: TailorSuggestionPatch[],
  selectedIds: Set<string>
): AppliedResumeResult => {
  let mergedText = sourceText;
  const applied: TailorSuggestionPatch[] = [];
  const skipped: TailorSuggestionPatch[] = [];

  for (const suggestion of suggestions) {
    if (!selectedIds.has(suggestion.id)) {
      skipped.push(suggestion);
      continue;
    }

    const original = suggestion.original.trim();
    if (!original) {
      skipped.push(suggestion);
      continue;
    }

    if (mergedText.includes(original)) {
      mergedText = mergedText.replace(original, suggestion.suggested);
      applied.push(suggestion);
      continue;
    }

    const looseRegex = buildLooseRegex(original);
    if (looseRegex.test(mergedText)) {
      mergedText = mergedText.replace(looseRegex, suggestion.suggested);
      applied.push(suggestion);
      continue;
    }

    // Only apply if semantically unchanged after normalization.
    if (normalizeForMatch(mergedText).includes(normalizeForMatch(original))) {
      skipped.push(suggestion);
      continue;
    }

    // If we cannot confidently map this patch to an existing chunk, skip it
    // instead of appending freeform text that degrades resume quality.
    skipped.push(suggestion);
  }

  return { mergedText, applied, skipped };
};
