import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, Check, ShoppingCart, X, ArrowRight, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlansPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [cart, setCart] = useState<Map<number, { plan: any; quantity: number }>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*, subjects(name)').eq('is_active', true).order('price');
    setPlans(data || []);
    setLoading(false);
  };

  const addToCart = (plan: any) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(plan.id);
      next.set(plan.id, { plan, quantity: (existing?.quantity || 0) + 1 });
      return next;
    });
    toast.success(`Đã thêm "${plan.name}" vào giỏ`);
  };

  const removeFromCart = (planId: number) => {
    setCart(prev => { const next = new Map(prev); next.delete(planId); return next; });
  };

  const totalPrice = Array.from(cart.values()).reduce((s, item) => s + Number(item.plan.price) * item.quantity, 0);

  const checkout = async () => {
    if (cart.size === 0) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: profile!.id,
        total_price: totalPrice,
        status: 'pending',
      }).select().single();
      if (error) throw error;

      const items = Array.from(cart.values()).map(item => ({
        order_id: order.id,
        plan_id: item.plan.id,
        quantity: item.quantity,
        unit_price: Number(item.plan.price),
      }));
      await supabase.from('order_items').insert(items);
      toast.success('Đặt hàng thành công!');

      // Send email notification to admins (fire and forget)
      supabase.functions.invoke('send-order-notification', {
        body: { order_id: order.id },
      }).catch(console.error);

      navigate('/orders');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const gradients = [
    'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))',
    'linear-gradient(135deg, hsl(160,55%,45%), hsl(170,65%,38%))',
    'linear-gradient(135deg, hsl(25,90%,65%), hsl(25,90%,52%))',
    'linear-gradient(135deg, hsl(280,65%,55%), hsl(310,60%,52%))',
  ];

  return (
    <div className="container py-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Mua gói học</h1>
        <p className="text-sm text-muted-foreground mt-1">Chọn gói phù hợp để truy cập đề thi và luyện tập</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-80 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const inCart = cart.has(plan.id);
            return (
              <Card key={plan.id} className="hover-scale border shadow-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 text-white" style={{ background: gradients[idx % gradients.length] }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-white/80" />
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                      {(plan.subjects as any)?.name || 'Combo'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black">{Number(plan.price).toLocaleString('vi')}</span>
                    <span className="text-sm text-white/80">₫</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-white/80 text-xs">
                    <Clock className="h-3 w-3" />
                    {plan.duration_days} ngày sử dụng
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {(plan.features as string[]).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-3">
                    {inCart ? (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 gap-2 text-green-600 border-green-300" disabled>
                          <Check className="h-4 w-4" /> Đã thêm
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(plan.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => addToCart(plan)}
                        style={{ background: gradients[idx % gradients.length] }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Thêm vào giỏ
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {plans.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Chưa có gói học nào được cung cấp.</p>
          </CardContent>
        </Card>
      )}

      {/* Cart */}
      {cart.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <Card className="border shadow-2xl w-80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Giỏ hàng ({cart.size} gói)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(cart.entries()).map(([id, item]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.plan.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="font-medium">{(Number(item.plan.price) * item.quantity).toLocaleString('vi')}₫</span>
                    <button onClick={() => removeFromCart(id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Tổng</span>
                <span>{totalPrice.toLocaleString('vi')}₫</span>
              </div>
              <Button className="w-full gap-2" onClick={checkout} disabled={submitting}
                style={{ background: 'linear-gradient(135deg, hsl(330,65%,60%), hsl(270,55%,60%))' }}>
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Zap className="h-4 w-4" /> Đặt hàng <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
