import React, { useEffect, useRef, useState } from 'react';
import { AvatarController, AvatarState } from './AvatarController';

interface AvatarContainerProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  controllerRef?: React.MutableRefObject<AvatarController | null>;
}

export const AvatarContainer: React.FC<AvatarContainerProps> = ({
  onSpeakingStart,
  onSpeakingEnd,
  controllerRef
}) => {
  const localControllerRef = useRef<AvatarController | null>(null);
  const controller = controllerRef || localControllerRef;
  const [state, setState] = useState<AvatarState>('offline');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const avatarController = new AvatarController({
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

    avatarController.initialize().then(() => {
      (controller as React.MutableRefObject<AvatarController | null>).current = avatarController;
      setIsInitialized(true);

      // 添加用户交互解锁音频
      const unlockAudio = () => {
        console.log('[Avatar] Unlocking audio with user interaction');
        avatarController.setVolume(1.0);
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      };

      // 监听用户的第一次交互来解锁音频
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('keydown', unlockAudio, { once: true });

      console.log('[Avatar] Initialized and ready');
    }).catch((error) => {
      console.error('Failed to initialize avatar:', error);
    });

    return () => {
      avatarController.destroy();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div
        id="avatar-container"
        className="flex-1 w-full"
        style={{ position: 'relative' }}
      />

      {/* 简洁状态栏 */}
      <div className="flex-shrink-0 px-5 py-3 flex justify-between items-center border-t border-gray-100">
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

const StateIndicator: React.FC<{ state: AvatarState }> = ({ state }) => {
  const getColor = () => {
    switch (state) {
      case 'speak': return 'bg-green-500';
      case 'listen': return 'bg-blue-500';
      case 'think': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-300';
      default: return 'bg-green-400';
    }
  };

  const isAnimated = ['speak', 'listen', 'think'].includes(state);

  return (
    <div className={`w-2 h-2 rounded-full ${getColor()} ${isAnimated ? 'animate-pulse' : ''}`} />
  );
};

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
