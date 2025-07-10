import React, { useEffect } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';

interface Props {
  onVoiceInputComplete: (text: string) => void;
}

export const VoiceChatInput = ({ onVoiceInputComplete }: Props) => {
  const { transcript, startListening, isListening, error } = useVoiceRecognition();

  useEffect(() => {
    if (transcript) {
      onVoiceInputComplete(transcript);
    }
  }, [transcript, onVoiceInputComplete]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={startListening}
        className="bg-purple-600 text-white px-4 py-2 rounded-md"
      >
        🎙️ 말로 질문하기 {isListening ? ' (듣는 중...)' : ''}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};