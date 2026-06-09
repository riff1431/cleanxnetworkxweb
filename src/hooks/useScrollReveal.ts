import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!ref.current) return;

    if (prefersReducedMotion) {
      gsap.set(ref.current, { opacity: 1, y: 0, x: 0 });
      return;
    }

    const { y = 40, x = 0, duration = 0.8, delay = 0, once = true } = options;

    // Set initial state immediately
    gsap.set(ref.current, { opacity: 0, y, x });

    // Delay ScrollTrigger setup to allow page transitions to complete
    const timer = setTimeout(() => {
      if (!ref.current) return;
      ScrollTrigger.refresh();
      gsap.to(ref.current, {
        y: 0,
        x: 0,
        opacity: 1,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 90%",
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        },
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return ref;
}

export function useStaggerReveal<T extends HTMLElement>(
  childSelector: string,
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion || !ref.current) return;

    const { y = 30, opacity = 0, duration = 0.6, stagger = 0.1 } = options;
    const children = ref.current.querySelectorAll(childSelector);

    gsap.fromTo(
      children,
      { y, opacity },
      {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return ref;
}
