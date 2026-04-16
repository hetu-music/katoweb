import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

// ─── Theme ─────────────────────────────────────────────────────────────────────

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 50%, rgba(20, 10, 15, 0.5) 0%, rgba(5, 2, 4, 0.95) 100%), url(/story/qjtx/39.avif) center/cover no-repeat",
  titleColor: "#e4b5b2",
  bodyColor: "#d4a3a3",
  accentColor: "#995355",
  layout: "vertical",
  specialEffect: "ripple",
  maskPath: "M50,0 A50,50 0 1,1 49.9,0 Z",
};

// ─── Layout Component ──────────────────────────────────────────────────────────

export function NodeLayout({
  event,
  resolvedTheme,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  if (!event.detail) return null;

  const { titleColor, bodyColor, accentColor } = resolvedTheme;

  return (
    <div className={`scrolly-text-${event.id} relative z-10 w-full h-full`}>
      {/* Title & Quote */}
      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <h2
          className={`scrolly-title-${event.id} text-4xl md:text-6xl lg:text-8xl font-serif tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-light`}
          style={{ color: titleColor, textShadow: `0 0 40px ${accentColor}` }}
        >
          {event.detail.title}
        </h2>
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-8 md:mt-16 text-sm md:text-xl font-serif tracking-[0.4em] md:tracking-[0.6em] pl-[0.4em] md:pl-[0.6em]`}
            style={{ color: bodyColor }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse flex-wrap justify-center items-center h-[70vh] [writing-mode:vertical-rl] gap-x-10 md:gap-x-20 w-full max-w-5xl mx-auto px-8 md:px-16 text-sm md:text-xl leading-loose tracking-[0.4em] md:tracking-[0.6em] font-light`}
          style={{ color: bodyColor }}
        >
          {event.detail.body.map((p, i) => (
            <p key={i} className="scrolly-body-line my-4">{p}</p>
          ))}
        </div>
      </div>

      {/* Closing */}
      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center`}>
          {/* 碑体容器 */}
          <div className="relative pt-24 pb-32 px-12 md:px-20 border-t border-x border-white/10 rounded-t-[160px] bg-linear-to-b from-white/3 to-transparent backdrop-blur-xs">
            <p
              className="text-xl md:text-3xl [writing-mode:vertical-rl] tracking-[0.6em] md:tracking-[0.8em] font-serif leading-none opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{ color: "#f8f1e7" }}
            >
              {event.detail.closing}
            </p>

            {/* 底部渐变遮罩，模拟碑体地基消失感 */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-[#050204] to-transparent" />
          </div>

          {/* 装饰性暗影 */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-3xl rounded-full -z-10" />
        </div>
      </div>
    </div>
  );
}

// ─── Animation ─────────────────────────────────────────────────────────────────

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
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);

  tl.set(detailContent, { display: "flex" });

  // 明确初始状态
  tl.set([title, quote, bodyLines, closing], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    // Title - 在背景圆张开至适中大小时入场 (2.2s)
    .fromTo(
      title,
      { opacity: 0, scale: 0.8, filter: "blur(20px)", y: 30 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 3.0, ease: "power3.out" },
      2.2
    )
    // Quote
    .fromTo(
      quote,
      { opacity: 0, y: 20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" },
      "-=1.0"
    )
    // Hold & fade intro
    .to([title, quote], { opacity: 0, filter: "blur(15px)", scale: 1.05, duration: 2.5, ease: "power2.inOut" }, "+=2.5")
    .set(intro, { display: "none" })

    // Body lines
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(10px)", x: 30 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.0, stagger: 0.6, ease: "power2.out" },
      "-=0.5"
    )
    // Fade body
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", duration: 2.5, ease: "power2.inOut" })
    .set(bodyContainer, { display: "none" })

    // Closing
    .fromTo(
      closing,
      { opacity: 0, y: 100, filter: "blur(20px)", scale: 0.98 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 4.0, ease: "power2.out" },
      "+=1.0"
    )
    .to(closing, { opacity: 0, y: -20, filter: "blur(30px)", duration: 4.0, ease: "power2.in" }, "+=6.0")

    // Background
    .to(scrollyBg, { "--radius": "0px", duration: 4.0, ease: "power2.inOut" }, "-=1.5");

  tl.set(detailContent, { display: "none" });
}
