"use client";

import { useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useState } from "react";
import { loadSlim } from "@tsparticles/slim";
import { prefersReducedMotion } from "@/components/animations/reduced-motion";

export const ParticlesOverlay = () => {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const options = useMemo(
    () => ({
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        number: { value: 35, density: { enable: true, area: 900 } },
        color: { value: ["#93c5fd", "#c4b5fd", "#bfdbfe"] },
        opacity: { value: 0.22 },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: true,
          speed: 0.6,
          outModes: { default: "out" as const },
        },
      },
      interactivity: {
        events: { onHover: { enable: true, mode: "repulse" as const } },
        modes: { repulse: { distance: 60, duration: 0.4 } },
      },
      detectRetina: true,
    }),
    []
  );

  if (!engineReady || prefersReducedMotion()) {
    return null;
  }

  return (
    <Particles
      id="interniq-particles"
      options={options}
      className="pointer-events-none absolute inset-0 z-[1]"
    />
  );
};
