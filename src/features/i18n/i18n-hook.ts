// i18n-hook.ts - React i18n 커스텀 훅

import { useState, useEffect, useContext, createContext } from 'react';

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  currentLanguage: string;
  translations: Translations;
  changeLanguage: (language: string) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// 기본 언어 설정
const DEFAULT_LANGUAGE: SupportedLanguage = 'ko';

// 번역 파일 동적 로드
const loadTranslations = async (language: SupportedLanguage): Promise<Translations> => {
  try {
    const response = await fetch(`/translations/translation.${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${language}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    return {};
  }
};

// 브라우저 언어 감지
const detectBrowserLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language.toLowerCase();
  
  // 정확한 매칭
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  
  // 언어 코드만 매칭 (예: 'ko-KR' -> 'ko')
  const langCode = browserLang.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
    return langCode as SupportedLanguage;
  }
  
  return DEFAULT_LANGUAGE;
};

// 로컬 스토리지에서 언어 설정 로드
const loadLanguageFromStorage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem('preferred-language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch (error) {
    console.error('Error loading language from localStorage:', error);
  }
  
  return detectBrowserLanguage();
};

// 로컬 스토리지에 언어 설정 저장
const saveLanguageToStorage = (language: SupportedLanguage): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('preferred-language', language);
  } catch (error) {
    console.error('Error saving language to localStorage:', error);
  }
};

// I18n Provider 컴포넌트
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // 언어 변경 함수
  const changeLanguage = async (language: string) => {
    if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      console.error(`Unsupported language: ${language}`);
      return;
    }
    
    const newLanguage = language as SupportedLanguage;
    setIsLoading(true);
    
    try {
      const newTranslations = await loadTranslations(newLanguage);
      setTranslations(newTranslations);
      setCurrentLanguage(newLanguage);
      saveLanguageToStorage(newLanguage);
      
      // HTML lang 속성 업데이트
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLanguage;
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 번역 함수
  const t = (key: string, fallback?: string): string => {
    if (!key) return fallback || '';
    
    const translation = translations[key];
    if (translation) {
      return translation;
    }
    
    // 키가 없는 경우 fallback 또는 키 자체를 반환
    if (fallback) {
      return fallback;
    }
    
    // 개발 모드에서 누락된 키 경고
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${key} for language: ${currentLanguage}`);
    }
    
    return key;
  };

  // 초기 언어 설정
  useEffect(() => {
    const initLanguage = async () => {
      const preferredLanguage = loadLanguageFromStorage();
      await changeLanguage(preferredLanguage);
    };
    
    initLanguage();
  }, []);

  // 언어 변경 시 페이지 타이틀 업데이트
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const title = t('title', 'Legal AI Pro');
      document.title = title;
    }
  }, [currentLanguage, translations]);

  const contextValue: I18nContextType = {
    currentLanguage,
    translations,
    changeLanguage,
    t
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// 커스텀 훅
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// 번역 함수 단축키
export const useTranslation = () => {
  const { t, currentLanguage, changeLanguage } = useI18n();
  
  return {
    t,
    i18n: {
      language: currentLanguage,
      changeLanguage
    }
  };
};

// 언어 감지 훅
export const useLanguageDetection = () => {
  const { changeLanguage } = useI18n();
  
  useEffect(() => {
    // URL 파라미터에서 언어 감지
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && SUPPORTED_LANGUAGES.includes(langParam as SupportedLanguage)) {
      changeLanguage(langParam);
    }
  }, [changeLanguage]);
};

// 언어별 날짜 포맷팅
export const useLocalizedDate = () => {
  const { currentLanguage } = useI18n();
  
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };
  
  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };
  
  return { formatDate, formatDateTime };
};

// 언어별 숫자 포맷팅
export const useLocalizedNumber = () => {
  const { currentLanguage } = useI18n();
  
  const formatNumber = (num: number): string => {
    const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  };
  
  const formatCurrency = (amount: number): string => {
    const locale = currentLanguage === 'ko' ? 'ko-KR' : 'en-US';
    const currency = currentLanguage === 'ko' ? 'KRW' : 'USD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  return { formatNumber, formatCurrency };
};

// 언어별 복수형 처리
export const usePluralization = () => {
  const { currentLanguage } = useI18n();
  
  const pluralize = (count: number, singular: string, plural?: string): string => {
    if (currentLanguage === 'ko') {
      // 한국어는 복수형 구분이 없음
      return singular;
    }
    
    // 영어 복수형 처리
    if (count === 1) {
      return singular;
    }
    
    return plural || `${singular}s`;
  };
  
  return { pluralize };
};

export default useI18n;