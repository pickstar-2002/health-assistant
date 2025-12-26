import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 原生Vite插件集成后端
function backendPlugin() {
  return {
    name: 'backend-server',
    async configureServer(server: any) {
      console.log('[Vite] 配置后端服务器...')

      // 导入 RAG 服务并初始化
      const ragService = (await import('./src/server/services/ragService.ts')).default
      console.log('[Vite] 开始加载 RAG 知识库...')
      await ragService.initialize()
      console.log('[Vite] RAG 知识库加载完成!')

      // 导入 app
      const app = (await import('./src/server/app.ts')).default

      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api') || req.url === '/health') {
          app(req, res, next)
        } else {
          next()
        }
      })

      console.log('[Vite] 后端服务器配置完成')
    }
  }
}

export default defineConfig({
  plugins: [react(), backendPlugin()],
  server: {
    port: 5173,
    host: true
  }
})
