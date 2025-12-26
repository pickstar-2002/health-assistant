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
  sources?: Array<{
    id: string;
    topic: string;
    category: string;
    score: number;
  }>;
  isEmergency?: boolean;
  error?: string;
}

export interface KnowledgeSource {
  id: string;
  topic: string;
  category: string;
  score: number;
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    console.log('[ChatService] Sending message:', request.message);
    const response = await axios.post(`${API_BASE}/chat/send`, request);
    console.log('[ChatService] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[ChatService] Error:', error);
    return {
      success: false,
      error: error.response?.data?.error || '网络请求失败'
    };
  }
}

export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: (sources?: KnowledgeSource[]) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('[ChatService Stream] Starting stream request:', request.message);

    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    console.log('[ChatService Stream] Response status:', response.status);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;
    let completed = false;
    let sources: KnowledgeSource[] | undefined;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[ChatService Stream] Stream done, total chunks:', chunkCount);
        if (!completed) {
          completed = true;
          onComplete(sources);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          console.log('[ChatService Stream] Received data:', data);

          try {
            const parsed = JSON.parse(data);
            console.log('[ChatService Stream] Parsed:', parsed);

            if (parsed.type === 'content') {
              chunkCount++;
              console.log(`[ChatService Stream] Chunk ${chunkCount}:`, parsed.data);
              onChunk(parsed.data);
            } else if (parsed.type === 'sources') {
              console.log('[ChatService Stream] Received sources:', parsed.data);
              sources = parsed.data;
            } else if (parsed.type === 'end') {
              console.log('[ChatService Stream] Received end event');
              if (!completed) {
                completed = true;
                onComplete(sources);
              }
              return;
            } else if (parsed.type === 'error') {
              console.error('[ChatService Stream] Error event:', parsed.data);
              onError(parsed.data);
              return;
            } else if (parsed.type === 'start') {
              console.log('[ChatService Stream] Stream started');
            }
          } catch (e) {
            console.error('[ChatService Stream] Parse error:', e, 'data:', data);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[ChatService Stream] Error:', error);
    onError(error.message || '流式请求失败');
  }
}

export default {
  sendMessage,
  sendMessageStream
};
