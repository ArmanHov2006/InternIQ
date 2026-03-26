import { UserRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl md:text-5xl">Profile Builder</h1>
      <EmptyState
        icon={<UserRound className="h-5 w-5" />}
        title="Build your profile"
        description="Create your shareable profile with skills, projects, and experience. This will power your AI tools and public portfolio."
        action={<MagneticButton>Start with Basic Info</MagneticButton>}
      />
    </div>
  );
}
