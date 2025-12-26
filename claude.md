# 健康咨询助手 - 开发文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 健康咨询助手 |
| 赛道 | 企业AI服务专家 |
| 文档版本 | v1.0 |
| 创建日期 | 2025-12-25 |
| 开发周期 | 14天 |

---

## 目录

1. [项目进度](#项目进度)
2. [项目简介](#项目简介)
3. [技术栈](#技术栈)
4. [技术架构](#技术架构)
5. [目录结构](#目录结构)
6. [环境配置](#环境配置)
7. [后端开发](#后端开发)
8. [前端开发](#前端开发)
9. [知识库构建](#知识库构建)
10. [部署说明](#部署说明)
11. [API接口文档](#api接口文档)

---

## 项目进度

### 已完成 ✅

| 任务 | 状态 | 说明 |
|------|------|------|
| 项目结构重组 | ✅ | 统一项目目录 (client/server/shared) |
| 配置文件 | ✅ | package.json, tsconfig.json, vite.config.ts |
| 前端代码 | ✅ | React + TypeScript 组件和服务 |
| 后端代码 | ✅ | Express + TypeScript 路由和服务 |
| SDK控制器 | ✅ | AvatarController.ts |
| 数字人容器 | ✅ | AvatarContainer.tsx |
| 状态管理 | ✅ | chatStore.ts (Zustand) |
| 对话服务 | ✅ | chatService.ts (前后端) |
| 魔搭AI服务 | ✅ | modelscopeService.ts |
| RAG服务 | ✅ | ragService.ts (内存存储版) |
| 知识库数据 | ✅ | symptoms.json, nutrition.json |

### 待完成 📋

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 安装依赖 | P0 | npm install |
| 配置API密钥 | P0 | .env.server 中填入魔搭、OpenAI API |
| 测试启动 | P1 | npm run dev |
| 扩展知识库 | P2 | exercise, mental, emergency |
| Pinecone集成 | P2 | 替换内存存储 |

---

## 项目简介

### 项目描述

基于魔珐星云具身驱动SDK构建的健康咨询助手，通过3D数字人提供7×24小时的健康咨询服务。

### 核心功能

| 模块 | 功能描述 |
|------|----------|
| 症状咨询 | 收集症状信息，提供初步健康建议 |
| 营养咨询 | 提供个性化饮食和营养建议 |
| 运动指导 | 推荐合适的运动和健身计划 |
| 心理支持 | 提供心理健康建议和情绪疏导 |
| 健康档案 | 记录用户健康信息和咨询历史 |

### 技术亮点

- 魔珐星云3D数字人驱动
- 魔搭社区AI大模型接入
- RAG知识库增强
- 流式对话响应
- 语音/文字双模态交互

---

## 技术栈

### 前端技术栈

```yaml
框架: React 18.x + TypeScript
构建工具: Vite 5.x
状态管理: Zustand
样式方案: TailwindCSS
HTTP客户端: Axios
语音识别: Web Speech API
其他:
  - react-use: React Hooks 工具库
  - dayjs: 日期处理
```

### 后端技术栈

```yaml
运行环境: Node.js 18.x
框架: Express + TypeScript
AI服务: 魔搭社区 (ModelScope)
向量数据库: Pinecone
嵌入模型: text-embedding-ada-002
其他:
  - cors: 跨域处理
  - dotenv: 环境变量
  - multer: 文件上传
```

### 具身驱动SDK

```yaml
SDK名称: 魔珐星云具身驱动SDK
版本: 0.1.0-alpha.45
接入方式: JavaScript CDN
App ID: b2ae7ce13910456ea8712fc7776962e2
App Secret: 7d11cc8963c64cac89c4d337aba10d8d
```

---

## 技术架构

### 系统架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                          客户端层 (Browser)                         │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  React UI    │  │  星云SDK层   │  │  状态管理    │             │
│  │              │  │              │  │  (Zustand)   │             │
│  │ - 对话界面   │◄─┤ - 3D数字人   │◄─┤              │             │
│  │ - 语音输入   │  │ - 语音合成   │  │ - 对话历史   │             │
│  │ - Widget展示 │  │ - 动作控制   │  │ - 用户状态   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/WebSocket
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                          服务端层 (Node.js)                         │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  API服务     │  │  AI服务      │  │  RAG服务     │             │
│  │  (Express)   │  │  (魔搭)      │  │  (Pinecone)  │             │
│  │              │  │              │  │              │             │
│  │ - /chat      │─►│ - 对话生成   │◄─│ - 知识检索   │             │
│  │ - /voice     │  │ - 流式响应   │  │ - 向量匹配   │             │
│  │ - /profile   │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                          数据存储层                                 │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Pinecone    │  │  文件系统     │  │  内存缓存     │             │
│  │  (向量数据库) │  │  (知识库)    │  │  (会话状态)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

### 数据流图

```
用户输入
    │
    ▼
┌─────────┐
│ 前端UI  │
└────┬────┘
     │ 1. 发送消息到后端
     ▼
┌─────────────┐
│  后端API    │
└────┬────────┘
     │ 2. 检索相关知识
     ▼
┌─────────────┐     ┌──────────────┐
│  RAG服务    │────►│ Pinecone     │
└────┬────────┘     └──────────────┘
     │ 3. 构建提示词
     ▼
┌─────────────┐     ┌──────────────┐
│  魔搭AI     │────►│ 大模型       │
└────┬────────┘     └──────────────┘
     │ 4. 流式返回响应
     ▼
┌─────────────┐
│  前端UI     │───► 星云SDK驱动数字人说话
└─────────────┘
```

---

## 目录结构

```
health-assistant/
├── src/                         # 源代码目录
│   ├── client/                  # 前端代码 (React + TypeScript)
│   │   ├── components/
│   │   │   ├── Avatar/
│   │   │   │   ├── AvatarController.ts      # SDK控制器
│   │   │   │   └── AvatarContainer.tsx      # 数字人容器
│   │   │   └── Chat/
│   │   │       └── ChatInput.tsx            # 输入框组件
│   │   ├── store/
│   │   │   └── chatStore.ts                  # 对话状态管理
│   │   ├── services/
│   │   │   └── chatService.ts                # 前端API服务
│   │   ├── App.tsx                           # 主应用组件
│   │   └── main.tsx                          # 入口文件
│   │
│   ├── server/                 # 后端代码 (Node.js + TypeScript)
│   │   ├── routes/
│   │   │   ├── chat.routes.ts                # 对话路由
│   │   │   └── profile.routes.ts             # 档案路由
│   │   ├── services/
│   │   │   ├── chatService.ts                # 对话处理服务
│   │   │   ├── modelscopeService.ts          # 魔搭AI服务
│   │   │   └── ragService.ts                 # RAG检索服务
│   │   ├── middleware/
│   │   │   └── error.middleware.ts           # 错误处理
│   │   └── app.ts                            # Express应用入口
│   │
│   └── shared/                 # 共享代码
│       ├── types/           # 共享类型定义
│       └── utils/           # 共享工具函数
│
├── data/                        # 知识库数据
│   └── knowledge/
│       ├── symptoms.json                   # 症状知识
│       └── nutrition.json                  # 营养知识
│
├── public/                      # 静态资源
├── package.json                 # 项目配置
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置 (前端)
├── tsconfig.server.json        # TypeScript配置 (后端)
├── .env                         # 前端环境变量
├── .env.server                  # 后端环境变量
└── README.md                    # 项目说明
```

### 目录说明

| 目录 | 说明 |
|------|------|
| `src/client/` | React前端代码 |
| `src/server/` | Express后端代码 |
| `src/shared/` | 前后端共享代码 |
| `data/knowledge/` | RAG知识库JSON数据 |
| `public/` | 前端静态资源 |
│   │   │   └── index.ts
│   │   ├── utils/              # 工具函数
│   │   │   ├── constants.ts                    # 常量定义
│   │   │   └── helpers.ts
│   │   ├── App.tsx              # 根组件
│   │   ├── main.tsx             # 入口文件
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── routes/             # 路由
│   │   │   ├── chat.routes.ts              # 对话路由
│   │   │   ├── profile.routes.ts           # 档案路由
│   │   │   └── index.ts
│   │   ├── services/           # 服务层
│   │   │   ├── chatService.ts             # 对话处理服务
│   │   │   ├── ragService.ts              # RAG检索服务
│   │   │   ├── modelscopeService.ts       # 魔搭AI服务
│   │   │   └── embeddingService.ts        # 向量嵌入服务
│   │   ├── controllers/        # 控制器
│   │   │   ├── chatController.ts
│   │   │   └── profileController.ts
│   │   ├── middleware/         # 中间件
│   │   │   ├── cors.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── models/             # 数据模型
│   │   │   ├── chat.model.ts
│   │   │   └── profile.model.ts
│   │   ├── types/              # 类型定义
│   │   │   └── index.ts
│   │   ├── config/             # 配置
│   │   │   ├── avatar.config.ts            # SDK配置
│   │   │   └── index.ts
│   │   ├── utils/              # 工具函数
│   │   │   └── helpers.ts
│   │   └── app.ts              # Express应用
│   ├── data/                   # 数据文件
│   │   └── knowledge/          # 知识库数据
│   │       ├── symptoms.json               # 症状知识
│   │       ├── nutrition.json              # 营养知识
│   │       ├── exercise.json               # 运动知识
│   │       ├── mental.json                 # 心理健康
│   │       └── emergency.json              # 急救知识
│   ├── scripts/                # 脚本
│   │   └── import-knowledge.ts            # 知识库导入
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/                        # 文档
│   └── API.md                   # API文档
│
└── README.md                    # 项目说明
```

---

## 环境配置

### 前端环境配置

```bash
# 创建前端项目
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# 安装依赖
npm install zustand axios @tanstack/react-query
npm install dayjs react-use
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**frontend/vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

**frontend/.env**
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ID=b2ae7ce13910456ea8712fc7776962e2
VITE_APP_SECRET=7d11cc8963c64cac89c4d337aba10d8d
```

### 后端环境配置

```bash
# 创建后端项目
mkdir backend && cd backend
npm init -y

# 安装依赖
npm install express cors dotenv
npm install @modelscope/sdk
npm install @pinecone-database/pinecone
npm install openai
npm install -D typescript @types/node @types/express tsx nodemon
```

**backend/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

**backend/.env**
```bash
# 服务器配置
PORT=3001
NODE_ENV=development

# 魔搭AI配置
MODELSCOPE_API_KEY=your_modelscope_api_key
MODELSCOPE_MODEL=qwen-turbo

# Pinecone配置
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=health-knowledge

# OpenAI Embedding配置
OPENAI_API_KEY=your_openai_api_key

# 魔珐星云配置
XMOV_APP_ID=b2ae7ce13910456ea8712fc7776962e2
XMOV_APP_SECRET=7d11cc8963c64cac89c4d337aba10d8d
```

---

## 后端开发

### Express应用入口

**backend/src/app.ts**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 路由
import chatRoutes from './routes/chat.routes';
import profileRoutes from './routes/profile.routes';

// 中间件
import { errorHandler } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// 路由
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### 魔搭AI服务

**backend/src/services/modelscopeService.ts**
```typescript
import axios from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatStreamOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export class ModelScopeService {
  private apiKey: string;
  private baseURL: string = 'https://api-inference.modelscope.cn/v1';
  private model: string;

  constructor() {
    this.apiKey = process.env.MODELSCOPE_API_KEY || '';
    this.model = process.env.MODELSCOPE_MODEL || 'qwen-turbo';
  }

  /**
   * 普通对话
   */
  async chat(options: ChatStreamOptions): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('ModelScope API Error:', error);
      throw new Error('AI服务调用失败');
    }
  }

  /**
   * 流式对话（返回AsyncIterator）
   */
  async *chatStream(options: ChatStreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      const stream = response.data;

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('ModelScope Stream Error:', error);
      throw new Error('AI流式服务调用失败');
    }
  }
}

export default new ModelScopeService();
```

### RAG服务

**backend/src/services/ragService.ts**
```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export class RAGService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;
  private namespace: string = 'health-knowledge';

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || ''
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
    this.indexName = process.env.PINECONE_INDEX_NAME || 'health-knowledge';
  }

  /**
   * 生成文本向量
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0].embedding;
  }

  /**
   * 检索相关文档
   */
  async retrieveDocuments(query: string, topK: number = 5): Promise<Document[]> {
    try {
      const queryVector = await this.generateEmbedding(query);

      const index = this.pinecone.index(this.indexName);
      const queryResponse = await index.namespace(this.namespace).query({
        vector: queryVector,
        topK: topK,
        includeMetadata: true
      });

      const documents: Document[] = queryResponse.matches.map((match: any) => ({
        id: match.id,
        content: match.metadata.content || '',
        metadata: match.metadata
      }));

      return documents;
    } catch (error) {
      console.error('RAG检索错误:', error);
      return [];
    }
  }

  /**
   * 构建增强上下文
   */
  async buildRAGContext(query: string): Promise<string> {
    const docs = await this.retrieveDocuments(query, 5);

    if (docs.length === 0) {
      return '';
    }

    let context = '参考知识库内容：\n\n';
    docs.forEach((doc, index) => {
      context += `[${index + 1}] ${doc.content}\n`;
      if (doc.metadata.category) {
        context += `(分类: ${doc.metadata.category})\n`;
      }
      context += '\n';
    });

    return context;
  }

  /**
   * 添加文档到向量数据库
   */
  async addDocuments(documents: Document[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);

      const vectors = await Promise.all(
        documents.map(async (doc) => {
          const embedding = await this.generateEmbedding(doc.content);
          return {
            id: doc.id,
            values: embedding,
            metadata: {
              content: doc.content,
              ...doc.metadata
            }
          };
        })
      );

      await index.namespace(this.namespace).upsert(vectors);
      console.log(`成功添加 ${documents.length} 个文档到知识库`);
    } catch (error) {
      console.error('添加文档错误:', error);
      throw error;
    }
  }
}

export default new RAGService();
```

### 对话服务

**backend/src/services/chatService.ts**
```typescript
import modelscopeService from './modelscopeService';
import ragService from './ragService';

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: any;
}

export interface ChatResponse {
  response: string;
  sources?: string[];
}

export class ChatService {
  private systemPrompt = `你是一个专业的健康咨询助手，名为"健康小助手"。

你的职责：
1. 提供准确的健康咨询建议
2. 解答关于症状、营养、运动、心理健康等问题
3. 识别紧急情况并建议就医
4. 保持专业、友好、关怀的态度

重要原则：
- 不做医学诊断，仅提供参考建议
- 遇到严重症状必须建议及时就医
- 回答要基于专业知识
- 不确定的情况下明确说明
- 保护用户隐私

请用简明易懂的语言回答，避免过多专业术语。`;

  /**
   * 处理对话请求
   */
  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationHistory = [], userProfile } = request;

    // 1. 检索相关知识
    const ragContext = await ragService.buildRAGContext(message);

    // 2. 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.systemPrompt }
    ];

    // 添加RAG上下文
    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`;
    }

    // 添加对话历史
    messages.push(...conversationHistory as any);

    // 添加当前问题
    messages.push({ role: 'user', content: message });

    // 3. 调用AI生成回复
    const response = await modelscopeService.chat({
      messages,
      temperature: 0.7,
      maxTokens: 1000
    });

    return { response };
  }

  /**
   * 流式处理对话请求
   */
  async *processChatStream(request: ChatRequest): AsyncGenerator<string> {
    const { message, conversationHistory = [] } = request;

    // 1. 检索相关知识
    const ragContext = await ragService.buildRAGContext(message);

    // 2. 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.systemPrompt }
    ];

    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`;
    }

    messages.push(...conversationHistory as any);
    messages.push({ role: 'user', content: message });

    // 3. 流式生成回复
    const stream = modelscopeService.chatStream({
      messages,
      temperature: 0.7,
      maxTokens: 1000
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * 检查紧急情况
   */
  checkEmergency(message: string): boolean {
    const emergencyKeywords = [
      '胸痛', '呼吸困难', '昏迷', '大出血',
      '心脏骤停', '严重烧伤', '中毒', '自杀'
    ];

    return emergencyKeywords.some(keyword => message.includes(keyword));
  }
}

export default new ChatService();
```

### 路由控制器

**backend/src/routes/chat.routes.ts**
```typescript
import { Router } from 'express';
import chatService from '../services/chatService';

const router = Router();

/**
 * POST /api/chat/send
 * 发送对话消息
 */
router.post('/send', async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    // 检查紧急情况
    if (chatService.checkEmergency(message)) {
      return res.json({
        success: true,
        isEmergency: true,
        response: '检测到您描述的是紧急医疗情况，请立即拨打120急救电话或前往最近的医院就医！'
      });
    }

    const result = await chatService.processChat({
      message,
      conversationHistory,
      userProfile
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '处理对话时发生错误'
    });
  }
});

/**
 * POST /api/chat/stream
 * 流式对话（SSE）
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    // 设置SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送开始事件
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    // 流式处理
    const stream = chatService.processChatStream({
      message,
      conversationHistory,
      userProfile
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: 'content', data: chunk })}\n\n`);
    }

    // 发送结束事件
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Stream Error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    res.end();
  }
});

export default router;
```

**backend/src/routes/profile.routes.ts**
```typescript
import { Router } from 'express';

const router = Router();

/**
 * GET /api/profile
 * 获取用户档案（示例）
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      age: 30,
      gender: '男',
      height: 175,
      weight: 70,
      fitnessLevel: '初级',
      goal: '保持健康',
      allergies: [],
      chronicDiseases: []
    }
  });
});

/**
 * PUT /api/profile
 * 更新用户档案
 */
router.put('/', (req, res) => {
  const profileData = req.body;

  // TODO: 保存到数据库

  res.json({
    success: true,
    message: '档案更新成功'
  });
});

export default router;
```

---

## 前端开发

### SDK控制器

**frontend/src/components/Avatar/AvatarController.ts**
```typescript
/**
 * 魔珐星云具身驱动SDK控制器
 */

export type AvatarState =
  | 'offline'
  | 'online'
  | 'idle'
  | 'interactive_idle'
  | 'listen'
  | 'think'
  | 'speak';

export interface SpeakOptions {
  text: string;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface AvatarConfig {
  containerId: string;
  appId: string;
  appSecret: string;
  onStateChange?: (state: AvatarState) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  onError?: (error: any) => void;
}

export class AvatarController {
  private sdk: any = null;
  private containerId: string;
  private config: AvatarConfig;
  private currentVoiceState: 'start' | 'end' | null = null;

  constructor(config: AvatarConfig) {
    this.config = config;
    this.containerId = config.containerId;
  }

  /**
   * 初始化SDK
   */
  async initialize(): Promise<void> {
    // 动态加载SDK
    if (!window.XmovAvatar) {
      await this.loadSDK();
    }

    const XmovAvatar = (window as any).XmovAvatar;

    this.sdk = new XmovAvatar({
      containerId: this.containerId,
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

      // Widget事件处理
      onWidgetEvent: (data: any) => {
        console.log('Widget Event:', data);
      },

      // 代理Widget
      proxyWidget: {
        'widget_pic': (data: any) => {
          this.handleImageWidget(data);
        },
        'widget_slideshow': (data: any) => {
          this.handleSlideshowWidget(data);
        }
      },

      // 状态变化回调
      onStateChange: (state: string) => {
        this.config.onStateChange?.(state as AvatarState);
      },

      // 语音状态回调
      onVoiceStateChange: (status: string) => {
        this.currentVoiceState = status as 'start' | 'end';
        if (status === 'start') {
          this.config.onVoiceStart?.();
        } else if (status === 'end') {
          this.config.onVoiceEnd?.();
        }
      },

      // 网络信息
      onNetworkInfo: (info: any) => {
        console.log('Network Info:', info);
      },

      // SDK消息
      onMessage: (message: any) => {
        console.log('SDK Message:', message);
      },

      enableLogger: process.env.NODE_ENV === 'development'
    });

    // 初始化连接
    await this.sdk.init({
      onDownloadProgress: (progress: number) => {
        console.log(`Loading progress: ${progress}%`);
      },
      onError: (error: any) => {
        this.config.onError?.(error);
      },
      onClose: () => {
        console.log('Connection closed');
      }
    });

    console.log('Avatar SDK initialized');
  }

  /**
   * 加载SDK脚本
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * 设置待机状态
   */
  setIdle(): void {
    this.sdk?.idle();
  }

  /**
   * 设置互动待机状态
   */
  setInteractiveIdle(): void {
    this.sdk?.interactive_idle();
  }

  /**
   * 设置倾听状态
   */
  setListen(): void {
    this.sdk?.listen();
  }

  /**
   * 设置思考状态
   */
  setThink(): void {
    this.sdk?.think();
  }

  /**
   * 说话
   */
  speak(options: SpeakOptions): void {
    const { text, isStart = true, isEnd = true } = options;
    this.sdk?.speak(text, isStart, isEnd);
  }

  /**
   * 流式说话
   */
  async speakStream(textStream: AsyncIterable<string> | Generator<string>): Promise<void> {
    let isFirst = true;
    let buffer = '';

    for await (const chunk of textStream) {
      buffer += chunk;

      // 积累一定长度后发送
      if (buffer.length > 15) {
        this.speak({ text: buffer, isStart: isFirst, isEnd: false });
        buffer = '';
        isFirst = false;
      }
    }

    // 发送剩余内容
    if (buffer) {
      this.speak({ text: buffer, isStart: isFirst, isEnd: true });
    }
  }

  /**
   * 带动作说话
   */
  speakWithAction(text: string, action: string): void {
    const ssml = `<speak>
      <ue4event>
        <type>ka</type>
        <data><action_semantic>${action}</action_semantic></data>
      </ue4event>
      ${text}
    </speak>`;

    this.speak({ text: ssml });
  }

  /**
   * 进入离线模式
   */
  setOfflineMode(): void {
    this.sdk?.offlineMode();
  }

  /**
   * 进入在线模式
   */
  setOnlineMode(): void {
    this.sdk?.onlineMode();
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.sdk?.setVolume(volume);
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.sdk?.destroy();
    this.sdk = null;
  }

  /**
   * 处理图片Widget
   */
  private handleImageWidget(data: any): void {
    // TODO: 实现图片Widget展示
    console.log('Image Widget:', data);
  }

  /**
   * 处理轮播图Widget
   */
  private handleSlideshowWidget(data: any): void {
    // TODO: 实现轮播图Widget展示
    console.log('Slideshow Widget:', data);
  }
}

export default AvatarController;
```

### 数字人容器组件

**frontend/src/components/Avatar/AvatarContainer.tsx**
```typescript
import React, { useEffect, useRef, useState } from 'react';
import { AvatarController, AvatarState } from './AvatarController';

interface AvatarContainerProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
}

export const AvatarContainer: React.FC<AvatarContainerProps> = ({
  onSpeakingStart,
  onSpeakingEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const [state, setState] = useState<AvatarState>('offline');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new AvatarController({
      containerId: 'avatar-container',
      appId: import.meta.env.VITE_APP_ID,
      appSecret: import.meta.env.VITE_APP_SECRET,
      onStateChange: (newState) => {
        setState(newState);
      },
      onVoiceStart: () => {
        onSpeakingStart?.();
      },
      onVoiceEnd: () => {
        onSpeakingEnd?.();
      },
      onError: (error) => {
        console.error('Avatar Error:', error);
      }
    });

    controller.initialize().then(() => {
      controllerRef.current = controller;
      setIsInitialized(true);

      // 主动问候
      setTimeout(() => {
        controller.speakWithAction(
          '您好！我是您的健康咨询小助手，请问有什么可以帮您？',
          'Welcome'
        );
      }, 2000);
    }).catch((error) => {
      console.error('Failed to initialize avatar:', error);
    });

    return () => {
      controller.destroy();
    };
  }, []);

  return (
    <div className="relative">
      {/* 数字人容器 */}
      <div
        id="avatar-container"
        ref={containerRef}
        className="w-full h-96 bg-gradient-to-b from-blue-100 to-blue-200 rounded-t-2xl"
      />

      {/* 状态指示 */}
      <div className="bg-white px-6 py-3 rounded-b-2xl border-t flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <StateIndicator state={state} />
          <span className="text-sm text-gray-600">
            {getStateLabel(state)}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {!isInitialized ? '初始化中...' : '魔珐星云驱动'}
        </div>
      </div>
    </div>
  );
};

