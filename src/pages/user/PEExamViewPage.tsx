import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, Download, File, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function PEExamViewPage() {
  const { examId } = useParams();
  const { profile } = useAuthStore();
  const [exam, setExam] = useState<any>(null);
  const [examImages, setExamImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, subjects(name)')
        .eq('id', parseInt(examId!))
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setExam(data);

      // Load questions for PE exams (only for images)
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', parseInt(examId!))
        .order('order_index');

      setExamImages(qData || []);
    } catch (error) {
      console.error('Error loading exam:', error);
      toast.error('Không thể tải đề thi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!exam?.file_upload) {
      toast.error('Không có file để tải');
      return;
    }

    setDownloadLoading(true);
    try {
      // Extract filename from URL
      const url = new URL(exam.file_upload);
      const filename = url.pathname.split('/').pop() || `exam-${exam.id}.pdf`;

      // Download file
      const response = await fetch(exam.file_upload);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Đã tải file thành công');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Lỗi khi tải file');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Đề thi không tồn tại hoặc chưa được công bố</p>
          <Link to="/subjects">
            <Button className="mt-4">Quay lại</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is a PE exam
  const isPEExam = exam.categories?.name === 'Đề PE';

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/subjects/${exam.subject_id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{exam.subjects?.name}</p>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {isPEExam ? 'Ôn tập' : 'Thi thử'}
        </Badge>
      </div>

      {/* Exam Info */}
      <Card className="border shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Môn học</p>
              <p className="font-medium">{exam.subjects?.name}</p>
            </div>
            {exam.duration_minutes && (
              <div>
                <p className="text-sm text-muted-foreground">Thời gian</p>
                <p className="font-medium">{exam.duration_minutes} phút</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Loại đề</p>
              <p className="font-medium">{exam.categories?.name || 'Chưa phân loại'}</p>
            </div>
          </div>

          {exam.description && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Mô tả</p>
              <p className="text-sm">{exam.description}</p>
            </div>
          )}

          {/* PE Exam Content */}
          {isPEExam && (
            <>
              {/* Images Section */}
              {examImages.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <File className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Ảnh đề thi</h3>
                  </div>
                  <div className="space-y-4">
                    {examImages.map((question, index) => (
                      question.image_url && (
                        <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                            Câu {index + 1}
                          </p>
                          <img 
                            src={question.image_url} 
                            alt={`Câu ${index + 1}`}
                            className="w-full max-w-4xl mx-auto rounded-lg border shadow-lg"
                            style={{ maxHeight: '600px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* File Download Section */}
              {exam.file_upload && (
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <File className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">Tải tài liệu</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Bạn có thể tải file tài liệu về để ôn tập.
                  </p>
                  <Button 
                    onClick={handleDownload}
                    disabled={downloadLoading}
                    className="gap-2"
                  >
                    {downloadLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Tải file về
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* No content message */}
              {examImages.length === 0 && !exam.file_upload && (
                <div className="border rounded-lg p-8 text-center bg-blue-50 dark:bg-blue-950/20">
                  <File className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-blue-700 dark:text-blue-300">
                    Đề thi này chưa có nội dung.
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Admin sẽ cập nhật trong thời gian tới.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Regular Exam Actions - Only for non-PE exams */}
          {!isPEExam && (
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">Thi thử</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Đây là đề thi thử. Bạn có thể làm bài để kiểm tra kiến thức.
              </p>
              <Link to={`/exam/${exam.id}/start`}>
                <Button className="gap-2">
                  <Eye className="h-4 w-4" />
                  Bắt đầu làm bài
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Hướng dẫn</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {isPEExam ? (
              <>
                <p>• Đây là đề thi ôn tập (PE), chỉ để xem nội dung.</p>
                <p>• Bạn có thể xem ảnh đề thi trực tuyến.</p>
                {exam.file_upload && <p>• File tài liệu có sẵn để tải về.</p>}
                {!exam.file_upload && <p>• Chưa có file tài liệu để tải.</p>}
                <p>• Không có thi thử hay làm bài trắc nghiệm.</p>
              </>
            ) : (
              <>
                <p>• Đây là đề thi thử, được tính thời gian và điểm số.</p>
                <p>• Bạn sẽ có {exam.duration_minutes || 'không giới hạn'} phút để hoàn thành bài thi.</p>
                <p>• Kết quả sẽ được hiển thị ngay sau khi nộp bài.</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
