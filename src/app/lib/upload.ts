export interface UploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的文件类型
  baseUrl: string; // 基础URL
}

export const coverUploadConfig: UploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg'],
  baseUrl: 'https://cover.hetu-music.com',
};

export async function uploadCoverFile(
  buffer: Buffer,
  songId: string,
  config: UploadConfig = coverUploadConfig
): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
  try {
    // 生成文件名和上传URL
    const fileName = `${songId}.jpg`;
    const uploadUrl = `${config.baseUrl}/${fileName}`;

    // 直接上传到R2存储
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length.toString(),
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return {
      success: true,
      coverUrl: uploadUrl,
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