"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isGsapRegistered = false;

export const setupGsap = () => {
  if (isGsapRegistered) {
    return gsap;
  }

  gsap.registerPlugin(ScrollTrigger);
  isGsapRegistered = true;
  return gsap;
};

export { gsap, ScrollTrigger };
