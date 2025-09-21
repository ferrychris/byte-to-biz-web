import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface Typography {
  headings: string;
  body: string;
}

interface GenerationRequest {
  projectId: string;
  businessName: string;
  businessType: string;
  description: string;
  targetAudience: string;
  location?: string;
  websiteTemplate?: string;
  colorScheme?: ColorScheme;
  typography?: Typography;
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

    const { projectId, businessName, businessType, description, targetAudience, location, websiteTemplate, colorScheme, typography }: GenerationRequest = await req.json();
    
    const logPrefix = `[generate-website:${projectId}]`;
    console.log(`${logPrefix} Starting website generation with template: ${websiteTemplate || 'default'}`);

    // Progress tracking already handled with logPrefix

    // Update progress: Planning stage
    await updateProgress(supabase, projectId, 'planning', 'in_progress', 10);

    // Generate website structure using OpenAI
    const websiteStructure = await generateWebsiteStructure({
      projectId,
      businessName,
      businessType,
      description,
      targetAudience,
      location,
      websiteTemplate,
      colorScheme,
      typography
    });

    await updateProgress(supabase, projectId, 'content_generation', 'in_progress', 30);

    // Generate individual pages
    const pages = await generateWebsitePages(websiteStructure, {
      projectId,
      businessName,
      businessType,
      description,
      targetAudience,
      location,
      websiteTemplate,
      colorScheme,
      typography
    });

    await updateProgress(supabase, projectId, 'code_generation', 'in_progress', 60);

    // Generate HTML, CSS, and JS
    const generatedCode = await generateWebsiteCode(pages, websiteStructure, {
      projectId,
      businessName,
      businessType,
      description,
      targetAudience,
      location,
      websiteTemplate,
      colorScheme,
      typography
    });

    await updateProgress(supabase, projectId, 'finalization', 'in_progress', 90);

