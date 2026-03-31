import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { demoArtifactStore } from "@/lib/services/career-os-demo";
import { parseProofPackArtifact } from "@/lib/services/career-os";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params.slug?.trim();
  if (!slug) return { title: "Proof Pack | InternIQ" };

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

  const proofPack = parseProofPackArtifact(artifact);
  if (!proofPack) return { title: "Proof Pack | InternIQ" };

  return {
    title: `${proofPack.role} at ${proofPack.company} — Proof Pack | InternIQ`,
    description: proofPack.headline ?? `Recruiter-ready proof pack for ${proofPack.role} at ${proofPack.company}.`,
  };
}

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
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            InternIQ Proof Pack
          </Badge>
          <Badge variant="outline">Shared recruiter-ready snapshot</Badge>
        </div>

        <Card className="shadow-glow-sm">
          <CardContent className="space-y-4 p-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {proofPack.company}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              {proofPack.role}
            </h1>
            {proofPack.headline ? (
              <p className="max-w-2xl text-lg text-muted-foreground">{proofPack.headline}</p>
            ) : null}
            {proofPack.valueNarrative ? (
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {proofPack.valueNarrative}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidence Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(proofPack.evidenceBullets ?? []).map((bullet) => (
                  <li
                    key={bullet}
                    className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">Recruiter Note</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm leading-7 text-muted-foreground">
                {proofPack.recruiterNote}
              </pre>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Shared from InternIQ as a read-only proof-of-fit page.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
