import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 100%, rgba(63, 39, 0, 0.7) 0%, rgba(12, 10, 9, 0.95) 100%), url(/story/qjtx/38.avif) center/cover no-repeat fixed",
  titleColor: "#fef08a",
  bodyColor: "#d6d3d1",
  accentColor: "#d97706",
  layout: "horizontal",
  specialEffect: "ripple",
  maskPath: "M50,0 A50,50 0 1,1 49.9,0 Z", // 圆形
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
      {/* 暖阳光斑特效 */}
      <div 
        className={`scrolly-sunlight-${event.id} absolute inset-0 pointer-events-none opacity-30 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #fef08a 0%, transparent 20%), radial-gradient(circle at 80% 60%, #d97706 0%, transparent 30%)',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-7xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center`}
            style={{ color: titleColor, textShadow: `0 0 35px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
          <div className={`scrolly-glow-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#d97706]/15 blur-[50px] rounded-full -z-10`} />
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-24 text-lg md:text-2xl font-serif tracking-[0.4em] md:tracking-[0.6em] pl-[0.4em] md:pl-[0.6em] text-center max-w-2xl leading-relaxed px-4`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,1)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-col justify-center h-[85vh] w-full max-w-4xl mx-auto px-6 md:px-12 text-sm md:text-lg leading-[2.6] tracking-[0.2em] md:tracking-[0.3em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
        >
          {event.detail.body.map((p, i) => {
            const isCenter = p === "……";
            const alignClass = isCenter ? "text-center opacity-30 my-6" : "text-left pl-6 md:pl-16 pr-6 border-l-2 border-[#d97706]/30";
            return (
              <p key={i} className={`scrolly-body-line my-4 md:my-6 w-full ${alignClass}`}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-end pb-20 md:pb-32 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center w-full max-w-3xl`}>
          <div className="relative py-6 px-10 md:px-20 w-full flex justify-center bg-linear-to-r from-transparent via-[#d97706]/20 to-transparent border-t border-b border-[#fef08a]/20 backdrop-blur-xs">
            <p
              className="text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              style={{ color: "#fef08a" }}
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
  const sunlight = scrollyText.querySelector(`.scrolly-sunlight-${eventId}`);

  tl.set([title, quote, bodyLines, closing, sunlight], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.5, ease: "power2.inOut" },
    0
  )
    .to(sunlight, { opacity: 0.6, duration: 3.0 }, 1.0)
    .fromTo(
      title,
      { opacity: 0, filter: "blur(20px)", scale: 0.9 },
      { opacity: 1, filter: "blur(0px)", scale: 1, duration: 4.5, ease: "power2.out" },
      1.5
    )
    .fromTo(
      quote,
      { opacity: 0, y: 30, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=2.5"
    )
    .to([title, quote], { opacity: 0, filter: "blur(20px)", scale: 1.05, duration: 4.0, ease: "power2.inOut" }, "+=4.0")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(10px)", x: -20 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.3, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", x: 20, duration: 3.5, ease: "power2.inOut" }, "+=3.5")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, filter: "blur(15px)", y: 40 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, filter: "blur(20px)", y: 20, duration: 4.5, ease: "power2.in" }, "+=4.0")
    .to(sunlight, { opacity: 0, duration: 4.0 }, "-=3.0")
    .to(scrollyBg, { "--radius": "0px", duration: 5.5, ease: "power2.inOut" }, "-=2.0");

  if (sunlight) {
    gsap.to(sunlight, {
      opacity: 0.8,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
}