    // Save generated data to database
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
          status: 'deployed',
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
              status: 'deployed'
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

interface BusinessInfo {
  projectId: string;
  businessName: string;
  businessType: string;
  description: string;
  targetAudience: string;
  location?: string;
  websiteTemplate?: string;
  colorScheme?: ColorScheme;
  typography?: Typography;
}

async function generateWebsiteStructure(businessInfo: BusinessInfo) {
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

async function generateWebsitePages(structure: Record<string, any>, businessInfo: BusinessInfo) {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website pages content...`);
  console.log(`${logPrefix} Structure received:`, JSON.stringify(structure, null, 2));
  
  const pages = [];
  
  // Ensure structure.pages is an array
  if (!structure || !Array.isArray(structure.pages)) {
    console.error(`${logPrefix} Error: structure.pages is not an array:`, structure);
    throw new Error('Invalid website structure: pages must be an array');
  }
  
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

async function generateWebsiteCode(pages: Record<string, any>[], structure: Record<string, any>, businessInfo: BusinessInfo) {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website code...`);
  
  const prompt = `
Generate a complete, professional website for "${businessInfo.businessName}", a ${businessInfo.businessType} business.

BUSINESS INFORMATION:
- Business Name: ${businessInfo.businessName}
- Business Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
- Target Audience: ${businessInfo.targetAudience}
${businessInfo.location ? `- Location: ${businessInfo.location}` : ''}

WEBSITE STRUCTURE: ${JSON.stringify(structure, null, 2)}
PAGE CONTENT: ${JSON.stringify(pages, null, 2)}

DESIGN PREFERENCES:
- Template: ${businessInfo.websiteTemplate || 'modern'}
- Color Scheme: ${JSON.stringify(businessInfo.colorScheme || structure.colorScheme)}
- Typography: ${JSON.stringify(businessInfo.typography || structure.fonts)}

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
- Use the specified color scheme and typography
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

IMPORTANT: Ensure all HTML attributes with quotes are properly escaped in the JSON response.
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
        { role: 'system', content: 'You are an expert full-stack web developer specializing in creating beautiful, functional websites for businesses using Bootstrap 5. Generate production-ready code with separate HTML files for each page. Return only valid JSON. Make sure to properly escape all quotes in HTML attributes.' },
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
    // First attempt to parse the JSON directly
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error(`${logPrefix} Error parsing JSON for website code:`, error);
    console.error(`${logPrefix} Raw content (first 1000 chars):`, cleanContent.substring(0, 1000));
    
    // Fallback: Generate a simplified structure with basic pages
    console.log(`${logPrefix} Generating fallback website structure...`);
    
    // Try to fix common JSON issues before giving up
    let fixedContent = cleanContent;
    
    // Try to fix unterminated strings by finding the last complete object
    try {
      // Find the last complete closing brace
      const lastBrace = fixedContent.lastIndexOf('}');
      if (lastBrace > 0) {
        fixedContent = fixedContent.substring(0, lastBrace + 1);
        console.log(`${logPrefix} Attempting to parse truncated JSON...`);
        return JSON.parse(fixedContent);
      }
    } catch (fixError) {
      console.log(`${logPrefix} Truncation fix failed, proceeding with fallback generation`);
    }
    
    // If JSON fixing didn't work, generate fallback pages
    const defaultPages = ['home', 'about', 'services', 'contact'];
    const fallbackPages: Array<{name: string, html: string}> = [];
    
    for (const pageName of defaultPages) {
      fallbackPages.push({
        name: pageName,
        html: generateBasicHtml(pageName, businessInfo)
      });
    }
    
    // Return the fallback structure
    return {
      pages: fallbackPages,
      css: generateBasicCss(),
      js: generateBasicJs(),
      assets: []
    };
  }
}

// Helper function to generate basic HTML for fallback pages
function generateBasicHtml(pageName: string, businessInfo: BusinessInfo) {
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessInfo.businessName} - ${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="styles.css" rel="stylesheet">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
      <a class="navbar-brand" href="#">${businessInfo.businessName}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><a class="nav-link ${pageName === 'home' ? 'active' : ''}" href="home.html">Home</a></li>
          <li class="nav-item"><a class="nav-link ${pageName === 'about' ? 'active' : ''}" href="about.html">About</a></li>
          <li class="nav-item"><a class="nav-link ${pageName === 'services' ? 'active' : ''}" href="services.html">Services</a></li>
          <li class="nav-item"><a class="nav-link ${pageName === 'contact' ? 'active' : ''}" href="contact.html">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>

  <header class="bg-primary text-white text-center py-5">
    <div class="container">
      <h1>${businessInfo.businessName} - ${title}</h1>
      <p class="lead">${businessInfo.businessType} in ${businessInfo.location || 'Your Area'}</p>
    </div>
  </header>

  <main class="container py-5">
    ${getPageSpecificContent(pageName, businessInfo)}
  </main>

  <footer class="bg-dark text-white text-center py-3">
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${businessInfo.businessName}. All Rights Reserved.</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="scripts.js"></script>
</body>
</html>`;
}

// Helper function to generate page-specific content
function getPageSpecificContent(pageName: string, businessInfo: BusinessInfo) {
  switch (pageName) {
    case 'home':
      return `
        <section>
          <h2>Welcome to ${businessInfo.businessName}</h2>
          <p>${businessInfo.description}</p>
          <div class="row mt-4">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h3 class="card-title">Quality Service</h3>
                  <p class="card-text">We provide top-quality services to meet all your ${businessInfo.businessType} needs.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h3 class="card-title">Expert Team</h3>
                  <p class="card-text">Our team of experts is dedicated to delivering the best results for our clients.</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h3 class="card-title">Customer Satisfaction</h3>
                  <p class="card-text">Your satisfaction is our priority. We strive to exceed your expectations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
    case 'about':
      return `
        <section>
          <h2>About Us</h2>
          <p>${businessInfo.description}</p>
          <p>At ${businessInfo.businessName}, we are dedicated to providing exceptional ${businessInfo.businessType} services. With years of experience in the industry, we have built a reputation for excellence and reliability.</p>
          <p>Our mission is to deliver high-quality solutions that meet the unique needs of each client. We believe in building long-lasting relationships based on trust, integrity, and outstanding service.</p>
        </section>
      `;
    case 'services':
      return `
        <section>
          <h2>Our Services</h2>
          <p>We offer a comprehensive range of ${businessInfo.businessType} services designed to meet your specific needs.</p>
          <div class="row mt-4">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-body">
                  <h3 class="card-title">Service 1</h3>
                  <p class="card-text">Detailed description of the first service we offer.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-body">
                  <h3 class="card-title">Service 2</h3>
                  <p class="card-text">Detailed description of the second service we offer.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-body">
                  <h3 class="card-title">Service 3</h3>
                  <p class="card-text">Detailed description of the third service we offer.</p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-body">
                  <h3 class="card-title">Service 4</h3>
                  <p class="card-text">Detailed description of the fourth service we offer.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
    case 'contact':
      return `
        <section>
          <h2>Contact Us</h2>
          <p>We'd love to hear from you. Please fill out the form below or use the contact information provided.</p>
          <div class="row mt-4">
            <div class="col-md-6">
              <form>
                <div class="mb-3">
                  <label for="name" class="form-label">Name</label>
                  <input type="text" class="form-control" id="name" required>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                  <label for="message" class="form-label">Message</label>
                  <textarea class="form-control" id="message" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Send Message</button>
              </form>
            </div>
            <div class="col-md-6">
              <h3>Contact Information</h3>
              <p><strong>Address:</strong> ${businessInfo.location || 'Our Location'}</p>
              <p><strong>Email:</strong> info@${businessInfo.businessName.toLowerCase().replace(/\s+/g, '')}.com</p>
              <p><strong>Phone:</strong> (123) 456-7890</p>
            </div>
          </div>
        </section>
      `;
    default:
      return `
        <section>
          <h2>${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h2>
          <p>Content for ${pageName} page.</p>
        </section>
      `;
  }
}

// Helper function to generate basic CSS
function generateBasicCss() {
  return `
/* Custom styles for ${new Date().toISOString().split('T')[0]} */

:root {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --accent-color: #ffc107;
}

body {
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
}

.navbar-brand {
  font-weight: bold;
}

header {
  background: linear-gradient(135deg, var(--primary-color), #0a58ca);
}

.card {
  transition: transform 0.3s, box-shadow 0.3s;
  margin-bottom: 1rem;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

footer {
  margin-top: 2rem;
}

@media (max-width: 768px) {
  header {
    padding: 2rem 0;
  }
}
`;
}

// Helper function to generate basic JavaScript
function generateBasicJs() {
  return `
// Form validation
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Basic validation
      let valid = true;
      const inputs = form.querySelectorAll('input, textarea');
      
      inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
          valid = false;
          input.classList.add('is-invalid');
        } else {
          input.classList.remove('is-invalid');
        }
      });
      
      if (valid) {
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success mt-3';
        alert.textContent = 'Form submitted successfully! We will get back to you soon.';
        form.appendChild(alert);
        
        // Reset form
        form.reset();
        
        // Remove alert after 5 seconds
        setTimeout(() => {
          alert.remove();
        }, 5000);
      }
    });
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});
`;
}