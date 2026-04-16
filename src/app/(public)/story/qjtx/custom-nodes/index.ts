import type { ImmersiveTheme, TimelineEvent } from "../types";
import { defaultTheme, DefaultNodeLayout, animateDefault } from "./DefaultNode";
import {
  theme as theme39,
  NodeLayout as NodeLayout39,
  animate as animate39,
} from "./Node39";

// ─── Custom Node Definition ───────────────────────────────────────────────────

export interface CustomNodeDef {
  /** 该节点的完整主题配置 */
  theme: ImmersiveTheme;
  /** 自定义布局组件 */
  Component: React.ComponentType<{
    event: TimelineEvent;
    resolvedTheme: Required<ImmersiveTheme>;
  }>;
  /** 自定义 GSAP 动画构造函数 */
  animate: (
    tl: gsap.core.Timeline,
    detailContent: HTMLElement,
    scrollyBg: HTMLElement,
    scrollyText: HTMLElement,
    eventId: string,
  ) => void;
}

// ─── Registry ─────────────────────────────────────────────────────────────────
//
// 新增自定义节点只需三步：
// 1. 在 custom-nodes/ 下新建 NodeXX.tsx（可复制 Node39 作为模板）
// 2. 导出 theme / NodeLayout / animate
// 3. 在下方注册表中添加一行

export const CUSTOM_NODE_REGISTRY: Record<string, CustomNodeDef> = {
  "39": { theme: theme39, Component: NodeLayout39, animate: animate39 },
  // "4":  { theme: theme4,  Component: NodeLayout4,  animate: animate4  },
  // "23": { theme: theme23, Component: NodeLayout23, animate: animate23 },
  // ...更多自定义节点在此注册
};

// ─── Re-exports ────────────────────────────────────────────────────────────────

export { defaultTheme, DefaultNodeLayout, animateDefault };
