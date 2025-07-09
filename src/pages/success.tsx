import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { savePurchase } from '../utils/savePurchase';

const Success = () => {
  const router = useRouter();
  const { session_id } = router.query;

  useEffect(() => {
    if (session_id) {
      savePurchase(session_id as string);
    }
  }, [session_id]);

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-green-600">✅ 결제가 완료되었습니다!</h1>
      <p className="mt-4">구매가 성공적으로 처리되었으며, 결제 정보가 저장되었습니다.</p>
    </div>
  );
};

export default Success;