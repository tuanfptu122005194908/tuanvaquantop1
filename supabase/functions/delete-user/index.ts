import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') throw new Error('Forbidden: admin only')

    const { user_id } = await req.json()
    if (!user_id) throw new Error('user_id is required')
    if (user_id === caller.id) throw new Error('Cannot delete yourself')

    // Delete from auth (cascades to public.users via FK)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
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
