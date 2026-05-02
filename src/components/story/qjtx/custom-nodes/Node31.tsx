import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
    // A cold, tranquil moonlight and shadow aesthetic
    bg: "#020617", // Handled inside for animations
    titleColor: "#f8fafc",
    bodyColor: "#cbd5e1",
    accentColor: "#e2e8f0",
    layout: "horizontal",
    specialEffect: "none",
    maskPath:
        "M50 0 C68 8 82 18 92 34 C100 48 100 52 92 66 C82 82 68 92 50 100 C32 92 18 82 8 66 C0 52 0 48 8 34 C18 18 32 8 50 0 Z",
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

    // Split body text for sequential silent fades
    const splitIndex = Math.ceil(detail.body.length / 2);
    const phase1Lines = detail.body.slice(0, splitIndex);
    const phase2Lines = detail.body.slice(splitIndex);

    return (
        <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>

            {/* Global Wrapper for Entrance/Exit Animations */}
            <div className={`node-wrapper-${event.id} absolute inset-0 opacity-0`}>

                {/* Solid Base Background */}
                <div className="absolute inset-0 bg-[#020617] pointer-events-none" />

                {/* Clear Background Image with Tranquil Cold Tint */}
                <div className="absolute inset-0 bg-[url('/story/qjtx/31.avif')] bg-cover bg-center opacity-60 mix-blend-luminosity pointer-events-none" />

                {/* Frost / Moonlight Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-b from-[#020617]/90 via-[#0f172a]/20 to-[#020617]/95 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(241,245,249,0.03)_0%,transparent_60%)] pointer-events-none" />

                {/* Silent Snow Falling */}
                <div className={`silent-snow-${event.id} absolute inset-0 pointer-events-none opacity-0`}>
                    {Array.from({ length: 40 }).map((_, i) => {
                        const s = prand(i * 1.1) * 3 + 1;
                        return (
                            <div
                                key={i}
                                className={`snow-particle-${event.id} absolute bg-slate-200/50 rounded-full blur-[1px]`}
                                style={{ width: s, height: s, left: `${prand(i * 1.2) * 100}%`, top: "-10%" }}
                            />
                        )
                    })}
                </div>

                {/* Central Thread of Memory (Silver Line) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`silver-thread-${event.id} w-px h-[80vh] bg-linear-to-b from-transparent via-slate-400/30 to-transparent opacity-0`} />
                </div>

                {/* --- Phase 0: Intro (Title & Quote) --- */}
                <div className={`content-phase-0-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8 pointer-events-none`}>
                    <div className="text-slate-400/60 text-[10px] md:text-xs tracking-[1em] pl-[1em] mb-12 font-light uppercase">
                        九龙塔 · 遗像长悬
                    </div>
                    <h2 className="relative text-4xl md:text-[5rem] text-transparent bg-clip-text bg-linear-to-b from-slate-50 to-slate-400/80 tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-light text-center drop-shadow-[0_0_20px_rgba(241,245,249,0.3)] wrap-break-word leading-tight max-w-[90vw]">
                        {detail.title}
                    </h2>
                    <div className="mt-10 text-slate-300/80 text-xs md:text-[15px] tracking-[0.4em] md:tracking-[0.6em] font-light text-center w-full max-w-2xl leading-[2.2] md:leading-[2.5] pl-[0.4em] md:pl-[0.6em] whitespace-normal wrap-break-word drop-shadow-md">
                        {detail.quote}
                    </div>
                </div>

                {/* --- Phase 1: The Tower Memory --- */}
                <div className={`content-phase-1-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pointer-events-none`}>
                    <div className="flex flex-col gap-8 md:gap-12 max-w-3xl text-center">
                        {phase1Lines.map((line, i) => (
                            <p key={i} className={`text-[14px] md:text-[16px] leading-[2.2] tracking-[0.2em] md:tracking-[0.3em] pl-[0.2em] md:pl-[0.3em] text-slate-200/90 font-light whitespace-normal wrap-break-word drop-shadow-sm`}>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* --- Phase 2: The Tragic Realization (Cinnabar) --- */}
                <div className={`content-phase-2-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pointer-events-none`}>
                    <div className="flex flex-col gap-8 md:gap-12 max-w-4xl text-center relative z-10">
                        {phase2Lines.map((line, i) => {
                            const emphasis = line.includes("朱砂") || line.includes("颜色无双") || line.includes("追随那人而去");
                            const isSeparator = line === "……";
                            return (
                                <p key={i} className={`text-[14px] md:text-[16px] leading-[2.2] tracking-[0.2em] md:tracking-[0.3em] pl-[0.2em] md:pl-[0.3em] whitespace-normal wrap-break-word transition-colors duration-1000 ${emphasis ? 'text-slate-50 font-normal drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]'
                                        : isSeparator ? 'text-slate-600/50 tracking-[0.8em]'
                                            : 'text-slate-300/80 font-light'
                                    }`}>
                                    {line}
                                </p>
                            )
                        })}
                    </div>

                    {/* The Singular Tragic Red Dot */}
                    <div className={`the-cinnabar-dot-${event.id} absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-rose-600 rounded-full blur-[0.5px] shadow-[0_0_20px_4px_rgba(225,29,72,0.8)] opacity-0 pointer-events-none z-0`} />
                </div>

                {/* --- Phase 3: Closing (The Echo) --- */}
                <div className={`content-phase-3-${event.id} absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none`}>
                    <div className="w-px h-16 md:h-24 bg-linear-to-b from-transparent to-slate-400/30 mb-10" />
                    <div className="text-slate-100 text-sm md:text-xl tracking-[0.8em] md:tracking-[1.2em] pl-[0.8em] md:pl-[1.2em] font-light max-w-4xl text-center leading-[2.5] md:leading-[3] drop-shadow-[0_0_20px_rgba(241,245,249,0.5)] whitespace-normal wrap-break-word">
                        {detail.closing}
                    </div>
                    <div className="w-px h-16 md:h-24 bg-linear-to-t from-transparent to-slate-400/30 mt-10" />
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
    const snowContainer = sel(`.silent-snow-${eventId}`);
    const silverThread = sel(`.silver-thread-${eventId}`);
    const cinnabarDot = sel(`.the-cinnabar-dot-${eventId}`);

    const phase0 = sel(`.content-phase-0-${eventId}`);
    const phase0Items = phase0?.children;

    const phase1 = sel(`.content-phase-1-${eventId}`);
    const phase1Items = sel(`.content-phase-1-${eventId} > div`)?.children;

    const phase2 = sel(`.content-phase-2-${eventId}`);
    const phase2Items = sel(`.content-phase-2-${eventId} > div`)?.children;

    const phase3 = sel(`.content-phase-3-${eventId}`);
    const phase3Items = phase3?.children;

    // Initial States
    tl.set([wrapper, snowContainer, phase0, phase1, phase2, phase3], { opacity: 0 });
    tl.set(silverThread, { scaleY: 0, transformOrigin: "center" });
    tl.set(cinnabarDot, { scale: 0, opacity: 0 });

    if (phase0Items) tl.set(phase0Items, { opacity: 0, y: 15, filter: "blur(10px)" });
    if (phase1Items) tl.set(phase1Items, { opacity: 0, y: 15, filter: "blur(10px)" });
    if (phase2Items) tl.set(phase2Items, { opacity: 0, y: 15, filter: "blur(10px)" });
    if (phase3Items) tl.set(phase3Items, { opacity: 0, y: 15, filter: "blur(15px)" });

    // Continuous Silent Snow
    const snowflakes = selAll(`.snow-particle-${eventId}`);
    snowflakes.forEach(p => {
        gsap.to(p, {
            y: "110vh",
            x: `+=${(Math.random() - 0.5) * 60}px`,
            opacity: Math.random() * 0.5 + 0.2,
            duration: 10 + Math.random() * 10,
            repeat: -1,
            ease: "none",
            delay: Math.random() * -10
        });
    });

    // --- The Timeline ---

    // 0. Global Entrance
    tl.to(wrapper, { opacity: 1, duration: 2.5, ease: "power2.inOut" }, 0);
    tl.to(snowContainer, { opacity: 1, duration: 4 }, 0.5);
    tl.to(silverThread, { scaleY: 1, opacity: 1, duration: 4, ease: "power2.inOut" }, 1);

    // 1. Phase 0: Intro (Fade in, hold, fade out)
    tl.set(phase0, { opacity: 1 });
    if (phase0Items) {
        tl.to(phase0Items, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, stagger: 0.3, ease: "power2.out" }, 2);
        tl.to(phase0Items, { opacity: 0, y: -15, filter: "blur(10px)", duration: 3, stagger: 0.1, ease: "power2.inOut" }, "+=3");
    }
    tl.set(phase0, { display: "none" });

    // 2. Phase 1: The Tower Memory
    tl.set(phase1, { opacity: 1 });
    if (phase1Items) {
        tl.to(phase1Items, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, stagger: 0.4, ease: "power2.out" }, "-=1");
        tl.to(phase1Items, { opacity: 0, y: -15, filter: "blur(10px)", duration: 2.5, stagger: 0.1, ease: "power2.inOut" }, "+=3.5");
    }
    tl.set(phase1, { display: "none" });

    // 3. Phase 2: The Tragic Realization
    tl.set(phase2, { opacity: 1 });
    if (phase2Items) {
        tl.to(phase2Items, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, stagger: 0.4, ease: "power2.out" }, "-=1");

        // The Cinnabar strikes at the emotional climax
        tl.to(cinnabarDot, { scale: 1, opacity: 1, duration: 2, ease: "elastic.out(1, 0.4)" }, "-=2");

        tl.to(phase2Items, { opacity: 0, y: -15, filter: "blur(10px)", duration: 2.5, stagger: 0.1, ease: "power2.inOut" }, "+=3.5");
    }
    tl.set(phase2, { display: "none" });

    // 4. Phase 3: Closing (The Echo)
    tl.set(phase3, { opacity: 1 });
    if (phase3Items) {
        tl.to(phase3Items, { opacity: 1, y: 0, filter: "blur(0px)", duration: 3, stagger: 0.3, ease: "power2.out" }, "-=1");

        // The cinnabar bleeds its light softly
        tl.to(cinnabarDot, { scale: 3, opacity: 0.5, filter: "blur(4px)", duration: 5, ease: "power2.out" }, "<");

        tl.to(phase3Items, { opacity: 0, y: -15, filter: "blur(15px)", duration: 2.5, stagger: 0.1, ease: "power2.inOut" }, "+=3");
    }

    // 5. Global Exit
    tl.to(silverThread, { scaleY: 0, opacity: 0, duration: 2.5, ease: "power2.inOut" }, "-=2");
    tl.to(cinnabarDot, { opacity: 0, scale: 0, duration: 2 }, "-=2");
    tl.to(snowContainer, { opacity: 0, duration: 2.5 }, "-=2");
    tl.to(wrapper, { opacity: 0, duration: 2.5, ease: "power2.inOut" }, "-=1");
}
