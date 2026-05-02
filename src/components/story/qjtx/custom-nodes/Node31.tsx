import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // Starts with a deep, tragic blue/black slate
  bg: "#020617", 
  titleColor: "#f8fafc",
  bodyColor: "#94a3b8",
  accentColor: "#be123c",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50 0 C68 8 82 18 92 34 C100 48 100 52 92 66 C82 82 68 92 50 100 C32 92 18 82 8 66 C0 52 0 48 8 34 C18 18 32 8 50 0 Z",
};

// Pseudo-random generator for consistent rendering without hydration errors
const prand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export function NodeLayout({
  event,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  // Split lines for monumental pillar-like layout
  const splitIndex = Math.ceil(detail.body.length / 2);
  const leftLines = detail.body.slice(0, splitIndex);
  const rightLines = detail.body.slice(splitIndex);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>
      
      {/* Global Wrapper */}
      <div className={`node-wrapper-${event.id} absolute inset-0 opacity-0 bg-[#020617]`}>
        
        {/* Base Background Image */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/31.avif')] bg-cover bg-center mix-blend-luminosity scale-105 pointer-events-none opacity-40" />

        {/* --- The Storm (The past chaos) --- */}
        {/* Violent red/orange overlay that will fade out to represent the clamor dying down */}
        <div className={`war-overlay-${event.id} absolute inset-0 bg-linear-to-b from-red-950 via-[#3f0707]/80 to-black mix-blend-multiply pointer-events-none z-0`} />
        
        {/* Violent, fast-moving embers */}
        <div className={`war-embers-${event.id} absolute inset-0 pointer-events-none z-0`}>
            {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className={`ember-particle-${event.id} absolute bg-orange-400 rounded-full blur-[1px] shadow-[0_0_15px_rgba(239,68,68,0.9)]`} 
                     style={{ width: `${prand(i)*4+2}px`, height: `${prand(i*1.1)*4+2}px`, left: `${prand(i*1.2)*100}%`, top: `${prand(i*1.3)*100}%` }} />
            ))}
        </div>

        {/* --- The Tranquility (The cold aftermath) --- */}
        {/* Cold, slate-blue overlay that remains after the fire dies */}
        <div className={`peace-overlay-${event.id} absolute inset-0 bg-linear-to-b from-[#020617]/90 via-[#0f172a]/60 to-[#020617]/95 pointer-events-none z-0 opacity-0`} />
        
        {/* Slow, silent, infinite snow/ash falling in the cold void */}
        <div className={`peace-snow-${event.id} absolute inset-0 pointer-events-none opacity-0 z-0`}>
            {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className={`snow-particle-${event.id} absolute bg-slate-300/40 rounded-full blur-[1px]`} 
                     style={{ width: `${prand(i*2)*3+1}px`, height: `${prand(i*2.1)*3+1}px`, left: `${prand(i*2.2)*100}%`, top: "-10%" }} />
            ))}
        </div>

        {/* --- Content Phases --- */}
        
        {/* Phase 1: Intro (Cooling Text Effect) */}
        <div className={`content-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8 pointer-events-none z-10 opacity-0`}>
            <div className="w-[1px] h-24 md:h-32 bg-linear-to-b from-transparent to-slate-400/50 mb-8" />
            <h2 className={`title-text-${event.id} text-5xl md:text-[6rem] tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-light text-center break-words leading-tight max-w-[90vw]`}>
                {detail.title}
            </h2>
            <div className={`quote-text-${event.id} mt-8 md:mt-10 text-xs md:text-[16px] tracking-[0.6em] md:tracking-[0.8em] font-light text-center w-full max-w-[85vw] md:max-w-2xl leading-[2.5] pl-[0.6em] md:pl-[0.8em] whitespace-normal break-words`}>
                {detail.quote}
            </div>
            <div className="w-[1px] h-24 md:h-32 bg-linear-to-t from-transparent to-slate-400/50 mt-8" />
        </div>

        {/* Phase 2: The Monumental Body (Two giant pillars of text fading into the cold) */}
        <div className={`content-body-${event.id} absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-32 px-6 md:px-12 pointer-events-none z-10 opacity-0`}>
            
            {/* Left Pillar */}
            <div className="flex flex-col gap-8 md:gap-12 max-w-xl text-center md:text-right">
                {leftLines.map((line, i) => (
                    <p key={i} className={`body-line-${event.id} text-[15px] md:text-[18px] leading-[2.5] tracking-[0.3em] md:tracking-[0.4em] text-slate-300 font-light whitespace-normal break-words`}>
                        {line}
                    </p>
                ))}
            </div>

            {/* Center: The Altar / The Cinnabar Focus */}
            <div className="hidden md:flex flex-col items-center justify-center h-3/4 relative w-32 shrink-0">
                <div className="absolute top-0 bottom-0 w-[1px] bg-linear-to-b from-transparent via-slate-500/20 to-transparent" />
                <div className={`cinnabar-dot-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-[0_0_40px_10px_rgba(225,29,72,0.8)] opacity-0`} />
            </div>

            {/* Right Pillar */}
            <div className="flex flex-col gap-8 md:gap-12 max-w-xl text-center md:text-left">
                {rightLines.map((line, i) => {
                    const emphasis = line.includes("朱砂") || line.includes("颜色无双") || line.includes("大慈悲者");
                    return (
                        <p key={i} className={`body-line-${event.id} text-[15px] md:text-[18px] leading-[2.5] tracking-[0.3em] md:tracking-[0.4em] whitespace-normal break-words ${emphasis ? 'text-rose-200 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)] font-normal' : 'text-slate-300 font-light'}`}>
                            {line}
                        </p>
                    )
                })}
            </div>
        </div>

        {/* Phase 3: Closing (The Echo in the void) */}
        <div className={`content-closing-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none z-10 opacity-0`}>
             <div className="text-slate-200 text-sm md:text-xl tracking-[1em] md:tracking-[1.5em] pl-[1em] md:pl-[1.5em] font-light max-w-4xl text-center leading-[3] drop-shadow-[0_0_20px_rgba(241,245,249,0.3)] whitespace-normal break-words">
                 {detail.closing}
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
  const selAll = (s: string) => scrollyText.querySelectorAll(s);

  const wrapper = sel(`.node-wrapper-${eventId}`);
  
  const warOverlay = sel(`.war-overlay-${eventId}`);
  const warEmbers = sel(`.war-embers-${eventId}`);
  const emberParticles = selAll(`.ember-particle-${eventId}`);
  
  const peaceOverlay = sel(`.peace-overlay-${eventId}`);
  const peaceSnow = sel(`.peace-snow-${eventId}`);
  const snowParticles = selAll(`.snow-particle-${eventId}`);

  const intro = sel(`.content-intro-${eventId}`);
  const titleText = sel(`.title-text-${eventId}`);
  const quoteText = sel(`.quote-text-${eventId}`);
  
  const bodyStage = sel(`.content-body-${eventId}`);
  const bodyLines = selAll(`.body-line-${eventId}`);
  const cinnabarDot = sel(`.cinnabar-dot-${eventId}`);
  
  const closingStage = sel(`.content-closing-${eventId}`);

  // Initial States
  tl.set([wrapper, intro, bodyStage, closingStage], { opacity: 0 });
  
  // Set text to start "hot" (smoldering)
  tl.set(titleText, { color: "#fca5a5", textShadow: "0 0 30px #e11d48", scale: 0.95, filter: "blur(8px)" });
  tl.set(quoteText, { color: "#fda4af", textShadow: "0 0 20px #e11d48", scale: 0.95, filter: "blur(8px)" });

  // Violent Embers Animation (Fast, upward)
  emberParticles.forEach(p => {
      gsap.to(p, {
          y: "-110vh",
          x: `+=${(Math.random() - 0.5) * 200}px`,
          opacity: Math.random() * 0.8 + 0.2,
          duration: 2 + Math.random() * 3, // Very fast
          repeat: -1,
          ease: "power1.in"
      });
  });

  // Silent Snow Animation (Slow, downward)
  snowParticles.forEach(p => {
      gsap.to(p, {
          y: "110vh",
          x: `+=${(Math.random() - 0.5) * 60}px`,
          opacity: Math.random() * 0.5 + 0.2,
          duration: 12 + Math.random() * 10, // Very slow and calm
          repeat: -1,
          ease: "none",
          delay: Math.random() * -10
      });
  });

  // --- THE TIMELINE ---

  // 0. The Chaos Begins
  tl.to(wrapper, { opacity: 1, duration: 1.5, ease: "power2.inOut" }, 0);

  // 1. The Clamor Fades (喧闹落尽) -> Transition from War to Peace
  // The red burns out into cold slate blue, embers vanish, snow begins.
  tl.to(warOverlay, { opacity: 0, duration: 5, ease: "power2.inOut" }, 1.5);
  tl.to(warEmbers, { opacity: 0, filter: "blur(10px)", duration: 4, ease: "power2.in" }, 1.5);
  tl.to(peaceOverlay, { opacity: 1, duration: 5, ease: "power2.inOut" }, 2);
  tl.to(peaceSnow, { opacity: 1, duration: 4, ease: "power2.out" }, 2.5);

  // 2. The Text Cools Down (Intro)
  tl.to(intro, { opacity: 1, duration: 2, ease: "power2.out" }, 3);
  
  // The Title and Quote "cool down" from glowing red to cold slate/white
  tl.to(titleText, { 
      color: "#f8fafc", 
      textShadow: "0 0 15px rgba(248,250,252,0.4)", 
      scale: 1, 
      filter: "blur(0px)", 
      duration: 5, 
      ease: "power3.out" 
  }, 3);
  tl.to(quoteText, { 
      color: "#cbd5e1", 
      textShadow: "0 0 10px rgba(203,213,225,0.2)", 
      scale: 1, 
      filter: "blur(0px)", 
      duration: 5, 
      ease: "power3.out" 
  }, 3.5);

  // Exit Intro
  tl.to(intro, { opacity: 0, y: -20, filter: "blur(15px)", duration: 3, ease: "power2.inOut" }, "+=4");
  tl.set(intro, { display: "none" });

  // 3. The Monumental Body (Memory Pillars)
  tl.set(bodyStage, { display: "flex", opacity: 1 });
  
  // Lines fade in slowly like inscriptions appearing on cold stone
  tl.fromTo(bodyLines, 
      { opacity: 0, y: 15, filter: "blur(10px)", color: "#fca5a5" }, // Start slightly warm/blurred
      { opacity: 1, y: 0, filter: "blur(0px)", color: (i, el) => el.classList.contains('text-rose-200') ? "#fecdd3" : "#cbd5e1", duration: 3, stagger: 0.3, ease: "power2.out" },
      "+=0.5"
  );

  // The Cinnabar appears exactly as the profound tragedy sinks in
  tl.to(cinnabarDot, { opacity: 1, scale: 1.5, duration: 4, ease: "elastic.out(1, 0.3)" }, "-=2");
  
  // Linger on the body, then fade out
  tl.to([bodyLines, cinnabarDot], { opacity: 0, y: -15, filter: "blur(15px)", duration: 3, ease: "power2.in" }, "+=5");
  tl.set(bodyStage, { display: "none" });

  // 4. Closing (The Final Echo in the void)
  tl.set(closingStage, { display: "flex", opacity: 1 });
  tl.fromTo(closingStage, 
      { opacity: 0, scale: 0.95, filter: "blur(15px)" }, 
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 4, ease: "power2.out" }, 
      "+=0.5"
  );
  
  tl.to(closingStage, { opacity: 0, filter: "blur(20px)", duration: 3, ease: "power2.in" }, "+=4");

  // 5. Global Exit (The complete silence)
  tl.to(peaceSnow, { opacity: 0, duration: 3 }, "-=2");
  tl.to(wrapper, { opacity: 0, duration: 2.5, ease: "power2.inOut" }, "-=1");
}
