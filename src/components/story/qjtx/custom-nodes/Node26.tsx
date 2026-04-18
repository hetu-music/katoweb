import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 14%, rgba(248, 113, 113, 0.14) 0%, rgba(31, 41, 55, 0.46) 24%, rgba(2, 6, 23, 0.98) 100%), url(/story/qjtx/26.avif) center/cover no-repeat fixed",
  titleColor: "#fef2f2",
  bodyColor: "#e5e7eb",
  accentColor: "#ef4444",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C68 7 84 20 100 50 C84 80 68 93 50 100 C32 93 16 80 0 50 C16 20 32 7 50 0 Z",
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
  const preludeLines = detail.body.slice(1, 5);
  const siegeLines = detail.body.slice(5, 10);
  const legendLines = detail.body.slice(10);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-ash-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.06), transparent 18%), radial-gradient(circle at 28% 82%, rgba(239,68,68,0.12), transparent 20%), radial-gradient(circle at 78% 70%, rgba(248,113,113,0.12), transparent 18%)",
        }}
      />
      <div
        className={`scrolly-embers-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(3px 3px at 80px 120px, rgba(239,68,68,0.82), transparent), radial-gradient(2px 2px at 260px 260px, rgba(253,186,116,0.72), transparent), radial-gradient(3px 3px at 420px 80px, rgba(248,113,113,0.82), transparent), radial-gradient(2px 2px at 520px 320px, rgba(255,255,255,0.6), transparent)",
          backgroundSize: "620px 420px",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex items-center justify-center px-6`}>
        <div className="flex max-w-5xl flex-col items-center text-center">
          <div className={`scrolly-eclipse-${event.id} relative mb-8 flex h-40 w-40 items-center justify-center md:mb-10 md:h-48 md:w-48`}>
            <div className="absolute inset-0 rounded-full border border-red-100/12" />
            <div className="absolute inset-5 rounded-full border border-red-100/10" />
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${accentColor}32 0%, transparent 72%)` }}
            />
            <div className="absolute inset-[22%] rounded-full bg-linear-to-b from-red-100/18 via-red-200/8 to-transparent" />
            <div className="absolute inset-x-[24%] bottom-[24%] h-px rotate-6 bg-linear-to-r from-transparent via-red-100/35 to-transparent" />
            <div className="absolute inset-x-[30%] top-[28%] h-px -rotate-12 bg-linear-to-r from-transparent via-red-100/28 to-transparent" />
          </div>

          <span className="mb-4 text-[10px] tracking-[0.5em] text-red-100/42 md:text-[11px]">
            帝都末夜 · 长歌送魂
          </span>
          <h2
            className={`scrolly-title-${event.id} text-center text-5xl font-serif font-light tracking-[0.4em] md:text-7xl md:tracking-[0.56em]`}
            style={{ color: titleColor, paddingLeft: "0.4em" }}
          >
            {detail.title}
          </h2>
          <p
            className={`scrolly-quote-${event.id} mt-6 max-w-3xl text-sm font-light tracking-[0.36em] md:text-lg md:tracking-[0.54em]`}
            style={{ color: bodyColor, paddingLeft: "0.36em" }}
          >
            {detail.quote}
          </p>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-8 md:px-8 md:py-10`}>
        <div className={`scrolly-ruins-${event.id} relative w-full max-w-7xl`}>
          <div className="absolute inset-x-0 bottom-6 h-28 bg-linear-to-t from-black/45 via-red-950/12 to-transparent blur-2xl md:bottom-10" />

          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[0.82fr_1.3fr_0.78fr] md:items-end md:gap-6">
            <section
              className={`scrolly-stele-${event.id} relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(39,39,42,0.9),rgba(24,24,27,0.96))] px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:min-h-[28rem] md:px-6 md:py-7`}
              style={{ clipPath: "polygon(16% 0%, 88% 0%, 100% 16%, 88% 100%, 0% 100%, 0% 12%)" }}
            >
              <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-white/8 to-transparent" />
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.34em] text-zinc-400">国师旧闻</span>
                <span className="h-px w-12 bg-zinc-500/20" />
              </div>
              <div className="flex flex-col gap-4">
                {preludeLines.map((line, index) => (
                  <p
                    key={index}
                    className={`scrolly-prelude-line-${event.id} text-[13px] leading-[2.02] tracking-[0.14em] md:text-[14px]`}
                    style={{ color: line.includes("法术通神") || line.includes("风华无双") ? titleColor : bodyColor }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>

            <section className={`scrolly-gate-${event.id} relative min-h-[24rem] overflow-hidden rounded-[2.4rem] border border-red-100/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(10,10,15,0.98))] px-5 py-6 shadow-[0_26px_80px_rgba(0,0,0,0.42)] md:min-h-[32rem] md:px-7 md:py-7`}>
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/8 to-transparent" />
              <div className="absolute inset-x-6 bottom-0 h-20 bg-linear-to-t from-red-900/12 to-transparent" />
              <div className="absolute left-[8%] bottom-0 h-44 w-16 rounded-t-[1.6rem] bg-linear-to-b from-zinc-700/70 to-zinc-900/90" />
              <div className="absolute right-[10%] bottom-0 h-56 w-16 rounded-t-[1.6rem] bg-linear-to-b from-zinc-700/72 to-zinc-900/92" />
              <div className="absolute left-1/2 bottom-0 h-48 w-[68%] -translate-x-1/2 rounded-t-[46%] border border-white/8 bg-linear-to-b from-zinc-700/26 via-zinc-900/40 to-zinc-950/92" />
              <div className="absolute left-1/2 bottom-0 h-36 w-[38%] -translate-x-1/2 rounded-t-[44%] bg-black/58" />
              <div className="absolute left-1/2 bottom-[6.4rem] h-24 w-px -translate-x-1/2 bg-linear-to-b from-red-100/35 to-transparent" />
              <div
                className={`scrolly-flare-${event.id} absolute left-1/2 bottom-[7.4rem] h-28 w-28 -translate-x-1/2 rounded-full blur-3xl`}
                style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 72%)` }}
              />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] tracking-[0.34em] text-red-50/42">
                  <span>帝都天岁</span>
                  <span>城破前三日</span>
                </div>

                <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 md:gap-4">
                  {siegeLines.map((line, index) => {
                    const emphasis =
                      line.includes("白炎军攻帝都天岁") ||
                      line.includes("天人之姿现世") ||
                      line.includes("阻炎军于帝都外三日") ||
                      line.includes("城陷");

                    return (
                      <p
                        key={index}
                        className={`scrolly-siege-line-${event.id} rounded-[1.35rem] border px-4 py-3 text-sm leading-[2] tracking-[0.15em] backdrop-blur-sm md:px-5 md:py-4 md:text-[15px] ${
                          index % 2 === 0
                            ? "ml-auto w-[86%] border-red-100/10 bg-black/28 text-right"
                            : "mr-auto w-[82%] border-white/8 bg-white/6 text-left"
                        }`}
                        style={{ color: emphasis ? "#fef2f2" : bodyColor }}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>

                <div className="flex justify-center pb-1">
                  <div className="rounded-full border border-red-100/14 bg-black/30 px-5 py-2 text-[10px] tracking-[0.34em] text-red-50/65">
                    活人无数
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`scrolly-legend-${event.id} relative min-h-[18rem] overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(39,39,42,0.92),rgba(17,24,39,0.98))] px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] md:min-h-[24rem] md:px-6 md:py-7`}
              style={{
                clipPath: "polygon(8% 0%, 100% 0%, 100% 84%, 82% 100%, 0% 100%, 0% 14%)",
                transform: "rotate(-5deg)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-14 bg-linear-to-b from-white/8 to-transparent" />
              <div className="mb-5 text-[10px] tracking-[0.34em] text-zinc-400">市井遗歌</div>
              <div className="flex h-full flex-col justify-between gap-5">
                <div className="flex flex-col gap-4">
                  {legendLines.map((line, index) => (
                    <p
                      key={index}
                      className={`scrolly-legend-line-${event.id} text-[13px] leading-[2.02] tracking-[0.15em] md:text-[14px]`}
                      style={{ color: line.includes("大慈悲者") ? "#fecaca" : bodyColor }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <div className="self-end rounded-full border border-red-100/16 px-4 py-2 text-[10px] tracking-[0.32em] text-red-50/62">
                  国师白发
                </div>
              </div>
            </section>
          </div>

          {detail.closing && (
            <div className={`scrolly-closing-${event.id} absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-red-100/16 bg-black/42 px-6 py-2 text-[10px] tracking-[0.34em] text-red-50/76 backdrop-blur-md md:bottom-4 md:text-[11px]`}>
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
  const eclipse = scrollyText.querySelector(`.scrolly-eclipse-${eventId}`);
  const title = scrollyText.querySelector(`.scrolly-title-${eventId}`);
  const quote = scrollyText.querySelector(`.scrolly-quote-${eventId}`);
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const ruins = scrollyText.querySelector(`.scrolly-ruins-${eventId}`);
  const stele = scrollyText.querySelector(`.scrolly-stele-${eventId}`);
  const gate = scrollyText.querySelector(`.scrolly-gate-${eventId}`);
  const legend = scrollyText.querySelector(`.scrolly-legend-${eventId}`);
  const preludeLines = scrollyText.querySelectorAll(`.scrolly-prelude-line-${eventId}`);
  const siegeLines = scrollyText.querySelectorAll(`.scrolly-siege-line-${eventId}`);
  const legendLines = scrollyText.querySelectorAll(`.scrolly-legend-line-${eventId}`);
  const flare = scrollyText.querySelector(`.scrolly-flare-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const ash = scrollyText.querySelector(`.scrolly-ash-${eventId}`);
  const embers = scrollyText.querySelector(`.scrolly-embers-${eventId}`);

  tl.set(
    [eclipse, title, quote, ruins, stele, gate, legend, preludeLines, siegeLines, legendLines, flare, closing, ash, embers],
    { opacity: 0 },
  );

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6, ease: "power2.inOut" },
    0,
  )
    .to([ash, embers], { opacity: 1, duration: 2.4 }, 0.5)
    .fromTo(
      eclipse,
      { opacity: 0, scale: 0.82, filter: "blur(14px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3.4, ease: "power3.out" },
      1.1,
    )
    .fromTo(
      title,
      { opacity: 0, y: 24, filter: "blur(14px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.4, ease: "power3.out" },
      1.5,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 12, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      1.9,
    )
    .to([eclipse, title, quote], { opacity: 0, y: -16, filter: "blur(12px)", duration: 3, ease: "power2.inOut" }, "+=2.2")
    .set(intro, { display: "none" })
    .fromTo(
      ruins,
      { opacity: 0, y: 28, filter: "blur(12px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.4, ease: "power2.out" },
      "-=0.1",
    )
    .fromTo(
      stele,
      { opacity: 0, x: -24, y: 18, rotate: -4, filter: "blur(8px)" },
      { opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)", duration: 1.9, ease: "power2.out" },
      "-=1.5",
    )
    .fromTo(
      gate,
      { opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 2.1, ease: "power2.out" },
      "-=1.6",
    )
    .fromTo(
      legend,
      { opacity: 0, x: 24, y: 18, rotate: -10, filter: "blur(8px)" },
      { opacity: 1, x: 0, y: 0, rotate: -5, filter: "blur(0px)", duration: 1.9, ease: "power2.out" },
      "-=1.6",
    )
    .fromTo(
      flare,
      { opacity: 0, scale: 0.2 },
      { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" },
      "-=1.7",
    )
    .fromTo(
      [...preludeLines, ...siegeLines, ...legendLines],
      { opacity: 0, y: 10, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, stagger: 0.07, ease: "power2.out" },
      "-=1.2",
    )
    .fromTo(
      closing,
      { opacity: 0, scale: 0.84, filter: "blur(6px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.6, ease: "back.out(1.7)" },
      "-=0.3",
    )
    .to([stele, gate, legend, preludeLines, siegeLines, legendLines, closing], { opacity: 0, y: -10, filter: "blur(10px)", duration: 3.8, ease: "power2.inOut" }, "+=4.4")
    .set(bodyContainer, { display: "none" })
    .to([ash, embers], { opacity: 0, duration: 2.8 }, "-=2.2")
    .to(scrollyBg, { "--radius": "0px", duration: 5.2, ease: "power2.inOut" }, "-=1.6");

  if (embers) {
    gsap.to(embers, {
      backgroundPosition: "80px -620px",
      duration: 10,
      repeat: -1,
      ease: "none",
    });
  }
}
