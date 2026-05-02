import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

// ─── Theme ─────────────────────────────────────────────────────────────────────

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 50%, rgba(15, 18, 25, 0.4) 0%, rgba(5, 7, 10, 0.95) 100%), url(/story/qjtx/23.avif) center/cover no-repeat",
  titleColor: "#e2e8f0",
  bodyColor: "#94a3b8",
  accentColor: "#991b1b",
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
    <div className={`scrolly-text-${event.id} relative z-10 w-full h-full overflow-hidden`}>
      <div
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-40 mix-blend-screen`}
        style={{
          backgroundImage: 'radial-gradient(3px 3px at 100px 50px, #ffffff, transparent), radial-gradient(4px 4px at 200px 150px, rgba(255,255,255,0.8), transparent), radial-gradient(2px 2px at 300px 250px, #ffffff, transparent), radial-gradient(5px 5px at 400px 350px, rgba(255,200,200,0.5), transparent), radial-gradient(3px 3px at 500px 100px, #ffffff, transparent)',
          backgroundSize: '600px 600px'
        }}
      />

      {/* Title & Quote */}
      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-7xl lg:text-9xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10`}
            style={{ color: titleColor, textShadow: `0 0 40px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
          <div className={`scrolly-glow-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-red-900/20 blur-3xl -z-10`} />
        </div>

        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-24 text-base md:text-2xl font-serif tracking-[0.6em] md:tracking-[1em] pl-[0.6em] md:pl-[1em]`}
            style={{ color: titleColor, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse flex-wrap justify-center items-center h-[75vh] [writing-mode:vertical-rl] gap-x-12 md:gap-x-24 w-full max-w-6xl mx-auto px-6 md:px-12 text-sm md:text-xl leading-loose tracking-[0.4em] md:tracking-[0.6em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => (
            <p key={i} className={`scrolly-body-line my-4 ${p === "……" ? "opacity-30" : ""}`}>{p}</p>
          ))}
        </div>
      </div>

      {/* Closing */}
      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex items-center justify-center pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center`}>
          <div className="relative py-16 px-12 md:px-20 bg-linear-to-b from-black/80 to-transparent border-t-4 border-l-2 border-r-2 border-[#991b1b]/30 backdrop-blur-sm shadow-[0_0_50px_rgba(153,27,27,0.2)]">
            <p
              className="text-2xl md:text-4xl [writing-mode:vertical-rl] tracking-[0.8em] md:tracking-[1em] font-serif leading-none opacity-90 drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
              style={{ color: titleColor }}
            >
              {event.detail.closing}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#05070a] to-transparent" />
          </div>
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
  const bodyLines = Array.from(scrollyText.querySelectorAll<HTMLElement>(`.scrolly-body-line`));
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);
  const glow = scrollyText.querySelector(`.scrolly-glow-${eventId}`);

  // timeline 构建时检测一次，scrub 动画不存在 resize 问题
  const isMobile = window.innerWidth < 768;

  // ─── 初始状态 ───────────────────────────────────────────────────────────────

  if (isMobile) {
    const mid = Math.ceil(bodyLines.length / 2);
    const group1 = bodyLines.slice(0, mid);
    const group2 = bodyLines.slice(mid);

    // group2 从布局中移除，避免移动端水平溢出
    tl.set([title, quote, ...group1, closing, snow, glow], { opacity: 0 });
    tl.set(group2, { display: "none", opacity: 0 });
  } else {
    tl.set([title, quote, bodyLines, closing, snow, glow], { opacity: 0 });
  }

  // ─── 通用：背景 + 雪 + 标题 + 题词 ────────────────────────────────────────

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    .to(snow, { opacity: 0.6, duration: 2.0 }, 1.0)

    .fromTo(
      title,
      { opacity: 0, scale: 0.9, filter: "blur(20px)", y: 30 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power3.out" },
      2.0
    )
    .fromTo(
      quote,
      { opacity: 0, y: 20, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.0, ease: "power2.out" },
      "-=1.5"
    )
    .to([title, quote], { opacity: 0, filter: "blur(15px)", scale: 1.05, duration: 3.0, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" });

  // ─── Body：桌面端全量，移动端分两批 ────────────────────────────────────────

  if (isMobile) {
    const mid = Math.ceil(bodyLines.length / 2);
    const group1 = bodyLines.slice(0, mid);
    const group2 = bodyLines.slice(mid);

    tl
      // 第一批入场
      .fromTo(
        group1,
        { opacity: 0, filter: "blur(12px)", x: -30 },
        { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" },
        "-=0.5"
      )
      // 第一批退场，同时将其从布局中移除
      .to(group1, { opacity: 0, filter: "blur(15px)", duration: 1.5, ease: "power2.inOut" }, "+=1.2")
      .set(group1, { display: "none" })
      // 将第二批放回布局流，再入场
      .set(group2, { display: "", opacity: 0 })
      .fromTo(
        group2,
        { opacity: 0, filter: "blur(12px)", x: -30 },
        { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" },
      )
      // 第二批退场
      .to(group2, { opacity: 0, filter: "blur(15px)", duration: 2.5, ease: "power2.inOut" }, "+=1.5");
  } else {
    tl
      .fromTo(
        bodyLines,
        { opacity: 0, filter: "blur(12px)", x: -30 },
        { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.5, ease: "power2.out" },
        "-=0.5"
      )
      .to(bodyLines, { opacity: 0, filter: "blur(15px)", duration: 2.5, ease: "power2.inOut" }, "+=1.5");
  }

  // ─── 通用：Closing + 收尾 ───────────────────────────────────────────────────

  tl
    .set(bodyContainer, { display: "none" })

    .fromTo(
      closing,
      { opacity: 0, y: 50, filter: "blur(20px)", scale: 0.95 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 3.5, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, y: -20, filter: "blur(30px)", duration: 4.0, ease: "power2.in" }, "+=5.0")

    .to(snow, { opacity: 0, duration: 2.0 }, "-=2.0")
    .to(scrollyBg, { "--radius": "0px", duration: 4.0, ease: "power2.inOut" }, "-=1.5");

  // ─── 雪花循环（独立于主 tl，不受 scrub 影响）──────────────────────────────

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "0px 600px, 0px 600px, 0px 600px, 0px 600px, 0px 600px",
      duration: 30,
      repeat: -1,
      ease: "none",
    });
  }
}