import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 22%, rgba(134, 239, 172, 0.08) 0%, rgba(17, 24, 39, 0.55) 24%, rgba(2, 6, 23, 0.97) 100%), url(/story/qjtx/22.avif) center/cover no-repeat fixed",
  titleColor: "#f8fafc",
  bodyColor: "#d1d5db",
  accentColor: "#86efac",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C62 16 79 24 100 50 C79 76 62 84 50 100 C38 84 21 76 0 50 C21 24 38 16 50 0 Z",
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

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div className={`scrolly-wind-${event.id} absolute inset-0 pointer-events-none opacity-0`}>
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            className={`scrolly-leaf-${event.id} absolute rounded-full blur-[1px]`}
            style={{
              left: `${10 + index * 12}%`,
              top: `${18 + (index % 4) * 15}%`,
              width: `${16 + (index % 3) * 8}px`,
              height: `${6 + (index % 2) * 2}px`,
              background:
                index % 2 === 0
                  ? "linear-gradient(90deg, rgba(187,247,208,0.85), rgba(226,232,240,0.12))"
                  : "linear-gradient(90deg, rgba(248,250,252,0.8), rgba(134,239,172,0.12))",
              transform: `rotate(${index % 2 === 0 ? -24 : 20}deg)`,
              opacity: 0.65,
            }}
          />
        ))}
      </div>

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="relative flex max-w-4xl flex-col items-center text-center">
          <div
            className="mb-6 h-px w-28 bg-linear-to-r from-transparent via-emerald-200/40 to-transparent md:mb-8 md:w-44"
            style={{ boxShadow: `0 0 18px ${accentColor}33` }}
          />
          <h2
            className={`scrolly-title-${event.id} text-4xl font-serif font-light tracking-[0.42em] md:text-6xl md:tracking-[0.56em] lg:text-7xl`}
            style={{ color: titleColor, paddingLeft: "0.42em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-7 text-sm font-light tracking-[0.45em] text-slate-100/75 md:mt-10 md:text-lg md:tracking-[0.65em]`}
            style={{ color: bodyColor, paddingLeft: "0.45em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-5 md:px-10`}>
        <div className={`scrolly-body-${event.id} relative w-full max-w-6xl`}>
          <div className={`scrolly-route-line-${event.id} absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-linear-to-b from-transparent via-emerald-200/30 to-transparent`} />
          <div className="flex flex-col gap-3 md:gap-4">
            {detail.body.map((paragraph, index) => {
              const isSeparator = paragraph === "……";
              const isKeyLine =
                paragraph.includes("起兵") ||
                paragraph.includes("即位") ||
                paragraph.includes("远走海外");
              const alignLeft = index % 2 === 0;

              if (isSeparator) {
                return (
                  <div
                    key={`${event.id}-${index}`}
                    className="scrolly-route-item flex items-center justify-center py-2 md:py-3"
                  >
                    <span className="text-sm tracking-[0.8em] text-slate-300/35 md:text-base">
                      ……
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`${event.id}-${index}`}
                  className="scrolly-route-item grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6"
                >
                  <div
                    className={`${alignLeft ? "justify-self-end text-right" : "invisible"} max-w-[18rem] rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-[1.95] tracking-[0.14em] backdrop-blur-sm md:max-w-[24rem] md:px-5 md:py-4 md:text-[15px] ${isKeyLine ? "text-slate-50 shadow-[0_0_24px_rgba(134,239,172,0.08)]" : ""
                      }`}
                    style={{ color: bodyColor }}
                  >
                    {alignLeft ? paragraph : "."}
                  </div>

                  <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
                    <span
                      className={`scrolly-route-dot-${event.id} block h-2.5 w-2.5 rounded-full border border-emerald-100/50 bg-slate-950 md:h-3 md:w-3`}
                      style={{ boxShadow: `0 0 0 0 ${accentColor}` }}
                    />
                  </div>

                  <div
                    className={`${!alignLeft ? "justify-self-start text-left" : "invisible"} max-w-[18rem] rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-[1.95] tracking-[0.14em] backdrop-blur-sm md:max-w-[24rem] md:px-5 md:py-4 md:text-[15px] ${isKeyLine ? "text-slate-50 shadow-[0_0_24px_rgba(134,239,172,0.08)]" : ""
                      }`}
                    style={{ color: bodyColor }}
                  >
                    {!alignLeft ? paragraph : "."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {detail.closing && (
        <div className={`scrolly-closing-container-${event.id} pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-6 pb-10 md:pb-14`}>
          <div className={`scrolly-closing-${event.id} rounded-full border border-emerald-100/15 bg-black/35 px-6 py-3 text-[11px] tracking-[0.36em] text-slate-100/85 backdrop-blur-md md:text-xs`}>
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
  const routeItems = scrollyText.querySelectorAll(`.scrolly-route-item`);
  const routeDots = scrollyText.querySelectorAll(`.scrolly-route-dot-${eventId}`);
  const routeLine = scrollyText.querySelector(`.scrolly-route-line-${eventId}`);
  const leaves = scrollyText.querySelectorAll(`.scrolly-leaf-${eventId}`);
  const wind = scrollyText.querySelector(`.scrolly-wind-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);

  tl.set([title, quote, routeItems, routeDots, routeLine, leaves, closing, wind], {
    opacity: 0,
  });
  tl.set(routeLine, { scaleY: 0, transformOrigin: "50% 0%" });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6, ease: "power2.inOut" },
    0,
  )
    .to([wind, leaves], { opacity: 1, duration: 2.2 }, 0.5)
    .fromTo(
      title,
      { opacity: 0, y: 26, filter: "blur(16px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.6, ease: "power3.out" },
      1.2,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 12, letterSpacing: "0.7em", filter: "blur(8px)" },
      { opacity: 1, y: 0, letterSpacing: "0.45em", filter: "blur(0px)", duration: 3, ease: "power2.out" },
      1.8,
    )
    .to([title, quote], { opacity: 0, y: -12, filter: "blur(14px)", duration: 3, ease: "power2.inOut" }, "+=2")
    .set(intro, { display: "none" })
    .fromTo(
      routeLine,
      { opacity: 0, scaleY: 0 },
      { opacity: 1, scaleY: 1, duration: 1.8, ease: "power2.out" },
      "-=0.2",
    )
    .fromTo(
      routeDots,
      { opacity: 0, scale: 0.2 },
      { opacity: 1, scale: 1, duration: 0.8, stagger: 0.08, ease: "back.out(2.4)" },
      "-=1.2",
    )
    .fromTo(
      routeItems,
      { opacity: 0, x: (index) => (index % 2 === 0 ? -34 : 34), filter: "blur(10px)" },
      {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 1.9,
        stagger: 0.11,
        ease: "power2.out",
      },
      "-=1.1",
    )
    .to(routeItems, { opacity: 0, y: -8, filter: "blur(10px)", duration: 3, stagger: 0.04, ease: "power2.inOut" }, "+=3.6")
    .to(routeLine, { opacity: 0.25, duration: 1.4 }, "<")
    .set(bodyContainer, { display: "none" })
    .fromTo(
      closing,
      { opacity: 0, y: 20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.6, ease: "power2.out" },
      "-=0.4",
    )
    .to(closing, { opacity: 0, y: 16, filter: "blur(12px)", duration: 3.6, ease: "power2.inOut" }, "+=2.8")
    .to([wind, leaves], { opacity: 0, duration: 2.2 }, "-=2.6")
    .to(scrollyBg, { "--radius": "0px", duration: 5.2, ease: "power2.inOut" }, "-=1.8");

  leaves.forEach((leaf, index) => {
    gsap.to(leaf, {
      x: `${40 + index * 8}px`,
      y: `${120 + (index % 3) * 35}px`,
      rotation: index % 2 === 0 ? 18 : -22,
      duration: 6 + index * 0.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });
}
