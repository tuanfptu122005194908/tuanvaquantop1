import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_1')
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY_1 is not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { order_id } = await req.json()
    if (!order_id) throw new Error('order_id is required')

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(username, email)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) throw new Error('Order not found')

    // Fetch admin emails
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active')

    if (!admins || admins.length === 0) {
      console.log('No active admins found')
      return new Response(JSON.stringify({ message: 'No admins to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // In Resend sandbox mode, can only send to the account owner email
    const adminEmails = ['lequan12305@gmail.com']
    const siteUrl = Deno.env.get('SITE_URL') || 'https://tuanvaquantop1.com'
    const fromEmail = 'onboarding@resend.dev'

    const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + 'đ'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🛒 Đơn hàng mới #${order.id}</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Họ tên:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${order.full_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">MSSV:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${order.student_id || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${order.customer_email || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Môn học:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px;">${order.subject_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tổng tiền:</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #ec4899;">${formatPrice(order.total_price)}</td></tr>
          </table>
          <a href="${siteUrl}/admin/orders" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Xem đơn hàng →</a>
        </div>
      </div>
    `

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `TQMaster <${fromEmail}>`,
        to: adminEmails,
        subject: `[TQMaster] Đơn hàng mới #${order.id} - ${order.full_name || 'Khách hàng'}`,
        html,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(`Resend API failed [${response.status}]: ${JSON.stringify(result)}`)
    }

    // Update notification status
    await supabase
      .from('email_notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('order_id', order_id)
      .eq('status', 'pending')

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
