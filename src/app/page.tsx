import Link from "next/link";
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Kanban,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { TextReveal } from "@/components/motion/text-reveal";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { TiltCard } from "@/components/motion/tilt-card";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { HeroCinematic } from "@/components/landing/hero-cinematic";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { FAQAccordion } from "@/components/landing/faq-accordion";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
];

const trustSchools = ["Stanford", "MIT", "Harvard", "Berkeley", "Columbia"];

const howItWorksSteps = [
  {
    number: 1,
    title: "Track Applications",
    description: "Capture opportunities in one clean pipeline with drag-and-drop statuses.",
    icon: Kanban,
  },
  {
    number: 2,
    title: "Build Your Profile",
    description: "Turn your experience into a recruiter-ready public profile in minutes.",
    icon: UserCircle2,
  },
  {
    number: 3,
    title: "Execute With AI",
    description: "Prioritize roles, improve positioning, and generate tailored outreach fast.",
    icon: Brain,
  },
];

const featureRows = [
  {
    title: "Your Job Search Command Center",
    description:
      "Visualize your whole search in a modern board that updates instantly as your pipeline evolves.",
    bullets: ["Track every opportunity", "Drag and drop statuses", "Keep momentum daily"],
    variant: "tracker" as const,
  },
  {
    title: "Your Professional Identity, Online",
    description:
      "Share one polished profile link that highlights your projects, impact, and strengths to recruiters.",
    bullets: ["Recruiter-ready design", "SEO-friendly profile pages", "Built-in social proof"],
    variant: "profile" as const,
  },
  {
    title: "AI That Helps You Move Faster",
    description:
      "Generate outreach drafts, evaluate fit, and focus time on high-probability opportunities.",
    bullets: ["Role-fit scoring", "Personalized email drafts", "Actionable improvement tips"],
    variant: "ai" as const,
  },
];

const secondaryFeatures = [
  { title: "Drag & Drop Pipeline", description: "Move opportunities between stages with visual state management.", icon: Kanban },
  { title: "Dark Mode", description: "A visual system tuned for both bright and low-light workflows.", icon: Sparkles },
  { title: "Resume Upload", description: "Import your resume and transform it into structured profile content.", icon: BriefcaseBusiness },
  { title: "Fit Scoring", description: "Instantly understand role alignment with AI scoring and insights.", icon: Brain },
  { title: "SEO Public Profile", description: "A profile page recruiters can discover and share quickly.", icon: UserCircle2 },
  { title: "Secure by Default", description: "Row-level security protects private data by default.", icon: ShieldCheck },
];

const stats = [
  { value: 10000, suffix: "+", label: "Applications Tracked" },
  { value: 2500, suffix: "+", label: "Portfolios Created" },
  { value: 85, suffix: "%", label: "Interview Rate Increase" },
  { value: 500, suffix: "+", label: "Universities" },
];

const testimonials = [
  {
    quote:
      "InternIQ transformed my search. I stopped juggling tabs and finally had one system that made sense.",
    author: "Sarah K., Stanford",
  },
  {
    quote:
      "The AI drafts saved me hours. I got more responses in one week than I did in a full month before.",
    author: "James T., MIT",
  },
  {
    quote:
      "The profile page is insanely useful. Recruiters understand my work instantly and outreach feels easier.",
    author: "Priya M., Columbia",
  },
];

const faqs = [
  {
    question: "Is InternIQ free to use?",
    answer:
      "Yes. InternIQ is free for students, with a premium-quality experience designed to help you stay organized and stand out.",
  },
  {
    question: "How does AI email generation work?",
    answer:
      "InternIQ uses your profile and target role context to generate relevant outreach drafts you can quickly personalize and send.",
  },
  {
    question: "Can recruiters view my profile?",
    answer:
      "Only your public profile page is shareable. Your private application data stays protected in your account.",
  },
  {
    question: "What resume file types are supported?",
    answer:
      "PDF upload is supported. Parsed content is transformed into structured profile data and used by AI features.",
  },
];

const socialLinks = [
  { href: "#", label: "Twitter" },
  { href: "#", label: "LinkedIn" },
  { href: "#", label: "GitHub" },
];

