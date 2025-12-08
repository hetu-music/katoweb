# Cloudflare Turnstile 配置指南

## 1. 获取 Turnstile 密钥

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 在左侧菜单中找到 **Turnstile**
4. 点击 **Add Site** 创建新站点
5. 填写以下信息：
   - **Site name**: 你的网站名称（例如：KatoWeb Admin）
   - **Domain**: 你的域名（例如：example.com）
   - **Widget Mode**: 选择 **Managed** (推荐)
6. 创建后会得到两个密钥：
   - **Site Key** (公开的，用于前端)
   - **Secret Key** (保密的，用于后端验证)

## 2. 配置环境变量

在 `.env.local` 文件中更新以下配置：

```env
# Cloudflare Turnstile 配置
NEXT_PUBLIC_TURNSTILE_SITE_KEY=你的_site_key
TURNSTILE_SECRET_KEY=你的_secret_key
```

## 3. 测试配置

### 开发环境测试密钥

Cloudflare 提供了测试密钥，可以在开发时使用：

```env
# 测试密钥 - 总是通过验证
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# 测试密钥 - 总是失败
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AB

# 测试密钥 - 强制交互式挑战
NEXT_PUBLIC_TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=3x0000000000000000000000000000000FF
```

## 4. 验证流程

1. 用户访问登录页面
2. Turnstile 组件自动加载并显示验证挑战
3. 用户完成验证后，获得 token
4. 提交登录表单时，先验证 Turnstile token
5. Token 验证通过后，继续执行登录逻辑

## 5. 主题和样式自定义

在 `src/app/admin/login/page.tsx` 中可以自定义 Turnstile 组件：

```tsx
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setError("人机验证加载失败")}
  onExpire={() => setTurnstileToken("")}
  options={{
    theme: "light", // 可选: "light" | "dark" | "auto"
    size: "normal",  // 可选: "normal" | "compact"
    language: "zh-CN", // 可选: 设置语言
  }}
/>
```

## 6. 安全建议

- ✅ 永远不要在前端代码中暴露 `TURNSTILE_SECRET_KEY`
- ✅ 在生产环境使用真实的域名配置
- ✅ 定期轮换 Secret Key
- ✅ 监控 Turnstile 的验证统计数据
- ✅ 设置合理的失败重试次数

## 7. 故障排查

### 验证总是失败
- 检查 Secret Key 是否正确配置
- 确认域名是否匹配 Cloudflare 配置
- 查看浏览器控制台是否有错误

### 组件不显示
- 检查 Site Key 是否正确
- 确认网络连接正常
- 检查是否被广告拦截器阻止

### 本地开发问题
- 使用测试密钥进行本地开发
- 或在 Cloudflare 中添加 `localhost` 到允许的域名列表

## 8. 相关链接

- [Cloudflare Turnstile 文档](https://developers.cloudflare.com/turnstile/)
- [React Turnstile 组件文档](https://github.com/marsidev/react-turnstile)
