import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Clock, Upload, ChevronRight, BookOpen, CreditCard, QrCode, Trash2, Receipt, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, User, Mail, Phone, IdCard, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 dark:from-amber-950/30 dark:to-yellow-950/30 dark:text-amber-300 dark:border-amber-800',
  paid: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 dark:from-emerald-950/30 dark:to-green-950/30 dark:text-emerald-300 dark:border-emerald-800',
  cancelled: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300 dark:border-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  paid: 'Đã duyệt',
  cancelled: 'Từ chối',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="h-3 w-3" />,
  paid: <CheckCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

export default function OrdersPage() {
  const { profile } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!profile) return;
    loadOrders();
    loadPaymentSettings();
  }, [profile]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(username, email), subjects!orders_subject_id_fkey(name)')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const loadPaymentSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').eq('id', 1).single();
    setPaymentSettings(data);
  };

  // Generate deterministic order ID based on real database ID
  const generateOrderId = (realId: number) => {
    // Use real database ID but format it to look random
    // Hash the real ID to get a consistent "random-looking" ID
    const hash = (realId * 7919) % 90000 + 10000; // Simple hash function
    return hash;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  const toggleCardExpansion = (orderId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const uploadProof = async (orderId: number, file: File) => {
    const path = `${profile!.id}/${orderId}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(path, file);
    if (error) { toast.error('Upload thất bại: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
    await supabase.from('orders').update({ payment_proof: urlData.publicUrl }).eq('id', orderId);
    toast.success('✅ Đã upload bill thanh toán thành công!');
    loadOrders();
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Xoá đơn hàng này? Hành động không thể hoàn tác.')) return;
    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    toast.success('🗑️ Đã xoá đơn hàng');
    loadOrders();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-full border border-blue-200 dark:border-blue-800">
          <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lịch sử đơn hàng</h1>
        </div>
        <p className="text-muted-foreground">Theo dõi trạng thái các môn học đã mua</p>
      </div>

      {/* Payment info card */}
      {paymentSettings && paymentSettings.bank_name && (
        <Card className="border-0 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20">
          <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-shift" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Thông tin thanh toán</h3>
                <p className="text-sm text-muted-foreground">Quét QR hoặc chuyển khoản theo thông tin bên dưới</p>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        🏦
                      </div>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Ngân hàng</span>
                    </div>
                    <span className="font-black text-xl text-amber-900 dark:text-amber-100">{paymentSettings.bank_name}</span>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                        💳
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Số tài khoản</span>
                    </div>
                    <span className="font-black text-xl text-emerald-900 dark:text-emerald-100 font-mono">{paymentSettings.account_number}</span>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        👤
                      </div>
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Chủ tài khoản</span>
                    </div>
                    <span className="font-black text-xl text-blue-900 dark:text-blue-100">{paymentSettings.account_holder}</span>
                  </div>
                </div>
                
                {paymentSettings.note && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        📝
                      </div>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Nội dung chuyển khoản</span>
                    </div>
                    <span className="font-bold text-purple-900 dark:text-purple-100">{paymentSettings.note}</span>
                  </div>
                )}
              </div>
              
              {paymentSettings.qr_image_url && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <img src={paymentSettings.qr_image_url} alt="QR" className="relative w-64 h-64 object-contain rounded-2xl border-4 border-white shadow-2xl group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-full border border-purple-200 dark:border-purple-800">
                    <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Quét mã QR</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {['all', 'pending', 'paid', 'cancelled'].map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-6 py-3 font-bold shadow-lg transform hover:scale-105 transition-all duration-200",
              filter === s 
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-blue-500/25" 
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
            )}
            onClick={() => setFilter(s)}
          >
            <span className="flex items-center gap-2">
              {s !== 'all' && statusIcons[s]}
              {s === 'all' ? `Tất cả (${orders.length})` : `${statusLabels[s]} (${orders.filter(o => o.status === s).length})`}
            </span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-48 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có đơn hàng</h3>
            <p className="text-muted-foreground">
              {filter !== 'all' ? `ở trạng thái "${statusLabels[filter]}"` : 'Hãy mua môn học đầu tiên của bạn!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filtered.map((order, index) => {
            const displayId = generateOrderId(order.id); // Generate deterministic ID for display
            return (
            <Card key={order.id} className="border-0 shadow-2xl overflow-hidden hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className={cn("h-2", 
                order.status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                order.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
                'bg-gradient-to-r from-amber-500 to-yellow-600'
              )} />
              
              <CardContent className={cn("p-8 space-y-6", expandedCards.has(order.id) ? "" : "pb-4")}>
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl transform hover:scale-110 transition-all duration-200",
                      order.status === 'paid' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                      order.status === 'cancelled' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 
                      'bg-gradient-to-br from-amber-500 to-yellow-600'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Đơn #{displayId}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleString('vi')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={cn("px-4 py-2 text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border", statusColors[order.status])}>
                      <span className="flex items-center gap-2">
                        {statusIcons[order.status]}
                        {statusLabels[order.status]}
                      </span>
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 h-10 w-10 rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:border-blue-500 hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl"
                      onClick={() => toggleCardExpansion(order.id)}
                    >
                      {expandedCards.has(order.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transform hover:scale-110 transition-all duration-200"
                        onClick={() => deleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subject info */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="font-bold text-lg text-blue-900 dark:text-blue-100">{(order.subjects as any)?.name || order.subject_name || 'Môn học'}</span>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Môn học đã đăng ký</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {Number(order.total_price).toLocaleString('vi')}₫
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCards.has(order.id) && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Customer Information */}
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-amber-900 dark:text-amber-100">Thông tin cá nhân</h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300">Thông tin khi đặt đơn hàng</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-300 dark:border-amber-700">
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Họ và tên</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 dark:text-amber-100">{order.full_name || 'N/A'}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded"
                              onClick={() => copyToClipboard(order.full_name || '', 'họ và tên')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-300 dark:border-amber-700">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Email</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 dark:text-amber-100">{(order.users as any)?.email || 'N/A'}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded"
                              onClick={() => copyToClipboard((order.users as any)?.email || '', 'email')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-300 dark:border-amber-700">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Username</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 dark:text-amber-100">{(order.users as any)?.username || 'N/A'}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded"
                              onClick={() => copyToClipboard((order.users as any)?.username || '', 'username')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-300 dark:border-amber-700">
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">ID đơn hàng</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 dark:text-amber-100">#{displayId}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded"
                              onClick={() => copyToClipboard(String(displayId), 'ID đơn hàng')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload proof */}
                    {order.status === 'pending' && !order.payment_proof && (
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-purple-900 dark:text-purple-100">Upload bill chuyển khoản</h4>
                            <p className="text-sm text-purple-700 dark:text-purple-300">Xác nhận thanh toán để được duyệt đơn hàng</p>
                          </div>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 font-medium"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadProof(order.id, file);
                          }}
                        />
                      </div>
                    )}

                    {order.payment_proof && (
                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                              <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-emerald-900 dark:text-emerald-100">Đã upload bill thanh toán</h4>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">Đang chờ admin duyệt</p>
                            </div>
                          </div>
                          <a 
                            href={order.payment_proof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            Xem bill <ChevronRight className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {order.note && (
                      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                            📝
                          </div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-100">Ghi chú từ Admin</h4>
                        </div>
                        <p className="text-amber-800 dark:text-amber-200 font-medium">{order.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
