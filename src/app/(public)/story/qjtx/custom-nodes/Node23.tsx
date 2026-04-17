import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

// ─── Theme ─────────────────────────────────────────────────────────────────────

export const theme: ImmersiveTheme = {
  // 冷峻、铁血、悲壮的暗色调，以雪和战火为意象
  bg: "radial-gradient(circle at 50% 50%, rgba(15, 18, 25, 0.4) 0%, rgba(5, 7, 10, 0.95) 100%), url(/story/qjtx/23.avif) center/cover no-repeat",
  titleColor: "#e2e8f0", // slate-200 寒冷的雪色
  bodyColor: "#94a3b8", // slate-400
  accentColor: "#991b1b", // red-800 战火与鲜血的暗红
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
      {/* 飘雪与战火余烬的视觉层 */}
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
          {/* 刀剑划痕/战火背景光晕 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-red-900/20 blur-3xl -z-10" />
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
          {/* 城门/断壁残垣的意象容器 */}
          <div className="relative py-16 px-12 md:px-20 bg-linear-to-b from-black/80 to-transparent border-t-4 border-l-2 border-r-2 border-[#991b1b]/30 backdrop-blur-sm shadow-[0_0_50px_rgba(153,27,27,0.2)]">
            <p
              className="text-2xl md:text-4xl [writing-mode:vertical-rl] tracking-[0.8em] md:tracking-[1em] font-serif leading-none opacity-90 drop-shadow-[0_4px_8px_rgba(0,0,0,1)]"
              style={{ color: titleColor }}
            >
              {event.detail.closing}
            </p>
            {/* 血迹/战火渐变遮罩 */}
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
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);

  tl.set(detailContent, { display: "flex" });
  tl.set([title, quote, bodyLines, closing, snow], { opacity: 0 });

  // 背景扩散
  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    // 雪/余烬淡入
    .to(snow, { opacity: 0.6, duration: 2.0 }, 1.0)
    
    // Title - 沉重、缓慢的显现
    .fromTo(
      title,
      { opacity: 0, scale: 0.9, filter: "blur(20px)", y: 30 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power3.out" },
      2.0
    )
    // Quote
    .fromTo(
      quote,
      { opacity: 0, y: 20, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.0, ease: "power2.out" },
      "-=1.5"
    )
    // Hold & fade intro - 悲壮地消散
    .to([title, quote], { opacity: 0, filter: "blur(15px)", scale: 1.05, duration: 3.0, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" })

    // Body lines - 如同史书徐徐展开
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(12px)", x: -30 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.5, ease: "power2.out" },
      "-=0.5"
    )
    // Fade body
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", duration: 2.5, ease: "power2.inOut" }, "+=1.5")
    .set(bodyContainer, { display: "none" })

    // Closing - 像城墙/墓碑一样沉重地落下
    .fromTo(
      closing,
      { opacity: 0, y: 50, filter: "blur(20px)", scale: 0.95 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 3.5, ease: "power2.out" },
      "-=0.5"
    )
    // 渐隐收尾
    .to(closing, { opacity: 0, y: -20, filter: "blur(30px)", duration: 4.0, ease: "power2.in" }, "+=5.0")
    
    // 背景与特效消散
    .to(snow, { opacity: 0, duration: 2.0 }, "-=2.0")
    .to(scrollyBg, { "--radius": "0px", duration: 4.0, ease: "power2.inOut" }, "-=1.5");
  
  // 独立的雪花下落动画循环
  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "0px 600px, 0px 600px, 0px 600px, 0px 600px, 0px 600px",
      duration: 30,
      repeat: -1,
      ease: "none"
    });
  }

  tl.set(detailContent, { display: "none" });
}
