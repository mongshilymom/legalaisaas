import { useState } from 'react';
import { callAI } from './callAI';

interface Message {
  type: 'user' | 'ai';
  text: string;
}

export const useLegalChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'ai', text: '안녕하세요! 법무 관련 질문이 있으시면 언제든지 말씀해주세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { type: 'user', text: input }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await callAI(`법무 질문: ${input}\n전문 변호사처럼 답변해줘`);
      setMessages([...newMessages, { type: 'ai', text: response }]);
    } catch (error) {
      setMessages([...newMessages, { type: 'ai', text: '⚠️ 답변 생성 중 오류가 발생했습니다.' }]);
    }

    setInput('');
    setIsLoading(false);
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSendMessage,
  };
};