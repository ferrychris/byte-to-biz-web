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
    const logPrefix = `[generate-website:${projectId}]`;
    const deploymentUrl = `https://${businessName.toLowerCase().replace(/\s+/g, '-')}-${projectId.substring(0, 8)}.netlify.app`;
    
    // Extract the home page HTML for the main content
    const homePage = generatedCode.pages?.find(page => page.name === 'home');
    const homePageHtml = homePage?.html || '';
    
    const { error: insertError } = await supabase
      .from('website_generated_data')
      .insert({
        project_id: projectId,
        html_content: homePageHtml,
        css_content: generatedCode.css,
        js_content: generatedCode.js,
        assets_urls: generatedCode.assets,
        metadata: { 
          structure: websiteStructure, 
          pages: pages,
          generatedPages: generatedCode.pages || [] 
        }
      });

    if (insertError) {
      throw insertError;
    }
    
    // Create deployment record
    try {
      const { error: deploymentError } = await supabase
        .from('website_deployments')
        .insert({
          project_id: projectId,
          deployment_url: deploymentUrl,
          status: 'completed',
          provider: 'netlify'
        });
        
      if (deploymentError) {
        // If the error is about the provider column, try without it
        if (deploymentError.message?.includes("provider")) {
          console.log(`${logPrefix} Provider column not found, trying without it`);
          const { error: retryError } = await supabase
            .from('website_deployments')
            .insert({
              project_id: projectId,
              deployment_url: deploymentUrl,
              status: 'completed'
            });
            
          if (retryError) {
            console.error(`${logPrefix} Error creating deployment record (retry):`, retryError);
          }
        } else {
          console.error(`${logPrefix} Error creating deployment record:`, deploymentError);
        }
      }
    } catch (deployErr) {
      console.error(`${logPrefix} Exception creating deployment record:`, deployErr);
    }

    // Update project status and URL
    await supabase
      .from('website_projects')
      .update({ 
        status: 'completed',
        deployment_url: deploymentUrl 
      })
      .eq('id', projectId);

    await updateProgress(supabase, projectId, 'completed', 'completed', 100);

    return new Response(JSON.stringify({ 
      success: true,
      html: generatedCode.html,
      css: generatedCode.css,
      js: generatedCode.js,
      deploymentUrl: deploymentUrl
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
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website structure using GPT-5...`);
  
  const prompt = `
You are creating a website structure for "${businessInfo.businessName}", a ${businessInfo.businessType} business.

BUSINESS DETAILS:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
${businessInfo.targetAudience ? `- Target Audience: ${businessInfo.targetAudience}` : ''}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

Create a comprehensive website structure that specifically reflects this ${businessInfo.businessType} business. The pages, navigation, and color scheme should be tailored to ${businessInfo.businessName} and appropriate for their target audience.

Return a JSON object with this structure:
{
  "pages": ["home", "about", "services", "contact", ...other relevant pages],
  "colorScheme": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "layout": "modern",
  "navigation": ["Home", "About", "Services", "Contact", ...other pages],
  "fonts": {
    "headings": "font name",
    "body": "font name"
  },
  "businessFocus": "brief description of what makes this business unique",
  "keyFeatures": ["feature1", "feature2", "feature3"]
}

Make sure the pages are relevant to a ${businessInfo.businessType} business and the colors match the industry. Choose a color scheme that conveys the right emotion and brand identity for this specific business.
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
        { role: 'system', content: 'You are a professional web designer specializing in creating unique website structures for businesses. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    console.error(`${logPrefix} Error in OpenAI response:`, data);
    throw new Error('Failed to generate website structure');
  }
  
  const content = data.choices[0].message.content;
  
  // Strip markdown code fences if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`${logPrefix} Error parsing JSON:`, error);
    console.error(`${logPrefix} Raw content:`, cleanContent);
    throw new Error('Failed to parse website structure JSON');
  }
}

async function generateWebsitePages(structure: any, businessInfo: any) {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website pages content...`);
  const pages = [];
  
  for (const pageName of structure.pages) {
    console.log(`${logPrefix} Generating content for ${pageName} page...`);
    const prompt = `
Create compelling, detailed content for the ${pageName} page of "${businessInfo.businessName}".

BUSINESS DETAILS:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
${businessInfo.targetAudience ? `- Target Audience: ${businessInfo.targetAudience}` : ''}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

WEBSITE STRUCTURE: ${JSON.stringify(structure, null, 2)}

Create content that specifically showcases ${businessInfo.businessName} as a ${businessInfo.businessType}. Use the business name throughout, mention the location if provided, and write for the target audience. The content should be SEO-friendly and include keywords relevant to the business type.

For the ${pageName} page, return a JSON object with:
{
  "title": "${businessInfo.businessName} - [Page specific title]",
  "metaDescription": "SEO-optimized meta description for ${businessInfo.businessName}",
  "content": {
    "hero": {
      "headline": "Compelling headline featuring ${businessInfo.businessName}",
      "subheadline": "Supporting text about ${businessInfo.businessType} services", 
      "cta": "Call to action specific to ${businessInfo.businessType}"
    },
    "sections": [
      {
        "type": "text" | "features" | "testimonials" | "contact" | "gallery" | "pricing" | "faq",
        "title": "Section title",
        "content": "Detailed content or array of items specific to ${businessInfo.businessName}"
      }
    ]
  }
}

Make sure all content is specifically tailored to ${businessInfo.businessName} and not generic. Include at least 3-5 sections that would be most relevant for a ${businessInfo.businessType} business.
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
          { role: 'system', content: 'You are a professional copywriter and SEO expert specializing in business websites. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error(`${logPrefix} Error in OpenAI response for ${pageName} page:`, data);
      throw new Error(`Failed to generate content for ${pageName} page`);
    }
    
    const content = data.choices[0].message.content;
    
    // Strip markdown code fences if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const pageContent = JSON.parse(cleanContent);
      
      pages.push({
        name: pageName,
        ...pageContent
      });
    } catch (error) {
      console.error(`${logPrefix} Error parsing JSON for ${pageName} page:`, error);
      console.error(`${logPrefix} Raw content:`, cleanContent);
      throw new Error(`Failed to parse JSON for ${pageName} page`);
    }
  }
  
  return pages;
}

