import { useState, useEffect } from 'react';
import { RecommendationEngine } from '../services/recommendation-engine';
import { UserInput, RecommendationResult } from '../types/recommendation';

export const useUXRecommendation = (userInput: UserInput | null) => {
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!userInput) return;
      setLoading(true);
      try {
        const result = await RecommendationEngine.generateRecommendation(userInput);
        setRecommendation(result);
      } catch (err) {
        console.error('추천 생성 실패:', err);
        setRecommendation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [userInput]);

  return { recommendation, loading };
};