import React, { useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isProcessing = useChatStore((state) => state.isProcessing);

  const handleSend = () => {
    if (input.trim() && !isProcessing && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  const isDisabled = isProcessing || disabled;

  return (
    <div className="flex items-center space-x-3">
      {/* 语音按钮 */}
      <button
        onClick={isRecording ? stopVoiceInput : startVoiceInput}
        className={`p-3 rounded-lg transition-colors ${
          isRecording
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        disabled={isDisabled}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {/* 输入框 */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入您的健康问题..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isDisabled}
        />
        {isRecording && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-0.5">
            <div className="w-0.5 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-0.5 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
            <div className="w-0.5 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
        )}
      </div>

      {/* 发送按钮 */}
      <button
        onClick={handleSend}
        disabled={isDisabled || !input.trim()}
        className={`px-5 py-3 rounded-lg font-medium transition-all ${
          isDisabled || !input.trim()
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isRecording ? '录音中' : isDisabled ? '处理中' : '发送'}
      </button>
    </div>
  );
};

export default ChatInput;
