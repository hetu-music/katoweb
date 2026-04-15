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
        progressLine.style.transform = `translateX(-50%)`;

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
              scrollyBg.style.setProperty("--x", `${dotRect.left + dotRect.width / 2}px`);
              scrollyBg.style.setProperty("--y", `${dotRect.top + dotRect.height / 2}px`);
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

            if (textHeader && textContent) {
              tl.set(detailContent, { display: "flex" })
                .fromTo(
                  scrollyBg,
                  { "--radius": "0px" },
                  { "--radius": "150vw", duration: 1.5, ease: "power2.inOut" }
                )
                .fromTo(
                  textHeader.children,
                  { opacity: 0, y: 30, filter: "blur(10px)" },
                  { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: 0.2, ease: "power2.out" },
                  "-=0.5"
                )
                .fromTo(
                  textContent,
                  { opacity: 0, y: 60 },
                  { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" },
                  "-=0.5"
                )
                .to(textContent, { y: "-40%", duration: 4, ease: "none" })
                .to([textHeader, textContent], {
                  opacity: 0,
                  y: "-=30",
                  filter: "blur(8px)",
                  duration: 1,
                  ease: "power2.in",
                })
                .to(scrollyBg, {
                  "--radius": "0px",
                  duration: 1.2,
                  ease: "power2.inOut",
                }, "-=0.5")
                .set(detailContent, { display: "none" });
            }
          }
        }
      });

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
          className="scroll-hint absolute bottom-12 flex flex-col items-center gap-4 text-zinc-600"
        >
          <span className="ml-[0.4em] text-[10px] uppercase tracking-[0.4em]">
            展开编年史
          </span>
          <div className="relative h-16 w-px overflow-hidden bg-zinc-800">
            <div className="scroll-hint-line absolute top-0 left-0 h-full w-full bg-zinc-400/50" />
          </div>
        </motion.div>
      </section>

      <main className="timeline-container relative z-10 mx-auto w-full max-w-7xl px-4 py-[15vh]">
        <div className="absolute top-0 bottom-0 left-14 w-px -translate-x-1/2 rounded bg-zinc-800/40 md:left-1/2" />
        <div className="timeline-progress absolute top-0 left-14 z-10 w-px -translate-x-1/2 rounded bg-red-800/80 shadow-[0_0_10px_rgba(185,28,28,0.8)] md:left-1/2" />

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
                <div className="event-dot absolute top-1/2 left-14 z-20 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full border border-zinc-500 bg-zinc-950 md:left-1/2 md:h-[13px] md:w-[13px]" />

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
            className="fixed inset-0 w-screen h-screen m-0 p-0 z-[100] pointer-events-none flex-col items-center justify-center hidden"
          >
            <div
              className={`scrolly-bg-${event.id} absolute inset-0 w-full h-full bg-[#09090b] z-0 overflow-hidden`}
              style={{ clipPath: "circle(var(--radius, 0px) at var(--x, 50vw) var(--y, 60vh))" } as React.CSSProperties}
            >
              {/* Soft radial overlay to replace heavy banding gradient, explicitly nested inside the masked background to avoid screen pollution */}
              <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(63,63,70,0.18)_0%,transparent_70%)] opacity-80 pointer-events-none" />
              {/* Cinematic noise specifically for immersive view */}
              <div
                className="absolute inset-0 z-0 mix-blend-overlay opacity-30 pointer-events-none"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                }}
              />
            </div>
            
            <div className={`scrolly-text-${event.id} relative z-10 flex flex-col items-center w-full max-w-2xl px-6 md:px-0 h-full py-[15vh]`}>
              
              {/* Header Title Block */}
              <div className="scrolly-header flex flex-col items-center mb-8 md:mb-12 shrink-0">
                <div className="w-px h-8 md:h-12 bg-linear-to-b from-transparent to-red-800/80 mb-6" />
                <h3 className="text-xs md:text-sm text-red-700 mb-6 tracking-[0.5em] text-center font-light uppercase drop-shadow-[0_0_10px_rgba(185,28,28,0.5)]">{event.detail.eyebrow}</h3>
                <h2 className="text-2xl md:text-4xl font-serif text-zinc-100 tracking-[0.3em] text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">{event.detail.title}</h2>
              </div>

              {/* Scrolling Content Block */}
              <div className="relative w-full flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
                <div className={`scrolly-text-content-${event.id} flex flex-col items-center w-full gap-8 pb-[30vh] pt-[5vh]`}>
                  {event.detail.quote && (
                    <div className="text-base md:text-xl leading-relaxed tracking-widest font-serif text-zinc-300 italic text-center px-4 md:px-8 border-l border-r border-zinc-800/60 py-4 my-2">
                      <p>"{event.detail.quote}"</p>
                    </div>
                  )}
                  {event.detail.lead && (
                    <p className="text-sm md:text-base leading-loose tracking-[0.2em] font-light text-zinc-300 text-center">
                      {event.detail.lead}
                    </p>
                  )}
                  {event.detail.lead && <div className="w-8 h-px bg-zinc-800 my-2" />}
                  
                  <div className="flex flex-col gap-6 text-sm md:text-[15px] leading-loose tracking-[0.1em] font-light text-zinc-400 text-justify w-full">
                    {event.detail.body.map((p, i) => (
                      <p key={i}>{p}</p>
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

      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={footerVariants}
        className="relative z-10 flex flex-col items-center gap-8 bg-linear-to-t from-black to-transparent pt-20 pb-16 text-center"
      >
        <div className="h-16 w-px bg-linear-to-b from-transparent to-zinc-700/50" />
        <p className="text-xs font-light tracking-[0.5em] text-zinc-500 sm:text-sm">
          山河万里 · 故人长绝
        </p>
        <p className="mt-4 text-[10px] font-light tracking-widest text-zinc-700">
          河图作品勘鉴
        </p>
      </motion.footer>
    </div>
  );
}