/**
 * 知识库管理路由
 * 支持文件上传、列表、删除等操作
 */

import { Router } from 'express';
import multer from 'multer';
import knowledgeService from '../services/knowledgeService';

const router = Router();

// 配置multer用于内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许JSON文件
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('只支持JSON格式的文件'));
    }
  }
});

/**
 * 获取所有知识文件
 */
router.get('/', (req, res) => {
  try {
    const files = knowledgeService.getAllFiles();
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取所有分类
 */
router.get('/categories', (req, res) => {
  try {
    const categories = knowledgeService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 按分类获取文件
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const files = knowledgeService.getFilesByCategory(category);
    res.json({ success: true, data: files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取单个文件详情
 */
router.get('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const file = knowledgeService.getFile(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    res.json({ success: true, data: file });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取文件内容
 */
router.get('/:fileId/content', (req, res) => {
  try {
    const { fileId } = req.params;
    const content = knowledgeService.getFileContent(fileId);
    if (!content) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    res.json({ success: true, data: content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 上传知识文件
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const { category, tags } = req.body;
    const tagsArray = tags ? JSON.parse(tags) : undefined;

    const result = knowledgeService.uploadFile(
      req.file,
      category || 'uncategorized',
      tagsArray
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 更新文件信息
 */
router.put('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const updates = req.body;
    const file = knowledgeService.updateFile(fileId, updates);

    if (!file) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    res.json({ success: true, data: file });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除文件
 */
router.delete('/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const success = knowledgeService.deleteFile(fileId);

    if (!success) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    res.json({ success: true, message: '文件已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
