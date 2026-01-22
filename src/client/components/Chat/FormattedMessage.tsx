import React from 'react';

interface FormattedMessageProps {
  content: string;
}

/**
 * 格式化 AI 回复消息 - 纯富文本展示
 * 将纯文本转换为带有样式和 emoji 的富文本，不使用任何 Markdown 格式
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  // 清理 Markdown 格式符号
  const cleanMarkdown = (text: string): string => {
    // 移除加粗标记 **text**
    let cleaned = text.replace(/\*\*(.+?)\*\*/g, '$1');
    // 移除斜体标记 *text*
    cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
    // 移除代码标记 `text`
    cleaned = cleaned.replace(/`(.+?)`/g, '$1');
    // 移除链接标记 [text](url)
    cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1');
    return cleaned;
  };

  // 将文本分段处理
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inList = false;

    lines.forEach((line, index) => {
      // 跳过空行
      if (!line.trim()) {
        if (inList) {
          result.push(
            <ul key={`list-${index}`} className="my-3 space-y-1.5 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-gray-700">{cleanMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        return;
      }

      // 检测列表项（以 emoji + 数字/圆点 开头）- 使用通用 emoji 匹配
      const listItemMatch = line.match(/^(\p{Emoji}+)\s*(\d+\.|)?\s*(.+)$/u);

      if (listItemMatch) {
        const [, emoji, num, itemContent] = listItemMatch;
        currentList.push(`${emoji} ${num || ''} ${itemContent}`);
        inList = true;
      } else {
        // 如果之前在列表中，先输出列表
        if (inList) {
          result.push(
            <ul key={`list-${index}`} className="my-3 space-y-1.5 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-gray-700">{cleanMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }

        // 检测标题（以 emoji 开头的行）- 使用通用 emoji 匹配
        const titleMatch = line.match(/^(\p{Emoji}+)\s*(.+)$/u);

        if (titleMatch) {
          const [, emoji, title] = titleMatch;
          result.push(
            <h3 key={`title-${index}`} className="text-base font-semibold text-gray-800 mt-4 mb-2 flex items-center gap-2">
              <span>{emoji}</span>
              <span>{cleanMarkdown(title)}</span>
            </h3>
          );
        } else {
          // 普通段落 - 清理 Markdown 后显示
          result.push(
            <p key={`para-${index}`} className="text-sm text-gray-700 leading-relaxed my-2">
              {cleanMarkdown(line)}
            </p>
          );
        }
      }
    });

    // 处理最后剩余的列表
    if (inList && currentList.length > 0) {
      result.push(
        <ul key="list-final" className="my-3 space-y-1.5 ml-4">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span className="text-gray-700">{cleanMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return result;
  };

  return (
    <div className="formatted-message space-y-1">
      {formatContent(content)}
    </div>
  );
};

export default FormattedMessage;
