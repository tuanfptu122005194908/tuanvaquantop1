import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Question {
  id: number;
  order_index: number;
  question_text?: string;
  image_url?: string;
  answers: Answer[];
}

interface Answer {
  id: number;
  label: string;
  content: string | null;
  is_correct: boolean;
}

interface Exam {
  id: number;
  title: string;
  description?: string;
  duration_minutes?: number;
  subjects: {
    name: string;
  };
}

interface PDFExportProps {
  exam: Exam;
  questions: Question[];
  includeAnswers?: boolean;
}

export default function PDFExport({ exam, questions, includeAnswers = true }: PDFExportProps) {
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Helper function to replace Vietnamese characters with ASCII equivalents
      const normalizeVietnamese = (text: string) => {
        return text
          .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
          .replace(/Á|À|Ả|Ã|Ạ|Ă|Ắ|Ằ|Ẳ|Ẵ|Ặ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ/g, 'A')
          .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
          .replace(/É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ/g, 'E')
          .replace(/í|ì|ỉ|ĩ|ị/g, 'i')
          .replace(/Í|Ì|Ỉ|Ĩ|Ị/g, 'I')
          .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
          .replace(/Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ/g, 'O')
          .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
          .replace(/Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự/g, 'U')
          .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
          .replace(/Ý|Ỳ|Ỷ|Ỹ|Ỵ/g, 'Y')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D');
      };

      // Add title page
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      const titleLines = pdf.splitTextToSize(normalizeVietnamese(exam.title), contentWidth);
      checkPageBreak(titleLines.length * 10 + 40);
      pdf.text(titleLines, pageWidth / 2, currentY + 20, { align: 'center' });
      currentY += titleLines.length * 10 + 30;

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Mon hoc: ${normalizeVietnamese(exam.subjects.name)}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      if (exam.description) {
        const descLines = pdf.splitTextToSize(normalizeVietnamese(exam.description), contentWidth);
        checkPageBreak(descLines.length * 8 + 10);
        pdf.text(descLines, pageWidth / 2, currentY, { align: 'center' });
        currentY += descLines.length * 8 + 10;
      }

      if (exam.duration_minutes) {
        pdf.text(`Thoi gian: ${exam.duration_minutes} phut`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;
      }

      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text(`So cau hoi: ${questions.length}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 30;

      // Add questions
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('CAU HOI', margin, currentY);
      currentY += 25;

      for (const question of questions) {
        checkPageBreak(80); // Reserve space for question

        // Question number
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Cau ${question.order_index}:`, margin, currentY);
        currentY += 12;

        // Question text
        if (question.question_text) {
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'normal');
          const questionLines = pdf.splitTextToSize(normalizeVietnamese(question.question_text), contentWidth - 10);
          pdf.text(questionLines, margin + 10, currentY);
          currentY += questionLines.length * 8 + 10;
        }

        // Question image
        if (question.image_url) {
          try {
            checkPageBreak(60); // Reserve space for image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = question.image_url;
            });

            const imgWidth = Math.min(contentWidth - 20, 150);
            const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
            
            pdf.addImage(img.src, 'JPEG', margin + 10, currentY, imgWidth, Math.min(imgHeight, 100));
            currentY += Math.min(imgHeight, 100) + 10;
          } catch (error) {
            console.warn('Could not load image:', question.image_url);
            pdf.setFontSize(12);
            pdf.text('[Anh khong the tai]', margin + 10, currentY);
            currentY += 15;
          }
        }

        // Only show correct answers
        const correctAnswers = question.answers
          .filter(a => a.is_correct)
          .sort((a, b) => a.label.localeCompare(b.label));

        if (correctAnswers.length > 0) {
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          pdf.text('Answer:', margin + 25, currentY);
          currentY += 10;
          
          pdf.setFont(undefined, 'normal');
          // Show just the correct answer labels and content
          for (const answer of correctAnswers) {
            checkPageBreak(12);
            const answerText = `${answer.label}. ${answer.content ? normalizeVietnamese(answer.content) : ''}`;
            const answerLines = pdf.splitTextToSize(answerText, contentWidth - 25);
            pdf.text(answerLines, margin + 25, currentY);
            currentY += answerLines.length * 8 + 5;
          }
        } else {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'italic');
          pdf.text('(Chua co dap an dung)', margin + 25, currentY);
          currentY += 15;
        }

        currentY += 15; // Space between questions
      }

      // Add answer key
      if (includeAnswers) {
        pdf.addPage();
        currentY = margin;

        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text('DAP AN', margin, currentY);
        currentY += 30;

        let colX = margin;
        let colY = currentY;
        const colWidth = contentWidth / 2;
        let itemsInCol = 0;
        const maxItemsPerCol = 15;

        for (const question of questions) {
          if (itemsInCol >= maxItemsPerCol) {
            colX = margin + colWidth;
            colY = currentY;
            itemsInCol = 0;
          }

          const correctAnswers = question.answers
            .filter(a => a.is_correct)
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(a => a.label)
            .join(', ') || '(Chua co dap an)';

          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          pdf.text(`Cau ${question.order_index}:`, colX, colY);
          
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(211, 47, 47); // Red color
          pdf.text(correctAnswers, colX + 25, colY);
          pdf.setTextColor(0, 0, 0); // Reset to black

          colY += 12;
          itemsInCol++;
        }
      }

      // Save PDF
      const fileName = `${normalizeVietnamese(exam.title).replace(/[^a-zA-Z0-9]/g, '_')}_${normalizeVietnamese(exam.subjects.name).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  return {
    exportToPDF
  };
}
