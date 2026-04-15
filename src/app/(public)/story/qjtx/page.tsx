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

      // REFACTOR: dot 激活改由 ScrollTrigger 的 progress (0-1) 驱动，
      // 不再读取进度线的 getBoundingClientRect，避免 transform 状态与视觉位置之间的一帧滞后。
      // progress=0 对应进度线起点，progress=1 对应终点（scaleY=1）。
      // dot 的触发阈值 = dot 中心在 timeline-container 内的高度占比，与 progress 直接比较。
      const updateDotsByProgress = (progress: number) => {
        if (!container.current) return;
        const containerEl =
          container.current.querySelector<HTMLElement>(".timeline-container");
        if (!containerEl) return;

        const containerRect = containerEl.getBoundingClientRect();

        dots.forEach((dot) => {
          const dotRect = dot.getBoundingClientRect();
          const dotRelativeY =
            dotRect.top + dotRect.height / 2 - containerRect.top;
          const dotFraction = dotRelativeY / containerRect.height;
          setDotState(dot, progress >= dotFraction);
        });
      };

      if (progressLine) {
        // REFACTOR: scrub 固定为 0.8，不再乘以 animationSlowdown（原值 3 导致停止滚动后拖尾 3 秒）。
        // onUpdate / onRefresh 均传入 self.progress，与进度线 scaleY 保持同步。
        gsap.to(progressLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline-container",
            start: "top 60%",
            end: "bottom 60%",
            scrub: 1.5,
            onUpdate: (self) => updateDotsByProgress(self.progress),
            onRefresh: (self) => updateDotsByProgress(self.progress),
          },
        });
      }

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
              start: "top 90%",
              end: "center 60%",
              scrub: 1.5,
            },
          },
        );
      });

      updateDotsByProgress(0);
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="relative min-h-screen overflow-x-hidden bg-[#09090b] font-serif text-zinc-300 selection:bg-red-900 selection:text-white"
    >
      <style jsx global>{`
        html.qjtx-story-page,
        html.qjtx-story-page body {
          height: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        html.qjtx-story-page::-webkit-scrollbar,
        html.qjtx-story-page body::-webkit-scrollbar {
          display: none;
        }

        html.qjtx-story-page.lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }

        html.qjtx-story-page.lenis.lenis-stopped {
          overflow: hidden;
        }

        html.qjtx-story-page.lenis.lenis-smooth [data-lenis-prevent] {
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
        <div className="timeline-progress absolute top-0 bottom-0 left-14 z-10 w-px -translate-x-1/2 origin-top scale-y-0 rounded bg-red-800/80 shadow-[0_0_10px_rgba(185,28,28,0.8)] md:left-1/2" />

        <div className="relative flex w-full flex-col pt-10 pb-40">
          {timelineData.map((event, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={event.id}
                className="timeline-event group relative my-10 flex w-full flex-col md:my-20 md:flex-row md:justify-center"
              >
                <div className="event-dot absolute top-1/2 left-10 z-20 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full border border-zinc-500 bg-zinc-950 md:left-1/2 md:h-[13px] md:w-[13px]" />

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