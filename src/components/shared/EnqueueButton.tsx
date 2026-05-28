"use client";

import React, { useState } from "react";
import { Check, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import { useUserContext } from "@/context/UserContext";

interface EnqueueButtonProps {
  songId: number;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  hasAudio?: boolean;
  className?: string;
  size?: number;
}

export default function EnqueueButton({
  songId,
  title,
  artist,
  coverUrl,
  hasAudio = true,
  className,
  size = 15,
}: EnqueueButtonProps) {
  const { user, loaded } = useUserContext();
  const { controls, state } = usePlayer();
  const [justAdded, setJustAdded] = useState(false);

  const hasBenefits = loaded && !!user?.hasBenefits;
  if (!hasBenefits || !hasAudio) return null;

  const alreadyInQueue = state.queue.some((t) => t.songId === songId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadyInQueue) return;
    controls.enqueue({ songId, title, artist, coverUrl });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={alreadyInQueue ? "已在播放列表" : "加入播放列表"}
      title={alreadyInQueue ? "已在播放列表" : "加入播放列表"}
      className={cn(
        "rounded-lg p-2 transition-all duration-200",
        alreadyInQueue || justAdded
          ? "text-emerald-500 cursor-default"
          : "text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
        className,
      )}
    >
      {justAdded || alreadyInQueue ? (
        <Check size={size} />
      ) : (
        <ListPlus size={size} />
      )}
    </button>
  );
}
