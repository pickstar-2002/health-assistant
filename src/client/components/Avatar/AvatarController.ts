/**
 * 魔珐星云具身驱动SDK控制器
 * 版本: v0.1.0-alpha.72
 */

import {
  AvatarState,
  VoiceState,
  SDKStatus,
  AvatarControllerOptions,
  SpeakOptions,
  SSMLOptions,
  SDKMessage,
  NetworkInfo,
  WidgetEvent,
  EErrorCode,
  ERROR_MESSAGES,
} from './types';
import { useAvatarStore } from '../../store/avatarStore';

export class AvatarController {
  private sdk: any = null;
  private config: AvatarControllerOptions;
  private currentVoiceState: VoiceState | null = null;
  private isConnected: boolean = false;
  private isSDKLoaded: boolean = false;
  private containerId: string;

  constructor(config: AvatarControllerOptions) {
    this.config = config;
    this.containerId = config.containerId;

    // 确保 containerId 有 # 前缀
    if (!config.containerId.startsWith('#')) {
      this.config = { ...config, containerId: `#${config.containerId}` };
      this.containerId = this.config.containerId;
    }
  }

  /**
   * 获取当前凭证（优先使用动态回调）
   */
  private getCredentials(): { appId: string; appSecret: string } {
    if (this.config.onGetCredentials) {
      return this.config.onGetCredentials();
    }
    return {
      appId: this.config.appId || '',
      appSecret: this.config.appSecret || ''
    };
  }

  /**
   * 更新凭证
   */
  updateCredentials(appId: string, appSecret: string): void {
    this.config.appId = appId;
    this.config.appSecret = appSecret;
    console.log('[Avatar] Credentials updated');
  }

  /**
   * 加载SDK（不连接）
   */
  async loadSDKOnly(): Promise<void> {
    if (this.isSDKLoaded) {
      console.log('[Avatar] SDK already loaded');
      return;
    }

    if (!(window as any).XmovAvatar) {
      await this.loadSDK();
    }

    this.isSDKLoaded = true;
    console.log('[Avatar] SDK loaded successfully');
  }

  /**
   * 连接数字人
   */
  async connect(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isConnected) {
      console.log('[Avatar] Already connected');
      return;
    }

    const startTime = Date.now();
    useAvatarStore.getState().setConnectionStatus('connecting');

