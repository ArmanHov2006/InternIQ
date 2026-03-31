import { notFound } from "next/navigation";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { demoArtifactStore } from "@/lib/services/career-os-demo";
import { parseProofPackArtifact } from "@/lib/services/career-os";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: { slug: string };
};

export default async function ProofPackPage({ params }: PageProps) {
  const slug = params.slug?.trim();
  if (!slug) notFound();

  let artifact =
    Array.from(demoArtifactStore.values()).find((item) => item.share_slug === slug) ?? null;

  if (!artifact) {
    const supabase = createClient();
    const { data } = await supabase
      .from("application_artifacts")
      .select("*")
      .eq("share_slug", slug)
      .eq("artifact_type", "proof_pack")
      .maybeSingle();
    artifact = data ?? null;
  }

  if (!artifact) notFound();

  const proofPack = parseProofPackArtifact(artifact);
  if (!proofPack) notFound();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b2b4b,transparent_35%),linear-gradient(180deg,#090d16,#0d1320)] px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="border-white/10 bg-white/10 text-white">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            InternIQ Proof Pack
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/80">
            Shared recruiter-ready snapshot
          </Badge>
        </div>

        <GlassCard className="border-white/10 bg-white/[0.04] p-8" tiltEnabled={false}>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">{proofPack.company}</p>
            <h1 className="text-4xl font-semibold tracking-tight">{proofPack.role}</h1>
            {proofPack.headline ? (
              <p className="max-w-2xl text-lg text-white/75">{proofPack.headline}</p>
            ) : null}
            {proofPack.valueNarrative ? (
              <p className="max-w-3xl text-sm leading-7 text-white/70">{proofPack.valueNarrative}</p>
            ) : null}
          </div>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard className="border-white/10 bg-white/[0.04] p-6" tiltEnabled={false}>
            <h2 className="text-lg font-semibold">Evidence Highlights</h2>
            <ul className="mt-4 space-y-3">
              {(proofPack.evidenceBullets ?? []).map((bullet) => (
                <li key={bullet} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                  {bullet}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="border-white/10 bg-white/[0.04] p-6" tiltEnabled={false}>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-white/70" />
              <h2 className="text-lg font-semibold">Recruiter Note</h2>
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-white/75">
              {proofPack.recruiterNote}
            </pre>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
              <ShieldCheck className="h-4 w-4" />
              Shared from InternIQ as a read-only proof-of-fit page.
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
