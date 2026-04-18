import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, GraduationCap, ShoppingCart, Check, CreditCard, QrCode, Upload, Tag, X, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const KI_COLORS: Record<number, string> = {
  1: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
  2: 'linear-gradient(135deg, hsl(160,55%,45%), hsl(180,60%,40%))',
  3: 'linear-gradient(135deg, hsl(25,90%,65%), hsl(38,85%,55%))',
  4: 'linear-gradient(135deg, hsl(200,75%,55%), hsl(220,70%,55%))',
  5: 'linear-gradient(135deg, hsl(280,55%,55%), hsl(310,50%,55%))',
  6: 'linear-gradient(135deg, hsl(350,65%,60%), hsl(330,60%,55%))',
  7: 'linear-gradient(135deg, hsl(140,50%,45%), hsl(160,55%,42%))',
  8: 'linear-gradient(135deg, hsl(45,85%,55%), hsl(30,80%,55%))',
};

export default function SubjectsPage() {
  const { profile } = useAuthStore();
  const hasLoadedRef = useRef(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [accessSet, setAccessSet] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Checkout state
  const [checkoutSubject, setCheckoutSubject] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(true);

  // Customer info
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [confirmPayment, setConfirmPayment] = useState(false);

  useEffect(() => {
    if (!profile) return;
    // Only load data once when profile becomes available
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
    loadPaymentSettings();
    // Pre-fill email and full name from profile
    setCustomerEmail(profile.email || '');
    // Try multiple possible name fields
    const name = (profile as any).full_name || (profile as any).name || profile.username || '';
    setFullName(name);
  }, [profile]);

  const loadData = async () => {
    // Check if cached data is still fresh (5 minutes)
    const cacheKey = `subjects_cache_${profile?.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > 5 * 60 * 1000; // 5 minutes
        if (!isExpired && cacheData.subjects && cacheData.accessSet) {
          // Use cached data
          setSubjects(cacheData.subjects);
          setAccessSet(new Set(cacheData.accessSet));
          setLoading(false);
          return;
        }
      } catch (e) {
        // Cache invalid, ignore and continue
        console.log('Cache load failed, fetching fresh data');
      }
    }

    setLoading(true);
    const { data: subs } = await supabase.from('subjects').select('*').eq('is_active', true).order('order_index');
    setSubjects(subs || []);
    
    let accessIds: number[] = [];
    if (profile!.role === 'admin') {
      accessIds = (subs || []).map((s: any) => s.id);
      setAccessSet(new Set(accessIds));
    } else {
      const [permRes, subRes] = await Promise.all([
        supabase.from('user_permissions').select('subject_id').eq('user_id', profile!.id),
        supabase.from('user_subscriptions').select('subject_id, end_date').eq('user_id', profile!.id),
      ]);
      const ids = new Set<number>();
      permRes?.data?.forEach((p: any) => ids.add(p.subject_id));
      subRes?.data?.filter((s: any) => new Date(s.end_date) >= new Date()).forEach((s: any) => ids.add(s.subject_id));
      accessIds = Array.from(ids);
      setAccessSet(ids);
    }

    // Save to cache
    const cacheData = {
      subjects: subs || [],
      accessSet: accessIds,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    setLoading(false);
  };

  const loadPaymentSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
    setPaymentSettings(data);
  };

  const openCheckout = (subject: any) => {
    setCheckoutSubject(subject);
    setCouponCode('');
    setAppliedCoupon(null);
    setCreatedOrder(null);
    setShowPaymentInfo(true);
    // Pre-fill with user data
    const name = (profile as any).full_name || (profile as any).name || profile.username || '';
    setFullName(name);
    setStudentId('');
    setCustomerEmail(profile?.email || '');
    setConfirmPayment(false);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();
    setCheckingCoupon(false);
    if (error || !data) {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error('Mã giảm giá đã hết hạn');
      return;
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      toast.error('Mã giảm giá đã hết lượt sử dụng');
      return;
    }
    const price = Number(checkoutSubject?.price) || 0;
    if (data.min_order_amount > 0 && price < data.min_order_amount) {
      toast.error(`Đơn hàng tối thiểu ${Number(data.min_order_amount).toLocaleString('vi')}₫ để sử dụng mã này`);
      return;
    }
    setAppliedCoupon(data);
    toast.success('Áp dụng mã giảm giá thành công!');
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon || !checkoutSubject) return 0;
    const price = Number(checkoutSubject.price) || 0;
    if (appliedCoupon.discount_type === 'percent') {
      return Math.round(price * Number(appliedCoupon.discount_value) / 100);
    }
    return Math.min(Number(appliedCoupon.discount_value), price);
  };

  const getFinalPrice = () => {
    const price = Number(checkoutSubject?.price) || 0;
    return Math.max(0, price - getDiscountAmount());
  };

  const submitOrder = async () => {
    if (!profile || !checkoutSubject) return;
    if (!fullName.trim()) { toast.error('Vui lòng nhập họ tên'); return; }
    if (!studentId.trim()) { toast.error('Vui lòng nhập mã số sinh viên'); return; }
    if (!customerEmail.trim()) { toast.error('Vui lòng nhập Gmail'); return; }
    if (!confirmPayment) { toast.error('Vui lòng xác nhận đã chuyển khoản'); return; }
    setSubmitting(true);
    try {
      const discount = getDiscountAmount();
      const finalPrice = getFinalPrice();
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: profile.id,
        total_price: finalPrice,
        status: 'pending',
        subject_id: checkoutSubject.id,
        subject_name: checkoutSubject.name,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discount,
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        customer_email: customerEmail.trim(),
      }).select().single();
      if (error) throw error;

      // Increment coupon used_count
      if (appliedCoupon) {
        await supabase.from('coupons').update({ used_count: appliedCoupon.used_count + 1 }).eq('id', appliedCoupon.id);
      }

      setCreatedOrder(order);
      toast.success('Đã tạo đơn hàng! Vui lòng chuyển khoản và upload bill.');

      // Send email notification to admins (fire and forget)
      supabase.functions.invoke('send-order-notification', {
        body: { order_id: order.id },
      }).catch(console.error);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProof = async (file: File) => {
    if (!createdOrder || !profile) return;
    setUploadingProof(true);
    const path = `${profile.id}/${createdOrder.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(path, file);
    if (error) { toast.error('Upload thất bại'); setUploadingProof(false); return; }
    const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
    await supabase.from('orders').update({ payment_proof: urlData.publicUrl }).eq('id', createdOrder.id);
    setCreatedOrder({ ...createdOrder, payment_proof: urlData.publicUrl });
    toast.success('Đã upload bill! Admin sẽ duyệt sớm nhất.');
    setUploadingProof(false);
  };

  const filtered = subjects.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const kiGroups: Record<number, any[]> = {};
  filtered.forEach(s => {
    const ki = s.order_index || 0;
    if (!kiGroups[ki]) kiGroups[ki] = [];
    kiGroups[ki].push(s);
  });
  const kiKeys = Object.keys(kiGroups).map(Number).sort((a, b) => a - b);

  return (
    <div className="container py-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Môn học</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} môn — {kiKeys.length} kì học</p>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm môn học..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(ki => (
            <div key={ki}>
              <div className="skeleton h-7 w-24 rounded mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-44 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {kiKeys.map(ki => (
            <div key={ki}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                  {ki > 0 ? ki : '?'}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{ki > 0 ? `Kì ${ki}` : 'Chưa phân kì'}</h2>
                  <p className="text-xs text-muted-foreground">{kiGroups[ki].length} môn học</p>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kiGroups[ki].map(s => {
                  const hasAccess = accessSet.has(s.id);
                  const price = Number(s.price) || 0;
                  return (
                    <Card key={s.id} className="border shadow-sm overflow-hidden h-full transition-all flex flex-col hover-scale cursor-pointer">
                      {hasAccess ? (
                        <Link to={`/subjects/${s.id}`} className="flex-1 flex flex-col">
                          <div className="w-full overflow-hidden rounded-t-lg" style={{ aspectRatio: '16/9' }}>
                            {s.thumbnail ? (
                              <img 
                                src={s.thumbnail} 
                                alt={s.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center rounded-t-lg" style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                                <BookOpen className="h-12 w-12 text-white/80" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold">{s.name}</h3>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                                <Check className="h-3 w-3" /> Đã mua
                              </Badge>
                            </div>
                            {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {[...Array(10)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                ))}
                              </div>
                              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                                Đã đăng ký
                              </span>
                            </div>
                          </CardContent>
                        </Link>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <div className="w-full overflow-hidden rounded-t-lg" style={{ aspectRatio: '16/9' }}>
                            {s.thumbnail ? (
                              <img 
                                src={s.thumbnail} 
                                alt={s.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center rounded-t-lg" style={{ background: KI_COLORS[ki] || KI_COLORS[1] }}>
                                <BookOpen className="h-12 w-12 text-white/80" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold mb-1">{s.name}</h3>
                            
                            {/* Rating Stars */}
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex">
                                {[...Array(10)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            
                            {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.description}</p>}
                            <div className="mt-auto pt-2 flex items-center justify-between">
                              {price > 0 ? (
                                <span className="text-lg font-bold" style={{
                                  background: 'linear-gradient(135deg, hsl(330,65%,55%), hsl(270,55%,55%))',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>{price.toLocaleString('vi')}₫</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Liên hệ</span>
                              )}
                              <Button
                                size="sm"
                                className="gap-1.5"
                                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
                                disabled={price <= 0}
                                onClick={() => openCheckout(s)}>
                                <ShoppingCart className="h-3.5 w-3.5" />
                                Mua ngay
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {kiKeys.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {search ? `Không tìm thấy môn học với từ khóa "${search}"` : 'Chưa có môn học nào.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={!!checkoutSubject} onOpenChange={(open) => { if (!open) setCheckoutSubject(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {createdOrder ? 'Thanh toán đơn hàng' : 'Xác nhận mua môn học'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {!createdOrder ? (
              /* Step 1: Customer info + Confirm + Coupon */
              <>
                {/* Subject info */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  {checkoutSubject?.thumbnail ? (
                    <img src={checkoutSubject.thumbnail} alt="" loading="lazy" decoding="async" className="w-16 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{checkoutSubject?.name}</h3>
                    {checkoutSubject?.description && <p className="text-xs text-muted-foreground truncate">{checkoutSubject.description}</p>}
                  </div>
                </div>

                {/* Customer info fields */}
                <div className="space-y-3 border rounded-xl p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Thông tin khách hàng
                  </h4>
                  <div>
                    <Label className="text-xs">Họ tên đầy đủ *</Label>
                    <Input placeholder="Nguyễn Văn A" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mã số sinh viên *</Label>
                    <Input placeholder="SE12345" value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Gmail *</Label>
                    <Input placeholder="example@gmail.com" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1" />
                  </div>
                </div>

                {/* Coupon input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Mã giảm giá (nếu có)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã giảm giá..."
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 uppercase font-mono"
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button variant="outline" size="sm" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={applyCoupon} disabled={checkingCoupon || !couponCode.trim()}>
                        {checkingCoupon ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : 'Áp dụng'}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Giảm {appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `${Number(appliedCoupon.discount_value).toLocaleString('vi')}₫`}
                    </div>
                  )}
                </div>

                {/* Payment info - show QR in checkout */}
                {paymentSettings && paymentSettings.bank_name && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(330,65%,60%), hsl(270,55%,60%))' }} />
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Thông tin chuyển khoản
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Ngân hàng:</span>
                          <span className="font-semibold">{paymentSettings.bank_name}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Số TK:</span>
                          <span className="font-semibold font-mono">{paymentSettings.account_number}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Chủ TK:</span>
                          <span className="font-semibold">{paymentSettings.account_holder}</span>
                        </div>
                        {paymentSettings.note && (
                          <div className="p-2 text-xs text-muted-foreground bg-muted/20 rounded-lg">{paymentSettings.note}</div>
                        )}
                      </div>
                      {paymentSettings.qr_image_url && (
                        <div className="bg-white p-2 rounded-lg border w-full">
                          <img src={paymentSettings.qr_image_url} alt="QR" className="w-full h-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price summary */}
                <div className="border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá gốc</span>
                    <span>{Number(checkoutSubject?.price || 0).toLocaleString('vi')}₫</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá ({appliedCoupon.code})</span>
                      <span>-{getDiscountAmount().toLocaleString('vi')}₫</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Tổng thanh toán</span>
                    <span className="text-lg" style={{
                      background: 'linear-gradient(135deg, hsl(330,65%,55%), hsl(270,55%,55%))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>{getFinalPrice().toLocaleString('vi')}₫</span>
                  </div>
                </div>

                {/* Payment confirmation checkbox */}
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                  <Checkbox 
                    id="confirm-payment" 
                    checked={confirmPayment}
                    onCheckedChange={(checked) => setConfirmPayment(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="confirm-payment" className="text-sm font-medium cursor-pointer">
                      Tôi xác nhận đã chuyển khoản
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vui lòng chuyển khoản theo thông tin bên trên và tick vào đây trước khi đặt hàng
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full gap-2 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}
                  disabled={submitting || !confirmPayment}
                  onClick={submitOrder}>
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Đặt hàng & Thanh toán
                </Button>
              </>
            ) : (
              /* Step 2: Payment info + upload bill */
              <>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl text-sm text-green-700 dark:text-green-400 text-center font-medium">
                  Đơn hàng #{createdOrder.id} đã được tạo thành công!
                </div>

                {/* Toggle payment info */}
                {!showPaymentInfo && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 animate-pulse"
                    onClick={() => setShowPaymentInfo(true)}>
                    <QrCode className="h-4 w-4" />
                    Xem thông tin chuyển khoản
                  </Button>
                )}

                {showPaymentInfo && paymentSettings && paymentSettings.bank_name && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="h-1" style={{ background: 'linear-gradient(90deg, hsl(330,65%,60%), hsl(270,55%,60%))' }} />
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Thông tin chuyển khoản
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Ngân hàng:</span>
                          <span className="font-semibold">{paymentSettings.bank_name}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Số TK:</span>
                          <span className="font-semibold font-mono">{paymentSettings.account_number}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Chủ TK:</span>
                          <span className="font-semibold">{paymentSettings.account_holder}</span>
                        </div>
                        <div className="flex justify-between p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                          <span className="text-muted-foreground">Số tiền:</span>
                          <span className="font-bold text-primary">{Number(createdOrder.total_price).toLocaleString('vi')}₫</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Nội dung CK:</span>
                          <span className="font-semibold font-mono text-xs">DH{createdOrder.id}</span>
                        </div>
                        {paymentSettings.note && (
                          <div className="p-2 text-xs text-muted-foreground bg-muted/20 rounded-lg">{paymentSettings.note}</div>
                        )}
                      </div>
                      {paymentSettings.qr_image_url && (
                        <div className="bg-white p-2 rounded-lg border w-full">
                          <img src={paymentSettings.qr_image_url} alt="QR" className="w-full h-auto object-contain" />
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowPaymentInfo(false)}>
                        Ẩn thông tin
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload bill */}
                {!createdOrder.payment_proof ? (
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      Upload bill chuyển khoản
                    </p>
                    <p className="text-xs text-muted-foreground">Chụp màn hình giao dịch thành công và upload tại đây</p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="text-sm"
                      disabled={uploadingProof}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadProof(file);
                      }}
                    />
                    {uploadingProof && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Đang upload...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Đã upload bill — Admin sẽ duyệt sớm nhất
                  </div>
                )}

                <Button variant="outline" className="w-full flex-shrink-0" onClick={() => setCheckoutSubject(null)}>
                  Đóng
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
