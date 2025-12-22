"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  FileCheck,
  FileX,
  Loader2,
} from "lucide-react";
import { apiCheckFileExists } from "@/lib/client-api";

interface CoverUploadProps {
  songId?: number;
  csrfToken: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
  hasExistingFile?: boolean;
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

  const checkFileExists = useCallback(
    async (id: number) => {
      if (!id) return false;
      setCheckingFile(true);
      try {
        const result = await apiCheckFileExists(id, "cover", csrfToken);
        if (!result) return false;
        const exists = result.exists;
        setFileExists(exists);
        return exists;
      } catch (error) {
        console.error("Check cover failed:", error);
        setFileExists(false);
        return false;
      } finally {
        setCheckingFile(false);
      }
    },
    [csrfToken],
  );

  useEffect(() => {
    if (songId) {
      checkFileExists(songId);
    } else {
      setFileExists(false);
    }
  }, [songId, checkFileExists]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      setErrorState("只允许上传JPG格式");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorState("文件大小不能超过100MB");
      return;
    }

    if (!songId) {
      setErrorState("请先保存歌曲");
      return;
    }

    await uploadFile(file);
  };

  const setErrorState = (msg: string) => {
    setUploadStatus("error");
    setUploadMessage(msg);
    onUploadError?.(msg);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus("idle");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (songId) formData.append("songId", songId.toString());

      const response = await fetch("/api/admin/upload-cover", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "上传失败");
      }

      const result = await response.json();
      setUploadStatus("success");
      setUploadMessage(result.message || "上传成功");
      setFileExists(true);
      onUploadSuccess?.();

      setTimeout(() => {
        setUploadStatus("idle");
        setUploadMessage("");
      }, 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "上传失败";
      setErrorState(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !songId}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border
            ${uploading || !songId
              ? "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed"
              : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            }
          `}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "上传中..." : "选择JPG封面"}
        </button>

        {songId ? (
          <div className="flex items-center gap-2">
            {checkingFile ? (
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> 检查中...
              </span>
            ) : fileExists ? (
              <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 text-xs flex items-center gap-1 font-medium">
                <FileCheck size={12} /> 已上传
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-xs flex items-center gap-1 font-medium">
                <FileX size={12} /> 未上传
              </span>
            )}
          </div>
        ) : (
          <span className="text-amber-500 text-xs">需先保存歌曲</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadMessage && (
        <div
          className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border
          ${uploadStatus === "success"
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400"
            }
        `}
        >
          {uploadStatus === "success" ? (
            <Check size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span className="flex-1 truncate">{uploadMessage}</span>
          <button
            onClick={() => setUploadMessage("")}
            className="hover:opacity-60"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex gap-3">
        <span>JPG 格式</span>
        <span>Max 100MB</span>
      </div>
    </div>
  );
}
