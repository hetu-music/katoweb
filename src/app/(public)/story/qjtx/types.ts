export type ImmersiveTheme = {
  /** 背景底色，默认 #030508 */
  bg?: string;
  /** 标题颜色，默认 white */
  titleColor?: string;
  /** 正文颜色，默认 zinc-300 */
  bodyColor?: string;
  /** 引用块边框、落款等强调色，默认 zinc-400 */
  accentColor?: string;
  /** 展开遮罩形状 SVG path（替换默认雪花形状）*/
  maskPath?: string;
  /** 阅读排版方向，默认 horizontal */
  layout?: "horizontal" | "vertical";
  /** 是否启用特殊的背景视差/水纹动效 */
  specialEffect?: "ripple" | "none";
  /** 展开动画的基础持续时间（倍数），默认 1 */
  durationMultiplier?: number;
  /** 驻留滚动的总长度，默认 4000 */
  scrollDistance?: number;
};

export interface TimelineDetail {
  title: string;
  quote?: string;
  lead?: string;
  body: string[];
  closing?: string;
  theme?: ImmersiveTheme;
}

export interface TimelineEvent {
  id: string;
  year: string;
  month?: string;
  content: string[];
  important?: boolean;
  detail?: TimelineDetail;
}
