/**
 * audio-engine.ts
 *
 * 模块级单例 Audio 实例。完全在 React 树之外，不受任何组件挂载/卸载影响。
 * 页面生命周期内只初始化一次，跨路由导航时状态完全保持。
 */

let _audio: HTMLAudioElement | null = null;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = "metadata";
    _audio.volume = 0.8;
  }
  return _audio;
}
