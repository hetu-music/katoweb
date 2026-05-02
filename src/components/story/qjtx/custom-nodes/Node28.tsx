import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // A warm, aged paper aesthetic for the timeline background
  bg: "#050505", // Handled inside for animations
  titleColor: "#3E2723",
  bodyColor: "#5D4037",
  accentColor: "#8B1818",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50 0 C76 8 92 24 100 50 C92 76 76 92 50 100 C24 92 8 76 0 50 C8 24 24 8 50 0 Z",
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
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>

      {/* Global Wrapper for Entrance/Exit Animations */}
      <div className={`node-wrapper-${event.id} absolute inset-0 opacity-0`}>

        {/* Solid Base Background to block underlying timeline */}
        <div className="absolute inset-0 bg-[#121212] pointer-events-none" />

        {/* Clearer Background Image Context */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/28.avif')] bg-cover bg-center opacity-60 scale-105 pointer-events-none" />

        {/* Center Container for the Scroll */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-2 md:px-12">

          {/* The Scroll Container (Defines max width of paper) */}
          <div className="relative w-full max-w-[1200px] h-[80vh] md:h-[75vh] pointer-events-auto flex items-center justify-center">

            {/* Paper - Animates clipPath to reveal from center */}
            <div
              className={`paper-container-${event.id} absolute inset-0 bg-[#f4e8d1] overflow-x-auto overflow-y-hidden no-scrollbar border-y-[6px] md:border-y-10 border-[#d9c4a5] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(139,24,24,0.05)]`}
              style={{ clipPath: "inset(0 50% 0 50%)" }}
            >
              {/* Paper Textures */}
              <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")` }} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_0%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />

              {/* Inner Content - Authentic Right-to-Left Vertical layout */}
              <div className="relative h-full w-max min-w-full flex flex-row-reverse items-center justify-center gap-12 md:gap-20 px-12 md:px-24 box-border z-10">

                {/* Title */}
                <div className={`content-item-${event.id} [writing-mode:vertical-rl] text-4xl md:text-[4.5rem] text-[#2c1e16] tracking-[0.3em] font-medium shrink-0 max-h-[85%] drop-shadow-sm`}>
                  {detail.title}
                </div>

                {/* Quote */}
                {detail.quote && (
                  <div className={`content-item-${event.id} [writing-mode:vertical-rl] text-sm md:text-[15px] text-[#5d4037] tracking-[0.4em] shrink-0 max-h-[85%]`}>
                    {detail.quote}
                  </div>
                )}

                {/* Body Texts */}
                {detail.body.map((p, i) => (
                  <div key={i} className={`content-item-${event.id} [writing-mode:vertical-rl] text-[14px] md:text-[16px] leading-[2.2] md:leading-[2.5] tracking-[0.25em] text-[#2c1e16] shrink-0 max-h-[75%] wrap-break-word ${p === "……" ? "opacity-50" : "font-light"}`}>
                    {p}
                  </div>
                ))}

                {/* Closing */}
                {detail.closing && (
                  <div className={`content-item-${event.id} [writing-mode:vertical-rl] text-xs md:text-sm tracking-[0.5em] text-[#8B1818] font-bold border-2 border-[#8B1818] px-3 py-4 md:px-4 md:py-6 bg-[#8B1818]/5 shrink-0 max-h-[85%] drop-shadow-[0_0_8px_rgba(139,24,24,0.15)]`}>
                    {detail.closing}
                  </div>
                )}

              </div>
            </div>

            {/* Wooden Rollers */}
            <div className={`left-roller-${event.id} absolute left-1/2 top-[-2%] bottom-[-2%] w-5 md:w-8 rounded-full bg-linear-to-r from-[#1a110b] via-[#4a3525] to-[#1a110b] shadow-[10px_0_20px_rgba(0,0,0,0.6)] z-20 border-x border-[#5D4037]/30`} />
            <div className={`right-roller-${event.id} absolute left-1/2 top-[-2%] bottom-[-2%] w-5 md:w-8 rounded-full bg-linear-to-l from-[#1a110b] via-[#4a3525] to-[#1a110b] shadow-[-10px_0_20px_rgba(0,0,0,0.6)] z-20 border-x border-[#5D4037]/30`} />

          </div>
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
  const paperContainer = sel(`.paper-container-${eventId}`);
  const leftRoller = sel(`.left-roller-${eventId}`);
  const rightRoller = sel(`.right-roller-${eventId}`);
  const contentItems = selAll(`.content-item-${eventId}`);

  // Initial States
  tl.set(wrapper, { opacity: 0 });
  tl.set(paperContainer, { clipPath: "inset(0 50% 0 50%)" });
  tl.set([leftRoller, rightRoller], { xPercent: -50, left: "50%" });
  tl.set(contentItems, { opacity: 0, filter: "blur(10px)" });

  // Helper to sync scroll state
  const updateScroll = (progress: number) => {
    if (!paperContainer || !leftRoller || !rightRoller) return;
    const clipVal = 50 * (1 - progress);
    gsap.set(paperContainer, { clipPath: `inset(0 ${clipVal}% 0 ${clipVal}%)` });
    gsap.set(leftRoller, { left: `${50 - 50 * progress}%` });
    gsap.set(rightRoller, { left: `${50 + 50 * progress}%` });
  };

  // 1. Entrance
  tl.to(wrapper, { opacity: 1, duration: 1.5, ease: "power2.inOut" }, 0);

  // 2. Synchronized Unrolling
  tl.to({ p: 0 }, {
    p: 1,
    duration: 3.5,
    ease: "power3.inOut",
    onUpdate: function () { updateScroll(this.targets()[0].p); }
  }, 1);

  // 3. Ink Content Fade In
  tl.to(contentItems, {
    opacity: 1,
    filter: "blur(0px)",
    duration: 2.5,
    stagger: 0.15,
    ease: "power2.out"
  }, 2.5);

  // 4. Content Fade Out
  tl.to(contentItems, {
    opacity: 0,
    filter: "blur(10px)",
    duration: 2,
    stagger: 0.05,
    ease: "power2.in"
  }, "+=5");

  // 5. Synchronized Rolling Up
  tl.to({ p: 1 }, {
    p: 0,
    duration: 3,
    ease: "power3.inOut",
    onUpdate: function () { updateScroll(this.targets()[0].p); }
  }, "+=0.5");

  // 6. Global Exit
  tl.to(wrapper, { opacity: 0, duration: 1.5, ease: "power2.inOut" }, "+=0.2");
}