/**
 * 状态指示器
 */
const StateIndicator: React.FC<{ state: AvatarState }> = ({ state }) => {
  const getColor = () => {
    switch (state) {
      case 'speak': return 'bg-green-500 animate-pulse';
      case 'listen': return 'bg-blue-500 animate-pulse';
      case 'think': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-green-400';
    }
  };

  return (
    <div className={`w-3 h-3 rounded-full ${getColor()}`} />
  );
};

/**
 * 状态标签
 */
const getStateLabel = (state: AvatarState): string => {
  const labels: Record<AvatarState, string> = {
    offline: '离线',
    online: '在线',
    idle: '待机',
    interactive_idle: '待机互动',
    listen: '倾听中',
    think: '思考中',
    speak: '说话中'
  };
  return labels[state] || state;
};

export default AvatarContainer;
```

### 对话状态管理

**frontend/src/store/chatStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEmergency?: boolean;
}

interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentResponse: string;

  addMessage: (message: Message) => void;
  setProcessing: (processing: boolean) => void;
  setCurrentResponse: (response: string) => void;
  appendCurrentResponse: (text: string) => void;
  clearMessages: () => void;
  getConversationHistory: () => Array<{ role: string; content: string }>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isProcessing: false,
      currentResponse: '',

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),

      setProcessing: (processing) =>
        set({ isProcessing: processing }),

      setCurrentResponse: (response) =>
        set({ currentResponse: response }),

      appendCurrentResponse: (text) =>
        set((state) => ({
          currentResponse: state.currentResponse + text
        })),

      clearMessages: () =>
        set({ messages: [], currentResponse: '' }),

      getConversationHistory: () => {
        return get().messages.map(m => ({
          role: m.role,
          content: m.content
        }));
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages
      })
    }
  )
);
```

