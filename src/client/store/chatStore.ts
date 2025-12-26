import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KnowledgeSource {
  id: string;
  topic: string;
  category: string;
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isEmergency?: boolean;
  sources?: KnowledgeSource[];
}

interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentResponse: string;
  currentSources: KnowledgeSource[];

  addMessage: (message: Message) => void;
  setProcessing: (processing: boolean) => void;
  setCurrentResponse: (response: string) => void;
  appendCurrentResponse: (text: string) => void;
  setCurrentSources: (sources: KnowledgeSource[]) => void;
  clearMessages: () => void;
  getConversationHistory: () => Array<{ role: string; content: string }>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isProcessing: false,
      currentResponse: '',
      currentSources: [],

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

      setCurrentSources: (sources) =>
        set({ currentSources: sources }),

      clearMessages: () =>
        set({ messages: [], currentResponse: '', currentSources: [] }),

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
