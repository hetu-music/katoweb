/* eslint-disable no-console */
/**
 * PWA 图标生成脚本
 * 使用 sharp 从源图片生成各尺寸 PWA 图标
 */

import * as fs from "fs";
import * as path from "path";

// PWA 需要的图标尺寸
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const iconsDir = path.join(publicDir, "icons");

// 按优先级查找源图片
const sourcePaths = [
    path.join(iconsDir, "source.png"),
    path.join(rootDir, "src", "app", "icon.png"),
    path.join(rootDir, "src", "app", "favicon.ico"),
];

async function generateIcons(): Promise<void> {
    console.log("🎨 开始生成 PWA 图标...");

    // 创建 icons 目录
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
        console.log("📁 创建 icons 目录");
    }

    // 查找可用的源图片
    let sourcePath: string | null = null;
    for (const p of sourcePaths) {
        if (fs.existsSync(p)) {
            sourcePath = p;
            break;
        }
    }

    if (!sourcePath) {
        console.error("❌ 错误: 未找到源图片");
        console.log("   请将源图片放置在以下位置之一:");
        sourcePaths.forEach((p) => console.log(`   - ${p}`));
        process.exit(1);
    }

    console.log(`📷 使用源图片: ${sourcePath}`);

    try {
        // 动态导入 sharp
        const sharp = (await import("sharp")).default;

        // 读取源图片
        const sourceBuffer = fs.readFileSync(sourcePath);

        // 获取图像信息
        const metadata = await sharp(sourceBuffer).metadata();
        console.log(
            `📐 源图像尺寸: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`
        );

        // 生成各尺寸图标
        let successCount = 0;
        for (const size of ICON_SIZES) {
            const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

            try {
                await sharp(sourceBuffer)
                    .resize(size, size, {
                        fit: "contain",
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    })
                    .png({
                        quality: 90,
                        compressionLevel: 9,
                    })
                    .toFile(outputPath);

                console.log(`✅ 生成 icon-${size}x${size}.png`);
                successCount++;
            } catch (sizeError) {
                console.warn(`⚠️ 无法生成 icon-${size}x${size}.png:`, sizeError);
            }
        }

        if (successCount === ICON_SIZES.length) {
            console.log("🎉 所有图标生成完成!");
        } else {
            console.log(`⚠️ 生成了 ${successCount}/${ICON_SIZES.length} 个图标`);
        }
    } catch (error) {
        console.error("❌ 图标生成失败:", error);
        console.log("");
        console.log("📋 请手动使用在线工具生成图标:");
        console.log("   推荐工具: https://realfavicongenerator.net/");
        console.log("   或使用: https://www.pwabuilder.com/imageGenerator");
        console.log("");
        console.log("   需要生成以下尺寸的 PNG 图标并放置到 public/icons/ 目录:");
        ICON_SIZES.forEach((size) => {
            console.log(`   - icon-${size}x${size}.png`);
        });
        process.exit(1);
    }
}

generateIcons();
