import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { userInteractionTracker } from '../../../lib/userInteractionTracker';
import fs from 'fs';
import path from 'path';

export interface Rating {
  id: string;
  contentId: string;
  userId: string;
  userEmail: string;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  contentId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
  latestRatings: Rating[];
}

const ratingsLogPath = path.join(process.cwd(), 'logs', 'interactions', 'ratings.log');

function ensureRatingsLogExists() {
  const logDir = path.dirname(ratingsLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function generateRatingId(): string {
  return `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { contentId } = req.query;
  
  if (!contentId || typeof contentId !== 'string') {
    return res.status(400).json({ error: '콘텐츠 ID가 필요합니다.' });
  }

  try {
    ensureRatingsLogExists();

    switch (req.method) {
      case 'GET':
        return await getRatingStats(contentId, res);
      
      case 'POST':
        const session = await getServerSession(req, res, authOptions);
        if (!session?.user?.email) {
          return res.status(401).json({ error: '로그인이 필요합니다.' });
        }
        return await submitRating(contentId, req.body, session.user.email, res);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('평점 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

async function getRatingStats(contentId: string, res: NextApiResponse) {
  try {
    if (!fs.existsSync(ratingsLogPath)) {
      return res.status(200).json({
        contentId,
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {},
        latestRatings: []
      });
    }

    const logContent = fs.readFileSync(ratingsLogPath, 'utf-8');
    const allRatings = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as Rating;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const contentRatings = allRatings.filter(rating => rating!.contentId === contentId);
    
    const userLatestRatings = new Map<string, Rating>();
    contentRatings.forEach(rating => {
      const existing = userLatestRatings.get(rating!.userEmail);
      if (!existing || new Date(rating!.updatedAt) > new Date(existing.updatedAt)) {
        userLatestRatings.set(rating!.userEmail, rating!);
      }
    });

    const uniqueRatings = Array.from(userLatestRatings.values());
    
    const totalRatings = uniqueRatings.length;
    const averageRating = totalRatings > 0 
      ? uniqueRatings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
      : 0;

    const ratingDistribution: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = uniqueRatings.filter(rating => rating.rating === i).length;
    }

    const latestRatings = uniqueRatings
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(rating => ({
        ...rating,
        userEmail: rating.userEmail.split('@')[0] + '@***'
      }));

    const stats: RatingStats = {
      contentId,
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings,
      ratingDistribution,
      latestRatings
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('평점 통계 조회 오류:', error);
    return res.status(500).json({ error: '평점 정보를 불러올 수 없습니다.' });
  }
}

async function submitRating(
  contentId: string,
  data: { rating: number; review?: string },
  userEmail: string,
  res: NextApiResponse
) {
  try {
    const { rating, review } = data;
    
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ error: '평점은 1-5 사이의 정수여야 합니다.' });
    }

    if (review && review.length > 500) {
      return res.status(400).json({ error: '리뷰는 500자 이내로 작성해주세요.' });
    }

    const newRating: Rating = {
      id: generateRatingId(),
      contentId,
      userId: userEmail,
      userEmail,
      rating,
      review: review?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fs.appendFileSync(ratingsLogPath, JSON.stringify(newRating) + '\n', 'utf-8');

    await userInteractionTracker.trackInteraction({
      userId: userEmail,
      sessionId: `session_${Date.now()}`,
      contentId,
      interactionType: 'rating',
      value: rating,
      metadata: { 
        ratingId: newRating.id,
        hasReview: !!review,
        reviewLength: review?.length || 0 
      }
    });

    return res.status(201).json({ 
      rating: newRating,
      message: '평점이 등록되었습니다.' 
    });
  } catch (error) {
    console.error('평점 등록 오류:', error);
    return res.status(500).json({ error: '평점 등록 중 오류가 발생했습니다.' });
  }
}