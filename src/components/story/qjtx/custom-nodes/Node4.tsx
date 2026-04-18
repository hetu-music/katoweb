import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at center, rgba(15, 23, 42, 0.6) 0%, rgba(2, 6, 23, 0.95) 100%), url(/story/qjtx/4.avif) center/cover no-repeat fixed",
  titleColor: "#e0f2fe",
  bodyColor: "#bae6fd",
  accentColor: "#38bdf8",
  layout: "vertical",
  specialEffect: "ripple",
  maskPath: "M50,0 C65,20 85,30 100,50 C85,70 65,80 50,100 C35,80 15,70 0,50 C15,30 35,20 50,0 Z", // 菱形/塔形
};

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
      {/* 降雨特效层 */}
      <div 
        className={`scrolly-rain-${event.id} absolute inset-0 pointer-events-none opacity-40 mix-blend-screen`} 
        style={{
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
          backgroundSize: '2px 100px',
          backgroundRepeat: 'repeat'
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative flex flex-col items-center">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center [writing-mode:vertical-rl]`}
            style={{ color: titleColor, textShadow: `0 0 30px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-8 md:mt-16 text-lg md:text-2xl font-serif tracking-[0.4em] md:tracking-[0.6em] text-center max-w-xl leading-relaxed px-4 [writing-mode:vertical-rl]`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            {event.detail.quote}
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse justify-center w-[85vw] h-full max-h-[80vh] mx-auto py-6 md:py-12 text-sm md:text-xl leading-[3] tracking-[0.3em] md:tracking-[0.5em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => (
            <p key={i} className={`scrolly-body-line mx-3 md:mx-6 h-full [writing-mode:vertical-rl] flex items-center`}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-row items-center justify-start pl-12 md:pl-32 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center h-full max-h-[60vh] justify-center`}>
          <div className="relative px-6 py-12 h-full flex items-center border-l border-r border-white/10 bg-linear-to-b from-transparent via-[#38bdf8]/10 to-transparent backdrop-blur-xs shadow-[0_0_40px_rgba(56,189,248,0.1)]">
            <p
              className="text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] pt-[0.6em] md:pt-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [writing-mode:vertical-rl]"
              style={{ color: "#e0f2fe" }}
            >
              {event.detail.closing}
            </p>
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
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const rain = scrollyText.querySelector(`.scrolly-rain-${eventId}`);

  tl.set([title, quote, bodyLines, closing, rain], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.0, ease: "power3.inOut" },
    0
  )
    .to(rain, { opacity: 0.6, duration: 2.0 }, 1.0)
    .fromTo(
      title,
      { opacity: 0, scale: 0.9, filter: "blur(20px)", x: -40 },
      { opacity: 1, scale: 1, filter: "blur(0px)", x: 0, duration: 4.0, ease: "power3.out" },
      1.5
    )
    .fromTo(
      quote,
      { opacity: 0, x: -30, filter: "blur(10px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=2.0"
    )
    .to([title, quote], { opacity: 0, filter: "blur(20px)", scale: 1.05, x: 30, duration: 3.5, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(10px)", x: -25 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.3, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", x: 20, duration: 3.0, ease: "power2.inOut" }, "+=2.0")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, scaleY: 0.8, filter: "blur(15px)" },
      { opacity: 1, scaleY: 1, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, scale: 1.05, filter: "blur(20px)", duration: 5.0, ease: "power2.in" }, "+=4.0")
    .to(rain, { opacity: 0, duration: 3.0 }, "-=3.0")
    .to(scrollyBg, { "--radius": "0px", duration: 5.0, ease: "power2.inOut" }, "-=2.0");

  if (rain) {
    gsap.to(rain, {
      backgroundPosition: "0px 1000px",
      duration: 1.5,
      repeat: -1,
      ease: "none"
    });
  }
}
