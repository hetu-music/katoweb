/**
 * 播放器工具函数
 */

export function formatPlayerTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseLrc(lrc: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = [];
  const tagRe = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  for (const raw of lrc.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const times: number[] = [];
    let match: RegExpExecArray | null;
    tagRe.lastIndex = 0;
    while ((match = tagRe.exec(trimmed)) !== null) {
      const time =
        parseInt(match[1]) * 60 +
        parseInt(match[2]) +
        parseInt(match[3]) / (match[3].length === 3 ? 1000 : 100);
      times.push(time);
    }
    if (times.length === 0) continue;
    const text = trimmed.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
    if (!text) continue;
    for (const time of times) {
      lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function getCurrentLrcIndex(
  lines: Array<{ time: number; text: string }>,
  currentTime: number,
): number {
  if (!lines.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}
