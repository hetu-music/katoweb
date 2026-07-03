/**
 * loading.tsx — 主页骨架屏
 *
 * 切换语言时，Next.js App Router 会在服务端重新渲染期间
 * 自动显示此骨架屏作为 Suspense fallback，代替原来的通用旋转圈。
 * 骨架屏的结构与真实页面保持视觉一致，大幅减少切换时的闪动感。
 */
export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19]">
      {/* ── Navbar 骨架 ── */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 bg-[#FAFAFA]/80 backdrop-blur-md dark:border-slate-800/50 dark:bg-[#0B0F19]/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo 占位 */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mx-1 h-5 w-[2px] rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          {/* 右侧操作按钮占位 */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        {/* ── Hero 区域骨架 ── */}
        <section className="mb-6 md:mb-16">
          <div className="flex flex-col md:flex-row justify-between gap-5 md:gap-12 pt-1 md:pt-4">
            {/* 左：标题 + 描述文字 */}
            <div className="flex flex-col justify-between flex-1 gap-12 md:gap-0">
              <div className="flex flex-col gap-4">
                {/* 大标题（两段：文字 + 数字） */}
                <div className="flex items-end gap-3">
                  <div className="h-14 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-16 w-20 animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
                </div>
                {/* 描述文字 */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
            {/* 右：功能入口图标 */}
            <div className="flex items-start gap-4 md:pt-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </section>

        {/* ── 过滤条骨架 ── */}
        <section className="sticky top-20 z-40 -mx-6 mb-8 border-y border-transparent bg-[#FAFAFA]/95 px-6 py-4 backdrop-blur-sm dark:bg-[#0B0F19]/95">
          <div className="flex flex-col gap-4">
            {/* 类型 pills 行 + 搜索框 */}
            <div className="flex flex-col-reverse justify-between gap-4 md:flex-row md:items-center">
              {/* Pills */}
              <div className="flex items-center gap-2">
                {[80, 48, 48, 48, 52, 48, 48].map((w, i) => (
                  <div
                    key={i}
                    className="h-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              {/* 搜索框 + 视图切换 */}
              <div className="flex items-center gap-2">
                <div className="h-9 w-full md:w-64 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 内容区骨架（默认网格模式）── */}
        <section>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* 封面图 */}
                <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                {/* 标题 */}
                <div
                  className="h-3.5 animate-pulse rounded bg-slate-200 dark:bg-slate-800"
                  style={{ width: `${60 + (i % 4) * 10}%` }}
                />
                {/* 副标题 */}
                <div
                  className="h-3 animate-pulse rounded bg-slate-200/70 dark:bg-slate-800/70"
                  style={{ width: `${40 + (i % 3) * 10}%` }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
