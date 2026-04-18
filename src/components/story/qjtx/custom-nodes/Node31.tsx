import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 18%, rgba(244, 244, 245, 0.08) 0%, rgba(30, 41, 59, 0.42) 22%, rgba(2, 6, 23, 0.98) 100%), url(/story/qjtx/31.avif) center/cover no-repeat fixed",
  titleColor: "#f8fafc",
  bodyColor: "#d4d4d8",
  accentColor: "#fbcfe8",
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
  const leftLines = detail.body.slice(0, 8);
  const rightLines = detail.body.slice(8);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(2px 2px at 60px 60px, rgba(255,255,255,0.95), transparent), radial-gradient(3px 3px at 160px 140px, rgba(244,244,245,0.9), transparent), radial-gradient(1px 1px at 240px 220px, rgba(255,255,255,0.9), transparent), radial-gradient(2px 2px at 360px 100px, rgba(251,207,232,0.65), transparent)",
          backgroundSize: "420px 420px",
        }}
      />
      <div
        className={`scrolly-haze-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(248,250,252,0.12), transparent 28%), radial-gradient(circle at 50% 75%, rgba(251,207,232,0.08), transparent 40%)",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="flex w-full max-w-5xl flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="text-[10px] tracking-[0.55em] text-slate-200/45 md:text-[11px]">
              九龙塔夜 · 遗像长悬
            </span>
            <h2
              className={`scrolly-title-${event.id} text-center text-5xl font-serif font-light tracking-[0.38em] md:text-7xl md:tracking-[0.52em] lg:text-8xl`}
              style={{ color: titleColor, paddingLeft: "0.38em" }}
            >
              {detail.title}
            </h2>
            <p
              className={`scrolly-quote-${event.id} text-sm font-light tracking-[0.42em] text-slate-100/75 md:text-lg md:tracking-[0.62em]`}
              style={{ color: bodyColor, paddingLeft: "0.42em" }}
            >
              {detail.quote}
            </p>
          </div>

          <div className={`scrolly-frame-${event.id} relative flex h-[23rem] w-[16rem] items-center justify-center md:h-[28rem] md:w-[19rem]`}>
            <div className="absolute left-1/2 top-0 h-14 w-px -translate-x-1/2 bg-linear-to-b from-slate-200/55 to-transparent" />
            <div className="absolute left-1/2 top-12 h-[calc(100%-3rem)] w-[11rem] -translate-x-1/2 rounded-[2.4rem] border border-slate-100/15 bg-slate-950/35 shadow-[0_0_60px_rgba(15,23,42,0.5)] backdrop-blur-sm md:w-[13rem]" />
            <div className="absolute left-1/2 top-14 h-[calc(100%-4rem)] w-[9rem] -translate-x-1/2 rounded-[2rem] border border-white/8 bg-linear-to-b from-slate-100/8 via-slate-200/4 to-transparent md:w-[11rem]" />
            <div className="absolute left-1/2 top-20 h-[calc(100%-7rem)] w-[8rem] -translate-x-1/2 rounded-[999px] bg-radial-[at_50%_38%] from-white/18 via-white/6 to-transparent blur-[1px] md:w-[9.5rem]" />
            <div
              className={`scrolly-portrait-glow-${event.id} absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl md:h-52 md:w-52`}
              style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)` }}
            />
            <div
              className={`scrolly-veil-left-${event.id} absolute left-1/2 top-16 h-[calc(100%-5rem)] w-20 -translate-x-[95%] rounded-l-[2rem] bg-linear-to-r from-white/8 via-white/3 to-transparent backdrop-blur-[1px] md:w-24`}
            />
            <div
              className={`scrolly-veil-right-${event.id} absolute left-1/2 top-16 h-[calc(100%-5rem)] w-20 translate-x-[-5%] rounded-r-[2rem] bg-linear-to-l from-white/8 via-white/3 to-transparent backdrop-blur-[1px] md:w-24`}
            />
            <div className="absolute left-1/2 top-1/2 h-36 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[45%_45%_38%_38%/32%_32%_58%_58%] border border-white/8 bg-linear-to-b from-white/10 to-transparent shadow-[inset_0_0_24px_rgba(255,255,255,0.06)] md:h-40 md:w-28" />
          </div>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-8 md:px-10`}>
        <div className={`scrolly-chamber-${event.id} grid w-full max-w-7xl grid-cols-1 gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8`}>
          <div className="flex flex-col justify-center gap-3 md:gap-4">
            {leftLines.map((line, index) => {
              const emphasis =
                line.includes("雪夜") ||
                line.includes("九龙塔") ||
                line.includes("画像");

              return (
                <p
                  key={`left-${index}`}
                  className={`scrolly-body-line rounded-[1.4rem] border border-white/8 bg-black/18 px-5 py-4 text-right text-sm leading-[2] tracking-[0.14em] backdrop-blur-sm md:px-6 md:text-[15px] ${emphasis ? "shadow-[0_0_24px_rgba(251,207,232,0.08)]" : ""
                    }`}
                  style={{ color: emphasis ? titleColor : bodyColor }}
                >
                  {line}
                </p>
              );
            })}
          </div>

          <div className="relative hidden items-center justify-center md:flex">
            <div className={`scrolly-core-${event.id} relative flex h-[30rem] w-[15.5rem] items-center justify-center`}>
              <div className="absolute left-1/2 top-0 h-12 w-px -translate-x-1/2 bg-linear-to-b from-white/45 to-transparent" />
              <div className="absolute inset-x-6 top-8 bottom-6 rounded-[2.5rem] border border-white/10 bg-black/22 shadow-[0_0_80px_rgba(15,23,42,0.55)] backdrop-blur-md" />
              <div className="absolute inset-x-11 top-14 bottom-12 rounded-[2rem] border border-white/8 bg-linear-to-b from-white/10 via-white/4 to-transparent" />
              <div className="absolute inset-x-14 top-18 bottom-16 rounded-[999px] bg-radial-[at_50%_35%] from-white/18 via-white/4 to-transparent" />
              <div
                className={`scrolly-core-glow-${event.id} absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl`}
                style={{ background: `radial-gradient(circle, ${accentColor}20 0%, transparent 72%)` }}
              />
              <div className="absolute left-1/2 top-[7rem] h-[14rem] w-28 -translate-x-1/2 rounded-[48%_48%_38%_38%/34%_34%_58%_58%] border border-white/8 bg-linear-to-b from-white/12 to-transparent shadow-[inset_0_0_36px_rgba(255,255,255,0.05)]" />
              <div className="absolute left-1/2 top-[6rem] h-[15rem] w-[4.25rem] -translate-x-[150%] rounded-l-[2.2rem] bg-linear-to-r from-white/10 via-white/4 to-transparent" />
              <div className="absolute left-1/2 top-[6rem] h-[15rem] w-[4.25rem] translate-x-[50%] rounded-r-[2.2rem] bg-linear-to-l from-white/10 via-white/4 to-transparent" />
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.38em] text-slate-200/45">
                七重纱幕 · 一壁遗容
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 md:gap-4">
            {rightLines.map((line, index) => {
              const emphasis =
                line.includes("颜色无双") ||
                line.includes("追随那人而去") ||
                line.includes("史书里");

              return (
                <p
                  key={`right-${index}`}
                  className={`scrolly-body-line rounded-[1.4rem] border border-white/8 bg-black/18 px-5 py-4 text-left text-sm leading-[2] tracking-[0.14em] backdrop-blur-sm md:px-6 md:text-[15px] ${emphasis ? "shadow-[0_0_24px_rgba(251,207,232,0.08)]" : ""
                    }`}
                  style={{ color: emphasis ? "#fce7f3" : bodyColor }}
                >
                  {line}
                </p>
              );
            })}
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
  const intro = scrollyText.querySelector(`.scrolly-intro-${eventId}`);
  const title = scrollyText.querySelector(`.scrolly-title-${eventId}`);
  const quote = scrollyText.querySelector(`.scrolly-quote-${eventId}`);
  const frame = scrollyText.querySelector(`.scrolly-frame-${eventId}`);
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const chamber = scrollyText.querySelector(`.scrolly-chamber-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const core = scrollyText.querySelector(`.scrolly-core-${eventId}`);
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);
  const haze = scrollyText.querySelector(`.scrolly-haze-${eventId}`);
  const veilLeft = scrollyText.querySelector(`.scrolly-veil-left-${eventId}`);
  const veilRight = scrollyText.querySelector(`.scrolly-veil-right-${eventId}`);
  const portraitGlow = scrollyText.querySelector(`.scrolly-portrait-glow-${eventId}`);
  const coreGlow = scrollyText.querySelector(`.scrolly-core-glow-${eventId}`);

  tl.set(
    [
      title,
      quote,
      frame,
      chamber,
      bodyLines,
      core,
      snow,
      haze,
      veilLeft,
      veilRight,
      portraitGlow,
      coreGlow,
    ],
    { opacity: 0 },
  );

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 7, ease: "power2.inOut" },
    0,
  )
    .to([snow, haze], { opacity: 1, duration: 2.8 }, 0.6)
    .fromTo(
      title,
      { opacity: 0, y: 28, filter: "blur(18px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 4, ease: "power3.out" },
      1.2,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 14, letterSpacing: "0.7em", filter: "blur(10px)" },
      { opacity: 1, y: 0, letterSpacing: "0.42em", filter: "blur(0px)", duration: 3.4, ease: "power2.out" },
      1.8,
    )
    .fromTo(
      frame,
      { opacity: 0, scale: 0.94, y: 24, filter: "blur(12px)" },
      { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 3.8, ease: "power2.out" },
      2,
    )
    .fromTo(
      [veilLeft, veilRight, portraitGlow],
      { opacity: 0 },
      { opacity: 1, duration: 2.2, stagger: 0.12, ease: "power2.out" },
      2.2,
    )
    .to([title, quote, frame], { opacity: 0, y: -18, filter: "blur(14px)", duration: 3.2, ease: "power2.inOut" }, "+=2.8")
    .set(intro, { display: "none" })
    .fromTo(
      chamber,
      { opacity: 0, y: 28, scale: 0.98, filter: "blur(12px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      "-=0.2",
    )
    .fromTo(
      core,
      { opacity: 0, scale: 0.94, filter: "blur(8px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      "-=1.8",
    )
    .fromTo(
      coreGlow,
      { opacity: 0 },
      { opacity: 1, duration: 2.4, ease: "power2.out" },
      "-=2.2",
    )
    .fromTo(
      bodyLines,
      { opacity: 0, y: 10, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.08,
        ease: "power2.out",
      },
      "-=1.5",
    )
    .to([bodyLines, chamber, core], { opacity: 0, y: -10, filter: "blur(10px)", duration: 4, ease: "power2.inOut" }, "+=4.8")
    .set(bodyContainer, { display: "none" })
    .to([snow, haze], { opacity: 0, duration: 3.2 }, "-=2.4")
    .to(scrollyBg, { "--radius": "0px", duration: 5.6, ease: "power2.inOut" }, "-=1.8");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "-90px 340px",
      duration: 16,
      repeat: -1,
      ease: "none",
    });
  }

  if (veilLeft && veilRight) {
    gsap.to(veilLeft, {
      x: -8,
      duration: 4.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(veilRight, {
      x: 8,
      duration: 5.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
}
