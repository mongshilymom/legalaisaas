import fs from 'fs';
import path from 'path';

interface TranslationData {
  [key: string]: string;
}

const LOCALES_DIR = path.join(__dirname, '../utils/locales');
const SUPPORTED_LANGUAGES = ['ja', 'zh'];

// AI 번역 서비스 클래스
class AITranslator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      // Claude API 사용
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: this.apiKey,
      });

      const languageMap: { [key: string]: string } = {
        'ja': '일본어',
        'zh': '중국어 간체'
      };

      const prompt = `다음 텍스트를 ${languageMap[targetLanguage]}로 번역해주세요. 법률 및 비즈니스 용어를 정확히 번역하되, 자연스러운 표현을 사용해주세요.

원문: "${text}"

번역:`;

      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return response.content[0].type === 'text' ? response.content[0].text.trim() : text;

    } catch (error) {
      console.error(`Translation error for "${text}" to ${targetLanguage}:`, error);
      return text; // 번역 실패시 원문 반환
    }
  }
}

// 번역 키 관리 클래스
class TranslationManager {
  private translator: AITranslator;
  private baseTranslation: TranslationData;

  constructor(apiKey: string) {
    this.translator = new AITranslator(apiKey);
    this.baseTranslation = {};
  }

  // 영어 번역 파일 로드
  loadBaseTranslation(): void {
    const enFilePath = path.join(LOCALES_DIR, 'en/translation.json');
    if (fs.existsSync(enFilePath)) {
      const content = fs.readFileSync(enFilePath, 'utf-8');
      this.baseTranslation = JSON.parse(content);
    } else {
      console.error('English translation file not found');
    }
  }

  // 특정 언어의 번역 파일 로드
  loadLanguageTranslation(language: string): TranslationData {
    const filePath = path.join(LOCALES_DIR, `${language}/translation.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    return {};
  }

  // 누락된 키 찾기
  findMissingKeys(language: string): string[] {
    const existingTranslation = this.loadLanguageTranslation(language);
    const baseKeys = Object.keys(this.baseTranslation);
    const existingKeys = Object.keys(existingTranslation);
    
    return baseKeys.filter(key => !existingKeys.includes(key));
  }

  // 특정 언어로 번역 실행
  async translateToLanguage(language: string): Promise<void> {
    console.log(`Starting translation to ${language}...`);
    
    const missingKeys = this.findMissingKeys(language);
    if (missingKeys.length === 0) {
      console.log(`No missing keys found for ${language}`);
      return;
    }

    console.log(`Found ${missingKeys.length} missing keys for ${language}`);
    
    const existingTranslation = this.loadLanguageTranslation(language);
    const updatedTranslation = { ...existingTranslation };

    // 배치 처리를 위한 청크 크기
    const chunkSize = 5;
    const chunks = [];
    
    for (let i = 0; i < missingKeys.length; i += chunkSize) {
      chunks.push(missingKeys.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (key) => {
        const originalText = this.baseTranslation[key];
        if (!originalText) return;

        console.log(`Translating key "${key}" to ${language}...`);
        
        const translatedText = await this.translator.translateText(originalText, language);
        updatedTranslation[key] = translatedText;
        
        // 진행률 표시
        const progress = ((Object.keys(updatedTranslation).length / Object.keys(this.baseTranslation).length) * 100).toFixed(1);
        console.log(`Progress for ${language}: ${progress}%`);
      });

      await Promise.all(promises);
      
      // 각 청크 처리 후 잠시 대기 (API 레이트 리밋 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 번역 결과 저장
    await this.saveTranslation(language, updatedTranslation);
    console.log(`Translation to ${language} completed!`);
  }

  // 번역 결과 저장
  async saveTranslation(language: string, translation: TranslationData): Promise<void> {
    const dirPath = path.join(LOCALES_DIR, language);
    const filePath = path.join(dirPath, 'translation.json');

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 키를 알파벳순으로 정렬
    const sortedTranslation: TranslationData = {};
    Object.keys(translation).sort().forEach(key => {
      sortedTranslation[key] = translation[key];
    });

    // 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(sortedTranslation, null, 2), 'utf-8');
    console.log(`Translation saved to ${filePath}`);
  }

  // 모든 언어로 번역 실행
  async translateAllLanguages(): Promise<void> {
    console.log('Starting translation for all languages...');
    
    for (const language of SUPPORTED_LANGUAGES) {
      try {
        await this.translateToLanguage(language);
      } catch (error) {
        console.error(`Failed to translate to ${language}:`, error);
      }
    }
    
    console.log('All translations completed!');
  }

  // 번역 상태 리포트 생성
  generateReport(): void {
    const baseKeyCount = Object.keys(this.baseTranslation).length;
    
    console.log('\n=== Translation Status Report ===');
    console.log(`Base language (English) keys: ${baseKeyCount}`);
    
    SUPPORTED_LANGUAGES.forEach(language => {
      const languageTranslation = this.loadLanguageTranslation(language);
      const languageKeyCount = Object.keys(languageTranslation).length;
      const completeness = ((languageKeyCount / baseKeyCount) * 100).toFixed(1);
      const missingCount = baseKeyCount - languageKeyCount;
      
      console.log(`${language.toUpperCase()}: ${languageKeyCount}/${baseKeyCount} keys (${completeness}% complete, ${missingCount} missing)`);
    });
    
    console.log('================================\n');
  }
}

// 메인 실행 함수
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    console.error('API key not found. Please set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable.');
    process.exit(1);
  }

  const manager = new TranslationManager(apiKey);
  
  // 기본 번역 파일 로드
  manager.loadBaseTranslation();
  
  // 현재 상태 리포트
  manager.generateReport();
  
  // 번역 실행
  await manager.translateAllLanguages();
  
  // 완료 후 상태 리포트
  manager.generateReport();
}

// 스크립트 직접 실행시
if (require.main === module) {
  main().catch(console.error);
}

export { TranslationManager, AITranslator };