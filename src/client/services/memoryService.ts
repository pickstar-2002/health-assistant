/**
 * 用户记忆服务
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const DEFAULT_USER_ID = 'user_default';

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

/**
 * 获取用户记忆
 */
export async function getUserMemory(userId: string = DEFAULT_USER_ID): Promise<UserMemory | null> {
  try {
    const response = await axios.get(`${API_BASE}/memory/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get user memory:', error);
    return null;
  }
}

/**
 * 更新用户档案
 */
export async function updateUserProfile(
  profile: Partial<UserMemory['profile']>,
  userId: string = DEFAULT_USER_ID
): Promise<UserMemory | null> {
  try {
    const response = await axios.put(`${API_BASE}/memory/${userId}/profile`, profile);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    return null;
  }
}

/**
 * 更新用户偏好
 */
export async function updateUserPreferences(
  preferences: Partial<UserMemory['preferences']>,
  userId: string = DEFAULT_USER_ID
): Promise<UserMemory | null> {
  try {
    const response = await axios.put(`${API_BASE}/memory/${userId}/preferences`, preferences);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return null;
  }
}

/**
 * 添加健康记录
 */
export async function addHealthRecord(
  record: Omit<HealthRecord, 'id' | 'date'>,
  userId: string = DEFAULT_USER_ID
): Promise<HealthRecord | null> {
  try {
    const response = await axios.post(`${API_BASE}/memory/${userId}/health-records`, record);
    return response.data.data;
  } catch (error) {
    console.error('Failed to add health record:', error);
    return null;
  }
}

/**
 * 获取健康记录
 */
export async function getHealthRecords(
  userId: string = DEFAULT_USER_ID,
  type?: HealthRecord['type']
): Promise<HealthRecord[]> {
  try {
    const params = type ? { type } : {};
    const response = await axios.get(`${API_BASE}/memory/${userId}/health-records`, { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get health records:', error);
    return [];
  }
}

/**
 * 删除健康记录
 */
export async function deleteHealthRecord(
  recordId: string,
  userId: string = DEFAULT_USER_ID
): Promise<boolean> {
  try {
    await axios.delete(`${API_BASE}/memory/${userId}/health-records/${recordId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete health record:', error);
    return false;
  }
}

/**
 * 获取用户上下文
 */
export async function getUserContext(userId: string = DEFAULT_USER_ID): Promise<string> {
  try {
    const response = await axios.get(`${API_BASE}/memory/${userId}/context`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get user context:', error);
    return '';
  }
}

/**
 * 添加对话摘要
 */
export async function addConversationSummary(
  summary: string,
  userId: string = DEFAULT_USER_ID
): Promise<boolean> {
  try {
    await axios.post(`${API_BASE}/memory/${userId}/summary`, { summary });
    return true;
  } catch (error) {
    console.error('Failed to add conversation summary:', error);
    return false;
  }
}

export default {
  getUserMemory,
  updateUserProfile,
  updateUserPreferences,
  addHealthRecord,
  getHealthRecords,
  deleteHealthRecord,
  getUserContext,
  addConversationSummary
};
