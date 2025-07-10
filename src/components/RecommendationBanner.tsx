import React from 'react';
import { useUXRecommendation } from '../hooks/useUXRecommendation';
import { UserInput } from '../types/recommendation';

export const RecommendationBanner = ({ userInput }: { userInput: UserInput | null }) => {
  const { recommendation, loading } = useUXRecommendation(userInput);

  if (!userInput) return null;
  if (loading) return <div className="p-4 bg-blue-100 text-blue-800 rounded">🔍 추천 분석 중...</div>;
  if (!recommendation) return null;

  const { suggestedAction } = recommendation;

  return (
    <div className="p-4 bg-yellow-100 text-yellow-900 rounded shadow-md mt-4">
      <h2 className="text-lg font-semibold">✨ 추천 요금제: {suggestedAction.plan.toUpperCase()}</h2>
      <p className="text-sm mb-2">📌 사유: {suggestedAction.reason}</p>
      <p className="text-sm mb-2">💰 제안 가격: <strong>{suggestedAction.priceRecommendation}</strong></p>
      <ul className="list-disc ml-6 text-sm">
        {suggestedAction.suggestedFeature.map((feature, index) => (
          <li key={index}>✅ {feature}</li>
        ))}
      </ul>
      <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        프리미엄 플랜으로 전환하기
      </button>
    </div>
  );
};