import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Opaque base to hide timeline during expansion
  bg: "#050202", 
  titleColor: "#ffe4e6",
  bodyColor: "#e5e7eb",
  accentColor: "#e11d48",
  layout: "horizontal", 
  specialEffect: "none",
  maskPath: "M 50 0 C 80 0 100 20 100 50 C 100 80 80 100 50 100 C 20 100 0 80 0 50 C 0 20 20 0 50 0 Z",
};

export function NodeLayout({
  event,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  const phase1Lines = detail.body.slice(0, 3); 
  const phase2Lines = detail.body.slice(3, 5); 
  const phase3Lines = detail.body.slice(5, 7); 
  const cinnabarLine = detail.body[7]; 
  const phase4Lines = detail.body.slice(8); 

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>
      
      <div className={`node-wrapper-${event.id} absolute inset-0 bg-[#050202] opacity-0 pointer-events-none`}>
          
          {/* Full-Screen Background Image - Unmasked, completely clear, starts grayscale */}
          <div 
              className={`masterpiece-bg-${event.id} absolute inset-0 bg-[url('/story/qjtx/9.avif')] bg-cover bg-center pointer-events-none scale-105`} 
              style={{ filter: "grayscale(100%)" }} 
          />
          
          {/* Very faint gradient at the exact center to ensure text readability without ruining the background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.4)_0%,transparent_60%)] pointer-events-none" />

          {/* Floating embers */}
          <div className={`ambient-embers-${event.id} absolute inset-0 pointer-events-none opacity-0`}>
              {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className="absolute bg-rose-200/50 rounded-full blur-[1px]" 
                       style={{ width: `${Math.random()*3+1}px`, height: `${Math.random()*3+1}px`, left: `${Math.random()*100}%`, top: `${Math.random()*100}%` }} />
              ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 z-10">
              
              {/* Intro Phase */}
              <div className={`content-intro-${event.id} absolute flex flex-col items-center text-center opacity-0`}>
                  <h2 className="text-5xl md:text-[6rem] tracking-[0.5em] pl-[0.5em] font-light text-rose-50 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                      {detail.title}
                  </h2>
                  <p className="mt-8 text-stone-200 text-sm md:text-base tracking-[0.5em] pl-[0.5em] font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      {detail.quote}
                  </p>
              </div>

              {/* Phase 1: Moli's Rise */}
              <div className={`content-phase1-${event.id} absolute flex flex-col gap-8 md:gap-10 items-center text-center w-full max-w-4xl opacity-0`}>
                  {phase1Lines.map((l, i) => <p key={i} className="text-stone-100 tracking-[0.2em] md:tracking-[0.3em] text-[16px] md:text-[20px] leading-loose drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-light">{l}</p>)}
              </div>

              {/* Phase 2: The Fall */}
              <div className={`content-phase2-${event.id} absolute flex flex-col gap-8 md:gap-10 items-center text-center w-full max-w-3xl opacity-0`}>
                  {phase2Lines.map((l, i) => <p key={i} className={`tracking-[0.2em] md:tracking-[0.3em] text-[16px] md:text-[20px] leading-loose drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-light ${l === "……" ? "text-stone-400 tracking-[1em]" : "text-stone-300"}`}>{l}</p>)}
              </div>

              {/* Phase 3: The Discovery */}
              <div className={`content-phase3-${event.id} absolute flex flex-col gap-8 md:gap-10 items-center text-center w-full max-w-4xl opacity-0`}>
                  {phase3Lines.map((l, i) => <p key={i} className="text-stone-100 tracking-[0.2em] md:tracking-[0.3em] text-[16px] md:text-[20px] leading-loose drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-light">{l}</p>)}
              </div>

              {/* Phase 4: The Masterpiece */}
              <div className={`content-cinnabar-${event.id} absolute flex flex-col items-center justify-center w-full max-w-5xl opacity-0`}>
                  <p className="text-rose-100 text-xl md:text-3xl tracking-[0.4em] md:tracking-[0.5em] pl-[0.4em] md:pl-[0.5em] font-normal leading-loose drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] text-center">
                      {cinnabarLine}
                  </p>
              </div>

              {/* Phase 5: Echoes */}
              <div className={`content-phase5-${event.id} absolute flex flex-col gap-8 md:gap-10 items-center text-center w-full max-w-4xl opacity-0`}>
                  {phase4Lines.map((l, i) => <p key={i} className={`tracking-[0.25em] md:tracking-[0.35em] text-[16px] md:text-[20px] leading-loose drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-light ${l.includes("争寻画卷") ? "text-rose-200" : "text-stone-200"}`}>{l}</p>)}
              </div>

              {/* Closing */}
              <div className={`content-closing-${event.id} absolute flex flex-col items-center justify-center opacity-0`}>
                  <div className="w-[1px] h-16 md:h-24 bg-stone-300/50 mb-8 md:mb-12" />
                  <div className="text-stone-300 tracking-[0.8em] md:tracking-[1.2em] text-xs md:text-base pl-[0.8em] md:pl-[1.2em] max-w-[85vw] whitespace-normal break-words text-center font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      {detail.closing}
                  </div>
                  <div className="w-[1px] h-16 md:h-24 bg-stone-300/50 mt-8 md:mb-12" />
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
  const sel = (s: string) => scrollyText.querySelector(s);

  const wrapper = sel(`.node-wrapper-${eventId}`);
  const bgImg = sel(`.masterpiece-bg-${eventId}`);
  const embers = sel(`.ambient-embers-${eventId}`);
  
  const intro = sel(`.content-intro-${eventId}`);
  const phase1 = sel(`.content-phase1-${eventId}`);
  const phase2 = sel(`.content-phase2-${eventId}`);
  const phase3 = sel(`.content-phase3-${eventId}`);
  const cinnabar = sel(`.content-cinnabar-${eventId}`);
  const phase5 = sel(`.content-phase5-${eventId}`);
  const closing = sel(`.content-closing-${eventId}`);

  // Initial States
  tl.set([wrapper, embers, intro, phase1, phase2, phase3, cinnabar, phase5, closing], { opacity: 0 });
  tl.set(bgImg, { filter: "grayscale(100%)" });

  // 0. Entrance
  tl.to(wrapper, { opacity: 1, duration: 2, ease: "power2.inOut" }, 0);
  tl.to(embers, { opacity: 1, duration: 3 }, 1);

  // Phase 0: Intro
  tl.fromTo(intro, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "+=0.5");
  tl.to(intro, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.inOut" }, "+=3");

  // Phase 1 (Rise)
  tl.fromTo(phase1, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "-=0.5");
  tl.to(phase1, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.in" }, "+=3.5");

  // Phase 2 (Fall)
  tl.fromTo(phase2, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "-=0.5");
  tl.to(phase2, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.in" }, "+=3.5");

  // Phase 3 (Discovery)
  tl.fromTo(phase3, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "-=0.5");
  tl.to(phase3, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.in" }, "+=3.5");

  // Phase 4 (The Masterpiece Text - Color Reveal!)
  if (bgImg) {
      // Start the color reveal exactly as the Cinnabar text appears
      tl.to(bgImg, { filter: "grayscale(0%)", duration: 6, ease: "power2.out" }, "-=0.5");
  }
  tl.fromTo(cinnabar, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "<");
  tl.to(cinnabar, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.inOut" }, "+=3.5");
  
  // Phase 5 (Echoes)
  tl.fromTo(phase5, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" }, "-=0.5");
  tl.to(phase5, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.in" }, "+=3.5");

  // Closing
  tl.fromTo(closing, { opacity: 0, y: 20, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, ease: "power2.out" }, "+=0.5");
  tl.to(closing, { opacity: 0, filter: "blur(10px)", duration: 2, ease: "power2.in" }, "+=4");
  
  // Exit Wrapper
  tl.to(wrapper, { opacity: 0, duration: 2.5, ease: "power2.inOut" }, "+=0.5");
}
