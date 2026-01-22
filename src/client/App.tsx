import React, { useEffect, useRef, useState } from 'react';
import AvatarContainer from './components/Avatar/AvatarContainer';
import { ChatInput } from './components/Chat/ChatInput';
import { ThinkingProcess } from './components/Chat/ThinkingProcess';
import { FormattedMessage } from './components/Chat/FormattedMessage';
import { KnowledgeManagement } from './components/Knowledge/KnowledgeManagement';
import { HealthRecordManagement } from './components/Health/HealthRecordManagement';
import { KeyConfigButton } from './components/Settings/KeyConfigButton';
import { useChatStore } from './store/chatStore';
import { sendMessageStream } from './services/chatService';
import { AvatarController } from './components/Avatar/AvatarController';
import type { KnowledgeSource } from './store/chatStore';

type PageType = 'chat' | 'knowledge' | 'health';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('chat');
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

  useEffect(() => {
    currentResponseRef.current = currentResponse;
  }, [currentResponse]);

  useEffect(() => {
    currentSourcesRef.current = currentSourcesRef.current;
  }, [currentResponseRef]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // 清理 Markdown 格式符号，用于流式输出显示
  const cleanMarkdownText = (text: string): string => {
    // 移除加粗标记 **text**
    let cleaned = text.replace(/\*\*(.+?)\*\*/g, '$1');
    // 移除斜体标记 *text*
    cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
    // 移除代码标记 `text`
    cleaned = cleaned.replace(/`(.+?)`/g, '$1');
    // 移除链接标记 [text](url)
    cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1');
    return cleaned;
  };

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

    // 创建文本队列用于流式输出
    const textQueue: string[] = [];
    let isStreamComplete = false;
    let streamError: string | null = null;
    let messageAdded = false;  // 追踪消息是否已添加到历史
    let firstChunkReceived = false;  // 追踪是否收到第一个chunk

    // 创建异步生成器供数字人使用（延迟创建，等第一个chunk到达后再消费）
    let avatarSpeakPromise: Promise<void> | null = null;

    // 启动流式请求
    await sendMessageStream(
      { message: text, conversationHistory: history, userProfile },
      (chunk) => {
        appendCurrentResponse(chunk);
        textQueue.push(chunk);  // 添加到队列供数字人读取
        console.log('[App] Received chunk, queue size:', textQueue.length);

        // 第一个chunk到达后，立即启动数字人朗读
        if (!firstChunkReceived && controllerRef.current) {
          firstChunkReceived = true;
          console.log('[App] First chunk received, starting avatar speech');

          // 创建异步生成器
          const textStreamForAvatar = (async function* () {
            let yieldedCount = 0;
            let noDataCount = 0;

            console.log('[App] Generator: starting to yield chunks');

            // 持续从队列读取并 yield
            while (true) {
              if (textQueue.length > yieldedCount) {
                // 有新数据，yield 它
                const chunk = textQueue[yieldedCount];
                yieldedCount++;
                noDataCount = 0;
                console.log(`[App] Generator yielding chunk ${yieldedCount}/${textQueue.length}, text: "${chunk.slice(0, 20)}..."`);
                yield chunk;
              } else if (isStreamComplete && yieldedCount >= textQueue.length) {
                // 流已完成，队列已空，等待一段时间确保所有数据被消费
                noDataCount++;
                console.log(`[App] Stream complete, waiting... (${noDataCount}/30)`);

                if (noDataCount > 30) {  // 等待 30 * 30 = 900ms
                  console.log('[App] Generator finished, exiting');
                  break;
                }
                await new Promise(resolve => setTimeout(resolve, 30));
              } else if (streamError) {
                console.error('[App] Stream error in generator:', streamError);
                throw new Error(streamError);
              } else {
                // 等待新数据
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            }
            console.log(`[App] Generator finished, total chunks yielded: ${yieldedCount}`);
          })();

          // 异步执行朗读（使用新的默认参数：minChunkSize=15, chunkDelay=80）
          avatarSpeakPromise = controllerRef.current.speakRealTimeStream(textStreamForAvatar, {
            onChunkSpoken: (chunk, index) => {
              console.log(`[App] ✓ Avatar speaking chunk ${index}:`, chunk.slice(0, 30));
            }
          }).then(() => {
            console.log('[App] ✓ Real-time streaming speak method completed (speak requests sent, audio may still be playing)');
            // 重要：不要在这里调用 setIdle()，让SDK自然完成播放
            // SDK会通过 onVoiceStateChange(voice_end) 自动切换到 idle 状态
            setProcessing(false);
          }).catch((err) => {
            console.warn('[App] ✗ Real-time streaming speak error:', err);
            // 出错时确保状态被清空
            setCurrentResponse('');
            controllerRef.current?.setIdle();
            setProcessing(false);
          });
        }
      },
      (sources) => {
        console.log('[App] Stream completed, sources:', sources);
        isStreamComplete = true;

        const finalResponse = currentResponseRef.current;
        setCurrentSources(sources || []);

        // 只添加一次消息
        if (!messageAdded && finalResponse) {
          messageAdded = true;
          addMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: finalResponse,
            timestamp: Date.now(),
            sources: sources || undefined
          });
          console.log('[App] Message added to history');

          // 修复：消息添加后立即清空 currentResponse，避免重复显示
          setCurrentResponse('');
          currentResponseRef.current = '';
        }

        currentSourcesRef.current = [];
      },
      (error) => {
        console.error('[App] Stream error:', error);
        streamError = error;
        isStreamComplete = true;

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
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
                <h1 className="text-lg font-semibold text-gray-800">健康咨询助手</h1>
              </div>

              {/* 页面导航 */}
              <nav className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 'chat'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  对话咨询
                </button>
                <button
                  onClick={() => setCurrentPage('health')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 'health'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  健康记录
                </button>
                <button
                  onClick={() => setCurrentPage('knowledge')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 'knowledge'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  知识库管理
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              {currentPage === 'chat' && (
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
              )}
              {/* 密钥管理按钮 */}
              <KeyConfigButton />
              <div className="text-xs text-gray-400">Developed by pickstar</div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：数字人区域 - 始终显示 */}
        <div className="w-1/2 border-r border-gray-200">
          <div className="h-full bg-white">
            <AvatarContainer
              controllerRef={controllerRef}
              onSpeakingStart={() => console.log('开始说话')}
              onSpeakingEnd={() => console.log('结束说话')}
            />
          </div>
        </div>

        {/* 右侧：根据页面显示不同内容 */}
        <div className="w-1/2 flex flex-col bg-white">
          {currentPage === 'chat' && (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && !currentResponse && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-6">请输入您的问题开始咨询</p>

                    {/* 快捷提问选项 */}
                    <div className="w-full max-w-md grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSendMessage('我最近总是感到疲劳，没有精神，是什么原因？')}
                        className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition text-left"
                      >
                        💡 疲劳乏力
                      </button>
                      <button
                        onClick={() => handleSendMessage('请给我一些健康饮食的建议')}
                        className="px-4 py-3 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100 transition text-left"
                      >
                        🥗 饮食建议
                      </button>
                      <button
                        onClick={() => handleSendMessage('我最近睡眠质量不好，失眠多梦，怎么办？')}
                        className="px-4 py-3 bg-purple-50 text-purple-600 rounded-lg text-sm hover:bg-purple-100 transition text-left"
                      >
                        😴 失眠问题
                      </button>
                      <button
                        onClick={() => handleSendMessage('我想要减肥，请给我一些运动和饮食建议')}
                        className="px-4 py-3 bg-orange-50 text-orange-600 rounded-lg text-sm hover:bg-orange-100 transition text-left"
                      >
                        🏃 减肥健身
                      </button>
                      <button
                        onClick={() => handleSendMessage('我有高血压，平时需要注意什么？')}
                        className="px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition text-left"
                      >
                        ❤️ 高血压护理
                      </button>
                      <button
                        onClick={() => handleSendMessage('最近工作压力大，心情焦虑，怎么缓解？')}
                        className="px-4 py-3 bg-teal-50 text-teal-600 rounded-lg text-sm hover:bg-teal-100 transition text-left"
                      >
                        🧘 压力缓解
                      </button>
                      <button
                        onClick={() => handleSendMessage('请帮我解读一下血常规检查结果')}
                        className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm hover:bg-indigo-100 transition text-left"
                      >
                        📋 体检报告解读
                      </button>
                      <button
                        onClick={() => handleSendMessage('我想了解中医养生的基本方法')}
                        className="px-4 py-3 bg-amber-50 text-amber-600 rounded-lg text-sm hover:bg-amber-100 transition text-left"
                      >
                        🌿 中医养生
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex ${message.role === 'user' ? 'flex-row-reverse space-x-reverse space-x-2' : 'space-x-2'}`}>
                        {message.role === 'assistant' ? (
                          <img src="/favicon.ico" alt="AI" className="w-7 h-7 flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-xs text-white">
                            我
                          </div>
                        )}

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

                      <ThinkingProcess sources={message.sources || []} />
                    </div>
                  </div>
                ))}

                {currentResponse && (
                  <div className="flex justify-start">
                    <div className="flex space-x-2 max-w-[75%]">
                      <img src="/favicon.ico" alt="AI" className="w-7 h-7 flex-shrink-0" />
                      <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                          {cleanMarkdownText(currentResponse)}
                          <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
            </>
          )}

          {currentPage === 'health' && (
            <div className="flex-1 overflow-y-auto">
              <HealthRecordManagement />
            </div>
          )}

          {currentPage === 'knowledge' && (
            <div className="flex-1 overflow-hidden">
              <KnowledgeManagement />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
