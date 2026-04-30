import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
  // 深沉的暗红色系渐变，象征长夜与未尽的榴火
  bg: "radial-gradient(circle at 50% 50%, #2a0410 0%, #0a0104 60%, #000000 100%)",
  titleColor: "#ffe4e6",
  bodyColor: "#fecdd3",
  accentColor: "#f43f5e",
  layout: "horizontal", 
  specialEffect: "none",
  maskPath:
    "M50 0 C66 8 86 20 100 50 C86 80 66 92 50 100 C34 92 14 80 0 50 C14 20 34 8 50 0 Z",
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
      
      {/* 榴火特效 (Pomegranate Fire Embers) */}
      <div className={`scrolly-fire-${event.id} absolute inset-0 pointer-events-none opacity-0`}>
        {/* Deep ambient glow */}
        <div className="absolute w-[150vw] h-[150vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.08)_0%,transparent_60%)] mix-blend-screen" />
        
        {/* Floating Embers */}
        <div className="ember-1 absolute top-[20%] left-[25%] w-4 h-4 bg-rose-500 rounded-full blur-[3px] shadow-[0_0_30px_15px_rgba(225,29,72,0.5)]" />
        <div className="ember-2 absolute bottom-[30%] right-[20%] w-2 h-2 bg-rose-400 rounded-full blur-[1px] shadow-[0_0_20px_8px_rgba(225,29,72,0.6)]" />
        <div className="ember-3 absolute top-[60%] left-[15%] w-6 h-6 bg-rose-600 rounded-full blur-[6px] shadow-[0_0_40px_20px_rgba(225,29,72,0.4)]" />
        <div className="ember-4 absolute top-[10%] right-[30%] w-3 h-3 bg-rose-300 rounded-full blur-[2px] shadow-[0_0_25px_10px_rgba(225,29,72,0.5)]" />
      </div>

      {/* 七重纱幕 (Seven Veils) */}
      <div className={`scrolly-veils-${event.id} absolute inset-0 pointer-events-none flex opacity-0 mix-blend-screen`}>
        <div className="veil-1 absolute top-0 bottom-0 left-[15%] w-[1px] bg-linear-to-b from-transparent via-rose-500/30 to-transparent shadow-[0_0_15px_rgba(225,29,72,0.6)]" />
        <div className="veil-2 absolute top-0 bottom-0 left-[35%] w-[1px] bg-linear-to-b from-transparent via-rose-500/20 to-transparent shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
        <div className="veil-3 absolute top-0 bottom-0 right-[25%] w-[1px] bg-linear-to-b from-transparent via-rose-500/40 to-transparent shadow-[0_0_25px_rgba(225,29,72,0.7)]" />
        <div className="veil-4 absolute top-0 bottom-0 right-[45%] w-[1px] bg-linear-to-b from-transparent via-rose-500/25 to-transparent shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
        
        {/* Subtle broad light beams */}
        <div className="absolute top-0 bottom-0 left-[20%] w-[10%] bg-linear-to-r from-transparent via-rose-900/10 to-transparent blur-xl rotate-[10deg] scale-150" />
        <div className="absolute top-0 bottom-0 right-[20%] w-[15%] bg-linear-to-l from-transparent via-rose-900/10 to-transparent blur-xl rotate-[-10deg] scale-150" />
      </div>

      {/* Stage 1: Intro */}
      <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center`}>
        <div className="text-rose-500/60 text-[11px] md:text-sm tracking-[1em] mb-10 font-light writing-vertical-rl h-40 md:h-48">
          春风画卷三百里榴火
        </div>
        <h2 className="text-5xl md:text-[5.5rem] text-rose-50 tracking-[0.5em] font-light drop-shadow-[0_0_40px_rgba(225,29,72,0.7)] pl-[0.5em]">
          {detail.title}
        </h2>
        <div className="mt-14 text-rose-300/70 text-sm md:text-[15px] tracking-[0.5em] font-light text-center px-4">
          {detail.quote}
        </div>
      </div>

      {/* Main Container for Stages 2, 3, 4 */}
      <div className={`scrolly-body-${event.id} absolute inset-0 flex items-center justify-center hidden`}>

        {/* Stage 2: The Artist */}
        <div className={`scrolly-artist-${event.id} absolute w-full max-w-2xl px-6 md:px-12 flex flex-col items-center text-center opacity-0`}>
          <div className="text-rose-900/40 text-6xl md:text-[7rem] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap tracking-[0.3em] font-serif blur-[2px] pointer-events-none">
            公子墨离
          </div>
          <div className="space-y-10 relative z-10">
            {openingLines.map((line, i) => (
              <p key={i} className="text-[15px] md:text-[18px] leading-[2.4] tracking-[0.3em] text-rose-100/90 font-light drop-shadow-[0_2px_10px_rgba(225,29,72,0.2)]">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Stage 3: The Cinnabar Masterpiece */}
        <div className={`scrolly-masterpiece-${event.id} absolute w-full h-full flex flex-col items-center justify-center opacity-0 pointer-events-none`}>
           {/* Abstract Portrait Frame */}
           <div className="relative w-[80vw] max-w-[460px] h-[70vh] max-h-[680px] border border-rose-500/10 rounded-[120px] bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.08)_0%,transparent_60%)] flex flex-col items-center justify-center shadow-[inset_0_0_60px_rgba(225,29,72,0.1)]">
              
              <div className="absolute top-[8%] text-rose-500/20 text-3xl md:text-4xl tracking-[1.2em] writing-vertical-rl h-[60%] blur-[1px]">
                七重纱幕后你眼波
              </div>

              {/* The Cinnabar */}
              <div className="relative mt-[-60px]">
                <div className={`scrolly-cinnabar-dot-${event.id} w-3 h-3 md:w-4 md:h-4 bg-rose-500 rounded-full shadow-[0_0_50px_20px_rgba(225,29,72,0.9)]`} />
                <div className={`scrolly-cinnabar-ripple-1-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 border border-rose-500/40 rounded-full`} />
                <div className={`scrolly-cinnabar-ripple-2-${event.id} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 border border-rose-500/20 rounded-full`} />
              </div>

              <div className="absolute bottom-16 md:bottom-20 text-center w-full px-6 md:px-10">
                <p className="text-[14px] md:text-[18px] leading-[2.6] tracking-[0.3em] text-rose-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  画中女子眉间朱砂一点，
                  <br /><br />
                  颜色犹胜摇光皇后。
                </p>
              </div>
           </div>
        </div>

        {/* Stage 4: The Aftermath */}
        <div className={`scrolly-aftermath-${event.id} absolute w-full max-w-2xl px-6 md:px-12 flex flex-col items-center text-center opacity-0`}>
          <div className="text-rose-900/40 text-6xl md:text-[7rem] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap tracking-[0.3em] font-serif blur-[2px] pointer-events-none">
            朱砂一点
          </div>
          <div className="space-y-8 relative z-10">
            {aftermathLines.map((line, i) => {
              if (line.includes("画中女子眉间朱砂一点")) return null;
              const emphasis = line.includes("绝世") || line.includes("争寻画卷") || line.includes("春风复来");
              return (
                <p key={i} className={`text-[14px] md:text-[16px] leading-[2.6] tracking-[0.25em] ${emphasis ? "text-rose-300 font-normal drop-shadow-[0_0_12px_rgba(225,29,72,0.4)]" : "text-rose-100/70 font-light"}`}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>

      </div>

      {/* Stage 5: Closing */}
      <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex items-center justify-center hidden`}>
        <div className={`scrolly-closing-${event.id} px-8 py-3 border border-rose-500/20 bg-rose-950/40 backdrop-blur-md rounded-full text-xs md:text-sm tracking-[0.5em] text-rose-300/80 shadow-[0_10px_30px_rgba(225,29,72,0.2)]`}>
          {detail.closing}
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
  const fire = scrollyText.querySelector(`.scrolly-fire-${eventId}`);
  const veils = scrollyText.querySelector(`.scrolly-veils-${eventId}`);
  
  const intro = scrollyText.querySelector(`.scrolly-intro-${eventId}`);
  const introElements = intro?.children;
  
  const bodyContainer = scrollyText.querySelector(`.scrolly-body-${eventId}`);
  const artist = scrollyText.querySelector(`.scrolly-artist-${eventId}`);
  const masterpiece = scrollyText.querySelector(`.scrolly-masterpiece-${eventId}`);
  const cinnabarDot = scrollyText.querySelector(`.scrolly-cinnabar-dot-${eventId}`);
  const cinnabarRipple1 = scrollyText.querySelector(`.scrolly-cinnabar-ripple-1-${eventId}`);
  const cinnabarRipple2 = scrollyText.querySelector(`.scrolly-cinnabar-ripple-2-${eventId}`);
  const aftermath = scrollyText.querySelector(`.scrolly-aftermath-${eventId}`);
  
  const closingContainer = scrollyText.querySelector(`.scrolly-closing-container-${eventId}`);
  const closing = scrollyText.querySelector(`.scrolly-closing-${eventId}`);

  // 初始化状态
  tl.set([fire, veils, artist, masterpiece, aftermath, closing], { opacity: 0 });
  if (introElements) tl.set(introElements, { opacity: 0 });

  // 1. 氛围进场
  tl.to(fire, { opacity: 1, duration: 2 }, 0)
    .to(veils, { opacity: 1, duration: 3 }, 0);

  // 2. 引言序列
  if (introElements) {
    tl.fromTo(introElements[0], { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 2.5, ease: "power2.out" }, 0.5)
      .fromTo(introElements[1], { opacity: 0, scale: 0.9, filter: "blur(12px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 3, ease: "power3.out" }, 1.5)
      .fromTo(introElements[2], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 2.5, ease: "power2.out" }, 2.5)
      // 引言退场
      .to(introElements, { opacity: 0, y: -40, filter: "blur(16px)", duration: 3, ease: "power2.inOut", stagger: 0.2 }, "+=3")
      .set(intro, { display: "none" });
  }

  tl.set(bodyContainer, { display: "flex" });

  // 3. 墨离生平 (Artist)
  tl.fromTo(artist, { opacity: 0, y: 50, filter: "blur(16px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power3.out" }, "+=0.5")
    .to(artist, { opacity: 0, y: -50, filter: "blur(16px)", duration: 3.5, ease: "power2.inOut" }, "+=4");

  // 4. 春风画卷朱砂 (Masterpiece)
  tl.fromTo(masterpiece, { opacity: 0, scale: 0.9, filter: "blur(24px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 4, ease: "power3.out" }, "-=1")
    .fromTo(cinnabarDot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(1, 0.4)" }, "-=2")
    .fromTo(cinnabarRipple1, { scale: 0.2, opacity: 1 }, { scale: 1, opacity: 0.2, duration: 3.5, ease: "power2.out" }, "-=1.5")
    .fromTo(cinnabarRipple2, { scale: 0.2, opacity: 1 }, { scale: 1, opacity: 0.1, duration: 4, ease: "power2.out" }, "-=2.5")
    .to(masterpiece, { opacity: 0, scale: 1.1, filter: "blur(16px)", duration: 3.5, ease: "power2.inOut" }, "+=5");

  // 5. 城陷绝唱 (Aftermath)
  tl.fromTo(aftermath, { opacity: 0, y: 50, filter: "blur(16px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3.5, ease: "power3.out" }, "-=1")
    .to(aftermath, { opacity: 0, y: -50, filter: "blur(16px)", duration: 3.5, ease: "power2.inOut" }, "+=4")
    .set(bodyContainer, { display: "none" });

  // 6. 尾声 (Closing)
  tl.set(closingContainer, { display: "flex" })
    .fromTo(closing, { opacity: 0, scale: 0.8, filter: "blur(12px)", y: 20 }, { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, duration: 3, ease: "power3.out" })
    .to(closing, { opacity: 0, y: -30, filter: "blur(12px)", duration: 2.5, ease: "power2.in" }, "+=3");

  // 氛围退场
  tl.to([fire, veils], { opacity: 0, duration: 4 }, "-=2.5");

  // 循环播放的粒子与纱幕浮动特效
  if (fire) {
    gsap.to(fire.querySelector(".ember-1"), { y: "-100px", x: "50px", duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(fire.querySelector(".ember-2"), { y: "-150px", x: "-30px", duration: 15, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(fire.querySelector(".ember-3"), { y: "-80px", x: "80px", duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(fire.querySelector(".ember-4"), { y: "-120px", x: "-60px", duration: 18, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }

  if (veils) {
    gsap.to(veils.querySelector(".veil-1"), { x: "-30px", opacity: 0.5, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(veils.querySelector(".veil-3"), { x: "30px", opacity: 0.5, duration: 15, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }
}
