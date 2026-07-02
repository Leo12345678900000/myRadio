# AetherWave

AetherWave 是一个 AI 驱动的网络电台平台，通过多 Agent 协作实时生成节目内容，包括主持对话、新闻播报、音乐穿插与语音合成，并提供完整的播放控制与链路健康监测。

## 功能概览

- **实时节目生成**：Writer Agent 根据时段与节目类型生成时间线脚本（对话、音乐、新闻等）
- **多 Agent 协作**：Director 负责编排与预加载，TTS Agent 负责语音合成，各 Agent 状态可在界面中查看
- **播放器**：支持播放/暂停、字幕展示、封面与进度反馈
- **双运行模式**：
  - **Demo**：使用本地/模拟数据，无需配置 API Key，开箱可用
  - **Live**：接入真实第三方服务，支持多种请求路由
- **Connectivity Health**：检测 Proxy、官方后端、Supabase、Ollama 等链路状态
- **设置面板**：切换运行模式与路由、管理 API 配置、编辑 Demo 素材、查看本地统计

## 技术栈

- **前端**：Next.js 16、React 19、TypeScript、Tailwind CSS、Zustand、Howler
- **测试**：Vitest
- **后端（可选）**：FastAPI、Ollama、Supabase

## 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装与启动

```bash
pnpm install
pnpm dev
```

浏览器访问：`http://localhost:3000`

### 基本使用

1. 打开首页，点击播放按钮开始收听
2. 点击右上角 **Settings** 打开设置面板
3. 在 **Experience** 中选择 **Demo** 或 **Live** 模式
4. Live 模式下可在 **API Settings** 中配置密钥与路由（direct / proxy / official）
5. 在 **Connectivity Health** 中查看各链路是否正常

## 运行模式与路由

| 模式 / 路由 | 说明 |
|-------------|------|
| Demo | 本地或模拟数据源，不依赖外部 API Key |
| Live (direct) | 浏览器直连第三方 API |
| Live (proxy) | 经 Next.js `/api/proxy` 转发，用于规避 CORS |
| Live (official) | 经 FastAPI 网关统一转发与错误处理 |

## FastAPI 后端（可选）

Live + Official 路由需要本地启动 FastAPI 服务：

```bash
cd backend/fastapi
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

主要接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 服务健康检查 |
| POST | `/api/gateway/fetch` | 服务端转发第三方 HTTP 请求 |
| GET | `/api/llm/models` | 获取 Ollama 已安装模型列表 |
| POST | `/api/llm/generate` | 调用 Ollama 生成文本 |

## Ollama 本地模型（可选）

如需使用本地大模型能力：

```bash
ollama serve
ollama pull qwen2.5:7b
```

启动后，Settings 中的 Health 面板会显示可用模型数量。未安装 Ollama 时不影响 Demo 模式正常使用。

## 环境变量

在项目根目录创建 `.env.local`（不要提交到版本库）：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OFFICIAL_BACKEND_URL=http://localhost:8000
```

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL（可选，用于会话同步） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥（可选） |
| `NEXT_PUBLIC_OFFICIAL_BACKEND_URL` | FastAPI 网关地址，默认 `http://localhost:8000` |

## 开发与测试

```bash
pnpm test              # 运行单元测试
pnpm test:acceptance   # 运行核心模块测试
pnpm lint              # 代码规范检查
pnpm build             # 生产构建
pnpm check:acceptance  # lint + 核心测试 + build
```

## 项目结构

```
app/              # Next.js 页面与 API 路由
src/
  features/       # Agent 编排、内容生成、TTS 等业务逻辑
  widgets/        # 播放器、设置面板、Agent 监控等 UI
  shared/         # Provider 路由、健康检查、存储与工具
backend/fastapi/  # FastAPI 网关（可选）
public/           # 静态资源与 PWA manifest
```

## 许可证

MIT
