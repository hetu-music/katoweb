import type { ImmersiveTheme, TimelineEvent } from "../types";
import { defaultTheme, DefaultNodeLayout, animateDefault } from "./DefaultNode";
import {
  theme as theme23,
  NodeLayout as NodeLayout23,
  animate as animate23,
} from "./Node23";
import {
  theme as theme39,
  NodeLayout as NodeLayout39,
  animate as animate39,
} from "./Node39";

import {
  theme as theme4,
  NodeLayout as NodeLayout4,
  animate as animate4,
} from "./Node4";
import {
  theme as theme26,
  NodeLayout as NodeLayout26,
  animate as animate26,
} from "./Node26";
import {
  theme as theme28,
  NodeLayout as NodeLayout28,
  animate as animate28,
} from "./Node28";
import {
  theme as theme22,
  NodeLayout as NodeLayout22,
  animate as animate22,
} from "./Node22";
import {
  theme as theme31,
  NodeLayout as NodeLayout31,
  animate as animate31,
} from "./Node31";
import {
  theme as theme32,
  NodeLayout as NodeLayout32,
  animate as animate32,
} from "./Node32";
import {
  theme as theme9,
  NodeLayout as NodeLayout9,
  animate as animate9,
} from "./Node9";
import {
  theme as theme38,
  NodeLayout as NodeLayout38,
  animate as animate38,
} from "./Node38";
import {
  theme as theme40,
  NodeLayout as NodeLayout40,
  animate as animate40,
} from "./Node40";

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

export const CUSTOM_NODE_REGISTRY: Record<string, CustomNodeDef> = {
  "4": { theme: theme4, Component: NodeLayout4, animate: animate4 },
  "23": { theme: theme23, Component: NodeLayout23, animate: animate23 },
  "26": { theme: theme26, Component: NodeLayout26, animate: animate26 },
  "28": { theme: theme28, Component: NodeLayout28, animate: animate28 },
  "22": { theme: theme22, Component: NodeLayout22, animate: animate22 },
  "31": { theme: theme31, Component: NodeLayout31, animate: animate31 },
  "32": { theme: theme32, Component: NodeLayout32, animate: animate32 },
  "9": { theme: theme9, Component: NodeLayout9, animate: animate9 },
  "38": { theme: theme38, Component: NodeLayout38, animate: animate38 },
  "39": { theme: theme39, Component: NodeLayout39, animate: animate39 },
  "40": { theme: theme40, Component: NodeLayout40, animate: animate40 },
};

// ─── Re-exports ────────────────────────────────────────────────────────────────

export { defaultTheme, DefaultNodeLayout, animateDefault };
