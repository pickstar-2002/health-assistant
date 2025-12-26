import { Router } from 'express';
import chatService from '../services/chatService';

const router = Router();

router.post('/send', async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    console.log('[Chat Routes] Received message:', message);

    if (chatService.checkEmergency(message)) {
      return res.json({
        success: true,
        isEmergency: true,
        response: '检测到您描述的是紧急医疗情况，请立即拨打120急救电话或前往最近的医院就医！'
      });
    }

    const result = await chatService.processChat({
      message,
      conversationHistory,
      userProfile
    });

    console.log('[Chat Routes] Response:', result.response?.substring(0, 100));

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('[Chat Routes] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '处理对话时发生错误'
    });
  }
});

router.post('/stream', async (req, res) => {
  try {
    const { message, conversationHistory, userProfile } = req.body;

    console.log('[Stream Routes] Received message:', message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送开始事件
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    const stream = chatService.processChatStream({
      message,
      conversationHistory,
      userProfile
    });

    for await (const chunk of stream) {
      // chunk已经是{type, data}格式了
      const event = `data: ${JSON.stringify(chunk)}\n\n`;
      res.write(event);
    }

    res.end();
  } catch (error: any) {
    console.error('[Stream Routes] Error:', error);
    const errorEvent = `data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`;
    res.write(errorEvent);
    res.end();
  }
});

export default router;
