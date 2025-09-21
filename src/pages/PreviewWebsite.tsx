import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PreviewWebsite = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const page = searchParams.get('page') || 'home';
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteContent, setWebsiteContent] = useState<{
    html: string;
    css: string;
    js: string;
    metadata: any;
    projectDetails: {
      business_name: string;
      business_type: string;
      description: string;
    } | null;
  }>({
    html: '',
    css: '',
    js: '',
    metadata: null,
    projectDetails: null
  });

  useEffect(() => {
    if (!projectId) {
      setError('Project ID is required');
      setLoading(false);
      return;
    }

    const fetchWebsiteContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch project minimal fields for access control
        const { data: projectData, error: projectError } = await supabase
          .from('website_projects')
          .select('business_name, business_type, description, user_id, is_public')
          .eq('id', projectId)
          .single();

        if (projectError || !projectData) {
          throw new Error('Project not found');
        }

        // Access control: allow if owner or project is public
        const isOwner = !!user && projectData.user_id === user.id;
        const isPublic = !!projectData.is_public;
        if (!isOwner && !isPublic) {
          throw new Error('This project is private. Sign in as the owner to view it.');
        }

        // Get the generated website content
        const { data: websiteData, error: websiteError } = await supabase
          .from('website_generated_data')
          .select('html_content, css_content, js_content, metadata')
          .eq('project_id', projectId)
          .single();

        if (websiteError) {
          throw new Error('Website content not found');
        }

        setWebsiteContent({
          html: websiteData.html_content || '',
          css: websiteData.css_content || '',
          js: websiteData.js_content || '',
          metadata: websiteData.metadata || null,
          projectDetails: {
            business_name: projectData.business_name,
            business_type: projectData.business_type,
            description: projectData.description,
          }
        });
      } catch (err: any) {
        console.error('Error fetching website content:', err);
        setError(err.message || 'Failed to load website preview');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteContent();
  }, [projectId, user]);

  // Extract page content from metadata if available
  const getPageContent = () => {
    if (!websiteContent.metadata || !websiteContent.projectDetails) return null;

    let pageContent = '';
    let pageTitle = websiteContent.projectDetails.business_name || 'Generated Website';
    
    if (websiteContent.metadata.pages) {
      const pageData = websiteContent.metadata.pages.find((p: any) => p.name === page);
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
      pageContent = websiteContent.html;
    } else if (!pageContent) {
      // Generate a basic page if the specific page wasn't found
      pageContent = `
        <div class="hero">
          <h1>${pageTitle}</h1>
          <p>Welcome to our ${websiteContent.projectDetails.business_type || ''} website</p>
        </div>
        <div class="section">
          <h2>This page is under construction</h2>
          <p>Please check back soon for more content.</p>
        </div>
      `;
    }

    return { pageContent, pageTitle };
  };

  // Create navigation based on metadata
  const getNavigation = () => {
    if (!websiteContent.metadata || !projectId) return '';

    // Check if we have pre-generated pages from the new format
    if (websiteContent.metadata.generatedPages && Array.isArray(websiteContent.metadata.generatedPages)) {
      const pageNames = websiteContent.metadata.generatedPages.map((p: {name: string}) => p.name);
      
      return `<ul class="navbar-nav ms-auto">
        ${pageNames.map(pageName => {
          const isActive = pageName === page ? 'active' : '';
          const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
          return `<li class="nav-item">
            <a class="nav-link ${isActive}" href="/preview?projectId=${projectId}&page=${pageName}">${displayName}</a>
          </li>`;
        }).join('')}
      </ul>`;
    }
    
    // Fall back to the old navigation format
    let navigation = '<ul class="navbar-nav ms-auto">';
    if (websiteContent.metadata && websiteContent.metadata.navigation) {
      websiteContent.metadata.navigation.forEach((navItem: string, index: number) => {
        const pageName = websiteContent.metadata.pages[index]?.name || navItem.toLowerCase();
        const isActive = pageName === page ? 'active' : '';
        navigation += `<li class="nav-item"><a class="nav-link ${isActive}" href="/preview?projectId=${projectId}&page=${pageName}">${navItem}</a></li>`;
      });
    } else {
      // Default navigation
      const defaultPages = ['home', 'about', 'services', 'contact'];
      defaultPages.forEach(pageName => {
        const isActive = pageName === page ? 'active' : '';
        const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        navigation += `<li class="nav-item"><a class="nav-link ${isActive}" href="/preview?projectId=${projectId}&page=${pageName}">${displayName}</a></li>`;
      });
    }
    navigation += '</ul>';
    
    return navigation;
  };

  // Get the full HTML for the current page
  const getFullHtml = () => {
    if (!websiteContent.metadata || !websiteContent.projectDetails) return '';
    
    // Check if we have pre-generated pages from the new format
    if (websiteContent.metadata.generatedPages && Array.isArray(websiteContent.metadata.generatedPages)) {
      const currentPage = websiteContent.metadata.generatedPages.find(
        (p: {name: string, html: string}) => p.name === page
      );
      
      // If we found the page, return its HTML
      if (currentPage && currentPage.html) {
        return currentPage.html;
      }
    }
    
    // Fall back to the old method of generating HTML
    const pageData = getPageContent();
    if (!pageData) return '';
    
    const { pageContent, pageTitle } = pageData;
    const navigation = getNavigation();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageTitle}</title>
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          ${websiteContent.css}
        </style>
      </head>
      <body>
        <header class="bg-light shadow-sm">
          <nav class="navbar navbar-expand-lg navbar-light container">
            <div class="container-fluid">
              <a class="navbar-brand fw-bold" href="/preview?projectId=${projectId}">${websiteContent.projectDetails.business_name || 'Generated Website'}</a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navbarNav">
                ${navigation}
              </div>
            </div>
          </nav>
        </header>
        
        <main>
          ${pageContent}
        </main>
        
        <!-- Bootstrap 5 JS Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script>
          ${websiteContent.js}
        </script>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Preview</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // For full-page preview, render the HTML content directly using dangerouslySetInnerHTML
  const fullHtml = getFullHtml();
  
  // Check if we have complete HTML content
  if (fullHtml && fullHtml.includes('<!DOCTYPE html>')) {
    // Render the complete HTML document by replacing the current page
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: fullHtml }}
        style={{ minHeight: '100vh' }}
      />
    );
  }

  // Fallback for incomplete content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Website Preview Not Available</h1>
      <p className="text-gray-600 mb-6">The website content is not ready for preview yet.</p>
      <button 
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to Home
      </button>
    </div>
  );
};

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

export default PreviewWebsite;