### 对话服务

**frontend/src/services/chatService.ts**
```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: any;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  isEmergency?: boolean;
  error?: string;
}

/**
 * 发送对话消息
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await axios.post(`${API_BASE}/chat/send`, request);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '网络请求失败'
    };
  }
}

/**
 * 流式发送对话消息（SSE）
 */
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content') {
              onChunk(parsed.data);
            } else if (parsed.type === 'end') {
              onComplete();
              return;
            } else if (parsed.type === 'error') {
              onError(parsed.data);
              return;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error: any) {
    onError(error.message || '流式请求失败');
  }
}

export default {
  sendMessage,
  sendMessageStream
};
```

### 对话输入组件

**frontend/src/components/Chat/ChatInput.tsx**
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isProcessing = useChatStore((state) => state.isProcessing);

  // 发送消息
  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSend(input);
      setInput('');
    }
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // 语音输入
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="flex items-center space-x-4">
        {/* 语音输入按钮 */}
        <button
          onClick={isRecording ? stopVoiceInput : startVoiceInput}
          className={`p-4 rounded-xl transition ${
            isRecording
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          disabled={isProcessing}
        >
          {isRecording ? '🛑' : '🎤'}
        </button>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="请输入您的健康问题..."
          className="flex-1 px-6 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          disabled={isProcessing || disabled}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          className={`px-8 py-4 rounded-xl font-medium transition ${
            isProcessing || !input.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={isProcessing || !input.trim()}
        >
          {isProcessing ? '处理中...' : '发送'}
        </button>
      </div>

      {/* 提示文字 */}
      <div className="mt-2 text-center text-sm text-gray-400">
        {isRecording ? '正在录音...' : '按 Enter 发送，或点击麦克风语音输入'}
      </div>
    </div>
  );
};

