import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at center, rgba(62, 39, 35, 0.7) 0%, rgba(20, 10, 0, 0.95) 100%), url(/story/qjtx/28.avif) center/cover no-repeat fixed",
  titleColor: "#fde047",
  bodyColor: "#d6d3d1",
  accentColor: "#ca8a04",
  layout: "vertical",
  specialEffect: "none",
  maskPath: "M0,50 L50,0 L100,50 L50,100 Z", // 菱形
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
      {/* 历史尘埃/纸张纹理特效 */}
      <div 
        className={`scrolly-dust-${event.id} absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay`} 
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="relative flex flex-col items-center">
          <h2
            className={`scrolly-title-${event.id} text-5xl md:text-8xl font-serif tracking-[0.5em] md:tracking-[0.8em] pl-[0.5em] md:pl-[0.8em] font-light relative z-10 text-center [writing-mode:vertical-rl]`}
            style={{ color: titleColor, textShadow: `0 0 20px ${accentColor}, 0 2px 8px rgba(0,0,0,0.8)` }}
          >
            {event.detail.title}
          </h2>
        </div>
        
        {event.detail.quote && (
          <div
            className={`scrolly-quote-${event.id} mt-12 md:mt-24 text-lg md:text-2xl font-serif tracking-[0.5em] md:tracking-[0.7em] text-center max-w-xl leading-relaxed px-4 [writing-mode:vertical-rl]`}
            style={{ color: bodyColor, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
          >
            {event.detail.quote}
          </div>
        )}
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center`}>
        <div
          className={`scrolly-body-${event.id} flex flex-row-reverse justify-center w-[85vw] h-full max-h-[75vh] mx-auto py-8 md:py-16 text-sm md:text-xl leading-[3] tracking-[0.4em] md:tracking-[0.6em] font-light`}
          style={{ color: bodyColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {event.detail.body.map((p, i) => (
            <p key={i} className={`scrolly-body-line mx-4 md:mx-8 h-full [writing-mode:vertical-rl] flex items-center border-l border-white/5 pl-4 md:pl-8`}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-row items-center justify-start pl-16 md:pl-40 pointer-events-none`}>
        <div className={`scrolly-closing-${event.id} relative flex flex-col items-center h-full max-h-[50vh] justify-center`}>
          <div className="relative px-8 py-16 h-full flex items-center bg-[#ca8a04]/10 backdrop-blur-xs border border-[#fde047]/20 shadow-[0_0_30px_rgba(202,138,4,0.15)]">
            <p
              className="text-xl md:text-3xl tracking-[0.8em] md:tracking-[1em] pt-[0.8em] md:pt-[1em] font-serif text-center opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [writing-mode:vertical-rl]"
              style={{ color: "#fde047" }}
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

  tl.set([title, quote, bodyLines, closing], { opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.0, ease: "power2.inOut" },
    0
  )
    .fromTo(
      title,
      { opacity: 0, filter: "blur(10px)", y: 50 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 4.0, ease: "power2.out" },
      1.5
    )
    .fromTo(
      quote,
      { opacity: 0, y: 30, filter: "blur(5px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=2.0"
    )
    .to([title, quote], { opacity: 0, filter: "blur(15px)", y: -40, duration: 3.5, ease: "power2.inOut" }, "+=3.0")
    .set(intro, { display: "none" })
    .fromTo(
      bodyLines,
      { opacity: 0, filter: "blur(5px)", x: 30 },
      { opacity: 1, filter: "blur(0px)", x: 0, duration: 3.0, stagger: 0.5, ease: "power2.out" },
      "-=0.5"
    )
    .to(bodyLines, { opacity: 0, filter: "blur(10px)", x: -30, duration: 3.5, ease: "power2.inOut" }, "+=2.5")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, scaleY: 1.2, filter: "blur(10px)" },
      { opacity: 1, scaleY: 1, filter: "blur(0px)", duration: 4.5, ease: "power2.out" },
      "-=0.5"
    )
    .to(closing, { opacity: 0, scale: 0.9, filter: "blur(15px)", duration: 4.5, ease: "power2.in" }, "+=4.0")
    .to(scrollyBg, { "--radius": "0px", duration: 6.0, ease: "power2.inOut" }, "-=2.0");
}
