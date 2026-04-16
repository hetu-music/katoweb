"use client";

import { useGSAP } from "@gsap/react";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { timelineData } from "../qjtx/data";

gsap.registerPlugin(ScrollTrigger);

const motionEase = [0.22, 1, 0.36, 1] as const;
const animationSlowdown = 3;

const heroTitleVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.22 * animationSlowdown,
      delayChildren: 0.35 * animationSlowdown,
    },
  },
} satisfies Variants;

const heroCharVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    filter: "blur(16px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.6 * animationSlowdown,
      ease: motionEase,
    },
  },
} satisfies Variants;

const heroSubtitleVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18 * animationSlowdown,
      delayChildren: 1 * animationSlowdown,
    },
  },
} satisfies Variants;

const heroSubtitleLineVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.2 * animationSlowdown,
      ease: motionEase,
    },
  },
} satisfies Variants;

const scrollHintVariants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1 * animationSlowdown,
      delay: 1.45 * animationSlowdown,
      ease: motionEase,
    },
  },
} satisfies Variants;

const footerVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1 * animationSlowdown,
      ease: motionEase,
    },
  },
} satisfies Variants;

const verticalTextClass =
  "[writing-mode:vertical-rl] [text-orientation:mixed] shrink-0 leading-none";

function EventLines({
  content,
  important,
  mobile = false,
  align = "left",
}: {
  content: string[];
  important?: boolean;
  mobile?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        mobile
          ? "text-left flex flex-col gap-3 max-w-[16rem] sm:max-w-sm"
          : `${align === "right" ? "text-right" : "text-left"} flex flex-col gap-4 max-w-sm xl:max-w-md`
      }
    >
      {content.map((line, index) => (
        <p
          key={index}
          className={`${mobile
            ? "text-sm tracking-widest"
            : "text-[15px] lg:text-base tracking-widest lg:tracking-[0.2em]"
            } font-light leading-loose ${important
              ? "text-zinc-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] font-normal"
              : "text-zinc-400"
            }`}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function EventDate({
  year,
  month,
  monthFirst = false,
  mobile = false,
}: {
  year: string;
  month?: string;
  monthFirst?: boolean;
  mobile?: boolean;
}) {
  const monthNode = month ? (
    <div
      className={`${verticalTextClass} ${mobile ? "text-sm" : "text-lg lg:text-xl"
        } text-red-800/80 font-serif tracking-[0.3em]`}
    >
      {month}
    </div>
  ) : null;

  const yearNode = (
    <div
      className={`${verticalTextClass} ${mobile ? "text-xl" : "text-2xl lg:text-3xl"
        } font-serif tracking-[0.3em] font-light text-zinc-300`}
    >
      {year}
    </div>
  );

  return (
    <div
      className={`flex flex-row items-end ${mobile ? "gap-2" : "gap-3 lg:gap-4"
        } transition-colors`}
    >
      {monthFirst ? (
        <>
          {monthNode}
          {yearNode}
        </>
      ) : (
        <>
          {yearNode}
          {monthNode}
        </>
      )}
    </div>
  );
}

export default function QingJinTianXia() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: true,
    });

    const updateScrollTrigger = () => ScrollTrigger.update();
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    const handleRefresh = () => lenis.resize();

    html.classList.add("qjtx-story-page");
    body.classList.add("qjtx-story-page");
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener("refresh", handleRefresh);
    ScrollTrigger.refresh();

    return () => {
      html.classList.remove("qjtx-story-page");
      body.classList.remove("qjtx-story-page");
      ScrollTrigger.removeEventListener("refresh", handleRefresh);
      gsap.ticker.remove(raf);
      lenis.off("scroll", updateScrollTrigger);
      lenis.destroy();
    };
  }, []);

  useGSAP(
    () => {
      gsap.to(".scroll-hint-line", {
        scaleY: 1.5,
        opacity: 0,
        duration: 1.5 * animationSlowdown,
        repeat: -1,
        transformOrigin: "top",
        ease: "power2.out",
      });

      const events = gsap.utils.toArray<HTMLElement>(
        ".timeline-event",
        container.current,
      );
      const dots = gsap.utils.toArray<HTMLElement>(".event-dot", container.current);
      const progressLine = container.current?.querySelector<HTMLElement>(
        ".timeline-progress",
      );

      const setDotState = (dot: HTMLElement, active: boolean) => {
        const nextState = active ? "active" : "inactive";

        if (dot.dataset.state === nextState) {
          return;
        }

        dot.dataset.state = nextState;
        gsap.to(dot, {
          duration: 0.35,
          borderColor: active ? "#b91c1c" : "#71717a",
          backgroundColor: active ? "#7f1d1d" : "#09090b",
          boxShadow: active ? "0 0 15px rgba(185,28,28,0.8)" : "0 0 0 rgba(0,0,0,0)",
          overwrite: true,
        });
      };

      dots.forEach((dot) => setDotState(dot, false));

      const updateLinesAndDots = () => {
        if (!container.current) return;
        const containerEl = container.current.querySelector<HTMLElement>(".timeline-container");
        const progressLine = container.current.querySelector<HTMLElement>(".timeline-progress");
        if (!containerEl || !progressLine) return;

        const rect = containerEl.getBoundingClientRect();
        const triggerY = window.innerHeight * 0.6;

        let lineTargetHeight = triggerY - rect.top;
        lineTargetHeight = Math.max(0, Math.min(lineTargetHeight, rect.height));

        progressLine.style.height = `${lineTargetHeight}px`;

        dots.forEach((dot) => {
          const dotRect = dot.getBoundingClientRect();
          const dotCenter = dotRect.top + dotRect.height / 2;
          setDotState(dot, dotCenter <= triggerY + 30);
        });
      };

      gsap.ticker.add(updateLinesAndDots);
      updateLinesAndDots();

      // REFACTOR: scrub 固定为 0.8，不再乘以 animationSlowdown。
      events.forEach((event) => {
        gsap.fromTo(
          event,
          { opacity: 0, y: 70, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scrollTrigger: {
              trigger: event,
              pinnedContainer: ".timeline-container",
              start: "top 90%",
              end: "center 60%",
              scrub: 1.5,
            },
          },
        );

        const isImportant = event.dataset.important === "true";
        if (isImportant) {
          const detailContent = container.current?.querySelector<HTMLElement>(`#detail-${event.dataset.id}`);
          const scrollyBg = detailContent?.querySelector<HTMLElement>(`.scrolly-bg-${event.dataset.id}`);
          const scrollyText = detailContent?.querySelector<HTMLElement>(`.scrolly-text-${event.dataset.id}`);
          const dot = event.querySelector<HTMLElement>(".event-dot");

          if (detailContent && scrollyBg && scrollyText && dot) {
            const setCirclePos = () => {
              const dotRect = dot.getBoundingClientRect();
              // 核心魔法：获取此时此刻 event 身上因为 scrub 还没走完的 y 轴偏移量
              const currentYOffset = gsap.getProperty(event, "y") as number;
              const trueX = dotRect.left + dotRect.width / 2;
              // 真实的 Y 中心点 = 视觉上的中心点 - 还没归零的 Y 偏移量
              const trueY = dotRect.top + dotRect.height / 2 - currentYOffset;
              scrollyBg.style.setProperty("--x", `${trueX}px`);
              scrollyBg.style.setProperty("--y", `${trueY}px`);
            };

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: event,
                pinnedContainer: ".timeline-container",
                start: "center 60%", // exactly on the line
                end: "+=4000",
                scrub: true,
                pin: ".timeline-container",
                pinSpacing: true,
                invalidateOnRefresh: true,
                onEnter: setCirclePos,
                onEnterBack: setCirclePos,
              },
            });

            const textHeader = scrollyText.querySelector<HTMLElement>(".scrolly-header");
            const textContent = scrollyText.querySelector<HTMLElement>(`.scrolly-text-content-${event.dataset.id}`);
            const snowLayer = scrollyBg.querySelector<HTMLElement>(`.scrolly-snow-${event.dataset.id}`);

            if (textHeader && textContent) {
              tl.set(detailContent, { display: "flex" });

              tl.fromTo(
                scrollyBg,
                { "--radius": "0px" },
                { "--radius": "800vmax", duration: 1.5, ease: "power2.inOut" },
                0
              )
                .fromTo(
                  textHeader.children,
                  { opacity: 0, y: 30, filter: "blur(12px)" },
                  { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, stagger: 0.2, ease: "power2.out" },
                  "-=0.7"
                )
                .fromTo(
                  textContent,
                  { opacity: 0, y: 60, filter: "blur(8px)" },
                  { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out" },
                  "-=0.7"
                )
                .to(textContent, { y: "-40%", duration: 4.5, ease: "none" })
                .to([textHeader, textContent], {
                  opacity: 0,
                  y: "-=30",
                  filter: "blur(12px)",
                  duration: 1.0,
                  ease: "power2.in",
                })
                .to(scrollyBg, {
                  "--radius": "0px",
                  duration: 1.5,
                  ease: "power2.inOut",
                }, "-=0.6");

              if (snowLayer) {
                // Insert the full-duration snow drift securely at the background layer's start without hijacking GSAP's offset cursor
                tl.fromTo(
                  snowLayer,
                  { backgroundPosition: "0px 0px" },
                  { backgroundPosition: "-40px 150px", duration: tl.duration(), ease: "none" },
                  0
                );
              }

              tl.set(detailContent, { display: "none" });
            }
          }
        }
      });

      // --- 终章：泪滴坠落与墨染动画 ---
      const endTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".footer-final",
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1.2,
          pin: true,
          pinSpacing: true,
        }
      });

      // 初始化状态
      gsap.set(".falling-tear", { y: -200, opacity: 0, scale: 0.8 });
      gsap.set(".tear-drop-tip", { opacity: 0, scale: 0 });

      // 1. 红线末端隆起形成泪滴 (当 timeline-container 快结束时)
      gsap.to(".tear-drop-tip", {
        opacity: 1,
        scale: 1,
        scrollTrigger: {
          trigger: ".timeline-container",
          start: "bottom 80%",
          end: "bottom 60%",
          scrub: true,
        }
      });

      // 2. 坠落与晕染序章
      endTl
        .fromTo(".falling-tear", 
          { y: "-10vh", opacity: 0, scale: 0.6 },
          { y: "50vh", opacity: 1, scale: 1, duration: 2, ease: "none" }
        )
        // 1.5 衔接隐藏红线末端的那个泪滴
        .to(".tear-drop-tip", { opacity: 0, duration: 0.1 }, 0)
        // 2. 泪滴消失，晕染散开
        .to(".falling-tear", {
          opacity: 0,
          scale: 3,
          filter: "blur(12px)",
          duration: 0.6,
          ease: "power2.out"
        })
        .to(".ink-pool", {
          scale: 1,
          opacity: 1,
          duration: 2,
          ease: "power2.out"
        }, "-=0.3")
        // 文字从模糊中浮现
        .fromTo(".bloom-content", 
          { opacity: 0, filter: "blur(20px)", y: 20, scale: 0.95 },
          { opacity: 1, filter: "blur(0px)", y: 0, scale: 1, duration: 2.5, ease: "power2.out" },
          "-=1.5"
        )
        .to(".bottom-info", {
          opacity: 1,
          duration: 1,
          ease: "power2.inOut"
        }, "-=0.5");

      return () => {
        gsap.ticker.remove(updateLinesAndDots);
      };
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="relative min-h-screen overflow-x-hidden bg-[#09090b] font-serif text-zinc-300 selection:bg-red-900 selection:text-white"
    >
      <style jsx global>{`
        /* 消除刷新时的滚动条闪烁：不再等待 JS 添加类名，直接针对全局生效 */
        /* styled-jsx 会在组件销毁时自动移除这些样式，因此是安全的 */
        html,
        body {
          height: auto !important;
          overflow-x: hidden !important;
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        /* 强力隐藏所有 Webkit 滚动条（针对 Chrome, Edge, Safari） */
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }

        /* 兼容 Lenis 的状态类 */
        html.lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }

        html.lenis.lenis-stopped {
          overflow: hidden !important;
        }

        html.lenis.lenis-smooth [data-lenis-prevent] {
          overscroll-behavior: contain;
        }

        /* 晕染文字特有的样式 */
        .ink-bloom-text {
          text-shadow: 0 0 20px rgba(185, 28, 28, 0.4);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 2 * animationSlowdown, ease: motionEase }}
        className="bg-noise pointer-events-none fixed inset-0 z-0 mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.9)_100%)]" />


      <section className="relative z-10 flex h-svh flex-col items-center justify-center">
        <div className="mt-[-10vh] flex flex-col items-center gap-12 sm:gap-16">
          <motion.h1
            variants={heroTitleVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center pb-4 pl-[0.2em] text-5xl font-light text-zinc-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] sm:pl-[0.4em] sm:text-7xl md:text-8xl lg:text-9xl"
          >
            {"倾尽天下".split("").map((char) => (
              <motion.span
                key={char}
                variants={heroCharVariants}
                className="inline-block px-1 tracking-[0.2em] sm:px-2 sm:tracking-[0.4em]"
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.div
            variants={heroSubtitleVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <motion.p
              variants={heroSubtitleLineVariants}
              className="pl-[0.8em] text-sm font-light tracking-[0.8em] text-red-700 drop-shadow-[0_0_15px_rgba(185,28,28,0.5)] sm:pl-[1em] sm:text-lg sm:tracking-[1em] md:text-xl"
            >
              血染江山的画
            </motion.p>
            <motion.p
              variants={heroSubtitleLineVariants}
              className="pl-[0.8em] text-sm font-light tracking-[0.8em] text-zinc-400 sm:pl-[1em] sm:text-lg sm:tracking-[1em] md:text-xl"
            >
              怎敌你眉间一点朱砂
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          variants={scrollHintVariants}
          initial="hidden"
          animate="visible"
          className="scroll-hint absolute bottom-12 flex flex-col items-center gap-3 text-zinc-600 left-14 -translate-x-1/2 md:left-1/2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-light text-zinc-400 [writing-mode:vertical-rl] md:[writing-mode:horizontal-tb] md:ml-[0.3em]">
            展开编年史
          </span>
          <div className="relative h-16 w-[2px] overflow-hidden bg-zinc-800/40 rounded-full">
            <div className="scroll-hint-line absolute top-0 left-0 h-full w-full bg-linear-to-b from-red-600 to-red-900 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
          </div>
        </motion.div>
      </section>

      <main className="timeline-container relative z-10 mx-auto w-full max-w-7xl px-4 py-[15vh]">
        <div className="absolute top-0 bottom-0 left-14 w-px -translate-x-1/2 rounded bg-zinc-800/40 md:left-1/2" />
        <div className="timeline-progress absolute top-0 left-14 z-10 w-px -translate-x-1/2 rounded bg-red-800/80 shadow-[0_0_10px_rgba(185,28,28,0.8)] md:left-1/2">
          {/* 泪滴元素：平时隐藏，只有当进度到底时在 updateLinesAndDots 中逻辑触发 */}
          <div className="tear-drop-tip absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0 opacity-0 w-3 h-4">
            <svg viewBox="0 0 100 120" className="w-full h-full fill-red-700 drop-shadow-[0_0_8px_rgba(185,28,28,0.8)]">
              <path d="M50 0 C50 0 20 45 20 75 A30 30 0 1 0 80 75 C80 45 50 0 50 0 Z" />
            </svg>
          </div>
        </div>

        <div className="relative flex w-full flex-col pt-10 pb-40">
          {timelineData.map((event, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={event.id}
                data-important={event.important ? "true" : "false"}
                data-id={event.id}
                className="timeline-event group relative my-10 flex w-full flex-col md:my-20 md:flex-row md:justify-center"
              >
                <div className={`event-dot absolute top-1/2 left-10 z-20 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full border border-zinc-500 bg-zinc-950 md:left-1/2 md:h-[13px] md:w-[13px] ${event.finale ? "shadow-[0_0_15px_rgba(185,28,28,0.4)]" : ""}`} />

                <div className="flex w-full justify-start pl-18 pr-2 md:hidden">
                  <div className="flex flex-row items-center gap-4 sm:gap-6">
                    <EventDate
                      year={event.year}
                      month={event.month}
                      mobile
                    />
                    <EventLines
                      content={event.content}
                      important={event.important}
                      mobile
                    />
                  </div>
                </div>

                <div
                  className={`hidden w-1/2 justify-end pr-12 md:flex lg:pr-24 ${!isLeft ? "invisible" : ""
                    }`}
                >
                  <div className="flex flex-row items-center gap-8 lg:gap-12">
                    <EventLines
                      content={event.content}
                      important={event.important}
                      align="right"
                    />
                    <EventDate
                      year={event.year}
                      month={event.month}
                      monthFirst
                    />
                  </div>
                </div>

                <div
                  className={`hidden w-1/2 justify-start pl-12 md:flex lg:pl-24 ${isLeft ? "invisible" : ""
                    }`}
                >
                  <div className="flex flex-row items-center gap-8 lg:gap-12">
                    <EventDate year={event.year} month={event.month} />
                    <EventLines
                      content={event.content}
                      important={event.important}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Scrollytelling Content layers (Rendered strictly after main container to guarantee z-100 overlay during GSAP pins) */}
      {timelineData.map((event) => {
        if (!event.detail) return null;
        return (
          <div
            key={`detail-${event.id}`}
            id={`detail-${event.id}`}
            className="fixed inset-0 w-screen h-screen m-0 p-0 z-100 pointer-events-none flex-col items-center justify-center hidden"
          >
            {/* Elegant Snow-night Background (Snowflake Shape Expansion) */}
            <div
              className={`scrolly-bg-${event.id} absolute inset-0 w-full h-full bg-[#030508] z-0 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)]`}
              style={{
                WebkitMaskImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0 L55 35 L80 20 L65 45 L100 50 L65 55 L80 80 L55 65 L50 100 L45 65 L20 80 L35 55 L0 50 L35 45 L20 20 L45 35 Z" fill="black" /%3E%3C/svg%3E')`,
                maskImage: `url('data:image/svg+xml,%3Csvg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M50 0 L55 35 L80 20 L65 45 L100 50 L65 55 L80 80 L55 65 L50 100 L45 65 L20 80 L35 55 L0 50 L35 45 L20 20 L45 35 Z" fill="black" /%3E%3C/svg%3E')`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'var(--radius, 0px)',
                maskSize: 'var(--radius, 0px)',
                WebkitMaskPosition: 'calc(var(--x, 50vw) - var(--radius, 0px) / 2) calc(var(--y, 60vh) - var(--radius, 0px) / 2)',
                maskPosition: 'calc(var(--x, 50vw) - var(--radius, 0px) / 2) calc(var(--y, 60vh) - var(--radius, 0px) / 2)'
              } as React.CSSProperties}
            >
              {/* Moonlight / Frost Center Glow */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(226,232,240,0.06)_0%,transparent_70%)] opacity-100 pointer-events-none" />

              {/* Elegant slow-spinning astrological/lore emblem background */}
              <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.025] pointer-events-none mix-blend-screen">
                <svg viewBox="0 0 200 200" className="w-[150vw] h-[150vw] md:w-[60vw] md:h-[60vw] animate-[spin_80s_linear_infinite] text-white">
                  <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M100 5 L100 195 M5 100 L195 100 M33 33 L167 167 M33 167 L167 33" stroke="currentColor" strokeWidth="0.2" />
                  <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="currentColor" strokeWidth="0.3" />
                  <polygon points="100,40 160,100 100,160 40,100" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </svg>
              </div>

              {/* Subtle Falling Snow SVG pattern overlay - drifts smoothly via GSAP */}
              <div
                className={`scrolly-snow-${event.id} absolute inset-0 z-0 opacity-40 pointer-events-none`}
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M50 50h1v1h-1zM150 120h1.5v1.5h-1.5zM250 80h1v1h-1zM350 180h2v2h-2zM80 250h1.5v1.5h-1.5zM180 320h1v1h-1zM280 220h1.5v1.5h-1.5zM320 350h1v1h-1zM20 180h1.5v1.5h-1.5zM120 280h1v1h-1zM220 150h2v2h-2zM380 50h1v1h-1zM90 380h1.5v1.5h-1.5z%22 fill=%22rgba(255,255,255,0.8)%22/%3E%3C/svg%3E")',
                  backgroundSize: '150px 150px',
                  backgroundPosition: '0px 0px',
                }}
              />

              {/* Cold Cinematic film noise */}
              <div
                className="absolute inset-0 z-0 mix-blend-overlay opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                }}
              />
            </div>

            <div className={`scrolly-text-${event.id} relative z-10 flex flex-col items-center w-full max-w-2xl px-6 md:px-0 h-full py-[15vh]`}>

              {/* Header Title Block */}
              <div className="scrolly-header flex flex-col items-center mb-8 md:mb-12 shrink-0">
                <div className="w-px h-8 md:h-12 bg-linear-to-b from-transparent to-zinc-400/50 mb-6" />
                <h2 className="text-2xl md:text-5xl font-serif text-white tracking-[0.4em] text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{event.detail.title}</h2>
              </div>

              {/* Scrolling Content Block */}
              <div className="relative w-full flex-1 overflow-hidden mask-[linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
                <div className={`scrolly-text-content-${event.id} flex flex-col items-center w-full gap-8 pb-[30vh] pt-[5vh]`}>
                  {event.detail.quote && (
                    <div className="max-w-md text-base md:text-xl leading-relaxed tracking-widest font-serif text-zinc-200 italic text-center px-6 md:px-12 border-l border-r border-zinc-600/30 py-4 my-4">
                      <p>"{event.detail.quote}"</p>
                    </div>
                  )}
                  {event.detail.lead && (
                    <p className="text-sm md:text-base leading-loose tracking-[0.2em] font-light text-zinc-300 text-center">
                      {event.detail.lead}
                    </p>
                  )}
                  {event.detail.lead && <div className="w-8 h-px bg-zinc-800 my-2" />}

                  <div className="flex flex-col gap-4 text-sm md:text-base leading-loose tracking-[0.3em] font-light text-zinc-400 text-center w-full">
                    {event.detail.body.map((p, i) => (
                      <p key={i} className={p === "……" ? "opacity-30 py-4" : ""}>{p}</p>
                    ))}
                  </div>

                  {event.detail.closing && (
                    <div className="mt-8 flex flex-col items-center opacity-80">
                      <div className="w-1 h-1 rounded-full bg-zinc-700 mb-6" />
                      <p className="text-xs tracking-[0.3em] text-zinc-500 font-light text-center">{event.detail.closing}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })}

      <div className="footer-trigger h-[10vh]">
        {/* 精简占位，通过更紧凑的间距触发 */}
      </div>

      <footer className="footer-final relative z-10 w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* 背景晕染层 */}
        <div className="ink-pool absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[radial-gradient(circle,rgba(127,29,29,0.15)_0%,transparent_70%)] scale-0 opacity-0 pointer-events-none" />
        
        {/* 坠落的泪滴 */}
        <div className="falling-tear absolute top-0 left-1/2 -translate-x-1/2 w-4 h-5 opacity-0 pointer-events-none">
          <svg viewBox="0 0 100 120" className="w-full h-full fill-red-700 drop-shadow-[0_0_12px_rgba(185,28,28,0.9)]">
            <path d="M50 0 C50 0 20 45 20 75 A30 30 0 1 0 80 75 C80 45 50 0 50 0 Z" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-12 text-center px-4 relative z-10">
          <div className="bloom-content opacity-0 flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <p className="ink-bloom-text text-xl md:text-4xl font-serif font-light tracking-[1em] text-zinc-100 pl-[1em]">
                倾尽天下 · 终焉
              </p>
              <div className="w-16 h-px bg-red-900/40" />
            </div>
            
            <p className="text-[11px] md:text-xs font-light tracking-[0.5em] text-zinc-500 uppercase opacity-60">
              河图作品勘鉴 · 终章
            </p>
          </div>

          <div className="mt-20 opacity-0 bottom-info">
             <p className="text-[10px] tracking-widest text-zinc-800 font-serif">
              Qing Jin Tian Xia · Chronicle Experience
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}