export default ChatInput;
```

### 主应用组件

**frontend/src/App.tsx**
```typescript
import React, { useEffect, useRef, useState } from 'react';
import AvatarContainer from './components/Avatar/AvatarContainer';
import { ChatInput } from './components/Chat/ChatInput';
import { useChatStore } from './store/chatStore';
import { sendMessageStream } from './services/chatService';
import { AvatarController } from './components/Avatar/AvatarController';

function App() {
  const controllerRef = useRef<AvatarController | null>(null);
  const [userProfile, setUserProfile] = useState({
    age: 30,
    gender: '男',
    height: 175,
    weight: 70
  });

  const {
    messages,
    addMessage,
    setProcessing,
    currentResponse,
    setCurrentResponse,
    appendCurrentResponse,
    getConversationHistory
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // 处理消息发送
  const handleSendMessage = async (text: string) => {
    // 添加用户消息
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    setProcessing(true);
    setCurrentResponse('');

    // 数字人进入倾听状态
    controllerRef.current?.setListen();

    // 获取对话历史
    const history = getConversationHistory();

    // 流式对话
    await sendMessageStream(
      {
        message: text,
        conversationHistory: history,
        userProfile
      },
      // onChunk
      (chunk) => {
        appendCurrentResponse(chunk);
      },
      // onComplete
      () => {
        // 添加助手消息
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: currentResponse,
          timestamp: Date.now()
        });

        // 数字人说话
        controllerRef.current?.speakStream(
          (async function* () {
            for (const char of currentResponse) {
              yield char;
            }
          })()
        );

        setCurrentResponse('');
        setProcessing(false);
      },
      // onError
      (error) => {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: Date.now()
        });
        setCurrentResponse('');
        setProcessing(false);
        controllerRef.current?.setIdle();
      }
    );

    // 数字人进入思考状态
    controllerRef.current?.setThink();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏥</span>
            <h1 className="text-xl font-bold text-gray-800">健康咨询助手</h1>
          </div>
          <div className="flex space-x-4">
            <button className="text-sm text-gray-600 hover:text-blue-600">设置</button>
            <button className="text-sm text-gray-600 hover:text-blue-600">帮助</button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：数字人和对话 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 数字人 */}
            <AvatarContainer
              onSpeakingStart={() => console.log('开始说话')}
              onSpeakingEnd={() => console.log('结束说话')}
            />

            {/* 对话记录 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">对话记录</h2>

              <div className="h-80 overflow-y-auto space-y-4 p-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-5 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <span className="text-xs opacity-60 mt-2 block">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 当前响应（流式） */}
                {currentResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-md px-5 py-3 rounded-2xl bg-gray-100 text-gray-800">
                      <p className="text-sm leading-relaxed">
                        {currentResponse}
                        <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 输入框 */}
            <ChatInput onSend={handleSendMessage} />
          </div>

          {/* 右侧：信息面板 */}
          <div className="space-y-6">
            {/* 用户档案 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">我的档案</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">年龄</span>
                  <span className="font-medium">{userProfile.age}岁</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">性别</span>
                  <span className="font-medium">{userProfile.gender}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">身高</span>
                  <span className="font-medium">{userProfile.height}cm</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">体重</span>
                  <span className="font-medium">{userProfile.weight}kg</span>
                </div>
              </div>
            </div>

            {/* 快捷功能 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷咨询</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendMessage('我最近总是感觉头疼')}
                  className="p-3 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition"
                >
                  症状咨询
                </button>
                <button
                  onClick={() => handleSendMessage('请给我一些饮食建议')}
                  className="p-3 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100 transition"
                >
                  营养建议
                </button>
                <button
                  onClick={() => handleSendMessage('推荐一些适合我的运动')}
                  className="p-3 bg-orange-50 text-orange-600 rounded-lg text-sm hover:bg-orange-100 transition"
                >
                  运动指导
                </button>
                <button
                  onClick={() => handleSendMessage('我感觉最近压力很大')}
                  className="p-3 bg-purple-50 text-purple-600 rounded-lg text-sm hover:bg-purple-100 transition"
                >
                  心理支持
                </button>
              </div>
            </div>

            {/* 紧急联系 */}
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-2">紧急联系</h3>
              <p className="text-sm text-red-600 mb-4">如遇紧急情况，请立即：</p>
              <button className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition">
                拨打 120
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```

---

## 知识库构建

### 知识库数据格式

**backend/src/data/knowledge/symptoms.json**
```json
[
  {
    "id": "symptom_001",
    "category": "symptom",
    "symptom": "头痛",
    "description": "头部疼痛的常见症状",
    "possible_causes": ["紧张性头痛", "偏头痛", "颈椎病", "高血压"],
    "common_symptoms": ["头部胀痛", "跳痛", "隐痛"],
    "recommendations": [
      "注意休息，保证充足睡眠",
      "避免长时间用眼",
      "适当进行颈部放松运动",
      "如持续严重建议就医检查"
    ],
    "when_to_see_doctor": [
      "头痛剧烈且突然发生",
      "伴有发热、颈部僵硬",
      "伴有视力模糊或恶心呕吐",
      "头部外伤后出现头痛"
    ]
  },
  {
    "id": "symptom_002",
    "category": "symptom",
    "symptom": "失眠",
    "description": "难以入睡或睡眠质量差",
    "possible_causes": ["压力过大", "焦虑抑郁", "作息不规律", "环境因素"],
    "recommendations": [
      "建立规律的作息时间",
      "睡前避免使用电子设备",
      "保持卧室安静、黑暗、凉爽",
      "尝试放松训练或冥想"
    ],
    "when_to_see_doctor": [
      "失眠持续超过两周",
      "严重影响日常生活",
      "伴有其他身体或心理症状"
    ]
  }
]
```

**backend/src/data/knowledge/nutrition.json**
```json
[
  {
    "id": "nutrition_001",
    "category": "nutrition",
    "nutrient": "蛋白质",
    "function": "构成人体组织、维持生理功能、提供能量",
    "daily_intake": "0.8-1.2克/公斤体重",
    "rich_sources": ["鸡蛋", "鱼肉", "瘦肉", "豆制品", "牛奶"],
    "deficiency_symptoms": ["肌肉流失", "免疫力下降", "水肿"],
    "groups_need_more": ["儿童青少年", "孕妇", "老年人", "运动员"]
  },
  {
    "id": "nutrition_002",
    "category": "nutrition",
    "nutrient": "维生素C",
    "function": "抗氧化、促进胶原蛋白合成、增强免疫力",
    "daily_intake": "100毫克/天",
    "rich_sources": ["柑橘类水果", "猕猴桃", "草莓", "青椒", "西兰花"],
    "deficiency_symptoms": ["牙龈出血", "免疫力下降", "疲劳"],
    "tips": ["维C易溶于水，建议生吃或短时间烹饪"]
  }
]
```

### 知识库导入脚本

**backend/src/scripts/import-knowledge.ts**
```typescript
import ragService from '../services/ragService';
import * as fs from 'fs';
import * as path from 'path';

