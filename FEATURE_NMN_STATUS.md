# 乐谱显示功能

## 功能概述

新增了 `nmn_status` 字段来控制歌曲详情页面中乐谱的显示。

## 数据库字段

- **字段名**: `nmn_status`
- **类型**: `boolean`
- **默认值**: `false`
- **允许空值**: `true`

## 功能逻辑

### 当 `nmn_status = true` 时：
- 在歌曲详情页面显示乐谱区块
- 从 `https://cover.hetu-music.com/nmn/${song.id}.jpg` 获取乐谱图片
- 乐谱区块位于音乐平台链接区块和歌词区块之间

### 当 `nmn_status = false` 或 `null` 时：
- 不显示乐谱区块

## 实现细节

### 1. 类型定义更新
在 `src/app/lib/types.ts` 中的 `SongDetail` 类型添加了 `nmn_status` 字段：

```typescript
export type SongDetail = Song & {
  // ... 其他字段
  nmn_status?: boolean | null;
};
```

### 2. 工具函数
在 `src/app/lib/utils.ts` 中添加了获取乐谱URL的函数：

```typescript
export function getNmnUrl(song: Song | SongDetail): string {
  return `https://cover.hetu-music.com/nmn/${song.id}.jpg`;
}
```

### 3. 详情页面显示
在 `src/app/song/[id]/SongDetailClient.tsx` 中添加了乐谱区块：

- 只有当 `song.nmn_status === true` 时才显示
- 包含错误处理，如果图片加载失败会显示提示信息
- 响应式设计，图片会根据容器大小自适应

### 4. 管理界面
在管理界面中添加了对 `nmn_status` 字段的支持：

- 在 `src/app/lib/constants.ts` 的 `songFields` 配置中添加了该字段
- 在管理页面的详情展开视图中会显示"有乐谱"或"无乐谱"
- 支持在编辑表单中修改该字段

## 使用方法

### 管理员操作
1. 在管理界面编辑歌曲信息
2. 将 `乐谱` 字段设置为 `true`
3. 确保对应的乐谱图片已上传到 `https://cover.hetu-music.com/nmn/${song.id}.jpg`
4. 保存修改

### 用户体验
- 用户访问歌曲详情页面时，如果该歌曲有乐谱，会在页面中看到乐谱区块
- 乐谱图片支持点击查看大图（浏览器默认行为）
- 如果乐谱图片加载失败，会显示友好的错误提示

## 注意事项

1. 乐谱图片需要手动上传到指定的URL路径
2. 图片建议使用JPG格式以保证兼容性
3. 建议图片尺寸适中，避免加载过慢
4. 该功能向后兼容，对于没有 `nmn_status` 字段的旧数据不会显示乐谱区块