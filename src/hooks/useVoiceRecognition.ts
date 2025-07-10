import { useState, useEffect, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('음성 인식을 지원하지 않는 브라우저입니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError('음성 인식 중 오류 발생: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, []);

  return {
    transcript,
    startListening,
    isListening,
    error,
  };
};