"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TYPE_ORDER } from "@/lib/constants";
import { Award, Mail, User, X } from "lucide-react";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Smoothly animates height changes when children resize (e.g. tab switching). */
function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        height: height ?? "auto",
        overflow: "hidden",
        transition: "height 350ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* small min-height only guards against momentary 0-height during unmount */}
      <div ref={innerRef} style={{ minHeight: 60 }}>
        {children}
      </div>
    </div>
  );
}

interface Contributor {
  name?: string;
  display?: boolean;
  intro?: string;
  sort_order?: number;
}

const typeDescriptions: Record<string, string> = {
  原创: "河图原创作品。",
  翻唱: "翻唱他人作品，非原创。",
  合作: "与其他歌手或音乐人合作完成的作品。",
  文宣: "用于文旅宣传推广的作品。",
  商业: "为商业项目或品牌创作的作品。",
  墨宝: "与墨明棋妙相关的作品。",
  参与: "以非主创身份参与的作品。",
};

const typeColors: Record<
  string,
  { border: string; hoverBorder: string; bg: string; text: string }
> = {
  原创: {
    border: "border-l-purple-500 dark:border-l-purple-400",
    hoverBorder: "hover:border-purple-300 dark:hover:border-purple-500/50",
    bg: "from-purple-50/50 dark:from-purple-500/5",
    text: "text-purple-600 dark:text-purple-400",
  },
  合作: {
    border: "border-l-amber-500 dark:border-l-amber-400",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/50",
    bg: "from-amber-50/50 dark:from-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
  },
  文宣: {
    border: "border-l-emerald-500 dark:border-l-emerald-400",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/50",
    bg: "from-emerald-50/50 dark:from-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  商业: {
    border: "border-l-orange-500 dark:border-l-orange-400",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-500/50",
    bg: "from-orange-50/50 dark:from-orange-500/5",
    text: "text-orange-600 dark:text-orange-400",
  },
  墨宝: {
    border: "border-l-rose-500 dark:border-l-rose-400",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-500/50",
    bg: "from-rose-50/50 dark:from-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
  },
  翻唱: {
    border: "border-l-blue-500 dark:border-l-blue-400",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-500/50",
    bg: "from-blue-50/50 dark:from-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
  },
  参与: {
    border: "border-l-fuchsia-500 dark:border-l-fuchsia-400",
    hoverBorder: "hover:border-fuchsia-300 dark:hover:border-fuchsia-500/50",
    bg: "from-fuchsia-50/50 dark:from-fuchsia-500/5",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
  },
};

const fallbackColors = {
  border: "border-l-slate-500 dark:border-l-slate-400",
  hoverBorder: "hover:border-slate-300 dark:hover:border-slate-500/50",
  bg: "from-slate-50/50 dark:from-slate-500/5",
  text: "text-slate-600 dark:text-slate-400",
};

const About: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(false);
  const [contributorsError, setContributorsError] = useState<string | null>(
    null,
  );

  const fetchContributors = useCallback(async () => {
    setContributorsLoading(true);
    setContributorsError(null);
    try {
      const res = await fetch("/api/public/contributors");
      const data = await res.json();
      setContributors(
        Array.isArray(data.contributors) ? data.contributors : [],
      );
    } catch {
      setContributorsError("获取贡献者失败");
    } finally {
      setContributorsLoading(false);
    }
  }, []);

  const mainContributor = contributors.find((c) => c.sort_order === 2);

  return (
    // Dialog handles scroll-lock, focus-trap, Escape key, and backdrop automatically
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>关于</DialogTitle>
          <DialogClose asChild>
            <button className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </DialogClose>
        </DialogHeader>

        <DialogDescription className="sr-only">
          关于河图作品勘鉴项目的说明
        </DialogDescription>

        <Tabs
          defaultValue="about"
          className="flex flex-col"
          onValueChange={(value) => {
            if (
              value === "maintainer" &&
              contributors.length === 0 &&
              !contributorsLoading
            ) {
              fetchContributors();
            }
          }}
        >
          <TabsList className="px-6">
            <TabsTrigger value="about">项目介绍</TabsTrigger>
            <TabsTrigger value="types">类型说明</TabsTrigger>
            <TabsTrigger value="maintainer">维护团队</TabsTrigger>
          </TabsList>

          <AnimatedHeight>
            {/* About Tab */}
            <TabsContent value="about" className="max-h-[65vh]">
              <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    简介
                  </h3>
                  <p>
                    本项目为
                    <span className="font-medium text-slate-900 dark:text-white">
                      河图作品勘鉴
                    </span>
                    ，致力于收录整理河图的音乐作品资料，为听众提供便捷的筛选与搜索服务。
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    数据与反馈
                  </h3>
                  <p>
                    数据来源于创作者微博及各大音乐平台。若发现误漏或有意共同维护数据，欢迎邮件联系。
                  </p>
                  <a
                    href="mailto:feedback@hetu-music.com"
                    className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Mail size={16} />
                    <span>feedback@hetu-music.com</span>
                  </a>
                </div>

                <div className="p-5 rounded-xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/20 text-sm">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500 font-bold">
                    <Award size={18} />
                    <span>特别鸣谢</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    正版河图吧吧主{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {mainContributor ? mainContributor.name : "顾大一"}
                    </span>{" "}
                    及众位网友整理的《歌手河图作品发布勘鉴》，为本项目提供了宝贵参考资料。
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Types Tab */}
            <TabsContent value="types" className="max-h-[65vh] px-6 py-4">
              <div className="grid grid-cols-1 gap-3">
                {TYPE_ORDER.filter((t) => typeDescriptions[t]).map(
                  (type, idx) => {
                    const colors = typeColors[type] ?? fallbackColors;
                    return (
                      <div
                        key={type}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className={`
                      animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both
                      relative overflow-hidden rounded-xl
                      border-l-[3px] ${colors.border}
                      bg-linear-to-r ${colors.bg} to-transparent
                      border border-slate-100 dark:border-slate-800/50
                      ${colors.hoverBorder}
                      transition-colors duration-200
                    `}
                      >
                        <div className="px-4 py-3">
                          <div
                            className={`text-sm font-semibold ${colors.text} mb-1`}
                          >
                            {type}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {typeDescriptions[type]}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </TabsContent>

            {/* Maintainer Tab */}
            <TabsContent value="maintainer" className="max-h-[65vh]">
              <div className="space-y-4">
                {contributorsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">加载数据中...</span>
                  </div>
                ) : contributorsError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500 gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm">{contributorsError}</span>
                  </div>
                ) : contributors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <User size={32} className="opacity-20" />
                    <span className="text-sm">暂无贡献者信息</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...contributors]
                      .sort(
                        (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
                      )
                      .map((contributor, idx) => (
                        <div
                          key={idx}
                          style={{ animationDelay: `${idx * 40}ms` }}
                          className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold shrink-0">
                            {contributor.name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="font-semibold text-slate-900 dark:text-white text-sm">
                              {contributor.name ?? "未知贡献者"}
                            </div>
                            {contributor.intro && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {contributor.intro}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </AnimatedHeight>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default About;
