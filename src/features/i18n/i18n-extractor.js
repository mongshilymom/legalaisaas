// i18n-extractor.js - 다국어 텍스트 추출 및 추상화 도구

const fs = require('fs');
const path = require('path');

class I18nExtractor {
  constructor() {
    this.extractedTexts = new Map();
    this.currentKey = 0;
    this.sourceFiles = [];
    this.translationFiles = {
      ko: './translations/translation.ko.json',
      en: './translations/translation.en.json'
    };
  }

  // 파일에서 하드코딩된 텍스트 추출
  extractTextsFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const texts = [];

      // 한글 텍스트 패턴 매칭
      const koreanTextPattern = /['"`]([^'"`]*[가-힣][^'"`]*?)['"`]/g;
      let match;
      
      while ((match = koreanTextPattern.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 1 && !this.isIgnoredText(text)) {
          texts.push({
            text: text,
            line: this.getLineNumber(content, match.index),
            context: this.getContext(content, match.index)
          });
        }
      }

      // HTML 태그 내 텍스트 추출
      const htmlTextPattern = />([^<]*[가-힣][^<]*?)</g;
      while ((match = htmlTextPattern.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 1 && !this.isIgnoredText(text)) {
          texts.push({
            text: text,
            line: this.getLineNumber(content, match.index),
            context: this.getContext(content, match.index)
          });
        }
      }

      return texts;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // 무시할 텍스트 판단
  isIgnoredText(text) {
    const ignoredPatterns = [
      /^[0-9]+$/,           // 숫자만
      /^[a-zA-Z]+$/,        // 영어만
      /^[^가-힣]*$/,        // 한글이 없는 텍스트
      /^\s*$/,              // 공백만
      /^[^\w\s]*$/,         // 특수문자만
      /^(true|false|null|undefined)$/i,  // 불린값/null
      /^(px|em|rem|%|vh|vw)$/,          // CSS 단위
      /^(console|error|log|warn|info)$/i, // 로깅 키워드
    ];

    return ignoredPatterns.some(pattern => pattern.test(text));
  }

  // 줄 번호 계산
  getLineNumber(content, index) {
    return content.substr(0, index).split('\n').length;
  }

  // 컨텍스트 추출
  getContext(content, index) {
    const lines = content.split('\n');
    const lineNum = this.getLineNumber(content, index);
    const contextLines = [];
    
    for (let i = Math.max(0, lineNum - 3); i < Math.min(lines.length, lineNum + 2); i++) {
      contextLines.push(`${i + 1}: ${lines[i]}`);
    }
    
    return contextLines.join('\n');
  }

