"use client";

import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCoverUrl } from "@/lib/utils-song";
import Image from "next/image";

interface CoverArtProps {
  song: Song;
  className?: string;
  isActive?: boolean;
}

export default function CoverArt({ song, className, isActive }: CoverArtProps) {
  const coverUrl = getCoverUrl(song);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-slate-100 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10",
        className,
      )}
    >
      <Image
        src={coverUrl}
        alt={song.title}
        width={400}
        height={400}
        className={cn(
          "h-full w-full object-cover transition-transform duration-500",
          isActive ? "scale-105" : "group-hover:scale-105",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-black mix-blend-overlay transition-opacity",
          isActive ? "opacity-10" : "opacity-0 group-hover:opacity-10",
        )}
      />
    </div>
  );
}
