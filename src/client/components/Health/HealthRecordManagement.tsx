/**
 * 健康记录管理组件
 * 支持用药提醒、症状记录、预约管理等
 */

import React, { useState, useEffect } from 'react';
import memoryService, { HealthRecord } from '../../services/memoryService';

type RecordType = 'symptom' | 'medication' | 'appointment' | 'measurement';

export const HealthRecordManagement: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'medication' as RecordType,
    title: '',
    description: '',
    data: {} as any
  });

  // 加载健康记录
  const loadRecords = async () => {
    const data = await memoryService.getHealthRecords();
    setRecords(data.sort((a, b) => b.date - a.date));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // 筛选记录
  useEffect(() => {
    if (filterType === 'all') {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter(r => r.type === filterType));
    }
  }, [records, filterType]);

  // 添加记录
  const handleAdd = async () => {
    if (!newRecord.title) {
      alert('请输入标题');
      return;
    }

    await memoryService.addHealthRecord(newRecord);
    setNewRecord({
      type: 'medication',
      title: '',
      description: '',
      data: {}
    });
    setIsAdding(false);
    loadRecords();
  };

  // 删除记录
  const handleDelete = async (recordId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      await memoryService.deleteHealthRecord(recordId);
      loadRecords();
    }
  };

  // 类型标签颜色
  const getTypeColor = (type: RecordType): string => {
    const colors = {
      symptom: 'bg-yellow-100 text-yellow-700',
      medication: 'bg-blue-100 text-blue-700',
      appointment: 'bg-green-100 text-green-700',
      measurement: 'bg-purple-100 text-purple-700'
    };
    return colors[type];
  };

  // 类型标签
  const getTypeLabel = (type: RecordType): string => {
    const labels = {
      symptom: '症状',
      medication: '用药',
      appointment: '预约',
      measurement: '测量'
    };
    return labels[type];
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 导出健康报告
  const exportReport = () => {
    const report = {
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      records: records
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">健康记录</h2>
          <p className="text-sm text-gray-500">管理您的症状、用药、预约等健康信息</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            + 添加记录
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            导出报告
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            filterType === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部 ({records.length})
        </button>
        <button
          onClick={() => setFilterType('medication')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            filterType === 'medication'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          用药 ({records.filter(r => r.type === 'medication').length})
        </button>
        <button
          onClick={() => setFilterType('symptom')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            filterType === 'symptom'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          症状 ({records.filter(r => r.type === 'symptom').length})
        </button>
        <button
          onClick={() => setFilterType('appointment')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            filterType === 'appointment'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          预约 ({records.filter(r => r.type === 'appointment').length})
        </button>
        <button
          onClick={() => setFilterType('measurement')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            filterType === 'measurement'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          测量 ({records.filter(r => r.type === 'measurement').length})
        </button>
      </div>

      {/* 添加记录表单 */}
      {isAdding && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">添加新记录</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型
              </label>
              <select
                value={newRecord.type}
                onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as RecordType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="medication">用药</option>
                <option value="symptom">症状</option>
                <option value="appointment">预约</option>
                <option value="measurement">测量</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                value={newRecord.title}
                onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                placeholder="例如：服用降压药"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                placeholder="详细描述..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                保存
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 记录列表 */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无记录</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(record.type)}`}>
                      {getTypeLabel(record.type)}
                    </span>
                    <h4 className="font-medium">{record.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(record.date)}</p>
                </div>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthRecordManagement;
