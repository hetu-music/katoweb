import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 18%, rgba(253, 224, 71, 0.12) 0%, rgba(68, 64, 60, 0.42) 26%, rgba(12, 10, 9, 0.96) 100%), url(/story/qjtx/38.avif) center/cover no-repeat fixed",
  titleColor: "#fef3c7",
  bodyColor: "#f5f5f4",
  accentColor: "#f59e0b",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50 0 A50 50 0 1 1 49.9 0 Z",
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
  const lines = detail.body.filter((line) => line !== "……");

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}
    >
      <div
        className={`scrolly-sunlight-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 18% 22%, rgba(254,240,138,0.22), transparent 24%), radial-gradient(circle at 82% 18%, rgba(245,158,11,0.16), transparent 26%), radial-gradient(circle at 50% 82%, rgba(255,255,255,0.06), transparent 30%)",
        }}
      />

      <div
        className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}
      >
        <div className="flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 h-px w-28 bg-linear-to-r from-transparent via-amber-100/40 to-transparent md:w-40" />
          <h2
            className={`scrolly-title-${event.id} text-5xl font-serif font-light tracking-[0.4em] md:text-7xl md:tracking-[0.54em]`}
            style={{ color: titleColor, paddingLeft: "0.4em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-7 text-sm font-light tracking-[0.4em] text-amber-50/75 md:text-lg md:tracking-[0.56em]`}
            style={{ color: bodyColor, paddingLeft: "0.4em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      <div
        className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-5 py-10 md:px-10`}
      >
        <div
          className={`scrolly-memorial-${event.id} relative flex w-full max-w-5xl flex-col items-center`}
        >
          <div
            className={`scrolly-stele-${event.id} relative w-full max-w-3xl rounded-[2.6rem_2.6rem_1.8rem_1.8rem] border border-amber-100/12 bg-stone-900/36 px-7 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md md:px-10 md:py-12`}
          >
            <div className="absolute inset-x-8 top-4 h-px bg-linear-to-r from-transparent via-amber-100/28 to-transparent" />
            <div className="absolute inset-x-8 bottom-4 h-px bg-linear-to-r from-transparent via-amber-100/18 to-transparent" />

            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-amber-100/20" />
              <span className="text-[10px] tracking-[0.4em] text-amber-50/45 md:text-[11px]">
                乡里为记
              </span>
              <div className="h-px w-12 bg-amber-100/20" />
            </div>

            <div className="flex flex-col gap-4 md:gap-5">
              {lines.map((line, index) => {
                const emphasis =
                  line.includes("不肯他嫁") ||
                  line.includes("终尽瘁而死") ||
                  line.includes("立贤女碑");

                return (
                  <p
                    key={index}
                    className={`scrolly-body-line text-sm leading-[2.05] tracking-[0.14em] md:text-[15px] ${
                      emphasis ? "text-amber-50" : "text-stone-100/88"
                    }`}
                    style={{ color: emphasis ? titleColor : bodyColor }}
                  >
                    {line}
                  </p>
                );
              })}
            </div>

            <div
              className={`scrolly-closing-${event.id} mt-9 inline-flex rounded-full border border-amber-100/14 bg-amber-50/6 px-5 py-2 text-[10px] tracking-[0.34em] text-amber-50/70 md:text-[11px]`}
              style={{ boxShadow: `0 0 24px ${accentColor}18` }}
            >
              {detail.closing}
            </div>
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
  const bodyContainer = scrollyText.querySelector(
    `.scrolly-body-container-${eventId}`,
  );
  const memorial = scrollyText.querySelector(`.scrolly-memorial-${eventId}`);
  const stele = scrollyText.querySelector(`.scrolly-stele-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const sunlight = scrollyText.querySelector(`.scrolly-sunlight-${eventId}`);

  tl.set([title, quote, memorial, stele, bodyLines, closing, sunlight], {
    opacity: 0,
  });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 5.8, ease: "power2.inOut" },
    0,
  )
    .to(sunlight, { opacity: 1, duration: 2.8 }, 0.6)
    .fromTo(
      title,
      { opacity: 0, y: 24, filter: "blur(16px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 3.4,
        ease: "power3.out",
      },
      1.3,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 10, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 3,
        ease: "power2.out",
      },
      1.8,
    )
    .to(
      [title, quote],
      {
        opacity: 0,
        y: -14,
        filter: "blur(12px)",
        duration: 3,
        ease: "power2.inOut",
      },
      "+=2.4",
    )
    .set(intro, { display: "none" })
    .fromTo(
      memorial,
      { opacity: 0, y: 22, scale: 0.98, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 2.6,
        ease: "power2.out",
      },
      "-=0.1",
    )
    .fromTo(
      stele,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 2.2, ease: "power2.out" },
      "-=1.8",
    )
    .fromTo(
      bodyLines,
      { opacity: 0, y: 10, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.7,
        stagger: 0.09,
        ease: "power2.out",
      },
      "-=1.4",
    )
    .fromTo(
      closing,
      { opacity: 0, scale: 0.82, filter: "blur(6px)" },
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.8,
        ease: "back.out(1.7)",
      },
      "-=0.4",
    )
    .to(
      [bodyLines, closing, memorial],
      {
        opacity: 0,
        y: -8,
        filter: "blur(8px)",
        duration: 3.6,
        ease: "power2.inOut",
      },
      "+=4",
    )
    .set(bodyContainer, { display: "none" })
    .to(sunlight, { opacity: 0, duration: 2.6 }, "-=2.2")
    .to(
      scrollyBg,
      { "--radius": "0px", duration: 5, ease: "power2.inOut" },
      "-=1.6",
    );

  if (sunlight) {
    gsap.to(sunlight, {
      opacity: 0.9,
      duration: 4.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
}
