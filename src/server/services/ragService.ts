import fs from 'fs';
import path from 'path';
import axios from 'axios';

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export interface RetrievedDoc {
  id: string;
  content: string;
  metadata: any;
  score: number;
}

export class RAGService {
  private documents: Map<string, { vector: number[]; content: string; metadata: any }> = new Map();
  private initialized = false;
  private apiKey: string;
  private baseURL: string = 'https://api-inference.modelscope.cn/v1';
  private embeddingModel: string = 'Qwen/Qwen3-Embedding-8B';

  constructor() {
    this.apiKey = process.env.MODELSCOPE_API_KEY || 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069';
    console.log('[RAG] API密钥状态:', this.apiKey ? '已加载' : '未加载');
    console.log('[RAG] API密钥前缀:', this.apiKey.substring(0, 15) + '...');
    console.log('[RAG] 环境变量 MODELSCOPE_API_KEY:', process.env.MODELSCOPE_API_KEY ? '存在' : '不存在');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.loadKnowledgeBase();
    this.initialized = true;
  }

  private async loadKnowledgeBase(): Promise<void> {
    const knowledgeDir = path.resolve(process.cwd(), 'data/knowledge');
    const files = ['symptoms.json', 'nutrition.json', 'exercise.json', 'emergency.json', 'chronic.json', 'health_checkup.json', 'medication.json', 'lifestyle.json', 'tcm.json']; // mental.json temporarily disabled due to encoding issue

    for (const file of files) {
      const filePath = path.join(knowledgeDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const documents = this.jsonToDocuments(data);
          await this.addDocuments(documents);
        } catch (error) {
          console.error(`[RAG] 加载知识库文件失败: ${file}`, error);
        }
      } else {
        console.warn(`[RAG] 知识库文件不存在: ${file}`);
      }
    }
  }

  private jsonToDocuments(data: any[]): Document[] {
    return data.map(item => {
      const content = this.formatDocumentContent(item);
      return {
        id: item.id,
        content,
        metadata: {
          category: item.category,
          topic: item.topic || item.nutrient || item.symptom || item.name || item.condition,
          source: 'knowledge_base'
        }
      };
    });
  }

  private formatDocumentContent(item: any): string {
    let content = '';

    switch (item.category) {
      case 'symptom':
        content = `症状：${item.symptom}\n描述：${item.description}`;
        if (item.possible_causes?.length) {
          content += `\n可能原因：${item.possible_causes.join('、')}`;
        }
        if (item.recommendations?.length) {
          content += `\n建议：${item.recommendations.map(r => '• ' + r).join('\n')}`;
        }
        if (item.when_to_see_doctor?.length) {
          content += `\n何时就医：${item.when_to_see_doctor.join('、')}`;
        }
        break;

      case 'nutrition':
        content = `营养素：${item.nutrient}\n功能：${item.function}\n每日推荐摄入：${item.daily_need || item.daily_intake}`;
        if (item.rich_sources?.length) {
          content += `\n富含食物：${item.rich_sources.join('、')}`;
        }
        if (item.deficiency_symptoms?.length) {
          content += `\n缺乏症状：${item.deficiency_symptoms.join('、')}`;
        }
        if (item.tips?.length) {
          content += `\n注意事项：${item.tips.join('、')}`;
        }
        // 处理特殊饮食类型
        if (item.diet_name) {
          content = `【${item.diet_name}】\n适用情况：${item.condition}\n${item.description}`;
          if (item.recommend_foods?.length) {
            content += `\n推荐食物：${item.recommend_foods.join('、')}`;
          }
          if (item.avoid_foods?.length) {
            content += `\n避免食物：${item.avoid_foods.join('、')}`;
          }
          if (item.specific_tips?.length) {
            content += `\n注意事项：${item.specific_tips.join('；')}`;
          }
        }
        break;

      case 'exercise':
        content = `运动：${item.name}\n${item.description}\n益处：${item.benefits.join('、')}\n建议时长：${item.duration}\n建议频率：${item.frequency}`;
        if (item.precautions?.length) {
          content += `\n注意事项：${item.precautions.map(p => '• ' + p).join('\n')}`;
        }
        if (item.suitable_for?.length) {
          content += `\n适合人群：${item.suitable_for.join('、')}`;
        }
        break;

      case 'mental':
        content = `主题：${item.topic}\n${item.description}`;
        if (item.symptoms?.length) {
          content += `\n症状：${item.symptoms.join('、')}`;
        }
        if (item.coping_strategies || item.self_help_methods) {
          const strategies = item.coping_strategies || item.self_help_methods;
          content += `\n应对策略：${strategies.map(s => '• ' + s).join('\n')}`;
        }
        if (item.relaxation_techniques?.length) {
          content += `\n放松技巧：${item.relaxation_techniques.map(t => '• ' + t).join('\n')}`;
        }
        if (item.when_to_seek_help?.length) {
          content += `\n何时寻求专业帮助：${item.when_to_seek_help.join('、')}`;
        }
        break;

      case 'emergency':
        content = `【紧急情况】${item.condition}\n紧急程度：${item.urgency === 'critical' ? '危急' : '紧急'}\n描述：${item.description}`;
        if (item.symptoms?.length) {
          content += `\n症状：${item.symptoms.join('、')}`;
        }
        if (item.immediate_actions?.length) {
          content += `\n立即行动：${item.immediate_actions.map(a => '• ' + a).join('\n')}`;
        }
        if (item.warning) {
          content += `\n⚠️ ${item.warning}`;
        }
        break;
    }

    return content;
  }

  // 调用魔搭Embedding API
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: this.embeddingModel,
          input: text,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时
        }
      );

      if (response.data?.data?.[0]?.embedding) {
        return response.data.data[0].embedding;
      }

      throw new Error('Invalid embedding response format');
    } catch (error: any) {
      console.error('[RAG] Embedding API错误:', error.response?.data || error.message);
      // 返回零向量作为fallback
      return new Array(1024).fill(0); // Qwen3-Embedding-8B的向量维度
    }
  }

  // 余弦相似度计算
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // 使用向量检索文档
  async retrieveDocuments(query: string, topK: number = 5): Promise<RetrievedDoc[]> {
    console.log(`[RAG] 🔍 开始检索，查询: "${query}"`);
    console.log(`[RAG] 📚 知识库文档总数: ${this.documents.size}`);

    try {
      console.log('[RAG] 🧠 生成查询向量...');
      const queryVector = await this.generateEmbedding(query);
      console.log(`[RAG] ✅ 查询向量维度: ${queryVector.length}`);

      const results: RetrievedDoc[] = [];

      for (const [id, doc] of this.documents) {
        const score = this.cosineSimilarity(queryVector, doc.vector);
        results.push({
          id,
          content: doc.content,
          metadata: doc.metadata,
          score
        });
      }

      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, topK);

      console.log(`[RAG] 📊 检索完成，找到 ${topResults.length} 个相关文档:`);
      topResults.forEach((doc, idx) => {
        console.log(`[RAG]   ${idx + 1}. [${doc.metadata.category}] ${doc.metadata.topic} (相似度: ${(doc.score * 100).toFixed(1)}%)`);
      });

      return topResults;
    } catch (error) {
      console.error('[RAG] ❌ 检索错误:', error);
      return [];
    }
  }

  async buildRAGContext(query: string): Promise<{ context: string; sources: RetrievedDoc[] }> {
    console.log(`[RAG] ========== 开始构建 RAG 上下文 ==========`);
    console.log(`[RAG] 📝 用户问题: "${query}"`);

    const allDocs = await this.retrieveDocuments(query, 10);

    // 过滤低相似度结果（阈值 0.45），并只取前5条最相关的
    const SIMILARITY_THRESHOLD = 0.45;
    const docs = allDocs.filter(d => d.score >= SIMILARITY_THRESHOLD).slice(0, 5);

    if (docs.length === 0) {
      console.log('[RAG] ⚠️ 未找到相关文档（未达到相似度阈值）');
      return { context: '', sources: [] };
    }

    console.log(`[RAG] ✨ 开始构建上下文，使用 ${docs.length} 个高相似度文档（阈值: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%）`);

    let context = '参考知识库内容：\n\n';
    docs.forEach((doc, index) => {
      context += `[${index + 1}] ${doc.content}\n`;
      if (doc.metadata.category) {
        context += `(分类: ${doc.metadata.category}, 相似度: ${doc.score.toFixed(3)})\n`;
      }
      context += '\n';
    });

    console.log(`[RAG] 📄 上下文长度: ${context.length} 字符`);
    console.log(`[RAG] ========== RAG 上下文构建完成 ==========`);

    return { context, sources: docs };
  }

  async addDocuments(documents: Document[]): Promise<void> {
    try {
      for (const doc of documents) {
        const embedding = await this.generateEmbedding(doc.content);
        this.documents.set(doc.id, {
          vector: embedding,
          content: doc.content,
          metadata: doc.metadata
        });
      }
      console.log(`[RAG] 成功添加 ${documents.length} 个文档到知识库`);
    } catch (error) {
      console.error('[RAG] 添加文档错误:', error);
      throw error;
    }
  }
}

export default new RAGService();
