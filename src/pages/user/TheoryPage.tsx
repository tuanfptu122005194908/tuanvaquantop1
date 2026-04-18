import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Image, FileUp, Link2, Youtube, BookOpen, Download, ExternalLink, ChevronLeft, ChevronRight, X, ChevronDown, Lock, ShoppingCart } from 'lucide-react';

const contentTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  images: { label: 'Hình ảnh', icon: Image, color: 'bg-blue-100 text-blue-700' },
  files: { label: 'Tài liệu', icon: FileUp, color: 'bg-green-100 text-green-700' },
  link: { label: 'Liên kết', icon: Link2, color: 'bg-orange-100 text-orange-700' },
  youtube: { label: 'Video', icon: Youtube, color: 'bg-red-100 text-red-700' },
};

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function TheoryPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [theories, setTheories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [accessibleSubjectIds, setAccessibleSubjectIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openSubjects, setOpenSubjects] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: subjectsData }, { data: subsData }, { data: permsData }] = await Promise.all([
      supabase.from('subjects').select('*').eq('is_active', true).order('order_index'),
      supabase.from('user_subscriptions').select('subject_id').eq('user_id', profile?.id || ''),
      supabase.from('user_permissions').select('subject_id').eq('user_id', profile?.id || ''),
    ]);

    const allSubjects = subjectsData || [];
    setSubjects(allSubjects);

    // Collect accessible subject IDs
    const accessIds = new Set<number>();
    (subsData || []).forEach(s => accessIds.add(s.subject_id));
    (permsData || []).forEach(p => accessIds.add(p.subject_id));
    setAccessibleSubjectIds(accessIds);

    // Load theory for accessible subjects
    if (accessIds.size > 0) {
      const { data: theoryData } = await supabase
        .from('theory_exams')
        .select('*, subjects(name)')
        .in('subject_id', Array.from(accessIds))
        .order('created_at', { ascending: false });
      setTheories(theoryData || []);
    } else {
      setTheories([]);
    }

    // Auto-open subjects or specific subjectId
    if (subjectId) {
      setOpenSubjects(new Set([parseInt(subjectId)]));
    } else {
      setOpenSubjects(new Set());
    }

    setLoading(false);
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const toggleSubject = (id: number) => {
    setOpenSubjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const ContentTypeIcon = ({ type }: { type: string }) => {
    const config = contentTypeConfig[type];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} gap-1 text-xs`}>
        <Icon className="h-3 w-3" /> {config.label}
      </Badge>
    );
  };

  const TheoryCard = ({ item }: { item: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {item.content_type === 'images' && item.image_urls?.length > 0 && (
        <div className="relative cursor-pointer" onClick={() => openLightbox(item.image_urls, 0)}>
          <img src={item.image_urls[0]} alt={item.title} className="w-full h-48 object-cover" />
          {item.image_urls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg">
              +{item.image_urls.length - 1} ảnh
            </div>
          )}
        </div>
      )}
      {item.content_type === 'youtube' && item.link_url && (
        <div className="aspect-video">
          {getYoutubeId(item.link_url) ? (
            <iframe src={`https://www.youtube.com/embed/${getYoutubeId(item.link_url)}`} title={item.title}
              className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Video không hợp lệ</div>
          )}
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{item.title}</h3>
          <ContentTypeIcon type={item.content_type} />
        </div>
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
        {item.content_type === 'images' && item.image_urls?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.image_urls.map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => openLightbox(item.image_urls, i)} />
            ))}
          </div>
        )}
        {item.content_type === 'files' && item.file_url && (
          <div className="space-y-2">
            {item.file_url.split(',').map((url: string, i: number) => {
              const fileName = decodeURIComponent(url.split('/').pop() || `File ${i + 1}`);
              return (
                <a key={i} href={url} download target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm">
                  <Download className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="truncate flex-1">{fileName}</span>
                </a>
              );
            })}
          </div>
        )}
        {item.content_type === 'link' && item.link_url && (
          <a href={item.link_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 text-sm"><ExternalLink className="h-4 w-4" /> Mở liên kết</Button>
          </a>
        )}
        {item.content_type === 'youtube' && item.link_url && (
          <a href={item.link_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2 text-sm"><Youtube className="h-4 w-4 text-red-500" /> Xem trên YouTube</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Tài liệu lý thuyết</h1>
        <p className="text-sm text-muted-foreground mt-1">Ảnh, tài liệu, video và liên kết hữu ích theo từng môn</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            // Group subjects by kì
            const kiGroups: Record<number, any[]> = {};
            subjects.forEach(s => {
              const ki = s.order_index || 0;
              if (!kiGroups[ki]) kiGroups[ki] = [];
              kiGroups[ki].push(s);
            });
            const kiKeys = Object.keys(kiGroups).map(Number).sort((a, b) => a - b);

            const KI_COLORS: Record<number, string> = {
              1: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
              2: 'linear-gradient(135deg, hsl(160,55%,45%), hsl(170,65%,38%))',
              3: 'linear-gradient(135deg, hsl(25,90%,65%), hsl(25,90%,52%))',
              4: 'linear-gradient(135deg, hsl(280,65%,55%), hsl(310,60%,52%))',
              5: 'linear-gradient(135deg, hsl(0,65%,52%), hsl(20,80%,55%))',
              6: 'linear-gradient(135deg, hsl(195,75%,45%), hsl(215,70%,50%))',
              7: 'linear-gradient(135deg, hsl(330,65%,50%), hsl(350,70%,55%))',
              8: 'linear-gradient(135deg, hsl(90,60%,40%), hsl(110,65%,38%))',
            };

            return kiKeys.map(ki => (
              <div key={ki} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Kì header */}
                <div className="p-6 border-b bg-gradient-to-r from-muted/50 to-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
                      style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                      {ki > 0 ? ki : '?'}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">{ki > 0 ? `Kì ${ki}` : 'Chưa phân kì'}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {kiGroups[ki].length} môn
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {kiGroups[ki].reduce((sum, s) => sum + (theories.filter(t => t.subject_id === s.id).length || 0), 0)} tài liệu
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {kiGroups[ki].map(subject => {
                      const hasAccess = accessibleSubjectIds.has(subject.id);
                      const items = theories.filter(t => t.subject_id === subject.id);

                      return (
                        <div key={subject.id}>
                          {hasAccess ? (
                            <Collapsible open={openSubjects.has(subject.id)} onOpenChange={() => toggleSubject(subject.id)}>
                              <CollapsibleTrigger className="flex items-center gap-2 w-full bg-muted/50 rounded-lg px-4 py-3 text-left hover:bg-muted transition-colors">
                                <ChevronDown className={`h-4 w-4 transition-transform ${openSubjects.has(subject.id) ? '' : '-rotate-90'}`} />
                                <span className="font-semibold flex-1">{subject.name}</span>
                                <Badge variant="secondary">{items.length} tài liệu</Badge>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                {items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground p-4 text-center">Chưa có tài liệu nào cho môn này.</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
                                    {items.map(item => <TheoryCard key={item.id} item={item} />)}
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          ) : (
                            <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3 border border-dashed">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold flex-1 text-muted-foreground">{subject.name}</span>
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/plans')}>
                                <ShoppingCart className="h-3 w-3" /> Mua để xem
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ));
          })()}

          {subjects.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có môn học nào.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 z-50 text-white/80 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            {lightboxImages.length > 1 && (
              <>
                <button onClick={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                  className="absolute left-4 z-50 text-white/80 hover:text-white p-2 bg-black/50 rounded-full">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
                  className="absolute right-4 z-50 text-white/80 hover:text-white p-2 bg-black/50 rounded-full">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <img src={lightboxImages[lightboxIndex]} alt="" className="max-w-full max-h-[80vh] object-contain" />
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
