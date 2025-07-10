import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface PlanRecommendation {
  recommendedPlan: string;
  currentPlan: string;
  reason: string;
  benefits: string[];
  costSavings?: number;
  urgency: 'low' | 'medium' | 'high';
  usageStats: {
    contractsGenerated: number;
    chatMessages: number;
    documentsAnalyzed: number;
    lastActiveDate: string;
  };
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string | null;
}

const planOptions: PlanOption[] = [
  {
    id: 'basic',
    name: '기본 플랜',
    price: 0,
    features: ['월 3회 계약서 생성', '기본 법률 상담', '표준 템플릿'],
    stripePriceId: null
  },
  {
    id: 'premium',
    name: '프리미엄 플랜',
    price: 19000,
    features: ['월 15회 계약서 생성', '고급 법률 상담', '전문 템플릿', 'PDF 다운로드'],
    stripePriceId: 'price_premium'
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈 플랜',
    price: 99000,
    features: ['무제한 계약서 생성', '전문 법률 상담', '커스텀 템플릿', 'API 접근', '우선 지원'],
    stripePriceId: 'price_enterprise'
  }
];

export default function RecommendPrice() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [recommendation, setRecommendation] = useState<PlanRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    fetchRecommendation();
  }, [session, router]);

  const fetchRecommendation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/plan/recommend');
      setRecommendation(response.data);
    } catch (error) {
      console.error('Recommendation fetch error:', error);
      toast.error('추천 요금제를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    try {
      const response = await axios.post('/api/payment/create-checkout-session', {
        planId,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/recommend-price`
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('업그레이드 중 오류가 발생했습니다.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      default: return '여유';
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">추천 요금제를 분석하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">맞춤형 요금제 추천</h1>
          <p className="text-gray-600">사용 패턴을 분석하여 최적의 요금제를 추천해드립니다.</p>
        </div>

        {recommendation && (
          <>
            {/* 사용량 통계 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">사용량 분석</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{recommendation.usageStats.contractsGenerated}</div>
                  <div className="text-sm text-gray-600">계약서 생성</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{recommendation.usageStats.chatMessages}</div>
                  <div className="text-sm text-gray-600">법률 상담</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{recommendation.usageStats.documentsAnalyzed}</div>
                  <div className="text-sm text-gray-600">문서 분석</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                마지막 활동: {new Date(recommendation.usageStats.lastActiveDate).toLocaleDateString()}
              </div>
            </div>

            {/* 추천 결과 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">AI 추천 결과</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(recommendation.urgency)}`}>
                  {getUrgencyText(recommendation.urgency)}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>현재 플랜:</strong> {recommendation.currentPlan}
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>추천 플랜:</strong> {recommendation.recommendedPlan}
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">추천 사유</h3>
                  <p className="text-blue-800">{recommendation.reason}</p>
                </div>
              </div>

              {recommendation.benefits.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">업그레이드 혜택</h3>
                  <ul className="space-y-1">
                    {recommendation.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-green-500 mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendation.costSavings && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-1">예상 비용 절약</h3>
                  <p className="text-green-800">
                    월 {recommendation.costSavings.toLocaleString()}원 절약 가능
                  </p>
                </div>
              )}
            </div>

            {/* 요금제 옵션 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">요금제 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planOptions.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-4 ${
                      plan.name === recommendation.recommendedPlan
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <div className="text-2xl font-bold text-blue-600 mt-2">
                        {plan.price === 0 ? '무료' : `${plan.price.toLocaleString()}원`}
                        {plan.price > 0 && <span className="text-sm text-gray-500">/월</span>}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading || plan.name === recommendation.currentPlan}
                      className={`w-full py-2 px-4 rounded-lg transition-colors ${
                        plan.name === recommendation.currentPlan
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : plan.name === recommendation.recommendedPlan
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {isUpgrading ? '처리 중...' : 
                       plan.name === recommendation.currentPlan ? '현재 플랜' : 
                       plan.name === recommendation.recommendedPlan ? '추천 플랜 선택' : '선택하기'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}