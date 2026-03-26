"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let initialized = false;

export const initGsap = () => {
  if (initialized || typeof window === "undefined") {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({
    ease: "power3.out",
    duration: 0.8,
  });
  initialized = true;
};

export { gsap, ScrollTrigger };
