import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Deep blood and obsidian void
  bg: "#0a0202", // Handled inside for animations
  titleColor: "#fca5a5",
  bodyColor: "#e5e7eb",
  accentColor: "#dc2626",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C68 7 84 20 100 50 C84 80 68 93 50 100 C32 93 16 80 0 50 C16 20 32 7 50 0 Z",
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

  // Split lines into the three themes (Prelude, Siege, Legend)
  const preludeLines = detail.body.slice(1, 5);
  const siegeLines = detail.body.slice(5, 10);
  const legendLines = detail.body.slice(10);

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}
    >
      {/* Global Wrapper for Entrance/Exit Animations */}
      <div className={`node-wrapper-${event.id} absolute inset-0`}>
        {/* Solid Base Background to block underlying timeline */}
        <div className="absolute inset-0 bg-[#050000] pointer-events-none" />

        {/* Background Image & Apocalyptic Overlays */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/26.avif')] bg-cover bg-center opacity-80 mix-blend-normal scale-105 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-[#0a0202]/40 via-transparent to-[#0a0202]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,rgba(5,0,0,0.4)_100%)] pointer-events-none" />

        {/* Apocalyptic Weather (Falling Ash & Rising Embers) */}
        <div
          className={`apocalypse-weather-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        >
          {/* Falling Ash */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={`ash-${i}`}
              className={`ash-particle-${event.id} absolute bg-zinc-400/40 rounded-full blur-[1px]`}
              style={{
                width: `${(prand(i) * 3 + 1).toFixed(4)}px`,
                height: `${(prand(i + 0.1) * 3 + 1).toFixed(4)}px`,
                left: `${(prand(i + 0.2) * 100).toFixed(4)}%`,
                top: "-5%",
              }}
            />
          ))}
          {/* Rising Embers */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`ember-${i}`}
              className={`ember-particle-${event.id} absolute bg-red-500 rounded-full blur-[2px] shadow-[0_0_10px_rgba(239,68,68,0.8)]`}
              style={{
                width: `${(prand(i + 0.3) * 4 + 2).toFixed(4)}px`,
                height: `${(prand(i + 0.4) * 4 + 2).toFixed(4)}px`,
                left: `${(prand(i + 0.5) * 100).toFixed(4)}%`,
                bottom: "-5%",
              }}
            />
          ))}
        </div>

        {/* Stage 1: Intro (The Dark Sun / Eclipse) */}
        <div
          className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8`}
        >
          <div className="relative flex flex-col items-center w-full max-w-[90vw]">
            <h2
              className={`title-text-${event.id} relative text-4xl md:text-[5rem] text-transparent bg-clip-text bg-linear-to-b from-red-50 to-red-600/80 tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-light text-center drop-shadow-[0_0_40px_rgba(220,38,38,0.6)] wrap-break-word leading-tight`}
            >
              {detail.title}
            </h2>
          </div>

          <div
            className={`quote-text-${event.id} mt-8 md:mt-10 text-red-200/70 text-xs md:text-[15px] tracking-[0.4em] md:tracking-[0.6em] font-light text-center w-full max-w-[85vw] md:max-w-xl leading-[2.2] md:leading-[2.5] pl-[0.4em] md:pl-[0.6em] whitespace-normal wrap-break-word max-h-[30vh] overflow-y-auto no-scrollbar`}
          >
            {detail.quote}
          </div>
        </div>

        {/* Stage 2: The Obsidian Pillars (Body) */}
        <div
          className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center opacity-0 px-4 md:px-8`}
        >
          <div className="relative z-10 w-full max-w-7xl flex flex-col md:flex-row gap-6 md:gap-8 items-stretch md:items-end h-[85vh] md:h-[75vh]">
            {/* Pillar 1: Prelude */}
            <div
              className={`monolith-${event.id} relative w-full md:w-[30%] bg-zinc-950/90 border border-zinc-800/50 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col justify-start overflow-y-auto no-scrollbar md:h-[75%]`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-zinc-500 to-transparent opacity-20" />
              <div className="space-y-4">
                {preludeLines.map((line, i) => (
                  <p
                    key={i}
                    className="text-[13px] md:text-[14px] leading-relaxed tracking-[0.15em] text-zinc-300/80 font-light"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Pillar 2: The Siege (The Core) */}
            <div
              className={`monolith-${event.id} relative w-full md:w-[40%] bg-[#050000]/95 border border-red-900/30 rounded-t-2xl shadow-[0_-20px_80px_rgba(220,38,38,0.15)] p-6 md:p-10 flex flex-col justify-start overflow-y-auto no-scrollbar md:h-full`}
            >
              {/* Massive crack effect */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_70%)] pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-red-600/80 shadow-[0_0_30px_rgba(220,38,38,1)]" />

              <div className="space-y-5">
                {siegeLines.map((line, i) => {
                  const isTragic =
                    line.includes("白炎军攻帝都") ||
                    line.includes("城陷") ||
                    line.includes("阻炎军于帝都外三日");
                  return (
                    <p
                      key={i}
                      className={`text-[14px] md:text-[15px] leading-[2.2] tracking-[0.2em] ${isTragic ? "text-red-100 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] font-normal" : "text-zinc-300 font-light"}`}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Pillar 3: Legend */}
            <div
              className={`monolith-${event.id} relative w-full md:w-[30%] bg-zinc-950/90 border border-zinc-800/50 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col justify-start overflow-y-auto no-scrollbar md:h-[85%]`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-zinc-500 to-transparent opacity-20" />
              <div className="space-y-4 grow">
                {legendLines.map((line, i) => {
                  const isHoly = line.includes("大慈悲者");
                  return (
                    <p
                      key={i}
                      className={`text-[13px] md:text-[14px] leading-relaxed tracking-[0.15em] ${isHoly ? "text-red-200/80 font-normal drop-shadow-[0_0_5px_rgba(254,202,202,0.5)]" : "text-zinc-300/80 font-light"}`}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3: Closing */}
        <div
          className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}
        >
          <div
            className={`closing-text-${event.id} text-red-200/90 text-sm md:text-lg tracking-[0.8em] md:tracking-[1em] pl-[0.8em] md:pl-[1em] font-light drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] text-center w-full max-w-[90vw] leading-loose wrap-break-word whitespace-normal max-h-[60vh] overflow-y-auto no-scrollbar`}
          >
            {detail.closing}
          </div>
          <div
            className={`closing-line-${event.id} mt-8 w-24 md:w-32 h-px bg-linear-to-r from-transparent via-red-500/50 to-transparent`}
          />
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
  const weather = sel(`.apocalypse-weather-${eventId}`);

  const intro = sel(`.scrolly-intro-${eventId}`);
  const titleText = sel(`.title-text-${eventId}`);
  const quoteText = sel(`.quote-text-${eventId}`);

  const bodyContainer = sel(`.scrolly-body-container-${eventId}`);
  const monoliths = selAll(`.monolith-${eventId}`);

  const closingContainer = sel(`.scrolly-closing-container-${eventId}`);
  const closingText = sel(`.closing-text-${eventId}`);
  const closingLine = sel(`.closing-line-${eventId}`);

  // Initial States
  tl.set([weather, bodyContainer, closingContainer], { opacity: 0 });
  tl.set(titleText, { opacity: 0, y: 30, filter: "blur(12px)" });
  tl.set(quoteText, { opacity: 0, y: 20 });
  tl.set(monoliths, { opacity: 0, y: 150 });
  tl.set([closingText, closingLine], {
    opacity: 0,
    scale: 0.8,
    filter: "blur(15px)",
  });

  // Ash and Embers continuous weather animation
  const ashes = selAll(`.ash-particle-${eventId}`);
  const embers = selAll(`.ember-particle-${eventId}`);

  ashes.forEach((p) => {
    gsap.to(p, {
      y: "110vh",
      x: `+=${(Math.random() - 0.5) * 100}px`,
      duration: 5 + Math.random() * 5,
      repeat: -1,
      ease: "none",
      delay: Math.random() * -5,
    });
  });

  embers.forEach((p) => {
    gsap.to(p, {
      y: "-110vh",
      x: `+=${(Math.random() - 0.5) * 150}px`,
      opacity: Math.random() * 0.8 + 0.2,
      duration: 4 + Math.random() * 4,
      repeat: -1,
      ease: "none",
      delay: Math.random() * -4,
    });
  });

  // 0. Global Entrance
  tl.fromTo(
    wrapper,
    { scale: 1.05, opacity: 0, filter: "blur(20px)" },
    {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      duration: 2.5,
      ease: "power3.out",
    },
    0,
  );
  tl.to(weather, { opacity: 1, duration: 3 }, 1);

  // 1. Intro Sequence (The Eclipse)
  tl.to(
    titleText,
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, ease: "power3.out" },
    1.5,
  )
    .to(quoteText, { opacity: 1, y: 0, duration: 3, ease: "power2.out" }, 2)

    // Exit Intro
    .to(
      [titleText, quoteText],
      {
        opacity: 0,
        y: -30,
        filter: "blur(15px)",
        duration: 3,
        ease: "power2.inOut",
        stagger: 0.1,
      },
      "+=4",
    )
    .set(intro, { display: "none" });

  // 2. Body Sequence (The Obsidian Pillars)
  tl.set(bodyContainer, { display: "flex", opacity: 1 });

  tl.to(
    monoliths,
    {
      opacity: 1,
      y: 0,
      duration: 3,
      stagger: 0.2,
      ease: "power4.out",
    },
    "-=1",
  )

    // Exit Body
    .to(
      monoliths,
      {
        opacity: 0,
        y: 50,
        filter: "blur(10px)",
        duration: 3,
        stagger: 0.1,
        ease: "power2.in",
      },
      "+=6",
    )
    .set(bodyContainer, { display: "none" });

  // 3. Closing Sequence
  tl.set(closingContainer, { display: "flex", opacity: 1 });

  tl.to(
    [closingText, closingLine],
    {
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      duration: 3,
      stagger: 0.2,
      ease: "power3.out",
    },
    "+=0.5",
  )

    // Exit Closing before wrapper collapse
    .to(
      [closingText, closingLine],
      {
        opacity: 0,
        filter: "blur(20px)",
        scale: 1.1,
        duration: 2.5,
        ease: "power2.in",
      },
      "+=4",
    );

  // 4. Global Exit
  tl.to(weather, { opacity: 0, duration: 3 }, "-=2.5");
  tl.to(
    wrapper,
    {
      scale: 0.95,
      opacity: 0,
      filter: "blur(20px)",
      duration: 2.5,
      ease: "power2.inOut",
    },
    "-=1",
  );
}
