import { create } from 'zustand';

/**
 * 密钥接口定义
 */
export interface ApiKeys {
  modelscopeApiKey: string;  // 魔搭社区AI服务密钥
  xingyunAppId: string;      // 星云数字人App ID
  xingyunAppSecret: string;  // 星云数字人App Secret
}

/**
 * 内置测试密钥
 */
export const DEFAULT_KEYS: ApiKeys = {
  // 星云数字人密钥
  xingyunAppId: 'b91e4bdb81ed4567bde3ba242b9bf042',
  xingyunAppSecret: '913d8ede47474927a441be29e6b560af',

  // 魔搭AI密钥（可选）
  modelscopeApiKey: 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069',
};

/**
 * 密钥存储状态接口
 */
interface KeyStore {
  // 状态
  keys: ApiKeys | null;
  isInitialized: boolean;
  _hasLoaded: boolean;  // 防止重复加载

  // 操作方法
  setKeys: (keys: ApiKeys) => void;
  useDefaultKeys: () => void;
  clearKeys: () => void;
  getModelScopeKey: () => string;
  getXingyunAppId: () => string;
  getXingyunAppSecret: () => string;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

/**
 * 密钥管理 Store
 */
export const useKeyStore = create<KeyStore>((set, get) => ({
  // 初始状态
  keys: DEFAULT_KEYS,
  isInitialized: true,
  _hasLoaded: false,

  // 设置自定义密钥
  setKeys: (keys: ApiKeys) => {
    set({ keys, isInitialized: true });
    get().saveToStorage();
  },

  // 使用默认密钥
  useDefaultKeys: () => {
    set({ keys: DEFAULT_KEYS, isInitialized: true });
    get().saveToStorage();
  },

  // 清除密钥
  clearKeys: () => {
    set({ keys: null, isInitialized: false });
    get().saveToStorage();
  },

  // 从 localStorage 加载（防止重复加载）
  loadFromStorage: () => {
    if (get()._hasLoaded) return;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('health-assistant-keys');
        if (saved) {
          const parsed = JSON.parse(saved);
          set({ keys: parsed, isInitialized: true, _hasLoaded: true });
        } else {
          set({ _hasLoaded: true });
        }
      } catch (e) {
        console.error('Failed to load keys from storage:', e);
        set({ _hasLoaded: true });
      }
    }
  },

  // 保存到 localStorage
  saveToStorage: () => {
    if (typeof window !== 'undefined') {
      const { keys } = get();
      if (keys) {
        localStorage.setItem('health-assistant-keys', JSON.stringify(keys));
      } else {
        localStorage.removeItem('health-assistant-keys');
      }
    }
  },

  // 获取密钥的辅助方法（带fallback）
  getModelScopeKey: () => {
    const { keys } = get();
    return keys?.modelscopeApiKey || DEFAULT_KEYS.modelscopeApiKey;
  },

  getXingyunAppId: () => {
    const { keys } = get();
    return keys?.xingyunAppId || DEFAULT_KEYS.xingyunAppId;
  },

  getXingyunAppSecret: () => {
    const { keys } = get();
    return keys?.xingyunAppSecret || DEFAULT_KEYS.xingyunAppSecret;
  },
}));

export default useKeyStore;
