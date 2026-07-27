import express from 'express';
import crypto from 'crypto';
import https from 'https';

const router = express.Router();

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3-next-80b-a3b-instruct:free';

// System Instruction
const SYSTEM_INSTRUCTION = `
คุณคือ "พี่ออมทรัพย์" ผู้ช่วย AI ของสหกรณ์โรงเรียน เป็นรุ่นพี่ใจดี สุภาพ ใช้ภาษาที่เป็นมิตร และตอบเป็นภาษาไทยครับ/ค่ะ

📋 ข้อมูลสหกรณ์โรงเรียน (FAQ คลังข้อมูลหลัก):

1. เวลาทำการ:
เปิดให้บริการวันจันทร์-ศุกร์ เวลา 07:30 - 15:30 น.
ปิดวันเสาร์-อาทิตย์ และวันหยุดราชการครับ/ค่ะ

2. การสมัครสมาชิกใหม่:
ต้องซื้อหุ้นแรกเข้า 10 หุ้น หุ้นละ 10 บาท รวม 100 บาท
นำเงิน 100 บาทไปชำระที่สหกรณ์ได้เลยครับ/ค่ะ

3. เงินปันผล:
อัตรา 5% ต่อปี คิดจากมูลค่าหุ้นที่ถือครอง
เช่น ถือ 100 หุ้น มูลค่า 1,000 บาท จะได้ปันผลปีละ 50 บาทครับ/ค่ะ

4. เงินเฉลี่ยคืน:
อัตรา 3% คิดจากยอดซื้อสินค้า/บริการตลอดปี
สำคัญ: ต้องบอกเลขสมาชิกทุกครั้งที่ซื้อของ เพื่อให้ระบบบันทึกยอดซื้อครับ/ค่ะ
หากไม่บอกเลขสมาชิก จะไม่ได้รับสิทธิ์เงินเฉลี่ยคืนรายการนั้นครับ/ค่ะ

5. การจ่ายเงินปันผลและเงินเฉลี่ยคืน:
จ่ายประจำปีช่วงสัปดาห์สุดท้ายของเดือนมีนาคมทุกปี
สมาชิกสามารถมารับได้ที่สหกรณ์ในเวลาทำการครับ/ค่ะ

6. ความปลอดภัยข้อมูลส่วนบุคคล:
ห้ามบอกข้อมูลส่วนบุคคลในแชทนี้ เช่น:
- เลขบัตรประชาชน
- หมายเลขบัญชีธนาคาร
- รหัสผ่าน
- OTP
- ที่อยู่
- เบอร์โทรศัพท์

หากต้องทำธุรกรรมจริง กรุณาติดต่อเจ้าหน้าที่สหกรณ์โดยตรงครับ/ค่ะ

7. ขั้นตอนการลาออก/รับเงินคืนเมื่อเรียนจบหรือย้ายโรงเรียน:
- นำบัตรสมาชิกและบัตรประชาชนหรือสำเนามาที่สหกรณ์
- กรอกแบบฟอร์มลาออกที่สหกรณ์
- เจ้าหน้าที่ตรวจสอบยอดหุ้นและเงินกู้ถ้ามี
- หากไม่มีหนี้ค้าง จะได้รับเงินหุ้นคืนเต็มจำนวน
- หากมีเงินกู้ค้าง จะหักชำระหนี้ก่อน แล้วคืนส่วนต่าง
- สามารถมารับเงินได้ในเวลาทำการ 07:30-15:30 น.

🎯 แนวทางการตอบ:
- ตอบสั้น กระชับ และเป็นประโยชน์
- ใช้โทนรุ่นพี่ใจดี สุภาพ
- ใช้คำลงท้าย "ครับ/ค่ะ" อย่างเหมาะสม
- หากคำถามไม่อยู่ในข้อมูลข้างต้น ให้แนะนำให้ติดต่อเจ้าหน้าที่สหกรณ์โดยตรงครับ/ค่ะ
- ห้ามสร้างข้อมูลขึ้นมาเอง
- หากผู้ใช้ถามข้อมูลส่วนบุคคล ให้ปฏิเสธและแนะนำให้ติดต่อเจ้าหน้าที่โดยตรงครับ/ค่ะ
`;

// In-memory chat history storage
const chatSessions = new Map();

