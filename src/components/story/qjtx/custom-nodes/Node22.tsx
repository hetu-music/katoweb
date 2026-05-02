import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Opaque black background to ensure the timeline is fully covered during the circular mask expansion.
  bg: "#02040a", 
  titleColor: "#ecfdf5",
  bodyColor: "#a7f3d0",
  accentColor: "#10b981",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M 50 0 L 100 50 L 50 100 L 0 50 Z", // Diamond shape mask
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

  // Split body into pages of 5 items each to ensure they fit on screen without overflow
  const bodyPages = [];
  const chunkSize = 5;
  if (detail.body) {
    for (let i = 0; i < detail.body.length; i += chunkSize) {
      bodyPages.push(detail.body.slice(i, i + chunkSize));
    }
  }

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>

      {/* Wrapper for Entrance/Exit Animations */}
      <div className={`node-wrapper-${event.id} absolute inset-0`}>

        {/* Solid Base Background to block underlying timeline */}
        <div className="absolute inset-0 bg-[#02040a] pointer-events-none" />

        {/* Background Image & Overlays - Made clearer and fixed edge coverage */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/22.avif')] bg-cover bg-center opacity-85 scale-105 pointer-events-none" />
        <div className="absolute inset-[-2px] bg-linear-to-b from-[#020617]/50 via-transparent to-[#020617]/70 pointer-events-none" />
        <div className="absolute inset-[-2px] bg-[radial-gradient(circle_at_50%_35%,transparent_0%,#02040a_100%)] pointer-events-none" />

        {/* Ambient Heavenly Dust (Sparks/Stars) */}
        <div className={`celestial-dust-${event.id} absolute inset-0 pointer-events-none mix-blend-screen opacity-0`}>
          {Array.from({ length: 20 }).map((_, i) => {
            const size = 1 + prand(i) * 2;
            return (
              <div key={i} className={`dust-particle-${event.id}-${i} absolute bg-emerald-300 rounded-full blur-[1px] opacity-0 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]`}
                style={{
                  left: `${(prand(i + 0.1) * 100).toFixed(4)}%`,
                  top: `${(prand(i + 0.2) * 100).toFixed(4)}%`,
                  width: `${size.toFixed(4)}px`,
                  height: `${size.toFixed(4)}px`
                }} />
            )
          })}
        </div>

        {/* Stage 1: Intro */}
        <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8`}>
          <div className="relative flex flex-col items-center w-full max-w-[90vw]">
            <div className="absolute -inset-16 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            <h2 className={`title-text-${event.id} relative text-4xl md:text-[5rem] text-transparent bg-clip-text bg-linear-to-b from-emerald-50 to-emerald-400 tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-light text-center drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] wrap-break-word leading-tight`}>
              {detail.title}
            </h2>
            <div className={`title-line-${event.id} w-px h-12 md:h-20 bg-linear-to-b from-emerald-400/60 to-transparent mt-8 md:mt-12`} />
          </div>

          <div className={`quote-text-${event.id} mt-6 md:mt-8 text-emerald-100 text-xs md:text-[15px] tracking-[0.6em] md:tracking-[0.8em] font-light text-center w-full max-w-[85vw] md:max-w-lg leading-[2.2] md:leading-[2.5] pl-[0.6em] md:pl-[0.8em] whitespace-normal wrap-break-word max-h-[40vh] overflow-y-auto no-scrollbar px-6 py-4 rounded-2xl bg-emerald-950/20 backdrop-blur-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]`}>
            {detail.quote}
          </div>
        </div>

        {/* Stage 2: The Astrolabe & Fragments (Body) */}
        <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center opacity-0 px-4 md:px-8`}>

          {/* The Giant Compass/Astrolabe */}
          <div className={`astrolabe-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[1000px] max-h-[1000px] pointer-events-none flex items-center justify-center mix-blend-screen opacity-0`}>
            <div className="absolute inset-0 rounded-full border border-emerald-500/10 border-dashed" />
            <div className="absolute inset-[15%] rounded-full border-[0.5px] border-emerald-400/20" />
            <div className="absolute inset-[30%] rounded-full border border-emerald-300/10" />

            {/* Compass lines */}
            <div className="absolute top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 w-px bg-linear-to-b from-transparent via-emerald-400/15 to-transparent" />
            <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-px bg-linear-to-r from-transparent via-emerald-400/15 to-transparent" />

            {/* Inner glowing core */}
            <div className="absolute w-[20%] h-[20%] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]" />
          </div>

          {/* Pages of Jade Slips (Fragments) - Grouped to avoid overflow and show sequentially */}
          {bodyPages.map((page, pageIndex) => (
            <div key={pageIndex} className={`scrolly-body-page-${event.id} absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none`}>
              <div className="relative z-10 w-full max-w-5xl flex flex-wrap justify-center gap-4 md:gap-8 items-center content-center max-h-[85vh] py-10 px-2">
                {page.map((paragraph, index) => {
                  const isSeparator = paragraph === "……";
                  const isKeyLine = paragraph.includes("起兵") || paragraph.includes("即位") || paragraph.includes("远走海外") || paragraph.includes("天下");

                  if (isSeparator) {
                    return (
                      <div key={`sep-${index}`} className={`jade-slip-${event.id} w-full flex justify-center py-2 opacity-0`}>
                        <div className="flex items-center gap-3 md:gap-5 opacity-60">
                          <div className="h-px w-12 md:w-20 bg-linear-to-r from-transparent to-emerald-500/40" />
                          <div className="w-1.5 h-1.5 rotate-45 bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                          <div className="h-px w-12 md:w-20 bg-linear-to-l from-transparent to-emerald-500/40" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`item-${index}`} className={`jade-slip-${event.id} relative w-[85vw] md:w-[45%] lg:w-[30%] opacity-0`}>
                      <div className={`relative w-full h-full p-5 md:p-6 rounded-sm border ${isKeyLine ? 'border-emerald-400/30 bg-[#064e3b]/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'border-emerald-600/10 bg-[#022c22]/20'} backdrop-blur-md overflow-hidden`}>

                        {/* Glowing borders for key lines */}
                        {isKeyLine && (
                          <>
                            <div className="absolute top-0 left-0 w-8 h-px bg-emerald-300/60" />
                            <div className="absolute top-0 left-0 w-px h-8 bg-emerald-300/60" />
                            <div className="absolute bottom-0 right-0 w-8 h-px bg-emerald-300/60" />
                            <div className="absolute bottom-0 right-0 w-px h-8 bg-emerald-300/60" />
                            <div className="absolute inset-0 bg-emerald-500/5 blur-xl pointer-events-none" />
                          </>
                        )}

                        <p className={`relative z-10 text-[13px] md:text-[15px] leading-[2.2] tracking-[0.15em] md:tracking-[0.2em] whitespace-normal wrap-break-word ${isKeyLine ? 'text-emerald-50 font-normal drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-emerald-100/60 font-light'}`}>
                          {paragraph}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Stage 3: Closing */}
        <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
          <div className={`closing-seal-${event.id} w-px h-16 md:h-24 bg-linear-to-b from-transparent to-emerald-500/50 mb-8 md:mb-12`} />
          <div className={`closing-text-${event.id} text-emerald-200/90 text-sm md:text-lg tracking-[0.8em] md:tracking-[1em] pl-[0.8em] md:pl-[1em] font-light drop-shadow-[0_0_20px_rgba(16,185,129,0.6)] text-center w-full max-w-[90vw] leading-loose wrap-break-word whitespace-normal max-h-[60vh] overflow-y-auto no-scrollbar`}>
            {detail.closing}
          </div>
          <div className={`closing-seal-${event.id} w-px h-16 md:h-24 bg-linear-to-t from-transparent to-emerald-500/50 mt-8 md:mt-12`} />
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
  const dust = sel(`.celestial-dust-${eventId}`);

  const intro = sel(`.scrolly-intro-${eventId}`);
  const titleText = sel(`.title-text-${eventId}`);
  const titleLine = sel(`.title-line-${eventId}`);
  const quoteText = sel(`.quote-text-${eventId}`);

  const bodyContainer = sel(`.scrolly-body-container-${eventId}`);
  const astrolabe = sel(`.astrolabe-${eventId}`);
  const bodyPages = selAll(`.scrolly-body-page-${eventId}`);
  const jadeSlips = selAll(`.jade-slip-${eventId}`);

  const closingContainer = sel(`.scrolly-closing-container-${eventId}`);
  const closingText = sel(`.closing-text-${eventId}`);
  const closingSeals = selAll(`.closing-seal-${eventId}`);

  // Initial States
  tl.set([dust, bodyContainer, astrolabe, closingContainer, ...bodyPages], { opacity: 0 });
  tl.set(titleText, { opacity: 0, y: 30, filter: "blur(12px)" });
  tl.set(titleLine, { scaleY: 0, transformOrigin: "top" });
  tl.set(quoteText, { opacity: 0, y: 20 });
  tl.set(jadeSlips, { opacity: 0, y: 30, scale: 0.95 });
  tl.set(closingText, { opacity: 0, filter: "blur(15px)", scale: 0.9 });
  tl.set(closingSeals, { scaleY: 0, transformOrigin: "center" });

  // Continuous background particle animation
  const particles = selAll(`[class^="dust-particle-${eventId}-"]`);
  particles.forEach((p) => {
    gsap.to(p, {
      y: `-=${80 + Math.random() * 100}px`,
      x: `+=${(Math.random() - 0.5) * 80}px`,
      opacity: Math.random() * 0.6 + 0.2,
      duration: 8 + Math.random() * 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: Math.random() * 5
    });
  });

  // Astrolabe rotation
  if (astrolabe) {
    gsap.to(astrolabe, { rotation: 360, duration: 150, repeat: -1, ease: "none" });
  }

  // 0. Global Entrance - Expanding from a dot via --radius mask
  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "250vmax", duration: 6, ease: "power2.inOut" },
    0
  );

  tl.fromTo(wrapper,
    { opacity: 0 },
    { opacity: 1, duration: 2.5, ease: "power2.out" },
    0.5
  );
  tl.to(dust, { opacity: 1, duration: 3 }, 1);

  // 1. Intro Sequence
  tl.to(titleText, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, ease: "power3.out" }, 1.5)
    .to(titleLine, { scaleY: 1, duration: 2, ease: "power2.inOut" }, "-=1.5")
    .to(quoteText, { opacity: 1, y: 0, duration: 3, ease: "power2.out" }, "-=1")

    // Exit Intro
    .to([titleText, titleLine, quoteText], { opacity: 0, y: -40, filter: "blur(20px)", duration: 3, ease: "power2.inOut", stagger: 0.1 }, "+=4")
    .set(intro, { display: "none" });

  // 2. Astrolabe & Jade Slips (Body)
  tl.set(bodyContainer, { display: "flex", opacity: 1 });
  tl.to(astrolabe, { opacity: 1, duration: 4, ease: "power2.inOut" }, "-=1");

  bodyPages.forEach((page, idx) => {
    const pageSlips = page.querySelectorAll(`.jade-slip-${eventId}`);

    // Show Page
    tl.to(page, { opacity: 1, pointerEvents: "auto", duration: 1.5 }, idx === 0 ? "-=2" : "+=0.5")
      .to(pageSlips, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 2.5,
        stagger: 0.4,
        ease: "power3.out"
      }, "-=1");

    // Hold then Exit
    tl.to(page, {
      opacity: 0,
      y: -40,
      filter: "blur(20px)",
      duration: 2.5,
      ease: "power2.in"
    }, "+=4.5")
      .set(page, { pointerEvents: "none" });
  });

  tl.to(astrolabe, { opacity: 0, scale: 1.2, duration: 3, ease: "power2.in" }, "-=2")
    .set(bodyContainer, { display: "none" });

  // 3. Closing Sequence
  tl.set(closingContainer, { display: "flex", opacity: 1 });

  tl.to(closingSeals, { scaleY: 1, duration: 2, ease: "power2.out" }, "+=0.5")
    .to(closingText, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 3, ease: "power3.out" }, "-=1")

    // Exit Closing Text before global wrapper collapse
    .to([closingText, closingSeals], { opacity: 0, filter: "blur(20px)", duration: 2.5, ease: "power2.in" }, "+=4");

  // 4. Global Exit (Collapse back into the dot)
  tl.to(dust, { opacity: 0, duration: 3 }, "-=2.5");
  tl.to(wrapper,
    { opacity: 0, filter: "blur(20px)", duration: 2.5, ease: "power2.inOut" },
    "-=1.5"
  );
  tl.to(scrollyBg,
    { "--radius": "0px", duration: 5.5, ease: "power2.inOut" },
    "-=2"
  );
}
