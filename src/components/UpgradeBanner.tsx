import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Crown, X, Zap, ArrowRight, TrendingUp, Clock, 
  CheckCircle, Sparkles, Target, Gift 
} from 'lucide-react';

interface UpgradeBannerProps {
  trigger: 'feature_limit' | 'usage_limit' | 'time_based' | 'action_based';
  featureName?: string;
  currentUsage?: number;
  usageLimit?: number;
  className?: string;
  variant?: 'banner' | 'modal' | 'sidebar' | 'floating';
  onClose?: () => void;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  trigger,
  featureName,
  currentUsage,
  usageLimit,
  className = '',
  variant = 'banner',
  onClose,
  priority = 'medium'
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);
    // Track banner impression
    logUpgradeInteraction('banner_shown', trigger);
  }, [trigger]);

  const logUpgradeInteraction = async (action: string, source: string, metadata?: any) => {
    try {
      await fetch('/api/upgrade/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.email,
          action,
          source,
          page: router.pathname,
          timestamp: new Date().toISOString(),
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to log upgrade interaction:', error);
    }
  };

  const handleUpgradeClick = () => {
    logUpgradeInteraction('upgrade_click', trigger, {
      featureName,
      currentUsage,
      usageLimit,
      priority
    });
    router.push('/pricing?source=upgrade_banner&trigger=' + trigger);
  };

  const handleDismiss = () => {
    setDismissed(true);
    logUpgradeInteraction('banner_dismissed', trigger);
    onClose?.();
  };

  if (dismissed || !session?.user) return null;

  const getMessage = () => {
    switch (trigger) {
      case 'feature_limit':
        return {
          title: '🔒 프리미엄 기능 잠금',
          subtitle: `${featureName} 기능은 Pro 플랜 이상에서 사용 가능합니다.`,
          cta: 'AI 법률 비서 전체 해제 → 지금 구독'
        };
      case 'usage_limit':
        return {
          title: '⚡ 사용량 한계 도달',
          subtitle: `이번 달 ${currentUsage}/${usageLimit} 사용 완료. 무제한 이용을 원하시나요?`,
          cta: '무제한 사용으로 업그레이드'
        };
      case 'time_based':
        return {
          title: '⏰ 더 많은 기능이 기다려요!',
          subtitle: '법무 업무 효율성을 3배 높여보세요. 지금 업그레이드하면 첫 달 할인!',
          cta: '생산성 3배 UP 시작하기'
        };
      case 'action_based':
        return {
          title: '🎯 맞춤 추천 플랜',
          subtitle: '사용 패턴 분석 결과, Pro 플랜이 가장 적합합니다.',
          cta: 'AI 추천 플랜 확인하기'
        };
      default:
        return {
          title: '💎 더 강력한 AI 법률 도구',
          subtitle: '전문가급 기능으로 업무 효율성을 극대화하세요.',
          cta: '지금 업그레이드하기'
        };
    }
  };

  const getPriorityStyles = () => {
    const styles = {
      low: 'from-gray-500 to-gray-600',
      medium: 'from-blue-500 to-blue-600',
      high: 'from-orange-500 to-red-500',
      urgent: 'from-red-600 to-pink-600 animate-pulse'
    };
    return styles[priority];
  };

  const message = getMessage();

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-2xl max-w-md w-full p-6 transform transition-all duration-300 ${
          animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Crown className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{message.title}</h3>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{message.subtitle}</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              무제한 AI 쿼리
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              고급 계약서 생성
            </div>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              우선 지원 서비스
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleUpgradeClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
            >
              {message.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-40 transform transition-all duration-500 ${
        animateIn ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      } ${className}`}>
        <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{message.title}</h4>
            <p className="text-xs text-gray-600 mb-3">{message.subtitle}</p>
            <button
              onClick={handleUpgradeClick}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              업그레이드
              <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <div className={`bg-gradient-to-r ${getPriorityStyles()} text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
      animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
    } ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            {trigger === 'feature_limit' && <Crown className="h-5 w-5" />}
            {trigger === 'usage_limit' && <TrendingUp className="h-5 w-5" />}
            {trigger === 'time_based' && <Clock className="h-5 w-5" />}
            {trigger === 'action_based' && <Target className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold">{message.title}</h3>
            <p className="text-sm opacity-90">{message.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUpgradeClick}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center text-sm"
          >
            {message.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for triggering upgrade banners based on user actions
export const useUpgradeTrigger = () => {
  const { data: session } = useSession();
  
  const triggerUpgrade = (
    trigger: UpgradeBannerProps['trigger'],
    options?: Partial<UpgradeBannerProps>
  ) => {
    if (!session?.user) return null;
    
    // Check if user is on free plan
    // This would typically check against user's subscription status
    const isFreePlan = true; // Replace with actual check
    
    if (!isFreePlan) return null;
    
    return {
      trigger,
      ...options
    };
  };
  
  return { triggerUpgrade };
};