/**
 * 用户记忆路由
 * 处理用户档案、偏好、健康记录等
 */

import { Router } from 'express';
import memoryService from '../services/memoryService';

const router = Router();

/**
 * 获取用户记忆
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const memory = memoryService.getOrCreateMemory(userId);
    res.json({ success: true, data: memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 更新用户档案
 */
router.put('/:userId/profile', (req, res) => {
  try {
    const { userId } = req.params;
    const profile = req.body;
    const memory = memoryService.updateProfile(userId, profile);
    res.json({ success: true, data: memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 更新用户偏好
 */
router.put('/:userId/preferences', (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    const memory = memoryService.updatePreferences(userId, preferences);
    res.json({ success: true, data: memory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 添加健康记录
 */
router.post('/:userId/health-records', (req, res) => {
  try {
    const { userId } = req.params;
    const record = req.body;
    const newRecord = memoryService.addHealthRecord(userId, record);
    res.json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取健康记录
 */
router.get('/:userId/health-records', (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    const records = memoryService.getHealthRecords(userId, type as any);
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除健康记录
 */
router.delete('/:userId/health-records/:recordId', (req, res) => {
  try {
    const { userId, recordId } = req.params;
    memoryService.deleteHealthRecord(userId, recordId);
    res.json({ success: true, message: '记录已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取用户上下文（用于AI对话）
 */
router.get('/:userId/context', (req, res) => {
  try {
    const { userId } = req.params;
    const context = memoryService.getUserContext(userId);
    res.json({ success: true, data: context });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 添加对话摘要
 */
router.post('/:userId/summary', (req, res) => {
  try {
    const { userId } = req.params;
    const { summary } = req.body;
    memoryService.addConversationSummary(userId, summary);
    res.json({ success: true, message: '摘要已添加' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
