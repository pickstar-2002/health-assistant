# 健康咨询助手

> 基于魔珐星云3D数字人SDK + 魔搭AI大模型的智能健康咨询平台

## 项目简介

本项目是一个具身智能健康咨询应用，通过3D数字人提供7×24小时的专业健康咨询服务，涵盖症状咨询、营养指导、运动推荐、心理支持等场景。

## 核心功能

- **3D数字人交互** - 超写实数字人实时驱动，支持语音/文字双模态
- **智能健康咨询** - 症状分析、营养建议、运动指导、心理支持
- **RAG知识库** - 310+条专业知识，精准匹配回答
- **流式对话** - 逐字输出，体验流畅自然
- **紧急识别** - 严重症状自动提醒就医

---

## 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | >= 18.x |
| npm | >= 9.x |
| 操作系统 | Windows / macOS / Linux |
| 浏览器 | Chrome/Edge 90+ (推荐) |

---

## 快速开始

### 1. 安装依赖

```bash
cd health-assistant
npm install
```

### 2. 配置环境变量

项目已预配置好密钥，无需额外配置。如需修改，编辑 `.env.server`：

```bash
# 魔搭AI配置
MODELSCOPE_API_KEY=ms-85ed98e9-1a8e-41e5-8215-ee563559d069
MODELSCOPE_MODEL=deepseek-ai/DeepSeek-V3

# 魔珐星云配置
XMOV_APP_ID=208f4a55794243fbbb76cf63ef2c8d2f
XMOV_APP_SECRET=c66b0b5df2ce49a9821fec36603d2f2e
```

### 3. 启动项目

```bash
npm run dev
```

启动成功后，访问：**http://localhost:5174**

---

## 项目结构

```
health-assistant/
├── src/
│   ├── client/              # 前端 (React + TypeScript)
│   │   ├── components/      # UI组件
│   │   │   ├── Avatar/      # 数字人组件
│   │   │   └── Chat/        # 对话组件
│   │   ├── store/           # Zustand状态管理
│   │   ├── services/        # API服务
│   │   └── App.tsx          # 主应用
│   │
│   ├── server/              # 后端 (Express + TypeScript)
│   │   ├── routes/          # API路由
│   │   ├── services/        # 业务服务
│   │   │   ├── chatService.ts
│   │   │   ├── modelscopeService.ts
│   │   │   └── ragService.ts
│   │   └── app.ts
│   │
│   └── shared/              # 共享类型和工具
│
├── data/knowledge/          # RAG知识库 (JSON格式)
├── public/                  # 静态资源
├── index.html
├── vite.config.ts           # Vite配置 (内置后端服务)
└── package.json
```

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Vite, Zustand, TailwindCSS |
| 后端 | Node.js, Express, TypeScript |
| AI服务 | 魔搭社区 (DeepSeek-V3) |
| RAG | 向量嵌入 + 内存存储 |
| 具身驱动 | 魔珐星云SDK v0.1.0-alpha.45 |

---

## 使用说明

### 对话操作
1. **文字输入** - 在输入框输入问题，点击发送
2. **语音输入** - 点击麦克风按钮，说话后自动转文字
3. **新对话** - 点击右上角"新对话"按钮清空历史

### 快捷咨询
点击右侧快捷按钮开始：
- 症状咨询
- 营养建议
- 运动指导
- 心理支持

---

## API接口

### POST /api/chat/send
普通对话请求

### POST /api/chat/stream
流式对话（SSE）

### GET /health
健康检查

---

## 常见问题

**Q: 数字人不显示？**
A: 检查网络连接，确保能访问 `media.youyan.xyz`

**Q: AI回复慢？**
A: 首次对话需要加载知识库，约10-15秒，后续会更快

**Q: 端口被占用？**
A: Vite会自动切换到可用端口（如5174、5175）

---

## 开发说明

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 许可证

MIT
