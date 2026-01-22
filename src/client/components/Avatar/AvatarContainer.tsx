import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AvatarController } from './AvatarController';
import { useKeyStore } from '../../store/keyStore';
import { useAvatarStore } from '../../store/avatarStore';
import {
  AVATAR_STATE_LABELS,
  NETWORK_LATENCY_LEVELS,
  type ConnectionStatus,
  type AvatarState,
} from './types';

interface AvatarContainerProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  controllerRef?: React.MutableRefObject<AvatarController | null>;
  autoConnect?: boolean;
}

export const AvatarContainer: React.FC<AvatarContainerProps> = ({
  onSpeakingStart,
  onSpeakingEnd,
  controllerRef,
  autoConnect = false
}) => {
  const localControllerRef = useRef<AvatarController | null>(null);
  const containerElementRef = useRef<HTMLDivElement | null>(null);

  // AvatarStore 状态
  const connectionStatus = useAvatarStore((state) => state.connectionStatus);
  const connectionError = useAvatarStore((state) => state.connectionError);
  const currentAvatarState = useAvatarStore((state) => state.currentAvatarState);
  const voiceState = useAvatarStore((state) => state.voiceState);
  const networkInfo = useAvatarStore((state) => state.networkInfo);
  const downloadProgress = useAvatarStore((state) => state.downloadProgress);
  const errors = useAvatarStore((state) => state.errors);
  const stats = useAvatarStore((state) => state.stats);

  // 本地状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // 获取密钥的方法
  const { getXingyunAppId, getXingyunAppSecret } = useKeyStore();

  // 计算网络延迟等级
  const getNetworkLatencyLevel = useCallback(() => {
    if (!networkInfo) return 'unknown';
    if (networkInfo.rtt < 100) return 'excellent';
    if (networkInfo.rtt < 200) return 'good';
    if (networkInfo.rtt < 500) return 'fair';
    return 'poor';
  }, [networkInfo]);

  const networkLatencyLevel = getNetworkLatencyLevel();

  // 连接处理
  const handleConnect = useCallback(async () => {
    const controller = localControllerRef.current;
    if (!controller || isConnecting) return;

    setIsConnecting(true);
    try {
      await controller.connect((progress) => {
        console.log(`[Avatar] Download progress: ${progress}%`);
      });

      // 添加用户交互解锁音频
      const unlockAudio = () => {
        console.log('[Avatar] Unlocking audio with user interaction');
        controller?.setVolume(1.0);
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      };

      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('keydown', unlockAudio, { once: true });

      console.log('[Avatar] Connected and ready');
    } catch (error) {
      console.error('Failed to connect avatar:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // 断开连接处理
  const handleDisconnect = useCallback(async () => {
    const controller = localControllerRef.current;
    if (!controller) return;

    try {
      await controller.disconnect();
      console.log('[Avatar] Disconnected');
    } catch (error) {
      console.error('Failed to disconnect avatar:', error);
    }
  }, []);

  // 初始化控制器 - 只在挂载时执行一次
  useEffect(() => {
    const avatarController = new AvatarController({
      containerId: 'avatar-container',
      // 使用动态密钥获取回调
      onGetCredentials: () => ({
        appId: getXingyunAppId(),
        appSecret: getXingyunAppSecret()
      }),
      onStateChange: (newState) => {
        console.log('[Avatar] State changed:', newState);
      },
      onVoiceStart: () => {
        onSpeakingStart?.();
      },
      onVoiceEnd: () => {
        onSpeakingEnd?.();
      },
      onError: (error) => {
        console.error('Avatar Error:', error);
        setIsConnecting(false);
      }
    });

    localControllerRef.current = avatarController;

    // 如果传入了外部 ref，同时设置它
    if (controllerRef) {
      controllerRef.current = avatarController;
    }

    setIsInitialized(true);

    // 如果启用自动连接，则自动连接
    if (autoConnect) {
      handleConnect();
    }

    return () => {
      // 先断开连接，让 SDK 自己清理 DOM
      avatarController.disconnect().catch(() => {
        // 忽略断开连接时的错误
      }).finally(() => {
        // 确保销毁
        avatarController.destroy();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在挂载时执行一次

  // 单独处理 autoConnect 变化
  useEffect(() => {
    if (autoConnect && isInitialized && !localControllerRef.current?.getConnectionStatus()) {
      handleConnect();
    }
  }, [autoConnect, isInitialized, handleConnect]);

  // 获取连接状态显示
  const getConnectionStatusDisplay = () => {
    const statusMap: Record<ConnectionStatus, { label: string; color: string }> = {
      idle: { label: '未连接', color: 'text-gray-500' },
      connecting: { label: '连接中...', color: 'text-yellow-600' },
      connected: { label: '已连接', color: 'text-green-600' },
      disconnected: { label: '已断开', color: 'text-gray-500' },
      error: { label: '连接错误', color: 'text-red-600' },
    };
    return statusMap[connectionStatus];
  };

  const connectionStatusDisplay = getConnectionStatusDisplay();

  return (
    <div className="h-full flex flex-col">
      {/* 数字人容器 */}
      <div
        ref={containerElementRef}
        id="avatar-container"
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden"
        style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* SDK 元素居中样式 */}
        <style>{`
          #avatar-container > * {
            margin-left: auto !important;
            margin-right: auto !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
          #avatar-container canvas,
          #avatar-container video {
            margin-left: auto !important;
            margin-right: auto !important;
            display: block !important;
          }
          /* 隐藏SDK日志元素 */
          #avatar-container [class*="log"],
          #avatar-container [class*="Log"],
          #avatar-container [id*="log"],
          #avatar-container [id*="Log"],
          #avatar-container .xmov-log,
          #avatar-container .xingyun-log,
          /* 隐藏可能的调试面板 */
          #avatar-container [class*="debug"],
          #avatar-container [class*="Debug"],
          #avatar-container [class*="panel"],
          #avatar-container div:not([class]):not([id]):has(> code) {
            display: none !important;
          }
        `}</style>

        {/* 下载进度覆盖层 */}
        {downloadProgress > 0 && downloadProgress < 100 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-2">资源下载中</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">{downloadProgress}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 状态栏与控制按钮 */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">
        {/* 主要状态栏 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            {/* 状态指示器 */}
            <StateIndicator state={currentAvatarState} voiceState={voiceState} />

            {/* 状态文字 */}
            <span className="text-sm font-medium text-gray-700">
              {AVATAR_STATE_LABELS[currentAvatarState]}
            </span>

            {/* 连接状态 */}
            <span className={`text-xs px-2 py-1 rounded ${connectionStatusDisplay.color} bg-opacity-10`}>
              {connectionStatusDisplay.label}
            </span>
          </div>

          {/* 连接/断开控制按钮 */}
          <div className="flex items-center space-x-3">
            {connectionStatus !== 'connected' ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting || !isInitialized}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  isConnecting || !isInitialized
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isConnecting ? '连接中...' : '连接数字人'}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
              >
                断开连接
              </button>
            )}

            {/* 调试信息切换按钮 */}
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition"
              title="显示/隐藏调试信息"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 错误信息 */}
        {connectionError && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {connectionError}
          </div>
        )}

        {/* 调试信息 */}
        {showDebugInfo && (
          <div className="p-3 bg-gray-50 rounded text-xs space-y-2">
            {/* 网络信息 */}
            {networkInfo && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">网络延迟:</span>
                <span className={`font-medium ${NETWORK_LATENCY_LEVELS[networkLatencyLevel].color}`}>
                  {networkInfo.rtt}ms ({NETWORK_LATENCY_LEVELS[networkLatencyLevel].label})
                </span>
              </div>
            )}

            {/* 统计信息 */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">连接次数:</span>
              <span className="font-medium text-gray-700">{stats.connectionCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">说话次数:</span>
              <span className="font-medium text-gray-700">{stats.widgetEventCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">错误次数:</span>
              <span className="font-medium text-gray-700">{stats.errorCount}</span>
            </div>

            {/* 错误列表 */}
            {errors.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-gray-500 mb-1">最近错误:</div>
                {errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-red-600 truncate">
                    [{error.code}] {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 子组件 ====================

/**
 * 状态指示器
 */
const StateIndicator: React.FC<{
  state: AvatarState;
  voiceState: 'voice_start' | 'voice_end' | null;
}> = ({ state, voiceState }) => {
  const getColor = () => {
    // 说话中优先显示
    if (voiceState === 'voice_start') return 'bg-green-500 animate-pulse';

    // 根据状态显示
    switch (state) {
      case 'speak': return 'bg-green-500';
      case 'listen': return 'bg-blue-500';
      case 'think': return 'bg-yellow-500';
      case 'offlineMode': return 'bg-gray-300';
      case 'onlineMode': return 'bg-green-400';
      case 'idle': return 'bg-green-400';
      case 'interactive_idle': return 'bg-green-400';
      default: return 'bg-gray-300';
    }
  };

  const isAnimated = voiceState === 'voice_start' || ['speak', 'listen', 'think'].includes(state);

  return (
    <div className={`w-2.5 h-2.5 rounded-full ${getColor()} ${isAnimated ? 'animate-pulse' : ''}`} />
  );
};

export default AvatarContainer;
