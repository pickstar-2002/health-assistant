/**
 * 用户个性化记忆服务
 * 存储用户的偏好、历史记录、健康档案等信息
 */

import fs from 'fs';
import path from 'path';

export interface UserMemory {
  userId: string;
  profile: {
    name?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    allergies?: string[];
    chronicDiseases?: string[];
  };
  preferences: {
    language?: string;
    responseStyle?: 'professional' | 'friendly' | 'concise';
    topics?: string[];
  };
  healthRecords: HealthRecord[];
  conversationSummary: string[];
  lastUpdated: number;
}

export interface HealthRecord {
  id: string;
  type: 'symptom' | 'medication' | 'appointment' | 'measurement';
  date: number;
  title: string;
  description: string;
  data?: any;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'users');
const MEMORY_FILE = path.join(DATA_DIR, 'memories.json');

class MemoryService {
  private memories: Map<string, UserMemory> = new Map();
  private loaded = false;

  /**
   * 确保数据目录存在
   */
  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * 加载记忆数据
   */
  private loadMemories() {
    if (this.loaded) return;

    this.ensureDataDir();

    if (fs.existsSync(MEMORY_FILE)) {
      try {
        const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
        const memoriesArray = JSON.parse(data) as UserMemory[];
        memoriesArray.forEach(memory => {
          this.memories.set(memory.userId, memory);
        });
        console.log(`[MemoryService] Loaded ${memoriesArray.length} user memories`);
      } catch (error) {
        console.error('[MemoryService] Failed to load memories:', error);
      }
    }

    this.loaded = true;
  }

  /**
   * 保存记忆数据
   */
  private saveMemories() {
    this.ensureDataDir();

    try {
      const memoriesArray = Array.from(this.memories.values());
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(memoriesArray, null, 2));
      console.log(`[MemoryService] Saved ${memoriesArray.length} user memories`);
    } catch (error) {
      console.error('[MemoryService] Failed to save memories:', error);
    }
  }

  /**
   * 获取或创建用户记忆
   */
  getOrCreateMemory(userId: string): UserMemory {
    this.loadMemories();

    let memory = this.memories.get(userId);

    if (!memory) {
      memory = {
        userId,
        profile: {},
        preferences: {
          language: 'zh-CN',
          responseStyle: 'friendly'
        },
        healthRecords: [],
        conversationSummary: [],
        lastUpdated: Date.now()
      };
      this.memories.set(userId, memory);
      this.saveMemories();
    }

    return memory;
  }

  /**
   * 更新用户档案
   */
  updateProfile(userId: string, profile: Partial<UserMemory['profile']>) {
    const memory = this.getOrCreateMemory(userId);
    memory.profile = { ...memory.profile, ...profile };
    memory.lastUpdated = Date.now();
    this.saveMemories();
    return memory;
  }

  /**
   * 更新用户偏好
   */
  updatePreferences(userId: string, preferences: Partial<UserMemory['preferences']>) {
    const memory = this.getOrCreateMemory(userId);
    memory.preferences = { ...memory.preferences, ...preferences };
    memory.lastUpdated = Date.now();
    this.saveMemories();
    return memory;
  }

  /**
   * 添加健康记录
   */
  addHealthRecord(userId: string, record: Omit<HealthRecord, 'id' | 'date'>) {
    const memory = this.getOrCreateMemory(userId);
    const newRecord: HealthRecord = {
      ...record,
      id: `record_${Date.now()}`,
      date: Date.now()
    };
    memory.healthRecords.push(newRecord);
    memory.lastUpdated = Date.now();
    this.saveMemories();
    return newRecord;
  }

  /**
   * 删除健康记录
   */
  deleteHealthRecord(userId: string, recordId: string) {
    const memory = this.getOrCreateMemory(userId);
    memory.healthRecords = memory.healthRecords.filter(r => r.id !== recordId);
    memory.lastUpdated = Date.now();
    this.saveMemories();
  }

  /**
   * 获取健康记录
   */
  getHealthRecords(userId: string, type?: HealthRecord['type']) {
    const memory = this.getOrCreateMemory(userId);
    if (type) {
      return memory.healthRecords.filter(r => r.type === type);
    }
    return memory.healthRecords;
  }

  /**
   * 添加对话摘要
   */
  addConversationSummary(userId: string, summary: string) {
    const memory = this.getOrCreateMemory(userId);
    memory.conversationSummary.push(summary);
    // 只保留最近20条摘要
    if (memory.conversationSummary.length > 20) {
      memory.conversationSummary = memory.conversationSummary.slice(-20);
    }
    memory.lastUpdated = Date.now();
    this.saveMemories();
  }

  /**
   * 获取用户上下文（用于AI对话）
   */
  getUserContext(userId: string): string {
    const memory = this.getOrCreateMemory(userId);

    let context = '';

    // 档案信息
    if (memory.profile.age || memory.profile.gender) {
      context += '用户档案：';
      if (memory.profile.age) context += `${memory.profile.age}岁`;
      if (memory.profile.gender) context += `，${memory.profile.gender}`;
      if (memory.profile.height) context += `，身高${memory.profile.height}cm`;
      if (memory.profile.weight) context += `，体重${memory.profile.weight}kg`;
      context += '\n';
    }

    // 过敏史
    if (memory.profile.allergies && memory.profile.allergies.length > 0) {
      context += `过敏史：${memory.profile.allergies.join('、')}\n`;
    }

    // 慢性病
    if (memory.profile.chronicDiseases && memory.profile.chronicDiseases.length > 0) {
      context += `慢性病史：${memory.profile.chronicDiseases.join('、')}\n`;
    }

    // 偏好
    if (memory.preferences.responseStyle) {
      const styleMap = {
        professional: '专业',
        friendly: '友好',
        concise: '简洁'
      };
      context += `回复风格偏好：${styleMap[memory.preferences.responseStyle]}\n`;
    }

    // 最近对话摘要
    if (memory.conversationSummary.length > 0) {
      const recentSummaries = memory.conversationSummary.slice(-3);
      context += `最近咨询记录：\n${recentSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`;
    }

    return context;
  }

  /**
   * 获取所有用户列表
   */
  getAllUsers(): Array<{ userId: string; lastUpdated: number; profile: any }> {
    this.loadMemories();
    return Array.from(this.memories.values()).map(m => ({
      userId: m.userId,
      lastUpdated: m.lastUpdated,
      profile: m.profile
    }));
  }
}

export default new MemoryService();
