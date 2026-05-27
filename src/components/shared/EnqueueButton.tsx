"use client";

import React, { useState } from "react";
import { ListPlus, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import { useUserContext } from "@/context/UserContext";

interface EnqueueButtonProps {
  songId: number;
  title: string;
  artist?: string | null;
  /** 可选：直接传入 navId，跳过搜索步骤（如 NaviPlayer 已知 navId 时） */
  navId?: string | null;
  className?: string;
  /** 图标尺寸，默认 15 */
  size?: number;
}

type Status = "idle" | "loading" | "done" | "error";

export default function EnqueueButton({
  songId,
  title,
  artist,
  navId,
  className,
  size = 15,
}: EnqueueButtonProps) {
  const { user, loaded } = useUserContext();
  const { controls } = usePlayer();
  const [status, setStatus] = useState<Status>("idle");

  // 只有有权益的用户才显示
  const hasBenefits = loaded && !!user?.hasBenefits;
  if (!hasBenefits) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status !== "idle") return;

    setStatus("loading");
    try {
      let resolvedNavId = navId ?? null;

      // 没有 navId 时，通过标题搜索
      if (!resolvedNavId) {
        const res = await fetch(
          `/api/navidrome/search?title=${encodeURIComponent(title)}`,
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { id?: string | null };
        resolvedNavId = data.id ?? null;
      }

      if (!resolvedNavId) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      }

      controls.enqueue({ songId, title, artist, navId: resolvedNavId });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="加入播放列表"
      title={
        status === "done"
          ? "已加入"
          : status === "error"
            ? "未找到"
            : "加入播放列表"
      }
      className={cn(
        "rounded-lg p-2 transition-all duration-200",
        status === "idle" &&
          "text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
        status === "loading" && "text-blue-400 cursor-wait",
        status === "done" && "text-emerald-500",
        status === "error" && "text-slate-300 cursor-default",
        className,
      )}
    >
      {status === "loading" ? (
        <Loader2 size={size} className="animate-spin" />
      ) : status === "done" ? (
        <Check size={size} />
      ) : (
        <ListPlus size={size} />
      )}
    </button>
  );
}
