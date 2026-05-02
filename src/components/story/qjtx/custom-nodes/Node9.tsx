import gsap from "gsap";
import type { ImmersiveTheme, TimelineEvent } from "../types";

export const theme: ImmersiveTheme = {
    // A bright, luminous, warm ivory aesthetic (Prosperous Era)
    bg: "#faf8f5", // Handled inside for animations
    titleColor: "#9f1239", // Deep Rose
    bodyColor: "#44403c", // Stone 700
    accentColor: "#fbbf24", // Amber 400
    layout: "horizontal",
    specialEffect: "none",
    maskPath: "M 50 0 C 80 0 100 20 100 50 C 100 80 80 100 50 100 C 20 100 0 80 0 50 C 0 20 20 0 50 0 Z",
};

export function NodeLayout({
    event,
}: {
    event: TimelineEvent;
    resolvedTheme: Required<ImmersiveTheme>;
}) {
    const detail = event.detail;
    if (!detail) return null;

    // Split lines according to data.ts exactly
    const phase1Lines = detail.body.slice(0, 3); // Moli's rise
    const phase2Lines = detail.body.slice(3, 7); // The gap, fall, and discovery
    const phase3Lines = detail.body.slice(7, 9); // The Cinnabar masterpiece
    const phase4Lines = detail.body.slice(9);    // The Emperor's sigh

    return (
        <div className={`scrolly-text-${event.id} relative z-10 h-full w-full overflow-hidden font-serif select-none`}>

            {/* Global Wrapper for Entrance/Exit Animations */}
            <div className={`node-wrapper-${event.id} absolute inset-0 opacity-0`}>

                {/* Solid Base Background to block underlying timeline */}
                <div className="absolute inset-0 bg-[#faf8f5] pointer-events-none" />

                {/* Background Image & Warm Overlays for "Spring Breeze" / "Golden Age" */}
                <div className="absolute inset-0 bg-[url('/story/qjtx/9.avif')] bg-cover bg-center opacity-70 mix-blend-multiply scale-105 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-b from-[#fffbeb]/70 via-[#fef3c7]/40 to-[#faf8f5]/70 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,rgba(250,248,245,0.6)_80%)] pointer-events-none" />

                {/* Ambient Spring Petals (Soft pinks and golds) */}
                <div className={`spring-petals-${event.id} absolute inset-0 pointer-events-none opacity-0`}>
                    {Array.from({ length: 30 }).map((_, i) => {
                        const isGold = i % 3 === 0;
                        return (
                            <div key={`petal-${i}`} className={`petal-particle-${event.id} absolute rounded-full blur-[1px] ${isGold ? 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.4)]'}`}
                                style={{ width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 3 + 2}px`, left: `${Math.random() * 100}%`, top: "-5%", borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" }} />
                        )
                    })}
                </div>

                {/* Stage 0: Intro (Title & Quote) */}
                <div className={`scrolly-intro-${event.id} absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8`}>
                    <div className="relative flex flex-col items-center w-full max-w-[90vw]">
                        <div className="absolute -inset-10 bg-amber-100/50 blur-2xl rounded-full pointer-events-none" />
                        <h2 className="relative text-4xl md:text-[5rem] text-transparent bg-clip-text bg-linear-to-b from-rose-800 to-rose-600 tracking-[0.5em] md:tracking-[0.6em] pl-[0.5em] md:pl-[0.6em] font-medium text-center drop-shadow-[0_2px_10px_rgba(159,18,57,0.2)] wrap-break-word leading-tight">
                            {detail.title}
                        </h2>
                        <div className="w-1.5 h-1.5 rotate-45 bg-amber-400 mt-8 md:mt-12 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                    </div>

                    <div className={`quote-text-${event.id} mt-6 md:mt-8 text-stone-600 text-xs md:text-[15px] tracking-[0.6em] md:tracking-[0.8em] font-light text-center w-full max-w-[85vw] md:max-w-lg leading-[2.2] md:leading-loose pl-[0.6em] md:pl-[0.8em] whitespace-normal wrap-break-word`}>
                        {detail.quote}
                    </div>
                </div>

                {/* Stage 1: The Prodigy (Moli's Rise) */}
                <div className={`scrolly-phase1-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] border border-amber-300/30 rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 text-center max-w-3xl">
                        {phase1Lines.map((line, i) => (
                            <p key={i} className="text-[15px] md:text-[18px] tracking-[0.25em] md:tracking-[0.35em] leading-[2.2] md:leading-[2.5] whitespace-normal wrap-break-word text-stone-700 font-light">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Stage 2: The Fall & The Discovery */}
                <div className={`scrolly-phase2-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
                    {/* A subtle shift in lighting for the passage of time */}
                    <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-[2px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-6 md:gap-10 text-center max-w-4xl">
                        {phase2Lines.map((line, i) => {
                            const isTragic = line.includes("城陷") || line.includes("公子没");
                            const isSeparator = line === "……";
                            return (
                                <p key={i} className={`text-[14px] md:text-[16px] tracking-[0.2em] md:tracking-[0.3em] leading-[2.2] md:leading-[2.5] whitespace-normal wrap-break-word ${isSeparator ? "text-stone-400 tracking-[1em]"
                                        : isTragic ? "text-stone-500 font-normal"
                                            : "text-stone-700 font-light"
                                    }`}>
                                    {line}
                                </p>
                            )
                        })}
                    </div>
                </div>

                {/* Stage 3: The Cinnabar Masterpiece */}
                <div className={`scrolly-phase3-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>

                    {/* The Beautiful Cinnabar Mark - Not tragic, but stunning */}
                    <div className={`cinnabar-container-${event.id} relative flex items-center justify-center mb-12 md:mb-16`}>
                        <div className={`cinnabar-dot-${event.id} relative w-4 h-4 md:w-5 md:h-5 bg-rose-600 rounded-full shadow-[0_0_30px_10px_rgba(225,29,72,0.5),inset_0_0_6px_rgba(255,255,255,0.6)] z-20`} />
                        <div className={`cinnabar-ring-1-${event.id} absolute w-24 h-24 md:w-32 md:h-32 border border-amber-400/40 rounded-full z-10`} />
                        <div className={`cinnabar-ring-2-${event.id} absolute w-[30vw] h-[30vw] max-w-[200px] max-h-[200px] border-[0.5px] border-amber-300/20 rounded-full z-10`} />
                        <div className={`cinnabar-glow-${event.id} absolute w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0%,transparent_70%)] rounded-full mix-blend-multiply pointer-events-none z-0`} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 text-center max-w-3xl">
                        {phase3Lines.map((line, i) => (
                            <p key={i} className="text-[16px] md:text-[22px] tracking-[0.3em] md:tracking-[0.4em] leading-[2.2] md:leading-[2.5] text-rose-900 font-normal drop-shadow-[0_2px_10px_rgba(159,18,57,0.1)] whitespace-normal wrap-break-word">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Stage 4: The Emperor's Sigh */}
                <div className={`scrolly-phase4-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
                    <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 text-center max-w-4xl">
                        {phase4Lines.map((line, i) => (
                            <p key={i} className={`text-[15px] md:text-[18px] tracking-[0.25em] md:tracking-[0.35em] leading-[2.2] md:leading-[2.5] whitespace-normal wrap-break-word ${line.includes("争寻画卷") ? "text-amber-700 font-normal drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-stone-700 font-light"}`}>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Stage 5: Closing */}
                <div className={`scrolly-closing-container-${event.id} absolute inset-0 flex flex-col items-center justify-center opacity-0 px-4 md:px-8`}>
                    <div className="w-px h-12 md:h-24 bg-linear-to-b from-transparent to-amber-500/50 mb-6 md:mb-10" />
                    <div className="text-stone-500 text-xs md:text-base tracking-[0.8em] md:tracking-[1.2em] pl-[0.8em] md:pl-[1.2em] font-light text-center w-full max-w-[90vw] leading-loose wrap-break-word whitespace-normal">
                        {detail.closing}
                    </div>
                    <div className="w-px h-12 md:h-24 bg-linear-to-t from-transparent to-amber-500/50 mt-6 md:mt-10" />
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
    const petalsContainer = sel(`.spring-petals-${eventId}`);
    const petals = selAll(`.petal-particle-${eventId}`);

    const intro = sel(`.scrolly-intro-${eventId}`);
    const introElements = intro?.children;

    const phase1 = sel(`.scrolly-phase1-${eventId}`);
    const phase1Text = sel(`.scrolly-phase1-${eventId} > div.relative`)?.children;

    const phase2 = sel(`.scrolly-phase2-${eventId}`);
    const phase2Text = sel(`.scrolly-phase2-${eventId} > div.relative`)?.children;

    const phase3 = sel(`.scrolly-phase3-${eventId}`);
    const phase3Text = sel(`.scrolly-phase3-${eventId} > div.relative`)?.children;
    const cinnabarContainer = sel(`.cinnabar-container-${eventId}`);
    const dot = sel(`.cinnabar-dot-${eventId}`);
    const ring1 = sel(`.cinnabar-ring-1-${eventId}`);
    const ring2 = sel(`.cinnabar-ring-2-${eventId}`);

    const phase4 = sel(`.scrolly-phase4-${eventId}`);
    const phase4Text = sel(`.scrolly-phase4-${eventId} > div.relative`)?.children;

    const closingContainer = sel(`.scrolly-closing-container-${eventId}`);
    const closingElements = closingContainer?.children;

    // Initial States
    tl.set([wrapper, petalsContainer, phase1, phase2, phase3, phase4, closingContainer], { opacity: 0 });
    if (introElements) tl.set(introElements, { opacity: 0, y: 20 });
    if (phase1Text) tl.set(phase1Text, { opacity: 0, y: 15 });
    if (phase2Text) tl.set(phase2Text, { opacity: 0, y: 15 });
    if (phase3Text) tl.set(phase3Text, { opacity: 0, y: 15 });
    if (phase4Text) tl.set(phase4Text, { opacity: 0, y: 15 });

    tl.set(cinnabarContainer, { opacity: 0 });
    tl.set([dot, ring1, ring2], { scale: 0, opacity: 0 });
    if (closingElements) tl.set(closingElements, { opacity: 0, scaleY: 0, transformOrigin: "center" });

    // Spring Petals Animation (Gentle diagonal drift)
    petals.forEach((p) => {
        gsap.to(p, {
            y: "110vh",
            x: `+=${100 + Math.random() * 150}px`, // Drift right like a breeze
            rotation: Math.random() * 360,
            opacity: Math.random() * 0.6 + 0.2,
            duration: 8 + Math.random() * 8,
            repeat: -1,
            ease: "none",
            delay: Math.random() * -10
        });
    });

    // 0. Global Entrance
    tl.to(wrapper, { opacity: 1, duration: 2.5, ease: "power2.inOut" }, 0);
    tl.to(petalsContainer, { opacity: 1, duration: 3 }, 1);

    // 1. Intro Sequence
    if (introElements && introElements.length >= 2) {
        tl.to(introElements[0], { opacity: 1, y: 0, duration: 3.5, ease: "power3.out" }, 1.5)
            .to(introElements[1], { opacity: 1, y: 0, duration: 3, ease: "power2.out" }, 2.5)
            .to(introElements, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, ease: "power2.inOut", stagger: 0.1 }, "+=3.5")
            .set(intro, { display: "none" });
    }

    // 2. Phase 1 (Moli's Rise)
    tl.set(phase1, { display: "flex", opacity: 1 });
    if (phase1Text) {
        tl.to(phase1Text, { opacity: 1, y: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" }, "+=0.5")
            .to(phase1Text, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, stagger: 0.1, ease: "power2.in" }, "+=3.5")
            .set(phase1, { display: "none" });
    }

    // 3. Phase 2 (The Fall & Discovery)
    tl.set(phase2, { display: "flex", opacity: 1 });
    if (phase2Text) {
        tl.to(phase2Text, { opacity: 1, y: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" }, "+=0.5")
            .to(phase2Text, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, stagger: 0.1, ease: "power2.in" }, "+=3.5")
            .set(phase2, { display: "none" });
    }

    // 4. Phase 3 (The Cinnabar Masterpiece)
    tl.set(phase3, { display: "flex", opacity: 1 });

    // The Cinnabar blooms like a flower
    tl.to(cinnabarContainer, { opacity: 1, duration: 1 }, "+=0.5");
    tl.to(dot, { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(1, 0.5)" }, "-=0.5")
        .to(ring1, { scale: 1, opacity: 0.8, duration: 3, ease: "power2.out" }, "-=1.5")
        .to(ring2, { scale: 1, opacity: 0.4, duration: 4, ease: "power3.out" }, "-=2")

    if (phase3Text) {
        tl.to(phase3Text, { opacity: 1, y: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" }, "-=2")
            .to([dot, ring1, ring2, ...Array.from(phase3Text)], { opacity: 0, y: -20, filter: "blur(15px)", duration: 2.5, ease: "power2.inOut" }, "+=4")
            .set(phase3, { display: "none" });
    }

    // 5. Phase 4 (The Emperor's Sigh)
    tl.set(phase4, { display: "flex", opacity: 1 });
    if (phase4Text) {
        tl.to(phase4Text, { opacity: 1, y: 0, duration: 2.5, stagger: 0.4, ease: "power2.out" }, "+=0.5")
            .to(phase4Text, { opacity: 0, y: -20, filter: "blur(10px)", duration: 2.5, stagger: 0.1, ease: "power2.in" }, "+=3.5")
            .set(phase4, { display: "none" });
    }

    // 6. Closing Sequence
    tl.set(closingContainer, { display: "flex", opacity: 1 });
    if (closingElements && closingElements.length >= 3) {
        tl.to(closingElements[0], { opacity: 1, scaleY: 1, duration: 2, ease: "power2.out" }, "+=0.5")
            .to(closingElements[2], { opacity: 1, scaleY: 1, duration: 2, ease: "power2.out" }, "<")
            .to(closingElements[1], { opacity: 1, filter: "blur(0px)", scale: 1, duration: 3, ease: "power3.out" }, "-=1")
            // Final Exit before wrapper closes
            .to(closingElements, { opacity: 0, filter: "blur(12px)", duration: 2, ease: "power2.in" }, "+=4");
    }

    // 7. Global Exit
    tl.to(petalsContainer, { opacity: 0, duration: 2.5 }, "-=2");
    tl.to(wrapper, { opacity: 0, duration: 2.5, ease: "power2.inOut" }, "-=1");
}
