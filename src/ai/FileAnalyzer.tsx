import React from 'react';
import { useFileAnalysis } from '../hooks/useFileAnalysis';

export const FileAnalyzer = () => {
  const {
    fileInputRef,
    handleFileUpload,
    analysisResult,
    isAnalyzing,
  } = useFileAnalysis();

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-blue-600 text-white py-2 px-4 rounded-md"
      >
        📥 파일 업로드 & 분석 시작
      </button>

      {isAnalyzing && <p>🔍 분석 중입니다...</p>}

      {analysisResult?.type === 'error' && (
        <div className="bg-red-100 text-red-800 p-3 rounded text-sm">
          {analysisResult.message}
        </div>
      )}

      {analysisResult && analysisResult.type !== 'error' && (
        <div className="bg-gray-100 p-4 rounded">
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(analysisResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};