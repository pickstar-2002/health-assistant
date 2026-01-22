import React, { useState, useEffect } from 'react';
import { useKeyStore } from '../../store/keyStore';
import KeyConfigModal from './KeyConfigModal';

/**
 * 密钥管理按钮组件
 * 显示密钥状态并提供配置入口
 */
export const KeyConfigButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { keys, isInitialized, loadFromStorage, getModelScopeKey, getXingyunAppId, getXingyunAppSecret } = useKeyStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 判断是否使用默认密钥
  const isUsingDefaultKeys =
    keys?.modelscopeApiKey === getModelScopeKey() &&
    keys?.xingyunAppId === getXingyunAppId() &&
    keys?.xingyunAppSecret === getXingyunAppSecret();

  // 获取密钥状态显示
  const getKeyStatus = () => {
    if (!isInitialized || !keys) {
      return { text: '未配置', color: 'text-red-500', bgColor: 'bg-red-50' };
    }
    if (isUsingDefaultKeys) {
      return { text: '测试密钥', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
    return { text: '已配置', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const status = getKeyStatus();

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition group"
        title="配置 API 密钥"
      >
        {/* 密钥图标 */}
        <svg
          className="w-4 h-4 text-gray-500 group-hover:text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>

        {/* 状态文字 */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.color} ${status.bgColor}`}>
          {status.text}
        </span>

        {/* 设置图标 */}
        <svg
          className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 配置弹窗 */}
      {showModal && (
        <KeyConfigModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default KeyConfigButton;
