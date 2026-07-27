import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && !hasLoadedHistory) {
      loadHistory();
    }
  }, [isOpen, hasLoadedHistory]);

  const loadHistory = async () => {
    try {
      const response = await api.get(`/chat/history/${sessionId}`);
      if (response.data.history?.length) {
        setMessages(response.data.history);
      }
      setHasLoadedHistory(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setHasLoadedHistory(true);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Add user message immediately
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        message: text,
        sessionId,
      });

      const botMessage = { role: 'model', content: response.data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'model',
        content: 'ขออภัยครับ/ค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งครับ/ค่ะ',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!prev) {
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('ล้างประวัติการแชททั้งหมดใช่หรือไม่ครับ/ค่ะ?')) return;
    try {
      await api.delete(`/chat/history/${sessionId}`);
      setMessages([]);
      setHasLoadedHistory(false);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30"
        aria-label="เปิดแชทพี่ออมทรัพย์"
        title="พี่ออมทรัพย์ - ผู้ช่วยสหกรณ์"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1.5 text-[10px] font-bold text-brand-dark">
          1
        </span>
      </button>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className="fixed bottom-5 right-5 z-50 flex h-[550px] w-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl transition-all duration-300 ease-out sm:max-h-[90vh] sm:max-w-[95vw] md:bottom-6 md:right-6 lg:h-[550px] lg:w-[380px]"
      role="dialog"
      aria-label="แชทพี่ออมทรัพย์"
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-brand-gradient p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">พี่ออมทรัพย์</h3>
            <p className="text-[11px] text-white/80">ผู้ช่วยสหกรณ์โรงเรียน</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            title="ล้างประวัติแชท"
            aria-label="ล้างประวัติแชท"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={toggleChat}
            className="p-2 rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            title="ปิดแชท"
            aria-label="ปิดแชท"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite" aria-label="ข้อความแชท">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
              <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">สวัสดีครับ/ค่ะ! ผมคือพี่ออมทรัพย์</p>
            <p className="mt-1 text-xs text-muted">มีอะไรเกี่ยวกับสหกรณ์ให้ช่วยไหมครับ/คะ?</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center px-2">
              {[
                'สมัครสมาชิกต้องซื้อหุ้นกี่หุ้น?',
                'เงินปันผลคิดยังไง?',
                'เงินเฉลี่ยคืนต้องบอกเลขสมาชิกทุกครั้งหรือ?',
                'เวลาทำการสหกรณ์เป็นอย่างไร?',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(suggestion);
                    sendMessage({ preventDefault: () => {} });
                  }}
                  className="text-xs rounded-full border border-line bg-surface px-3 py-1.5 text-muted transition hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-brand-blue text-white rounded-tr-md'
                  : 'bg-surface-2 text-ink rounded-tl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-center gap-1 rounded-2xl bg-surface-2 px-4 py-2.5 rounded-tl-md">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="ml-1 text-xs text-muted">พี่ออมทรัพย์กำลังพิมพ์...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="shrink-0 border-t border-line bg-surface p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความที่นี่... (Enter เพื่อส่ง)"
            className="flex-1 min-w-0 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-blue focus:bg-surface focus:ring-4 focus:ring-brand-blue/15"
            disabled={isLoading}
            aria-label="พิมพ์ข้อความ"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="ส่งข้อความ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted/70">
          ⚠️ โปรดอย่าส่งข้อมูลส่วนบุคคล (เลขบัตรประชาชน, บัญชีธนาคาร, รหัสผ่าน, OTP) ในแชทนี้ครับ/ค่ะ
        </p>
      </form>
    </div>
  );
}

export default ChatWidget;