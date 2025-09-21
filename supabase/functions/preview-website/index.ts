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
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const page = url.searchParams.get('page') || 'home';
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const logPrefix = `[preview-website:${projectId}]`;
    console.log(`${logPrefix} Serving preview for page: ${page}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the generated website content
    const { data: websiteData, error: websiteError } = await supabase
      .from('website_generated_data')
      .select('html_content, css_content, js_content, metadata')
      .eq('project_id', projectId)
      .single();

    if (websiteError) {
      console.error(`${logPrefix} Error fetching website data:`, websiteError);
      throw new Error('Failed to fetch website data');
    }

    if (!websiteData) {
      throw new Error('Website data not found');
    }

    // Get project details for title and metadata
    const { data: projectData, error: projectError } = await supabase
      .from('website_projects')
      .select('business_name, business_type, description')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error(`${logPrefix} Error fetching project data:`, projectError);
    }

    // Extract page content from metadata if available
    let pageContent = '';
    let pageTitle = projectData?.business_name || 'Generated Website';
    
    if (websiteData.metadata && websiteData.metadata.pages) {
      const pageData = websiteData.metadata.pages.find((p: any) => p.name === page);
      if (pageData) {
        pageTitle = pageData.title || pageTitle;
        
        // Generate page-specific content if available
        if (pageData.content) {
          const { hero, sections } = pageData.content;
          
          // Generate hero section
          if (hero) {
            pageContent += `
              <div class="hero">
                <h1>${hero.headline || ''}</h1>
                <p>${hero.subheadline || ''}</p>
                ${hero.cta ? `<button class="cta-button">${hero.cta}</button>` : ''}
              </div>
            `;
          }
          
          // Generate content sections
          if (sections && Array.isArray(sections)) {
            sections.forEach((section: any) => {
              pageContent += `
                <div class="section ${section.type || ''}">
                  <h2>${section.title || ''}</h2>
                  ${renderSectionContent(section)}
                </div>
              `;
            });
          }
        }
      }
    }

    // If no specific page content was found, use the main HTML content
    if (!pageContent && page === 'home') {
      pageContent = websiteData.html_content;
    } else if (!pageContent) {
      // Generate a basic page if the specific page wasn't found
      pageContent = `
        <div class="hero">
          <h1>${pageTitle}</h1>
          <p>Welcome to our ${projectData?.business_type || ''} website</p>
        </div>
        <div class="section">
          <h2>This page is under construction</h2>
          <p>Please check back soon for more content.</p>
        </div>
      `;
    }

    // Create navigation based on metadata
    let navigation = '<ul class="nav-links">';
    if (websiteData.metadata && websiteData.metadata.navigation) {
      websiteData.metadata.navigation.forEach((navItem: string, index: number) => {
        const pageName = websiteData.metadata.pages[index]?.name || navItem.toLowerCase();
        const isActive = pageName === page ? 'active' : '';
        navigation += `<li><a href="?projectId=${projectId}&page=${pageName}" class="${isActive}">${navItem}</a></li>`;
      });
    } else {
      // Default navigation
      const defaultPages = ['home', 'about', 'services', 'contact'];
      defaultPages.forEach(pageName => {
        const isActive = pageName === page ? 'active' : '';
        navigation += `<li><a href="?projectId=${projectId}&page=${pageName}" class="${isActive}">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</a></li>`;
      });
    }
    navigation += '</ul>';

    // Assemble the full HTML document
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle}</title>
        <style>
          ${websiteData.css_content}
          
          /* Additional styles for navigation */
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .logo {
            font-weight: bold;
            font-size: 1.5rem;
          }
          
          .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
            margin: 0;
            padding: 0;
          }
          
          .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s;
          }
          
          .nav-links a:hover, .nav-links a.active {
            color: var(--primary-color, #8B5CF6);
          }
          
          @media (max-width: 768px) {
            header {
              flex-direction: column;
              padding: 1rem;
            }
            
            .logo {
              margin-bottom: 1rem;
            }
            
            .nav-links {
              gap: 1rem;
              flex-wrap: wrap;
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="logo">${projectData?.business_name || 'Generated Website'}</div>
          <nav>
            ${navigation}
          </nav>
        </header>
        
        <main>
          ${pageContent}
        </main>
        
        <script>
          ${websiteData.js_content}
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  } catch (error) {
    console.error('Error in preview-website:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to render different section content types
function renderSectionContent(section: any): string {
  if (!section || !section.content) return '';
  
  switch (section.type) {
    case 'text':
      return `<div class="text-content">${section.content}</div>`;
    
    case 'features':
      if (Array.isArray(section.content)) {
        return `
          <div class="features-grid">
            ${section.content.map((feature: any) => `
              <div class="feature">
                <h3>${feature.title || ''}</h3>
                <p>${feature.description || ''}</p>
              </div>
            `).join('')}
          </div>
        `;
      }
      return `<div class="text-content">${section.content}</div>`;
    
    case 'testimonials':
      if (Array.isArray(section.content)) {
        return `
          <div class="testimonials">
            ${section.content.map((testimonial: any) => `
              <div class="testimonial">
                <blockquote>${testimonial.quote || ''}</blockquote>
                <cite>${testimonial.author || ''}</cite>
              </div>
            `).join('')}
          </div>
        `;
      }
      return `<div class="text-content">${section.content}</div>`;
    
    case 'contact':
      return `
        <div class="contact-form">
          <form>
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Your name">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Your email">
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" placeholder="Your message"></textarea>
            </div>
            <button type="submit" class="btn">Send Message</button>
          </form>
        </div>
      `;
    
    case 'gallery':
      if (Array.isArray(section.content)) {
        return `
          <div class="gallery">
            ${section.content.map((item: any) => `
              <div class="gallery-item">
                <img src="${item.image || 'https://via.placeholder.com/300x200'}" alt="${item.caption || ''}">
                ${item.caption ? `<p class="caption">${item.caption}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      return `<div class="text-content">${section.content}</div>`;
    
    case 'pricing':
      if (Array.isArray(section.content)) {
        return `
          <div class="pricing-plans">
            ${section.content.map((plan: any) => `
              <div class="pricing-plan">
                <h3>${plan.name || 'Plan'}</h3>
                <div class="price">${plan.price || ''}</div>
                <ul class="features">
                  ${Array.isArray(plan.features) ? plan.features.map((feature: string) => `
                    <li>${feature}</li>
                  `).join('') : ''}
                </ul>
                <button class="btn">Select Plan</button>
              </div>
            `).join('')}
          </div>
        `;
      }
      return `<div class="text-content">${section.content}</div>`;
    
    case 'faq':
      if (Array.isArray(section.content)) {
        return `
          <div class="faq-section">
            ${section.content.map((item: any, index: number) => `
              <details ${index === 0 ? 'open' : ''}>
                <summary>${item.question || ''}</summary>
                <div class="faq-answer">${item.answer || ''}</div>
              </details>
            `).join('')}
          </div>
        `;
      }
      return `<div class="text-content">${section.content}</div>`;
    
    default:
      return `<div class="text-content">${section.content}</div>`;
  }
}
