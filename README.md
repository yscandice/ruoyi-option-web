# RuoYi Option Web

独立的期权网站前端，与 RuoYi-Vue3 管理端分开运行和构建。当前实现“今日”页面，使用蓝白主色，并复用后端 RuoYi 登录、验证码及 `ruoyi-option` 今日数据接口。

## 开发

```bash
npm install
npm run dev
```

默认启动在 `http://localhost:8092`。开发服务器将 `/dev-api` 代理到 `http://localhost:8090`。如后端端口不同，在 `.env.development` 修改 `VITE_PROXY_TARGET`。

登录使用 RuoYi 的账号密码和验证码接口。登录令牌仅保存在此网站自己的浏览器本地存储；上游 OSM 会话 Cookie 仍由后端 Redis 管理，不会暴露到前端。

## 生产部署

```bash
npm run build
npm run preview
```

生产环境默认请求当前站点同源 API。部署时需在 Web 服务器配置将 `/login`、`/getInfo`、`/logout`、`/captchaImage` 和 `/api/member/*` 转发至 RuoYi 后端。
