import { UrgencyContext } from '../types/recommendation';

export class UrgencyDetector {
  private static readonly URGENCY_KEYWORDS = [
    '오늘', '급함', '빠르게', '즉시', '긴급', '시급',
    '내일', '어서', '빨리', '당장', '지금', '바로',
    '급하게', '서둘러', '촉박', '마감', '데드라인'
  ];

  private static readonly TIME_PATTERNS = [
    /(\d+)시간?\s*(이내|안에|내로)/,
    /(\d+)일?\s*(이내|안에|내로)/,
    /(오늘|내일|이번주)\s*(까지|내로)/,
    /마감.*(\d+)/
  ];

  static analyzeUrgency(text: string): UrgencyContext {
    const foundKeywords = this.findUrgencyKeywords(text);
    const hasTimePatterns = this.hasTimePatterns(text);
    const urgencyScore = this.calculateUrgencyScore(foundKeywords, hasTimePatterns);

    return {
      hasTimeKeywords: foundKeywords.length > 0 || hasTimePatterns,
      keywords: foundKeywords,
      urgencyScore
    };
  }

  private static findUrgencyKeywords(text: string): string[] {
    return this.URGENCY_KEYWORDS.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private static hasTimePatterns(text: string): boolean {
    return this.TIME_PATTERNS.some(pattern => pattern.test(text));
  }

  private static calculateUrgencyScore(keywords: string[], hasTimePatterns: boolean): number {
    let score = 0;
    
    score += keywords.length * 20;
    
    if (hasTimePatterns) score += 30;
    
    if (keywords.includes('긴급') || keywords.includes('시급')) score += 40;
    if (keywords.includes('오늘') || keywords.includes('당장')) score += 30;
    if (keywords.includes('빠르게') || keywords.includes('즉시')) score += 25;
    
    return Math.min(score, 100);
  }
}