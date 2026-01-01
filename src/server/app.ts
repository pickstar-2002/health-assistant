import express from 'express';
import cors from 'cors';

import chatRoutes from './routes/chat.routes';
import profileRoutes from './routes/profile.routes';
import memoryRoutes from './routes/memory.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import { errorHandler, loggerMiddleware } from './middleware/error.middleware';
import ragService from './services/ragService';

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/knowledge', knowledgeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// 初始化RAG知识库
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    console.log('[Server] Initializing RAG knowledge base...');
    await ragService.initialize();
    console.log('[Server] RAG knowledge base loaded');
    initialized = true;
  }
}

app.use(async (req, res, next) => {
  await ensureInitialized();
  next();
});

export default app;
