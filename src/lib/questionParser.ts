export function parseQuestions(input: string): { order_index: number; question_text: string }[] {
  const questions: { order_index: number; question_text: string }[] = [];
  
  // Split by question indicators (Câu 1:, Câu 1, Câu 1. etc.)
  const questionBlocks = input.split(/Câu\s*(\d+)\s*[:：.]?\s*/i);
  
  let questionIndex = 1;
  for (let i = 1; i < questionBlocks.length; i += 2) {
    const questionNum = parseInt(questionBlocks[i]);
    const content = questionBlocks[i + 1]?.trim();
    
    if (content) {
      // Split content by answer options (A-K at start of line)
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      let questionText = '';
      let foundAnswer = false;
      
      for (const line of lines) {
        // Check if line starts with answer option (A-K) with dot or parenthesis
        // Support formats: "A.", "A)", "A. Content", "A) Content"
        // NOT: "A" alone (could be part of question text)
        if (/^[A-K]\s*[\.\)]/.test(line)) {
          foundAnswer = true;
          // Don't add to answerOptions, just mark that we found answers
        } else if (!foundAnswer) {
          // Still in question text
          questionText += (questionText ? ' ' : '') + line;
        }
        // Once we found answers, ignore all subsequent lines (they are just answer options)
      }
      
      // Clean up question text (remove any trailing answer indicators)
      questionText = questionText.replace(/[A-K]\s*[\.\)]?\s*$/g, '').trim();
      
      if (questionText) {
        questions.push({ 
          order_index: questionNum || questionIndex, 
          question_text: questionText 
        });
      }
      
      questionIndex++;
    }
  }
  
  return questions;
}
