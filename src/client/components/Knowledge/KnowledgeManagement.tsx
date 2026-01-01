/**
 * 知识库管理组件
 * 支持拖拽上传、列表展示、删除等功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import knowledgeService from '../../services/knowledgeService';
import type { KnowledgeFile } from '../../services/knowledgeService';

export const KnowledgeManagement: React.FC = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('nutrition');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [previewContent, setPreviewContent] = useState<any>(null);

  // 加载文件列表
  const loadFiles = useCallback(async () => {
    const data = await knowledgeService.getAllFiles();
    setFiles(data);
  }, []);

  // 加载分类
  const loadCategories = useCallback(async () => {
    const cats = await knowledgeService.getCategories();
    setCategories(cats);
  }, []);

  useEffect(() => {
    loadFiles();
    loadCategories();
  }, [loadFiles, loadCategories]);

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // 文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('只支持JSON格式的文件');
      return;
    }

    setIsUploading(true);
    const tags = uploadTags.split(',').map(t => t.trim()).filter(t => t);
    const result = await knowledgeService.uploadFile(file, uploadCategory, tags);

    if (result.success) {
      alert('上传成功！');
      loadFiles();
      loadCategories();
      setUploadTags('');
    } else {
      alert(`上传失败: ${result.error}`);
    }

    setIsUploading(false);
  };

  // 删除文件
  const handleDelete = async (fileId: string, filename: string) => {
    if (confirm(`确定要删除 "${filename}" 吗？`)) {
      const success = await knowledgeService.deleteFile(fileId);
      if (success) {
        loadFiles();
        if (previewFile?.id === fileId) {
          setPreviewFile(null);
          setPreviewContent(null);
        }
      } else {
        alert('删除失败');
      }
    }
  };

  // 预览文件
  const handlePreview = async (file: KnowledgeFile) => {
    setPreviewFile(file);
    const content = await knowledgeService.getFileContent(file.id);
    setPreviewContent(content);
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 筛选文件
  const filteredFiles = selectedCategory === 'all'
    ? files
    : files.filter(f => f.category === selectedCategory);

  return (
    <div className="flex h-full">
      {/* 左侧：文件列表 */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* 上传区域 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-3">上传知识文件</h3>

          {/* 拖拽上传 */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-2">
              拖拽JSON文件到此处，或点击选择文件
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isUploading ? '上传中...' : '选择文件'}
            </label>
          </div>

          {/* 上传选项 */}
          <div className="mt-3 space-y-2">
            <div>
              <label className="text-sm text-gray-600">分类:</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="ml-2 px-3 py-1 border rounded-lg text-sm"
              >
                <option value="symptoms">症状</option>
                <option value="nutrition">营养</option>
                <option value="exercise">运动</option>
                <option value="mental">心理健康</option>
                <option value="emergency">急救</option>
                <option value="medication">用药</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">标签 (逗号分隔):</label>
              <input
                type="text"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="例如: 慢性病, 糖尿病"
                className="ml-2 px-3 py-1 border rounded-lg text-sm flex-1"
              />
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部 ({files.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredFiles.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              暂无文件
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer"
                  onClick={() => handlePreview(file)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{file.filename}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {file.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {file.documentCount} 条记录 · {formatSize(file.size)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(file.uploadDate)}
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id, file.filename);
                      }}
                      className="ml-3 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：预览区域 */}
      <div className="w-1/2 flex flex-col">
        {previewFile ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">文件预览</h3>
              <div className="text-sm text-gray-500 mt-1">{previewFile.filename}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {previewContent ? (
                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-auto">
                  {JSON.stringify(previewContent, null, 2)}
                </pre>
              ) : (
                <div className="text-center text-gray-400 py-8">加载中...</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>选择一个文件查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeManagement;
