import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { projectId } = await req.json();

    // Get the latest progress for the project
    const { data: progress, error } = await supabase
      .from('generation_progress')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    // Get project details
    const { data: project } = await supabase
      .from('website_projects')
      .select('status')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    return new Response(JSON.stringify({ 
      progress: progress || { stage: 'starting', progress_percentage: 0 },
      project
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});