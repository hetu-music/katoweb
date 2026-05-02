import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // A dramatic, high-end crimson & void theme
  bg: "#050002", // Handled inside the component for better animation control
  titleColor: "#ffe4e6",
  bodyColor: "#fda4af",
  accentColor: "#e11d48",
  layout: "horizontal", 
  specialEffect: "none",
  maskPath:
    "M 50 0 C 80 0 100 20 100 50 C 100 80 80 100 50 100 C 20 100 0 80 0 50 C 0 20 20 0 50 0 Z",
};

export function NodeLayout({
  event,
}: {
  event: TimelineEvent;
  resolvedTheme: Required<ImmersiveTheme>;
}) {
  const detail = event.detail;
  if (!detail) return null;

  const openingLines = detail.body.slice(0, 3);
  const aftermathLines = detail.body.slice(4);

  return (
    <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>
      
      {/* Wrapper for Entrance/Exit Animations */}
      <div className={`node-wrapper-${event.id} absolute inset-0`}>
        
        {/* Solid Base Background to block underlying timeline */}
        <div className="absolute inset-0 bg-[#050002] pointer-events-none" />

        {/* Background Image & Overlay */}
        <div className="absolute inset-0 bg-[url('/story/qjtx/9.avif')] bg-cover bg-center opacity-60 mix-blend-luminosity scale-105 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-[#30050f]/30 to-black/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_0%,#000000_80%)] pointer-events-none" />

        {/* Global ambient elements: The Veils / Fog */}
        <div className={`veil-container-${event.id} absolute inset-0 pointer-events-none mix-blend-screen opacity-0`}>
             <div className="absolute top-0 left-[20%] w-[1px] h-full bg-linear-to-b from-transparent via-rose-500/20 to-transparent shadow-[0_0_30px_rgba(225,29,72,0.6)]" />
             <div className="absolute top-0 right-[30%] w-[2px] h-full bg-linear-to-b from-transparent via-rose-600/10 to-transparent shadow-[0_0_40px_rgba(225,29,72,0.4)]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(225,29,72,0.1)_0%,transparent_60%)]" />
        </div>

        {/* Floating embers (Ashes of the fallen city) */}
        <div className={`embers-${event.id} absolute inset-0 pointer-events-none`}>
            {Array.from({length: 15}).map((_, i) => (
                <div key={i} className={`ember-${event.id}-${i} absolute w-[3px] h-[3px] bg-rose-400 rounded-full blur-[1px] opacity-0 shadow-[0_0_10px_2px_rgba(225,29,72,0.6)]`}
                     style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }} />
            ))}
        </div>

        {/* Central Axis Line that shrinks into the dot */}
        <div className={`central-axis-${event.id} absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-linear-to-b from-transparent via-rose-500/50 to-transparent opacity-0`} />

        {/* Stage 1: Title & Quote */}
        <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8`}>
            <div className="relative flex flex-col items-center w-full max-w-[90vw]">
                <div className="absolute -inset-10 bg-rose-900/30 blur-[50px] rounded-full pointer-events-none" />
                <h2 className="relative text-4xl md:text-[5.5rem] text-transparent bg-clip-text bg-linear-to-b from-rose-50 to-rose-300/60 tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-light text-center drop-shadow-[0_0_30px_rgba(225,29,72,0.5)] break-words leading-tight">
                    {detail.title}
                </h2>
                <div className="w-[1px] h-12 md:h-24 bg-linear-to-b from-rose-500/60 to-transparent mt-8 md:mt-12" />
            </div>
            <div className="mt-6 md:mt-8 text-rose-200/70 text-xs md:text-base tracking-[0.6em] md:tracking-[0.8em] font-light text-center w-full max-w-[85vw] md:max-w-lg leading-[2.2] md:leading-loose pl-[0.6em] md:pl-[0.8em] whitespace-normal break-words">
                {detail.quote}
            </div>
        </div>

        {/* Stage 2: Moli (The Artist) - Classical Vertical layout */}
        <div className={`scrolly-artist-${event.id} absolute inset-0 flex items-center justify-center opacity-0`}>
            {/* Faint background watermark */}
            <div className="text-rose-950/40 text-[6rem] md:text-[15rem] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap tracking-widest font-serif blur-[4px] pointer-events-none select-none">
                墨离
            </div>
            {/* Vertical text blocks - Fix overflow with wrap and max height */}
            <div className="flex flex-row-reverse flex-wrap content-center gap-8 md:gap-20 w-[90vw] md:w-auto h-[80vh] md:h-[70%] items-center justify-center z-10 mx-auto">
                {openingLines.map((line, i) => (
                    <div key={i} className="writing-vertical-rl text-rose-100/90 text-[13px] md:text-xl tracking-[0.4em] md:tracking-[0.5em] leading-[2.2] md:leading-[2.5] font-light drop-shadow-[0_2px_15px_rgba(225,29,72,0.4)] max-h-[100%] whitespace-normal break-words">
                        {line}
                    </div>
                ))}
            </div>
        </div>

        {/* Stage 3: The Cinnabar (眉间朱砂一点) */}
        <div className={`scrolly-cinnabar-${event.id} absolute inset-0 flex items-center justify-center opacity-0`}>
            {/* The Dot Complex */}
            <div className={`cinnabar-dot-container-${event.id} relative flex items-center justify-center`}>
                <div className={`cinnabar-dot-${event.id} relative w-3 h-3 md:w-5 md:h-5 bg-rose-500 rounded-full shadow-[0_0_40px_15px_rgba(225,29,72,0.9),inset_0_0_5px_rgba(255,255,255,0.6)] z-20`} />
                <div className={`cinnabar-ring-1-${event.id} absolute w-20 h-20 md:w-48 md:h-48 border border-rose-400/40 rounded-full z-10`} />
                <div className={`cinnabar-ring-2-${event.id} absolute w-[40vw] h-[40vw] max-w-[280px] max-h-[280px] border-[0.5px] border-rose-400/20 rounded-full z-10`} />
                
                {/* Background glow for the masterpiece */}
                <div className={`cinnabar-glow-${event.id} absolute w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.2)_0%,transparent_70%)] rounded-full mix-blend-screen pointer-events-none z-0`} />
            </div>

            {/* Floating text around the dot - Fix vertical text overflow */}
            <div className={`cinnabar-text-left-${event.id} absolute left-[8%] md:left-[22%] top-1/2 -translate-y-1/2 writing-vertical-rl text-rose-100/90 text-base md:text-2xl tracking-[0.5em] md:tracking-[0.6em] font-light max-h-[80vh] whitespace-normal break-words`}>
                眉间朱砂一点
            </div>
            <div className={`cinnabar-text-right-${event.id} absolute right-[8%] md:right-[22%] top-1/2 -translate-y-1/2 writing-vertical-rl text-rose-200/60 text-xs md:text-lg tracking-[0.5em] md:tracking-[0.6em] font-light max-h-[80vh] whitespace-normal break-words`}>
                颜色犹胜摇光
            </div>
        </div>

        {/* Stage 4: Aftermath (城陷绝唱) - Scattered layout */}
        <div className={`scrolly-aftermath-${event.id} absolute inset-0 flex items-center justify-center opacity-0 px-4 md:px-8`}>
             <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px] pointer-events-none" />
             
             <div className="relative z-10 w-full max-w-[90vw] md:max-w-4xl flex flex-col items-center gap-6 md:gap-14 text-center">
                 {aftermathLines.map((line, i) => {
                     if (line.includes("画中女子眉间朱砂一点")) return null;
                     const isTragic = line.includes("绝世") || line.includes("死于乱军") || line.includes("春风复来");
                     return (
                         <p key={i} className={`aftermath-line-${event.id} text-[13px] md:text-lg tracking-[0.2em] md:tracking-[0.3em] leading-[1.8] md:leading-[2.5] w-full break-words whitespace-normal ${isTragic ? 'text-rose-300 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)] font-normal' : 'text-rose-100/70 font-light'}`}>
                             {line}
                         </p>
                     )
                 })}
             </div>
        </div>

        {/* Stage 5: Closing */}
        <div className={`scrolly-closing-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
            <div className="w-[1px] h-12 md:h-24 bg-linear-to-b from-transparent to-rose-500/60 mb-6 md:mb-10" />
            <div className="text-rose-200/90 text-xs md:text-base tracking-[0.8em] md:tracking-[1.2em] pl-[0.8em] md:pl-[1.2em] font-light drop-shadow-[0_0_15px_rgba(225,29,72,0.6)] text-center w-full max-w-[90vw] leading-loose break-words whitespace-normal">
                {detail.closing}
            </div>
            <div className="w-[1px] h-12 md:h-24 bg-linear-to-t from-transparent to-rose-500/60 mt-6 md:mt-10" />
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
  const veils = sel(`.veil-container-${eventId}`);
  const centralAxis = sel(`.central-axis-${eventId}`);
  
  const intro = sel(`.scrolly-intro-${eventId}`);
  const introElements = intro?.children;
  
  const artist = sel(`.scrolly-artist-${eventId}`);
  const artistText = sel(`.scrolly-artist-${eventId} .flex`)?.children;
  
  const cinnabar = sel(`.scrolly-cinnabar-${eventId}`);
  const dot = sel(`.cinnabar-dot-${eventId}`);
  const ring1 = sel(`.cinnabar-ring-1-${eventId}`);
  const ring2 = sel(`.cinnabar-ring-2-${eventId}`);
  const cinTextLeft = sel(`.cinnabar-text-left-${eventId}`);
  const cinTextRight = sel(`.cinnabar-text-right-${eventId}`);
  
  const aftermath = sel(`.scrolly-aftermath-${eventId}`);
  const aftermathLines = selAll(`.aftermath-line-${eventId}`);
  
  const closing = sel(`.scrolly-closing-${eventId}`);
  const closingElements = closing?.children;

  // Initial states
  tl.set([veils, centralAxis, artist, cinnabar, aftermath, closing], { opacity: 0 });
  if (introElements) tl.set(introElements, { opacity: 0 });
  if (artistText) tl.set(artistText, { opacity: 0, x: 20 });
  tl.set([dot, ring1, ring2], { scale: 0, opacity: 0 });
  tl.set([cinTextLeft, cinTextRight], { opacity: 0, y: 20 });
  if (aftermathLines) tl.set(aftermathLines, { opacity: 0, y: 15 });
  if (closingElements) tl.set(closingElements, { opacity: 0, scaleY: 0, transformOrigin: "center" });

  // Entrance Animation (Expand and fade in)
  tl.fromTo(wrapper, 
    { scale: 1.1, opacity: 0, filter: "blur(20px)" }, 
    { scale: 1, opacity: 1, filter: "blur(0px)", duration: 2.5, ease: "power3.out" }, 
    0
  );

  // Floating Embers Loop
  const embers = selAll(`[class^="ember-${eventId}-"]`);
  embers.forEach((ember) => {
     gsap.to(ember, {
         y: `-=${120 + Math.random() * 80}px`,
         x: `+=${(Math.random() - 0.5) * 60}px`,
         opacity: Math.random() * 0.5 + 0.3,
         duration: 6 + Math.random() * 6,
         repeat: -1,
         yoyo: true,
         ease: "sine.inOut",
         delay: Math.random() * 4
     });
  });

  // 1. Ambient & Axis Entry
  tl.to(veils, { opacity: 1, duration: 3 }, 1);
  tl.to(centralAxis, { opacity: 1, duration: 4, ease: "power2.inOut" }, 1);

  // 2. Intro Sequence
  if (introElements && introElements.length >= 2) {
      tl.fromTo(introElements[0], { opacity: 0, scale: 0.9, filter: "blur(12px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3.5, ease: "power3.out" }, 1.5)
        .fromTo(introElements[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 3, ease: "power2.out" }, 2.5)
        // Exit Intro
        .to(introElements, { opacity: 0, y: -40, filter: "blur(16px)", duration: 2.5, ease: "power2.inOut", stagger: 0.2 }, "+=3.5")
        .set(intro, { display: "none" });
  }

  tl.set(artist, { display: "flex" });

  // 3. The Artist (Vertical text reveal)
  tl.to(artist, { opacity: 1, duration: 1 }, "+=0.5");
  if (artistText) {
      tl.to(artistText, { opacity: 1, x: 0, duration: 3, stagger: 0.5, ease: "power2.out" }, "<")
        .to(artistText, { opacity: 0, x: -20, filter: "blur(12px)", duration: 2.5, stagger: 0.2, ease: "power2.in" }, "+=4")
        .set(artist, { display: "none" });
  }

  tl.set(cinnabar, { display: "flex" });

  // 4. The Cinnabar Masterpiece (Axis shrinks to a glowing dot)
  tl.to(centralAxis, { scaleY: 0, opacity: 0, duration: 2.5, ease: "power3.in" }, "-=2.5");
  tl.to(cinnabar, { opacity: 1, duration: 0.1 });
  
  tl.fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(1, 0.4)" })
    .fromTo(ring1, { scale: 0.1, opacity: 1 }, { scale: 1, opacity: 0.8, duration: 3, ease: "power2.out" }, "-=1.5")
    .fromTo(ring2, { scale: 0.1, opacity: 1 }, { scale: 1, opacity: 0.4, duration: 4, ease: "power3.out" }, "-=2")
    .to([cinTextLeft, cinTextRight], { opacity: 1, y: 0, duration: 2.5, stagger: 0.6, ease: "power2.out" }, "-=2")
    // Exit Masterpiece (Shatter/Fade)
    .to([dot, ring1, ring2, cinTextLeft, cinTextRight], { opacity: 0, scale: 1.15, filter: "blur(20px)", duration: 3, ease: "power2.inOut" }, "+=4.5")
    .set(cinnabar, { display: "none" });

  tl.set(aftermath, { display: "flex" });

  // 5. The Aftermath (City Falls)
  tl.to(aftermath, { opacity: 1, duration: 2 }, "-=1.5");
  if (aftermathLines) {
      tl.to(aftermathLines, { opacity: 1, y: 0, duration: 2.5, stagger: 0.6, ease: "power2.out" }, "-=1")
        .to(aftermathLines, { opacity: 0, y: -20, filter: "blur(12px)", duration: 3, stagger: 0.2, ease: "power2.inOut" }, "+=4.5")
        .set(aftermath, { display: "none" });
  }

  tl.set(closing, { display: "flex" });

  // 6. Closing (Vertical lines expand, text glows)
  tl.to(closing, { opacity: 1, duration: 1 }, "+=0.5");
  if (closingElements && closingElements.length >= 3) {
      tl.to(closingElements[0], { opacity: 1, scaleY: 1, duration: 2, ease: "power2.out" })
        .to(closingElements[2], { opacity: 1, scaleY: 1, duration: 2, ease: "power2.out" }, "<")
        .fromTo(closingElements[1], { opacity: 0, filter: "blur(16px)", scale: 0.9 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 3, ease: "power3.out" }, "-=1")
        // Final text Exit before the global collapse
        .to(closingElements, { opacity: 0, filter: "blur(12px)", duration: 2, ease: "power2.in" }, "+=4");
  }

  // Fade out ambient elements at the very end
  tl.to(veils, { opacity: 0, duration: 3 }, "-=2");

  // Exit Animation (Collapse and fade out)
  tl.to(wrapper, 
    { scale: 0.9, opacity: 0, filter: "blur(20px)", duration: 2.5, ease: "power2.inOut" }, 
    "-=1"
  );
}