async function importKnowledge() {
  const knowledgeDir = path.join(__dirname, '../data/knowledge');
  const files = ['symptoms.json', 'nutrition.json', 'exercise.json', 'mental.json', 'emergency.json'];

  const allDocuments: Array<{ id: string; content: string; metadata: any }> = [];

  for (const file of files) {
    const filePath = path.join(knowledgeDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在，跳过: ${file}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const item of data) {
      const content = `
类别：${item.category || path.basename(file, '.json')}
${JSON.stringify(item, null, 2)}
      `.trim();

      allDocuments.push({
        id: item.id || `${path.basename(file, '.json')}_${Date.now()}`,
        content,
        metadata: {
          category: item.category || path.basename(file, '.json'),
          source: file
        }
      });
    }

    console.log(`已加载 ${data.length} 条数据从 ${file}`);
  }

  // 批量导入
  const batchSize = 100;
  for (let i = 0; i < allDocuments.length; i += batchSize) {
    const batch = allDocuments.slice(i, i + batchSize);
    await ragService.addDocuments(batch);
    console.log(`已导入 ${Math.min(i + batchSize, allDocuments.length)}/${allDocuments.length} 条文档`);
  }

  console.log('知识库导入完成！');
}

importKnowledge().catch(console.error);
```

---

## API接口文档

## 对话接口

#### POST /api/chat/send

发送对话消息（非流式）

**请求体**
```json
{
  "message": "我最近总是头疼",
  "conversationHistory": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "您好！"}
  ],
  "userProfile": {
    "age": 30,
    "gender": "男"
  }
}
```

**响应**
```json
{
  "success": true,
  "response": "根据您的描述，头痛可能由多种原因导致...",
  "isEmergency": false
}
```

#### POST /api/chat/stream

流式对话（SSE）

**请求体**
```json
{
  "message": "请给我一些饮食建议"
}
```

**响应流**
```
data: {"type":"start"}

