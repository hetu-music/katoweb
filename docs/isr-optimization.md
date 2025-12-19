# ISR 性能优化 - 减少主页数据大小

## 问题描述

在 ISR (Incremental Static Regeneration) 渲染时，主页会获取所有歌曲的完整数据（包括歌词等大字段），导致：

1. **HTML 文件过大**：歌词数据（LRC 格式）通常有数千字节，对于包含大量歌曲的列表页面，这会显著增加 HTML 大小
2. **传输浪费**：主页列表视图完全不需要歌词、外链等详情页字段
3. **渲染效率低**：浏览器需要解析不必要的数据

## 优化方案

### 1. 修改 `getSongs()` 函数

为 `getSongs()` 函数添加了 `forListView` 参数：

- **forListView = true**（列表视图）：只查询列表展示必需的字段
- **forListView = false**（默认）：查询所有字段（用于管理页面）

**列表视图所需字段**（11个）：
```
id, title, album, genre, lyricist, composer, artist, length, hascover, date, type
```

**注意**：`year` 字段不在数据库中存储，而是在 `mapAndSortSongs()` 函数中从 `date` 字段计算得出。

**排除的字段**（仅详情页或管理页需要）：
```
lyrics, comment, updated_at, kugolink, qmlink, nelink, albumartist, arranger, discnumber, disctotal, track, tracktotal, nmn_status, normalLyrics
```

### 2. 更新主页面

主页面（`src/app/page.tsx`）现在使用：
```typescript
songsData = await getSongs(undefined, undefined, true);
```

### 3. 保持管理页面不变

管理页面和 API 路由保持使用完整数据，因为它们需要编辑所有字段。

## 优化效果

假设一个典型场景：
- 每首歌的歌词数据：平均 3KB
- 主页展示歌曲数量：200首
- **优化前数据大小**：200 × 3KB = 600KB（仅歌词字段）
- **优化后**：0KB（不传输歌词）

加上其他详情字段（comment, links等），**总计节省约 700-800KB** 的数据传输。

## 实施的文件

1. ✅ `src/lib/supabase.ts` - 修改 `getSongs()` 函数
2. ✅ `src/app/page.tsx` - 更新主页面调用

## 注意事项

### 1. 搜索功能调整

**已移除功能**：
- ❌ 歌词搜索（因为列表数据不包含 `lyrics` 字段）

**当前支持的搜索字段**：
- ✅ 歌曲标题（权重 35%）
- ✅ 专辑名称（权重 25%）
- ✅ 作词者（权重 20%）
- ✅ 作曲者（权重 10%）
- ✅ 编曲者（权重 10%）

**搜索特性**：
- 模糊匹配（使用 Fuse.js）
- 支持中文拼音和英文
- 实时搜索（300ms 防抖）

**如果需要恢复歌词搜索**：
参考文档中的"可选解决方案"部分，推荐使用服务端搜索 API 以保持性能。

### 2. 其他注意事项

- **管理页面保持完整功能**：管理员仍可以正常编辑所有字段
- **详情页独立获取**：详情页使用 `getSongById()` 单独获取完整数据，包括歌词

## 后续优化建议

1. **考虑分页优化**：如果歌曲数量继续增长，可以考虑在服务端实现分页
2. **CDN 缓存**：配合 Next.js 的 ISR，可以进一步优化加载速度
3. **数据库索引**：确保常用查询字段（title, type, year）有适当的索引

## 测试建议

1. 检查主页列表显示是否正常
2. 验证筛选和搜索功能是否正常工作（不包含歌词搜索）
3. 确认详情页能正确显示歌词
4. 测试管理页面的编辑功能

## 附录：恢复歌词搜索的可选方案

如果未来需要恢复歌词搜索功能，可以考虑以下方案：

### 方案 A：在列表数据中包含 lyrics 字段

```typescript
// src/lib/supabase.ts
const listViewFields = "id,title,album,year,genre,lyricist,composer,artist,length,hascover,date,type,lyrics";
```

同时恢复 utils.ts 中的歌词搜索代码：
```typescript
searchableContent: [
  song.title,
  song.album || "",
  (song.lyricist || []).join(" "),
  (song.composer || []).join(" "),
  (songDetail.arranger || []).join(" "),
  processLyricsForSearch(songDetail.lyrics || null), // 恢复歌词搜索
]
```

- ✅ 优点：功能完整，实现简单
- ❌ 缺点：失去约 80% 的优化效果

### 方案 B：实现服务端歌词搜索（推荐）

1. 在 Supabase 添加全文搜索索引：
```sql
CREATE INDEX idx_lyrics_fulltext ON music USING GIN(to_tsvector('simple', lyrics));
```

2. 创建搜索 API：
```typescript
// src/app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  // 使用 Supabase 全文搜索
  const { data } = await supabase
    .from('music')
    .select('id,title,album,year')
    .textSearch('lyrics', query);
    
  return Response.json(data);
}
```

3. 客户端按需调用：
```typescript
// 只在搜索时才请求歌词数据
if (searchQuery.trim()) {
  const lyricsResults = await fetch(`/api/search?q=${searchQuery}`);
  // 合并结果...
}
```

- ✅ 优点：保持性能，支持歌词搜索，可扩展
- ⚠️ 缺点：需要额外开发和数据库配置

### 方案 C：按需加载

用户开始搜索时，动态加载包含歌词的完整数据：

```typescript
const [fullDataLoaded, setFullDataLoaded] = useState(false);

useEffect(() => {
  if (searchQuery && !fullDataLoaded) {
    // 加载完整数据（包含歌词）
    fetch('/api/songs?full=true').then(/* ... */);
    setFullDataLoaded(true);
  }
}, [searchQuery]);
```

- ✅ 优点：初始加载快，需要时才加载完整数据
- ⚠️ 缺点：首次搜索会有延迟


---

**优化日期**：2025-12-20
**预计收益**：减少约 70-80% 的初始传输数据大小
