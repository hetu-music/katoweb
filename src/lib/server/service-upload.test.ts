import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateFileContent,
  validateFile,
  uploadCoverFile,
  uploadScoreFile,
} from "./service-upload";

// Magic number 字节序列，取自各格式规范
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function makeFile(content: string, type: string, size?: number): File {
  const file = new File([content], "test-file", { type });
  if (size !== undefined) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

describe("validateFileContent（Magic Number 校验）", () => {
  it("真实 JPEG header 校验通过", async () => {
    const result = await validateFileContent(JPEG_HEADER, "image/jpeg");
    expect(result.valid).toBe(true);
  });

  it("真实 PNG header 校验通过", async () => {
    const result = await validateFileContent(PNG_HEADER, "image/png");
    expect(result.valid).toBe(true);
  });

  it("伪造扩展名（内容是文本却声称是 PNG）被拒绝", async () => {
    const fakeBuffer = Buffer.from("<script>alert(1)</script>", "utf8");
    const result = await validateFileContent(fakeBuffer, "image/png");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("PNG header 冒充 JPEG 被拒绝（跨类型伪造）", async () => {
    const result = await validateFileContent(PNG_HEADER, "image/jpeg");
    expect(result.valid).toBe(false);
  });

  it("空 buffer 被拒绝", async () => {
    const result = await validateFileContent(Buffer.alloc(0), "image/jpeg");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("文件内容为空");
  });

  it("未知 mimeType 没有签名定义时判定为无效", async () => {
    const result = await validateFileContent(JPEG_HEADER, "image/gif");
    expect(result.valid).toBe(false);
  });
});

describe("validateFile（类型 / 大小校验，默认为封面配置）", () => {
  it("允许的类型且大小合规时通过", () => {
    const file = makeFile("x", "image/jpeg", 1024);
    expect(validateFile(file).valid).toBe(true);
  });

  it("类型不在允许列表内时拒绝", () => {
    const file = makeFile("x", "image/gif", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("JPEG");
  });

  it("超过最大文件大小时拒绝", () => {
    const file = makeFile("x", "image/jpeg", 200 * 1024 * 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("MB");
  });
});

describe("uploadScoreFile / uploadCoverFile（文件名清洗 + 上传）", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("songId 含路径遍历字符时被清洗，不会改变上传目标路径", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await uploadScoreFile(PNG_HEADER, "../../123");

    expect(result.success).toBe(true);
    const [url] = vi.mocked(fetch).mock.calls[0];
    // "../../123" 清洗后应只剩 "123"，不能逃逸出 nmn/ 目录
    expect(url).toBe("https://cover.hetu-music.com/nmn/123.png");
  });

  it("songId 含非法字符（如引号、控制字符）时同样被清除", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await uploadCoverFile(JPEG_HEADER, '12"3<4>5');

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://cover.hetu-music.com/cover/12345.jpg");
  });

  it("内容不匹配声明的图片类型时拒绝，且不发起上传请求", async () => {
    const fakeBuffer = Buffer.from("not-a-real-png", "utf8");
    const result = await uploadScoreFile(fakeBuffer, "1");
    expect(result.success).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("远端返回非 2xx 时上报失败原因", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ error: "R2 上传失败" }),
    } as Response);

    const result = await uploadScoreFile(PNG_HEADER, "1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("R2 上传失败");
  });
});
