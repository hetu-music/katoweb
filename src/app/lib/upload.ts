import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface UploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的文件类型
  uploadDir: string; // 上传目录
  baseUrl: string; // 基础URL
}

export const coverUploadConfig: UploadConfig = {
  maxFileSize: 100 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/jpg'],
  uploadDir: process.env.COVER_UPLOAD_DIR || join(process.cwd(), 'public', 'covers'),
  baseUrl: process.env.COVER_BASE_URL || 'https://cover.hetu-music.com',
};

export async function uploadCoverFile(
  buffer: Buffer,
  songId: string,
  config: UploadConfig = coverUploadConfig
): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
  try {
    // 确保上传目录存在
    if (!existsSync(config.uploadDir)) {
      await mkdir(config.uploadDir, { recursive: true });
    }

    // 生成文件名
    const fileName = `${songId}.jpg`;
    const filePath = join(config.uploadDir, fileName);

    // 写入文件
    await writeFile(filePath, buffer);

    // 生成访问URL
    const coverUrl = `${config.baseUrl}/${fileName}`;

    return {
      success: true,
      coverUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export function validateFile(
  file: File,
  config: UploadConfig = coverUploadConfig
): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!config.allowedTypes.some(type => file.type.includes(type.split('/')[1]))) {
    return {
      valid: false,
      error: `只允许上传 ${config.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 格式的文件`,
    };
  }

  // 检查文件大小
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      error: `文件大小不能超过 ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}