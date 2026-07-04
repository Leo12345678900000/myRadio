# AetherWave

AetherWave 是一个 AI 驱动的网络电台 Web 应用。系统通过多 Agent 协作，实时生成节目时间线（主持对话、新闻、音乐等），并提供播放器、设置中心与链路健康检查等完整交互能力。

---

## 项目简介

你可以把 AetherWave 理解成「会自动编节目的网络电台」：

- **Writer（编剧）**：根据时段、节目类型和用户偏好，生成结构化节目脚本
- **Director（导播）**：按时间线调度播放，支持预加载与节目间过渡
- **TTS（配音）**：将主持词转为语音（需配置对应服务）
- **Music（音乐）**：检索并播放背景音乐与歌曲片段

前端负责编排与展示，可选 FastAPI 网关、Supabase、Ollama 作为扩展能力。

---

## 业务功能说明

### 播放器

| 功能 | 说明 |
|------|------|
| 播放 / 暂停 | 首页中央大按钮控制 |
| 字幕展示 | 显示当前对话或歌曲信息，点击可展开全文 |
| 节目队列（Queue） | 查看当前节目单（对话块、音乐块），可跳转段落 |
| 留言互动（Chat） | 发送听众留言，后续节目生成可能参考 |
| 静音（Sound） | 切换静音 |
| 重置（Reset） | 断开当前会话，重新开始 |

### 设置面板（Settings）

| 模块 | 说明 |
|------|------|
| Runtime Mode | **Demo**（无 Key 体验）/ **Live**（真实 API） |
| Backend Route | **direct** / **proxy** / **official** 三种请求路由 |
| API 配置 | AI 写稿用的 Endpoint、Key、Model |
| TTS Settings | Gemini TTS 或微软 TTS 渠道 |
| Connectivity Health | 检测 Proxy、FastAPI、Supabase、Ollama |
| 预加载 | 提前准备节目段落数量（推荐 3） |
| 体验外观 | dark / neon / minimal 主题 |
| 听众偏好 | 节目类型、曲风、探索等级 |
| 本地素材编辑 | 管理 Demo 素材（浏览器本地存储） |
| 本地统计 | API 调用次数统计 |

### Agent 监控

左下角 **机器人图标** 打开 Agent Monitor，可查看：

- WRITER / DIRECTOR / TTS 等 Agent 状态
- **Thoughts**：AI 输出与工具调用
- **Logs**：运行日志

### 运行模式

| 模式 | 适用场景 |
|------|----------|
| **Demo** | 快速体验，无需 API Key |
| **Live + proxy** | 推荐；经本站 `/api/proxy` 转发，兼容性好 |
| **Live + direct** | 浏览器直连第三方 API |
| **Live + official** | 经本地 FastAPI 网关，配合 Ollama 等 |

---

## 从 GitHub 下载并运行

### 1. 环境要求

- **Node.js** 18 或更高版本
- **pnpm**（包管理器）
- （可选）Python 3.10+，用于 FastAPI 后端
- （可选）Ollama，用于本地大模型

安装 pnpm（若尚未安装）：

```bash
npm install -g pnpm
```

### 2. 克隆仓库

```bash
git clone https://github.com/Leo12345678900000/myRadio.git
cd myRadio
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 启动前端

```bash
pnpm dev
```

浏览器访问：**http://localhost:3000**

### 5. 首次使用（Demo 模式）

1. 打开首页，点击 **播放**
2. 无需配置 Key 即可体验基础流程
3. 右上角 **Settings** 可查看各项配置

---

## 完整功能配置（Live 模式）

如需 AI 写稿、音乐检索、可选云同步等完整能力，建议按以下步骤配置。

### 推荐配置：Live + Proxy + DeepSeek

在 **Settings** 中填写：

| 设置项 | 值 |
|--------|-----|
| Runtime Mode | Live |
| Backend Route | proxy |
| API Type | OpenAI |
| Endpoint | `https://api.deepseek.com` |
| API Key | 你的 DeepSeek Key（`sk-...`） |
| Model | `deepseek-chat` |

操作顺序：**Test** → **Save** → 首页 **Reset** → 重新 **播放**。

> 使用 DeepSeek 时 **API Type 必须选 OpenAI**，不要选 Gemini。

### 可选：FastAPI 后端

适用于 **official** 路由与 Ollama 本地模型。

**终端 1 — 前端**（已在运行）：

```bash
pnpm dev
```

**终端 2 — FastAPI**：

```bash
cd backend/fastapi
python -m venv .venv
```

Windows：

```powershell
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

macOS / Linux：

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

验证：

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Settings 中设置：

- Backend Route：**official**
- Official Backend URL：`http://localhost:8000`