    try {
      // 确保SDK已加载
      await this.loadSDKOnly();

      // 等待容器元素存在
      await this.waitForContainer();

      // 获取凭证
      const credentials = this.getCredentials();
      if (!credentials.appId || !credentials.appSecret) {
        throw new Error('Avatar credentials not configured');
      }

      const XmovAvatar = (window as any).XmovAvatar;

      // 创建SDK实例
      this.sdk = new XmovAvatar({
        containerId: this.config.containerId,
        appId: credentials.appId,
        appSecret: credentials.appSecret,
        gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

        // Widget事件处理
        onWidgetEvent: (data: any) => {
          this.handleWidgetEvent(data);
        },

        // 代理Widget
        proxyWidget: {
          'widget_pic': (data: any) => {
            console.log('[Widget] Image:', data);
            this.config.proxyWidget?.['widget_pic']?.(data);
          },
          'widget_slideshow': (data: any) => {
            console.log('[Widget] Slideshow:', data);
            this.config.proxyWidget?.['widget_slideshow']?.(data);
          },
          'widget_video': (data: any) => {
            console.log('[Widget] Video:', data);
            this.config.proxyWidget?.['widget_video']?.(data);
          },
          'subtitle_on': (data: any) => {
            console.log('[Widget] Subtitle On:', data);
            this.config.proxyWidget?.['subtitle_on']?.(data);
          },
          'subtitle_off': (data: any) => {
            console.log('[Widget] Subtitle Off:', data);
            this.config.proxyWidget?.['subtitle_off']?.(data);
          },
          ...this.config.proxyWidget,
        },

        // 状态变化回调
        onStateChange: (state: string) => {
          const avatarState = state as AvatarState;
          useAvatarStore.getState().setAvatarState(avatarState);
          this.config.onStateChange?.(avatarState);
        },

        // 语音状态回调
        onVoiceStateChange: (status: string) => {
          const voiceState = status as VoiceState;
          this.currentVoiceState = voiceState;
          useAvatarStore.getState().setVoiceState(voiceState);
          this.config.onVoiceStateChange?.(voiceState);

          // 记录语音结束
          if (voiceState === 'voice_end') {
            useAvatarStore.getState().setAvatarState('idle');
          }
        },

        // SDK消息回调
        onMessage: (message: SDKMessage) => {
          this.handleSDKMessage(message);
          this.config.onMessage?.(message);
        },

        // 网络信息回调
        onNetworkInfo: (info: NetworkInfo) => {
          useAvatarStore.getState().setNetworkInfo(info);
          this.config.onNetworkInfo?.(info);
        },

        enableLogger: false, // 禁用SDK内部日志，避免干扰控制台
      });

      // 初始化连接
      await this.sdk.init({
        onDownloadProgress: (progress: number) => {
          useAvatarStore.getState().setDownloadProgress(progress);
          onProgress?.(progress);
          this.config.onDownloadProgress?.(progress);
        },
        onError: (error: any) => {
          console.error('[Avatar] Init error:', error);
          this.config.onError?.(error);
        },
        onClose: () => {
          console.log('[Avatar] Connection closed');
          this.isConnected = false;
          useAvatarStore.getState().setConnectionStatus('disconnected');
        },
      });

      // 设置音量
      this.setVolume(1.0);

      this.isConnected = true;
      useAvatarStore.getState().setConnectionStatus('connected');

      const connectionTime = Date.now() - startTime;
      useAvatarStore.getState().recordConnectionTime(connectionTime);

      console.log('[Avatar] Connected successfully');
    } catch (error: any) {
      console.error('[Avatar] Connection failed:', error);
      useAvatarStore.getState().setConnectionStatus('error', error.message);
      throw error;
    }
  }

  /**
   * 断开数字人连接
   */
  async disconnect(): Promise<void> {
    // 如果已连接，先销毁SDK
    // SDK 的 destroy() 方法会自动清理容器中的 DOM 节点
    if (this.isConnected && this.sdk) {
      try {
        this.sdk.destroy();
      } catch (e) {
        // 忽略 destroy 时的错误
        console.warn('[Avatar] SDK destroy warning:', e);
      }
      this.sdk = null;
      this.isConnected = false;
    } else {
      // 即使未连接，也更新内部状态
      this.isConnected = false;
      this.sdk = null;
    }

    // 注意：不调用 clearContainer()，因为 SDK.destroy() 已经清理了 DOM
    // 如果再次清理会导致与 React DOM 追踪冲突

    // 无论是否连接成功，都更新 store 状态
    useAvatarStore.getState().setConnectionStatus('disconnected');
    useAvatarStore.getState().setAvatarState('offlineMode');

    // 延迟清除错误，因为 SDK.destroy() 可能会触发回调
    setTimeout(() => {
      useAvatarStore.getState().clearErrors();
    }, 300);

    console.log('[Avatar] Disconnected');
  }

  /**
   * 清空容器内容
   * 注意：不使用 innerHTML = '' 以避免与 React DOM 追踪冲突
   * SDK 的 destroy() 方法会自己清理 DOM
   */
  private clearContainer(): void {
    const containerId = this.config.containerId.startsWith('#')
      ? this.config.containerId.slice(1)
      : this.config.containerId;

    const container = document.getElementById(containerId);
    if (container) {
      // 安全地移除所有子节点，避免与 React 冲突
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      console.log(`[Avatar] Container cleared: ${containerId}`);
    }
  }

  /**
   * 检查连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 检查是否正在说话
   */
  isAvatarSpeaking(): boolean {
    return this.currentVoiceState === 'voice_start';
  }

  /**
   * 加载SDK脚本
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar@latest.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * 等待容器元素存在
   */
  private waitForContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const elementId = this.config.containerId.startsWith('#')
        ? this.config.containerId.slice(1)
        : this.config.containerId;

      const checkContainer = () => {
        const container = document.getElementById(elementId);
        if (container) {
          console.log(`[Avatar] Container found: ${elementId}`);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              console.log(`[Avatar] DOM fully rendered`);
              resolve();
            });
          });
        } else {
          setTimeout(checkContainer, 100);
        }
      };

      checkContainer();

      setTimeout(() => {
        const container = document.getElementById(elementId);
        if (!container) {
          reject(new Error(`Container ${elementId} not found`));
        }
      }, 10000);
    });
  }

  /**
   * 处理Widget事件
   */
  private handleWidgetEvent(data: any): void {
    const event: WidgetEvent = {
      id: `widget_${Date.now()}`,
      type: data.type || 'unknown',
      data,
      timestamp: Date.now(),
    };

    useAvatarStore.getState().addWidgetEvent(event);
    this.config.onWidgetEvent?.(event);
  }

  /**
   * 处理SDK消息
   */
  private handleSDKMessage(message: SDKMessage): void {
    console.log('[Avatar] SDK message:', message);

    // 检查是否是用户主动关闭的正常消息
    const isUserCloseMessage =
      message.message &&
      message.message.includes('[TTSA]') &&
      message.message.includes('stop_reason');

    // 只有非用户主动关闭的错误才记录
    if (message.code >= 10000 && !isUserCloseMessage) {
      useAvatarStore.getState().addError(message.code, message.message);
    }

    // SDK状态变化
    if (message.code === 50001) {
      // 网络断开
      useAvatarStore.getState().setSdkStatus(SDKStatus.network_off);
    } else if (message.code === 50002) {
      // 网络恢复
      useAvatarStore.getState().setSdkStatus(SDKStatus.network_on);
    }
  }

  // ==================== 状态控制方法 ====================

  /**
   * 切换到待机状态
   */
  setIdle(): void {
    this.sdk?.idle();
  }

  /**
   * 切换到互动待机状态
   */
  setInteractiveIdle(): void {
    // interactive_idle 可能不存在，使用 idle() 作为后备
    if (this.sdk && typeof this.sdk.interactive_idle === 'function') {
      this.sdk.interactive_idle();
    } else {
      this.setIdle();
    }
  }

  /**
   * 切换到倾听状态
   */
  setListen(): void {
    this.sdk?.listen();
  }

  /**
   * 切换到思考状态
   */
  setThink(): void {
    this.sdk?.think();
  }

  /**
   * 切换到在线模式
   */
  setOnlineMode(): void {
    this.sdk?.onlineMode();
  }

  /**
   * 切换到离线模式（节省积分）
   */
  setOfflineMode(): void {
    this.sdk?.offlineMode();
  }

  // ==================== 语音播放方法 ====================

  /**
   * 让数字人说话（流式）
   * @param options 说话选项
   */
  speak(options: SpeakOptions | string): void {
    if (typeof options === 'string') {
      options = { text: options, isStart: true, isEnd: true };
    }

    const { text, isStart = true, isEnd = true } = options;
    this.sdk?.speak(text, isStart, isEnd);

    // 更新状态和统计
    if (isStart) {
      useAvatarStore.getState().setAvatarState('speak');
    }
    if (isEnd) {
      useAvatarStore.getState().incrementSpeakCount();
    }
  }

  /**
   * 使用SSML格式让数字人说话并执行动作
   * @param text 普通文本
   * @param options SSML选项
   */
  speakWithSSML(text: string, options: SSMLOptions = {}): void {
    const { kaIntent, kaAction, isStart = true, isEnd = true } = options;

    let ssml = '<speak>';

    // 添加语义意图
    if (kaIntent) {
      ssml += `
        <ue4event>
          <type>ka_intent</type>
          <data><ka_intent>${kaIntent}</ka_intent></data>
        </ue4event>`;
    }

    // 添加动作技能
    if (kaAction) {
      ssml += `
        <ue4event>
          <type>ka</type>
          <data><action_semantic>${kaAction}</action_semantic></data>
        </ue4event>`;
    }

    ssml += ` ${text} </speak>`;

    this.speak({ text: ssml, isStart, isEnd });
  }

  /**
   * 智能流式说话 - 自动处理状态切换和分段
   * @param chunks 文本块数组
   * @param onChunkComplete 每个块完成后的回调
   */
  async speakStream(
    chunks: string[],
    onChunkComplete?: (index: number, chunk: string) => void
  ): Promise<void> {
    if (!this.isConnected) {
      console.warn('[Avatar] Not connected, cannot speak');
      return;
    }

    // 切换到说话状态
    useAvatarStore.getState().setAvatarState('speak');

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLast = i === chunks.length - 1;

      this.speak({
        text: chunk,
        isStart: i === 0,
        isEnd: isLast,
      });

      // 等待一小段时间让SDK处理
      await new Promise(resolve => setTimeout(resolve, 50));

      // 回调
      onChunkComplete?.(i, chunk);
    }
  }

  /**
   * 实时流式说话 - 边接收边说话
   * 根据官方文档规范：
   * - 第一句speak的时候，is_start = true
   * - 最后一次speak的时候，is_end = true
   * - 其它的，is_start、is_end的都是false
   * @param textStream 文本流
   * @param options 配置选项
   */
  async speakRealTimeStream(
    textStream: AsyncIterable<string> | Generator<string>,
    options: {
      minChunkSize?: number;        // 最小片段长度（默认15字符，参考官方建议）
      maxChunkSize?: number;        // 最大片段长度（默认50字符）
      chunkDelay?: number;          // 片段间延迟（默认80ms，确保SDK有时间处理）
      onChunkSpoken?: (chunk: string, index: number) => void;  // 片段说话回调
    } = {}
  ): Promise<void> {
    const {
      minChunkSize = 15,
      maxChunkSize = 50,
      chunkDelay = 80,
      onChunkSpoken
    } = options;

    // 核心状态标志（修复：使用独立标志追踪是否曾经发送过speak）
    let hasEverSentSpeak = false;  // 是否曾经发送过任何speak请求
    let isFirstChunk = true;       // 当前chunk是否是第一次speak（用于isStart标志）
    let buffer = '';
    let chunkIndex = 0;
    let totalTextReceived = 0;
    let totalChunksSent = 0;

    console.log('[Avatar] Starting real-time stream speak');

    try {
      for await (const chunk of textStream) {
        totalTextReceived += chunk.length;
        buffer += chunk;

        console.log(`[Avatar] Received chunk: ${chunk.length} chars, total: ${totalTextReceived}, buffer: ${buffer.length}`);

        // 当缓冲达到最小长度时开始发送
        if (buffer.length >= minChunkSize) {
          // 按最大长度分片
          while (buffer.length >= maxChunkSize) {
            const speakChunk = buffer.slice(0, maxChunkSize);
            buffer = buffer.slice(maxChunkSize);

            console.log(`[Avatar] Speaking chunk ${chunkIndex}: ${speakChunk.length} chars, isStart: ${isFirstChunk}, isEnd: false`);
            this.speak({
              text: speakChunk,
              isStart: isFirstChunk,
              isEnd: false
            });

            onChunkSpoken?.(speakChunk, chunkIndex++);
            isFirstChunk = false;
            hasEverSentSpeak = true;
            totalChunksSent++;

            // 短暂延迟让SDK处理
            await this.delay(chunkDelay);
          }

          // 如果剩余的 buffer 达到 minChunkSize，也发送（避免累积太多）
          if (buffer.length >= minChunkSize) {
            const speakChunk = buffer;
            buffer = '';

            console.log(`[Avatar] Speaking intermediate chunk ${chunkIndex}: ${speakChunk.length} chars, isStart: ${isFirstChunk}, isEnd: false`);
            this.speak({
              text: speakChunk,
              isStart: isFirstChunk,
              isEnd: false
            });

            onChunkSpoken?.(speakChunk, chunkIndex++);
            isFirstChunk = false;
            hasEverSentSpeak = true;
            totalChunksSent++;

            await this.delay(chunkDelay);
          }
        }
      }

      console.log(`[Avatar] Stream ended, total received: ${totalTextReceived}, buffer remaining: ${buffer.length}, hasEverSentSpeak: ${hasEverSentSpeak}, chunks sent: ${totalChunksSent}`);

      // 流结束处理 - 根据官方规范正确设置 isStart 标志
      if (buffer.length > 0) {
        // 有剩余内容，发送并标记为结束
        const finalIsStart = !hasEverSentSpeak;

        console.log(`[Avatar] Speaking final chunk: ${buffer.length} chars, isStart: ${finalIsStart}, isEnd: true`);
        this.speak({
          text: buffer,
          isStart: finalIsStart,
          isEnd: true
        });
        onChunkSpoken?.(buffer, chunkIndex);
        totalChunksSent++;
      } else if (!hasEverSentSpeak) {
        // 流为空，发送空内容开始并结束
        console.log('[Avatar] Stream was empty, sending empty speak with isStart=true, isEnd=true');
        this.speak({
          text: '',
          isStart: true,
          isEnd: true
        });
      }
      // 注意：当 buffer.length === 0 且 hasEverSentSpeak === true 时
      // 说明所有内容已在循环中发送完毕，流式序列自然结束
      // 不需要再发送任何结束标记（避免违反SDK规范）

      console.log(`[Avatar] Total text received: ${totalTextReceived} chars, total chunks sent: ${totalChunksSent}`);

    } catch (error) {
      console.error('[Avatar] Error in speakRealTimeStream:', error);
      throw error;
    }
  }

  /**
   * 流式说话（文本流）
   * @param textStream 文本流
   */
  async speakTextStream(textStream: AsyncIterable<string> | Generator<string>): Promise<void> {
    let isFirst = true;
    let buffer = '';
    const CHUNK_SIZE = 15; // 每段最少字符数

    for await (const chunk of textStream) {
      buffer += chunk;

      if (buffer.length >= CHUNK_SIZE) {
        this.speak({ text: buffer, isStart: isFirst, isEnd: false });
        buffer = '';
        isFirst = false;
      }
    }

    // 发送剩余内容
    if (buffer) {
      this.speak({ text: buffer, isStart: isFirst, isEnd: true });
    }
  }

  /**
   * 延迟辅助函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 分段播放长文本
   * 将长文本分成多个小段，依次播放，避免单次播放过长导致超时
   * @param text 完整文本
   */
  async speakFullText(text: string): Promise<void> {
    if (!text || text.length === 0) return;

    const CHUNK_SIZE = 200; // 每段最多200字符
    const DELAY_MS = 300; // 段落间延迟

    if (text.length <= CHUNK_SIZE) {
      // 文本较短，直接播放
      this.speak({ text, isStart: true, isEnd: true });
      return;
    }

    // 分段播放
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    await this.speakStream(chunks);
  }

  /**
   * 设置音量
   * @param volume 音量值，范围 0-1
   */
  setVolume(volume: number): void {
    this.sdk?.setVolume(volume);
    console.log(`[Avatar] Volume set to ${volume}`);
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.sdk) {
      try {
        this.sdk.destroy();
      } catch (e) {
        // 忽略 destroy 时的错误
        console.warn('[Avatar] SDK destroy warning:', e);
      }
    }
    this.sdk = null;
    this.isConnected = false;
    this.isSDKLoaded = false;

    // 注意：不调用 clearContainer()，因为 SDK.destroy() 已经清理了 DOM
    // 如果再次清理会导致与 React DOM 追踪冲突

    console.log('[Avatar] Destroyed');
  }
}

export default AvatarController;
