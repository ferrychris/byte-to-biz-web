import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  projectId: string;
  businessName: string;
  businessType: string;
  description: string;
  targetAudience?: string;
  location?: string;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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

    const { projectId, businessName, businessType, description, targetAudience, location }: GenerationRequest = await req.json();

    console.log('Starting website generation for project:', projectId);

    // Update progress: Planning stage
    await updateProgress(supabase, projectId, 'planning', 'in_progress', 10);

    // Generate website structure using OpenAI
    const websiteStructure = await generateWebsiteStructure({
      businessName,
      businessType,
      description,
      targetAudience,
      location
    });

    await updateProgress(supabase, projectId, 'content_generation', 'in_progress', 30);

    // Generate individual pages
    const pages = await generateWebsitePages(websiteStructure, {
      businessName,
      businessType,
      description,
      targetAudience,
      location
    });

    await updateProgress(supabase, projectId, 'code_generation', 'in_progress', 60);

    // Generate HTML, CSS, and JS
    const generatedCode = await generateWebsiteCode(pages, websiteStructure, {
      businessName,
      businessType,
      description,
      targetAudience,
      location
    });

    await updateProgress(supabase, projectId, 'finalization', 'in_progress', 90);

    // Save generated data to database
    const { error: insertError } = await supabase
      .from('website_generated_data')
      .insert({
        project_id: projectId,
        html_content: generatedCode.html,
        css_content: generatedCode.css,
        js_content: generatedCode.js,
        assets_urls: generatedCode.assets,
        metadata: { structure: websiteStructure, pages }
      });

    if (insertError) {
      throw insertError;
    }

    // Update project status to completed
    await supabase
      .from('website_projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    await updateProgress(supabase, projectId, 'completed', 'completed', 100);

    return new Response(JSON.stringify({ 
      success: true,
      html: generatedCode.html,
      css: generatedCode.css,
      js: generatedCode.js
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in website generation:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateProgress(supabase: any, projectId: string, stage: string, status: string, percentage: number) {
  await supabase
    .from('generation_progress')
    .insert({
      project_id: projectId,
      stage,
      status,
      progress_percentage: percentage
    });
}

async function generateWebsiteStructure(businessInfo: any) {
  const prompt = `
You are creating a website structure for "${businessInfo.businessName}", a ${businessInfo.businessType} business.

BUSINESS DETAILS:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
${businessInfo.targetAudience ? `- Target Audience: ${businessInfo.targetAudience}` : ''}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

Create a website structure that specifically reflects this ${businessInfo.businessType} business. The pages, navigation, and color scheme should be tailored to ${businessInfo.businessName} and appropriate for their target audience.

Return a JSON object with this structure:
{
  "pages": ["home", "about", "services", "contact"],
  "colorScheme": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex"
  },
  "layout": "modern",
  "navigation": ["Home", "About", "Services", "Contact"],
  "businessFocus": "brief description of what makes this business unique"
}

Make sure the pages are relevant to a ${businessInfo.businessType} business and the colors match the industry.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional web designer. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Strip markdown code fences if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanContent);
}

async function generateWebsitePages(structure: any, businessInfo: any) {
  const pages = [];
  
  for (const pageName of structure.pages) {
    const prompt = `
Create compelling content for the ${pageName} page of "${businessInfo.businessName}".

BUSINESS DETAILS:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
${businessInfo.targetAudience ? `- Target Audience: ${businessInfo.targetAudience}` : ''}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

WEBSITE STRUCTURE: ${JSON.stringify(structure, null, 2)}

Create content that specifically showcases ${businessInfo.businessName} as a ${businessInfo.businessType}. Use the business name throughout, mention the location if provided, and write for the target audience.

For the ${pageName} page, return a JSON object with:
{
  "title": "${businessInfo.businessName} - [Page specific title]",
  "content": {
    "hero": {
      "headline": "Compelling headline featuring ${businessInfo.businessName}",
      "subheadline": "Supporting text about ${businessInfo.businessType} services", 
      "cta": "Call to action specific to ${businessInfo.businessType}"
    },
    "sections": [
      {
        "type": "text" | "features" | "testimonials" | "contact",
        "title": "Section title",
        "content": "Detailed content or array of items specific to ${businessInfo.businessName}"
      }
    ]
  }
}

Make sure all content is specifically tailored to ${businessInfo.businessName} and not generic.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional copywriter. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Strip markdown code fences if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const pageContent = JSON.parse(cleanContent);
    
    pages.push({
      name: pageName,
      ...pageContent
    });
  }
  
  return pages;
}

async function generateWebsiteCode(pages: any[], structure: any, businessInfo: any) {
  const prompt = `
Generate a complete, professional website for "${businessInfo.businessName}".

BUSINESS INFORMATION:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
${businessInfo.targetAudience ? `- Target Audience: ${businessInfo.targetAudience}` : ''}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

WEBSITE STRUCTURE: ${JSON.stringify(structure, null, 2)}
PAGE CONTENT: ${JSON.stringify(pages, null, 2)}

Create a modern, professional website that specifically represents ${businessInfo.businessName}. Use the exact business name, incorporate the business type, and ensure all content reflects their specific services/products.

Requirements:
- Use "${businessInfo.businessName}" as the main title and in meta tags
- Include business type "${businessInfo.businessType}" in descriptions
- Modern, clean design with smooth animations appropriate for ${businessInfo.businessType}
- Fully responsive (mobile-first)
- SEO optimized with proper meta tags including business name and type
- Accessible (WCAG 2.1 AA compliant)
- Fast loading with optimized code
- Contact section with business location if provided
- Professional typography and spacing suitable for ${businessInfo.businessType}
- Color scheme from structure: ${JSON.stringify(structure.colorScheme)}

Return a JSON object with:
{
  "html": "Complete HTML document with all pages and ${businessInfo.businessName} branding",
  "css": "Complete CSS with responsive design, animations, and brand colors",
  "js": "Complete JavaScript with form validation and interactivity",
  "assets": ["list of image URLs from Unsplash that match ${businessInfo.businessType}"]
}

Make sure the website clearly represents ${businessInfo.businessName} as a ${businessInfo.businessType} business.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert full-stack web developer. Generate production-ready code. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_completion_tokens: 4000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Strip markdown code fences if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanContent);
}