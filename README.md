# AetherWave

AetherWave 是一个 AI 驱动的网络电台 Web 应用。系统通过多 Agent 协作，实时生成节目时间线（主持对话、新闻、音乐等），并提供播放器、设置中心与链路健康检查等完整交互能力。

本项目基于 [RadioNowhere](https://github.com/CJackHwang/RadioNowhere) 二次开发，重构了旁白系统并优化了 Agent 编排体验。

---

## 项目简介

你可以把 AetherWave 理解成「会自动编节目的网络电台」：

| Agent | 职责 |
|-------|------|
| **Writer（编剧）** | ReAct 多轮写稿，可调用搜歌、查歌词等工具，输出结构化节目时间线 |
| **Director（导播）** | 按时间线调度播放，支持双缓冲预加载与节目间过渡 |
| **Narrator（旁白）** | 将主持词转为语音，支持 edge-tts → 浏览器朗读 → 字幕计时 三级降级 |
| **Music（音乐）** | 通过 GD Music API 检索并播放歌曲 |

前端负责编排与展示；可选 FastAPI 网关提供 edge-tts 旁白与 Ollama 转发；Supabase 用于会话同步。

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
| Narrator Settings | 旁白模式、edge-tts 地址、主持音色 |
| Connectivity Health | 检测 Proxy、FastAPI、Edge TTS、Supabase、Ollama |
| 预加载 | 提前准备节目段落数量（推荐 3） |
| 体验外观 | dark / neon / minimal 主题 |
| 听众偏好 | 节目类型、曲风、探索等级 |
| 本地素材编辑 | 管理 Demo 素材（浏览器本地存储） |
| 本地统计 | API 调用次数统计 |

### Agent 监控

左下角 **机器人图标** 打开 Agent Monitor，可查看：

- WRITER / DIRECTOR / NARRATOR 等 Agent 状态
- **Thoughts**：AI 输出与工具调用
- **Logs**：运行日志

### 运行模式

| 模式 | 适用场景 |
|------|----------|
| **Demo** | 快速体验，无需 API Key |
| **Live + proxy** | 推荐；经本站 `/api/proxy` 转发 LLM 请求，兼容性好 |
| **Live + direct** | 浏览器直连第三方 API |
| **Live + official** | 经本地 FastAPI 网关，配合 Ollama 等 |

---

## 从 GitHub 下载并运行

### 1. 环境要求

- **Node.js** 18 或更高版本
- **pnpm**（包管理器）
- （可选）Python 3.10+，用于 FastAPI 旁白服务
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

如需 AI 写稿、音乐检索、旁白朗读等完整能力，建议按以下步骤配置。

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

操作顺序：**Save** → 滚动到底部点击 **Test** → 首页 **Reset** → 重新 **播放**。

> 使用 DeepSeek 时 **API Type 必须选 OpenAI**，不要选 Gemini。

### 旁白配置：Narrator + edge-tts（推荐）

旁白采用三级降级链：

```
L1  FastAPI edge-tts（需联网，音质最好）
L2  浏览器 SpeechSynthesis（无需后端）
L3  字幕 + 计时（无声音，节目仍可播放）
```

**终端 1 — 前端**：

```bash
pnpm dev
```

**终端 2 — FastAPI（旁白 L1）**：

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

验证旁白服务：

```bash
curl http://localhost:8000/api/tts/health
# {"status":"ok", ...}
```

Settings → **Narrator Settings**：

| 设置项 | 推荐值 |
|--------|--------|
| 语音模式 | **自动**（edge-tts → 浏览器 → 字幕） |
| Edge TTS 服务地址 | `http://localhost:8000` |
| 主持 A / B 音色 | 按需选择 |

点击 **测试旁白** 确认 L1 可用。

> 不启动 FastAPI 也可使用：自动模式会降级到浏览器朗读或字幕计时。

### 可选：FastAPI + Ollama 本地写稿

适用于 **official** 路由与 Ollama 本地模型（与旁白共用同一 FastAPI 实例）。

验证网关：

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

Settings 中设置：

- Backend Route：**official**
- Official Backend URL：`http://localhost:8000`

启动 Ollama：

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

### 完整体验（Live + DeepSeek + 旁白）

```
1. 配置 Settings（Live + proxy + DeepSeek）
2. 启动 FastAPI（uvicorn main:app --port 8000）
3. Save → Test（LLM）→ 测试旁白
4. 设置听众偏好（可选）
5. 播放 → 打开 Queue 查看节目单
6. Chat 发送留言（可选）
7. Agent Monitor 查看写稿过程
```

### 三终端联调（FastAPI + Ollama）

| 终端 | 命令 |
|------|------|
| 1 | `pnpm dev` |
| 2 | `uvicorn main:app --reload --port 8000`（在 backend/fastapi） |
| 3 | `ollama serve` |

Settings：**Live + official + ollama**，Health Check 尽量全绿。

---

## 健康检查说明

Settings 中 **Connectivity Health → Check**：

| 项 | 含义 |
|----|------|
| Proxy | 本站 `/api/proxy` 是否可用 |
| Official Backend | 本地 FastAPI `:8000` 是否可用 |
| Edge TTS | edge-tts 旁白服务是否可用 |
| Supabase | 云数据库是否连通（未配置则显示 not configured） |
| Ollama | 本地模型是否可用（未启用则显示 not enabled） |

Supabase / Ollama / Edge TTS 未配置不影响 Demo 模式基本使用；旁白会自动降级。

---

## 常见问题

### WRITER 报错 `Valid HTTP/HTTPS URL is required`

**Endpoint 为空或格式错误**。Live + OpenAI 模式下填写：

```text
https://api.deepseek.com
```

### WRITER 报错 `Proxy timeout after 60000ms`

LLM 响应超时。ReAct 写稿多轮调用 DeepSeek，可能因网络或服务繁忙导致。可稍后重试，或检查 DeepSeek 账户状态与网络。

### 界面显示 Generate Content 404

**API Type 选错**。使用 DeepSeek 时必须选 **OpenAI**，不能选 Gemini。

### 音乐搜索 Failed to fetch

多为网络或跨域问题。项目会自动尝试经 Proxy 转发；请确认 Proxy 健康检查为绿。

### Supabase 报 PGRST125

Supabase URL 不要包含 `/rest/v1`，只填 `https://xxx.supabase.co`；并确认已创建 `agent_sessions` 表。

### 旁白无声音

1. Settings → Narrator → 点击 **测试旁白** 查看当前可用层级
2. L1：确认 FastAPI 已启动且 `curl http://localhost:8000/api/tts/health` 正常
3. L2：确认浏览器支持 SpeechSynthesis（Chrome / Edge 推荐）
4. L3：字幕模式无声音属正常，字幕仍会更新

### Settings 里 Test 按钮在哪？

打开 Settings 后**滚动到最底部**，左侧灰色 **Test** 按钮用于测试 LLM 连接；Narrator 区块内的按钮用于测试旁白。

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
app/                         # Next.js 页面与 /api/proxy
src/
  features/
    agents/                  # Director、预加载、Talk/Music 执行器
    content/                 # Writer（ReAct）、Prompt 模板、解析器
    narrator/                # Narrator Agent、edge-tts / 浏览器 / 字幕渲染
    music-search/            # GD Music API 封装
    time-announcement/       # 整点报时
  widgets/                   # 播放器、设置面板、Agent 监控
  shared/                    # AI 服务、音频混音、健康检查、存储
backend/fastapi/             # FastAPI 网关 + edge-tts 旁白
  main.py                    # /health、/api/tts/*、Ollama 转发
  tts_service.py             # edge-tts 合成
public/                      # 静态资源
```

---

## 技术栈

- 前端：Next.js 16、React 19、TypeScript、Tailwind CSS、Zustand、Howler
- 旁白：edge-tts（Python）、浏览器 SpeechSynthesis、字幕计时 Fallback
- 测试：Vitest
- 可选后端：FastAPI、Ollama、Supabase

---

## 致谢

- 原项目：[CJackHwang/RadioNowhere](https://github.com/CJackHwang/RadioNowhere)
- 音乐 API：[GD Music API](https://music.gdstudio.xyz)

---

## 许可证

MIT
