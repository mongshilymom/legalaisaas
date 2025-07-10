import Link from 'next/link';

export default function Upgrade() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 text-orange-800 px-6">
      <h1 className="text-3xl font-bold mb-4">🚫 접근 제한</h1>
      <p className="mb-2 text-lg">이 페이지는 프리미엄 요금제 이상에서만 이용할 수 있어요.</p>
      <p className="mb-6">더 많은 기능을 원하신다면 요금제를 업그레이드해 주세요.</p>
      <Link href="/pricing" passHref>
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition">
          요금제 확인하기
        </button>
      </Link>
    </div>
  );
}
