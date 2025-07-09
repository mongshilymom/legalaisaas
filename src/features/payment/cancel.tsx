import React from 'react';
import Link from 'next/link';

export default function Cancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 px-4">
      <h1 className="text-3xl font-bold mb-4">❌ 결제가 취소되었습니다</h1>
      <p className="mb-4 text-lg">프리미엄 계약 기능을 사용하려면 결제가 필요해요.</p>
      <p className="mb-6">언제든지 다시 시도하실 수 있습니다. 문제가 있으시면 고객지원에 문의해주세요.</p>
      <div className="flex space-x-4">
        <Link href="/" passHref>
          <button className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition">
            홈으로 돌아가기
          </button>
        </Link>
        <Link href="/pricing" passHref>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition">
            다시 결제 시도하기
          </button>
        </Link>
      </div>
    </div>
  );
}
