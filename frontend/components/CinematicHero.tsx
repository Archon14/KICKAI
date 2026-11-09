"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, Sparkles } from "lucide-react";

type CinematicHeroProps = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  image?: string;
  children?: React.ReactNode;
};

export default function CinematicHero({
  eyebrow,
  title,
  highlight,
  description,
  image,
  children,
}: CinematicHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    const scrollParent = hero?.closest("main");
    if (!hero || !scrollParent) return;

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const parentRect = scrollParent.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const distance = Math.max(heroRect.height, 1);
        const next = Math.max(
          0,
          Math.min(1, (parentRect.top - heroRect.top) / distance)
        );
        setProgress(next);
      });
    };

    scrollParent.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      cancelAnimationFrame(frame);
      scrollParent.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function scrollToContent() {
    heroRef.current?.nextElementSibling?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section
      ref={heroRef}
      className="kick-cinematic-hero relative isolate flex min-h-[min(780px,85vh)] flex-col items-center justify-center overflow-hidden rounded-3xl border border-[var(--kick-border)] px-6 py-20 text-center sm:px-12"
    >
      {image && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage: `url("${image}")`,
            transform: `scale(${1.06 + progress * 0.14})`,
            opacity: Math.max(0.15, 0.55 - progress * 0.3),
          }}
        />
      )}

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-[var(--kick-bg)]/85 to-[var(--kick-bg)]" />
      <div className="kick-cinematic-glow absolute left-1/2 top-1/2 -z-10 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--kick-primary)] opacity-[0.12] blur-[110px]" />

      <div
        className="relative z-10 max-w-4xl"
        style={{
          opacity: Math.max(0.2, 1 - progress * 1.5),
          transform: `translateY(${progress * -45}px)`,
        }}
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--kick-primary)]/40 bg-[var(--kick-card)]/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--kick-primary)]">
          <Sparkles size={14} />
          {eyebrow}
        </div>

        <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-[var(--kick-text)] sm:text-6xl lg:text-7xl">
          {title}
          {highlight && (
            <span className="mt-3 block bg-gradient-to-r from-[var(--kick-primary)] via-[var(--kick-secondary)] to-[var(--kick-primary)] bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-[var(--kick-muted)] sm:text-xl">
          {description}
        </p>

        {children && <div className="mt-8">{children}</div>}
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        className="absolute bottom-7 z-20 flex items-center gap-2 rounded-full border border-[var(--kick-border)] bg-[var(--kick-card)]/80 px-5 py-3 text-xs font-semibold text-[var(--kick-text)] transition hover:border-[var(--kick-primary)]"
      >
        Explore the experience
        <ArrowDown size={15} className="kick-cinematic-bounce" />
      </button>
    </section>
  );
}
