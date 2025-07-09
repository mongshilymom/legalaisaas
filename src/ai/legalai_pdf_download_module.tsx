import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button'; // 예시 컴포넌트
import { useState } from 'react';

interface AnalysisResult {
  contractContent: string;
  type?: 'success' | 'error';
  message?: string;
}

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export const useDownloadContract = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    contractContent: '',
  });

  const downloadContract = useCallback((content: string, fileName: string) => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');
      doc.setFontSize(12);

      const formattedText = `
        ${fileName}
        생성일: ${new Date().toLocaleDateString('ko-KR')}
        생성 시간: ${new Date().toLocaleTimeString('ko-KR')}

        ${content}

        * 본 계약서는 Legal AI Pro에서 생성되었습니다.
        * 정식 계약 체결 전 법무 전문가의 검토를 권장합니다.
      `;

      const splitText = doc.splitTextToSize(formattedText, 180);
      doc.text(splitText, 15, 15);

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const element = document.createElement('a');
      element.href = url;
      element.download = \`\${sanitizeInput(fileName)}_계약서_\${new Date().toISOString().split('T')[0]}.pdf\`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);

      setAnalysisResult({
        contractContent: content,
        type: 'success',
        message: '📄 계약서 PDF 다운로드가 완료되었습니다!',
      });
    } catch (error) {
      setAnalysisResult({
        contractContent: content,
        type: 'error',
        message: '⚠️ PDF 생성 중 오류가 발생했습니다.',
      });
    }
  }, []);

  return { downloadContract, analysisResult };
};

// 예시 UI 컴포넌트
export const ContractDownloadButton = ({ content, fileName }: { content: string; fileName: string }) => {
  const { downloadContract, analysisResult } = useDownloadContract();

  return (
    <div>
      <Button onClick={() => downloadContract(content, fileName)}>📥 계약서 PDF 다운로드</Button>

      {analysisResult?.type === 'success' && (
        <div className="bg-green-100 text-green-800 p-3 rounded mt-4 text-sm">
          {analysisResult.message}
        </div>
      )}

      {analysisResult?.type === 'error' && (
        <div className="bg-red-100 text-red-800 p-3 rounded mt-4 text-sm">
          {analysisResult.message}
        </div>
      )}
    </div>
  );
};