import { AnimatedCounter } from "@/components/ui/animated-counter";

const stats = [
  { value: 50000, suffix: "+", label: "Applications" },
  { value: 5000, suffix: "+", label: "Portfolios" },
  { value: 85, suffix: "%", label: "Interview Boost" },
  { value: 200, suffix: "+", label: "Universities" },
];

export const StatsSection = () => {
  return (
    <section id="stats" className="px-4 py-20">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <AnimatedCounter
              target={stat.value}
              suffix={stat.suffix}
              className="font-display text-4xl text-gradient"
            />
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
