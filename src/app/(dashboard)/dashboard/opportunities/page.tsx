import { OpportunityInbox } from "@/components/opportunities/opportunity-inbox";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Opportunities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture jobs, rank fit, and send the best roles into your pipeline.
        </p>
      </div>

      <OpportunityInbox />
    </div>
  );
}