async function generateWebsiteCode(pages: any[], structure: any, businessInfo: any) {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website code...`);
  
  const prompt = `
Generate a complete, professional website for "${businessInfo.businessName}", a ${businessInfo.businessType} business.

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
- Use Bootstrap 5 CSS framework for styling and layout
- Create separate HTML files for each page (home, about, services, contact, etc.)
- Use "${businessInfo.businessName}" as the main title and in meta tags
- Include business type "${businessInfo.businessType}" in descriptions
- Modern, clean design with smooth animations appropriate for ${businessInfo.businessType}
- Fully responsive (mobile-first) using Bootstrap's responsive grid system
- SEO optimized with proper meta tags including business name and type
- Accessible (WCAG 2.1 AA compliant)
- Fast loading with optimized code
- Contact section with business location if provided
- Professional typography and spacing suitable for ${businessInfo.businessType}
- Color scheme from structure: ${JSON.stringify(structure.colorScheme)}
- Use the specified fonts if available: ${JSON.stringify(structure.fonts || {})}
- Include a consistent navigation bar across all pages
- Add proper links between pages

Return a JSON object with:
{
  "pages": [
    {
      "name": "home",
      "html": "Complete HTML for home page with Bootstrap 5 and ${businessInfo.businessName} branding"
    },
    {
      "name": "about",
      "html": "Complete HTML for about page with Bootstrap 5 and ${businessInfo.businessName} branding"
    },
    {
      "name": "services",
      "html": "Complete HTML for services page with Bootstrap 5 and ${businessInfo.businessName} branding"
    },
    {
      "name": "contact",
      "html": "Complete HTML for contact page with Bootstrap 5 and ${businessInfo.businessName} branding"
    }
  ],
  "css": "Any additional custom CSS beyond Bootstrap 5",
  "js": "Complete JavaScript with form validation and interactivity",
  "assets": ["list of image URLs from Unsplash that match ${businessInfo.businessType}"]
}

Make sure to include the Bootstrap 5 CDN links in each HTML file. The website should clearly represent ${businessInfo.businessName} as a ${businessInfo.businessType} business. The code should be production-ready, well-structured, and follow best practices.
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
        { role: 'system', content: 'You are an expert full-stack web developer specializing in creating beautiful, functional websites for businesses using Bootstrap 5. Generate production-ready code with separate HTML files for each page. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    console.error(`${logPrefix} Error in OpenAI response for website code:`, data);
    throw new Error('Failed to generate website code');
  }
  
  const content = data.choices[0].message.content;
  
  // Strip markdown code fences if present
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`${logPrefix} Error parsing JSON for website code:`, error);
    console.error(`${logPrefix} Raw content:`, cleanContent);
    throw new Error('Failed to parse website code JSON');
  }
}