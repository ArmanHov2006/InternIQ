import Link from "next/link";
import { GradientText } from "@/components/ui/gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";

export const CtaSection = () => {
  return (
    <section className="relative px-4 py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[20%] h-24 w-24 rounded-2xl bg-primary/20 blur-2xl animate-float" />
        <div className="absolute right-[10%] top-[35%] h-20 w-20 rounded-full bg-accent/20 blur-2xl animate-float" />
        <div className="absolute bottom-[18%] left-[40%] h-28 w-28 rounded-3xl bg-accent-cyan/20 blur-2xl animate-float" />
      </div>
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-mesh-gradient p-10 text-center">
        <GradientText as="h2" className="font-display text-5xl md:text-6xl">
          Your Career Starts Here
        </GradientText>
        <div className="mt-8 flex justify-center">
          <MagneticButton asChild size="lg" className="glow-md">
            <Link href="/signup">Get Started Free</Link>
          </MagneticButton>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Start free. No credit card required.</p>
      </div>
    </section>
  );
};
