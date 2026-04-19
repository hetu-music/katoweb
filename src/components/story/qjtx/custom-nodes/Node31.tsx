import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 20%, rgba(225, 29, 72, 0.03) 0%, rgba(15, 23, 42, 0.6) 30%, rgba(2, 6, 23, 0.98) 100%), url(/story/qjtx/31.avif) center/cover no-repeat fixed",
  titleColor: "#fdf2f8",
  bodyColor: "#cbd5e1",
  accentColor: "#be123c",
  layout: "horizontal",
  specialEffect: "none",
  maskPath:
    "M50 0 C68 8 82 18 92 34 C100 48 100 52 92 66 C82 82 68 92 50 100 C32 92 18 82 8 66 C0 52 0 48 8 34 C18 18 32 8 50 0 Z",
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

  const { titleColor, bodyColor } = resolvedTheme;
  const leftLines = detail.body.slice(0, 8);
  const rightLines = detail.body.slice(8);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif`}>
      <div
        className={`scrolly-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage:
            "radial-gradient(2px 2px at 60px 60px, rgba(255,255,255,0.7), transparent), radial-gradient(3px 3px at 160px 140px, rgba(226,232,240,0.6), transparent), radial-gradient(1px 1px at 240px 220px, rgba(255,255,255,0.8), transparent), radial-gradient(3px 3px at 360px 100px, rgba(225,29,72,0.3), transparent)",
          backgroundSize: "420px 420px",
        }}
      />
      <div
        className={`scrolly-haze-${event.id} absolute inset-0 pointer-events-none opacity-0`}
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(225,29,72,0.06), transparent 40%), radial-gradient(circle at 50% 70%, rgba(15,23,42,0.5), transparent 60%)",
        }}
      />

      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="absolute left-[8%] top-[15%] text-slate-100/[0.03] text-6xl font-light tracking-[0.6em] select-none pointer-events-none md:text-8xl md:left-[12%]" style={{ writingMode: 'vertical-rl' }}>九龙塔</div>
        <div className="absolute right-[8%] bottom-[15%] text-slate-100/[0.03] text-6xl font-light tracking-[0.6em] select-none pointer-events-none md:text-8xl md:right-[12%]" style={{ writingMode: 'vertical-rl' }}>遗像长悬</div>

        <div className="flex w-full max-w-6xl flex-col items-center gap-14 md:flex-row md:justify-center md:gap-24">
          
          <div className={`scrolly-frame-${event.id} relative flex h-[24rem] w-[15rem] flex-shrink-0 flex-col items-center justify-center md:h-[32rem] md:w-[19rem]`}>
            <div className="absolute top-[-15rem] left-[25%] h-[15rem] w-px bg-gradient-to-b from-transparent to-white/10" />
            <div className="absolute top-[-15rem] right-[25%] h-[15rem] w-px bg-gradient-to-b from-transparent to-white/10" />
            
            <div className="scrolly-canvas-container relative flex h-full w-full flex-col items-center">
              <div className="scrolly-rod-top absolute top-0 z-20 h-3.5 w-[112%] rounded-full border border-white/10 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.8)]" />
              
              <div className="scrolly-canvas relative z-10 my-1.5 flex-1 w-full overflow-hidden border-x border-white/5 bg-slate-950/80 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/20 via-black/40 to-black/80" />
                
                <div className={`absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-900/20 blur-[50px]`} />
                
                <div className={`scrolly-zhusha-${event.id} absolute left-1/2 top-[38%] h-2 w-2 -translate-x-1/2 rounded-full bg-rose-500 blur-[0.5px] shadow-[0_0_15px_rgba(225,29,72,0.9),0_0_30px_rgba(225,29,72,0.6)]`} />
                
                <div className={`scrolly-veil-left-${event.id} absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-white/5 to-transparent blur-md`} />
                <div className={`scrolly-veil-right-${event.id} absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/5 to-transparent blur-md`} />
              </div>

              <div className="scrolly-rod-bottom absolute bottom-0 z-20 h-4 w-[116%] rounded-full border border-white/10 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 shadow-[0_-8px_20px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          <div className="z-10 flex flex-col items-center gap-8 text-center md:items-start md:text-left">
            <span className="text-xs tracking-[0.8em] text-rose-400/70 md:text-[13px]">
              七重纱幕 · 一壁遗容
            </span>
            <h2
              className={`scrolly-title-${event.id} text-5xl font-light tracking-[0.3em] drop-shadow-[0_0_30px_rgba(225,29,72,0.3)] md:text-7xl lg:text-8xl`}
              style={{ color: titleColor, paddingLeft: "0.3em" }}
            >
              {detail.title}
            </h2>
            <p
              className={`scrolly-quote-${event.id} max-w-md text-[15px] font-light leading-[2] tracking-[0.25em] md:text-lg md:tracking-[0.35em]`}
              style={{ color: bodyColor, paddingLeft: "0.25em" }}
            >
              {detail.quote}
            </p>
          </div>
        </div>
      </div>

      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-12 md:px-10`}>
        <div className={`scrolly-chamber-${event.id} grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-16`}>
          <div className="flex flex-col justify-center gap-6">
            {leftLines.map((line, index) => {
              const emphasis = line.includes("雪夜") || line.includes("九龙塔") || line.includes("画像");
              return (
                <div key={`left-${index}`} className={`scrolly-body-line group relative flex justify-end`}>
                  <p
                    className={`relative z-10 max-w-sm px-7 py-4 text-right text-[15px] leading-[2.2] tracking-[0.2em] transition-all duration-700 md:text-[16px]
                      ${emphasis ? "text-rose-100 font-normal drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]" : "text-slate-300 font-light group-hover:text-slate-100"}`}
                  >
                    {line}
                  </p>
                  <div className={`absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent ${emphasis ? 'via-rose-500/80' : 'via-white/10'} to-transparent transition-colors duration-700 group-hover:via-white/30`} />
                  {emphasis && <div className="absolute right-[-1px] top-1/2 h-1/2 w-[2px] -translate-y-1/2 bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]" />}
                </div>
              );
            })}
          </div>

          <div className="relative hidden items-center justify-center md:flex">
            <div className={`scrolly-core-${event.id} relative flex h-[42rem] w-[8rem] items-center justify-center`}>
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-rose-500/30 to-transparent" />
              
              <div className="absolute left-1/2 top-[15%] h-3 w-3 -translate-x-1/2 rotate-45 border border-rose-500/40 bg-rose-950/60 shadow-[0_0_10px_rgba(225,29,72,0.3)]" />
              <div className="absolute left-1/2 bottom-[15%] h-3 w-3 -translate-x-1/2 rotate-45 border border-rose-500/40 bg-rose-950/60 shadow-[0_0_10px_rgba(225,29,72,0.3)]" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.35rem] font-light tracking-[1.2em] text-rose-300/30 drop-shadow-[0_0_20px_rgba(225,29,72,0.2)]" style={{ writingMode: 'vertical-rl' }}>
                倾尽天下
              </div>

              <div
                className={`scrolly-core-glow-${event.id} absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]`}
                style={{ background: `radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 60%)` }}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6">
            {rightLines.map((line, index) => {
              const emphasis = line.includes("颜色无双") || line.includes("追随那人而去") || line.includes("史书里") || line.includes("朱砂");
              return (
                <div key={`right-${index}`} className={`scrolly-body-line group relative flex justify-start`}>
                  <div className={`absolute left-0 top-0 h-full w-[1px] bg-gradient-to-b from-transparent ${emphasis ? 'via-rose-500/80' : 'via-white/10'} to-transparent transition-colors duration-700 group-hover:via-white/30`} />
                  {emphasis && <div className="absolute left-[-1px] top-1/2 h-1/2 w-[2px] -translate-y-1/2 bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]" />}
                  <p
                    className={`relative z-10 max-w-sm px-7 py-4 text-left text-[15px] leading-[2.2] tracking-[0.2em] transition-all duration-700 md:text-[16px]
                      ${emphasis ? "text-rose-100 font-normal drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]" : "text-slate-300 font-light group-hover:text-slate-100"}`}
                  >
                    {line}
                  </p>
                </div>
              );
            })}
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
  const frame = scrollyText.querySelector(`.scrolly-frame-${eventId}`);
  const zhusha = scrollyText.querySelector(`.scrolly-zhusha-${eventId}`);
  
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const chamber = scrollyText.querySelector(`.scrolly-chamber-${eventId}`);
  const bodyLines = scrollyText.querySelectorAll(`.scrolly-body-line`);
  const core = scrollyText.querySelector(`.scrolly-core-${eventId}`);
  
  const snow = scrollyText.querySelector(`.scrolly-snow-${eventId}`);
  const haze = scrollyText.querySelector(`.scrolly-haze-${eventId}`);
  const veilLeft = scrollyText.querySelector(`.scrolly-veil-left-${eventId}`);
  const veilRight = scrollyText.querySelector(`.scrolly-veil-right-${eventId}`);

  tl.set(
    [
      title,
      quote,
      frame,
      zhusha,
      chamber,
      bodyLines,
      core,
      snow,
      haze,
      veilLeft,
      veilRight,
    ],
    { opacity: 0 },
  );

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "150vmax", duration: 8, ease: "power2.inOut" },
    0,
  )
    .to([snow, haze], { opacity: 1, duration: 3 }, 0.6)
    
    .fromTo(
      frame,
      { opacity: 0, scale: 0.9, y: 30, filter: "blur(15px)" },
      { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 4, ease: "power3.out" },
      1.2
    )
    
    .to([veilLeft, veilRight], { opacity: 1, duration: 2.5, stagger: 0.2 }, 2.5)
    .fromTo(
      zhusha,
      { opacity: 0, scale: 0, filter: "blur(8px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3, ease: "elastic.out(1, 0.6)" },
      3.2
    )

    .fromTo(
      title,
      { opacity: 0, x: 25, filter: "blur(12px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      2.2
    )
    .fromTo(
      quote,
      { opacity: 0, y: 15, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      2.8
    )
    
    .to([intro], { opacity: 0, scale: 1.03, filter: "blur(15px)", duration: 3.2, ease: "power2.inOut" }, "+=3.5")
    .set(intro, { display: "none" })
    
    .fromTo(
      chamber,
      { opacity: 0, scale: 0.96, filter: "blur(10px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      "-=0.5"
    )
    .fromTo(
      core,
      { opacity: 0, scaleY: 0, transformOrigin: "top" },
      { opacity: 1, scaleY: 1, duration: 3.5, ease: "power3.out" },
      "-=2.5"
    )
    .fromTo(
      bodyLines,
      { 
        opacity: 0, 
        x: (i, el) => el.classList.contains("justify-end") ? 35 : -35, 
        filter: "blur(8px)" 
      },
      {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 2.5,
        stagger: 0.12,
        ease: "power2.out",
      },
      "-=2"
    )
    
    .to([bodyLines, chamber, core], { opacity: 0, y: -25, filter: "blur(12px)", duration: 4, ease: "power2.inOut" }, "+=5.5")
    .set(bodyContainer, { display: "none" })
    .to([snow, haze], { opacity: 0, duration: 3.5 }, "-=2.5")
    .to(scrollyBg, { "--radius": "0px", duration: 5.5, ease: "power2.inOut" }, "-=2");

  if (snow) {
    gsap.to(snow, {
      backgroundPosition: "-120px 420px",
      duration: 22,
      repeat: -1,
      ease: "none",
    });
  }

  if (veilLeft && veilRight) {
    gsap.to(veilLeft, {
      x: -12,
      duration: 5.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(veilRight, {
      x: 12,
      duration: 6.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }
}
