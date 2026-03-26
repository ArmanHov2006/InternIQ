import { FileSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl md:text-5xl">AI Resume Analyzer</h1>
      <EmptyState
        icon={<FileSearch className="h-5 w-5" />}
        title="No resume analyzed yet"
        description="Upload your resume and paste a job URL to generate fit score, strengths, gaps, and suggestions."
        action={<MagneticButton>Upload Resume</MagneticButton>}
      />
    </div>
  );
}
