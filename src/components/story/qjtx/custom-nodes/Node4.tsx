import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.65) 30%, rgba(2, 6, 23, 0.98) 100%), url(/story/qjtx/4.avif) center/cover no-repeat fixed",
  titleColor: "#e0f2fe",
  bodyColor: "#bae6fd",
  accentColor: "#38bdf8",
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
  const bodyColumns = [
    detail.body.slice(0, 2),
    detail.body.slice(2, 6),
    detail.body.slice(6),
  ];

  return (
    <div
      className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif`}
    >
      {/* --- Ambient Rain Layers (Optimized with SVG Data URIs, no heavy blend modes) --- */}
      <div
        className={`scrolly-rain-bg-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cellipse cx='20' cy='20' rx='0.6' ry='15' fill='rgba(125,211,252,0.25)'/%3E%3Cellipse cx='80' cy='80' rx='0.6' ry='20' fill='rgba(125,211,252,0.15)'/%3E%3Cellipse cx='140' cy='40' rx='0.8' ry='18' fill='rgba(125,211,252,0.35)'/%3E%3Cellipse cx='50' cy='150' rx='0.6' ry='25' fill='rgba(125,211,252,0.2)'/%3E%3Cellipse cx='180' cy='170' rx='0.8' ry='12' fill='rgba(125,211,252,0.3)'/%3E%3Cellipse cx='110' cy='130' rx='0.6' ry='22' fill='rgba(125,211,252,0.15)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
          backgroundRepeat: "repeat",
          transform: "rotate(6deg) scale(1.2)",
        }}
      />
      <div
        className={`scrolly-rain-fg-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cellipse cx='30' cy='30' rx='1' ry='25' fill='rgba(224,242,254,0.45)'/%3E%3Cellipse cx='90' cy='100' rx='1' ry='30' fill='rgba(224,242,254,0.3)'/%3E%3Cellipse cx='150' cy='50' rx='1.2' ry='28' fill='rgba(224,242,254,0.5)'/%3E%3Cellipse cx='60' cy='170' rx='1' ry='35' fill='rgba(224,242,254,0.35)'/%3E%3Cellipse cx='190' cy='180' rx='1.2' ry='20' fill='rgba(224,242,254,0.55)'/%3E%3Cellipse cx='120' cy='140' rx='1' ry='32' fill='rgba(224,242,254,0.25)'/%3E%3C/svg%3E")`,
          backgroundSize: "220px 220px",
          backgroundRepeat: "repeat",
          transform: "rotate(8deg) scale(1.2)",
        }}
      />

      {/* Fog/Mist */}
      <div
        className={`scrolly-aura-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(56,189,248,0.12), transparent 45%), radial-gradient(circle at 50% 80%, rgba(2,132,199,0.08), transparent 60%)",
        }}
      />

      {/* --- Intro Scene --- */}
      <div
        className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}
      >
        <div className="relative flex w-full max-w-4xl flex-col items-center justify-center gap-12 md:gap-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-linear-to-r from-transparent to-sky-300/40" />
              <p
                className={`scrolly-quote-${event.id} text-[12px] font-light tracking-[0.5em] md:text-sm md:tracking-[0.8em]`}
                style={{ color: bodyColor }}
              >
                {detail.quote}
              </p>
              <div className="h-px w-12 bg-linear-to-l from-transparent to-sky-300/40" />
            </div>

            <h2
              className={`scrolly-title-${event.id} relative text-5xl font-light tracking-[0.35em] drop-shadow-[0_0_30px_rgba(56,189,248,0.3)] md:text-7xl lg:text-8xl`}
              style={{ color: titleColor, paddingLeft: "0.35em" }}
            >
              {detail.title}
              <div className="absolute -bottom-4 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-sky-300/30 to-transparent" />
            </h2>
          </div>

          {/* Abstract Tower / Rain Gauge */}
          <div
            className={`scrolly-tower-${event.id} relative flex h-88 w-32 flex-col items-center justify-center`}
          >
            {/* Core glowing line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-sky-200/50 via-sky-400/20 to-transparent" />
            <div className="absolute top-[20%] left-1/2 h-24 w-[2px] -translate-x-1/2 bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />

            {/* Ripple Tiers */}
            <div className="relative mt-8 flex h-full w-full flex-col items-center gap-6">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`scrolly-tier-${event.id} relative flex h-2 items-center justify-center`}
                >
                  <div
                    className="absolute h-px w-full bg-linear-to-r from-transparent via-sky-300/30 to-transparent"
                    style={{ width: `${80 - i * 12}px` }}
                  />
                  <div className="h-[3px] w-[3px] rounded-full bg-sky-200 shadow-[0_0_8px_rgba(125,211,252,0.6)]" />
                </div>
              ))}
            </div>

            <div
              className={`scrolly-tower-glow-${event.id} absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl`}
              style={{
                background: `radial-gradient(circle, ${accentColor}20 0%, transparent 60%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* --- Body Columns Scene --- */}
      <div
        className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-12 md:px-10`}
      >
        <div
          className={`scrolly-body-${event.id} grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-10`}
        >
          {bodyColumns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className={`scrolly-column-${event.id} relative flex flex-col rounded-4xl border border-sky-100/10 bg-slate-900/30 p-8 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(14,165,233,0.05)]`}
            >
              {/* Subtle permanent static accent line on left */}
              <div className="absolute top-0 left-0 h-full w-[2px] bg-linear-to-b from-transparent via-sky-300/20 to-transparent" />

              <div className="mb-8 flex items-center gap-4">
                <span className="text-[11px] font-light tracking-[0.4em] text-sky-200/50">
                  {String(columnIndex + 1).padStart(2, "0")}
                </span>
                <div className="h-px flex-1 bg-linear-to-r from-sky-200/20 to-transparent" />
              </div>

              <div className="flex flex-col gap-6">
                {column.map((paragraph, paragraphIndex) => {
                  const emphasis =
                    paragraph.includes("九龙塔") ||
                    paragraph.includes("布雨") ||
                    paragraph.includes("国师") ||
                    paragraph.includes("雨");
                  return (
                    <p
                      key={`${columnIndex}-${paragraphIndex}`}
                      className={`scrolly-body-line relative text-[15px] leading-[2.3] tracking-[0.2em] md:text-[16px]
                        ${emphasis ? "text-sky-50 font-normal drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" : "text-slate-300 font-light"}`}
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Closing --- */}
      {detail.closing && (
        <div
          className={`scrolly-closing-container-${event.id} pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-6 md:bottom-20`}
        >
          <div
            className={`scrolly-closing-${event.id} relative overflow-hidden rounded-full border border-sky-300/20 bg-slate-950/60 px-8 py-4 text-[12px] font-light tracking-[0.4em] text-sky-100/90 shadow-[0_0_30px_rgba(14,165,233,0.2)] backdrop-blur-md md:px-10 md:py-5 md:text-[13px]`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.1),transparent_70%)]" />
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
  const tower = scrollyText.querySelector(`.scrolly-tower-${eventId}`);
  const tiers = scrollyText.querySelectorAll(`.scrolly-tier-${eventId}`);
  const towerGlow = scrollyText.querySelector(`.scrolly-tower-glow-${eventId}`);

  const bodyContainer = scrollyText.querySelector(
    `.scrolly-body-container-${eventId}`,
  );
  const columns = Array.from(
    scrollyText.querySelectorAll<HTMLElement>(`.scrolly-column-${eventId}`),
  );
  const bodyLines = Array.from(
    scrollyText.querySelectorAll<HTMLElement>(`.scrolly-body-line`),
  );
  const columnLineGroups = columns.map((column) =>
    Array.from(column.querySelectorAll<HTMLElement>(`.scrolly-body-line`)),
  );

  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);

  const rainBg = scrollyText.querySelector(`.scrolly-rain-bg-${eventId}`);
  const rainFg = scrollyText.querySelector(`.scrolly-rain-fg-${eventId}`);
  const aura = scrollyText.querySelector(`.scrolly-aura-${eventId}`);
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    tl.set(
      [
        title,
        quote,
        tower,
        towerGlow,
        columns[0],
        columnLineGroups[0],
        closing,
        rainBg,
        rainFg,
        aura,
      ],
      { opacity: 0 },
    );
    tl.set(columns.slice(1), { display: "none", opacity: 0 });
    tl.set(columnLineGroups.slice(1).flat(), { opacity: 0 });
  } else {
    tl.set(
      [
        title,
        quote,
        tower,
        towerGlow,
        columns,
        bodyLines,
        closing,
        rainBg,
        rainFg,
        aura,
      ],
      { opacity: 0 },
    );
  }
  tl.set(tiers, { scaleX: 0, opacity: 0 });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    // Radius scaled up to 500vmax to ensure the mask shape always covers the screen corners
    { "--radius": "400vmax", duration: 7, ease: "power2.inOut" },
    0,
  )
    .to(
      [aura, rainBg, rainFg],
      { opacity: 1, duration: 3.5, stagger: 0.2 },
      0.5,
    )

    .fromTo(
      title,
      { opacity: 0, y: 35, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 4,
        ease: "power3.out",
      },
      1.5,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 15, letterSpacing: "0.8em", filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        letterSpacing: "0.5em",
        filter: "blur(0px)",
        duration: 3.5,
        ease: "power2.out",
      },
      2.0,
    )

    .fromTo(
      tower,
      { opacity: 0, y: 40, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 4,
        ease: "power2.out",
      },
      2.2,
    )
    .fromTo(
      tiers,
      { opacity: 0, scaleX: 0 },
      {
        opacity: 1,
        scaleX: 1,
        duration: 2,
        stagger: 0.15,
        ease: "power3.out",
      },
      2.8,
    )
    .to(towerGlow, { opacity: 1, duration: 3 }, 3)

    .to(
      [title, quote, tower, towerGlow],
      {
        opacity: 0,
        y: -25,
        filter: "blur(12px)",
        duration: 3.5,
        ease: "power2.inOut",
      },
      "+=3.5",
    )
    .set(intro, { display: "none" });

  if (isMobile) {
    columns.forEach((column, index) => {
      const lines = columnLineGroups[index];

      if (index > 0) {
        tl.set(column, { display: "", opacity: 0 });
      }

      tl.fromTo(
        column,
        { opacity: 0, y: 35, scale: 0.96, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 2.4,
          ease: "power2.out",
        },
        index === 0 ? "-=0.5" : undefined,
      )
        .fromTo(
          lines,
          { opacity: 0, y: 12, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.6,
            stagger: 0.08,
            ease: "power2.out",
          },
          "-=1.8",
        )
        .to(
          [column, lines],
          {
            opacity: 0,
            y: -15,
            filter: "blur(10px)",
            duration: 2.2,
            ease: "power2.inOut",
          },
          "+=2.2",
        )
        .set(column, { display: "none" });
    });

    tl.set(bodyContainer, { display: "none" });
  } else {
    tl.fromTo(
      columns,
      { opacity: 0, y: 35, scale: 0.96, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 3,
        stagger: 0.2,
        ease: "power2.out",
      },
      "-=0.5",
    )
      .fromTo(
        bodyLines,
        { opacity: 0, y: 12, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 2,
          stagger: 0.08,
          ease: "power2.out",
        },
        "-=2",
      )
      .to(
        [columns, bodyLines],
        {
          opacity: 0,
          y: -15,
          filter: "blur(10px)",
          duration: 4,
          ease: "power2.inOut",
        },
        "+=4.5",
      )
      .set(bodyContainer, { display: "none" });
  }

  tl.fromTo(
    closing,
    { opacity: 0, y: 15, filter: "blur(8px)", scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      duration: 3,
      ease: "power2.out",
    },
    "-=1",
  )
    .to(
      closing,
      {
        opacity: 0,
        y: -10,
        filter: "blur(10px)",
        duration: 3.5,
        ease: "power2.inOut",
      },
      "+=3.5",
    )

    .to([rainBg, rainFg, aura], { opacity: 0, duration: 3.5 }, "-=3")
    .to(
      scrollyBg,
      { "--radius": "0px", duration: 5.5, ease: "power2.inOut" },
      "-=2",
    );

  if (rainBg && rainFg) {
    // Background rain (slower, using Y offset)
    gsap.to(rainBg, {
      backgroundPosition: "20px 800px",
      duration: 2.8,
      repeat: -1,
      ease: "none",
    });
    // Foreground rain (faster, using Y offset)
    gsap.to(rainFg, {
      backgroundPosition: "30px 1400px",
      duration: 1.6,
      repeat: -1,
      ease: "none",
    });
  }
}
