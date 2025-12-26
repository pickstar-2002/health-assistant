import React, { useState } from 'react';
import type { KnowledgeSource } from '../../store/chatStore';

interface ThinkingProcessProps {
  sources: KnowledgeSource[];
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) return null;

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      symptom: 'bg-red-500',
      nutrition: 'bg-green-500',
      exercise: 'bg-blue-500',
      mental: 'bg-purple-500',
      emergency: 'bg-orange-500',
      chronic: 'bg-rose-500',
      health_checkup: 'bg-teal-500',
      medication: 'bg-indigo-500',
      lifestyle: 'bg-cyan-500',
      tcm: 'bg-amber-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      symptom: '症状',
      nutrition: '营养',
      exercise: '运动',
      mental: '心理',
      emergency: '急救',
      chronic: '慢性病',
      health_checkup: '体检',
      medication: '用药',
      lifestyle: '生活方式',
      tcm: '中医'
    };
    return names[category] || category;
  };

  // 获取相似度等级
  const getSimilarityLevel = (score: number) => {
    const percentage = score * 100;
    if (percentage >= 80) return { text: '高', color: 'text-green-600' };
    if (percentage >= 60) return { text: '中', color: 'text-yellow-600' };
    return { text: '低', color: 'text-gray-600' };
  };

  return (
    <div className="ml-9 mt-2">
      {/* 折叠状态 - 小标签 */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>参考了 {sources.length} 条知识</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        /* 展开状态 - 详细信息 */
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          {/* 头部 */}
          <div
            className="flex items-center justify-between px-3 py-2 bg-gray-100 cursor-pointer hover:bg-gray-150 transition-colors"
            onClick={() => setIsExpanded(false)}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">知识库检索结果</span>
              <span className="text-xs text-gray-500">({sources.length} 条)</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>

          {/* 内容列表 */}
          <div className="p-3 space-y-2">
            {sources.map((source, idx) => {
              const similarity = getSimilarityLevel(source.score);
              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-white rounded-lg border border-gray-200"
                >
                  {/* 分类指示器 */}
                  <div className={`w-1.5 h-full rounded-full ${getCategoryColor(source.category)} flex-shrink-0 mt-1`} />

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium ${getCategoryColor(source.category).replace('bg-', 'text-').replace('-500', '-700')}`}>
                        {getCategoryName(source.category)}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{source.topic}</span>
                    </div>

                    {/* 相似度条 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(source.score * 100, 5)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${similarity.color}`}>
                        {(source.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 说明文字 */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI 基于向量相似度检索相关知识库，相似度越高代表关联度越强
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingProcess;