data: {"type":"content","data":"根据"}

data: {"type":"content","data":"您的"}

data: {"type":"content","data":"情况"}

...

data: {"type":"end"}
```

### 档案接口

#### GET /api/profile

获取用户档案

**响应**
```json
{
  "success": true,
  "data": {
    "age": 30,
    "gender": "男",
    "height": 175,
    "weight": 70
  }
}
```

#### PUT /api/profile

更新用户档案

**请求体**
```json
{
  "age": 31,
  "weight": 68
}
```

---

## 附录

### SDK配置

| 配置项 | 值 |
|--------|-----|
| SDK版本 | 0.1.0-alpha.45 |
| CDN地址 | https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js |
| App ID | b2ae7ce13910456ea8712fc7776962e2 |
| App Secret | 7d11cc8963c64cac89c4d337aba10d8d |
| Gateway | https://nebula-agent.xingyun3d.com/user/v1/ttsa/session |

### 环境变量清单

| 变量名 | 说明 | 必需 |
|--------|------|------|
| MODELSCOPE_API_KEY | 魔搭社区API密钥 | 是 |
| PINECONE_API_KEY | Pinecone API密钥 | 是 |
| OPENAI_API_KEY | OpenAI API密钥（用于Embedding） | 是 |
| VITE_APP_ID | 魔珐星云App ID | 是 |
| VITE_APP_SECRET | 魔珐星云App Secret | 是 |

---

*文档版本: v1.0 | 最后更新: 2025-12-25*
