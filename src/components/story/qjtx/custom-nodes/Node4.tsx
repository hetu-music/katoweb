import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 18%, rgba(125, 211, 252, 0.18) 0%, rgba(15, 23, 42, 0.58) 24%, rgba(2, 6, 23, 0.97) 100%), url(/story/qjtx/4.avif) center/cover no-repeat fixed",
  titleColor: "#f8fafc",
  bodyColor: "#dbeafe",
  accentColor: "#7dd3fc",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 L64 18 L72 36 L92 50 L72 64 L64 82 L50 100 L36 82 L28 64 L8 50 L28 36 L36 18 Z",
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
  const bodyColumns = [detail.body.slice(0, 3), detail.body.slice(3, 6), detail.body.slice(6)];

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-rain-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(191,219,254,0.28) 40%, rgba(255,255,255,0) 100%)",
          backgroundSize: "2px 140px",
          backgroundRepeat: "repeat",
        }}
      />
      <div
        className={`scrolly-aura-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 50% 24%, rgba(125,211,252,0.18), transparent 48%), radial-gradient(circle at 50% 68%, rgba(14,165,233,0.10), transparent 62%)",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="relative flex flex-col items-center gap-8 md:gap-10">
          <div className="scrolly-quote-wrap flex items-center gap-4 md:gap-6">
            <div className="h-px w-10 bg-sky-200/30 md:w-16" />
            <p
              className={`scrolly-quote-${event.id} text-[11px] font-light tracking-[0.45em] text-center md:text-sm md:tracking-[0.7em]`}
              style={{ color: bodyColor }}
            >
              {detail.quote}
            </p>
            <div className="h-px w-10 bg-sky-200/30 md:w-16" />
          </div>

          <div className="relative flex flex-col items-center gap-6">
            <h2
              className={`scrolly-title-${event.id} text-center text-4xl font-serif font-light tracking-[0.45em] drop-shadow-[0_0_30px_rgba(125,211,252,0.18)] md:text-6xl md:tracking-[0.6em] lg:text-7xl`}
              style={{ color: titleColor, paddingLeft: "0.45em" }}
            >
              {detail.title}
            </h2>

            <div className={`scrolly-tower-${event.id} relative flex h-[17rem] w-28 flex-col items-center md:h-[22rem] md:w-36`}>
              <div
                className="absolute inset-x-0 top-0 h-10 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${accentColor}55 0%, transparent 72%)` }}
              />
              <div className="relative mt-4 flex h-full w-full flex-col items-center justify-start">
                <div
                  className="mb-3 h-3 w-3 rounded-full"
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 18px ${accentColor}` }}
                />
                {Array.from({ length: 9 }, (_, index) => (
                  <div
                    key={index}
                    className={`scrolly-tier-${event.id} origin-center rounded-full border border-sky-100/20 bg-slate-950/35 backdrop-blur-sm`}
                    style={{
                      width: `${74 + (8 - index) * 7}px`,
                      height: `${10 + Math.max(0, 6 - index)}px`,
                      marginTop: index === 0 ? 0 : "0.5rem",
                      boxShadow:
                        index % 3 === 0
                          ? `0 0 16px color-mix(in srgb, ${accentColor} 28%, transparent)`
                          : undefined,
                    }}
                  />
                ))}
                <div className="mt-4 h-full w-[2px] rounded-full bg-linear-to-b from-sky-200/40 via-sky-300/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-6`}>
        <div className={`scrolly-body-${event.id} grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-3 md:gap-8`}>
          {bodyColumns.map((column, columnIndex) => (
            <section
              key={columnIndex}
              className={`scrolly-column-${event.id} rounded-[1.75rem] border border-sky-100/10 bg-slate-950/30 px-6 py-7 backdrop-blur-md shadow-[0_0_40px_rgba(2,132,199,0.08)] md:px-7 md:py-8`}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-sky-200/15" />
                <span className="text-[10px] tracking-[0.35em] text-sky-100/45">
                  第{columnIndex + 1}章
                </span>
              </div>
              <div className="flex flex-col gap-4 md:gap-5">
                {column.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${columnIndex}-${paragraphIndex}`}
                    className={`scrolly-body-line text-sm leading-[2.15] tracking-[0.18em] md:text-[15px] ${paragraph.includes("九龙塔") || paragraph.includes("布雨") || paragraph.includes("国师")
                        ? "text-sky-50"
                        : "text-slate-200/88"
                      }`}
                    style={{ color: paragraph.includes("国师") ? titleColor : bodyColor }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {detail.closing && (
        <div className={`scrolly-closing-container-${event.id} pointer-events-none absolute inset-x-0 bottom-0 flex justify-end px-6 pb-12 md:px-12 md:pb-16`}>
          <div
            className={`scrolly-closing-${event.id} rounded-full border border-sky-100/15 bg-slate-950/45 px-6 py-3 text-[11px] tracking-[0.38em] text-sky-50/80 shadow-[0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-md md:text-xs`}
          >
            {detail.closing}
          </div>
        </div>
      )}
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
  const columns = scrollyText.querySelectorAll(`.scrolly-column-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const rain = scrollyText.querySelector(`.scrolly-rain-${eventId}`);
  const aura = scrollyText.querySelector(`.scrolly-aura-${eventId}`);
  const tower = scrollyText.querySelector(`.scrolly-tower-${eventId}`);
  const tiers = scrollyText.querySelectorAll(`.scrolly-tier-${eventId}`);

  tl.set([title, quote, rain, aura, tower, columns, bodyLines, closing], {
    opacity: 0,
  });
  tl.set(tiers, { scaleX: 0.7, scaleY: 0, transformOrigin: "50% 50%" });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.8, ease: "power2.inOut" },
    0,
  )
    .to([aura, rain], { opacity: 1, duration: 2.4 }, 0.6)
    .fromTo(
      title,
      { opacity: 0, y: 30, filter: "blur(18px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.8, ease: "power3.out" },
      1.4,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 16, letterSpacing: "0.7em", filter: "blur(10px)" },
      { opacity: 1, y: 0, letterSpacing: "0.45em", filter: "blur(0px)", duration: 3.2, ease: "power2.out" },
      1.9,
    )
    .fromTo(
      tiers,
      { opacity: 0, scaleY: 0, y: 26 },
      {
        opacity: 1,
        scaleY: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: "power2.out",
      },
      2.1,
    )
    .fromTo(
      tower,
      { opacity: 0, y: 32, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      2.2,
    )
    .to([title, quote, tower], { opacity: 0, y: -18, filter: "blur(16px)", duration: 3.2, ease: "power2.inOut" }, "+=2.2")
    .set(intro, { display: "none" })
    .fromTo(
      columns,
      { opacity: 0, y: 34, scale: 0.96, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 2.6,
        stagger: 0.22,
        ease: "power2.out",
      },
      "-=0.4",
    )
    .fromTo(
      bodyLines,
      { opacity: 0, y: 12, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.8,
        stagger: 0.08,
        ease: "power2.out",
      },
      "-=1.8",
    )
    .to([columns, bodyLines], { opacity: 0, y: -14, filter: "blur(12px)", duration: 3.2, ease: "power2.inOut" }, "+=3.3")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, x: 24, filter: "blur(10px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      "-=0.6",
    )
    .to(closing, { opacity: 0, x: 20, filter: "blur(12px)", duration: 3.8, ease: "power2.inOut" }, "+=3")
    .to([rain, aura], { opacity: 0, duration: 2.4 }, "-=2.8")
    .to(scrollyBg, { "--radius": "0px", duration: 5.2, ease: "power2.inOut" }, "-=1.5");

  if (rain) {
    gsap.to(rain, {
      backgroundPosition: "0px 920px",
      duration: 1.35,
      repeat: -1,
      ease: "none",
    });
  }
}
