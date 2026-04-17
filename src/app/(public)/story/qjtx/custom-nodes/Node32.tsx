import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 30% 70%, rgba(63, 63, 70, 0.6) 0%, rgba(9, 9, 11, 0.95) 100%), url(/story/qjtx/32.avif) center/cover no-repeat fixed",
  titleColor: "#fce7f3",
  bodyColor: "#e4e4e7",
  accentColor: "#f472b6",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50,0 C60,40 100,50 60,60 C50,100 40,60 0,50 C40,40 50,0 50,0 Z", // 四芒星/雪花变体
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
      {/* 雪落塔顶特效 */}
      <div 
        className={`scrolly-dream-snow-${event.id} absolute inset-0 pointer-events-none opacity-50 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(4px 4px at 100px 50px, #fce7f3, transparent), radial-gradient(2px 2px at 200px 150px, #ffffff, transparent), radial-gradient(3px 3px at 300px 250px, #fbcfe8, transparent)',
          backgroundSize: '400px 400px',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.6em] md:tracking-[0.8em] pl-[0.6em] md:pl-[0.8em] font-light relative z-10 text-center`}
            style={{ color: titleColor, textShadow: `0 0 40px ${accentColor}, 0 2px 10px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
          <div className={`scrolly-glow-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#f472b6]/10 blur-[60px] rounded-full -z-10`} />
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-24 text-lg md:text-2xl font-serif tracking-[0.5em] md:tracking-[0.7em] pl-[0.5em] md:pl-[0.7em] text-center max-w-3xl leading-relaxed px-4`}
            style={{ color: bodyColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-col justify-center h-[85vh] w-full max-w-4xl mx-auto px-6 md:px-16 text-base md:text-xl leading-[3] tracking-[0.3em] md:tracking-[0.4em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => {
            const isLast = i === event.detail.body.length - 1;
            const alignClass = isLast ? "text-center mt-12 text-2xl md:text-4xl text-[#fce7f3] drop-shadow-[0_0_15px_rgba(244,114,182,0.5)]" : "text-center";
            return (
              <p key={i} className={`scrolly-body-line my-4 md:my-6 w-full ${alignClass}`}>
                {p}
              </p>
            );
          })}
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
  const snow = scrollyText.querySelector(`.scrolly-dream-snow-${eventId}`);
  const glow = scrollyText.querySelector(`.scrolly-glow-${eventId}`);

  tl.set([title, quote, bodyLines, snow, glow], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    .to(snow, { opacity: 0.7, duration: 2.5 }, 1.0)
    .to(glow, { opacity: 1, duration: 3.0 }, 1.5)
    .fromTo(
      title,
      { opacity: 0, scale: 0.9, filter: "blur(20px)", y: 20 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 4.5, ease: "power3.out" },
      2.0
    )
    .fromTo(
      quote,
      { opacity: 0, y: 30, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 4.0, ease: "power2.out" },
      "-=2.5"
    )
    .to([title, quote, glow], { opacity: 0, filter: "blur(25px)", scale: 1.05, y: -30, duration: 4.0, ease: "power2.inOut" }, "+=4.0")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(12px)", scale: 0.95 },
      { opacity: 1, filter: "blur(0px)", scale: 1, duration: 3.0, stagger: 0.6, ease: "power2.out" },
      "-=1.0"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", scale: 1.05, duration: 4.0, ease: "power2.inOut" }, "+=5.0")
    .set(bodyContainer, { display: "none" })
    .to(snow, { opacity: 0, duration: 4.0 }, "-=3.0")
    .to(scrollyBg, { "--radius": "0px", duration: 6.0, ease: "power2.inOut" }, "-=2.0");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "0px 600px",
      duration: 15,
      repeat: -1,
      ease: "none"
    });
  }
}
