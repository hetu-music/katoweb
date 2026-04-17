import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at center, rgba(20, 83, 45, 0.6) 0%, rgba(2, 6, 23, 0.95) 100%), url(/story/qjtx/9.avif) center/cover no-repeat fixed",
  titleColor: "#bbf7d0",
  bodyColor: "#e2e8f0",
  accentColor: "#4ade80",
  layout: "vertical",
  specialEffect: "none",
  maskPath: "M50,0 Q75,25 100,50 Q75,75 50,100 Q25,75 0,50 Q25,25 50,0 Z", // 柳叶/花瓣
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
      {/* 春风拂柳特效 */}
      <div 
        className={`scrolly-spring-${event.id} absolute inset-0 pointer-events-none opacity-40 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 100px 100px, #4ade80, transparent), radial-gradient(3px 1px at 300px 200px, #bbf7d0, transparent), radial-gradient(2px 3px at 150px 350px, #4ade80, transparent)',
          backgroundSize: '400px 400px',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative flex flex-col items-center">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center [writing-mode:vertical-rl]`}
            style={{ color: titleColor, textShadow: `0 0 25px ${accentColor}, 0 2px 8px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-10 md:mt-20 text-lg md:text-2xl font-serif tracking-[0.4em] md:tracking-[0.6em] text-center max-w-xl leading-relaxed px-4 [writing-mode:vertical-rl]`}
            style={{ color: bodyColor, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
          >
            {event.detail.quote}
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse justify-center w-[85vw] h-full max-h-[80vh] mx-auto py-8 md:py-16 text-sm md:text-xl leading-[3.2] tracking-[0.4em] md:tracking-[0.6em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => {
             const isCenter = p === "……";
             const opacityClass = isCenter ? "opacity-30" : "opacity-90 hover:opacity-100 transition-opacity";
            return (
              <p key={i} className={`scrolly-body-line mx-3 md:mx-6 h-full [writing-mode:vertical-rl] flex items-center ${opacityClass}`}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-row items-center justify-start pl-12 md:pl-32 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center h-full max-h-[50vh] justify-center`}>
          <div className="relative px-6 py-12 h-full flex items-center bg-[#4ade80]/10 backdrop-blur-xs rounded-full shadow-[0_0_40px_rgba(74,222,128,0.15)]">
            <p
              className="text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] pt-[0.6em] md:pt-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [writing-mode:vertical-rl]"
              style={{ color: "#bbf7d0" }}
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
  const spring = scrollyText.querySelector(`.scrolly-spring-${eventId}`);

  tl.set([title, quote, bodyLines, closing, spring], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.5, ease: "power2.inOut" },
    0
  )
    .to(spring, { opacity: 0.7, duration: 2.0 }, 1.0)
    .fromTo(
      title,
      { opacity: 0, filter: "blur(15px)", y: -30 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power2.out" },
      1.5
    )
    .fromTo(
      quote,
      { opacity: 0, y: -20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=2.0"
    )
    .to([title, quote], { opacity: 0, filter: "blur(20px)", y: 40, duration: 3.5, ease: "power2.inOut" }, "+=3.5")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(10px)", x: 20 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 2.5, stagger: 0.3, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", x: -20, duration: 3.0, ease: "power2.inOut" }, "+=3.0")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, filter: "blur(15px)", scale: 0.9 },
      { opacity: 1, filter: "blur(0px)", scale: 1, duration: 4.0, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, filter: "blur(20px)", scale: 1.1, duration: 4.5, ease: "power2.in" }, "+=3.5")
    .to(spring, { opacity: 0, duration: 3.0 }, "-=2.5")
    .to(scrollyBg, { "--radius": "0px", duration: 5.5, ease: "power2.inOut" }, "-=2.0");

  if (spring) {
    gsap.to(spring, {
      backgroundPosition: "200px -200px",
      duration: 15,
      repeat: -1,
      ease: "none"
    });
  }
}
