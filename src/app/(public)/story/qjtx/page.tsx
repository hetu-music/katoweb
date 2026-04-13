"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { timelineData } from "./data";

gsap.registerPlugin(ScrollTrigger);

export default function QingJinTianXia() {
  const container = useRef<HTMLDivElement>(null);
  const scrollRevealRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.to(".bg-noise", { opacity: 0.12, duration: 2, ease: "power2.inOut" })
        .fromTo(
          ".hero-title-char",
          { opacity: 0, filter: "blur(16px)", scale: 0.85 },
          {
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            duration: 2.5,
            stagger: 0.25,
            ease: "power2.out",
          },
          "-=1.5",
        )
        .fromTo(
          ".hero-subtitle",
          { y: 30, opacity: 0, filter: "blur(5px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 2,
            ease: "power2.out",
          },
          "-=1",
        )
        .fromTo(
          ".scroll-hint",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" },
          "-=1",
        );

      gsap.to(".scroll-hint-line", {
        scaleY: 1.5,
        opacity: 0,
        duration: 1.5,
        repeat: -1,
        transformOrigin: "top",
        ease: "power2.out",
      });

      // Timeline Spine Animation
      gsap.to(".timeline-progress", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".timeline-container",
          start: "top 60%",
          end: "bottom 80%",
          scrub: 1,
        },
      });

      // Timeline Events Reveal
      scrollRevealRefs.current.forEach((el) => {
        if (!el) return;

        gsap.fromTo(
          el,
          { opacity: 0, y: 70, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 50%",
              scrub: 1,
            },
          },
        );

        // Light up the timeline dot
        const dot = el.querySelector(".event-dot");
        if (dot) {
          gsap.to(dot, {
            borderColor: "#b91c1c", // border-red-700
            backgroundColor: "#7f1d1d", // bg-red-900
            boxShadow: "0 0 15px rgba(185,28,28,0.8)",
            scrollTrigger: {
              trigger: el,
              start: "top 60%",
              toggleActions: "play none none reverse",
            },
          });
        }
      });
    },
    { scope: container },
  );

  const addToRefs = (el: HTMLElement | null) => {
    if (el && !scrollRevealRefs.current.includes(el)) {
      scrollRevealRefs.current.push(el);
    }
  };

  return (
    <div
      ref={container}
      className="relative bg-[#09090b] text-zinc-300 min-h-screen font-serif selection:bg-red-900 selection:text-white overflow-x-hidden"
    >
      {/* SVG Noise Texture for Premium Feel */}
      <div
        className="bg-noise fixed inset-0 opacity-0 pointer-events-none z-0 mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      ></div>

      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_rgba(0,0,0,0.9)_100%)] pointer-events-none z-0"></div>

      {/* HERO SECTION */}
      <section className="relative z-10 h-[100svh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-12 sm:gap-16 mt-[-10vh]">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-zinc-100 flex items-center justify-center pb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] pl-[0.2em] sm:pl-[0.4em]">
            {"倾尽天下".split("").map((char, i) => (
              <span
                key={i}
                className="hero-title-char inline-block tracking-[0.2em] sm:tracking-[0.4em] px-1 sm:px-2"
              >
                {char}
              </span>
            ))}
          </h1>
          <div className="hero-subtitle flex flex-col items-center gap-6">
            <p className="text-sm sm:text-lg md:text-xl tracking-[0.8em] sm:tracking-[1em] font-light text-red-700 pl-[0.8em] sm:pl-[1em] drop-shadow-[0_0_15px_rgba(185,28,28,0.5)]">
              血染江山的画
            </p>
            <p className="text-sm sm:text-lg md:text-xl tracking-[0.8em] sm:tracking-[1em] font-light text-zinc-400 pl-[0.8em] sm:pl-[1em]">
              怎敌你眉间一点朱砂
            </p>
          </div>
        </div>

        <div className="scroll-hint absolute bottom-12 flex flex-col items-center gap-4 text-zinc-600">
          <span className="text-[10px] uppercase tracking-[0.4em] ml-[0.4em]">
            展开编年史
          </span>
          <div className="w-[1px] h-16 bg-zinc-800 relative overflow-hidden">
            <div className="scroll-hint-line absolute top-0 left-0 w-full h-full bg-zinc-400/50"></div>
          </div>
        </div>
      </section>

      {/* TIMELINE section */}
      <main className="timeline-container relative w-full max-w-7xl mx-auto px-4 py-[15vh] z-10">
        {/* TIMELINE SPINES */}
        {/* Mobile: align left. Desktop: center */}
        <div className="absolute left-14 md:left-1/2 top-0 bottom-0 w-[1px] bg-zinc-800/40 -translate-x-1/2 rounded"></div>
        <div className="timeline-progress absolute left-14 md:left-1/2 top-0 bottom-0 w-[1px] bg-red-800/80 -translate-x-1/2 origin-top rounded scale-y-0 shadow-[0_0_10px_rgba(185,28,28,0.8)] z-10"></div>

        {/* EVENTS LIST */}
        <div className="flex flex-col w-full relative pt-10 pb-40">
          {timelineData.map((event, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={event.id}
                ref={addToRefs}
                className="timeline-event relative w-full flex flex-col md:flex-row md:justify-center my-10 md:my-20 group"
              >
                {/* Timeline Dot */}
                <div className="event-dot absolute left-10 md:left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 w-[9px] h-[9px] md:w-[13px] md:h-[13px] rounded-full border border-zinc-500 bg-zinc-950 z-20"></div>

                {/* --- MOBILE BLOCK (ALL ITEMS) --- */}
                <div className="flex md:hidden w-full pl-[4.5rem] pr-2 justify-start">
                  <div className="flex items-center gap-4 sm:gap-6 flex-row">
                    <div className="flex flex-row items-end gap-2 text-zinc-300 transition-colors">
                      <div
                        className="text-xl font-serif tracking-[0.3em] font-light"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {event.year}
                      </div>
                      {event.month && (
                        <div
                          className="text-sm text-red-800/80 font-serif tracking-[0.3em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {event.month}
                        </div>
                      )}
                    </div>
                    <div className="text-left flex flex-col gap-3 max-w-[16rem] sm:max-w-sm">
                      {event.content.map((line, i) => (
                        <p
                          key={i}
                          className={`text-sm font-light tracking-[0.1em] leading-[2] ${event.important ? "text-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] font-normal" : "text-zinc-400"}`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* --- DESKTOP LEFT BLOCK --- */}
                <div
                  className={`hidden md:flex w-1/2 pr-12 lg:pr-24 justify-end ${!isLeft ? "invisible" : ""}`}
                >
                  <div className="flex items-center gap-8 lg:gap-12 flex-row">
                    <div className="text-right flex flex-col gap-4 max-w-sm xl:max-w-md">
                      {event.content.map((line, i) => (
                        <p
                          key={i}
                          className={`text-[15px] lg:text-base font-light tracking-[0.1em] lg:tracking-[0.2em] leading-[2] ${event.important ? "text-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] font-normal" : "text-zinc-400"}`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-row items-end gap-3 lg:gap-4 text-zinc-300 transition-colors">
                      {event.month && (
                        <div
                          className="text-lg lg:text-xl text-red-800/80 font-serif tracking-[0.3em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {event.month}
                        </div>
                      )}
                      <div
                        className="text-2xl lg:text-3xl font-serif tracking-[0.3em] font-light"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {event.year}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- DESKTOP RIGHT BLOCK --- */}
                <div
                  className={`hidden md:flex w-1/2 pl-12 lg:pl-24 justify-start ${isLeft ? "invisible" : ""}`}
                >
                  <div className="flex items-center gap-8 lg:gap-12 flex-row">
                    <div className="flex flex-row items-end gap-3 lg:gap-4 text-zinc-300 transition-colors">
                      <div
                        className="text-2xl lg:text-3xl font-serif tracking-[0.3em] font-light"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {event.year}
                      </div>
                      {event.month && (
                        <div
                          className="text-lg lg:text-xl text-red-800/80 font-serif tracking-[0.3em]"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {event.month}
                        </div>
                      )}
                    </div>
                    <div className="text-left flex flex-col gap-4 max-w-sm xl:max-w-md">
                      {event.content.map((line, i) => (
                        <p
                          key={i}
                          className={`text-[15px] lg:text-base font-light tracking-[0.1em] lg:tracking-[0.2em] leading-[2] ${event.important ? "text-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] font-normal" : "text-zinc-400"}`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 pt-20 pb-16 text-center flex flex-col items-center gap-8 bg-gradient-to-t from-black to-transparent">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-zinc-700/50"></div>
        <p className="text-zinc-500 text-xs sm:text-sm tracking-[0.5em] font-light">
          山河万里 · 故人长绝
        </p>
        <p className="text-[10px] text-zinc-700 tracking-widest font-light mt-4">
          河图作品勘鉴
        </p>
      </footer>
    </div>
  );
}
