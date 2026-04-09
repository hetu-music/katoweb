import { NextRequest, NextResponse } from "next/server";
import { uploadCoverFile, validateFile } from "@/lib/service-upload";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";

export const POST = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const songId = formData.get("songId") as string;

      if (!file || !songId) {
        return NextResponse.json(
          { error: "Missing file or songId" },
          { status: 400 },
        );
      }

      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // 获取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 上传文件
      const uploadResult = await uploadCoverFile(buffer, songId);

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || "Upload failed" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "封面上传成功",
        fileName: `${songId}.jpg`,
      });
    } catch (error) {
      console.error("Upload cover error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  { requireCSRF: true },
);
