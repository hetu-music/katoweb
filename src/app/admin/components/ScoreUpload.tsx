"use client";
import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";

interface ScoreUploadProps {
  songId?: number;
  csrfToken: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

export default function ScoreUpload({
  songId,
  csrfToken,
  onUploadSuccess,
  onUploadError,
}: ScoreUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setUploadStatus("error");
      setUploadMessage("只允许上传JPG格式的乐谱文件");
      onUploadError?.("只允许上传JPG格式的乐谱文件");
      return;
    }

    // 验证文件大小 (50MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadMessage("文件大小不能超过100MB");
      onUploadError?.("文件大小不能超过100MB");
      return;
    }

    if (!songId) {
      setUploadStatus("error");
      setUploadMessage("请先保存歌曲后再上传乐谱");
      onUploadError?.("请先保存歌曲后再上传乐谱");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus("idle");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("songId", songId!.toString());

      const response = await fetch("/api/admin/upload-score", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "上传失败");
      }

      const result = await response.json();

      setUploadStatus("success");
      setUploadMessage(result.message || "乐谱上传成功");
      onUploadSuccess?.();

      // 3秒后清除状态
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMessage("");
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "上传失败";
      setUploadStatus("error");
      setUploadMessage(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearStatus = () => {
    setUploadStatus("idle");
    setUploadMessage("");
  };

  return (
    <div className="space-y-3">
      {/* 上传按钮 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || !songId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${
              uploading || !songId
                ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-400/30"
            }
          `}
        >
          <Upload size={16} />
          {uploading ? "上传中..." : "选择JPG文件"}
        </button>

        {!songId && (
          <span className="text-yellow-400 text-xs">请先保存歌曲</span>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 状态消息 */}
      {uploadMessage && (
        <div
          className={`
            flex items-center gap-2 p-3 rounded-lg text-sm
            ${
              uploadStatus === "success"
                ? "bg-green-500/20 text-green-300 border border-green-400/30"
                : uploadStatus === "error"
                  ? "bg-red-500/20 text-red-300 border border-red-400/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-400/30"
            }
          `}
        >
          {uploadStatus === "success" && <Check size={16} />}
          {uploadStatus === "error" && <AlertCircle size={16} />}
          <span className="flex-1">{uploadMessage}</span>
          <button
            type="button"
            onClick={clearStatus}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 说明文字 */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>• 只支持JPG格式的乐谱文件</div>
        <div>• 文件大小不超过100MB</div>
      </div>
    </div>
  );
}
