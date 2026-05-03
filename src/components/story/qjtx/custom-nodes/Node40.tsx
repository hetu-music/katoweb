import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // A deep, cinnabar-tinted black to differentiate from the absolute black background
  bg: "#120a0a",
  titleColor: "#e5e5e5",
  bodyColor: "#a3a3a3",
  accentColor: "#ffffff",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C76 8 92 24 100 50 C92 76 76 92 50 100 C24 92 8 76 0 50 C8 24 24 8 50 0 Z",
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

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none text-white`}
    >
      <div
        className={`node-wrapper-${event.id} absolute inset-0 opacity-0 bg-black`}
      >
        {/* Background Image: 40.avif - Starts full color, fades to grayscale only at the end */}
        <div
          className={`finale-bg-${event.id} absolute inset-0 bg-[url('/story/qjtx/40.avif')] bg-cover bg-center opacity-80 pointer-events-none scale-105`}
        />

        {/* Deep vignettes to create absolute focus - hidden at start */}
        <div
          className={`finale-vignette-${event.id} absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_10%,#000000_85%)] pointer-events-none opacity-0`}
        />
        <div
          className={`finale-vignette-${event.id} absolute inset-0 bg-linear-to-b from-black/80 via-transparent to-black/90 pointer-events-none opacity-0`}
        />

        {/* Falling cinematic dust motes (Curtain Dust) */}
        <div
          className={`finale-dust-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={`dust-${event.id} absolute bg-white/20 rounded-full blur-[1px]`}
              style={{
                width: `${(prand(i) * 3 + 1).toFixed(4)}px`,
                height: `${(prand(i + 0.1) * 3 + 1).toFixed(4)}px`,
                left: `${(prand(i + 0.2) * 100).toFixed(4)}%`,
                top: `${((prand(i + 0.3) - 0.2) * 100).toFixed(4)}%`,
              }}
            />
          ))}
        </div>

        {/* Phase 1: The Title (Curtain Opens / Final Whisper) */}
        <div
          className={`content-title-${event.id} absolute inset-0 flex items-center justify-center pointer-events-none`}
        >
          <h2 className="text-5xl md:text-8xl tracking-[0.6em] pl-[0.6em] font-light text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] opacity-0 filter blur-xl">
            {detail.title}
          </h2>
        </div>

        {/* Phase 2: The Body (The Final Lines) */}
        <div
          className={`content-body-${event.id} absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 md:px-12`}
        >
          <div className="flex flex-col gap-12 md:gap-20 max-w-4xl text-center">
            {detail.body.map((line, i) => (
              <p
                key={i}
                className={`final-line-${event.id} text-[18px] md:text-[32px] tracking-[0.2em] md:tracking-[0.4em] pl-[0.2em] md:pl-[0.4em] text-white font-light opacity-0 filter blur-lg transform translate-y-6 leading-[2.5] whitespace-normal wrap-break-word drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Phase 3: The Closing (The Credits) */}
        <div
          className={`content-closing-${event.id} absolute inset-0 flex flex-col items-center justify-center pointer-events-none`}
        >
          <div
            className="w-px h-24 md:h-32 bg-linear-to-b from-transparent to-white/30 mb-10 opacity-0 transform origin-top"
            id={`closing-line-top-${event.id}`}
          />
          <div
            className={`closing-text-${event.id} text-sm md:text-2xl tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] text-slate-200 font-light opacity-0 filter blur-lg text-center drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]`}
          >
            {detail.closing}
          </div>
          <div
            className="w-px h-24 md:h-32 bg-linear-to-t from-transparent to-white/30 mt-10 opacity-0 transform origin-bottom"
            id={`closing-line-bot-${event.id}`}
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
  const bgImage = sel(`.finale-bg-${eventId}`);
  const vignettes = selAll(`.finale-vignette-${eventId}`);
  const dustContainer = sel(`.finale-dust-${eventId}`);
  const dustParticles = selAll(`.dust-${eventId}`);

  const titlePhase = sel(`.content-title-${eventId}`);
  const titleText = titlePhase?.querySelector("h2");

  const bodyPhase = sel(`.content-body-${eventId}`);
  const bodyLines = selAll(`.final-line-${eventId}`);

  const closingPhase = sel(`.content-closing-${eventId}`);
  const closingLineTop = sel(`#closing-line-top-${eventId}`);
  const closingText = sel(`.closing-text-${eventId}`);
  const closingLineBot = sel(`#closing-line-bot-${eventId}`);

  if (
    !wrapper ||
    !dustContainer ||
    !titlePhase ||
    !titleText ||
    !bodyPhase ||
    !closingPhase ||
    !closingLineTop ||
    !closingText ||
    !closingLineBot
  )
    return;

  // Initial States
  tl.set(wrapper, { opacity: 0 });
  tl.set(dustContainer, { opacity: 0 });
  tl.set(closingLineTop, { scaleY: 0 });
  tl.set(closingLineBot, { scaleY: 0 });

  const isMobile = window.innerWidth < 768;

  // Start with full color and slight brightness
  if (bgImage) {
    tl.set(bgImage, { filter: "grayscale(0%) brightness(1.2)" });
  }

  // Infinite slow falling dust (Cinematic projector dust)
  // 移动端只动画前 12 个，降低 GPU 合成层
  const maxDust = isMobile ? 12 : dustParticles.length;
  Array.from(dustParticles)
    .slice(0, maxDust)
    .forEach((p) => {
      gsap.to(p, {
        y: "+=120vh",
        x: `+=${(Math.random() - 0.5) * 50}px`,
        opacity: Math.random() * 0.6 + 0.1,
        duration: 15 + Math.random() * 15,
        repeat: -1,
        ease: "none",
        delay: Math.random() * -15,
      });
    });

  // 1. Enter the Scene (Expansion & Fade)
  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "250vmax", duration: 5, ease: "power2.inOut" },
    0,
  );
  tl.to(wrapper, { opacity: 1, duration: 4, ease: "power2.inOut" }, 0);
  tl.to(dustContainer, { opacity: 1, duration: 6 }, 1);

  // 2. Title Sequence (The Final Whisper)
  tl.set(titlePhase, { display: "flex" });
  tl.to(
    titleText,
    { opacity: 1, filter: "blur(0px)", duration: 5, ease: "power3.out" },
    2,
  );
  tl.to(
    titleText,
    {
      opacity: 0,
      filter: "blur(20px)",
      scale: 1.05,
      duration: 4,
      ease: "power2.in",
    },
    "+=4",
  );
  tl.set(titlePhase, { display: "none" });

  // 3. Body Sequence (The Echoes of History)
  tl.set(bodyPhase, { display: "flex" });
  tl.to(
    bodyLines,
    {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      duration: 4,
      stagger: 2.5,
      ease: "power2.out",
    },
    "+=1",
  );
  tl.to(
    bodyLines,
    {
      opacity: 0,
      filter: "blur(15px)",
      y: -10,
      duration: 4,
      stagger: 0.5,
      ease: "power2.in",
    },
    "+=5",
  );
  tl.set(bodyPhase, { display: "none" });

  // 4. Closing Sequence (The Credits / End of the Scroll)
  tl.set(closingPhase, { display: "flex" });

  // THE FALL: Drain color, dim lights, and bring in vignettes as the curtain closes
  if (bgImage) {
    tl.to(
      bgImage,
      {
        filter: "grayscale(100%) brightness(0.3)",
        duration: 8,
        ease: "power2.inOut",
      },
      "+=0.5",
    );
  }
  tl.to(vignettes, { opacity: 1, duration: 8, ease: "power2.inOut" }, "<");

  tl.to(
    [closingLineTop, closingLineBot],
    { scaleY: 1, duration: 3, ease: "power3.out" },
    "+=1",
  );
  tl.to(
    closingText,
    { opacity: 1, filter: "blur(0px)", duration: 4, ease: "power2.out" },
    "-=1.5",
  );
  tl.to(
    [closingText, closingLineTop, closingLineBot],
    { opacity: 0, filter: "blur(20px)", duration: 4, ease: "power2.in" },
    "+=5",
  );

  // 5. Global Exit (Collapse back to the node) - Directly after the credits fade
  tl.to(
    scrollyBg,
    { "--radius": "0px", duration: 4, ease: "power3.inOut" },
    "+=0.5",
  );
  tl.to(wrapper, { opacity: 0, duration: 3, ease: "power2.inOut" }, "<+0.5");
  tl.to(dustContainer, { opacity: 0, duration: 2 }, "<");
}
