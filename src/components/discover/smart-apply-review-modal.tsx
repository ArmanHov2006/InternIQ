"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ClipboardCopy, ExternalLink, FileText, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { blurIn } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Application, Opportunity } from "@/types/database";

interface SmartApplyReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  opportunity: Opportunity;
  draftAnswers: string | null;
}

const scoreColor = (score: number | null) => {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 px-2.5 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="mr-1 h-3 w-3 text-emerald-500" aria-hidden />
      ) : (
        <ClipboardCopy className="mr-1 h-3 w-3" aria-hidden />
      )}
      {copied ? "Copied" : (label ?? "Copy")}
    </Button>
  );
}

export function SmartApplyReviewModal({
  open,
  onOpenChange,
  application,
  opportunity,
  draftAnswers,
}: SmartApplyReviewModalProps) {
  const router = useRouter();

  const meta = application?.ai_metadata as
    | { coverLetter?: { title?: string; content?: string; tone?: string } }
    | null
    | undefined;
  const coverLetterContent = meta?.coverLetter?.content ?? null;

  const matchScore = opportunity.match_score;
  const matchedKw = opportunity.matched_keywords ?? [];
  const missingKw = opportunity.missing_keywords ?? [];
  const jobUrl = opportunity.job_url;

  const handleOpenJob = () => {
    if (jobUrl && jobUrl !== "#") {
      window.open(jobUrl, "_blank", "noopener,noreferrer");
      toast.success("Opening job page. Good luck!");
    }
    onOpenChange(false);
  };

  const handleEditInPipeline = () => {
    if (application?.id) {
      router.push(`/dashboard/pipeline?app=${application.id}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl shadow-glow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {opportunity.role}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {opportunity.company}
            {opportunity.location ? ` \u00b7 ${opportunity.location}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cover-letter" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="cover-letter" className="flex-1 gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Cover Letter
            </TabsTrigger>
            <TabsTrigger value="draft-answers" className="flex-1 gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Draft Answers
            </TabsTrigger>
            <TabsTrigger value="job-details" className="flex-1 gap-1.5 text-xs">
              <Search className="h-3.5 w-3.5" aria-hidden />
              Job Details
            </TabsTrigger>
          </TabsList>

          {/* Cover Letter Tab */}
          <TabsContent value="cover-letter">
            <motion.div
              variants={blurIn}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {coverLetterContent ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      AI-generated cover letter
                    </p>
                    <CopyButton text={coverLetterContent} label="Copy" />
                  </div>
                  <div className="max-h-[360px] overflow-y-auto rounded-lg border border-primary/20 bg-muted/30 p-4 shadow-glow-xs">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {coverLetterContent}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-center">
                  <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    No cover letter was generated for this application.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can generate one from the Pipeline view.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Draft Answers Tab */}
          <TabsContent value="draft-answers">
            <motion.div
              variants={blurIn}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {draftAnswers ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      AI-generated draft answers
                    </p>
                    <CopyButton text={draftAnswers} label="Copy All" />
                  </div>
                  <div className="max-h-[360px] overflow-y-auto rounded-lg border border-primary/20 bg-muted/30 p-4 shadow-glow-xs">
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {draftAnswers}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    No draft answers were generated for this application.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="job-details">
            <motion.div
              variants={blurIn}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {/* Match score */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Match
                  </p>
                  <span
                    className={cn(
                      "font-mono text-2xl font-semibold tabular-nums",
                      scoreColor(matchScore)
                    )}
                  >
                    {matchScore != null ? `${matchScore}%` : "--"}
                  </span>
                </div>
                {opportunity.match_summary ? (
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {opportunity.match_summary}
                  </p>
                ) : null}
              </div>

              {/* Matched keywords */}
              {matchedKw.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Matched Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedKw.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Missing keywords */}
              {missingKw.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Gaps to Address
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingKw.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="text-[11px] font-medium text-muted-foreground"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Job description excerpt */}
              {opportunity.job_description ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Job Description
                  </p>
                  <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {opportunity.job_description.length > 1500
                        ? `${opportunity.job_description.slice(0, 1500)}...`
                        : opportunity.job_description}
                    </p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {application?.id ? (
            <Button type="button" variant="secondary" onClick={handleEditInPipeline}>
              Edit in Pipeline
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={handleOpenJob}
            disabled={!jobUrl || jobUrl === "#"}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Open Job & Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
