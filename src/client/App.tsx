import React, { useEffect, useRef, useState } from 'react';
import AvatarContainer from './components/Avatar/AvatarContainer';
import { ChatInput } from './components/Chat/ChatInput';
import { ThinkingProcess } from './components/Chat/ThinkingProcess';
import { FormattedMessage } from './components/Chat/FormattedMessage';
import { useChatStore } from './store/chatStore';
import { sendMessageStream } from './services/chatService';
import { AvatarController } from './components/Avatar/AvatarController';
import type { KnowledgeSource } from './store/chatStore';

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
    setCurrentSources,
    getConversationHistory,
    isProcessing,
    clearMessages
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentResponseRef = useRef<string>('');
  const currentSourcesRef = useRef<KnowledgeSource[]>([]);

  // 同步 currentResponse 到 ref
  useEffect(() => {
    currentResponseRef.current = currentResponse;
  }, [currentResponse]);

  useEffect(() => {
    currentSourcesRef.current = currentSourcesRef.current;
  }, [currentResponseRef]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleNewChat = () => {
    if (isProcessing) return;
    clearMessages();
    controllerRef.current?.setIdle();
  };

  const handleSendMessage = async (text: string) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    });

    setProcessing(true);
    setCurrentResponse('');
    setCurrentSources([]);

    controllerRef.current?.setListen();

    const history = getConversationHistory();

    await sendMessageStream(
      {
        message: text,
        conversationHistory: history,
        userProfile
      },
      (chunk) => {
        appendCurrentResponse(chunk);
      },
      (sources) => {
        const finalResponse = currentResponseRef.current;
        console.log('[App] onComplete, finalResponse:', finalResponse);
        console.log('[App] Sources:', sources);

        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalResponse,
          timestamp: Date.now(),
          sources: sources || undefined
        });

        // 数字人分段播放完整文本
        console.log('[App] Attempting to speak full text:', finalResponse);

        if (controllerRef.current) {
          try {
            setTimeout(async () => {
              await controllerRef.current?.speakFullText(finalResponse);
              console.log('[App] Speak full text completed');
            }, 100);
          } catch (err) {
            console.warn('[App] Speak error:', err);
          }
        } else {
          console.warn('[App] controllerRef.current is null, cannot speak');
        }

        setCurrentResponse('');
        currentResponseRef.current = '';
        setCurrentSources([]);
        currentSourcesRef.current = [];
        setProcessing(false);
      },
      (error) => {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: Date.now()
        });
        setCurrentResponse('');
        setCurrentSources([]);
        setProcessing(false);
        controllerRef.current?.setIdle();
      }
    );

    controllerRef.current?.setThink();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 简洁顶部栏 */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
              <h1 className="text-lg font-semibold text-gray-800">健康咨询助手</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleNewChat}
                disabled={isProcessing}
                className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center space-x-1.5 ${
                  isProcessing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>新对话</span>
              </button>
              <div className="text-xs text-gray-400">Developed by pickstar</div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 - 左右分栏，各占50% */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：数字人区域 - 50% */}
        <div className="w-1/2 border-r border-gray-200">
          <div className="h-full bg-white">
            <AvatarContainer
              controllerRef={controllerRef}
              onSpeakingStart={() => console.log('开始说话')}
              onSpeakingEnd={() => console.log('结束说话')}
            />
          </div>
        </div>

        {/* 右侧：对话区域 - 50% */}
        <div className="w-1/2 flex flex-col bg-white">
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && !currentResponse && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">请输入您的问题开始咨询</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex ${message.role === 'user' ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
                      {/* 简洁头像 */}
                      {message.role === 'assistant' ? (
                        <img src="/favicon.ico" alt="AI" className="w-7 h-7 flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-xs text-white">
                          我
                        </div>
                      )}

                      {/* 消息气泡 - 简洁配色 */}
                      <div className={`px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-gray-600 text-white rounded-2xl rounded-br-sm'
                          : 'bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm'
                      }`}>
                        {message.role === 'assistant' ? (
                          <FormattedMessage content={message.content} />
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>

                    {/* 知识来源 - 思考过程展示 */}
                    <ThinkingProcess sources={message.sources || []} />
                  </div>
                </div>
              ))}

              {/* AI 正在输入 */}
              {currentResponse && (
                <div className="flex justify-start">
                  <div className="flex space-x-2 max-w-[75%]">
                    <img src="/favicon.ico" alt="AI" className="w-7 h-7 flex-shrink-0" />
                    <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                        {currentResponse}
                        <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 思考中 */}
              {isProcessing && !currentResponse && (
                <div className="flex justify-start">
                  <div className="flex space-x-2">
                    <img src="/favicon.ico" alt="AI" className="w-7 h-7 flex-shrink-0" />
                    <div className="px-4 py-2.5 bg-gray-100 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
              <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
