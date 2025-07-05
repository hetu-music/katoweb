/**
 * 歌词处理工具函数
 * 用于处理 LRC 格式的歌词文件，转换为普通歌词格式
 */

export interface LyricLine {
    time: number; // 时间戳（秒）
    text: string; // 歌词文本
  }
  
  export interface ProcessedLyrics {
    lyrics: string; // 处理后的普通歌词文本
    lines: LyricLine[]; // 带时间戳的歌词行数组（用于调试或其他用途）
  }
  
  /**
   * 解析时间戳字符串为秒数
   * @param timeStr 时间戳字符串，格式如 "01:23.45" 或 "1:23.45"
   * @returns 时间戳对应的秒数
   */
  function parseTime(timeStr: string): number {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\.(\d{2})$/);
    if (!match) return 0;
    
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3], 10);
    
    return minutes * 60 + seconds + milliseconds / 100;
  }
  
  /**
   * 处理 LRC 格式的歌词
   * @param lrcContent LRC 格式的歌词内容
   * @returns 处理后的歌词对象
   */
  export function processLyrics(lrcContent: string): ProcessedLyrics {
    if (!lrcContent || typeof lrcContent !== 'string') {
      return { lyrics: '', lines: [] };
    }
  
    const lines = lrcContent.split('\n');
    const lyricLines: LyricLine[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 跳过元数据行（ti:, ar:, al:, by: 等）
      if (trimmedLine.match(/^\[(?:ti|ar|al|by|offset):/i)) {
        continue;
      }
      
      // 匹配时间戳格式: [mm:ss.xx] 或多个时间戳
      const timeRegex = /\[(\d{1,2}:\d{2}\.\d{2})\]/g;
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
      const text = trimmedLine.replace(/\[\d{1,2}:\d{2}\.\d{2}\]/g, '').trim();
      
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
    
    // 去重：如果相同时间戳有相同歌词，只保留一个
    const uniqueLines: LyricLine[] = [];
    for (const line of lyricLines) {
      const existing = uniqueLines.find(
        (ul) => ul.time === line.time && ul.text === line.text
      );
      if (!existing) {
        uniqueLines.push(line);
      }
    }
    
    // 生成普通歌词文本
    const lyrics = uniqueLines.map(line => line.text).join('\n');
    
    return {
      lyrics,
      lines: uniqueLines
    };
  }
  
  /**
   * 从文件路径读取并处理 LRC 歌词
   * @param filePath LRC 文件路径
   * @returns 处理后的歌词对象
   */
  export async function processLyricsFromFile(filePath: string): Promise<ProcessedLyrics> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return processLyrics(content);
    } catch (error) {
      console.error('Error reading lyrics file:', error);
      return { lyrics: '', lines: [] };
    }
  }
  
  /**
   * 从 URL 获取并处理 LRC 歌词
   * @param url LRC 文件的 URL
   * @returns 处理后的歌词对象
   */
  export async function processLyricsFromUrl(url: string): Promise<ProcessedLyrics> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      return processLyrics(content);
    } catch (error) {
      console.error('Error fetching lyrics from URL:', error);
      return { lyrics: '', lines: [] };
    }
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
    
    if (!lrcContent || typeof lrcContent !== 'string') {
      errors.push('LRC content is empty or not a string');
      return { isValid: false, errors };
    }
    
    const lines = lrcContent.split('\n');
    let hasValidTimestamp = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 检查是否包含时间戳
      const timeRegex = /\[(\d{1,2}:\d{2}\.\d{2})\]/;
      if (timeRegex.test(line)) {
        hasValidTimestamp = true;
        
        // 验证时间戳格式
        const matches = line.match(/\[(\d{1,2}:\d{2}\.\d{2})\]/g);
        if (matches) {
          for (const match of matches) {
            const timeStr = match.slice(1, -1); // 去掉方括号
            const time = parseTime(timeStr);
            if (time === 0 && timeStr !== '00:00.00') {
              errors.push(`Invalid timestamp format at line ${i + 1}: ${match}`);
            }
          }
        }
      }
    }
    
    if (!hasValidTimestamp) {
      errors.push('No valid timestamps found in LRC content');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }