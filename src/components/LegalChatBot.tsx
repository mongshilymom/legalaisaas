import React from 'react';
import { useLegalChat } from './useLegalChat';

export const LegalChatBot = () => {
  const { messages, input, setInput, isLoading, handleSendMessage } = useLegalChat();

  return (
    <div className="p-4 space-y-4">
      <div className="h-72 overflow-y-auto bg-gray-50 p-3 rounded shadow-inner">
        {messages.map((msg, i) => (
          <div key={i} className={msg.type === 'user' ? 'text-right mb-2' : 'text-left mb-2'}>
            <span className={msg.type === 'user' ? 'bg-blue-100 inline-block p-2 rounded' : 'bg-green-100 inline-block p-2 rounded'}>
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-gray-500">답변 생성 중...</div>}
      </div>

      <div className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="법무 관련 질문을 입력하세요..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          전송
        </button>
      </div>
    </div>
  );
};