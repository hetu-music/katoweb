# 壁纸功能说明

## 功能概述

为河图作品勘鉴网站添加了动态壁纸功能，支持在主页面、详情页面和登录页面使用随机壁纸作为背景。

## 功能特性

### 🎨 壁纸来源
- **Bing 每日壁纸** (70% 概率): 高质量的 Bing 搜索引擎每日推荐壁纸
- **Lorem Picsum** (30% 概率): 随机高质量摄影作品

### 🎛️ 用户控制
- **开关控制**: 用户可以随时开启或关闭壁纸功能
- **刷新功能**: 点击刷新按钮获取新的随机壁纸
- **信息显示**: 悬停查看当前壁纸的标题、版权信息和来源
- **本地存储**: 用户的壁纸开关状态会保存在本地存储中

### 📱 响应式设计
- 支持桌面端和移动端
- 按钮大小和间距在小屏幕上自动调整
- 壁纸信息提示在移动端优化显示

### 🎯 页面集成
- **主页面**: 右下角固定按钮组，包含壁纸控制
- **详情页面**: 与主页面相同的控制方式
- **登录页面**: 右上角固定按钮组

## 技术实现

### 核心组件

1. **useWallpaper Hook** (`src/app/hooks/useWallpaper.ts`)
   - 管理壁纸状态和 API 调用
   - 处理本地存储和用户偏好
   - 提供加载状态和错误处理

2. **WallpaperBackground 组件** (`src/app/components/WallpaperBackground.tsx`)
   - 渲染壁纸背景和遮罩层
   - 处理渐变背景的切换
   - 确保内容可读性

3. **WallpaperControls 组件** (`src/app/components/WallpaperControls.tsx`)
   - 提供用户交互界面
   - 显示壁纸信息和控制按钮
   - 响应式设计和动画效果

### API 端点

- **GET /api/wallpaper**: 获取随机壁纸
  - 返回壁纸 URL、标题、版权信息和来源
  - 支持 Bing 和 Lorem Picsum 两种来源
  - 自动错误处理和备用方案

### 样式优化

- 添加了专门的 CSS 类用于壁纸功能
- 支持平滑的过渡动画
- 响应式按钮布局
- 优化的悬停效果和信息提示

## 使用方法

### 用户操作

1. **开启壁纸**: 点击眼睛图标按钮开启壁纸功能
2. **关闭壁纸**: 再次点击眼睛图标关闭壁纸
3. **刷新壁纸**: 点击刷新图标获取新壁纸
4. **查看信息**: 悬停在信息图标上查看壁纸详情

### 开发者集成

```tsx
import WallpaperBackground from './components/WallpaperBackground';
import WallpaperControls from './components/WallpaperControls';
import { useWallpaper } from './hooks/useWallpaper';

function MyPage() {
  const {
    wallpaper,
    isLoading,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
  } = useWallpaper();

  return (
    <WallpaperBackground 
      wallpaperUrl={wallpaper?.url || null} 
      enabled={wallpaperEnabled}
    >
      <div className="your-content">
        {/* 页面内容 */}
      </div>
      
      <WallpaperControls
        enabled={wallpaperEnabled}
        isLoading={isLoading}
        onToggle={toggleWallpaper}
        onRefresh={refreshWallpaper}
        wallpaperInfo={wallpaper}
      />
    </WallpaperBackground>
  );
}
```

## 性能优化

- 壁纸图片使用 Next.js Image 组件优化加载
- 支持懒加载和优先级设置
- 本地存储减少不必要的 API 调用
- 防抖和缓存机制

## 浏览器兼容性

- 支持现代浏览器的 localStorage API
- 渐进式增强，不支持的功能会优雅降级
- 移动端触摸交互优化

## 未来扩展

- 支持用户上传自定义壁纸
- 添加壁纸分类和筛选
- 支持壁纸收藏功能
- 定时自动切换壁纸