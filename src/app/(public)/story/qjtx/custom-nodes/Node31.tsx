import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 70% 30%, rgba(30, 41, 59, 0.7) 0%, rgba(2, 6, 23, 1) 100%), url(/story/qjtx/31.avif) center/cover no-repeat fixed",
  titleColor: "#f8fafc",
  bodyColor: "#cbd5e1",
  accentColor: "#94a3b8",
  layout: "vertical",
  specialEffect: "none",
  maskPath: "M50,0 L100,50 L50,100 L0,50 Z", // 菱形
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
      {/* 静谧雪夜特效 */}
      <div 
        className={`scrolly-snow-night-${event.id} absolute inset-0 pointer-events-none opacity-40 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 40px 40px, #ffffff, transparent), radial-gradient(1px 1px at 120px 120px, #ffffff, transparent), radial-gradient(3px 3px at 200px 200px, #cbd5e1, transparent)',
          backgroundSize: '300px 300px',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative flex flex-col items-center">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center [writing-mode:vertical-rl]`}
            style={{ color: titleColor, textShadow: `0 0 25px ${accentColor}, 0 2px 10px rgba(0,0,0,0.9)` }}
          >
            {event.detail.title}
          </h2>
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-10 md:mt-20 text-lg md:text-2xl font-serif tracking-[0.4em] md:tracking-[0.6em] text-center max-w-xl leading-relaxed px-4 [writing-mode:vertical-rl]`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            {event.detail.quote}
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse justify-center w-[85vw] h-full max-h-[80vh] mx-auto py-8 md:py-16 text-sm md:text-xl leading-[3.5] tracking-[0.4em] md:tracking-[0.6em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
        >
          {event.detail.body.map((p, i) => (
            <p key={i} className={`scrolly-body-line mx-4 md:mx-8 h-full [writing-mode:vertical-rl] flex items-center opacity-80 hover:opacity-100 transition-opacity duration-500`}>
              {p}
            </p>
          ))}
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
  const snow = scrollyText.querySelector(`.scrolly-snow-night-${eventId}`);

  tl.set([title, quote, bodyLines, snow], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    .to(snow, { opacity: 0.6, duration: 2.0 }, 1.5)
    .fromTo(
      title,
      { opacity: 0, filter: "blur(20px)", x: 40 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 4.5, ease: "power2.out" },
      2.0
    )
    .fromTo(
      quote,
      { opacity: 0, x: 20, filter: "blur(10px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=2.0"
    )
    .to([title, quote], { opacity: 0, filter: "blur(25px)", x: -30, duration: 4.0, ease: "power2.inOut" }, "+=3.5")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(15px)", y: 20 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 3.0, stagger: 0.4, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(20px)", y: -20, duration: 4.0, ease: "power2.inOut" }, "+=4.0")
    .set(bodyContainer, { display: "none" })
    .to(snow, { opacity: 0, duration: 3.0 }, "-=2.0")
    .to(scrollyBg, { "--radius": "0px", duration: 6.0, ease: "power2.inOut" }, "-=1.5");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "-100px 300px",
      duration: 20,
      repeat: -1,
      ease: "none"
    });
  }
}
