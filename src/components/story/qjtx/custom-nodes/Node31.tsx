import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Starts with a deep, tragic blue/black slate
  bg: "#020617",
  titleColor: "#f8fafc",
  bodyColor: "#94a3b8",
  accentColor: "#be123c",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C68 8 82 18 92 34 C100 48 100 52 92 66 C82 82 68 92 50 100 C32 92 18 82 8 66 C0 52 0 48 8 34 C18 18 32 8 50 0 Z",
};

// Pseudo-random generator for consistent rendering without hydration errors
const prand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export function NodeLayout({
  event,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  // Divide body into 4 sequential phases exactly as requested (6, 9, 12, rest)
  const p1 = detail.body.slice(0, 6);
  const p2 = detail.body.slice(6, 9);
  const p3 = detail.body.slice(9, 12);
  const p4 = detail.body.slice(12);

  // Helper for ornate corners
  const AncientFrame = () => (
    <>
      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-slate-400/30 rounded-tl-sm" />
      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-slate-400/30 rounded-tr-sm" />
      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-slate-400/30 rounded-bl-sm" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-slate-400/30 rounded-br-sm" />
    </>
  );

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}
    >
      {/* Global Wrapper */}
      <div
        className={`node-wrapper-${event.id} absolute inset-0 opacity-0 bg-[#020617]`}
      >
        {/* Solid Base Background */}
        <div className="absolute inset-0 bg-[#02040a] pointer-events-none" />

        {/* Clear Background Image with Tranquil Cold Tint */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/31.avif')] bg-cover bg-center opacity-85 pointer-events-none" />

        {/* Frost / Moonlight Overlay Gradient - Weakened for clarity */}
        <div className="absolute inset-0 bg-linear-to-b from-[#020617]/60 via-transparent to-[#020617]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(241,245,249,0.05)_0%,transparent_60%)] pointer-events-none" />

        {/* --- The Storm (The past chaos) --- */}
        {/* Violent red/orange overlay that will fade out to represent the clamor dying down */}
        <div
          className={`war-overlay-${event.id} absolute inset-0 bg-linear-to-b from-red-950 via-[#3f0707]/80 to-black mix-blend-multiply pointer-events-none z-0`}
        />

        {/* Violent, fast-moving embers */}
        <div
          className={`war-embers-${event.id} absolute inset-0 pointer-events-none z-0`}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={`ember-particle-${event.id} absolute bg-orange-400 rounded-full blur-[1px] shadow-[0_0_15px_rgba(239,68,68,0.9)]`}
              style={{
                width: `${(prand(i) * 4 + 2).toFixed(4)}px`,
                height: `${(prand(i * 1.1) * 4 + 2).toFixed(4)}px`,
                left: `${(prand(i * 1.2) * 100).toFixed(4)}%`,
                top: `${(prand(i * 1.3) * 100).toFixed(4)}%`,
              }}
            />
          ))}
        </div>

        {/* Cold, slate-blue overlay that remains after the fire dies - Restored some atmosphere */}
        <div
          className={`peace-overlay-${event.id} absolute inset-0 bg-linear-to-b from-[#020617]/85 via-[#0f172a]/40 to-[#020617]/90 pointer-events-none z-0 opacity-0`}
        />

        {/* Slow, silent, infinite snow/ash falling in the cold void */}
        <div
          className={`peace-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 z-0`}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`snow-particle-${event.id} absolute bg-slate-300/40 rounded-full blur-[1px]`}
              style={{
                width: `${(prand(i * 2) * 3 + 1).toFixed(4)}px`,
                height: `${(prand(i * 2.1) * 3 + 1).toFixed(4)}px`,
                left: `${(prand(i * 2.2) * 100).toFixed(4)}%`,
                top: "-10%",
              }}
            />
          ))}
        </div>

        {/* --- Content Phases --- */}

        {/* Phase 1: Intro (Cooling Text Effect) */}
        <div
          className={`content-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8 pointer-events-none z-10 opacity-0`}
        >
          <div className="w-px h-24 md:h-32 bg-linear-to-b from-transparent to-slate-400/50 mb-8" />
          <h2
            className={`title-text-${event.id} text-5xl md:text-[6rem] tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-light text-center wrap-break-word leading-tight max-w-[90vw]`}
          >
            {detail.title}
          </h2>
          <div
            className={`quote-text-${event.id} mt-8 md:mt-10 text-xs md:text-[16px] tracking-[0.6em] md:tracking-[0.8em] font-light text-center w-full max-w-[85vw] md:max-w-2xl leading-[2.5] pl-[0.6em] md:pl-[0.8em] whitespace-normal wrap-break-word`}
          >
            {detail.quote}
          </div>
          <div className="w-px h-24 md:h-32 bg-linear-to-t from-transparent to-slate-400/50 mt-8" />
        </div>

        {/* --- Phase 1 to 4: Sequential Narrative --- */}
        {[p1, p2, p3, p4].map((lines, phaseIdx) => (
          <div
            key={phaseIdx}
            className={`content-phase-${phaseIdx + 1}-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pointer-events-none z-10 opacity-0`}
          >
            <div className="relative p-10 md:p-20 max-w-4xl bg-[radial-gradient(circle_at_50%_50%,rgba(2,6,23,0.6)_0%,transparent_80%)]">
              <AncientFrame />
              <div className="flex flex-col gap-6 md:gap-8 text-center">
                {lines.map((line, i) => {
                  const emphasis =
                    line.includes("朱砂") ||
                    line.includes("颜色无双") ||
                    line.includes("追随那人而去");
                  return (
                    <p
                      key={i}
                      className={`text-[15px] md:text-[18px] leading-[2.5] tracking-[0.3em] md:tracking-[0.4em] whitespace-normal wrap-break-word ${emphasis ? "text-rose-100 drop-shadow-[0_0_15px_rgba(225,29,72,0.4)] font-normal" : "text-slate-300 font-light"}`}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Phase 3: Closing (The Echo in the void) */}
        <div
          className={`content-closing-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none z-10 opacity-0`}
        >
          <div className="w-px h-16 md:h-24 bg-linear-to-b from-transparent to-slate-400/30 mb-10" />
          <div className="text-slate-200 text-sm md:text-xl tracking-[1em] md:tracking-[1.5em] pl-[1em] md:pl-[1.5em] font-light max-w-4xl text-center leading-[3] drop-shadow-[0_0_20px_rgba(241,245,249,0.3)] whitespace-normal wrap-break-word">
            {detail.closing}
          </div>
          <div className="w-px h-16 md:h-24 bg-linear-to-t from-transparent to-slate-400/30 mt-10" />
        </div>
      </div>
    </div>
  );
}

export function animate(
  tl: gsap.core.Timeline,
  detailContent: HTMLElement,
  scrollyBg: HTMLElement,
  scrollyText: HTMLElement,
  eventId: string,
) {
  const sel = (s: string) => scrollyText.querySelector(s);
  const selAll = (s: string) => scrollyText.querySelectorAll(s);

  const wrapper = sel(`.node-wrapper-${eventId}`);

  const warOverlay = sel(`.war-overlay-${eventId}`);
  const warEmbers = sel(`.war-embers-${eventId}`);
  const emberParticles = selAll(`.ember-particle-${eventId}`);

  const peaceOverlay = sel(`.peace-overlay-${eventId}`);
  const peaceSnow = sel(`.peace-snow-${eventId}`);
  const snowParticles = selAll(`.snow-particle-${eventId}`);

  const intro = sel(`.content-intro-${eventId}`);
  const titleText = sel(`.title-text-${eventId}`);
  const quoteText = sel(`.quote-text-${eventId}`);

  const p1 = sel(`.content-phase-1-${eventId}`);
  const p2 = sel(`.content-phase-2-${eventId}`);
  const p3 = sel(`.content-phase-3-${eventId}`);
  const p4 = sel(`.content-phase-4-${eventId}`);

  const closingStage = sel(`.content-closing-${eventId}`);

  // Initial States
  tl.set([wrapper, intro, p1, p2, p3, p4, closingStage], { opacity: 0 });

  // Set text to start "hot" (smoldering)
  tl.set(titleText, {
    color: "#fca5a5",
    textShadow: "0 0 30px #e11d48",
    scale: 0.95,
    filter: "blur(8px)",
  });
  tl.set(quoteText, {
    color: "#fda4af",
    textShadow: "0 0 20px #e11d48",
    scale: 0.95,
    filter: "blur(8px)",
  });

  const isMobile = window.innerWidth < 768;

  // 移动端只动画前 N 个粒子，降低 GPU 合成层数量
  const maxEmbers = isMobile ? 12 : emberParticles.length;
  const maxSnow = isMobile ? 15 : snowParticles.length;

  // Violent Embers Animation (Fast, upward)
  Array.from(emberParticles)
    .slice(0, maxEmbers)
    .forEach((p) => {
      gsap.to(p, {
        y: "-110vh",
        x: `+=${(Math.random() - 0.5) * 200}px`,
        opacity: Math.random() * 0.8 + 0.2,
        duration: 2 + Math.random() * 3, // Very fast
        repeat: -1,
        ease: "power1.in",
      });
    });

  // Silent Snow Animation (Slow, downward)
  Array.from(snowParticles)
    .slice(0, maxSnow)
    .forEach((p) => {
      gsap.to(p, {
        y: "110vh",
        x: `+=${(Math.random() - 0.5) * 60}px`,
        opacity: Math.random() * 0.5 + 0.2,
        duration: 12 + Math.random() * 10, // Very slow and calm
        repeat: -1,
        ease: "none",
        delay: Math.random() * -10,
      });
    });

  // 1. The Intro sequence begins in the heat of war
  tl.to(wrapper, { opacity: 1, duration: 1.5, ease: "power2.inOut" }, 0);
  tl.to(intro, { opacity: 1, duration: 2, ease: "power2.out" }, 1);

  // The Title and Quote "cool down" from glowing red to cold slate/white
  tl.to(
    titleText,
    {
      color: "#f8fafc",
      textShadow: "0 0 15px rgba(248,250,252,0.4)",
      scale: 1,
      filter: "blur(0px)",
      duration: 5,
      ease: "power3.out",
    },
    1,
  );
  tl.to(
    quoteText,
    {
      color: "#cbd5e1",
      textShadow: "0 0 10px rgba(203,213,225,0.2)",
      scale: 1,
      filter: "blur(0px)",
      duration: 5,
      ease: "power3.out",
    },
    1.5,
  );

  // 2. The Clamor Fades (喧闹落尽) -> Transition from War to Peace
  // Starts after the intro has had time to be read
  const transitionStart = 6;
  tl.to(
    warOverlay,
    { opacity: 0, duration: 5, ease: "power2.inOut" },
    transitionStart,
  );
  tl.to(
    warEmbers,
    { opacity: 0, filter: "blur(10px)", duration: 4, ease: "power2.in" },
    transitionStart,
  );
  tl.to(
    peaceOverlay,
    { opacity: 0.8, duration: 5, ease: "power2.inOut" },
    transitionStart + 0.5,
  );
  tl.to(
    peaceSnow,
    { opacity: 1, duration: 4, ease: "power2.out" },
    transitionStart + 1,
  );

  // Exit Intro as peace settles in
  tl.to(
    intro,
    {
      opacity: 0,
      y: -20,
      filter: "blur(15px)",
      duration: 3,
      ease: "power2.inOut",
    },
    transitionStart + 4,
  );
  tl.set(intro, { display: "none" });

  // 3. Sequential Body Phases
  [p1, p2, p3, p4].forEach((p, idx) => {
    if (!p) return;
    tl.fromTo(
      p,
      { opacity: 0, y: 20, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.5,
        ease: "power2.out",
      },
      idx === 0 ? "-=1" : "+=1",
    );
    tl.to(
      p,
      {
        opacity: 0,
        y: -20,
        filter: "blur(10px)",
        duration: 2.5,
        ease: "power2.inOut",
      },
      "+=4",
    );
  });

  // 4. Closing (The Final Echo in the void)
  tl.set(closingStage, { display: "flex", opacity: 1 });
  tl.fromTo(
    closingStage,
    { opacity: 0, scale: 0.95, filter: "blur(15px)" },
    {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 4,
      ease: "power2.out",
    },
    "+=0.5",
  );

  tl.to(
    closingStage,
    { opacity: 0, filter: "blur(20px)", duration: 3, ease: "power2.in" },
    "+=4",
  );

  // 5. Global Exit (The complete silence)
  tl.to(peaceSnow, { opacity: 0, duration: 3 }, "-=2");
  tl.to(wrapper, { opacity: 0, duration: 3, ease: "power2.inOut" }, "-=1");
}
