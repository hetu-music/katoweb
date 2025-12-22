export interface LyricLine {
    time: number; // 时间戳（秒）
    text: string; // 歌词文本
}

export interface ProcessedLyrics {
    lyrics: string; // 处理后的普通歌词文本
    lines: LyricLine[]; // 带时间戳的歌词行数组（用于调试或其他用途）
}

function parseTime(timeStr: string): number {
    // 支持三种格式：[mm:ss] [mm:ss.xx] [mm:ss.xxx]
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?$/);
    if (!match) return 0;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = match[3] ? parseInt(match[3], 10) : 0;

    // 根据小数位数处理毫秒
    let ms = 0;
    if (match[3]) {
        if (match[3].length === 2) {
            // .xx 格式，表示百分之一秒
            ms = milliseconds / 100;
        } else if (match[3].length === 3) {
            // .xxx 格式，表示千分之一秒
            ms = milliseconds / 1000;
        }
    }

    return minutes * 60 + seconds + ms;
}

export function processLyrics(lrcContent: string): ProcessedLyrics {
    if (!lrcContent || typeof lrcContent !== "string") {
        return { lyrics: "", lines: [] };
    }

    const lines = lrcContent.split("\n");
    const lyricLines: LyricLine[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 跳过元数据行（ti:, ar:, al:, by:, offset: 等）
        if (trimmedLine.match(/^\[(?:ti|ar|al|by|offset|re|ve):/i)) {
            continue;
        }

        // 匹配时间戳格式: [mm:ss] [mm:ss.xx] [mm:ss.xxx]
        const timeRegex = /\[(\d{1,2}:\d{2}(?:\.\d{2,3})?)\]/g;
        const timestamps: string[] = [];
        let match;

        // 提取所有时间戳
        while ((match = timeRegex.exec(trimmedLine)) !== null) {
            timestamps.push(match[1]);
        }

        if (timestamps.length === 0) {
            continue; // 没有时间戳的行跳过
        }

        // 获取歌词文本（去掉所有时间戳）
        const text = trimmedLine
            .replace(/\[\d{1,2}:\d{2}(?:\.\d{2,3})?\]/g, "")
            .trim();

        // 如果没有歌词文本，跳过
        if (!text) {
            continue;
        }

        // 为每个时间戳创建一个歌词行
        for (const timestamp of timestamps) {
            const time = parseTime(timestamp);
            lyricLines.push({ time, text });
        }
    }

    // 按时间戳排序
    lyricLines.sort((a, b) => a.time - b.time);

    const finalLines = lyricLines;

    // 生成普通歌词文本
    const lyrics = finalLines.map((line) => line.text).join("\n");

    return {
        lyrics,
        lines: finalLines,
    };
}

/**
 * 验证 LRC 格式是否正确
 * @param lrcContent LRC 格式的歌词内容
 * @returns 验证结果
 */
export function validateLrcFormat(lrcContent: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!lrcContent || typeof lrcContent !== "string") {
        errors.push("LRC content is empty or not a string");
        return { isValid: false, errors };
    }

    const lines = lrcContent.split("\n");
    let hasValidTimestamp = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 检查是否包含时间戳（支持三种格式）
        const timeRegex = /\[(\d{1,2}:\d{2}(?:\.\d{2,3})?)\]/;
        if (timeRegex.test(line)) {
            hasValidTimestamp = true;

            // 验证时间戳格式
            const matches = line.match(/\[(\d{1,2}:\d{2}(?:\.\d{2,3})?)\]/g);
            if (matches) {
                for (const match of matches) {
                    const timeStr = match.slice(1, -1); // 去掉方括号
                    const time = parseTime(timeStr);
                    if (time === 0 && !timeStr.match(/^00:00(?:\.0{2,3})?$/)) {
                        errors.push(`Invalid timestamp format at line ${i + 1}: ${match}`);
                    }
                }
            }
        }
    }

    if (!hasValidTimestamp) {
        errors.push("No valid timestamps found in LRC content");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
