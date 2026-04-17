import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

// ─── Theme ─────────────────────────────────────────────────────────────────────

export const theme: ImmersiveTheme = {
  // 凄美、哀婉的暖暗色调，海棠花与深海的结合
  bg: "radial-gradient(circle at 50% 50%, rgba(30, 15, 20, 0.6) 0%, rgba(5, 2, 4, 0.95) 100%), url(/story/qjtx/39.avif) center/cover no-repeat",
  titleColor: "#e4b5b2", // 柔和的海棠粉
  bodyColor: "#d4a3a3",
  accentColor: "#995355", // 较深的海棠红
  layout: "horizontal", // 改为水平排版，与 23 的竖排做出显著区分
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
      {/* 海棠花瓣飘落/海波光影视觉层 */}
      <div 
        className={`scrolly-petals-${event.id} absolute inset-0 pointer-events-none opacity-30 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(4px 2px at 150px 50px, #e4b5b2, transparent), radial-gradient(3px 3px at 250px 150px, #d4a3a3, transparent), radial-gradient(5px 2px at 350px 250px, #e4b5b2, transparent), radial-gradient(2px 4px at 50px 350px, #d4a3a3, transparent), radial-gradient(4px 3px at 450px 100px, #e4b5b2, transparent)',
          backgroundSize: '500px 500px'
        }}
      />

      {/* Title & Quote */}
      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-4xl md:text-6xl lg:text-8xl font-serif tracking-[0.4em] md:tracking-[0.6em] pl-[0.4em] md:pl-[0.6em] font-light relative z-10 text-center`}
            style={{ color: titleColor, textShadow: `0 0 50px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#995355]/10 blur-3xl rounded-full -z-10" />
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-20 text-sm md:text-xl font-serif tracking-[0.4em] md:tracking-[0.6em] pl-[0.4em] md:pl-[0.6em] text-center max-w-2xl leading-relaxed px-4`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      {/* Body - 水平错落排版，类似诗歌或散文 */}
      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-col justify-center h-[85vh] w-full max-w-4xl mx-auto px-6 md:px-12 text-xs md:text-lg leading-[2.5] tracking-[0.2em] md:tracking-[0.4em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => {
            const isCenter = p === "……";
            // 左右交替错落，营造如海浪般起伏、如回忆般零散的排版韵律
            const alignClass = isCenter 
              ? "text-center pl-0 pr-0 opacity-30" 
              : (i % 2 === 0 ? "text-left pl-4 md:pl-16 pr-12 md:pr-32" : "text-right pr-4 md:pr-16 pl-12 md:pl-32");
            return (
              <p key={i} className={`scrolly-body-line my-3 md:my-5 w-full ${alignClass}`}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      {/* Closing - 横向舒展的结语，如同宽阔的海岸线 */}
      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center w-full max-w-3xl`}>
          <div className="relative py-6 px-8 md:px-16 w-full flex justify-center border-t border-b border-white/10 bg-linear-to-r from-transparent via-[#995355]/20 to-transparent backdrop-blur-xs shadow-[0_0_40px_rgba(153,83,85,0.1)]">
            <p
              className="text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{ color: "#f8f1e7" }}
            >
              {event.detail.closing}
            </p>
          </div>
          {/* 背景幽光 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-[#e4b5b2]/10 blur-3xl rounded-full -z-10" />
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
  const petals = scrollyText.querySelector(`.scrolly-petals-${eventId}`);

  tl.set([title, quote, bodyLines, closing, petals], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    // 海棠花瓣淡入
    .to(petals, { opacity: 0.5, duration: 2.0 }, 1.0)
    
    // Title - 柔和的浮现，从下往上飘起
    .fromTo(
      title,
      { opacity: 0, scale: 0.9, filter: "blur(15px)", y: 40 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power3.out" },
      2.0
    )
    // Quote - 像水波一样漾出
    .fromTo(
      quote,
      { opacity: 0, y: 30, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=2.0"
    )
    // Hold & fade intro - 如梦初醒地消散，轻盈地向上飘走
    .to([title, quote], { opacity: 0, filter: "blur(20px)", scale: 1.05, y: -30, duration: 3.5, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" })

    // Body lines - 水平错落的诗意展现，像深海气泡或散落的记忆一样浮现
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(8px)", y: 25 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" },
      "-=0.5"
    )
    // Fade body
    .to(bodyLines, { opacity: 0, filter: "blur(12px)", y: -20, duration: 3.0, ease: "power2.inOut" }, "+=2.0")
    .set(bodyContainer, { display: "none" })

    // Closing - 横向铺开，如同宽阔的海岸线
    .fromTo(
      closing,
      { opacity: 0, scaleX: 0.8, filter: "blur(15px)" },
      { opacity: 1, scaleX: 1, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=0.5"
    )
    // 漫长的淡出
    .to(closing, { opacity: 0, scale: 1.05, filter: "blur(20px)", duration: 5.0, ease: "power2.in" }, "+=4.0")
    
    // 背景与特效消散
    .to(petals, { opacity: 0, duration: 3.0 }, "-=3.0")
    .to(scrollyBg, { "--radius": "0px", duration: 5.0, ease: "power2.inOut" }, "-=2.0");

  // 独立的海棠花瓣飘落动画循环
  if (petals) {
    // 模拟斜向飘落的风起意境
    gsap.to(petals, {
      backgroundPosition: "-200px 500px, -250px 500px, -150px 500px, -300px 500px, -100px 500px",
      duration: 25,
      repeat: -1,
      ease: "none"
    });
  }
}
