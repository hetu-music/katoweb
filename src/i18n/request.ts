import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

// 明确导入让打包器能静态分析依赖
const messageLoaders: Record<Locale, () => Promise<{ default: object }>> = {
  "zh-CN": () => import("../../messages/zh-CN/index"),
  "zh-TW": () => import("../../messages/zh-TW/index"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = (await messageLoaders[locale as Locale]()).default;

  return {
    locale,
    messages,
  };
});
