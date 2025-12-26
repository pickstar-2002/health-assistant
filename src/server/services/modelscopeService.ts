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
    // 魔搭API密钥（硬编码）
    this.apiKey = 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069';
    // 使用 Qwen 模型（魔搭平台支持）
    this.model = process.env.MODELSCOPE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    console.log('[ModelScope] API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('[ModelScope] Model:', this.model);
  }

  async chat(options: ChatStreamOptions): Promise<string> {
    try {
      const requestBody = {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      };

      console.log('[ModelScope] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('[ModelScope] API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'AI服务调用失败');
    }
  }

  async *chatStream(options: ChatStreamOptions): AsyncGenerator<string, void, unknown> {
    try {
      const requestBody = {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true
      };

      console.log('[ModelScope] Stream request:', this.model);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
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
              const delta = parsed.choices[0]?.delta;

              if (delta?.content) {
                yield delta.content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[ModelScope] Stream Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'AI流式服务调用失败');
    }
  }
}

export default new ModelScopeService();