### 可选：Ollama 本地模型

```bash
ollama serve
ollama pull qwen2.5:7b
```

Settings 中：

- Open-source LLM：**ollama**
- Ollama Base URL：`http://localhost:11434`
- Ollama Model：`qwen2.5:7b`
- Backend Route：**official**（需 FastAPI 已启动）

### 可选：Supabase 会话同步

1. 在 [supabase.com](https://supabase.com) 创建项目
2. **SQL Editor** 执行：

```sql
create table if not exists public.agent_sessions (
  session_id text primary key,
  runtime_mode text not null,
  current_block_index integer not null default 0,
  playback_position integer not null default 0,
  timeline_snapshot jsonb not null,
  saved_at timestamptz not null default now()
);

alter table public.agent_sessions enable row level security;

create policy "Allow anon read/write sessions"
on public.agent_sessions
for all
to anon
using (true)
with check (true);
```

3. **Settings → API Keys** 复制：
   - Project URL → Supabase URL（仅 `https://xxx.supabase.co`，不要带 `/rest/v1`）
   - **anon public** 或 Legacy anon key → Supabase Anon Key
4. **Save** → **Connectivity Health → Check**

> Live 模式播放后，会话数据会同步到 Supabase；Demo 模式不会同步。

### 环境变量（可选）

在项目根目录创建 `.env.local`（勿提交到 Git）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
NEXT_PUBLIC_OFFICIAL_BACKEND_URL=http://localhost:8000
```

---

## 使用流程示例

### 日常收听（最少步骤）

```
pnpm dev → 打开 localhost:3000 → 点击播放
```

### 完整体验（Live + DeepSeek）

```
1. 配置 Settings（Live + proxy + DeepSeek）
2. Test → Save
3. 设置听众偏好（可选）
4. 播放 → 打开 Queue 查看节目单
5. Chat 发送留言（可选）
6. Agent Monitor 查看写稿过程
```

### 三终端联调（FastAPI + Ollama）

| 终端 | 命令 |
|------|------|
| 1 | `pnpm dev` |
| 2 | `uvicorn main:app --reload --port 8000`（在 backend/fastapi） |
| 3 | `ollama serve` |

Settings：**Live + official + ollama**，Health Check 四项尽量全绿。

---

## 健康检查说明

Settings 中 **Connectivity Health → Check**：

| 项 | 含义 |
|----|------|
| Proxy | 本站 `/api/proxy` 是否可用 |
| Official Backend | 本地 FastAPI `:8000` 是否可用 |
| Supabase | 云数据库是否连通（未配置则显示 not configured） |
| Ollama | 本地模型是否可用（未启用则显示 not enabled） |

Supabase / Ollama 未配置不影响 Demo 模式基本使用。

---

## 常见问题

### WRITER 报错 `Valid HTTP/HTTPS URL is required`

**Endpoint 为空或格式错误**。Live + OpenAI 模式下填写：

```text
https://api.deepseek.com
```

### 界面显示 Generate Content 404

**API Type 选错**。使用 DeepSeek 时必须选 **OpenAI**，不能选 Gemini。

### 音乐搜索 Failed to fetch

多为网络或跨域问题。项目会自动尝试经 Proxy 转发；请确认 Proxy 健康检查为绿。

### Supabase 报 PGRST125

Supabase URL 不要包含 `/rest/v1`，只填 `https://xxx.supabase.co`；并确认已创建 `agent_sessions` 表。

### TTS 无声音

需配置 Gemini TTS Key 或可用的微软 TTS 服务；不影响节目生成与音乐播放，字幕仍会更新。

### 左下角 N 图标

Next.js 开发模式工具，仅 `pnpm dev` 时出现，可忽略。

---

## 开发与测试

```bash
pnpm test              # 单元测试
pnpm test:acceptance   # 核心模块测试
pnpm lint              # 代码检查
pnpm build             # 生产构建
pnpm check:acceptance  # lint + 测试 + build
```

---

## 项目结构

```
app/                    # Next.js 页面与 /api/proxy
src/
  features/
    agents/             # Director、Orchestrator
    content/            # Writer、节目配置与工具
    tts/                # 语音合成
    music-search/       # 音乐检索
  widgets/              # 播放器、设置面板、Agent 监控
  shared/               # Provider、Health、存储、AI 服务
backend/fastapi/        # 可选 FastAPI 网关
public/                 # 静态资源
```

---

## 技术栈

- 前端：Next.js 16、React 19、TypeScript、Tailwind CSS、Zustand、Howler
- 测试：Vitest
- 可选后端：FastAPI、Ollama、Supabase

---

## 许可证

MIT
