import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Lighter background with much less aggressive masking
  // 移除 fixed —— background-attachment:fixed 在移动端不支持且触发每帧重绘
  bg: "radial-gradient(circle at 50% 30%, rgba(24, 24, 27, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url(/story/qjtx/32.avif) center/cover no-repeat",
  titleColor: "#fce7f3",
  bodyColor: "#f5f3ff",
  accentColor: "#f472b6",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C68 8 82 18 92 34 C100 48 100 52 92 66 C82 82 68 92 50 100 C32 92 18 82 8 66 C0 52 0 48 8 34 C18 18 32 8 50 0 Z",
};

export function NodeLayout({
  event,
  resolvedTheme,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  const { titleColor, bodyColor, accentColor } = resolvedTheme;
  const lastLine = detail.body[detail.body.length - 1];
  const dreamLines = detail.body.slice(0, -1);
  const desktopBubbleWidths = [
    "md:max-w-[72%]",
    "md:max-w-[67%]",
    "md:max-w-[62%]",
    "md:max-w-[57%]",
    "md:max-w-[52%]",
  ];

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}
    >
      {/* Ambient Snow / Petals (These fade in *after* the circle expands) */}
      <div
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(3px 3px at 80px 60px, rgba(255,255,255,0.95), transparent), radial-gradient(2px 2px at 180px 140px, rgba(252,231,243,0.9), transparent), radial-gradient(4px 4px at 280px 220px, rgba(255,255,255,0.72), transparent)",
          backgroundSize: "420px 420px",
        }}
      />
      <div
        className={`scrolly-bloom-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 20% 82%, rgba(244,114,182,0.16), transparent 26%), radial-gradient(circle at 80% 80%, rgba(251,207,232,0.12), transparent 28%), radial-gradient(circle at 50% 24%, rgba(255,255,255,0.08), transparent 30%)",
        }}
      />

      {/* Stage 1: Intro */}
      <div
        className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}
      >
        <div className="flex max-w-4xl flex-col items-center text-center">
          <div
            className={`scrolly-moon-${event.id} mb-8 h-28 w-28 rounded-full md:h-36 md:w-36`}
            style={{
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(252,231,243,0.5) 42%, rgba(244,114,182,0.08) 72%, transparent 100%)",
              boxShadow: `0 0 45px ${accentColor}33`,
            }}
          />
          <h2
            className={`scrolly-title-${event.id} text-5xl font-serif font-light tracking-[0.44em] md:text-7xl md:tracking-[0.58em]`}
            style={{ color: titleColor, paddingLeft: "0.44em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-7 text-sm font-light tracking-[0.42em] text-slate-100/80 md:mt-9 md:text-lg md:tracking-[0.58em]`}
            style={{ color: bodyColor, paddingLeft: "0.42em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      {/* Stage 2: The Dream (Pre-Climax lines) */}
      <div
        className={`scrolly-dreamstage-${event.id} absolute inset-0 flex items-center justify-center px-5 py-10 md:px-10 opacity-0`}
      >
        <div className="relative flex w-full max-w-5xl flex-col items-center gap-4 md:gap-5">
          {dreamLines.map((line, index) => (
            <div
              key={index}
              className={`scrolly-body-line w-[min(92vw,40rem)] rounded-[999px] border border-white/10 bg-black/40 px-7 py-4 text-center text-sm leading-[1.95] tracking-[0.18em] text-slate-100/90 shadow-[0_0_24px_rgba(244,114,182,0.06)] md:backdrop-blur-md md:w-auto md:px-8 md:py-4 md:text-[15px] ${desktopBubbleWidths[index] ?? "md:max-w-[52%]"} ${
                index % 2 === 0
                  ? "-translate-x-4 md:-translate-x-14"
                  : "translate-x-4 md:translate-x-14"
              }`}
              style={{ color: bodyColor }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Stage 3: The Climax ("你回来了") */}
      <div
        className={`scrolly-climax-${event.id} absolute inset-0 flex items-center justify-center px-6 opacity-0`}
      >
        <div
          className={`scrolly-final-line-${event.id} rounded-full border border-pink-200/30 bg-linear-to-r from-transparent via-pink-400/20 to-transparent px-8 py-5 text-center text-3xl font-serif tracking-[0.4em] shadow-[0_0_60px_rgba(244,114,182,0.3)] backdrop-blur-md md:px-16 md:py-8 md:text-5xl md:tracking-[0.5em]`}
          style={{ color: titleColor, paddingLeft: "0.4em" }}
        >
          {lastLine}
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

  const intro = sel(`.scrolly-intro-${eventId}`);
  const title = sel(`.scrolly-title-${eventId}`);
  const quote = sel(`.scrolly-quote-${eventId}`);
  const moon = sel(`.scrolly-moon-${eventId}`);

  const dreamstage = sel(`.scrolly-dreamstage-${eventId}`);
  const bodyLines = Array.from(selAll(`.scrolly-body-line`));

  const climaxStage = sel(`.scrolly-climax-${eventId}`);
  const finalLine = sel(`.scrolly-final-line-${eventId}`);

  const snow = sel(`.scrolly-snow-${eventId}`);
  const bloom = sel(`.scrolly-bloom-${eventId}`);
  const isMobile = window.innerWidth < 768;
  const splitIndex = Math.ceil(bodyLines.length / 2);
  const dreamGroup1 = bodyLines.slice(0, splitIndex);
  const dreamGroup2 = bodyLines.slice(splitIndex);

  // Initial States
  tl.set([dreamstage, climaxStage, snow, bloom], { opacity: 0 });
  if (isMobile) {
    tl.set([title, quote, moon, dreamGroup1, finalLine], { opacity: 0 });
    tl.set(dreamGroup2, { display: "none", opacity: 0 });
  } else {
    tl.set([title, quote, moon, bodyLines, finalLine], { opacity: 0 });
  }

  // 1. Background Mask Expansion (Restore original circular expand logic)
  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "250vmax", duration: 6.2, ease: "power2.inOut" },
    0,
  );

  tl.to([snow, bloom], { opacity: 1, duration: 2.6 }, 0.6);

  // 2. Intro Sequence
  tl.fromTo(
    moon,
    { opacity: 0, scale: 0.7, filter: "blur(16px)" },
    {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 3.4,
      ease: "power3.out",
    },
    1.3,
  );
  tl.fromTo(
    title,
    { opacity: 0, y: 20, filter: "blur(16px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 3.6,
      ease: "power3.out",
    },
    1.6,
  );
  tl.fromTo(
    quote,
    { opacity: 0, y: 10, filter: "blur(8px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, ease: "power2.out" },
    2,
  );

  // Exit Intro
  tl.to(
    [moon, title, quote],
    {
      opacity: 0,
      y: -16,
      filter: "blur(12px)",
      duration: 3,
      ease: "power2.inOut",
    },
    "+=2.4",
  );
  tl.set(intro, { display: "none" });

  // 3. The Dream Sequence (Preceding Lines)
  tl.set(dreamstage, { display: "flex", opacity: 1 });
  if (isMobile) {
    tl.fromTo(
      dreamGroup1,
      { opacity: 0, y: 16, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.16,
        ease: "power2.out",
      },
      "-=0.1",
    );
    tl.to(
      dreamGroup1,
      {
        opacity: 0,
        y: -16,
        filter: "blur(12px)",
        duration: 1.8,
        stagger: 0.1,
        ease: "power2.inOut",
      },
      "+=2.4",
    );
    tl.set(dreamGroup1, { display: "none" });
    tl.set(dreamGroup2, { display: "", opacity: 0 });
    tl.fromTo(
      dreamGroup2,
      { opacity: 0, y: 16, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.16,
        ease: "power2.out",
      },
    );
    tl.to(
      dreamGroup2,
      {
        opacity: 0,
        y: -16,
        filter: "blur(12px)",
        duration: 2.1,
        stagger: 0.1,
        ease: "power2.inOut",
      },
      "+=2.6",
    );
  } else {
    tl.fromTo(
      bodyLines,
      { opacity: 0, y: 16, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.16,
        ease: "power2.out",
      },
      "-=0.1",
    );
    tl.to(
      bodyLines,
      {
        opacity: 0,
        y: -16,
        filter: "blur(12px)",
        duration: 2.5,
        stagger: 0.1,
        ease: "power2.inOut",
      },
      "+=3",
    );
  }
  tl.set(dreamstage, { display: "none" });

  // 4. The Climax ("你回来了")
  tl.set(climaxStage, { display: "flex", opacity: 1 });

  // Dramatic, slow entrance for maximum impact in the dead center
  tl.fromTo(
    finalLine,
    { opacity: 0, scale: 0.8, filter: "blur(20px)" },
    {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 4,
      ease: "power3.out",
    },
    "+=0.5",
  );

  // Allow the climax to linger, then fade it out
  tl.to(
    finalLine,
    {
      opacity: 0,
      scale: 1.1,
      filter: "blur(15px)",
      duration: 3,
      ease: "power2.in",
    },
    "+=3.5",
  );
  tl.set(climaxStage, { display: "none" });

  // 5. Global Exit (Collapse Mask back to dot)
  tl.to([snow, bloom], { opacity: 0, duration: 2.8 }, "-=2.6");
  tl.to(
    scrollyBg,
    { "--radius": "0px", duration: 5.4, ease: "power2.inOut" },
    "-=1.6",
  );

  // Continuous background animation
  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "0px 560px",
      duration: 14,
      repeat: -1,
      ease: "none",
    });
  }
}
