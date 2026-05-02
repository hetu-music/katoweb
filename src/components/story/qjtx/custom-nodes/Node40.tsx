import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // The absolute void for the curtain call
  bg: "#000000",
  titleColor: "#e5e5e5",
  bodyColor: "#a3a3a3",
  accentColor: "#ffffff",
  layout: "horizontal",
  specialEffect: "none",
  maskPath: "M50 0 C76 8 92 24 100 50 C92 76 76 92 50 100 C24 92 8 76 0 50 C8 24 24 8 50 0 Z",
};

export function NodeLayout({
  event,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none bg-black text-white`}>
      <div className={`node-wrapper-${event.id} absolute inset-0 opacity-0 bg-black`}>
        
        {/* Background Image: 40.avif */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/40.avif')] bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none scale-105" />
        
        {/* Deep vignettes to create absolute focus and isolation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_10%,#000000_85%)] pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
        
        {/* Falling cinematic dust motes (Curtain Dust) */}
        <div className={`finale-dust-${event.id} absolute inset-0 pointer-events-none opacity-0 mix-blend-screen`}>
           {Array.from({ length: 40 }).map((_, i) => (
               <div key={i} className={`dust-${event.id} absolute bg-white/20 rounded-full blur-[1px]`} 
                    style={{ 
                        width: Math.random()*3+1, 
                        height: Math.random()*3+1, 
                        left: `${Math.random()*100}%`, 
                        top: `${(Math.random()-0.2)*100}%` 
                    }} />
           ))}
        </div>

        {/* Phase 1: The Title (Curtain Opens / Final Whisper) */}
        <div className={`content-title-${event.id} absolute inset-0 flex items-center justify-center pointer-events-none`}>
            <h2 className="text-4xl md:text-7xl tracking-[1em] pl-[1em] font-light text-slate-200 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] opacity-0 filter blur-xl">
                {detail.title}
            </h2>
        </div>

        {/* Phase 2: The Body (The Final Lines) */}
        <div className={`content-body-${event.id} absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 md:px-12`}>
            <div className="flex flex-col gap-12 md:gap-20 max-w-4xl text-center">
                 {detail.body.map((line, i) => (
                     <p key={i} className={`final-line-${event.id} text-[15px] md:text-[22px] tracking-[0.4em] md:tracking-[0.8em] pl-[0.4em] md:pl-[0.8em] text-slate-300 font-light opacity-0 filter blur-lg transform translate-y-6 leading-[2.5] whitespace-normal break-words drop-shadow-md`}>
                         {line}
                     </p>
                 ))}
            </div>
        </div>

        {/* Phase 3: The Closing (The Credits) */}
        <div className={`content-closing-${event.id} absolute inset-0 flex flex-col items-center justify-center pointer-events-none`}>
            <div className="w-[1px] h-24 md:h-32 bg-linear-to-b from-transparent to-white/30 mb-10 opacity-0 transform origin-top" id={`closing-line-top-${event.id}`} />
            <div className={`closing-text-${event.id} text-xs md:text-base tracking-[1.5em] md:tracking-[2em] pl-[1.5em] md:pl-[2em] text-slate-400 font-light opacity-0 filter blur-lg text-center`}>
                {detail.closing}
            </div>
            <div className="w-[1px] h-24 md:h-32 bg-linear-to-t from-transparent to-white/30 mt-10 opacity-0 transform origin-bottom" id={`closing-line-bot-${event.id}`} />
        </div>
        
        {/* Ultimate Black Fade (The real curtain fall) */}
        <div className={`ultimate-curtain-${event.id} absolute inset-0 bg-black pointer-events-none opacity-0 z-50`} />
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
  const dustContainer = sel(`.finale-dust-${eventId}`);
  const dustParticles = selAll(`.dust-${eventId}`);
  
  const titlePhase = sel(`.content-title-${eventId}`);
  const titleText = titlePhase?.querySelector('h2');
  
  const bodyPhase = sel(`.content-body-${eventId}`);
  const bodyLines = selAll(`.final-line-${eventId}`);
  
  const closingPhase = sel(`.content-closing-${eventId}`);
  const closingLineTop = sel(`#closing-line-top-${eventId}`);
  const closingText = sel(`.closing-text-${eventId}`);
  const closingLineBot = sel(`#closing-line-bot-${eventId}`);
  
  const ultimateCurtain = sel(`.ultimate-curtain-${eventId}`);

  // Initial States
  tl.set(wrapper, { opacity: 0 });
  tl.set(ultimateCurtain, { opacity: 0 });
  tl.set(dustContainer, { opacity: 0 });
  tl.set(closingLineTop, { scaleY: 0 });
  tl.set(closingLineBot, { scaleY: 0 });

  // Infinite slow falling dust (Cinematic projector dust)
  dustParticles.forEach((p) => {
      gsap.to(p, {
          y: "+=120vh",
          x: `+=${(Math.random() - 0.5) * 50}px`,
          opacity: Math.random() * 0.6 + 0.1,
          duration: 15 + Math.random() * 15,
          repeat: -1,
          ease: "none",
          delay: Math.random() * -15
      });
  });

  // 1. Enter the Void
  tl.to(wrapper, { opacity: 1, duration: 4, ease: "power2.inOut" }, 0);
  tl.to(dustContainer, { opacity: 1, duration: 6 }, 1);

  // 2. Title Sequence (The Final Whisper)
  tl.set(titlePhase, { display: "flex" });
  tl.to(titleText, { opacity: 1, filter: "blur(0px)", duration: 5, ease: "power3.out" }, 2);
  tl.to(titleText, { opacity: 0, filter: "blur(20px)", scale: 1.05, duration: 4, ease: "power2.in" }, "+=4");
  tl.set(titlePhase, { display: "none" });

  // 3. Body Sequence (The Echoes of History)
  tl.set(bodyPhase, { display: "flex" });
  tl.to(bodyLines, { 
      opacity: 1, 
      filter: "blur(0px)", 
      y: 0, 
      duration: 4, 
      stagger: 2.5, // Slow, deliberate delivery 
      ease: "power2.out" 
  }, "+=1");
  tl.to(bodyLines, { 
      opacity: 0, 
      filter: "blur(15px)", 
      y: -10, 
      duration: 4, 
      stagger: 0.5, 
      ease: "power2.in" 
  }, "+=5");
  tl.set(bodyPhase, { display: "none" });

  // 4. Closing Sequence (The Credits / End of the Scroll)
  tl.set(closingPhase, { display: "flex" });
  tl.to([closingLineTop, closingLineBot], { scaleY: 1, duration: 3, ease: "power3.out" }, "+=1");
  tl.to(closingText, { opacity: 1, filter: "blur(0px)", duration: 4, ease: "power2.out" }, "-=1.5");
  tl.to([closingText, closingLineTop, closingLineBot], { opacity: 0, filter: "blur(20px)", duration: 4, ease: "power2.in" }, "+=5");

  // 5. The Ultimate Curtain Fall (Fade to absolute black before wrapper closes)
  tl.to(ultimateCurtain, { opacity: 1, duration: 5, ease: "power3.inOut" }, "-=2");
  
  // Fade out dust behind the curtain
  tl.to(dustContainer, { opacity: 0, duration: 3 }, "-=3");

  // 6. Global Exit (Return to timeline, though typically the screen remains black for a moment)
  tl.to(wrapper, { opacity: 0, duration: 3, ease: "power2.inOut" }, "+=1");
}