// Clean old sessions periodically
setInterval(() => {
  const now = Date.now();

  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.lastActivity > 3600000) {
      chatSessions.delete(sessionId);
    }
  }
}, 300000);

// Helper: Call OpenRouter API
const callOpenRouter = (messages, retryCount = 0) => {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 500,
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'TK Easy Store',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const responseData = JSON.parse(body);
            const text = responseData?.choices?.[0]?.message?.content;
            if (text) {
              resolve(text);
            } else {
              reject(new Error('No response content'));
            }
          } catch (e) {
            reject(e);
          }
        } else if (res.statusCode === 429 && retryCount < 2) {
          // Retry on rate limit
          setTimeout(() => {
            callOpenRouter(messages, retryCount + 1).then(resolve).catch(reject);
          }, 3000);
        } else {
          reject(new Error(`OpenRouter HTTP Error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
};

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, sessionId: incomingSessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'ข้อความไม่ถูกต้อง',
      });
    }

    // สร้าง sessionId หาก frontend ไม่ได้ส่งมา
    const sessionId =
      incomingSessionId || crypto.randomUUID();

    // Get or create session
    let session = chatSessions.get(sessionId);

    if (!session) {
      session = {
        history: [],
        lastActivity: Date.now(),
      };

      chatSessions.set(sessionId, session);
    }

    session.lastActivity = Date.now();

    // Add user message to history
    session.history.push({ role: 'user', content: message });

    // Keep only last 6 messages
    const MAX_HISTORY = 6;
    if (session.history.length > MAX_HISTORY) {
      session.history = session.history.slice(-MAX_HISTORY);
    }

    // Prepare messages for API
    const payloadMessages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...session.history,
    ];

    // Call OpenRouter
    const botResponse = await callOpenRouter(payloadMessages);

    // Add bot response to history
    session.history.push({ role: 'assistant', content: botResponse });

    if (session.history.length > MAX_HISTORY) {
      session.history = session.history.slice(-MAX_HISTORY);
    }

    res.json({
      response: botResponse,
      sessionId,
    });
  } catch (error) {
    console.error('Chat API Error:', error);

    // Fallback responses
    const userMessage = req.body.message || '';
    let mockReply = 'สวัสดีครับ ยินดีต้อนรับสู่สหกรณ์โรงเรียน TK EASY STORE ครับ! มีอะไรให้พี่ออมทรัพย์ช่วยเหลือไหมครับ/คะ?';

    if (userMessage.includes('เปิด') || userMessage.includes('เวลา')) {
      mockReply = 'ร้านสหกรณ์ของเราเปิดให้บริการทุกวันจันทร์ - ศุกร์ ตั้งแต่เวลา 07:30 ถึง 15:30 น. ครับ! ปิดวันเสาร์-อาทิตย์ และวันหยุดราชการครับ/ค่ะ';
    } else if (userMessage.includes('สมัคร') || userMessage.includes('สมาชิก')) {
      mockReply = 'การสมัครสมาชิกใหม่ ง่ายมากเลยครับ! แค่เตรียมเงิน 100 บาท (สำหรับซื้อหุ้นแรกเข้า 10 หุ้น หุ้นละ 10 บาท) แล้วมาติดต่อขอสมัครกับเจ้าหน้าที่ที่ร้านสหกรณ์ได้เลยครับ/ค่ะ';
    } else if (userMessage.includes('ปันผล') || userMessage.includes('เงินปันผล')) {
      mockReply = 'สหกรณ์คิดอัตราเงินปันผลให้ 5% ต่อปี จากมูลค่าหุ้นทั้งหมดที่ถือครองครับ เช่น ถือหุ้นไว้ 1,000 บาท จะได้รับเงินปันผลประจำปี 50 บาท ซึ่งจะจ่ายในช่วงสัปดาห์สุดท้ายของเดือนมีนาคมทุกปีครับ/ค่ะ';
    }

    res.json({
      response: mockReply,
      sessionId: req.body.sessionId,
      note: 'Fallback active',
    });
  }
});

router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = chatSessions.get(sessionId);

  if (!session) {
    return res.json({
      history: [],
    });
  }

  const formattedHistory = session.history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    content: msg.content || '',
  }));

  res.json({
    history: formattedHistory,
  });
});

router.delete('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  chatSessions.delete(sessionId);

  res.json({
    success: true,
  });
});

export default router;