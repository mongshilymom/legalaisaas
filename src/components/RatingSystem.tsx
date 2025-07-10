import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, User, MessageSquare } from 'lucide-react';

interface Rating {
  id: string;
  contentId: string;
  userId: string;
  userEmail: string;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingStats {
  contentId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
  latestRatings: Rating[];
}

interface RatingSystemProps {
  contentId: string;
  className?: string;
  showReviews?: boolean;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({ 
  contentId, 
  className = '',
  showReviews = true 
}) => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchRatingStats();
  }, [contentId]);

  const fetchRatingStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rating/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        if (session?.user?.email) {
          const userRatingData = data.latestRatings.find(
            (r: Rating) => r.userEmail.startsWith(session.user!.email!.split('@')[0])
          );
          if (userRatingData) {
            setUserRating(userRatingData.rating);
            setUserReview(userRatingData.review || '');
          }
        }
      }
    } catch (error) {
      console.error('평점 정보 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!session?.user || userRating === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/rating/${contentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating: userRating,
          review: userReview.trim() || undefined
        })
      });

      if (response.ok) {
        await fetchRatingStats();
        setShowReviewForm(false);
        alert('평점이 등록되었습니다!');
      } else {
        const error = await response.json();
        alert(error.error || '평점 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('평점 등록 오류:', error);
      alert('평점 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} cursor-pointer transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'hover:text-yellow-400 hover:fill-yellow-400' : ''}`}
            onClick={interactive ? () => setUserRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 평점 요약 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">사용자 평점</h3>
          {session?.user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              평점 남기기
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating), false, 'lg')}
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalRatings}명의 평가
            </div>
          </div>

          <div className="flex-1 ml-6">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center space-x-2 mb-1">
                <span className="text-sm text-gray-600 w-6">{star}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.totalRatings > 0 
                        ? (stats.ratingDistribution[star] || 0) / stats.totalRatings * 100 
                        : 0}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stats.ratingDistribution[star] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 평점 작성 폼 */}
        {showReviewForm && session?.user && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평점을 선택하세요
              </label>
              {renderStars(hoveredStar || userRating, true, 'lg')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 (선택사항)
              </label>
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="이 콘텐츠에 대한 의견을 남겨주세요..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1">
                {userReview.length}/500
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRatingSubmit}
                disabled={submitting || userRating === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '평점 등록'}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setUserRating(0);
                  setUserReview('');
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 최근 리뷰 */}
      {showReviews && stats.latestRatings.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">최근 리뷰</h4>
          </div>

          <div className="space-y-4">
            {stats.latestRatings
              .filter(rating => rating.review && rating.review.trim())
              .slice(0, 5)
              .map((rating) => (
                <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {rating.userEmail}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatDate(rating.createdAt)}
                        </span>
                      </div>
                    </div>
                    {renderStars(rating.rating, false, 'sm')}
                  </div>
                  {rating.review && (
                    <p className="text-gray-700 text-sm ml-10">
                      {rating.review}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 로그인 안내 */}
      {!session?.user && (
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-blue-800 mb-2">평점을 남기려면 로그인이 필요합니다.</p>
          <a 
            href="/auth/signin"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            로그인
          </a>
        </div>
      )}
    </div>
  );
};