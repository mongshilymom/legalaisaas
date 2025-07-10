import fs from 'fs';
import path from 'path';
import { logUserAction } from './logUserAction';

export interface UserInteraction {
  userId: string;
  sessionId: string;
  contentId: string;
  interactionType: 'view' | 'bookmark' | 'rating' | 'comment' | 'share' | 'download';
  value?: number | string;
  metadata?: Record<string, any>;
  timestamp: string;
  duration?: number;
  source?: string;
}

export interface UserPreferences {
  userId: string;
  preferredTopics: string[];
  preferredContentTypes: string[];
  engagementScore: number;
  lastUpdated: string;
}

export interface ContentEngagement {
  contentId: string;
  totalViews: number;
  totalBookmarks: number;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  shareCount: number;
  engagementScore: number;
}

export class UserInteractionTracker {
  private interactionsLogPath: string;
  private preferencesLogPath: string;
  private engagementLogPath: string;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs', 'interactions');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.interactionsLogPath = path.join(logDir, 'user-interactions.log');
    this.preferencesLogPath = path.join(logDir, 'user-preferences.log');
    this.engagementLogPath = path.join(logDir, 'content-engagement.log');
  }

  async trackInteraction(interaction: Omit<UserInteraction, 'timestamp'>): Promise<void> {
    const timestampedInteraction: UserInteraction = {
      ...interaction,
      timestamp: new Date().toISOString()
    };

    try {
      fs.appendFileSync(
        this.interactionsLogPath,
        JSON.stringify(timestampedInteraction) + '\n',
        'utf-8'
      );

      await logUserAction({
        type: 'PAGE_VIEW',
        page: `content-${interaction.interactionType}`,
        userId: interaction.userId,
        metadata: {
          contentId: interaction.contentId,
          interactionType: interaction.interactionType,
          value: interaction.value
        }
      });

      await this.updateUserPreferences(interaction.userId);
      await this.updateContentEngagement(interaction.contentId);

    } catch (error) {
      console.error('사용자 상호작용 추적 오류:', error);
    }
  }

  async getUserInteractions(userId: string, limit?: number): Promise<UserInteraction[]> {
    try {
      if (!fs.existsSync(this.interactionsLogPath)) {
        return [];
      }

      const logContent = fs.readFileSync(this.interactionsLogPath, 'utf-8');
      const interactions = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as UserInteraction;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(interaction => interaction!.userId === userId)
        .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());

      return limit ? interactions.slice(0, limit) : interactions;
    } catch (error) {
      console.error('사용자 상호작용 조회 오류:', error);
      return [];
    }
  }

  async getUserRecommendationData(userId: string): Promise<{
    recentDocs: string[];
    preferredTopics: string[];
    interactionHistory: {
      views: string[];
      bookmarks: string[];
      ratings: Array<{ contentId: string; rating: number }>;
    };
  }> {
    try {
      const interactions = await this.getUserInteractions(userId, 50);
      
      const recentDocs = interactions
        .filter(i => i.interactionType === 'view')
        .slice(0, 10)
        .map(i => i.contentId);

      const preferences = await this.getUserPreferences(userId);
      
      const views = interactions
        .filter(i => i.interactionType === 'view')
        .map(i => i.contentId);

      const bookmarks = interactions
        .filter(i => i.interactionType === 'bookmark')
        .map(i => i.contentId);

      const ratings = interactions
        .filter(i => i.interactionType === 'rating' && typeof i.value === 'number')
        .map(i => ({ 
          contentId: i.contentId, 
          rating: i.value as number 
        }));

      return {
        recentDocs,
        preferredTopics: preferences?.preferredTopics || [],
        interactionHistory: {
          views,
          bookmarks,
          ratings
        }
      };
    } catch (error) {
      console.error('추천 데이터 조회 오류:', error);
      return {
        recentDocs: [],
        preferredTopics: [],
        interactionHistory: { views: [], bookmarks: [], ratings: [] }
      };
    }
  }

  private async updateUserPreferences(userId: string): Promise<void> {
    try {
      const interactions = await this.getUserInteractions(userId, 100);
      
      const topicCounts: Record<string, number> = {};
      const contentTypeCounts: Record<string, number> = {};
      
      interactions.forEach(interaction => {
        if (interaction.metadata?.topics) {
          interaction.metadata.topics.forEach((topic: string) => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          });
        }
        
        if (interaction.metadata?.contentType) {
          const contentType = interaction.metadata.contentType as string;
          contentTypeCounts[contentType] = (contentTypeCounts[contentType] || 0) + 1;
        }
      });

      const preferredTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic]) => topic);

      const preferredContentTypes = Object.entries(contentTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type]) => type);

      const engagementScore = this.calculateEngagementScore(interactions);

      const preferences: UserPreferences = {
        userId,
        preferredTopics,
        preferredContentTypes,
        engagementScore,
        lastUpdated: new Date().toISOString()
      };

      fs.appendFileSync(
        this.preferencesLogPath,
        JSON.stringify(preferences) + '\n',
        'utf-8'
      );

    } catch (error) {
      console.error('사용자 선호도 업데이트 오류:', error);
    }
  }

  private async updateContentEngagement(contentId: string): Promise<void> {
    try {
      if (!fs.existsSync(this.interactionsLogPath)) {
        return;
      }

      const logContent = fs.readFileSync(this.interactionsLogPath, 'utf-8');
      const contentInteractions = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as UserInteraction;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(interaction => interaction!.contentId === contentId);

      const totalViews = contentInteractions.filter(i => i!.interactionType === 'view').length;
      const totalBookmarks = contentInteractions.filter(i => i!.interactionType === 'bookmark').length;
      const commentCount = contentInteractions.filter(i => i!.interactionType === 'comment').length;
      const shareCount = contentInteractions.filter(i => i!.interactionType === 'share').length;
      
      const ratings = contentInteractions
        .filter(i => i!.interactionType === 'rating' && typeof i!.value === 'number')
        .map(i => i!.value as number);
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      const engagementScore = this.calculateContentEngagementScore({
        totalViews,
        totalBookmarks,
        averageRating,
        commentCount,
        shareCount
      });

      const engagement: ContentEngagement = {
        contentId,
        totalViews,
        totalBookmarks,
        averageRating,
        ratingCount: ratings.length,
        commentCount,
        shareCount,
        engagementScore
      };

      fs.appendFileSync(
        this.engagementLogPath,
        JSON.stringify(engagement) + '\n',
        'utf-8'
      );

    } catch (error) {
      console.error('콘텐츠 참여도 업데이트 오류:', error);
    }
  }

  private calculateEngagementScore(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0;

    const weights = {
      view: 1,
      bookmark: 3,
      rating: 5,
      comment: 4,
      share: 6,
      download: 2
    };

    const totalScore = interactions.reduce((score, interaction) => {
      return score + (weights[interaction.interactionType] || 1);
    }, 0);

    return Math.min(100, Math.round((totalScore / interactions.length) * 10));
  }

  private calculateContentEngagementScore(metrics: {
    totalViews: number;
    totalBookmarks: number;
    averageRating: number;
    commentCount: number;
    shareCount: number;
  }): number {
    const { totalViews, totalBookmarks, averageRating, commentCount, shareCount } = metrics;
    
    const bookmarkRate = totalViews > 0 ? (totalBookmarks / totalViews) * 100 : 0;
    const commentRate = totalViews > 0 ? (commentCount / totalViews) * 100 : 0;
    const shareRate = totalViews > 0 ? (shareCount / totalViews) * 100 : 0;
    
    const score = (
      (bookmarkRate * 0.3) +
      (averageRating * 20 * 0.25) +
      (commentRate * 0.25) +
      (shareRate * 0.2)
    );

    return Math.min(100, Math.round(score));
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!fs.existsSync(this.preferencesLogPath)) {
        return null;
      }

      const logContent = fs.readFileSync(this.preferencesLogPath, 'utf-8');
      const preferences = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as UserPreferences;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(pref => pref!.userId === userId)
        .sort((a, b) => new Date(b!.lastUpdated).getTime() - new Date(a!.lastUpdated).getTime())[0];

      return preferences || null;
    } catch (error) {
      console.error('사용자 선호도 조회 오류:', error);
      return null;
    }
  }

  async getContentEngagement(contentId: string): Promise<ContentEngagement | null> {
    try {
      if (!fs.existsSync(this.engagementLogPath)) {
        return null;
      }

      const logContent = fs.readFileSync(this.engagementLogPath, 'utf-8');
      const engagement = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line) as ContentEngagement;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(eng => eng!.contentId === contentId)
        .sort((a, b) => b!.totalViews - a!.totalViews)[0];

      return engagement || null;
    } catch (error) {
      console.error('콘텐츠 참여도 조회 오류:', error);
      return null;
    }
  }
}

export const userInteractionTracker = new UserInteractionTracker();