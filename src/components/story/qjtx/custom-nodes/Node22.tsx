import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at bottom, rgba(8, 47, 73, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%), url(/story/qjtx/22.avif) center/cover no-repeat fixed",
  titleColor: "#bae6fd",
  bodyColor: "#e0f2fe",
  accentColor: "#0ea5e9",
  layout: "horizontal",
  specialEffect: "ripple",
  maskPath: "M0,50 Q25,25 50,50 T100,50 T150,50 L150,150 L0,150 Z", // 波浪状
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
      {/* 飘雪/飘柳絮特效 */}
      <div 
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-60 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(3px 3px at 50px 50px, #ffffff, transparent), radial-gradient(4px 4px at 150px 150px, #bae6fd, transparent), radial-gradient(2px 2px at 250px 250px, #ffffff, transparent), radial-gradient(3px 3px at 350px 350px, #e0f2fe, transparent)',
          backgroundSize: '400px 400px',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-7xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center`}
            style={{ color: titleColor, textShadow: `0 0 30px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
          <div className={`scrolly-glow-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-[#0ea5e9]/10 blur-3xl rounded-full -z-10`} />
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-20 text-lg md:text-2xl font-serif tracking-[0.4em] md:tracking-[0.6em] pl-[0.4em] md:pl-[0.6em] text-center max-w-2xl leading-relaxed px-4`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-col justify-center h-[85vh] w-full max-w-4xl mx-auto px-6 md:px-12 text-sm md:text-lg leading-[2.6] tracking-[0.2em] md:tracking-[0.3em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => {
            const isCenter = p === "……";
            const alignClass = isCenter ? "text-center opacity-30 my-8" : "text-left pl-4 md:pl-16 pr-4";
            return (
              <p key={i} className={`scrolly-body-line my-3 md:my-5 w-full ${alignClass}`}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center w-full max-w-3xl`}>
          <div className="relative py-6 px-12 md:px-24 w-full flex justify-center border-t border-[#bae6fd]/20 bg-linear-to-b from-[#0ea5e9]/10 to-transparent backdrop-blur-xs">
            <p
              className="text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{ color: "#bae6fd" }}
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
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);

  tl.set([title, quote, bodyLines, closing, snow], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.5, ease: "power2.inOut" },
    0
  )
    .to(snow, { opacity: 0.8, duration: 2.0 }, 1.0)
    .fromTo(
      title,
      { opacity: 0, filter: "blur(15px)", y: 30 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power2.out" },
      2.0
    )
    .fromTo(
      quote,
      { opacity: 0, filter: "blur(10px)" },
      { opacity: 1, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=2.0"
    )
    .to([title, quote], { opacity: 0, filter: "blur(20px)", y: -30, duration: 3.5, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(8px)", x: -20 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.3, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(12px)", x: 20, duration: 3.0, ease: "power2.inOut" }, "+=2.5")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, y: 50, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, y: 30, filter: "blur(20px)", duration: 4.5, ease: "power2.in" }, "+=3.5")
    .to(snow, { opacity: 0, duration: 3.0 }, "-=3.0")
    .to(scrollyBg, { "--radius": "0px", duration: 5.5, ease: "power2.inOut" }, "-=2.0");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "200px 400px",
      duration: 15,
      repeat: -1,
      ease: "none"
    });
  }
}
