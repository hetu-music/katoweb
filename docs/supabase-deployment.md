# Supabase 与正式部署说明

## 先说结论

Supabase CLI 不等于“把数据库克隆到本地”。它有三种互相独立的操作：

1. `supabase link`：让 CLI 知道要操作哪个远程项目，不下载数据库。
2. `supabase db pull`：把远程数据库的结构生成到本地 migration 文件，不会把线上数据复制到浏览器或 Next.js 项目。
3. `supabase start`：启动 Docker 中的本地 Postgres、Auth、Storage 等服务；只有执行 `db pull`/迁移后，本地结构才会接近线上结构。数据是否复制需要单独的 dump/restore 流程。

因此，正式网站不需要先 clone 数据库。正式网站通过服务端环境变量连接 Supabase 远程项目；本地 Supabase 主要用于验证迁移和危险变更。

## CLI 初始化

先安装 CLI 并登录。CLI 身份和数据库连接是两套凭据：

- `supabase login` 使用 Supabase Personal Access Token；
- `db pull` / `db push` 可能另行要求项目的数据库密码；
- `sb_secret_*`、service-role key 和前端 publishable key 都不是 CLI Personal Access Token。

初始化并连接项目：

```bash
brew install supabase/tap/supabase
supabase login
supabase init
supabase link --project-ref <project-ref>
supabase migration list
```

`db pull` 只在需要把远程结构纳入本地迁移历史时执行，不是部署本分支的前置步骤。这个仓库已经包含待部署的偏好排序 migration；首次接管已有数据库时，应先核对 `migration list` 并备份数据库，再决定如何建立 baseline，避免把远端既有结构和待部署 migration 排成错误顺序。

要先查看本分支会部署什么，再应用 migration：

```bash
supabase db push --dry-run
supabase db push
```

需要完整本地 Supabase 时，再在 migration baseline 已对齐的前提下执行：

```bash
supabase db pull
supabase start
supabase db reset
```

不要把 `supabase/.temp`、数据库密码、access token 或任何 `sb_secret_*` 值提交到 Git。

应用本仓库的 migration 前，还应确认线上 `public.music.id` 的实际类型与 migration 中的 `integer` 一致；若线上是 `bigint`，先同步修改两个外键列和 RPC 参数类型。当前仓库没有远端 schema baseline，不能仅凭 TypeScript 的 `number` 类型证明这一点。

## 正式网站环境变量

在 Vercel（或实际托管平台）的 Production 环境设置以下变量，然后重新部署：

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

`NEXT_PUBLIC_*` 变量可以进入浏览器 bundle，只能放 publishable/anon key。`SUPABASE_SERVICE_ROLE_KEY` 只能在 Next.js 服务端使用，绝不能以 `NEXT_PUBLIC_` 开头，也不能写进客户端组件、分享图或日志。

当前项目仍兼容旧的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 和 `SUPABASE_SECRET_API`，但新部署应使用上面的规范名称。`SUPABASE_SECRET_KEY` 只有在它确实是 `sb_secret_*` API key 时才会被识别；数据库密码不会被当作 API key 使用。

## 当前音乐杯的正式数据路径

`/[locale]/music-cup` 是 Next.js 服务端页面：

1. 使用服务端 key 读取 `music` 表的列表字段；
2. 根据候选模式形成 48 首池；
3. 把候选池序列化给客户端完成抽签和比赛；
4. 收藏模式通过已登录用户的 `collections` 表读取用户收藏；
5. 偏好排序通过 RLS 保护的个人比较和评分表保存。

如果生产环境缺少服务端 key，页面会降级到内置河图候选，赛事仍能打开，但那不是“正式网站实时读取数据库”的正确状态。部署后应在日志和页面中确认 live catalog 的数量，而不是只看到 fallback 页面能打开。

## 凭据轮换

曾经出现在本地命令输出或聊天上下文中的 Supabase 凭据都应视为暴露：

1. 在 Supabase Dashboard 轮换对应的 secret/service-role key；
2. 如果该值其实是数据库密码，在 Database Settings 轮换数据库密码；
3. 更新 Vercel Production/Preview 环境变量；
4. 重新部署并确认旧值已从本地 shell、CI、日志和聊天记录中移除。

本仓库的 `.gitignore` 已忽略 `.env*`，但忽略规则不能撤回已经泄露的凭据，所以轮换仍然必要。
