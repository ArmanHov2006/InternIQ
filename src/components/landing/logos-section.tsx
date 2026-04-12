const logos = ["MIT", "Stanford", "UofT", "Berkeley", "CMU", "Waterloo", "Google", "Meta"];

export const LogosSection = () => {
  const row = [...logos, ...logos];
  return (
    <section className="py-10">
      <p className="text-center text-sm text-muted-foreground">Used by candidates from top schools and teams</p>
      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="animate-[marquee_24s_linear_infinite] whitespace-nowrap">
          {row.map((logo, index) => (
            <span
              key={`${logo}-${index}`}
              className="mx-6 inline-block text-lg font-semibold text-muted-foreground/40 transition hover:text-foreground/80"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
