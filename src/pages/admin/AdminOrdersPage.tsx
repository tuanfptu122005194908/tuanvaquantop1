import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, X, Pencil, Trash2, Receipt, User, Mail, Clock, Eye, IdCard, BookOpen, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string; barColor: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300', barColor: '#f59e0b' },
  paid: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300', barColor: '#10b981' },
  cancelled: { label: 'Từ chối', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300', barColor: '#ef4444' },
};

export default function AdminOrdersPage() {
  const { profile } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState<number | null>(null);
  const [previewBill, setPreviewBill] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({ status: '', note: '', total_price: '' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 10;
  
  // Toggle for compact view
  const [compactView, setCompactView] = useState(true);
  // Track expanded cards
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => { loadOrders(); loadSubjects(); }, [currentPage, filter]);

  useEffect(() => {
    if (searchTerm !== undefined) {
      setCurrentPage(1);
      loadOrders();
    }
  }, [searchTerm, filter]);

  const loadOrders = async () => {
    setLoading(true);
    
    // Load all orders (without search filter)
    let query = supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(username, email)', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply status filter
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    // Load all data (no pagination when searching)
    const { data, count, error } = await query;
    
    if (error) {
      console.error('Query error:', error);
      setOrders([]);
      setTotalOrders(0);
      setLoading(false);
      return;
    }
    
    console.log('Loaded data:', { data: data?.length, count });
    
    // Apply search filter locally
    let filteredData = data || [];
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = (data || []).filter(order => {
        const fullName = order.full_name?.toLowerCase() || '';
        const email = (order.users as any)?.email?.toLowerCase() || '';
        const username = (order.users as any)?.username?.toLowerCase() || '';
        const realId = String(order.id).toLowerCase(); // Real database ID
        const displayId = String(generateOrderId(order.id)).toLowerCase(); // Display ID
        
        return fullName.includes(lowerSearchTerm) || 
               email.includes(lowerSearchTerm) || 
               username.includes(lowerSearchTerm) ||
               realId.includes(lowerSearchTerm) || // Search by real ID
               displayId.includes(lowerSearchTerm); // Search by display ID
      });
      
      console.log('Local search results:', { 
        searchTerm: lowerSearchTerm, 
        total: data?.length, 
        filtered: filteredData.length 
      });
    }
    
    // Apply pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    console.log('Final results:', { 
      startIndex, 
      endIndex, 
      paginated: paginatedData.length, 
      totalFiltered: filteredData.length 
    });
    
    setOrders(paginatedData);
    setTotalOrders(filteredData.length);
    setLoading(false);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name');
    setSubjects(data || []);
  };

  // Generate deterministic order ID based on real database ID
  const generateOrderId = (realId: number) => {
    // Use real database ID but format it to look random
    // Hash the real ID to get a consistent "random-looking" ID
    const hash = (realId * 7919) % 90000 + 10000; // Simple hash function
    return hash;
  };

  // Get order sequence number for avatar
  const getAvatarText = (order: any, index: number) => {
    return String(index + 1); // Start from 1, 2, 3...
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

  const approveOrder = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Không tìm thấy đơn hàng');
        return;
      }
      const displayId = generateOrderId(orderId);
      
      // Update order status to paid
      const { error: updateError } = await supabase.from('orders').update({
        status: 'paid',
        reviewed_by: profile!.id,
        reviewed_at: new Date().toISOString()
      }).eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        toast.error('Có lỗi khi cập nhật trạng thái đơn hàng');
        return;
      }

      // Grant permission to user
      if (order?.subject_id && order?.user_id) {
        const { error: permError } = await supabase.from('user_permissions').insert({
          user_id: order.user_id,
          subject_id: order.subject_id,
          granted_by: profile!.id,
        });

        if (permError) {
          console.error('Error granting permission:', permError);
          // Don't fail the whole operation if permission fails
          toast.warning('Đã duyệt đơn nhưng có lỗi khi cấp quyền truy cập');
        }
      }

      toast.success(`✅ Đã duyệt đơn #${displayId} và cấp quyền truy cập môn học`);
      loadOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Có lỗi xảy ra khi duyệt đơn hàng');
    }
  };

  const rejectOrder = async (orderId: number) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Không tìm thấy đơn hàng');
        return;
      }
      const displayId = generateOrderId(orderId);
      
      // Update order status to cancelled
      const { error: updateError } = await supabase.from('orders').update({
        status: 'cancelled',
        reviewed_by: profile!.id,
        reviewed_at: new Date().toISOString()
      }).eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        toast.error('Có lỗi khi cập nhật trạng thái đơn hàng');
        return;
      }

      // Revoke permission if exists
      if (order?.subject_id && order?.user_id) {
        const { error: revokeError } = await supabase.from('user_permissions')
          .delete()
          .eq('user_id', order.user_id)
          .eq('subject_id', order.subject_id);

        if (revokeError) {
          console.error('Error revoking permission:', revokeError);
          // Don't fail the whole operation if revoke fails
          toast.warning('Đã từ chối đơn nhưng có lỗi khi thu hồi quyền truy cập');
        }
      }

      toast.success(`❌ Đã từ chối đơn #${displayId} và thu hồi quyền truy cập`);
      loadOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Có lỗi xảy ra khi từ chối đơn hàng');
    }
  };

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Xoá đơn hàng này? Hành động không thể hoàn tác và sẽ thu hồi quyền học môn của người dùng.')) return;
    
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error('Không tìm thấy đơn hàng');
        return;
      }
      const displayId = generateOrderId(orderId);
      
      // Revoke permission first if exists
      if (order?.subject_id && order?.user_id) {
        const { error: revokeError } = await supabase.from('user_permissions')
          .delete()
          .eq('user_id', order.user_id)
          .eq('subject_id', order.subject_id);

        if (revokeError) {
          console.error('Error revoking permission:', revokeError);
          // Continue with deletion even if revoke fails
        }
      }

      // Delete the order
      const { error: deleteError } = await supabase.from('orders').delete().eq('id', orderId);

      if (deleteError) {
        console.error('Error deleting order:', deleteError);
        toast.error('Có lỗi khi xóa đơn hàng');
        return;
      }

      toast.success(`🗑️ Đã xóa đơn #${displayId} và thu hồi quyền truy cập`);
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Có lỗi xảy ra khi xóa đơn hàng');
    }
  };

  const openEditOrder = (order: any) => {
    setEditOrder(order);
    setEditForm({
      status: order.status,
      note: order.note || '',
      total_price: String(order.total_price),
    });
  };

  const saveEditOrder = async () => {
    if (!editOrder) return;
    
    try {
      const updateData: any = {
        status: editForm.status,
        note: editForm.note || null,
        total_price: parseFloat(editForm.total_price) || editOrder.total_price,
      };
      
      if (editForm.status !== editOrder.status) {
        updateData.reviewed_by = profile!.id;
        updateData.reviewed_at = new Date().toISOString();
      }
      
      // Handle permission changes
      if (editForm.status === 'paid' && editOrder.status !== 'paid' && editOrder.subject_id) {
        const { error: permError } = await supabase.from('user_permissions').insert({
          user_id: editOrder.user_id,
          subject_id: editOrder.subject_id,
          granted_by: profile!.id,
        });
        
        if (permError) {
          console.error('Error granting permission:', permError);
          toast.warning('Đã cập nhật đơn nhưng có lỗi khi cấp quyền truy cập');
        }
      }
      
      // Handle permission revocation
      if (editForm.status !== 'paid' && editOrder.status === 'paid' && editOrder.subject_id) {
        const { error: revokeError } = await supabase.from('user_permissions')
          .delete()
          .eq('user_id', editOrder.user_id)
          .eq('subject_id', editOrder.subject_id);
          
        if (revokeError) {
          console.error('Error revoking permission:', revokeError);
          toast.warning('Đã cập nhật đơn nhưng có lỗi khi thu hồi quyền truy cập');
        }
      }
      
      const { error: updateError } = await supabase.from('orders').update(updateData).eq('id', editOrder.id);
      
      if (updateError) {
        console.error('Error updating order:', updateError);
        toast.error('Có lỗi khi cập nhật đơn hàng');
        return;
      }
      
      toast.success('Đã cập nhật đơn hàng');
      setEditOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Error saving edit order:', error);
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng');
    }
  };

  const getSignedUrl = async (publicUrl: string) => {
    try {
      // For payment-proofs bucket which is private, try to get a signed URL
      // Extract the path from the public URL
      const match = publicUrl.match(/payment-proofs\/(.+)$/);
      if (match) {
        const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(match[1], 3600);
        if (error) {
          console.error('Error creating signed URL:', error);
          return publicUrl; // Fallback to public URL
        }
        if (data?.signedUrl) return data.signedUrl;
      }
      return publicUrl;
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return publicUrl; // Fallback to public URL
    }
  };

  const viewBill = async (url: string) => {
    if (!url) {
      toast.error('Không có hình ảnh để xem');
      return;
    }
    try {
      const signedUrl = await getSignedUrl(url);
      setPreviewBill(signedUrl);
    } catch (error) {
      console.error('Error viewing bill:', error);
      toast.error('Có lỗi khi tải hình ảnh');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  
  // Debug logging
  console.log('Debug:', { 
    searchTerm, 
    filter, 
    totalOrders: orders.length, 
    filteredCount: filtered.length,
    orders: orders.map(o => ({ id: o.id, full_name: o.full_name, email: (o.users as any)?.email }))
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đơn hàng</h1>
          <p className="text-sm text-muted-foreground">{totalOrders} đơn tổng cộng</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600">
              <Clock className="h-3.5 w-3.5" />
              {pendingCount} đơn chờ duyệt
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đơn', value: totalOrders, color: 'from-blue-500 to-blue-600', icon: Receipt },
          { label: 'Chờ duyệt', value: orders.filter(o => o.status === 'pending').length, color: 'from-yellow-500 to-yellow-600', icon: Clock },
          { label: 'Đã duyệt', value: orders.filter(o => o.status === 'paid').length, color: 'from-green-500 to-green-600', icon: Check },
          { label: 'Từ chối', value: orders.filter(o => o.status === 'cancelled').length, color: 'from-red-500 to-red-600', icon: X },
        ].map((stat, idx) => (
          <Card key={stat.label} className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, username, email, ID hiển thị, hoặc ID thật (không phân biệt hoa thường)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['pending', 'paid', 'cancelled', 'all'].map(s => {
            const count = s === 'all' ? totalOrders : orders.filter(o => o.status === s).length;
            return (
              <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm"
                className={cn("rounded-full gap-2", filter === s && s === 'pending' && "bg-yellow-500 hover:bg-yellow-600")}
                onClick={() => {
                  setFilter(s);
                  setCurrentPage(1);
                }}>
                {s === 'all' ? `Tất cả (${count})` : `${statusConfig[s]?.label} (${count})`}
              </Button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Không có đơn hàng nào ở trạng thái này</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map((o, index) => {
              const cfg = statusConfig[o.status];
              const displayId = generateOrderId(o.id); // Generate deterministic ID for display
              return (
                <Card key={o.id} className="border-0 shadow-xl overflow-hidden hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 hover:-translate-y-1 group bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  {/* Status bar */}
                  <div className="h-1.5" style={{ background: cfg?.barColor }} />
                  
                  <CardContent className={cn("p-4", expandedCards.has(o.id) ? "" : "pb-3")}>
                    {/* Header with toggle button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl transform hover:scale-110 transition-all duration-200 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-2 border-white/20">
                          {getAvatarText(o, index)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent drop-shadow-sm">Đơn hàng #{displayId}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">ID: {displayId}</span>
                        </div>
                        <Badge className={cn("px-4 py-2 text-sm font-bold shadow-lg transform hover:scale-105 transition-all duration-200", cfg?.className)}>
                          {cfg?.label}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 h-9 w-9 rounded-xl hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-white hover:border-primary hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl"
                        onClick={() => toggleCardExpansion(o.id)}
                      >
                        {expandedCards.has(o.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Basic info always visible */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 group">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{(o.users as any)?.username}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">User ID</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
                            onClick={() => copyToClipboard((o.users as any)?.username || '', 'username')}
                          >
                            <Copy className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 group">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-purple-600 transition-colors truncate max-w-[200px]">{(o.users as any)?.email}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full"
                            onClick={() => copyToClipboard((o.users as any)?.email || '', 'email')}
                          >
                            <Copy className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-3 justify-end group">
                          <p className="text-3xl font-black bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 bg-clip-text text-transparent drop-shadow-lg animate-gradient">
                            {Number(o.total_price).toLocaleString('vi')}₫
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-full"
                            onClick={() => copyToClipboard(String(Number(o.total_price)), 'giá tiền')}
                          >
                            <Copy className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 justify-end text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <Clock className="h-3 w-3" />
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{new Date(o.created_at).toLocaleDateString('vi')}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                            onClick={() => copyToClipboard(new Date(o.created_at).toLocaleString('vi'), 'ngày tạo')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Detailed view */}
                    {expandedCards.has(o.id) && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4 animate-slide-down">
                        {/* Customer info card */}
                        {(o.full_name || o.student_id || o.customer_email) && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-all duration-300">
                            <p className="text-sm font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Thông tin khách hàng
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {o.full_name && (
                                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg p-2 hover:bg-white/80 dark:hover:bg-black/30 transition-all duration-300 group">
                                  <User className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Họ tên</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{o.full_name}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full"
                                    onClick={() => copyToClipboard(o.full_name, 'họ tên')}
                                  >
                                    <Copy className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                                  </Button>
                                </div>
                              )}
                              {o.student_id && (
                                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg p-2 hover:bg-white/80 dark:hover:bg-black/30 transition-all duration-300 group">
                                  <IdCard className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">MSSV</p>
                                    <p className="text-sm font-black font-mono text-gray-900 dark:text-white">{o.student_id}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full"
                                    onClick={() => copyToClipboard(o.student_id, 'MSSV')}
                                  >
                                    <Copy className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                                  </Button>
                                </div>
                              )}
                              {o.customer_email && (
                                <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg p-2 hover:bg-white/80 dark:hover:bg-black/30 transition-all duration-300 group">
                                  <Mail className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{o.customer_email}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full"
                                    onClick={() => copyToClipboard(o.customer_email, 'email khách hàng')}
                                  >
                                    <Copy className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Subject info */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Môn học</p>
                              <p className="text-lg font-black bg-gradient-to-r from-purple-700 via-pink-600 to-purple-800 bg-clip-text text-transparent">{o.subject_name || 'Môn học'}</p>
                            </div>
                            {o.subject_name && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
                                onClick={() => copyToClipboard(o.subject_name, 'tên môn học')}
                              >
                                <Copy className="h-3 w-3 text-purple-600 dark:text-purple-300" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Payment proof */}
                        {o.payment_proof && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl border border-emerald-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-3 border-b border-emerald-200 dark:border-green-800">
                              <p className="text-sm font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Bill chuyển khoản
                              </p>
                            </div>
                            <div className="p-4">
                              <div
                                className="w-full h-32 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg cursor-pointer hover:from-emerald-100 hover:to-green-100 transition-all duration-300 flex items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-400"
                                onClick={() => viewBill(o.payment_proof)}
                              >
                                <Button variant="outline" className="gap-2 bg-white hover:bg-emerald-50 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg">
                                  <Eye className="h-4 w-4" />
                                  <span className="font-bold">Xem bill thanh toán</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        {!o.payment_proof && (
                          <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Chưa upload bill thanh toán</span>
                            </div>
                          </div>
                        )}

                        {/* Note */}
                        {o.note && (
                          <div className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Ghi chú:</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                                onClick={() => copyToClipboard(o.note, 'ghi chú')}
                              >
                                <Copy className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{o.note}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                          {o.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 font-bold"
                                onClick={() => approveOrder(o.id)}
                              >
                                <Check className="h-4 w-4" />
                                Duyệt
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-red-500/25 hover:scale-105 transition-all duration-300 font-bold"
                                onClick={() => setRejectOrderId(o.id)}
                              >
                                <X className="h-4 w-4" />
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-500 hover:scale-105 hover:shadow-md transition-all duration-300 font-bold"
                            onClick={() => openEditOrder(o)}
                          >
                            <Pencil className="h-4 w-4" />
                            Sửa
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-105 transition-all duration-300 font-bold"
                            onClick={() => deleteOrder(o.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Xoá
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Pagination */}
          {totalOrders > ordersPerPage && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Trang {currentPage} / {Math.ceil(totalOrders / ordersPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalOrders / ordersPerPage), currentPage + 1))}
                disabled={currentPage >= Math.ceil(totalOrders / ordersPerPage)}
                className="gap-1"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectOrderId} onOpenChange={() => setRejectOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Từ chối đơn #{rejectOrderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Nhập lý do từ chối:</p>
            <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="VD: Thông tin chuyển khoản không khớp..." rows={3} />
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={() => rejectOrderId && rejectOrder(rejectOrderId)}>Xác nhận từ chối</Button>
              <Button variant="outline" onClick={() => setRejectOrderId(null)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit order dialog */}
      <Dialog open={!!editOrder} onOpenChange={() => setEditOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Sửa đơn #{editOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Trạng thái</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="paid">Đã duyệt</SelectItem>
                  <SelectItem value="cancelled">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tổng tiền</Label>
              <Input type="number" value={editForm.total_price} onChange={e => setEditForm({ ...editForm, total_price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Ghi chú</Label>
              <Textarea value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="Ghi chú..." rows={2} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEditOrder}
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                Lưu thay đổi
              </Button>
              <Button variant="outline" onClick={() => setEditOrder(null)}>Hủy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill preview dialog */}
      <Dialog open={!!previewBill} onOpenChange={() => setPreviewBill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Bill chuyển khoản</DialogTitle></DialogHeader>
          {previewBill && <img src={previewBill} alt="Bill" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
