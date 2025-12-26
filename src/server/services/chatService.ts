import modelscopeService from './modelscopeService';
import ragService, { RetrievedDoc } from './ragService';

export interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userProfile?: any;
}

export interface ChatResponse {
  response: string;
  sources?: Array<{
    id: string;
    topic: string;
    category: string;
    score: number;
  }>;
}

export interface StreamChunk {
  type: 'content' | 'sources' | 'end' | 'error';
  data: string | any;
}

export class ChatService {
  private systemPrompt = `你是一个专业的健康咨询助手，名为"健康小助手"。

你的职责：
1. 提供准确的健康咨询建议
2. 解答关于症状、营养、运动、心理健康等问题
3. 识别紧急情况并建议就医
4. 保持专业、友好、关怀的态度

知识库使用规则（非常重要）：
- 如果下方提供了"参考知识库内容"，你必须主要基于这些内容回答用户
- 知识库内容已经经过相似度匹配，与用户问题高度相关
- 如果没有提供"参考知识库内容"，请明确说明："以下是一般的健康建议，但可能与您的情况不完全匹配"
- 优先使用知识库中的具体建议，不要用通用建议替代

知识库覆盖范围：
- 症状咨询：常见症状的原因和建议
- 营养建议：营养素功能、食物来源、缺乏症状
- 运动指导：各类运动方法、注意事项、适合人群
- 心理支持：压力管理、焦虑抑郁应对、睡眠改善、情绪调节
- 紧急情况：危急情况的识别和紧急处理方法

重要原则：
- 不做医学诊断，仅提供参考建议
- 遇到严重症状必须建议及时就医
- 回答要基于专业知识
- 不确定的情况下明确说明
- 保护用户隐私
- 紧急情况优先给出警示和处理建议

回答格式要求：
- 使用简明易懂的语言，避免过多专业术语
- 在适当位置使用 emoji 表情符号让回答更生动友好
- 每个主要建议前加上相关 emoji
- 使用清晰的分段和结构
- 对于紧急情况，必须突出警示并建议立即就医

回答示例格式：
"🌟 关于您的问题，我来给您一些建议：

📍 建议1：具体内容...

📍 建议2：具体内容...

💡 温馨提示：补充说明...

希望这些建议对您有帮助！😊"`;

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const { message, conversationHistory = [], userProfile } = request;

    // 1. 检索相关知识
    const { context: ragContext, sources: ragSources } = await ragService.buildRAGContext(message);

    // 2. 构建消息列表
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.systemPrompt }
    ];

    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`;
    }

    messages.push(...conversationHistory as any);
    messages.push({ role: 'user', content: message });

    // 3. 调用AI生成回复
    const response = await modelscopeService.chat({
      messages,
      temperature: 0.7,
      maxTokens: 1000
    });

    // 4. 格式化知识来源
    const sources = ragSources.length > 0 ? ragSources.map(s => ({
      id: s.id,
      topic: s.metadata.topic || '未知',
      category: s.metadata.category || '未知',
      score: s.score
    })) : undefined;

    return { response, sources };
  }

  async *processChatStream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const { message, conversationHistory = [] } = request;

    console.log('[ChatService] ========== 开始流式处理 ==========');
    console.log(`[ChatService] 📨 收到消息: "${message}"`);
    console.log(`[ChatService] 💬 对话历史长度: ${conversationHistory.length}`);

    const { context: ragContext, sources: ragSources } = await ragService.buildRAGContext(message);

    console.log(`[ChatService] 📚 RAG 上下文长度: ${ragContext.length} 字符`);
    console.log(`[ChatService] 📋 知识来源数量: ${ragSources.length}`);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.systemPrompt }
    ];

    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`;
    }

    messages.push(...conversationHistory as any);
    messages.push({ role: 'user', content: message });

    console.log('[ChatService] 🤖 开始调用 AI 模型生成回复...');

    const stream = modelscopeService.chatStream({
      messages,
      temperature: 0.7,
      maxTokens: 1000
    });

    let chunkCount = 0;
    for await (const chunk of stream) {
      chunkCount++;
      yield { type: 'content', data: chunk };
    }

    console.log(`[ChatService] ✅ AI 回复完成，共 ${chunkCount} 个内容块`);

    // 发送知识来源
    if (ragSources.length > 0) {
      const sources = ragSources.map(s => ({
        id: s.id,
        topic: s.metadata.topic || '未知',
        category: s.metadata.category || '未知',
        score: s.score
      }));
      console.log('[ChatService] 📎 发送知识来源:');
      sources.forEach((s, i) => {
        console.log(`[ChatService]   ${i + 1}. [${s.category}] ${s.topic} (相似度: ${(s.score * 100).toFixed(1)}%)`);
      });
      yield { type: 'sources', data: sources };
    } else {
      console.log('[ChatService] ⚠️ 没有相关的知识来源');
    }

    yield { type: 'end', data: null };
    console.log('[ChatService] ========== 流式处理完成 ==========');
  }

  checkEmergency(message: string): boolean {
    const emergencyKeywords = [
      // 心血管紧急
      '胸痛', '心脏骤停', '心肌梗死', '心脏病发作',
      // 脑血管紧急
      '中风', '脑卒中', '面部下垂', '说话不清',
      // 呼吸紧急
      '呼吸困难', '窒息', '噎住', '过敏休克',
      // 出血
      '大出血', '无法止血',
      // 意识状态
      '昏迷', '意识不清', '失去意识',
      // 创伤
      '严重烧伤', '骨折外露', '严重创伤',
      // 其他紧急
      '中毒', '自杀', '想死', '高热惊厥',
      // 紧急描述
      '救命', '紧急', '叫救护车', '拨打120'
    ];

    return emergencyKeywords.some(keyword => message.includes(keyword));
  }
}

export default new ChatService();
