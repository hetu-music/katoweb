import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 24%, rgba(251, 207, 232, 0.14) 0%, rgba(39, 39, 42, 0.52) 26%, rgba(9, 9, 11, 0.97) 100%), url(/story/qjtx/32.avif) center/cover no-repeat fixed",
  titleColor: "#fce7f3",
  bodyColor: "#f5f3ff",
  accentColor: "#f472b6",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50,0 C62,34 100,44 62,60 C50,100 38,60 0,50 C38,40 50,0 50,0 Z",
};

export function NodeLayout({
  event,
  resolvedTheme,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  const { titleColor, bodyColor, accentColor } = resolvedTheme;
  const lastLine = detail.body[detail.body.length - 1];
  const dreamLines = detail.body.slice(0, -1);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(3px 3px at 80px 60px, rgba(255,255,255,0.95), transparent), radial-gradient(2px 2px at 180px 140px, rgba(252,231,243,0.9), transparent), radial-gradient(4px 4px at 280px 220px, rgba(255,255,255,0.72), transparent)",
          backgroundSize: "420px 420px",
        }}
      />
      <div
        className={`scrolly-bloom-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 20% 82%, rgba(244,114,182,0.16), transparent 26%), radial-gradient(circle at 80% 80%, rgba(251,207,232,0.12), transparent 28%), radial-gradient(circle at 50% 24%, rgba(255,255,255,0.08), transparent 30%)",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="flex max-w-4xl flex-col items-center text-center">
          <div
            className={`scrolly-moon-${event.id} mb-8 h-28 w-28 rounded-full md:h-36 md:w-36`}
            style={{
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(252,231,243,0.5) 42%, rgba(244,114,182,0.08) 72%, transparent 100%)",
              boxShadow: `0 0 45px ${accentColor}33`,
            }}
          />
          <h2
            className={`scrolly-title-${event.id} text-5xl font-serif font-light tracking-[0.44em] md:text-7xl md:tracking-[0.58em]`}
            style={{ color: titleColor, paddingLeft: "0.44em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-7 text-sm font-light tracking-[0.42em] text-slate-100/80 md:mt-9 md:text-lg md:tracking-[0.58em]`}
            style={{ color: bodyColor, paddingLeft: "0.42em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-5 py-10 md:px-10`}>
        <div className={`scrolly-dreamstage-${event.id} relative flex w-full max-w-5xl flex-col items-center gap-4 md:gap-5`}>
          {dreamLines.map((line, index) => (
            <div
              key={index}
              className={`scrolly-body-line rounded-[999px] border border-white/10 bg-black/18 px-6 py-4 text-center text-sm leading-[1.95] tracking-[0.18em] text-slate-100/88 shadow-[0_0_24px_rgba(244,114,182,0.06)] backdrop-blur-md md:px-8 md:py-4 md:text-[15px] ${index % 2 === 0 ? "-translate-x-5 md:-translate-x-14" : "translate-x-5 md:translate-x-14"
                }`}
              style={{ color: bodyColor, maxWidth: `${72 - index * 5}%` }}
            >
              {line}
            </div>
          ))}

          <div
            className={`scrolly-final-line-${event.id} mt-5 rounded-full border border-pink-200/18 bg-linear-to-r from-transparent via-pink-300/12 to-transparent px-8 py-5 text-center text-2xl font-serif tracking-[0.3em] shadow-[0_0_40px_rgba(244,114,182,0.12)] backdrop-blur-md md:mt-8 md:px-12 md:py-6 md:text-4xl md:tracking-[0.42em]`}
            style={{ color: titleColor, paddingLeft: "0.3em" }}
          >
            {lastLine}
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
  const moon = scrollyText.querySelector(`.scrolly-moon-${eventId}`);
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const finalLine = scrollyText.querySelector(`.scrolly-final-line-${eventId}`);
  const dreamstage = scrollyText.querySelector(`.scrolly-dreamstage-${eventId}`);
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);
  const bloom = scrollyText.querySelector(`.scrolly-bloom-${eventId}`);

  tl.set([title, quote, moon, bodyLines, finalLine, dreamstage, snow, bloom], {
    opacity: 0,
  });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.2, ease: "power2.inOut" },
    0,
  )
    .to([snow, bloom], { opacity: 1, duration: 2.6 }, 0.6)
    .fromTo(
      moon,
      { opacity: 0, scale: 0.7, filter: "blur(16px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3.4, ease: "power3.out" },
      1.3,
    )
    .fromTo(
      title,
      { opacity: 0, y: 20, filter: "blur(16px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.6, ease: "power3.out" },
      1.6,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 10, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, ease: "power2.out" },
      2,
    )
    .to([moon, title, quote], { opacity: 0, y: -16, filter: "blur(12px)", duration: 3, ease: "power2.inOut" }, "+=2.4")
    .set(intro, { display: "none" })
    .fromTo(
      dreamstage,
      { opacity: 0, y: 20, scale: 0.98, filter: "blur(10px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 2.4, ease: "power2.out" },
      "-=0.1",
    )
    .fromTo(
      bodyLines,
      { opacity: 0, y: 16, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.16,
        ease: "power2.out",
      },
      "-=1.6",
    )
    .fromTo(
      finalLine,
      { opacity: 0, scale: 0.92, filter: "blur(12px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2.8, ease: "power3.out" },
      "-=0.3",
    )
    .to([bodyLines, finalLine], { opacity: 0, y: -10, filter: "blur(10px)", duration: 3.8, ease: "power2.inOut" }, "+=4")
    .set(bodyContainer, { display: "none" })
    .to([snow, bloom], { opacity: 0, duration: 2.8 }, "-=2.6")
    .to(scrollyBg, { "--radius": "0px", duration: 5.4, ease: "power2.inOut" }, "-=1.6");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "0px 560px",
      duration: 14,
      repeat: -1,
      ease: "none",
    });
  }
}
