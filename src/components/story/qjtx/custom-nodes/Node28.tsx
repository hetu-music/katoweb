import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 12%, rgba(250, 204, 21, 0.09) 0%, rgba(41, 37, 36, 0.6) 28%, rgba(12, 10, 9, 0.97) 100%), url(/story/qjtx/28.avif) center/cover no-repeat fixed",
  titleColor: "#fef3c7",
  bodyColor: "#f5f5f4",
  accentColor: "#d97706",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C76 8 92 24 100 50 C92 76 76 92 50 100 C24 92 8 76 0 50 C8 24 24 8 50 0 Z",
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
  const splitIndex = Math.ceil(detail.body.length / 2);
  const leftPage = detail.body.slice(0, splitIndex);
  const rightPage = detail.body.slice(splitIndex);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-dust-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-overlay`}
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 160 160%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.95%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.45%27/%3E%3C/svg%3E")',
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div
          className={`scrolly-cover-${event.id} relative flex w-full max-w-2xl flex-col items-center rounded-[2rem] border border-amber-100/10 bg-stone-950/45 px-8 py-10 backdrop-blur-md md:px-12 md:py-12`}
          style={{ boxShadow: `0 0 48px color-mix(in srgb, ${accentColor} 12%, transparent)` }}
        >
          <span className="mb-5 text-[10px] tracking-[0.45em] text-amber-50/45 md:text-[11px]">
            太史院重开旧卷
          </span>
          <h2
            className={`scrolly-title-${event.id} text-center text-4xl font-serif font-light tracking-[0.38em] md:text-6xl md:tracking-[0.5em]`}
            style={{ color: titleColor, paddingLeft: "0.38em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-6 text-center text-sm font-light tracking-[0.32em] text-amber-50/75 md:mt-8 md:text-base md:tracking-[0.45em]`}
            style={{ color: bodyColor, paddingLeft: "0.32em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-8 md:px-10 md:py-12`}>
        <div
          className={`scrolly-folio-${event.id} relative grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[2rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(245,238,220,0.88))] text-stone-800 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:grid-cols-[1fr_auto_1fr]`}
        >
          <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-amber-100/45 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-stone-500/15 md:block" />

          <section className={`scrolly-page-${event.id} relative px-6 py-8 md:px-9 md:py-10`}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.35em] text-stone-500">上卷</span>
              <span className="h-px w-14 bg-stone-400/25" />
            </div>
            <div className="flex flex-col gap-4 md:gap-5">
              {leftPage.map((paragraph, index) => (
                <p
                  key={`left-${index}`}
                  className={`scrolly-body-line text-[13px] leading-[2.1] tracking-[0.12em] md:text-[15px] ${paragraph === "……" ? "text-center tracking-[0.55em] text-stone-400/75" : ""
                    }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          <div className="hidden items-center justify-center px-4 md:flex">
            <div
              className={`scrolly-marginalia-${event.id} flex min-h-[60%] items-center rounded-full border border-amber-900/10 bg-amber-50/55 px-3 py-8 shadow-inner`}
            >
              <span className="[writing-mode:vertical-rl] text-[11px] tracking-[0.35em] text-stone-500">
                太史秉笔
              </span>
            </div>
          </div>

          <section className={`scrolly-page-${event.id} relative px-6 py-8 md:px-9 md:py-10`}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.35em] text-stone-500">下卷</span>
              <span className="h-px w-14 bg-stone-400/25" />
            </div>
            <div className="flex flex-col gap-4 md:gap-5">
              {rightPage.map((paragraph, index) => (
                <p
                  key={`right-${index}`}
                  className={`scrolly-body-line text-[13px] leading-[2.1] tracking-[0.12em] md:text-[15px] ${paragraph === "……" ? "text-center tracking-[0.55em] text-stone-400/75" : ""
                    }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {detail.closing && (
            <div className={`scrolly-closing-${event.id} absolute bottom-5 right-5 rounded-full border border-red-900/15 bg-red-950/10 px-4 py-2 text-[10px] tracking-[0.3em] text-red-900/60 shadow-[0_0_0_1px_rgba(127,29,29,0.06)] md:bottom-7 md:right-8 md:text-[11px]`}>
              {detail.closing}
            </div>
          )}
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
  const cover = scrollyText.querySelector(`.scrolly-cover-${eventId}`);
  const title = scrollyText.querySelector(`.scrolly-title-${eventId}`);
  const quote = scrollyText.querySelector(`.scrolly-quote-${eventId}`);
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const folio = scrollyText.querySelector(`.scrolly-folio-${eventId}`);
  const pages = scrollyText.querySelectorAll(`.scrolly-page-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const marginalia = scrollyText.querySelector(`.scrolly-marginalia-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const dust = scrollyText.querySelector(`.scrolly-dust-${eventId}`);

  tl.set([cover, title, quote, folio, pages, bodyLines, marginalia, closing, dust], {
    opacity: 0,
  });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.8, ease: "power2.inOut" },
    0,
  )
    .to(dust, { opacity: 0.18, duration: 2.4 }, 0.8)
    .fromTo(
      cover,
      { opacity: 0, y: 32, scale: 0.96, filter: "blur(18px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 3.8, ease: "power3.out" },
      1.2,
    )
    .fromTo(
      title,
      { opacity: 0, y: 18, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      1.7,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 10, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.6, ease: "power2.out" },
      2,
    )
    .to([cover, title, quote], { opacity: 0, y: -14, filter: "blur(12px)", duration: 2.8, ease: "power2.inOut" }, "+=2")
    .set(intro, { display: "none" })
    .fromTo(
      folio,
      { opacity: 0, y: 30, scale: 0.98, rotateX: 8, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 2.8,
        ease: "power2.out",
      },
      "-=0.1",
    )
    .fromTo(
      pages,
      { opacity: 0, x: (index) => (index === 0 ? -20 : 20) },
      { opacity: 1, x: 0, duration: 1.8, stagger: 0.18, ease: "power2.out" },
      "-=1.8",
    )
    .fromTo(
      marginalia,
      { opacity: 0, scaleY: 0.8, filter: "blur(8px)" },
      { opacity: 1, scaleY: 1, filter: "blur(0px)", duration: 1.9, ease: "power2.out" },
      "-=1.2",
    )
    .fromTo(
      bodyLines,
      { opacity: 0, y: 10, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.5,
        stagger: 0.07,
        ease: "power2.out",
      },
      "-=1.6",
    )
    .to([pages, bodyLines, marginalia], { opacity: 0, y: -10, filter: "blur(8px)", duration: 3, ease: "power2.inOut" }, "+=3.8")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, scale: 0.7, rotate: -12, filter: "blur(8px)" },
      { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 1.9, ease: "back.out(1.8)" },
      "-=0.3",
    )
    .to(closing, { opacity: 0, scale: 0.9, filter: "blur(10px)", duration: 3.4, ease: "power2.inOut" }, "+=3")
    .to(dust, { opacity: 0, duration: 2 }, "-=2.6")
    .to(scrollyBg, { "--radius": "0px", duration: 5, ease: "power2.inOut" }, "-=1.6");
}