export default function Home() {
  return (
    <div className="noise-overlay bg-background text-foreground">
      <main>
        <HeroCinematic
          navLinks={navLinks}
          trustSchools={trustSchools}
          sceneUrl="https://prod.spline.design/olDED5M9bNNJVADs/scene.splinecode"
        />

        <section id="how-it-works" className="section-shell relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto w-full max-w-7xl">
            <FadeIn>
              <div className="text-center">
                <span className="mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                  How It Works
                </span>
                <TextReveal
                  text="Three Steps to Internship Success"
                  tag="h2"
                  className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                />
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                  Build momentum quickly with a focused workflow that keeps your job search clear and consistent.
                </p>
              </div>
            </FadeIn>

            <div className="relative mt-16">
              <div className="absolute left-[16.67%] right-[16.67%] top-20 hidden h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 md:block" />
              <StaggerContainer className="grid gap-8 md:grid-cols-3" staggerChildren={0.15}>
                {howItWorksSteps.map((step) => (
                  <StaggerItem key={step.title}>
                    <TiltCard
                      className="relative rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm"
                      tiltAmount={5}
                    >
                      <div className="relative mx-auto mb-6">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white shadow-lg shadow-blue-500/25">
                          {step.number}
                        </div>
                      </div>
                      <step.icon className="mx-auto mb-4 h-8 w-8 text-blue-500" />
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </TiltCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        <section id="features" className="section-shell bg-muted/15 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto w-full max-w-7xl">
            <FadeIn>
              <div className="mb-12 max-w-3xl">
                <span className="mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                  Product Proof
                </span>
                <TextReveal
                  text="A Precision Stack For Internship Execution"
                  tag="h2"
                  className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                />
                <p className="mt-4 text-muted-foreground">
                  Every module is designed to remove friction and compound momentum from your first saved role to your final offer.
                </p>
              </div>
            </FadeIn>
            <FeatureShowcase features={featureRows} />
          </div>
        </section>

        <section className="section-shell px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto w-full max-w-7xl">
            <FadeIn>
              <div className="text-center">
                <span className="mb-4 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                  Capability Grid
                </span>
                <TextReveal
                  text="Everything You Need"
                  tag="h2"
                  className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                />
              </div>
            </FadeIn>
            <StaggerContainer className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerChildren={0.12}>
              {secondaryFeatures.map((feature, idx) => {
                const spanClass =
                  idx === 0
                    ? "lg:col-span-2"
                    : idx === 5
                      ? "lg:col-span-2"
                      : "lg:col-span-1";
                return (
                  <StaggerItem key={feature.title} className={spanClass}>
                    <SpotlightCard className="h-full p-6">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-500">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gray-950 px-4 py-24 text-white dark:bg-gray-900/50 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-[120px]" />
          </div>
          <div className="mx-auto w-full max-w-7xl">
            <StaggerContainer className="grid gap-8 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <StaggerItem key={stat.label} className="text-center sm:text-left">
                  <p className="text-5xl font-bold tracking-tight text-white lg:text-6xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-400">{stat.label}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn className="mt-14">
              <TextReveal
                text="What Students Are Saying"
                tag="h2"
                className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              />
            </FadeIn>
            <div className="mt-8">
              <TestimonialSection testimonials={testimonials} />
            </div>
          </div>
        </section>

        <section id="faq" className="section-shell bg-muted/10 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto w-full max-w-3xl">
            <FadeIn>
              <TextReveal
                text="Frequently Asked Questions"
                tag="h2"
                className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              />
            </FadeIn>
            <div className="mt-10">
              <FAQAccordion items={faqs} />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="animate-gradient absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)]" />

          <FadeIn>
            <div className="mx-auto w-full max-w-4xl text-center">
              <TextReveal
                text="Ready to Take Control of Your Internship Search?"
                tag="h2"
                className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl"
              />
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Join thousands of students using InternIQ to stay organized and land better opportunities faster.
              </p>
              <div className="mt-10">
                <MagneticButton>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-blue-600 px-10 py-6 text-lg text-white shadow-2xl shadow-blue-600/30 transition-all duration-300 hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/40"
                  >
                    <Link href="/signup" className="inline-flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </MagneticButton>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required · Free forever for students · Setup in 30 seconds
              </p>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-gray-950 px-4 py-12 text-white dark:bg-background sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 InternIQ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
