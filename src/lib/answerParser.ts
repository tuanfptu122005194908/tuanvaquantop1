export function parseAnswers(input: string): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  
  // Parse space-separated format: "1A 2B 3C 4D 5E 6F 7G 8H 9I 10J 11K..."
  const spaceSeparated = input.trim().split(/\s+/);
  
  for (const token of spaceSeparated) {
    // Match pattern: number followed by one or more letters (A-Z)
    const match = token.match(/^(\d+)([a-zA-Z]+)$/);
    
    if (match) {
      const questionNum = parseInt(match[1]);
      const answerLetters = match[2].toUpperCase();
      const answers = answerLetters.split('');
      
      if (!result[questionNum]) {
        result[questionNum] = [];
      }
      
      for (const answer of answers) {
        if (/^[A-Z]$/.test(answer) && !result[questionNum].includes(answer)) {
          result[questionNum].push(answer);
        }
      }
    }
  }
  
  return result;
}

// Helper function to format answers for display
export function formatAnswersForDisplay(answers: Record<number, string[]>): string {
  let result = '';
  
  const sortedKeys = Object.keys(answers).map(Number).sort((a, b) => a - b);
  
  for (const key of sortedKeys) {
    const answerList = answers[key];
    if (answerList && answerList.length > 0) {
      result += `Câu ${key}: ${answerList.join(', ')}\n`;
    }
  }
  
  return result.trim();
}
