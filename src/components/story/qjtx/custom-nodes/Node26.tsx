import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at top, rgba(69, 10, 10, 0.7) 0%, rgba(10, 0, 0, 0.95) 100%), url(/story/qjtx/26.avif) center/cover no-repeat fixed",
  titleColor: "#fecaca",
  bodyColor: "#d4d4d8",
  accentColor: "#dc2626",
  layout: "horizontal",
  specialEffect: "ripple",
  maskPath: "M0,0 L100,0 L100,100 L0,100 Z", // 破碎的矩形遮罩可后续添加，这里先用矩形
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
      {/* 火星飞散特效 */}
      <div 
        className={`scrolly-embers-${event.id} absolute inset-0 pointer-events-none opacity-50 mix-blend-screen`} 
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 100px 200px, #dc2626, transparent), radial-gradient(3px 3px at 300px 400px, #fca5a5, transparent), radial-gradient(2px 2px at 500px 100px, #dc2626, transparent)',
          backgroundSize: '600px 600px',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.6em] md:tracking-[1em] pl-[0.6em] md:pl-[1em] font-light relative z-10 text-center uppercase`}
            style={{ color: titleColor, textShadow: `0 0 40px ${accentColor}, 0 4px 20px rgba(0,0,0,0.9)` }}
          >
            {event.detail.title}
          </h2>
          <div className={`scrolly-glow-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#dc2626]/20 blur-3xl rounded-full -z-10`} />
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-10 md:mt-20 text-xl md:text-3xl font-serif tracking-[0.4em] md:tracking-[0.8em] pl-[0.4em] md:pl-[0.8em] text-center max-w-3xl leading-relaxed px-4`}
            style={{ color: bodyColor, textShadow: '0 2px 15px rgba(0,0,0,1)' }}
          >
            「{event.detail.quote}」
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-col justify-center h-[85vh] w-full max-w-5xl mx-auto px-6 md:px-12 text-base md:text-xl leading-[2.8] tracking-[0.2em] md:tracking-[0.3em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
        >
          {event.detail.body.map((p, i) => {
            const isCenter = p === "……";
            const alignClass = isCenter ? "text-center opacity-30" : "text-center";
            return (
              <p key={i} className={`scrolly-body-line my-4 md:my-6 w-full ${alignClass}`}>
                {p}
              </p>
            );
          })}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center w-full max-w-4xl`}>
          <div className="relative py-8 px-12 w-full flex justify-center border-t border-b border-[#dc2626]/30 bg-linear-to-r from-transparent via-[#dc2626]/20 to-transparent backdrop-blur-xs shadow-[0_0_50px_rgba(220,38,38,0.15)]">
            <p
              className="text-xl md:text-3xl tracking-[0.8em] pl-[0.8em] font-serif text-center opacity-90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
              style={{ color: "#fecaca" }}
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
  const embers = scrollyText.querySelector(`.scrolly-embers-${eventId}`);

  tl.set([title, quote, bodyLines, closing, embers], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 4.0, ease: "power4.inOut" },
    0
  )
    .to(embers, { opacity: 0.8, duration: 1.5 }, 1.0)
    .fromTo(
      title,
      { opacity: 0, scale: 1.2, filter: "blur(30px)", y: -20 },
      { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 3.5, ease: "power3.out" },
      1.5
    )
    .fromTo(
      quote,
      { opacity: 0, y: 40, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.0, ease: "power2.out" },
      "-=1.5"
    )
    .to([title, quote], { opacity: 0, filter: "blur(25px)", scale: 0.9, y: 30, duration: 3.0, ease: "power3.inOut" }, "+=3.5")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(12px)", scale: 1.05 },
      { opacity: 1, filter: "blur(0px)", scale: 1, duration: 2.0, stagger: 0.4, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(15px)", scale: 0.95, duration: 3.0, ease: "power2.inOut" }, "+=2.5")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, scaleX: 1.5, filter: "blur(20px)" },
      { opacity: 1, scaleX: 1, filter: "blur(0px)", duration: 3.5, ease: "power3.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, scale: 1.1, filter: "blur(25px)", duration: 4.0, ease: "power2.in" }, "+=3.5")
    .to(embers, { opacity: 0, duration: 2.5 }, "-=2.5")
    .to(scrollyBg, { "--radius": "0px", duration: 4.0, ease: "power4.inOut" }, "-=2.0");

  if (embers) {
    gsap.to(embers, {
      backgroundPosition: "100px -600px",
      duration: 10,
      repeat: -1,
      ease: "none"
    });
  }
}
