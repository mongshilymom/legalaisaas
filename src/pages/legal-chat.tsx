import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const predefinedQuestions = [
  "계약서 작성 시 주의사항은 무엇인가요?",
  "근로계약서에서 필수 포함 조항은?",
  "비밀유지계약서의 법적 효력은?",
  "프리랜서 계약 시 세금 문제는?",
  "계약 위반 시 손해배상 범위는?",
  "전자계약서의 법적 효력은?",
  "계약서 번역 시 주의사항은?",
  "국제계약서 작성 가이드라인은?"
];

export default function LegalChat() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) {
      router.push('/api/auth/signin');
    }
  }, [session, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat/legal', {
        message: content.trim(),
        history: messages.slice(-5) // 최근 5개 메시지만 컨텍스트로 전송
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('답변 생성 중 오류가 발생했습니다.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handlePredefinedQuestion = (question: string) => {
    sendMessage(question);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <h1 className="text-2xl font-bold text-gray-900">법률 AI 상담</h1>
            <p className="text-sm text-gray-600 mt-1">
              법률 관련 질문을 자유롭게 물어보세요. AI가 도움을 드립니다.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500">
                <div className="mb-4">
                  <p className="text-lg font-medium">안녕하세요! 법률 AI 상담입니다.</p>
                  <p className="text-sm mt-2">아래 자주 묻는 질문을 클릭하거나 직접 질문해보세요.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-3xl mx-auto">
                  {predefinedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handlePredefinedQuestion(question)}
                      className="p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>답변 생성 중...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="법률 관련 질문을 입력하세요..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                전송
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ 이 서비스는 일반적인 법률 정보를 제공하며, 전문적인 법률 조언을 대체하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}