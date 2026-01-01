/**
 * 知识库管理服务
 * 支持上传、删除、列出知识库文件
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface KnowledgeFile {
  id: string;
  filename: string;
  category: string;
  uploadDate: number;
  size: number;
  documentCount: number;
  tags?: string[];
}

export interface UploadResult {
  success: boolean;
  file?: KnowledgeFile;
  error?: string;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), 'data', 'knowledge');
const METADATA_FILE = path.join(KNOWLEDGE_DIR, 'metadata.json');
const UPLOAD_DIR = path.join(KNOWLEDGE_DIR, 'uploads');

class KnowledgeService {
  private files: Map<string, KnowledgeFile> = new Map();
  private loaded = false;

  /**
   * 确保目录存在
   */
  private ensureDirs() {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * 加载元数据
   */
  private loadMetadata() {
    if (this.loaded) return;

    this.ensureDirs();

    if (fs.existsSync(METADATA_FILE)) {
      try {
        const data = fs.readFileSync(METADATA_FILE, 'utf-8');
        const filesArray = JSON.parse(data) as KnowledgeFile[];
        filesArray.forEach(file => {
          this.files.set(file.id, file);
        });
        console.log(`[KnowledgeService] Loaded ${filesArray.length} knowledge files`);
      } catch (error) {
        console.error('[KnowledgeService] Failed to load metadata:', error);
      }
    }

    // 同时加载现有的JSON知识文件
    this.loadExistingKnowledge();

    this.loaded = true;
  }

  /**
   * 加载现有的知识库JSON文件
   */
  private loadExistingKnowledge() {
    const existingFiles = ['symptoms.json', 'nutrition.json'];

    existingFiles.forEach(filename => {
      const filePath = path.join(KNOWLEDGE_DIR, filename);
      if (fs.existsSync(filePath) && !Array.from(this.files.values()).find(f => f.filename === filename)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const file: KnowledgeFile = {
            id: crypto.randomUUID(),
            filename,
            category: filename.replace('.json', ''),
            uploadDate: fs.statSync(filePath).mtime.getTime(),
            size: fs.statSync(filePath).size,
            documentCount: Array.isArray(data) ? data.length : 1,
            tags: ['系统预设']
          };
          this.files.set(file.id, file);
        } catch (error) {
          console.error(`[KnowledgeService] Failed to load ${filename}:`, error);
        }
      }
    });

    this.saveMetadata();
  }

  /**
   * 保存元数据
   */
  private saveMetadata() {
    this.ensureDirs();

    try {
      const filesArray = Array.from(this.files.values());
      fs.writeFileSync(METADATA_FILE, JSON.stringify(filesArray, null, 2));
      console.log(`[KnowledgeService] Saved metadata for ${filesArray.length} files`);
    } catch (error) {
      console.error('[KnowledgeService] Failed to save metadata:', error);
    }
  }

  /**
   * 上传知识文件
   */
  async uploadFile(
    file: Express.Multer.File,
    category: string,
    tags?: string[]
  ): Promise<UploadResult> {
    this.loadMetadata();

    try {
      // 生成唯一ID
      const fileId = crypto.randomUUID();

      // 保存文件
      const targetPath = path.join(UPLOAD_DIR, `${fileId}_${file.originalname}`);
      fs.writeFileSync(targetPath, file.buffer);

      // 解析文件内容获取文档数量
      let documentCount = 0;
      try {
        const content = file.buffer.toString('utf-8');
        const data = JSON.parse(content);
        documentCount = Array.isArray(data) ? data.length : 1;
      } catch {
        documentCount = 1;
      }

      // 创建文件记录
      const knowledgeFile: KnowledgeFile = {
        id: fileId,
        filename: file.originalname,
        category,
        uploadDate: Date.now(),
        size: file.size,
        documentCount,
        tags: tags || []
      };

      this.files.set(fileId, knowledgeFile);
      this.saveMetadata();

      console.log(`[KnowledgeService] Uploaded file: ${file.originalname}`);

      return { success: true, file: knowledgeFile };
    } catch (error: any) {
      console.error('[KnowledgeService] Upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除知识文件
   */
  deleteFile(fileId: string): boolean {
    this.loadMetadata();

    const file = this.files.get(fileId);
    if (!file) {
      return false;
    }

    try {
      // 删除物理文件
      const filePath = path.join(UPLOAD_DIR, `${fileId}_${file.filename}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 从元数据中删除
      this.files.delete(fileId);
      this.saveMetadata();

      console.log(`[KnowledgeService] Deleted file: ${file.filename}`);
      return true;
    } catch (error) {
      console.error('[KnowledgeService] Delete failed:', error);
      return false;
    }
  }

  /**
   * 获取所有知识文件
   */
  getAllFiles(): KnowledgeFile[] {
    this.loadMetadata();
    return Array.from(this.files.values()).sort((a, b) => b.uploadDate - a.uploadDate);
  }

  /**
   * 获取单个文件详情
   */
  getFile(fileId: string): KnowledgeFile | undefined {
    this.loadMetadata();
    return this.files.get(fileId);
  }

  /**
   * 获取文件内容
   */
  getFileContent(fileId: string): any {
    this.loadMetadata();

    const file = this.files.get(fileId);
    if (!file) {
      return null;
    }

    try {
      const filePath = path.join(UPLOAD_DIR, `${fileId}_${file.filename}`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }

      // 尝试从主目录加载
      const mainPath = path.join(KNOWLEDGE_DIR, file.filename);
      if (fs.existsSync(mainPath)) {
        const content = fs.readFileSync(mainPath, 'utf-8');
        return JSON.parse(content);
      }

      return null;
    } catch (error) {
      console.error('[KnowledgeService] Failed to read file content:', error);
      return null;
    }
  }

  /**
   * 按分类获取文件
   */
  getFilesByCategory(category: string): KnowledgeFile[] {
    this.loadMetadata();
    return Array.from(this.files.values())
      .filter(f => f.category === category)
      .sort((a, b) => b.uploadDate - a.uploadDate);
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    this.loadMetadata();
    const categories = new Set(Array.from(this.files.values()).map(f => f.category));
    return Array.from(categories);
  }

  /**
   * 更新文件信息
   */
  updateFile(
    fileId: string,
    updates: Partial<Pick<KnowledgeFile, 'category' | 'tags'>>
  ): KnowledgeFile | null {
    this.loadMetadata();

    const file = this.files.get(fileId);
    if (!file) {
      return null;
    }

    const updatedFile = { ...file, ...updates };
    this.files.set(fileId, updatedFile);
    this.saveMetadata();

    return updatedFile;
  }
}

export default new KnowledgeService();
