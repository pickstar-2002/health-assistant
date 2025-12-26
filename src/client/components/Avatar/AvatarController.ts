/**
 * 魔珐星云具身驱动SDK控制器
 */

export type AvatarState =
  | 'offline'
  | 'online'
  | 'idle'
  | 'interactive_idle'
  | 'listen'
  | 'think'
  | 'speak';

export interface SpeakOptions {
  text: string;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface AvatarConfig {
  containerId: string;
  appId: string;
  appSecret: string;
  onStateChange?: (state: AvatarState) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  onError?: (error: any) => void;
}

export class AvatarController {
  private sdk: any = null;
  private config: AvatarConfig;
  private currentVoiceState: 'start' | 'end' | null = null;

  constructor(config: AvatarConfig) {
    this.config = config;
    // 确保 containerId 有 # 前缀
    if (!config.containerId.startsWith('#')) {
      this.config = { ...config, containerId: `#${config.containerId}` };
    }
  }

  async initialize(): Promise<void> {
    if (!(window as any).XmovAvatar) {
      await this.loadSDK();
    }

    // 等待容器元素存在
    await this.waitForContainer();

    // 额外延迟确保SDK完全加载
    await new Promise(resolve => setTimeout(resolve, 500));

    const XmovAvatar = (window as any).XmovAvatar;

    this.sdk = new XmovAvatar({
      containerId: this.config.containerId,
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

      onWidgetEvent: (data: any) => {
        console.log('Widget Event:', data);
      },

      proxyWidget: {
        'widget_pic': (data: any) => {
          console.log('Image Widget:', data);
        },
        'widget_slideshow': (data: any) => {
          console.log('Slideshow Widget:', data);
        }
      },

      onStateChange: (state: string) => {
        this.config.onStateChange?.(state as AvatarState);
      },

      onVoiceStateChange: (status: string) => {
        this.currentVoiceState = status as 'start' | 'end';
        if (status === 'start') {
          this.config.onVoiceStart?.();
        } else if (status === 'end') {
          this.config.onVoiceEnd?.();
        }
      },

      onNetworkInfo: (info: any) => {
        console.log('Network Info:', info);
      },

      onMessage: (message: any) => {
        console.log('SDK Message:', message);
      },

      enableLogger: false
    });

    await this.sdk.init({
      onDownloadProgress: (progress: number) => {
        console.log(`Loading progress: ${progress}%`);
      },
      onError: (error: any) => {
        this.config.onError?.(error);
      },
      onClose: () => {
        console.log('Connection closed');
      }
    });

    // 设置音量
    this.setVolume(1.0);

    console.log('Avatar SDK initialized, volume set to 1.0');
  }

  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SDK'));
      document.head.appendChild(script);
    });
  }

  private waitForContainer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 移除 # 前缀来查找元素
      const elementId = this.config.containerId.startsWith('#')
        ? this.config.containerId.slice(1)
        : this.config.containerId;

      const checkContainer = () => {
        const container = document.getElementById(elementId);
        if (container) {
          console.log(`[Avatar] Container found: ${elementId}`);
          // 使用 requestAnimationFrame 确保 DOM 完全渲染
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              console.log(`[Avatar] DOM fully rendered, proceeding with SDK init`);
              resolve();
            });
          });
        } else {
          console.log(`[Avatar] Waiting for container: ${elementId}`);
          setTimeout(checkContainer, 100);
        }
      };

      checkContainer();

      // 超时保护
      setTimeout(() => {
        const container = document.getElementById(elementId);
        if (!container) {
          reject(new Error(`Container ${elementId} not found after timeout`));
        }
      }, 10000);
    });
  }

  setIdle(): void {
    this.sdk?.idle();
  }

  setInteractiveIdle(): void {
    this.sdk?.interactive_idle();
  }

  setListen(): void {
    this.sdk?.listen();
  }

  setThink(): void {
    this.sdk?.think();
  }

  speak(options: SpeakOptions): void {
    const { text, isStart = true, isEnd = true } = options;
    this.sdk?.speak(text, isStart, isEnd);
  }

  async speakStream(textStream: AsyncIterable<string> | Generator<string>): Promise<void> {
    let isFirst = true;
    let buffer = '';

    for await (const chunk of textStream) {
      buffer += chunk;

      if (buffer.length > 15) {
        this.speak({ text: buffer, isStart: isFirst, isEnd: false });
        buffer = '';
        isFirst = false;
      }
    }

    if (buffer) {
      this.speak({ text: buffer, isStart: isFirst, isEnd: true });
    }
  }

  /**
   * 分段播放长文本
   * 将长文本分成多个小段，依次播放，避免单次播放过长导致超时
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

    // 依次播放每一段
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      this.speak({
        text: chunks[i],
        isStart: i === 0,
        isEnd: isLast
      });

      // 如果不是最后一段，等待一段时间再播放下一段
      if (!isLast) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  speakWithAction(text: string, action: string): void {
    const ssml = `<speak>
      <ue4event>
        <type>ka</type>
        <data><action_semantic>${action}</action_semantic></data>
      </ue4event>
      ${text}
    </speak>`;

    this.speak({ text: ssml });
  }

  setOfflineMode(): void {
    this.sdk?.offlineMode();
  }

  setOnlineMode(): void {
    this.sdk?.onlineMode();
  }

  setVolume(volume: number): void {
    this.sdk?.setVolume(volume);
    console.log(`[Avatar] Volume set to ${volume}`);
  }

  // 检查音频状态
  checkAudioState(): void {
    if (!this.sdk) {
      console.log('[Avatar] SDK not initialized');
      return;
    }
    // 尝试获取音频状态
    console.log('[Avatar] Checking audio state...');
  }

  destroy(): void {
    this.sdk?.destroy();
    this.sdk = null;
  }
}

export default AvatarController;
