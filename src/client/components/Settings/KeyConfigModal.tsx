import React, { useState } from 'react';
import { useKeyStore, DEFAULT_KEYS } from '../../store/keyStore';

interface KeyConfigModalProps {
  onClose: () => void;
}

/**
 * 密钥配置弹窗组件
 */
export const KeyConfigModal: React.FC<KeyConfigModalProps> = ({ onClose }) => {
  const { setKeys } = useKeyStore();
  const [formData, setFormData] = useState({
    modelscopeApiKey: '',
    xingyunAppId: '',
    xingyunAppSecret: '',
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    modelscope: boolean | null;
    xingyun: boolean | null;
    message: string;
  }>({ modelscope: null, xingyun: null, message: '' });

  // 使用测试密钥
  const handleUseTestKeys = () => {
    setFormData(DEFAULT_KEYS);
    setValidationResult({ modelscope: null, xingyun: null, message: '' });
  };

  // 验证密钥
  const handleValidateKeys = async () => {
    if (!formData.modelscopeApiKey || !formData.xingyunAppId || !formData.xingyunAppSecret) {
      setValidationResult({
        modelscope: false,
        xingyun: false,
        message: '⚠️ 请先填写所有密钥字段'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ modelscope: null, xingyun: null, message: '正在检测密钥...' });

    try {
      // 验证 ModelScope 密钥（发API请求）
      let modelscopeValid = false;
      try {
        const response = await fetch('https://api-inference.modelscope.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${formData.modelscopeApiKey}`,
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }),
        });
        modelscopeValid = response.ok;
      } catch (e) {
        modelscopeValid = false;
      }

      // 验证星云密钥格式（32位十六进制）
      const xingyunValid =
        formData.xingyunAppId.length === 32 &&
        /^[a-f0-9]{32}$/i.test(formData.xingyunAppId) &&
        formData.xingyunAppSecret.length === 32 &&
        /^[a-f0-9]{32}$/i.test(formData.xingyunAppSecret);

      // 设置验证结果
      if (modelscopeValid && xingyunValid) {
        setValidationResult({
          modelscope: true,
          xingyun: true,
          message: '✅ 密钥可用！'
        });
      } else if (modelscopeValid) {
        setValidationResult({
          modelscope: true,
          xingyun: false,
          message: '⚠️ 魔搭密钥可用，但星云密钥格式不正确（应为32位十六进制）'
        });
      } else if (xingyunValid) {
        setValidationResult({
          modelscope: false,
          xingyun: true,
          message: '⚠️ 星云密钥格式正确，但魔搭密钥无效'
        });
      } else {
        setValidationResult({
          modelscope: false,
          xingyun: false,
          message: '❌ 密钥无效，请检查后重试'
        });
      }
    } catch (error: any) {
      setValidationResult({
        modelscope: false,
        xingyun: false,
        message: `❌ 检测失败: ${error.message}`
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = () => {
    if (!formData.modelscopeApiKey || !formData.xingyunAppId || !formData.xingyunAppSecret) {
      alert('请填写所有密钥字段');
      return;
    }
    setKeys(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">配置 API 密钥</h2>
          <p className="text-sm text-gray-500 mt-1">
            配置密钥以启用完整功能
          </p>
        </div>

        {/* 表单内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* ModelScope API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ModelScope API Key
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.modelscopeApiKey}
              onChange={(e) => setFormData({ ...formData, modelscopeApiKey: e.target.value })}
              placeholder="ms-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              获取地址:{' '}
              <a
                href="https://modelscope.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                modelscope.cn
              </a>
            </p>
          </div>

          {/* 星云 App ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              星云 App ID
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.xingyunAppId}
              onChange={(e) => setFormData({ ...formData, xingyunAppId: e.target.value })}
              placeholder="32位十六进制字符串"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              获取地址:{' '}
              <a
                href="https://nebula.xingyun3d.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                nebula.xingyun3d.com
              </a>
            </p>
          </div>

          {/* 星云 App Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              星云 App Secret
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              value={formData.xingyunAppSecret}
              onChange={(e) => setFormData({ ...formData, xingyunAppSecret: e.target.value })}
              placeholder="32位十六进制字符串"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 检测结果提示 */}
          {validationResult.message && (
            <div className={`p-3 rounded-lg text-sm ${
              validationResult.modelscope && validationResult.xingyun
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {validationResult.message}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex flex-col space-y-3">
            {/* 辅助操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleUseTestKeys}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                使用测试密钥
              </button>
              <button
                onClick={handleValidateKeys}
                disabled={isValidating}
                className={`flex-1 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition flex items-center justify-center ${
                  isValidating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'
                }`}
              >
                {isValidating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    检测中...
                  </>
                ) : (
                  '检测密钥'
                )}
              </button>
            </div>

            {/* 主操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyConfigModal;
