"use client";

import { useGSAP } from "@gsap/react";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Fragment, useEffect, useRef } from "react";
import { timelineData, type TimelineEvent } from "./data";

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
  hasDetail = false,
}: {
  content: string[];
  important?: boolean;
  mobile?: boolean;
  align?: "left" | "right";
  hasDetail?: boolean;
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
      {hasDetail ? (
        <p className="pt-2 text-[10px] font-light tracking-[0.55em] text-red-700/75 sm:text-[11px]">
          卷展详读
        </p>
      ) : null}
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

function TimelineDetailSection({
  event,
}: {
  event: TimelineEvent;
}) {
  if (!event.detail) {
    return null;
  }

  const { detail } = event;

  return (
    <section className="timeline-detail-section pointer-events-none relative h-[420vh] w-full">
      <div className="timeline-detail-stage fixed inset-0 z-30 h-svh w-full opacity-0">
        <div className="timeline-detail-backdrop absolute inset-0 opacity-0">
          <div className="absolute inset-0 bg-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(161,40,40,0.18)_0%,rgba(39,39,42,0.08)_36%,rgba(9,9,11,0.96)_100%)]" />
        </div>

        <article className="timeline-detail-panel absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-red-900/55 bg-zinc-950 shadow-[0_0_0_rgba(0,0,0,0)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.24)_0%,rgba(9,9,11,0.95)_78%)]" />

          <div className="timeline-detail-content absolute inset-0 flex flex-col opacity-0">
            <div className="flex items-start justify-between gap-6 px-6 pt-10 md:px-14 md:pt-14">
              <div className="timeline-detail-line space-y-4">
                <p className="text-[10px] font-light tracking-[0.7em] text-red-800/85 md:text-xs">
                  {detail.eyebrow}
                </p>
                <h2 className="text-3xl font-light tracking-[0.28em] text-zinc-100 md:text-5xl md:tracking-[0.36em]">
                  {detail.title}
                </h2>
              </div>

              <div className="timeline-detail-line hidden md:block">
                <EventDate year={event.year} month={event.month} monthFirst />
              </div>
            </div>

            <div className="timeline-detail-copy relative flex-1 overflow-hidden px-6 pt-8 pb-12 md:px-14 md:pt-12 md:pb-16">
              <div className="timeline-detail-reading h-full overflow-hidden rounded-[1.5rem] border border-white/6 bg-white/[0.02] px-5 py-6 md:px-8 md:py-8">
                <div className="timeline-detail-columns flex h-full flex-row-reverse gap-6 overflow-hidden [writing-mode:vertical-rl] [text-orientation:mixed] md:gap-10">
                  {detail.quote ? (
                    <p className="timeline-detail-line max-h-full text-base leading-[2.8] tracking-[0.45em] text-zinc-200 md:text-xl md:leading-[3] md:tracking-[0.5em]">
                      {detail.quote}
                    </p>
                  ) : null}

                  {detail.lead ? (
                    <p className="timeline-detail-line max-h-full text-sm leading-[2.8] tracking-[0.42em] text-zinc-300 md:text-lg md:leading-[3] md:tracking-[0.48em]">
                      {detail.lead}
                    </p>
                  ) : null}

                  {detail.body.map((paragraph, index) => (
                    <p
                      key={index}
                      className="timeline-detail-line max-h-full text-[13px] leading-[2.65] tracking-[0.4em] text-zinc-400 md:text-[15px] md:leading-[2.9] md:tracking-[0.45em]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {detail.closing ? (
                    <p className="timeline-detail-line max-h-full text-[12px] leading-[2.8] tracking-[0.55em] text-red-800/80 md:text-sm">
                      {detail.closing}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
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
      const detailSections = gsap.utils.toArray<HTMLElement>(
        ".timeline-detail-section",
        container.current,
      );
      const timelineSpines = gsap.utils.toArray<HTMLElement>(
        ".timeline-spine, .timeline-progress",
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

      const updateDotsByProgressLine = () => {
        if (!progressLine) {
          return;
        }

        const progressRect = progressLine.getBoundingClientRect();
        const lineBottom = progressRect.top + progressRect.height;

        dots.forEach((dot) => {
          const dotRect = dot.getBoundingClientRect();
          const dotCenter = dotRect.top + dotRect.height / 2;
          setDotState(dot, lineBottom >= dotCenter);
        });
      };

      if (progressLine) {
        gsap.to(progressLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline-container",
            start: "top 60%",
            end: "bottom 80%",
            scrub: 1 * animationSlowdown,
            onUpdate: updateDotsByProgressLine,
            onRefresh: updateDotsByProgressLine,
          },
        });
      }

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
              start: "top 85%",
              end: "top 50%",
              scrub: 1 * animationSlowdown,
            },
          },
        );
      });

      detailSections.forEach((section) => {
        const sectionQuery = gsap.utils.selector(section);
        const originDot =
          section.previousElementSibling?.querySelector<HTMLElement>(".event-dot") ??
          null;
        const stage = sectionQuery(".timeline-detail-stage")[0] as
          | HTMLElement
          | undefined;
        const backdrop = sectionQuery(".timeline-detail-backdrop")[0] as
          | HTMLElement
          | undefined;
        const panel = sectionQuery(".timeline-detail-panel")[0] as
          | HTMLElement
          | undefined;
        const content = sectionQuery(".timeline-detail-content")[0] as
          | HTMLElement
          | undefined;
        const copy = sectionQuery(".timeline-detail-copy")[0] as
          | HTMLElement
          | undefined;
        const lines = sectionQuery(".timeline-detail-line");

        if (!stage || !panel || !content || !copy) {
          return;
        }

        gsap.set(stage, { autoAlpha: 0 });
        if (backdrop) {
          gsap.set(backdrop, { opacity: 0 });
        }
        gsap.set(panel, {
          width: 12,
          height: 12,
          borderRadius: 999,
          boxShadow: "0 0 0 rgba(0,0,0,0)",
        });
        gsap.set(content, { autoAlpha: 0 });
        gsap.set(copy, { yPercent: 0 });

        const detailTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: originDot ?? section,
            start: originDot ? "center center" : "top center",
            end: "+=4200",
            scrub: true,
            pin: section,
            anticipatePin: 1,
            pinSpacing: true,
            invalidateOnRefresh: true,
          },
        });

        detailTimeline
          .set(stage, { autoAlpha: 1 }, 0)
          .to(
            timelineSpines,
            { opacity: 0, duration: 0.06, ease: "none" },
            0,
          );

        if (backdrop) {
          detailTimeline.to(
            backdrop,
            { opacity: 1, duration: 0.18, ease: "none" },
            0.02,
          );
        }

        detailTimeline.to(
          panel,
          {
            width: () => window.innerWidth,
            height: () => window.innerHeight,
            borderRadius: 0,
            boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
            duration: 0.24,
            ease: "power2.inOut",
          },
          0,
        );

        detailTimeline.to(
          content,
          {
            autoAlpha: 1,
            duration: 0.14,
            ease: "none",
          },
          0.16,
        );

        detailTimeline.fromTo(
          lines,
          { opacity: 0, y: 36, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.18,
            stagger: 0.04,
            ease: "none",
          },
          0.2,
        );

        detailTimeline.to({}, { duration: 0.34 }, 0.38);

        detailTimeline.to(
          copy,
          {
            yPercent: -10,
            duration: 0.14,
            ease: "none",
          },
          0.72,
        );

        detailTimeline.to(
          lines,
          {
            opacity: 0,
            filter: "blur(12px)",
            duration: 0.12,
            ease: "none",
          },
          0.82,
        );

        detailTimeline.to(
          content,
          {
            autoAlpha: 0,
            duration: 0.1,
            ease: "none",
          },
          0.86,
        );

        detailTimeline.to(
          panel,
          {
            width: 12,
            height: 12,
            borderRadius: 999,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.16,
            ease: "power2.inOut",
          },
          0.84,
        );

        if (backdrop) {
          detailTimeline.to(
            backdrop,
            { opacity: 0, duration: 0.12, ease: "none" },
            0.88,
          );
        }

        detailTimeline.to(
          timelineSpines,
          { opacity: 1, duration: 0.08, ease: "none" },
          0.98,
        );

        detailTimeline.set(stage, { autoAlpha: 0 }, 1);
      });

      updateDotsByProgressLine();
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
        <div className="timeline-spine absolute top-0 bottom-0 left-14 w-px -translate-x-1/2 rounded bg-zinc-800/40 md:left-1/2" />
        <div className="timeline-progress absolute top-0 bottom-0 left-14 z-10 w-px -translate-x-1/2 origin-top scale-y-0 rounded bg-red-800/80 shadow-[0_0_10px_rgba(185,28,28,0.8)] md:left-1/2" />

        <div className="relative flex w-full flex-col pt-10 pb-40">
          {timelineData.map((event, index) => {
            const isLeft = index % 2 === 0;

            return (
              <Fragment key={event.id}>
                <div className="timeline-event group relative my-10 flex w-full flex-col md:my-20 md:flex-row md:justify-center">
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
                        hasDetail={Boolean(event.detail)}
                      />
                    </div>
                  </div>

                  <div
                    className={`hidden w-1/2 justify-end pr-12 md:flex lg:pr-24 ${
                      !isLeft ? "invisible" : ""
                    }`}
                  >
                    <div className="flex flex-row items-center gap-8 lg:gap-12">
                      <EventLines
                        content={event.content}
                        important={event.important}
                        align="right"
                        hasDetail={Boolean(event.detail)}
                      />
                      <EventDate
                        year={event.year}
                        month={event.month}
                        monthFirst
                      />
                    </div>
                  </div>

                  <div
                    className={`hidden w-1/2 justify-start pl-12 md:flex lg:pl-24 ${
                      isLeft ? "invisible" : ""
                    }`}
                  >
                    <div className="flex flex-row items-center gap-8 lg:gap-12">
                      <EventDate year={event.year} month={event.month} />
                      <EventLines
                        content={event.content}
                        important={event.important}
                        hasDetail={Boolean(event.detail)}
                      />
                    </div>
                  </div>
                </div>

                {event.detail ? <TimelineDetailSection event={event} /> : null}
              </Fragment>
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
