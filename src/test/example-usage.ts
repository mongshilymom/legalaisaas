import { RecommendationEngine } from './services/recommendation-engine';
import { UserInput, ContractType } from './types/recommendation';

async function exampleUsage() {
  const userInput: UserInput = {
    question: '기업 계약서 검토가 오늘 급하게 필요합니다. 영어와 한국어 문서를 분석해주세요.',
    files: [
      new File(['contract content'], 'contract1.pdf'),
      new File(['agreement content'], 'agreement.docx'),
      new File(['terms content'], 'terms.pdf')
    ],
    contractType: ContractType.ENTERPRISE,
    timestamp: new Date()
  };

  try {
    const recommendation = await RecommendationEngine.generateRecommendation(userInput);
    
    console.log('🔍 추천 결과:');
    console.log(JSON.stringify(recommendation.suggestedAction, null, 2));
    
    console.log('\n⚡ 긴급도 분석:');
    console.log(`- 긴급도 점수: ${recommendation.urgencyContext.urgencyScore}`);
    console.log(`- 시간 관련 키워드: ${recommendation.urgencyContext.keywords.join(', ')}`);
    
    console.log('\n📊 분석 데이터:');
    console.log(`- 복잡도: ${recommendation.analysisData.complexity}`);
    console.log(`- 파일 수: ${recommendation.analysisData.fileCount}`);
    console.log(`- 다국어: ${recommendation.analysisData.hasMultiLanguage}`);
    console.log(`- 예상 처리 시간: ${recommendation.analysisData.estimatedProcessingTime}초`);
    
    const aiResult = await RecommendationEngine.processWithAI(userInput);
    console.log('\n🤖 AI 처리 결과:');
    console.log(aiResult);
    
  } catch (error) {
    console.error('추천 생성 실패:', error);
  }
}

exampleUsage();