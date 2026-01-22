/**
 * 魔珐星云数字人系统 - 类型定义
 */

// ==================== 错误码枚举 ====================
export enum EErrorCode {
  // 容器不存在
  CONTAINER_NOT_FOUND = 10001,
  // socket连接错误
  CONNECT_SOCKET_ERROR = 10002,
  // 会话错误
  START_SESSION_ERROR = 10003,
  STOP_SESSION_ERROR = 10004,

  VIDEO_DOWNLOAD_ERROR = 30004,      // 视频下载错误
  AUDIO_DECODE_ERROR = 40001,        // 音频解码错误
  TTSA_ERROR = 40006,                // TTS服务异常

  NETWORK_DOWN = 50001,              // 离线模式
  NETWORK_UP = 50002,                // 在线模式
  NETWORK_BREAK = 50004,             // 网络断开
}

// ==================== 错误消息映射 ====================
export const ERROR_MESSAGES: Record<number, string> = {
  [EErrorCode.CONTAINER_NOT_FOUND]: '容器元素不存在',
  [EErrorCode.CONNECT_SOCKET_ERROR]: 'Socket 连接错误',
  [EErrorCode.START_SESSION_ERROR]: '会话启动失败',
  [EErrorCode.STOP_SESSION_ERROR]: '会话停止失败',
  [EErrorCode.VIDEO_DOWNLOAD_ERROR]: '视频资源下载失败',
  [EErrorCode.AUDIO_DECODE_ERROR]: '音频解码错误',
  [EErrorCode.TTSA_ERROR]: 'TTS 服务异常',
  [EErrorCode.NETWORK_DOWN]: '网络连接已断开',
  [EErrorCode.NETWORK_UP]: '网络连接已恢复',
  [EErrorCode.NETWORK_BREAK]: '网络连接中断',
};

// ==================== SDK 状态枚举 ====================
export enum SDKStatus {
  online = 0,       // 在线
  offline = 1,      // 离线
  network_on = 2,   // 网络恢复
  network_off = 3,  // 网络断开
  close = 4,        // 关闭
}

// ==================== 数字人状态 ====================
export type AvatarState =
  | 'offlineMode'       // 离线模式（节省积分）
  | 'onlineMode'        // 在线模式
  | 'idle'              // 待机
  | 'interactive_idle'  // 互动待机
  | 'listen'            // 倾听
  | 'think'             // 思考
  | 'speak';            // 说话

// ==================== 语音状态 ====================
export type VoiceState = 'voice_start' | 'voice_end';

// ==================== 连接状态 ====================
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// ==================== SDK 消息 ====================
export interface SDKMessage {
  code: number;
  message?: string;
  data?: any;
}

// ==================== 网络信息 ====================
export interface NetworkInfo {
  rtt: number;        // 往返时间 (ms)
  downlink: number;   // 下行速度 (Mbps)
}

// ==================== Widget 事件 ====================
export interface WidgetEvent {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

// ==================== 错误记录 ====================
export interface ErrorRecord {
  code: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

// ==================== 性能指标 ====================
export interface PerformanceMetrics {
  totalSpeakCount: number;
  totalConnectionTime: number;
  lastConnectionTime: number | null;
  averageSpeakDuration: number | null;
}

// ==================== 统计信息 ====================
export interface Stats {
  connectionCount: number;
  errorCount: number;
  widgetEventCount: number;
}

// ==================== SDK 配置选项 ====================
export interface AvatarControllerOptions {
  containerId: string;           // 容器ID
  appId?: string;                // 星云 App ID（可选，支持动态设置）
  appSecret?: string;            // 星云 App Secret（可选，支持动态设置）

  // 回调函数
  onStateChange?: (state: AvatarState) => void;
  onStatusChange?: (status: SDKStatus) => void;
  onMessage?: (message: SDKMessage) => void;
  onVoiceStateChange?: (status: VoiceState) => void;
  onNetworkInfo?: (info: NetworkInfo) => void;
  onDownloadProgress?: (progress: number) => void;
  onWidgetEvent?: (event: WidgetEvent) => void;
  onError?: (error: ErrorRecord) => void;

  // Widget 事件代理
  proxyWidget?: Record<string, (data: any) => void>;

  // 动态获取密钥的回调
  onGetCredentials?: () => { appId: string; appSecret: string };

  // 调试选项
  enableLogger?: boolean;
}

// ==================== 说话选项 ====================
export interface SpeakOptions {
  text: string;
  isStart?: boolean;
  isEnd?: boolean;
}

// ==================== SSML 选项 ====================
export interface SSMLOptions {
  kaIntent?: string;    // 语义意图
  kaAction?: string;    // 动作技能
  isStart?: boolean;
  isEnd?: boolean;
}

// ==================== 数字人状态标签 ====================
export const AVATAR_STATE_LABELS: Record<AvatarState, string> = {
  offlineMode: '离线模式',
  onlineMode: '在线模式',
  idle: '待机',
  interactive_idle: '互动待机',
  listen: '倾听中',
  think: '思考中',
  speak: '说话中',
};

// ==================== SDK 状态标签 ====================
export const SDK_STATUS_LABELS: Record<SDKStatus, string> = {
  [SDKStatus.online]: '在线',
  [SDKStatus.offline]: '离线',
  [SDKStatus.network_on]: '网络恢复',
  [SDKStatus.network_off]: '网络断开',
  [SDKStatus.close]: '关闭',
};

// ==================== 网络延迟等级 ====================
export type NetworkLatencyLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export const NETWORK_LATENCY_LEVELS: Record<NetworkLatencyLevel, { label: string; color: string; maxRtt: number }> = {
  excellent: { label: '极佳', color: 'text-green-600', maxRtt: 100 },
  good: { label: '良好', color: 'text-blue-600', maxRtt: 200 },
  fair: { label: '一般', color: 'text-yellow-600', maxRtt: 500 },
  poor: { label: '较差', color: 'text-red-600', maxRtt: Infinity },
  unknown: { label: '未知', color: 'text-gray-400', maxRtt: Infinity },
};
