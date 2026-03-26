import { MailOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function EmailPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl md:text-5xl">Cold Email Generator</h1>
      <EmptyState
        icon={<MailOpen className="h-5 w-5" />}
        title="No emails generated yet"
        description="Select a target role and generate personalized outreach email drafts from your resume context."
        action={<MagneticButton>Generate First Email</MagneticButton>}
      />
    </div>
  );
}
