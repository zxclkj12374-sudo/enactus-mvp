/**
 * NLP 기반 키워드 추출 및 감정 분석 유틸리티
 */

// 한국어 불용어 (stopwords)
const KOREAN_STOPWORDS = new Set([
  '의', '이', '그', '저', '것', '수', '등', '들', '및', '또는',
  '그리고', '하지만', '그러나', '그래서', '왜냐하면', '때문에',
  '있다', '없다', '하다', '되다', '아니다', '이다', '아', '어',
  '네', '예', '아니요', '음', '흠', '어', '네', '맞다', '그렇다',
  '좋다', '나쁘다', '크다', '작다', '많다', '적다', '높다', '낮다',
  '길다', '짧다', '빠르다', '느리다', '따뜻하다', '차갑다',
  '아침', '저녁', '밤', '낮', '오늘', '내일', '어제', '지금',
  '여기', '저기', '거기', '어디', '누가', '누구', '뭐', '뭔가',
  '이것', '저것', '그것', '어떤', '어떻게', '왜', '언제', '어디서',
  '한테', '한테서', '에게', '에게서', '에', '에서', '로', '로부터',
  '까지', '부터', '중에', '사이에', '위에', '아래에', '앞에', '뒤에',
  '옆에', '안에', '밖에', '속에', '겉에', '옆에', '근처에', '멀리',
  '가까이', '위', '아래', '앞', '뒤', '옆', '안', '밖', '속', '겉'
]);

// 직무 관련 핵심 키워드 (도메인 특화)
const CAREER_KEYWORDS = {
  leadership: ['리더십', '리더', '주도', '주도적', '팀장', '책임', '결정', '지휘', '관리', '조직'],
  analysis: ['분석', '데이터', '통계', '패턴', '인사이트', '조사', '연구', '검토', '평가', '진단'],
  creativity: ['창의', '창의적', '아이디어', '혁신', '새로운', '독창적', '상상', '설계', '기획', '제안'],
  communication: ['소통', '커뮤니케이션', '발표', '설득', '협력', '협업', '팀', '회의', '토론', '대화'],
  technical: ['기술', '프로그래밍', '개발', '코딩', '시스템', '소프트웨어', '하드웨어', '알고리즘', '데이터베이스', '네트워크'],
  business: ['비즈니스', '영업', '마케팅', '판매', '고객', '수익', '성장', '전략', '경영', '사업'],
  service: ['서비스', '고객', '지원', '도움', '배려', '친절', '만족', '신뢰', '관계', '소통'],
  problem_solving: ['문제', '해결', '개선', '효율', '최적화', '개선', '혁신', '변화', '도전', '극복'],
};

/**
 * 텍스트에서 키워드를 추출합니다.
 * @param text 분석할 텍스트
 * @param limit 반환할 최대 키워드 개수
 * @returns 추출된 키워드 배열
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 텍스트를 정규화하고 단어로 분할
  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !KOREAN_STOPWORDS.has(word));

  // 단어 빈도 계산
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // 빈도순으로 정렬하여 상위 키워드 반환
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * 텍스트의 감정을 분석합니다.
 * @param text 분석할 텍스트
 * @returns 'positive', 'neutral', 'negative' 중 하나
 */
export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  if (!text || text.trim().length === 0) {
    return 'neutral';
  }

  const positiveWords = ['좋다', '좋아', '훌륭하다', '멋지다', '훌륭한', '최고', '최고의', '훌륭한', '잘하다', '성공', '행복', '즐거운', '기쁜', '자랑스러운', '자랑스럽다'];
  const negativeWords = ['나쁘다', '나빠', '싫다', '싫어', '최악', '최악의', '실패', '슬픈', '우울한', '힘든', '어렵다', '걱정', '불안', '두렵다', '무섭다'];

  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) {
    return 'positive';
  } else if (negativeCount > positiveCount) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

/**
 * 직무 관련 키워드를 추출하고 분류합니다.
 * @param text 분석할 텍스트
 * @returns 직무 카테고리별 매칭된 키워드
 */
export function extractCareerKeywords(text: string): Record<string, string[]> {
  const lowerText = text.toLowerCase();
  const result: Record<string, string[]> = {};

  Object.entries(CAREER_KEYWORDS).forEach(([category, keywords]) => {
    const matched = keywords.filter(keyword => lowerText.includes(keyword));
    if (matched.length > 0) {
      result[category] = matched;
    }
  });

  return result;
}

/**
 * 사용자의 성향을 분석합니다.
 * @param texts 분석할 텍스트 배열 (현황, 활동, 인터뷰 답변 등)
 * @returns 추출된 성향 정보
 */
export function analyzePersonality(texts: string[]): {
  keywords: string[];
  careerKeywords: Record<string, string[]>;
  sentiment: Record<string, number>;
  strengths: string[];
  challenges: string[];
} {
  const allText = texts.join(' ');
  
  // 전체 키워드 추출
  const keywords = extractKeywords(allText, 15);
  
  // 직무 관련 키워드 추출
  const careerKeywords = extractCareerKeywords(allText);
  
  // 각 텍스트별 감정 분석
  const sentiments = texts.map(text => analyzeSentiment(text));
  const sentimentCount = {
    positive: sentiments.filter(s => s === 'positive').length,
    neutral: sentiments.filter(s => s === 'neutral').length,
    negative: sentiments.filter(s => s === 'negative').length,
  };
  
  // 강점 추출 (긍정적 키워드)
  const strengths = keywords.filter(keyword => {
    const positiveIndicators = ['성공', '잘', '좋', '훌륭', '최고', '우수', '뛰어', '탁월', '능력', '역량', '실력'];
    return positiveIndicators.some(indicator => keyword.includes(indicator));
  });
  
  // 과제 추출 (개선 필요 영역)
  const challenges = keywords.filter(keyword => {
    const challengeIndicators = ['어려', '힘', '부족', '개선', '발전', '학습', '도전', '극복', '노력'];
    return challengeIndicators.some(indicator => keyword.includes(indicator));
  });

  return {
    keywords,
    careerKeywords,
    sentiment: sentimentCount,
    strengths: strengths.slice(0, 5),
    challenges: challenges.slice(0, 5),
  };
}
