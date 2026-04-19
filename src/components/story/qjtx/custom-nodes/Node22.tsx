import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  bg: "radial-gradient(circle at 50% 25%, rgba(52, 211, 153, 0.06) 0%, rgba(6, 78, 59, 0.55) 35%, rgba(2, 6, 23, 0.98) 100%), url(/story/qjtx/22.avif) center/cover no-repeat fixed",
  titleColor: "#ecfdf5",
  bodyColor: "#d1fae5",
  accentColor: "#10b981",
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
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif`}>
      {/* Ambient Sparks / Fireflies (SVG Data URI for high performance) */}
      <div
        className={`scrolly-sparks-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Ccircle cx='40' cy='250' r='1.5' fill='rgba(167,243,208,0.7)'/%3E%3Ccircle cx='120' cy='100' r='2' fill='rgba(52,211,153,0.5)'/%3E%3Ccircle cx='220' cy='180' r='1' fill='rgba(167,243,208,0.8)'/%3E%3Ccircle cx='280' cy='40' r='2.5' fill='rgba(16,185,129,0.4)'/%3E%3Ccircle cx='80' cy='60' r='1.5' fill='rgba(52,211,153,0.6)'/%3E%3Ccircle cx='180' cy='280' r='2' fill='rgba(167,243,208,0.5)'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* --- Intro Scene --- */}
      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6`}>
        <div className="relative flex max-w-4xl flex-col items-center text-center gap-10 md:gap-14">
          
          {/* Heavenly Mandate Seal */}
          <div className={`scrolly-seal-${event.id} relative flex h-20 w-20 items-center justify-center md:h-24 md:w-24`}>
            <div className="absolute inset-0 rotate-45 border border-emerald-500/40 bg-emerald-950/60 shadow-[0_0_40px_rgba(16,185,129,0.3)] backdrop-blur-md" />
            <div className="absolute inset-2 rotate-45 border border-emerald-400/20" />
            <div className="absolute inset-[-8px] rotate-45 border border-emerald-200/15 border-dashed md:inset-[-10px]" />
            <span className="relative z-10 text-xl font-light tracking-[0.5em] text-emerald-100 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] md:text-2xl" style={{ writingMode: 'vertical-rl' }}>
              天命
            </span>
          </div>

          <div className="flex flex-col items-center gap-6">
            <h2
              className={`scrolly-title-${event.id} text-5xl font-light tracking-[0.45em] drop-shadow-[0_0_40px_rgba(16,185,129,0.5)] md:text-7xl lg:text-8xl`}
              style={{ color: titleColor, paddingLeft: "0.45em" }}
            >
              {detail.title}
            </h2>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
            <p
              className={`scrolly-quote-${event.id} max-w-lg text-[14px] font-light leading-[2.2] tracking-[0.3em] text-emerald-50/70 md:text-[16px] md:tracking-[0.5em]`}
              style={{ paddingLeft: "0.3em" }}
            >
              {detail.quote}
            </p>
          </div>
        </div>
      </div>

      {/* --- Body Constellation / Fragments Scene --- */}
      <div className={`scrolly-body-container-${event.id} absolute inset-0 flex items-center justify-center px-4 py-6 md:px-10`}>
        
        {/* Astrolabe / Bagua Compass Background */}
        <div className={`scrolly-compass-${event.id} absolute top-1/2 left-1/2 flex h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 pointer-events-none items-center justify-center opacity-0 mix-blend-screen md:h-[55rem] md:w-[55rem]`}>
          <div className="absolute inset-0 rounded-full border-[1px] border-dashed border-emerald-300/20" />
          <div className="absolute inset-[10%] rounded-full border-[1px] border-emerald-400/10" />
          <div className="absolute inset-[25%] rounded-full border-[2px] border-dotted border-emerald-500/20" />
          <div className="absolute inset-[40%] rounded-full border-[1px] border-emerald-300/10" />
          
          <div className="absolute inset-[25%] rotate-45 border-[1px] border-emerald-400/15" />
          <div className="absolute inset-[25%] rotate-[22.5deg] border-[1px] border-emerald-300/10" />
          <div className="absolute inset-[25%] rotate-[67.5deg] border-[1px] border-emerald-300/10" />
          
          <div className="absolute top-[5%] bottom-[5%] left-1/2 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-emerald-300/20 to-transparent" />
          <div className="absolute left-[5%] right-[5%] top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />
        </div>

        {/* Free-floating scattered text fragments */}
        <div className={`scrolly-body-${event.id} relative z-10 grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3 md:gap-y-4 items-stretch content-center`}>
          {detail.body.map((paragraph, index) => {
            const isSeparator = paragraph === "……";
            const isKeyLine = paragraph.includes("起兵") || paragraph.includes("即位") || paragraph.includes("远走海外");

            if (isSeparator) {
              return (
                <div key={`sep-${index}`} className="scrolly-fragment col-span-1 md:col-span-2 lg:col-span-3 flex w-full justify-center py-1 opacity-0">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-emerald-500/40" />
                    <div className="h-1.5 w-1.5 rotate-45 bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-emerald-500/40" />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`item-${index}`}
                className={`scrolly-fragment relative flex w-full flex-col opacity-0 justify-center`}
              >
                <div className={`relative inline-block w-full h-full rounded-xl border ${isKeyLine ? 'border-emerald-400/30 bg-emerald-900/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-emerald-500/10 bg-emerald-950/30'} p-4 md:p-5 backdrop-blur-md flex flex-col justify-center`}>
                  {/* Decorative brackets for key lines */}
                  {isKeyLine && (
                    <>
                      <div className={`absolute -top-1.5 -left-1.5 h-3 w-3 border-t border-l border-emerald-300 shadow-[-2px_-2px_8px_rgba(110,231,183,0.5)]`} />
                      <div className={`absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b border-r border-emerald-300 shadow-[2px_2px_8px_rgba(110,231,183,0.5)]`} />
                      
                      {/* Jade glowing aura behind the text */}
                      <div className="absolute inset-0 bg-emerald-800/20 blur-xl" />
                    </>
                  )}
                  
                  <p
                    className={`relative z-10 text-[13px] leading-[1.8] tracking-[0.12em] md:text-[14px] md:leading-[1.9] text-center ${
                      isKeyLine 
                        ? 'font-normal text-emerald-50 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]' 
                        : 'font-light text-slate-200/95'
                    }`}
                  >
                    {paragraph}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Closing --- */}
      {detail.closing && (
        <div className={`scrolly-closing-container-${event.id} pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-6 md:bottom-16`}>
          <div className={`scrolly-closing-${event.id} relative overflow-hidden rounded-full border border-emerald-400/20 bg-emerald-950/60 px-8 py-4 text-[12px] font-light tracking-[0.45em] text-emerald-50/90 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-md md:px-10 md:py-5 md:text-[13px]`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.15),transparent_60%)]" />
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
  const seal = scrollyText.querySelector(`.scrolly-seal-${eventId}`);
  const title = scrollyText.querySelector(`.scrolly-title-${eventId}`);
  const quote = scrollyText.querySelector(`.scrolly-quote-${eventId}`);
  
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-container-${eventId}`);
  const compass = scrollyText.querySelector(`.scrolly-compass-${eventId}`);
  const fragments = scrollyText.querySelectorAll(`.scrolly-fragment`);
  
  const sparks = scrollyText.querySelector(`.scrolly-sparks-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);

  tl.set([seal, title, quote, fragments, closing, sparks, compass], {
    opacity: 0,
  });

  tl.fromTo(
    scrollyBg,
    { "--radius": "0px" },
    { "--radius": "250vmax", duration: 7, ease: "power2.inOut" },
    0,
  )
    .to(sparks, { opacity: 1, duration: 3.5 }, 0.5)
    
    .fromTo(
      seal,
      { opacity: 0, scale: 0.5, rotation: -45, filter: "blur(15px)" },
      { opacity: 1, scale: 1, rotation: 0, filter: "blur(0px)", duration: 4, ease: "power3.out" },
      1.2
    )
    .fromTo(
      title,
      { opacity: 0, y: 35, filter: "blur(15px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 4, ease: "power3.out" },
      1.6,
    )
    .fromTo(
      quote,
      { opacity: 0, y: 20, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power2.out" },
      2.2,
    )
    
    .to([seal, title, quote], { opacity: 0, y: -25, filter: "blur(15px)", duration: 3.5, ease: "power2.inOut" }, "+=3.5")
    .set(intro, { display: "none" })
    
    .to(compass, { opacity: 0.8, duration: 4 }, "-=1")
    
    .fromTo(
      fragments,
      { opacity: 0, y: 35, filter: "blur(12px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 3,
        stagger: 0.25,
        ease: "power2.out",
      },
      "-=1.5",
    )
    
    .to([fragments, compass], { opacity: 0, y: -20, filter: "blur(15px)", duration: 4, ease: "power2.inOut" }, "+=4.5")
    .set(bodyContainer, { display: "none" })
    
    .fromTo(
      closing,
      { opacity: 0, y: 20, filter: "blur(10px)", scale: 0.95 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 3, ease: "power2.out" },
      "-=1",
    )
    .to(closing, { opacity: 0, y: -15, filter: "blur(12px)", duration: 3.5, ease: "power2.inOut" }, "+=3.5")
    
    .to(sparks, { opacity: 0, duration: 3.5 }, "-=3")
    .to(scrollyBg, { "--radius": "0px", duration: 5.5, ease: "power2.inOut" }, "-=2");

  if (sparks) {
    gsap.to(sparks, {
      backgroundPosition: "150px -600px",
      duration: 15,
      repeat: -1,
      ease: "none",
    });
  }
  
  if (compass) {
    gsap.to(compass, {
      rotation: 360,
      duration: 120,
      repeat: -1,
      ease: "none",
    });
  }
}
