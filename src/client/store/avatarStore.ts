import { create } from 'zustand';
import {
  AvatarState,
  VoiceState,
  ConnectionStatus,
  SDKStatus,
  NetworkInfo,
  WidgetEvent,
  ErrorRecord,
  PerformanceMetrics,
  Stats,
  EErrorCode,
  ERROR_MESSAGES,
} from '../components/Avatar/types';

/**
 * AvatarStore 状态接口
 */
interface AvatarStoreState {
  // ==================== 连接状态 ====================
  connectionStatus: ConnectionStatus;
  connectionError: string | null;

  // ==================== 数字人状态 ====================
  currentAvatarState: AvatarState;
  voiceState: VoiceState | null;

  // ==================== SDK 状态 ====================
  sdkStatus: SDKStatus | null;

  // ==================== 网络信息 ====================
  networkInfo: NetworkInfo | null;

  // ==================== 资源下载进度 ====================
  downloadProgress: number;

  // ==================== Widget 事件历史（最近50条）====================
  widgetEvents: WidgetEvent[];

  // ==================== 错误记录（最近20条）====================
  errors: ErrorRecord[];

  // ==================== 性能指标 ====================
  performanceMetrics: PerformanceMetrics;

  // ==================== 统计信息 ====================
  stats: Stats;

  // ==================== 操作方法 ====================
  setConnectionStatus: (status: ConnectionStatus, error?: string | null) => void;
  setAvatarState: (state: AvatarState) => void;
  setVoiceState: (state: VoiceState | null) => void;
  setSdkStatus: (status: SDKStatus) => void;
  setNetworkInfo: (info: NetworkInfo | null) => void;
  setDownloadProgress: (progress: number) => void;
  addWidgetEvent: (event: Omit<WidgetEvent, 'id' | 'timestamp'>) => void;
  addError: (code: number, message?: string) => void;
  resolveError: (timestamp: number) => void;
  clearErrors: () => void;
  incrementSpeakCount: (duration?: number) => void;
  recordConnectionTime: (time: number) => void;
  reset: () => void;
}

/**
 * 初始性能指标
 */
const initialPerformanceMetrics: PerformanceMetrics = {
  totalSpeakCount: 0,
  totalConnectionTime: 0,
  lastConnectionTime: null,
  averageSpeakDuration: null,
};

/**
 * 初始统计信息
 */
const initialStats: Stats = {
  connectionCount: 0,
  errorCount: 0,
  widgetEventCount: 0,
};

/**
 * AvatarStore - 数字人系统全局状态管理
 */
export const useAvatarStore = create<AvatarStoreState>((set, get) => ({
  // ==================== 初始状态 ====================
  connectionStatus: 'idle',
  connectionError: null,
  currentAvatarState: 'offlineMode',
  voiceState: null,
  sdkStatus: null,
  networkInfo: null,
  downloadProgress: 0,
  widgetEvents: [],
  errors: [],
  performanceMetrics: initialPerformanceMetrics,
  stats: initialStats,

  // ==================== 连接状态 ====================
  setConnectionStatus: (status, error = null) => {
    set({ connectionStatus: status, connectionError: error });

    // 更新统计
    if (status === 'connected') {
      set((state) => ({
        stats: {
          ...state.stats,
          connectionCount: state.stats.connectionCount + 1,
        },
      }));
    }
  },

  // ==================== 数字人状态 ====================
  setAvatarState: (state) => {
    set({ currentAvatarState: state });
  },

  // ==================== 语音状态 ====================
  setVoiceState: (state) => {
    set({ voiceState: state });
  },

  // ==================== SDK 状态 ====================
  setSdkStatus: (status) => {
    set({ sdkStatus: status });
  },

  // ==================== 网络信息 ====================
  setNetworkInfo: (info) => {
    set({ networkInfo: info });
  },

  // ==================== 下载进度 ====================
  setDownloadProgress: (progress) => {
    set({ downloadProgress: progress });
  },

  // ==================== Widget 事件 ====================
  addWidgetEvent: (event) => {
    const newEvent: WidgetEvent = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event,
    };

    set((state) => ({
      widgetEvents: [newEvent, ...state.widgetEvents].slice(0, 50),
      stats: {
        ...state.stats,
        widgetEventCount: state.stats.widgetEventCount + 1,
      },
    }));
  },

  // ==================== 错误处理 ====================
  addError: (code, message) => {
    const errorMessage = message || ERROR_MESSAGES[code] || '未知错误';

    const newError: ErrorRecord = {
      code,
      message: errorMessage,
      timestamp: Date.now(),
      resolved: false,
    };

    set((state) => ({
      errors: [newError, ...state.errors].slice(0, 20),
      stats: {
        ...state.stats,
        errorCount: state.stats.errorCount + 1,
      },
      connectionStatus: 'error',
      connectionError: errorMessage,
    }));
  },

  resolveError: (timestamp) => {
    set((state) => ({
      errors: state.errors.map((error) =>
        error.timestamp === timestamp ? { ...error, resolved: true } : error
      ),
    }));
  },

  clearErrors: () => {
    set({ errors: [], connectionError: null });
  },

  // ==================== 性能指标 ====================
  incrementSpeakCount: (duration) => {
    set((state) => {
      const newCount = state.performanceMetrics.totalSpeakCount + 1;
      const newAverage = duration
        ? (state.performanceMetrics.averageSpeakDuration || 0) *
            (1 - 1 / newCount) +
          duration / newCount
        : state.performanceMetrics.averageSpeakDuration;

      return {
        performanceMetrics: {
          ...state.performanceMetrics,
          totalSpeakCount: newCount,
          averageSpeakDuration: newAverage,
        },
      };
    });
  },

  recordConnectionTime: (time) => {
    set((state) => ({
      performanceMetrics: {
        ...state.performanceMetrics,
        lastConnectionTime: time,
        totalConnectionTime: state.performanceMetrics.totalConnectionTime + time,
      },
    }));
  },

  // ==================== 重置 ====================
  reset: () => {
    set({
      connectionStatus: 'idle',
      connectionError: null,
      currentAvatarState: 'offlineMode',
      voiceState: null,
      sdkStatus: null,
      networkInfo: null,
      downloadProgress: 0,
      widgetEvents: [],
      errors: [],
      performanceMetrics: initialPerformanceMetrics,
      stats: initialStats,
    });
  },
}));

// ==================== 选择器 ====================

/**
 * 获取连接状态是否为已连接
 */
export const selectIsConnected = () =>
  useAvatarStore.getState().connectionStatus === 'connected';

/**
 * 获取是否正在说话
 */
export const selectIsSpeaking = () =>
  useAvatarStore.getState().voiceState === 'voice_start';

/**
 * 获取网络延迟等级
 */
export const selectNetworkLatencyLevel = () => {
  const networkInfo = useAvatarStore.getState().networkInfo;
  if (!networkInfo) return 'unknown';

  if (networkInfo.rtt < 100) return 'excellent';
  if (networkInfo.rtt < 200) return 'good';
  if (networkInfo.rtt < 500) return 'fair';
  return 'poor';
};

/**
 * 获取最近Widget事件（按类型）
 */
export const selectRecentWidgetEventsByType = (
  type: string,
  limit: number = 5
) => {
  return useAvatarStore
    .getState()
    .widgetEvents.filter((e) => e.type === type)
    .slice(0, limit);
};

/**
 * 获取未解决的错误
 */
export const selectUnresolvedErrors = () => {
  return useAvatarStore.getState().errors.filter((e) => !e.resolved);
};

export default useAvatarStore;
