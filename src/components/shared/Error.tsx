"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function ErrorState({ error }: { error: Error | string }) {
    const router = useRouter();

    // Log error for debugging but don't show to user
    React.useEffect(() => {
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 flex items-center justify-center p-6">
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mx-auto">
                        <AlertTriangle
                            size={48}
                            className="text-red-500 dark:text-red-400 opacity-80"
                            strokeWidth={1.5}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl text-slate-900 dark:text-slate-50 font-medium">
                        出错了
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-light max-w-sm mx-auto">
                        抱歉，系统遇到了一些问题。请尝试刷新页面或稍后再试。
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="group px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex items-center gap-2"
                    >
                        <RefreshCw
                            size={18}
                            className="group-hover:rotate-180 transition-transform duration-500"
                        />
                        <span>刷新页面</span>
                    </button>

                    <button
                        onClick={() => router.push("/")}
                        className="group px-6 py-2.5 rounded-full bg-blue-600 text-white border border-blue-600 shadow-lg shadow-blue-200/50 dark:shadow-none hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 flex items-center gap-2"
                    >
                        <Home size={18} />
                        <span>返回主页</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
