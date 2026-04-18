import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 16%, rgba(187, 247, 208, 0.1) 0%, rgba(6, 46, 27, 0.34) 26%, rgba(1, 5, 16, 0.98) 100%), url(/story/qjtx/9.avif) center/cover no-repeat fixed",
  titleColor: "#f7fee7",
  bodyColor: "#dcfce7",
  accentColor: "#fb7185",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C66 8 86 20 100 50 C86 80 66 92 50 100 C34 92 14 80 0 50 C14 20 34 8 50 0 Z",
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

  const { accentColor } = resolvedTheme;
  const openingLines = detail.body.slice(0, 3);
  const aftermathLines = detail.body.slice(4);
  const noteRotations = ["-rotate-3", "rotate-2", "-rotate-2"];

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden`}>
      <div
        className={`scrolly-breeze-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 16% 30%, rgba(255,255,255,0.06), transparent 16%), radial-gradient(circle at 82% 18%, rgba(187,247,208,0.12), transparent 22%), radial-gradient(circle at 60% 78%, rgba(251,113,133,0.08), transparent 18%)",
        }}
      />
      <div
        className={`scrolly-petalfield-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(7px 3px at 100px 80px, rgba(251,113,133,0.86), transparent), radial-gradient(6px 3px at 320px 180px, rgba(255,255,255,0.75), transparent), radial-gradient(8px 3px at 460px 260px, rgba(251,191,36,0.68), transparent), radial-gradient(6px 3px at 160px 320px, rgba(187,247,208,0.82), transparent)",
          backgroundSize: "540px 420px",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex items-center justify-center px-6`}>
        <div className="relative flex flex-col items-center">
          <div className="absolute left-1/2 top-0 h-20 w-px -translate-x-1/2 bg-linear-to-b from-emerald-50/55 to-transparent" />
          <div
            className={`scrolly-hanging-${event.id} relative mt-16 flex w-[18rem] flex-col items-center rounded-[2rem] border border-emerald-50/10 bg-[linear-gradient(180deg,rgba(254,252,232,0.96),rgba(236,253,245,0.92))] px-7 py-9 text-stone-700 shadow-[0_28px_80px_rgba(0,0,0,0.38)] md:w-[22rem] md:px-9 md:py-11`}
          >
            <div className="absolute inset-x-8 top-4 h-px bg-linear-to-r from-transparent via-stone-500/20 to-transparent" />
            <div className="absolute inset-x-8 bottom-4 h-px bg-linear-to-r from-transparent via-stone-500/18 to-transparent" />
            <div className="mb-4 text-[10px] tracking-[0.4em] text-stone-400 md:text-[11px]">
              琳琅旧藏
            </div>
            <h2
              className={`scrolly-title-${event.id} text-center text-4xl font-serif font-light tracking-[0.4em] md:text-5xl md:tracking-[0.5em]`}
              style={{ color: "#365314", paddingLeft: "0.4em" }}
            >
              {detail.title}
            </h2>
            <p
              className={`scrolly-quote-${event.id} mt-6 text-center text-[13px] leading-[2.1] tracking-[0.22em] md:mt-8 md:text-sm`}
              style={{ color: "#4b5563" }}
            >
              {detail.quote}
            </p>
            <div className="relative mt-8 flex h-28 w-20 items-center justify-center rounded-[999px] border border-stone-500/12 bg-linear-to-b from-white/35 to-transparent md:h-32 md:w-24">
              <div className="absolute top-6 h-12 w-12 rounded-full border border-rose-300/30" />
              <div
                className="h-3 w-3 rounded-full shadow-[0_0_18px_rgba(244,63,94,0.35)]"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-8 md:px-8 md:py-10`}>
        <div className={`scrolly-handscroll-${event.id} relative w-full max-w-7xl`}>
          <div className="absolute left-0 top-1/2 hidden h-[24rem] w-5 -translate-y-1/2 rounded-full bg-linear-to-b from-stone-700 via-stone-500 to-stone-800 shadow-[inset_0_0_14px_rgba(255,255,255,0.08)] md:block" />
          <div className="absolute right-0 top-1/2 hidden h-[24rem] w-5 -translate-y-1/2 rounded-full bg-linear-to-b from-stone-700 via-stone-500 to-stone-800 shadow-[inset_0_0_14px_rgba(255,255,255,0.08)] md:block" />

          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-50/10 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(236,253,245,0.92))] px-5 py-6 text-stone-700 shadow-[0_26px_90px_rgba(0,0,0,0.42)] md:px-8 md:py-8">
            <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/30 to-transparent" />
            <div className="absolute inset-y-8 left-[19%] hidden w-px bg-stone-600/10 md:block" />
            <div className="absolute inset-y-8 right-[23%] hidden w-px bg-stone-600/10 md:block" />

            <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[0.8fr_1.3fr_0.9fr] md:gap-6">
              <div className={`scrolly-notes-${event.id} relative min-h-[14rem] md:min-h-[28rem]`}>
                {openingLines.map((line, index) => (
                  <div
                    key={index}
                    className={`scrolly-note-${event.id} absolute rounded-[1.25rem] border border-stone-500/12 bg-white/72 px-4 py-4 text-[13px] leading-[2] tracking-[0.14em] text-stone-700 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm md:px-5 md:py-5 ${noteRotations[index]}`}
                    style={{
                      left: index === 0 ? "0%" : index === 1 ? "10%" : "6%",
                      top: index === 0 ? "2%" : index === 1 ? "34%" : "66%",
                      width: index === 1 ? "82%" : "76%",
                    }}
                  >
                    <div className="mb-2 text-[10px] tracking-[0.32em] text-stone-400">
                      {index === 0 ? "旧录" : index === 1 ? "春卷" : "题识"}
                    </div>
                    <p className={line.includes("春风画卷") ? "text-emerald-900" : ""}>{line}</p>
                  </div>
                ))}
              </div>

              <div className={`scrolly-painting-${event.id} relative flex min-h-[23rem] items-center justify-center overflow-hidden rounded-[2.2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.95),rgba(220,252,231,0.84)_58%,rgba(254,249,195,0.65)_100%)] px-6 py-8 md:min-h-[28rem]`}>
                <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[10px] tracking-[0.36em] text-stone-400">
                  <span>春日行游图</span>
                  <span>公子墨离</span>
                </div>
                <div className="absolute inset-x-6 bottom-5 flex items-center justify-between text-[10px] tracking-[0.32em] text-stone-400">
                  <span>真迹一卷</span>
                  <span>琳琅轩识</span>
                </div>
                <div className="absolute left-1/2 top-1/2 h-60 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[48%_48%_38%_38%/30%_30%_60%_60%] bg-radial-[at_50%_30%] from-white/70 via-emerald-50/35 to-transparent blur-[1px] md:h-72 md:w-52" />
                <div className="absolute left-1/2 top-[24%] h-14 w-14 -translate-x-1/2 rounded-full border border-rose-300/32" />
                <div
                  className={`scrolly-cinnabar-${event.id} absolute left-1/2 top-[28%] h-4 w-4 -translate-x-1/2 rounded-full shadow-[0_0_24px_rgba(244,63,94,0.38)]`}
                  style={{ backgroundColor: accentColor }}
                />
                <div className="absolute left-1/2 top-[38%] h-40 w-28 -translate-x-1/2 rounded-[46%_46%_40%_40%/28%_28%_62%_62%] border border-stone-500/10 bg-linear-to-b from-white/55 via-white/18 to-transparent md:h-48 md:w-32" />
                <div className="absolute left-[22%] top-[26%] h-24 w-px bg-linear-to-b from-transparent via-emerald-700/12 to-transparent" />
                <div className="absolute right-[22%] top-[32%] h-28 w-px bg-linear-to-b from-transparent via-stone-700/10 to-transparent" />
                <div className="absolute bottom-[22%] left-1/2 max-w-[16rem] -translate-x-1/2 text-center text-sm leading-[2] tracking-[0.18em] text-stone-600 md:text-[15px]">
                  画中女子眉间朱砂一点，
                  <br />
                  颜色犹胜摇光皇后。
                </div>
              </div>

              <div className={`scrolly-colophon-${event.id} relative flex min-h-[18rem] flex-col justify-between rounded-[1.8rem] border border-stone-500/10 bg-white/58 px-5 py-5 shadow-[inset_0_0_0_1px_rgba(120,113,108,0.05)] md:min-h-[28rem] md:px-6 md:py-6`}>
                <div className="text-[10px] tracking-[0.36em] text-stone-400">后世题跋</div>
                <div className="flex flex-1 flex-col justify-center gap-4 md:gap-5">
                  {aftermathLines.map((line, index) => {
                    const emphasis =
                      line.includes("绝世") ||
                      line.includes("朱砂一点") ||
                      line.includes("春风复来") ||
                      line.includes("争寻画卷");

                    return (
                      <p
                        key={index}
                        className={`scrolly-after-line-${event.id} text-[13px] leading-[2.02] tracking-[0.14em] md:text-[14px]`}
                        style={{ color: emphasis ? "#365314" : "#4b5563" }}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end">
                  <div className="rounded-full border border-rose-300/30 px-4 py-2 text-[10px] tracking-[0.32em] text-rose-700/72">
                    故人安在
                  </div>
                </div>
              </div>
            </div>

            {detail.closing && (
              <div className={`scrolly-closing-${event.id} absolute bottom-5 right-5 rounded-full border border-rose-300/30 bg-rose-50/70 px-4 py-2 text-[10px] tracking-[0.28em] text-rose-800/78 shadow-[0_10px_20px_rgba(244,63,94,0.08)] md:bottom-7 md:right-7 md:text-[11px]`}>
                {detail.closing}
              </div>
            )}
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
  const hanging = scrollyText.querySelector(`.scrolly-hanging-${eventId}`);
  const title = scrollyText.querySelector(`.scrolly-title-${eventId}`);
  const quote = scrollyText.querySelector(`.scrolly-quote-${eventId}`);
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const handscroll = scrollyText.querySelector(`.scrolly-handscroll-${eventId}`);
  const notes = scrollyText.querySelectorAll(`.scrolly-note-${eventId}`);
  const painting = scrollyText.querySelector(`.scrolly-painting-${eventId}`);
  const cinnabar = scrollyText.querySelector(`.scrolly-cinnabar-${eventId}`);
  const colophon = scrollyText.querySelector(`.scrolly-colophon-${eventId}`);
  const afterLines = scrollyText.querySelectorAll(`.scrolly-after-line-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);
  const breeze = scrollyText.querySelector(`.scrolly-breeze-${eventId}`);
  const petalfield = scrollyText.querySelector(`.scrolly-petalfield-${eventId}`);

  tl.set(
    [hanging, title, quote, handscroll, notes, painting, cinnabar, colophon, afterLines, closing, breeze, petalfield],
    { opacity: 0 },
  );

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 6.2, ease: "power2.inOut" },
    0,
  )
    .to([breeze, petalfield], { opacity: 1, duration: 2.6 }, 0.5)
    .fromTo(
      hanging,
      { opacity: 0, y: 28, scale: 0.94, filter: "blur(16px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 3.8, ease: "power3.out" },
      1.1,
    )
    .fromTo(
      title,
      { opacity: 0, y: 12, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.8, ease: "power2.out" },
      1.6,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 10, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.6, ease: "power2.out" },
      1.9,
    )
    .to([hanging, title, quote], { opacity: 0, y: -14, filter: "blur(12px)", duration: 3, ease: "power2.inOut" }, "+=2.4")
    .set(intro, { display: "none" })
    .fromTo(
      handscroll,
      { opacity: 0, scaleX: 0.82, y: 18, filter: "blur(12px)" },
      { opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)", duration: 2.6, ease: "power2.out" },
      "-=0.2",
    )
    .fromTo(
      notes,
      { opacity: 0, x: -24, y: 10, filter: "blur(8px)" },
      { opacity: 1, x: 0, y: 0, filter: "blur(0px)", duration: 1.8, stagger: 0.15, ease: "power2.out" },
      "-=1.6",
    )
    .fromTo(
      painting,
      { opacity: 0, scale: 0.92, filter: "blur(10px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2.1, ease: "power2.out" },
      "-=1.7",
    )
    .fromTo(
      cinnabar,
      { opacity: 0, scale: 0.2 },
      { opacity: 1, scale: 1, duration: 1.3, ease: "back.out(2.4)" },
      "-=1.2",
    )
    .fromTo(
      [colophon, afterLines],
      { opacity: 0, x: 24, filter: "blur(8px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.8, stagger: 0.08, ease: "power2.out" },
      "-=1.5",
    )
    .fromTo(
      closing,
      { opacity: 0, scale: 0.7, rotate: -12, filter: "blur(8px)" },
      { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 1.6, ease: "back.out(1.8)" },
      "-=0.5",
    )
    .to([notes, painting, colophon, afterLines, closing], { opacity: 0, y: -10, filter: "blur(10px)", duration: 3.6, ease: "power2.inOut" }, "+=4.2")
    .set(bodyContainer, { display: "none" })
    .to([breeze, petalfield], { opacity: 0, duration: 2.8 }, "-=2.2")
    .to(scrollyBg, { "--radius": "0px", duration: 5.4, ease: "power2.inOut" }, "-=1.6");

  if (petalfield) {
    gsap.to(petalfield, {
      backgroundPosition: "260px -180px",
      duration: 14,
      repeat: -1,
      ease: "none",
    });
  }
}
