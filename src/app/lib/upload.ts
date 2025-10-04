export interface UploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的文件类型
  baseUrl: string; // 基础URL
}

export const coverUploadConfig: UploadConfig = {
  maxFileSize: 100 * 1024 * 1024,
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
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // 如果无法解析JSON，使用默认错误消息
      }
      throw new Error(errorMessage);
    }

    // 解析成功响应
    const result = await response.json();
    
    return {
      success: true,
      coverUrl: result.url || uploadUrl, // 使用R2返回的URL，如果没有则使用原URL
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