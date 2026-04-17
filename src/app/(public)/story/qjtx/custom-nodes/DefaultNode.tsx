import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

// ─── Default Theme ─────────────────────────────────────────────────────────────

export const defaultTheme: Required<ImmersiveTheme> = {
  bg: "#030508",
  titleColor: "white",
  bodyColor: "rgb(212 212 216)", // zinc-300
  accentColor: "rgb(161 161 170)", // zinc-400
  maskPath: "",
  layout: "horizontal",
  specialEffect: "none",
};

// ─── Default Layout Component ──────────────────────────────────────────────────

export function DefaultNodeLayout({
  event,
  resolvedTheme,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  if (!event.detail) return null;

  const { titleColor, bodyColor, accentColor, layout } = resolvedTheme;

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 flex flex-col items-center w-full max-w-2xl px-6 md:px-0 h-full py-[15vh]`}
    >
      {/* 标题区 */}
      <div className="scrolly-header flex flex-col items-center mb-8 md:mb-12 shrink-0">
        <div className="w-px h-8 md:h-12 bg-linear-to-b from-transparent to-zinc-400/50 mb-6" />
        <h2
          className="text-2xl md:text-4xl font-serif tracking-[0.3em] pl-[0.3em] text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          style={{ color: titleColor }}
        >
          {event.detail.title}
        </h2>
      </div>

      {/* 滚动正文区 */}
      <div className="relative w-full flex-1 overflow-hidden mask-[linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
        <div
          className={`scrolly-text-content-${event.id} flex flex-col items-center w-full pb-[30vh] pt-[5vh]`}
        >
          {event.detail.quote && (
            <div
              className={`scrolly-quote-${event.id} text-lg md:text-2xl leading-loose tracking-[0.3em] pl-[0.3em] font-serif text-center px-4 md:px-8 py-6 mb-8 w-full bg-linear-to-b from-transparent via-zinc-900/30 to-transparent border-t border-b`}
              style={{
                color: titleColor,
                borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
              }}
            >
              <p>「{event.detail.quote}」</p>
            </div>
          )}

          <div
            className={`scrolly-body-${event.id} flex gap-4 text-sm md:text-base leading-[2.5] tracking-widest font-light text-justify px-8 md:px-16 ${layout === "vertical"
              ? "flex-row-reverse flex-wrap justify-center items-center h-[55vh] [writing-mode:vertical-rl] gap-x-12 w-full max-w-full mx-auto"
              : "flex-col w-full"
              }`}
            style={{ color: bodyColor }}
          >
            {event.detail.body.map((p, i) => (
              <p
                key={i}
                className={
                  p === "……"
                    ? "text-center my-4 font-serif text-lg opacity-40 tracking-[0.5em]"
                    : layout === "vertical"
                      ? "indent-[2em]"
                      : ""
                }
              >
                {p}
              </p>
            ))}
          </div>

          {event.detail.closing && (
            <div className={`scrolly-closing-${event.id} mt-16 flex w-full flex-col items-end opacity-80 pr-8 md:pr-16`}>
              <div className="w-24 h-px bg-linear-to-r from-transparent to-zinc-600 mb-6" />
              <p
                className="text-xs md:text-sm tracking-[0.3em] font-light"
                style={{ color: accentColor }}
              >
                {event.detail.closing}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Default Animation ─────────────────────────────────────────────────────────

export function animateDefault(
  tl: gsap.core.Timeline,
  detailContent: HTMLElement,
  scrollyBg: HTMLElement,
  scrollyText: HTMLElement,
  eventId: string,
) {
  const textHeader =
    scrollyText.querySelector<HTMLElement>(".scrolly-header");
  const textContent =
    scrollyText.querySelector<HTMLElement>(
      `.scrolly-text-content-${eventId}`
    );
  const snowLayer = scrollyBg.querySelector<HTMLElement>(
    `.scrolly-snow-${eventId}`
  );

  const isRipple = detailContent.dataset.effect === "ripple";
  const isVertical = detailContent.dataset.layout === "vertical";

  if (!textHeader || !textContent) return;

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    {
      "--radius": "150vmax",
      duration: isRipple ? 6.0 : 5.0,
      ease: isRipple ? "elastic.out(0.8, 1.2)" : "power2.out"
    },
    0
  )
    .fromTo(
      textHeader.children,
      { opacity: 0, y: isVertical ? 0 : 30, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.5,
        stagger: 0.3,
        ease: "power2.out",
      },
      "-=4.5"
    )
    .fromTo(
      textContent,
      { opacity: 0, y: isVertical ? 100 : 60, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 2.0,
        ease: "power2.out",
      },
      "-=1.5"
    )
    .to(textContent, {
      y: isVertical ? "-35%" : "-40%",
      duration: 10.0,
      ease: "none"
    })
    .to([textHeader, textContent], {
      opacity: 0,
      y: "-=30",
      filter: "blur(12px)",
      duration: 2.0,
      ease: "power2.in",
    })
    .to(
      scrollyBg,
      { "--radius": "0px", duration: 4.0, ease: isRipple ? "power3.in" : "power2.inOut" },
      "-=0.5"
    );

  if (snowLayer) {
    tl.fromTo(
      snowLayer,
      { y: "-10%" },
      { y: "10%", duration: tl.duration(), ease: "none" },
      0
    );
  }
}
