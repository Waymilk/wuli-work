# Wuli AI

Wuli AI 是一个基于 Vue 3、TypeScript 和 Vite 的 AI 图片/视频生成前端项目。项目围绕模型探索、图片/视频生成、历史资产管理和画布模板浏览组织，前端通过统一请求层对接后端 API，并使用 Pinia 管理登录、模型缓存和生成任务状态。

## 核心功能

- 探索页：加载后端模型列表，提供生成入口，并展示首页 Banner 与作品流。
- 生成页：支持图片生成、视频生成、参考图上传、prompt 图片 token、任务轮询和历史结果展示。
- 资产页：查询历史资源，支持收藏、取消收藏和删除历史记录。
- 画布页：从 `https://wuli.art` 获取画布分类、快捷模板和模板广场数据。
- 登录体系：支持注册/登录、token 本地持久化、接口自动携带鉴权头；全局 401 会清空登录态并弹出登录窗口。

## 技术栈

- Vue 3 + `<script setup>`
- TypeScript
- Vite
- Pinia
- Vue Router
- Ant Design Vue + `@ant-design/icons-vue`
- Axios
- Sass
- oxlint

## 本地开发

推荐使用 Node.js `^20.19.0 || >=22.12.0`，包管理器使用 pnpm。

```bash
pnpm install
pnpm dev
```

快速固定端口启动：

```bash
pnpm dev:fast-startup
```

常用命令：

```bash
pnpm lint
pnpm build
pnpm preview
```

`dev:fast-page` 与 `dev:fast-startup` 都会使用 `127.0.0.1:5173` 和严格端口模式启动 Vite。

## 接口与环境配置

业务请求统一通过 `src/utils/request.ts` 发起。请求层会在浏览器环境读取 `wuli_auth_token`，并自动注入：

```text
Authorization: Bearer <token>
```

响应拦截器会把成功响应解包为 `response.data`；当接口返回 HTTP 401 时，会调用 auth store 清空本地登录信息，并打开全局登录弹窗。

可配置环境变量：

- `VITE_API_BASE_URL`：生产或非代理模式下的 API base URL，默认 `/`。
- `VITE_USE_DEV_PROXY=0`：开发环境关闭 Vite `/api` 代理，改用 `VITE_API_BASE_URL`。

开发环境默认启用 Vite 代理：

```text
/api -> http://121.43.53.154:8088
```

画布相关接口在 `src/views/canvas/api.ts` 中直接访问 `https://wuli.art`。

## 目录结构

```text
src/
  components/          通用业务组件，如生成面板、登录弹窗、参考图上传
  layout/              应用主布局、侧边栏和布局内弹窗
  plugins/             第三方插件注册
  router/              Vue Router 路由配置和页面级登录拦截
  stores/              Pinia stores：登录、模型缓存、生成任务等
  types/               后端模型等共享类型
  utils/request.ts     全局 Axios 实例、鉴权头和 401 拦截
  views/               页面模块：explore、generate、asset、canvas
public/
  wuli-assets/         展示素材和静态资源
  wuli-generate-assets/生成页相关静态素材
  wuli-icons/          导航、头像、积分等图标资源
```

## 业务约定

- 登录状态统一由 `useAuthStore` 管理，存储 key 包括 `wuli_auth_token`、`wuli_auth_user` 和兼容用的 `wuli_logged_in`。
- 模型数据从 `/api/models` 获取，并缓存在 `models` store 中；探索页优先加载模型，其他页面可复用缓存。
- 生成任务通过 `/api/tasks` 创建，并按任务 ID 轮询 `/api/tasks/{taskId}`。
- 参考图上传走 `/api/user/images/upload`，生成请求提交上传成功图片的 `image_ids`。
- 历史记录从 `/api/history` 加载，生成任务 store 会把历史接口数据规整为页面展示所需的状态、结果图、参考图和 prompt token。
- 资产页的历史资源查询使用 `/api/resource/query`，收藏与删除动作复用历史记录相关接口。

## 开发注意事项

- 新增业务接口时优先复用 `src/utils/request.ts`，避免绕过统一鉴权和 401 处理。
- 新增页面级状态时优先考虑 Pinia store，跨页面任务状态不要只放在单个组件内。
- README 不包含 `.env` 的具体值；如需本地自定义接口地址，请在本机 `.env` 中配置。
- 当前项目没有单元测试脚本，提交前至少运行 `pnpm lint` 和 `pnpm build`。
