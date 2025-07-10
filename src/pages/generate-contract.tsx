import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';

interface ContractTemplate {
  id: string;
  name: string;
  fields: ContractField[];
}

interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: 'freelancer',
    name: '프리랜서 계약서',
    fields: [
      { id: 'clientName', label: '클라이언트명', type: 'text', required: true, placeholder: '회사명 또는 개인명' },
      { id: 'freelancerName', label: '프리랜서명', type: 'text', required: true, placeholder: '본인 이름' },
      { id: 'projectDescription', label: '프로젝트 설명', type: 'textarea', required: true, placeholder: '수행할 업무 내용' },
      { id: 'amount', label: '계약 금액', type: 'number', required: true, placeholder: '원' },
      { id: 'startDate', label: '시작일', type: 'date', required: true },
      { id: 'endDate', label: '종료일', type: 'date', required: true },
      { id: 'paymentTerms', label: '지급 조건', type: 'select', required: true, options: ['선불', '후불', '분할 지급'] }
    ]
  },
  {
    id: 'employment',
    name: '근로 계약서',
    fields: [
      { id: 'companyName', label: '회사명', type: 'text', required: true },
      { id: 'employeeName', label: '근로자명', type: 'text', required: true },
      { id: 'position', label: '직위', type: 'text', required: true },
      { id: 'salary', label: '급여', type: 'number', required: true, placeholder: '월급 (원)' },
      { id: 'startDate', label: '근무 시작일', type: 'date', required: true },
      { id: 'workLocation', label: '근무지', type: 'text', required: true },
      { id: 'workHours', label: '근무시간', type: 'text', required: true, placeholder: '09:00~18:00' }
    ]
  },
  {
    id: 'nda',
    name: '비밀유지 계약서',
    fields: [
      { id: 'disclosingParty', label: '정보 제공자', type: 'text', required: true },
      { id: 'receivingParty', label: '정보 수신자', type: 'text', required: true },
      { id: 'purposeOfDisclosure', label: '정보 제공 목적', type: 'textarea', required: true },
      { id: 'confidentialityPeriod', label: '비밀유지 기간', type: 'select', required: true, options: ['1년', '2년', '3년', '5년', '영구'] },
      { id: 'penaltyAmount', label: '위약금', type: 'number', required: false, placeholder: '원 (선택사항)' }
    ]
  }
];

export default function GenerateContract() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContract, setGeneratedContract] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setFormData({});
    setGeneratedContract('');
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const generateContract = async () => {
    if (!selectedTemplate) {
      toast.error('계약서 템플릿을 선택해주세요.');
      return;
    }

    const template = contractTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // 필수 필드 검증
    const requiredFields = template.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.id]);
    
    if (missingFields.length > 0) {
      toast.error(`필수 항목을 모두 입력해주세요: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await axios.post('/api/contract/generate', {
        templateId: selectedTemplate,
        formData
      });

      setGeneratedContract(response.data.contract);
      toast.success('계약서가 생성되었습니다!');
    } catch (error) {
      console.error('Contract generation error:', error);
      toast.error('계약서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedContract) return;

    const doc = new jsPDF();
    
    // 한글 폰트 설정 (기본 폰트 사용)
    doc.setFont('helvetica');
    doc.setFontSize(12);
    
    // 텍스트를 여러 줄로 분할하여 PDF에 추가
    const lines = generatedContract.split('\n');
    let yPosition = 20;
    
    lines.forEach(line => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    doc.save('contract.pdf');
    toast.success('PDF가 다운로드되었습니다!');
  };

  const copyToClipboard = () => {
    if (!generatedContract) return;
    
    navigator.clipboard.writeText(generatedContract);
    toast.success('클립보드에 복사되었습니다!');
  };

  const currentTemplate = contractTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">계약서 생성기</h1>
          
          {/* 템플릿 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약서 템플릿 선택
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">템플릿을 선택하세요</option>
              {contractTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* 입력 폼 */}
          {currentTemplate && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentTemplate.name} 정보 입력
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTemplate.fields.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택하세요</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 생성 버튼 */}
          {currentTemplate && (
            <div className="mb-6">
              <button
                onClick={generateContract}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? '생성 중...' : 'AI 계약서 생성'}
              </button>
            </div>
          )}

          {/* 생성된 계약서 */}
          {generatedContract && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">생성된 계약서</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    복사
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    PDF 다운로드
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {generatedContract}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}