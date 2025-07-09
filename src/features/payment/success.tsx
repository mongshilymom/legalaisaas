import React from 'react';
import Link from 'next/link';

export default function Success() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-green-800 px-4">
      <h1 className="text-3xl font-bold mb-4">🎉 결제가 성공적으로 완료되었습니다!</h1>
      <p className="mb-2 text-lg">이제 프리미엄 기능을 모두 사용할 수 있어요.</p>
      <ul className="list-disc list-inside text-left mb-4">
        <li>📄 고급 계약서 생성</li>
        <li>🔍 리스크 분석 리포트</li>
        <li>🌐 다국어 지원</li>
        <li>🔒 보안 인증 기능</li>
      </ul>
      <p className="mb-6">AI 계약 어시스턴트가 준비되어 있어요. 지금 시작해보세요!</p>
      <Link href="/" passHref>
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition">
          홈으로 돌아가기
        </button>
      </Link>
    </div>
  );
}
