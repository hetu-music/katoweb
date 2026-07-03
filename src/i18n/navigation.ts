// 类型安全的导航工具，替代 next/link 和 next/navigation
// 所有的跨页面链接应使用此处导出的工具，以正确携带 locale 前缀
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, useRouter, usePathname, getPathname } =
  createNavigation(routing);
