"use client";

import React from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player-store";
import { useUserContext } from "@/context/UserContext";

interface PlayButtonProps {
  songId: number;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  hasAudio?: boolean;
  className?: string;
  size?: number;
}

export default function PlayButton({
  songId,
  title,
  artist,
  coverUrl,
  hasAudio = true,
  className,
  size = 15,
}: PlayButtonProps) {
  const { user, loaded } = useUserContext();
  const { currentTrack, isPlaying, play, toggle } = usePlayerStore();

  const hasBenefits = loaded && !!user?.hasBenefits;
  if (!hasBenefits || !hasAudio) return null;

  const isCurrentSong = currentTrack?.songId === songId;
  const isThisPlaying = isCurrentSong && isPlaying;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentSong) {
      toggle();
    } else {
      play({ songId, title, artist, coverUrl });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isThisPlaying ? "暂停" : "播放"}
      title={isThisPlaying ? "暂停" : "播放"}
      className={cn(
        "rounded-lg p-2 transition-all duration-200",
        isThisPlaying
          ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
          : "text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
        className,
      )}
    >
      {isThisPlaying ? (
        <Pause size={size} className="fill-current" />
      ) : (
        <Play size={size} className="fill-current translate-x-px" />
      )}
    </button>
  );
}