  // 키 생성
  generateKey(text) {
    // 텍스트 기반 키 생성
    return text
      .toLowerCase()
      .replace(/[^가-힣a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  // 번역 파일 로드
  loadTranslations() {
    const translations = {};
    
    Object.keys(this.translationFiles).forEach(lang => {
      const filePath = this.translationFiles[lang];
      try {
        if (fs.existsSync(filePath)) {
          translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
          translations[lang] = {};
        }
      } catch (error) {
        console.error(`Error loading translation file ${filePath}:`, error);
        translations[lang] = {};
      }
    });
    
    return translations;
  }

  // 번역 파일 저장
  saveTranslations(translations) {
    Object.keys(translations).forEach(lang => {
      const filePath = this.translationFiles[lang];
      try {
        // 디렉터리가 없으면 생성
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // 정렬된 키로 저장
        const sortedTranslations = {};
        Object.keys(translations[lang]).sort().forEach(key => {
          sortedTranslations[key] = translations[lang][key];
        });
        
        fs.writeFileSync(filePath, JSON.stringify(sortedTranslations, null, 2), 'utf8');
        console.log(`Translation file saved: ${filePath}`);
      } catch (error) {
        console.error(`Error saving translation file ${filePath}:`, error);
      }
    });
  }

  // 프로젝트 전체 스캔
  scanProject(rootDir = './') {
    const results = {
      totalFiles: 0,
      processedFiles: 0,
      extractedTexts: [],
      errors: []
    };

    const scanDirectory = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // 제외할 디렉터리
            if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
              scanDirectory(filePath);
            }
          } else {
            // 처리할 파일 확장자
            const ext = path.extname(file).toLowerCase();
            if (['.js', '.jsx', '.ts', '.tsx', '.vue'].includes(ext)) {
              results.totalFiles++;
              
              try {
                const texts = this.extractTextsFromFile(filePath);
                if (texts.length > 0) {
                  results.extractedTexts.push({
                    file: filePath,
                    texts: texts
                  });
                  results.processedFiles++;
                }
              } catch (error) {
                results.errors.push({
                  file: filePath,
                  error: error.message
                });
              }
            }
          }
        });
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    };

    scanDirectory(rootDir);
    return results;
  }

  // 추상화된 번역 키 생성
  generateTranslationKeys() {
    const scanResults = this.scanProject();
    const translations = this.loadTranslations();
    
    // 새로운 키 생성
    const newKeys = new Set();
    
    scanResults.extractedTexts.forEach(fileData => {
      fileData.texts.forEach(textData => {
        const key = this.generateKey(textData.text);
        newKeys.add(key);
        
        // 한국어 번역 추가
        if (!translations.ko[key]) {
          translations.ko[key] = textData.text;
        }
        
        // 영어 번역 추가 (기본값)
        if (!translations.en[key]) {
          translations.en[key] = textData.text; // 나중에 번역 필요
        }
      });
    });
    
    // 번역 파일 저장
    this.saveTranslations(translations);
    
    return {
      scanResults,
      newKeys: Array.from(newKeys),
      totalKeys: Object.keys(translations.ko).length
    };
  }

  // 코드 변환 (하드코딩된 텍스트를 번역 키로 변경)
  transformCode(filePath, dryRun = true) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let transformedContent = content;
      const translations = this.loadTranslations();
      const changes = [];
      
      // 한글 텍스트 변환
      const koreanTextPattern = /['"`]([^'"`]*[가-힣][^'"`]*?)['"`]/g;
      let match;
      
      while ((match = koreanTextPattern.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 1 && !this.isIgnoredText(text)) {
          const key = this.generateKey(text);
          
          if (translations.ko[key]) {
            const oldText = match[0];
            const newText = `t('${key}')`;
            
            changes.push({
              line: this.getLineNumber(content, match.index),
              old: oldText,
              new: newText,
              key: key
            });
            
            if (!dryRun) {
              transformedContent = transformedContent.replace(oldText, newText);
            }
          }
        }
      }
      
      if (!dryRun && changes.length > 0) {
        // import 문 추가
        const importStatement = "import { useTranslation } from 'react-i18next';\n";
        const hookStatement = "const { t } = useTranslation();\n";
        
        if (!transformedContent.includes('useTranslation')) {
          transformedContent = importStatement + transformedContent;
        }
        
        fs.writeFileSync(filePath, transformedContent, 'utf8');
        console.log(`Transformed file: ${filePath}`);
      }
      
      return {
        filePath,
        changes,
        transformed: !dryRun
      };
    } catch (error) {
      console.error(`Error transforming file ${filePath}:`, error);
      return {
        filePath,
        changes: [],
        error: error.message
      };
    }
  }

  // 번역 통계 생성
  generateStats() {
    const translations = this.loadTranslations();
    const stats = {
      languages: Object.keys(translations),
      totalKeys: Object.keys(translations.ko || {}).length,
      completeness: {}
    };
    
    Object.keys(translations).forEach(lang => {
      const total = stats.totalKeys;
      const translated = Object.values(translations[lang]).filter(v => v && v.trim()).length;
      stats.completeness[lang] = {
        translated,
        total,
        percentage: total > 0 ? Math.round((translated / total) * 100) : 0
      };
    });
    
    return stats;
  }

  // 리포트 생성
  generateReport() {
    const results = this.generateTranslationKeys();
    const stats = this.generateStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      scan: {
        totalFiles: results.scanResults.totalFiles,
        processedFiles: results.scanResults.processedFiles,
        extractedTexts: results.scanResults.extractedTexts.length,
        errors: results.scanResults.errors.length
      },
      keys: {
        newKeys: results.newKeys.length,
        totalKeys: results.totalKeys
      },
      translations: stats
    };
    
    console.log('\n=== I18n 추출 리포트 ===');
    console.log(`스캔된 파일: ${report.scan.totalFiles}`);
    console.log(`처리된 파일: ${report.scan.processedFiles}`);
    console.log(`추출된 텍스트: ${report.scan.extractedTexts}`);
    console.log(`새로운 키: ${report.keys.newKeys}`);
    console.log(`전체 키: ${report.keys.totalKeys}`);
    
    Object.keys(report.translations.completeness).forEach(lang => {
      const comp = report.translations.completeness[lang];
      console.log(`${lang.toUpperCase()} 번역 완성도: ${comp.translated}/${comp.total} (${comp.percentage}%)`);
    });
    
    return report;
  }
}

// CLI 실행
if (require.main === module) {
  const extractor = new I18nExtractor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'extract':
      extractor.generateReport();
      break;
    
    case 'transform':
      const filePath = process.argv[3];
      const dryRun = process.argv[4] !== '--apply';
      
      if (filePath) {
        const result = extractor.transformCode(filePath, dryRun);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('Usage: node i18n-extractor.js transform <file-path> [--apply]');
      }
      break;
    
    case 'stats':
      const stats = extractor.generateStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    
    default:
      console.log('Usage: node i18n-extractor.js [extract|transform|stats]');
      console.log('  extract: 프로젝트에서 번역 텍스트 추출');
      console.log('  transform: 파일의 하드코딩된 텍스트를 번역 키로 변환');
      console.log('  stats: 번역 통계 출력');
  }
}

module.exports = I18nExtractor;