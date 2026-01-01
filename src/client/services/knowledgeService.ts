/**
 * 知识库管理服务
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface KnowledgeFile {
  id: string;
  filename: string;
  category: string;
  uploadDate: number;
  size: number;
  documentCount: number;
  tags?: string[];
}

/**
 * 获取所有知识文件
 */
export async function getAllFiles(): Promise<KnowledgeFile[]> {
  try {
    const response = await axios.get(`${API_BASE}/knowledge/`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get knowledge files:', error);
    return [];
  }
}

/**
 * 获取所有分类
 */
export async function getCategories(): Promise<string[]> {
  try {
    const response = await axios.get(`${API_BASE}/knowledge/categories`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get categories:', error);
    return [];
  }
}

/**
 * 按分类获取文件
 */
export async function getFilesByCategory(category: string): Promise<KnowledgeFile[]> {
  try {
    const response = await axios.get(`${API_BASE}/knowledge/category/${category}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get files by category:', error);
    return [];
  }
}

/**
 * 获取单个文件详情
 */
export async function getFile(fileId: string): Promise<KnowledgeFile | null> {
  try {
    const response = await axios.get(`${API_BASE}/knowledge/${fileId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get file:', error);
    return null;
  }
}

/**
 * 获取文件内容
 */
export async function getFileContent(fileId: string): Promise<any> {
  try {
    const response = await axios.get(`${API_BASE}/knowledge/${fileId}/content`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get file content:', error);
    return null;
  }
}

/**
 * 上传知识文件
 */
export async function uploadFile(
  file: File,
  category: string,
  tags?: string[]
): Promise<{ success: boolean; file?: KnowledgeFile; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (tags) {
      formData.append('tags', JSON.stringify(tags));
    }

    const response = await axios.post(`${API_BASE}/knowledge/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || '上传失败'
    };
  }
}

/**
 * 更新文件信息
 */
export async function updateFile(
  fileId: string,
  updates: Partial<Pick<KnowledgeFile, 'category' | 'tags'>>
): Promise<KnowledgeFile | null> {
  try {
    const response = await axios.put(`${API_BASE}/knowledge/${fileId}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update file:', error);
    return null;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    await axios.delete(`${API_BASE}/knowledge/${fileId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

export default {
  getAllFiles,
  getCategories,
  getFilesByCategory,
  getFile,
  getFileContent,
  uploadFile,
  updateFile,
  deleteFile
};
