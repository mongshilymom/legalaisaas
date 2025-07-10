import { useState, useRef, useCallback } from 'react';
import { callAI } from './callAI';

const cache = new Map<string, any>();

export const useFileAnalysis = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAnalysisResult({ type: 'error', message: '파일 크기는 10MB 이하로 제한됩니다.' });
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setAnalysisResult({ type: 'error', message: 'PDF, DOCX, TXT 파일만 지원됩니다.' });
      return;
    }

    setIsAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const content = reader.result as string;
        const cacheKey = content.slice(0, 500); // 단순 캐시 키

        if (cache.has(cacheKey)) {
          setAnalysisResult(cache.get(cacheKey));
        } else {
          const prompt = `다음 문서를 분석하여 위험 요소와 개선 제안을 JSON으로 반환:
${content}`;
          const response = await callAI(prompt);
          const result = JSON.parse(response);
          setAnalysisResult(result);
          cache.set(cacheKey, result);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setAnalysisResult({ type: 'error', message: '문서 분석 중 오류 발생' });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    fileInputRef,
    handleFileUpload,
    analysisResult,
    isAnalyzing,
  };
};