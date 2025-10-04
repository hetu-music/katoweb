"use client";
import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Check, AlertCircle, FileCheck, FileX } from "lucide-react";

interface CoverUploadProps {
  songId?: number;
  csrfToken: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  hasExistingFile?: boolean; // 是否已有文件
}

export default function CoverUpload({
  songId,
  csrfToken,
  onUploadSuccess,
  onUploadError,
  hasExistingFile = false,
}: CoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [fileExists, setFileExists] = useState(hasExistingFile);
  const [checkingFile, setCheckingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 检查文件是否存在
  const checkFileExists = async (id: number) => {
    if (!id) return false;

    setCheckingFile(true);
    try {
      const response = await fetch(`https://cover.hetu-music.com/cover/${id}.jpg`, {
        method: 'HEAD', // 只检查头部，不下载文件内容
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });

      // 根据R2存储的设置：存在返回200，不存在返回404
      const exists = response.status === 200;
      setFileExists(exists);
      return exists;
    } catch (error) {
      console.error('检查封面文件存在性失败:', error);
      setFileExists(false);
      return false;
    } finally {
      setCheckingFile(false);
    }
  };

  // 当songId变化时检查文件
  useEffect(() => {
    if (songId) {
      checkFileExists(songId);
    } else {
      setFileExists(false);
    }
  }, [songId]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setUploadStatus("error");
      setUploadMessage("只允许上传JPG格式的图片");
      onUploadError?.("只允许上传JPG格式的图片");
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadMessage("文件大小不能超过100MB");
      onUploadError?.("文件大小不能超过100MB");
      return;
    }

    if (!songId) {
      setUploadStatus("error");
      setUploadMessage("请先保存歌曲后再上传封面");
      onUploadError?.("请先保存歌曲后再上传封面");
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

      const response = await fetch("/api/admin/upload-cover", {
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
      setUploadMessage(result.message || "封面上传成功");
      setFileExists(true); // 上传成功后更新文件存在状态
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
      {/* 上传按钮和状态提示 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || !songId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${uploading || !songId
              ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
              : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-400/30"
            }
          `}
        >
          <Upload size={16} />
          {uploading ? "上传中..." : "选择JPG文件"}
        </button>

        {/* 文件状态提示 */}
        {songId && (
          <div className="flex items-center gap-2">
            {checkingFile ? (
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                检查中...
              </span>
            ) : fileExists ? (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <FileCheck size={14} />
                已有封面
              </span>
            ) : (
              <span className="text-orange-400 text-xs flex items-center gap-1">
                <FileX size={14} />
                未上传
              </span>
            )}
          </div>
        )}

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
            ${uploadStatus === "success"
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
        <div>• 只支持JPG格式的图片文件</div>
        <div>• 文件大小不超过100MB</div>
      </div>
    </div>
  );
}
