import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { enrichLocationData } from './location-enricher.ts';
import { 
  getTemplate, 
  generateHeroSection, 
  generateFeaturesSection, 
  generateServicesSection, 
  generateTestimonialsSection, 
  generateContactSection,
  generateEnhancedCss,
  type DesignTemplate
} from './design-templates.ts';

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
  muted: string;
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
  targetAudience?: string;
  location?: string;
  websiteTemplate?: string;
  colorScheme?: ColorScheme;
  typography?: Typography;
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: string;
    featured?: boolean;
  }>;
  locations?: LocationItem[];
  showPricing?: boolean;
}

interface LocationItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  services: string[];
  businessHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  metadata: {
    description: string;
    keywords: string[];
    localAreaKeywords: string[];
  };
  isPrimary: boolean;
}

interface BusinessInfo {
  projectId: string;
  businessName: string;
  businessType: string;
  description: string;
  targetAudience?: string;
  location?: string;
  locations?: LocationItem[];
  websiteTemplate?: string;
  colorScheme?: ColorScheme;
  typography?: Typography;
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: string;
    featured?: boolean;
  }>;
  showPricing?: boolean;
}

interface UnsplashImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface PageSection {
  type: string;
  title: string;
  content: string;
  callToAction?: string;
}

interface WebsitePage {
  name: string;
  title: string;
  sections: PageSection[];
}

interface GeneratedPage {
  name: string;
  title: string;
  html: string;
  url: string;
}

interface WebsiteContent {
  pages: WebsitePage[];
  brandMessage: string;
  valuePropositions: string[];
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY') || 'YOUR_UNSPLASH_ACCESS_KEY';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Set timeout to 5 minutes to prevent timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

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

    const { projectId, businessName, businessType, description, targetAudience, location, websiteTemplate, colorScheme, typography, services, locations, showPricing } = await req.json() as GenerationRequest;

    const logPrefix = `[generate-website:${projectId}]`;
    console.log(`${logPrefix} Starting enhanced website generation with GPT-5 and Unsplash integration`);

    const businessInfo: BusinessInfo = {
      projectId,
      businessName,
      businessType,
      description,
      targetAudience: targetAudience || '',
      location,
      websiteTemplate,
      colorScheme,
      typography,
      services,
      locations,
      showPricing
    };

    // Enrich SEO metadata on locations before any generation
    if (businessInfo.locations && businessInfo.locations.length > 0) {
      businessInfo.locations = businessInfo.locations.map(loc => enrichLocationMetadata(businessInfo, loc));
    }

    // Update progress stages
    await updateProgress(supabase, projectId, 'planning', 'in_progress', 10);
    
    // Step 1: Generate enhanced content with GPT-5
    console.log(`${logPrefix} Generating content with GPT-5...`);
    await updateProgress(supabase, projectId, 'content_generation', 'in_progress', 25);
    
    const websiteContent = await generateContentWithGPT5(businessInfo);
    
    // Step 1.5: Enrich location data with AI-generated metadata if locations exist
    if (businessInfo.locations && businessInfo.locations.length > 0) {
      console.log(`${logPrefix} Enriching location metadata with AI...`);
      await updateProgress(supabase, projectId, 'location_metadata', 'in_progress', 35);
      
      businessInfo.locations = await enrichLocationData(
        businessInfo.businessName,
        businessInfo.businessType,
        businessInfo.locations,
        openAIApiKey
      );
      
      console.log(`${logPrefix} Location metadata enrichment completed`);
    }
    
    // Step 2: Fetch high-quality images from Unsplash
    console.log(`${logPrefix} Fetching images from Unsplash...`);
    await updateProgress(supabase, projectId, 'image_generation', 'in_progress', 45);
    
    const images = await fetchUnsplashImages(businessInfo);
    
    // Step 3: Generate separate HTML pages
    console.log(`${logPrefix} Generating separate HTML pages...`);
    await updateProgress(supabase, projectId, 'page_generation', 'in_progress', 60);
    
    const separatePages = await generateSeparatePages(businessInfo, websiteContent, images);
    
    // Step 4: Generate enhanced HTML/CSS/JS
    console.log(`${logPrefix} Generating enhanced code...`);
    await updateProgress(supabase, projectId, 'code_generation', 'in_progress', 80);
    
    const { html, css, js } = await generateEnhancedWebsite(businessInfo, websiteContent, images);
    
    // Step 5: Finalize and save
    await updateProgress(supabase, projectId, 'finalization', 'in_progress', 95);
    
    const previewUrl = `/preview?projectId=${projectId}`;
    
    // Insert generated data
    const { error: insertError } = await supabase
      .from('website_generated_data')
      .insert({
        project_id: projectId,
        html_content: html,
        css_content: css,
        js_content: js,
        assets_urls: images.map(img => img.url),
        metadata: {
          structure: {
            pages: websiteContent.pages.map(p => p.name),
            colorScheme: colorScheme || {
              primary: '#0d6efd',
              secondary: '#6c757d', 
              accent: '#ffc107',
              background: '#ffffff',
              text: '#212529'
            },
            layout: websiteTemplate || 'modern',
            navigation: websiteContent.pages.map(p => p.title)
          },
          pages: websiteContent.pages,
          generatedPages: separatePages,
          brandMessage: websiteContent.brandMessage,
          valuePropositions: websiteContent.valuePropositions,
          images: images
        }
      });

    if (insertError) {
      throw insertError;
    }
    
    // Create deployment record with local preview URL
    try {
      const { error: deploymentError } = await supabase
        .from('website_deployments')
        .insert({
          project_id: projectId,
          deployment_url: previewUrl,
          status: 'deployed',
          provider: 'local'
        });
        
      if (deploymentError) {
        // If the error is about the provider column, try without it
        if (deploymentError.message?.includes("provider")) {
          console.log(`${logPrefix} Provider column not found, trying without it`);
          const { error: retryError } = await supabase
            .from('website_deployments')
            .insert({
              project_id: projectId,
              deployment_url: previewUrl,
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
        deployment_url: previewUrl 
      })
      .eq('id', projectId);

    await updateProgress(supabase, projectId, 'completed', 'completed', 100);

    clearTimeout(timeoutId);
    return new Response(JSON.stringify({ 
      success: true,
      previewUrl: previewUrl,
      pages: separatePages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    clearTimeout(timeoutId);
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

async function generateContentWithGPT5(businessInfo: BusinessInfo): Promise<WebsiteContent> {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  const openAIModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o';
  console.log(`${logPrefix} Generating content with OpenAI model: ${openAIModel}...`);
  
  const prompt = `You are an expert web designer and copywriter. Create compelling, professional website content for a ${businessInfo.businessType} business.

Business Details:
- Name: ${businessInfo.businessName}
- Type: ${businessInfo.businessType}
- Description: ${businessInfo.description}
- Target Audience: ${businessInfo.targetAudience || 'general consumers'}
- Location: ${businessInfo.location || 'local area'}

Create a comprehensive website structure with:
1. 4 pages: Home, About, Services, Contact
2. For each page, provide compelling sections with specific content
3. Include a strong brand message and 3-5 value propositions
4. Make content engaging, professional, and conversion-focused
5. Tailor language to the target audience

IMPORTANT: Return ONLY valid JSON with no markdown formatting, code fences, or additional text. Use this exact format:
{
  "pages": [
    {
      "name": "home",
      "title": "Home - [Business Name]",
      "sections": [
        {
          "type": "hero",
          "title": "Hero Section Title",
          "content": "Compelling hero content",
          "callToAction": "Primary CTA button text"
        },
        {
          "type": "features",
          "title": "Why Choose Us",
          "content": "3-4 key benefits separated by | (pipe)",
          "callToAction": "Learn More"
        }
      ]
    }
  ],
  "brandMessage": "Core brand promise in one compelling sentence",
  "valuePropositions": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"]
}`;

  try {
    if (!openAIApiKey || openAIApiKey === '') {
      // Fallback content when OpenAI is not available
      return {
        pages: [
          {
            name: 'home',
            title: `${businessInfo.businessName} - Home`,
            sections: [
              {
                type: 'hero',
                title: `Welcome to ${businessInfo.businessName}`,
                content: `Professional ${businessInfo.businessType} services that exceed expectations. ${businessInfo.description}`,
                callToAction: 'Get Started Today'
              },
              {
                type: 'features',
                title: 'Why Choose Us',
                content: 'Expert professionals | Quality guaranteed | Customer focused | Competitive pricing',
                callToAction: 'Learn More'
              }
            ]
          },
          {
            name: 'about',
            title: `About ${businessInfo.businessName}`,
            sections: [
              {
                type: 'story',
                title: 'Our Story',
                content: `${businessInfo.businessName} has been providing exceptional ${businessInfo.businessType} services. We are committed to delivering the highest quality results for our clients.`,
                callToAction: 'Contact Us'
              }
            ]
          },
          {
            name: 'services',
            title: `Our Services - ${businessInfo.businessName}`,
            sections: [
              {
                type: 'services',
                title: 'What We Offer',
                content: `Comprehensive ${businessInfo.businessType} solutions tailored to your needs. We provide professional services with attention to detail and customer satisfaction.`,
                callToAction: 'Request Quote'
              }
            ]
          },
          {
            name: 'contact',
            title: `Contact ${businessInfo.businessName}`,
            sections: [
              {
                type: 'contact',
                title: 'Get In Touch',
                content: `Ready to get started? Contact ${businessInfo.businessName} today for professional ${businessInfo.businessType} services.`,
                callToAction: 'Call Now'
              }
            ]
          }
        ],
        brandMessage: `${businessInfo.businessName} - Your trusted partner for ${businessInfo.businessType} excellence`,
        valuePropositions: [
          'Professional expertise',
          'Quality guaranteed',
          'Customer satisfaction',
          'Competitive pricing',
          'Reliable service'
        ]
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAIModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional web content strategist. Always return valid JSON without markdown formatting or code fences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log(`${logPrefix} Raw GPT response:`, content?.substring(0, 200) + '...');
    
    // Clean the content by removing markdown code fences and extra whitespace
    let cleanContent = content;
    if (cleanContent) {
      // Remove markdown code fences
      cleanContent = cleanContent.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '').trim();
      // Remove any leading/trailing non-JSON text
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    try {
      const parsed = JSON.parse(cleanContent);
      console.log(`${logPrefix} Successfully parsed GPT response`);
      return parsed;
    } catch (parseError) {
      console.error(`${logPrefix} Error parsing GPT response:`, parseError);
      console.error(`${logPrefix} Cleaned content:`, cleanContent?.substring(0, 500) + '...');
      return {
        pages: [
          {
            name: 'home',
            title: `${businessInfo.businessName} - Home`,
            sections: [
              {
                type: 'hero',
                title: `Welcome to ${businessInfo.businessName}`,
                content: `Professional ${businessInfo.businessType} services. ${businessInfo.description}`,
                callToAction: 'Get Started'
              }
            ]
          }
        ],
        brandMessage: `${businessInfo.businessName} - Professional ${businessInfo.businessType} services`,
        valuePropositions: ['Quality service', 'Expert team', 'Customer focused']
      };
    }
  } catch (error) {
    console.error('GPT-5 content generation failed:', error);
    // Return fallback content
    return {
      pages: [
        {
          name: 'home',
          title: `${businessInfo.businessName} - Home`,
          sections: [
            {
              type: 'hero',
              title: `Welcome to ${businessInfo.businessName}`,
              content: `Professional ${businessInfo.businessType} services. ${businessInfo.description}`,
              callToAction: 'Get Started'
            }
          ]
        }
      ],
      brandMessage: `${businessInfo.businessName} - Professional ${businessInfo.businessType} services`,
      valuePropositions: ['Quality service', 'Expert team', 'Customer focused']
    };
  }
}

async function fetchUnsplashImages(businessInfo: BusinessInfo): Promise<UnsplashImage[]> {
  try {
    const searchTerms = [
      businessInfo.businessType,
      'business',
      'professional',
      'modern office'
    ];
    
    const images: UnsplashImage[] = [];
    
    for (const term of searchTerms.slice(0, 2)) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=3&orientation=landscape&order_by=relevant&content_filter=high`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashAccessKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const unsplashImages = data.results?.slice(0, 2) || [];
          
          for (const img of unsplashImages) {
            images.push({
              url: img.urls?.full || img.urls?.regular || img.urls?.small || '',
              alt: img.alt_description || `${term} image`,
              photographer: img.user?.name || 'Unknown',
              photographerUrl: img.user?.links?.html || ''
            });
          }
        }
      } catch (termError) {
        console.error(`Error fetching images for term ${term}:`, termError);
      }
    }

    // Fallback to placeholder images if Unsplash fails
    if (images.length === 0) {
      return [
        {
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
          alt: 'Professional business environment',
          photographer: 'Unsplash',
          photographerUrl: 'https://unsplash.com'
        },
        {
          url: 'https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&h=600&fit=crop',
          alt: 'Modern office space',
          photographer: 'Unsplash', 
          photographerUrl: 'https://unsplash.com'
        }
      ];
    }

    return images;
  } catch (error) {
    console.error('Unsplash API error:', error);
    // Return fallback images
    return [
      {
        url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
        alt: 'Professional business environment',
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      }
    ];
  }
}

async function generateEnhancedWebsite(
  businessInfo: BusinessInfo,
  websiteContent: WebsiteContent,
  images: UnsplashImage[]
): Promise<{ html: string; css: string; js: string }> {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating enhanced HTML/CSS/JS with modern design templates...`);
  
  // Get the design template
  const template = getTemplate(businessInfo.websiteTemplate);
  
  const colorScheme = businessInfo.colorScheme || {
    ...template.colorScheme,
    muted: template.colorScheme.muted
  };
  const typography = businessInfo.typography || template.typography;

  const primaryImage = images[0] || null;
  const heroImage = primaryImage ? primaryImage.url : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessInfo.businessName} - ${businessInfo.businessType}</title>
    <meta name="description" content="${businessInfo.description}">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=${typography.headings.replace(' ', '+')}:wght@300;400;600;700&family=${typography.body.replace(' ', '+')}:wght@300;400;500&display=swap" rel="stylesheet">
    
    <style>
        ${generateEnhancedCss(colorScheme, typography, template)}
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#">${businessInfo.businessName}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    ${websiteContent.pages.map(page => `
                        <li class="nav-item">
                            <a class="nav-link" href="#${page.name}">${page.title}</a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main>
            font-family: '${typography.headings}', sans-serif;
            font-weight: 700;
            font-size: 1.5rem;
            color: var(--primary-color) !important;
        }
        
        .nav-link {
            font-weight: 500;
            color: var(--text-color) !important;
            transition: color 0.3s ease;
        }
        
        .nav-link:hover {
            color: var(--primary-color) !important;
        }
        
        html {
            scroll-behavior: smooth;
        }
        
        .section-padding {
            padding: 100px 0;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 60px;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            border-radius: 2px;
        }
        
        footer {
            background: linear-gradient(135deg, var(--text-color), #343a40);
            color: white;
            padding: 60px 0 30px;
        }
        
        .footer-link {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .footer-link:hover {
            color: white;
        }
        
        @media (max-width: 768px) {
            .hero-section {
                min-height: 70vh;
                text-align: center;
            }
            
            .section-title {
                font-size: 2rem;
            }
            
            .section-padding {
                padding: 60px 0;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#">${businessInfo.businessName}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    ${websiteContent.pages.map(page => {
                        const pageName = page.name === 'home' ? 'Home' : 
                                       page.name === 'about' ? 'About' :
                                       page.name === 'services' ? 'Services' :
                                       page.name === 'contact' ? 'Contact' :
                                       page.name.charAt(0).toUpperCase() + page.name.slice(1);
                        return `<li class="nav-item">
                            <a class="nav-link" href="#${page.name}-section">${pageName}</a>
                        </li>`;
                    }).join('')}
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section" id="home-section">
        <div class="container">
            <div class="row">
                <div class="col-lg-8">
                    <div class="hero-content">
                        <h1 class="display-4 fw-bold mb-4">${websiteContent.pages[0]?.sections[0]?.title || `Welcome to ${businessInfo.businessName}`}</h1>
                        <p class="lead mb-4">${websiteContent.pages[0]?.sections[0]?.content || businessInfo.description}</p>
                        <a href="#contact-section" class="btn btn-primary btn-lg me-3">${websiteContent.pages[0]?.sections[0]?.callToAction || 'Get Started'}</a>
                        <a href="#about-section" class="btn btn-outline-light btn-lg">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="section-padding bg-light" id="features">
        <div class="container">
            <div class="row">
                <div class="col-12 text-center">
                    <h2 class="section-title">Why Choose ${businessInfo.businessName}</h2>
                </div>
            </div>
            <div class="row g-4">
                ${websiteContent.valuePropositions.slice(0, 4).map((value, index) => {
                    const icons = ['fas fa-star', 'fas fa-users', 'fas fa-award', 'fas fa-heart'];
                    return `
                    <div class="col-lg-3 col-md-6">
                        <div class="feature-card text-center">
                            <div class="feature-icon">
                                <i class="${icons[index] || 'fas fa-check'}"></i>
                            </div>
                            <h4>${value}</h4>
                            <p>Excellence in every aspect of our ${businessInfo.businessType} services.</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="section-padding" id="about-section">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6">
                    <h2 class="section-title text-start">About ${businessInfo.businessName}</h2>
                    <p class="lead">${websiteContent.brandMessage}</p>
                    <p>${businessInfo.description} We are committed to providing exceptional ${businessInfo.businessType} services that exceed our clients' expectations.</p>
                    <div class="row mt-4">
                        <div class="col-sm-6">
                            <h5><i class="fas fa-check-circle text-primary me-2"></i>Professional Team</h5>
                        </div>
                        <div class="col-sm-6">
                            <h5><i class="fas fa-check-circle text-primary me-2"></i>Quality Guaranteed</h5>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <img src="${images[1]?.url || heroImage}" alt="About ${businessInfo.businessName}" class="img-fluid rounded shadow">
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="section-padding bg-light" id="services-section">
        <div class="container">
            <div class="row">
                <div class="col-12 text-center">
                    <h2 class="section-title">Our Services</h2>
                    <p class="lead">Comprehensive ${businessInfo.businessType} solutions tailored to your needs</p>
                </div>
            </div>
            <div class="row g-4 mt-4">
                <div class="col-lg-4 col-md-6">
                    <div class="feature-card">
                        <h4>Premium Service</h4>
                        <p>Top-tier ${businessInfo.businessType} solutions with personalized attention to detail.</p>
                        <a href="#contact" class="btn btn-outline-primary">Learn More</a>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6">
                    <div class="feature-card">
                        <h4>Expert Consultation</h4>
                        <p>Professional guidance and advice from our experienced team of specialists.</p>
                        <a href="#contact" class="btn btn-outline-primary">Learn More</a>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6">
                    <div class="feature-card">
                        <h4>Custom Solutions</h4>
                        <p>Tailored approaches designed specifically for your unique requirements.</p>
                        <a href="#contact" class="btn btn-outline-primary">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="section-padding" id="contact-section">
        <div class="container">
            <div class="row">
                <div class="col-12 text-center">
                    <h2 class="section-title">Get In Touch</h2>
                    <p class="lead">Ready to get started? Contact us today for professional ${businessInfo.businessType} services.</p>
                </div>
            </div>
            <div class="row mt-5">
                <div class="col-lg-8 mx-auto">
                    <form class="contact-form">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <input type="text" class="form-control form-control-lg" placeholder="Your Name" required>
                            </div>
                            <div class="col-md-6">
                                <input type="email" class="form-control form-control-lg" placeholder="Your Email" required>
                            </div>
                            <div class="col-12">
                                <input type="text" class="form-control form-control-lg" placeholder="Subject" required>
                            </div>
                            <div class="col-12">
                                <textarea class="form-control form-control-lg" rows="5" placeholder="Your Message" required></textarea>
                            </div>
                            <div class="col-12 text-center">
                                <button type="submit" class="btn btn-primary btn-lg px-5">Send Message</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="row">
                <div class="col-lg-4 col-md-6 mb-4">
                    <h5 class="mb-3">${businessInfo.businessName}</h5>
                    <p>Professional ${businessInfo.businessType} services you can trust.</p>
                </div>
                <div class="col-lg-4 col-md-6 mb-4">
                    <h5 class="mb-3">Quick Links</h5>
                    ${websiteContent.pages.map(page => 
                        `<p><a href="#${page.name}" class="footer-link">${page.title.split(' - ')[0]}</a></p>`
                    ).join('')}
                </div>
                <div class="col-lg-4 col-md-6 mb-4">
                    <h5 class="mb-3">Contact Info</h5>
                    <p><i class="fas fa-map-marker-alt me-2"></i>${businessInfo.location || 'Your Location'}</p>
                    <p><i class="fas fa-phone me-2"></i>Call for consultation</p>
                    <p><i class="fas fa-envelope me-2"></i>info@${businessInfo.businessName.toLowerCase().replace(/\s+/g, '')}.com</p>
                </div>
            </div>
            <hr class="my-4">
            <div class="row">
                <div class="col-12 text-center">
                    <p>&copy; ${new Date().getFullYear()} ${businessInfo.businessName}. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Contact form
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show success message
                const alert = document.createElement('div');
                alert.className = 'alert alert-success mt-3';
                alert.innerHTML = 'Thank you! Your message has been sent successfully. We will get back to you soon.';
                this.appendChild(alert);
                
                // Reset form
                this.reset();
                
                // Remove alert after 5 seconds
                setTimeout(() => {
                    alert.remove();
                }, 5000);
            });
        }
    </script>
</body>
</html>`;

  const css = `/* Enhanced CSS already included in HTML */`;
  const js = `/* Enhanced JavaScript already included in HTML */`;

  return { html, css, js };
}

async function updateProgress(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  stage: string,
  status: string,
  percentage: number,
  jobId?: string
) {
  try {
    // Use upsert with onConflict to ensure one progress row per project
    const { error } = await supabase
      .from('generation_progress')
      .upsert(
        {
          job_id: jobId || projectId, // Use projectId as fallback for job_id
          project_id: projectId,
          stage,
          status,
          progress_percentage: percentage,
          timestamp: new Date().toISOString() // Update timestamp on each progress update
        },
        { 
          onConflict: 'project_id', // Only keep one progress row per project
          ignoreDuplicates: false // Update existing row on conflict
        }
      );
    
    if (error) {
      console.error(`Error updating progress for ${projectId}:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`[generate-website:${projectId}] Progress updated: ${stage} - ${percentage}%`);
    }
  } catch (error) {
    console.error(`Error updating progress for ${projectId}:`, JSON.stringify(error, null, 2));
  }
}

function enrichLocationMetadata(businessInfo: BusinessInfo, loc: LocationItem): LocationItem {
  const businessType = businessInfo.businessType || '';
  const businessName = businessInfo.businessName || '';
  const city = loc.city || '';
  const state = loc.state || '';
  const services: string[] = Array.isArray(loc.services) && loc.services.length > 0
    ? loc.services
    : (Array.isArray(businessInfo.services)
        ? (businessInfo.services as any[]).map((s) => typeof s === 'string' ? s : (s?.name ?? '')).filter(Boolean)
        : []);

  const existingMeta = (loc as any).metadata || {};
  const existingKeywords: string[] = Array.isArray(existingMeta.localAreaKeywords) ? existingMeta.localAreaKeywords : [];
  const keywordSet = new Set<string>(existingKeywords);

  if (city) {
    keywordSet.add(`${businessType} ${city}`);
    keywordSet.add(`${businessName} ${city}`);
  }
  if (state) {
    keywordSet.add(`${businessType} ${state}`);
  }
  services.forEach((svc) => {
    if (!svc) return;
    if (city) keywordSet.add(`${svc} ${city}`);
    if (state) keywordSet.add(`${svc} ${state}`);
  });

  const description: string = typeof existingMeta.description === 'string' && existingMeta.description.trim().length > 0
    ? existingMeta.description
    : `Professional ${businessType.toLowerCase()} services in ${city}${state ? ", " + state : ''} at ${businessName} - ${loc.name}. We offer ${services.join(', ')}.`;

  return {
    ...loc,
    metadata: {
      ...existingMeta,
      description,
      localAreaKeywords: Array.from(keywordSet)
    }
  } as LocationItem;
}

function generateBasicCss(colorScheme: ColorScheme, typography: Typography) {
  return `
/* Custom styles */

:root {
  --primary-color: ${colorScheme.primary};
  --secondary-color: ${colorScheme.secondary};
  --accent-color: ${colorScheme.accent};
  --background-color: ${colorScheme.background};
  --text-color: ${colorScheme.text};
}

body {
  font-family: '${typography.body}', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

h1, h2, h3, h4, h5, h6 {
  font-family: '${typography.headings}', sans-serif;
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

async function generateWebsitePages(structure: Record<string, unknown>, businessInfo: BusinessInfo) {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Generating website pages content...`);
  console.log(`${logPrefix} Structure received:`, JSON.stringify(structure, null, 2));
  
  const pages: Array<{ name: string } & Record<string, unknown>> = [];
  
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

    if (!response.ok) {
      console.error(`${logPrefix} OpenAI API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to generate content for ${pageName} page`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]) {
      console.error(`${logPrefix} No choices returned from OpenAI for ${pageName} page`);
      throw new Error(`Failed to generate content for ${pageName} page`);
    }
    
    const content = data.choices[0].message.content as string;
    
    // Strip markdown code fences if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const pageContent = JSON.parse(cleanContent);
      
      pages.push({
        name: pageName,
        ...(pageContent as Record<string, unknown>)
      } as { name: string } & Record<string, unknown>);
    } catch (error) {
      console.error(`${logPrefix} Error parsing JSON for ${pageName} page:`, error);
      console.error(`${logPrefix} Raw content:`, cleanContent);
      throw new Error(`Failed to parse JSON for ${pageName} page`);
    }
  }
  
  return pages;
}

async function generateWebsiteCode(pages: Record<string, unknown>[], structure: Record<string, unknown>, businessInfo: BusinessInfo) {
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
    const defaultColorScheme = {
      primary: '#0d6efd',
      secondary: '#6c757d', 
      accent: '#ffc107',
      background: '#ffffff',
      text: '#212529'
    };
    
    const defaultTypography = {
      headings: 'Roboto',
      body: 'Open Sans'
    };

    return {
      pages: fallbackPages,
      css: generateBasicCss(defaultColorScheme, defaultTypography),
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

// Function to generate separate HTML pages
async function generateSeparatePages(businessInfo: BusinessInfo, websiteContent: WebsiteContent, images: UnsplashImage[]): Promise<GeneratedPage[]> {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  const pages: GeneratedPage[] = [];
  
  // Generate main pages
  for (const page of websiteContent.pages) {
    console.log(`${logPrefix} Generating ${page.name} page...`);
    
    const pageHtml = await generatePageHTML(businessInfo, page, websiteContent, images);
    
    pages.push({
      name: page.name,
      title: page.title,
      html: pageHtml,
      url: `/${page.name === 'home' ? '' : page.name}`
    });
  }
  
  // Generate location-specific pages if locations exist
  if (businessInfo.locations && businessInfo.locations.length > 0) {
    console.log(`${logPrefix} Generating ${businessInfo.locations.length} location-specific pages...`);
    console.log(`${logPrefix} Locations data:`, JSON.stringify(businessInfo.locations, null, 2));
    
    for (const location of businessInfo.locations) {
      try {
        console.log(`${logPrefix} Generating page for location: ${location.name}`);
        const locationPage = await generateLocationPage(businessInfo, location, websiteContent, images);
        pages.push(locationPage);
        console.log(`${logPrefix} Successfully generated location page: ${locationPage.name}`);
      } catch (error) {
        console.error(`${logPrefix} Error generating location page for ${location.name}:`, error);
      }
    }
    
    // Generate locations directory page
    try {
      console.log(`${logPrefix} Generating locations index page...`);
      const locationsIndexPage = await generateLocationsIndexPage(businessInfo, websiteContent, images);
      pages.push(locationsIndexPage);
      console.log(`${logPrefix} Successfully generated locations index page: ${locationsIndexPage.name}`);
    } catch (error) {
      console.error(`${logPrefix} Error generating locations index page:`, error);
    }
  } else {
    console.log(`${logPrefix} No locations found in businessInfo:`, {
      locations: businessInfo.locations,
      hasLocations: !!businessInfo.locations,
      locationsLength: businessInfo.locations?.length
    });
  }
  
  return pages;
}

// Function to generate individual page HTML
async function generatePageHTML(businessInfo: BusinessInfo, page: WebsitePage, websiteContent: WebsiteContent, images: UnsplashImage[]): Promise<string> {
  const colorScheme = businessInfo.colorScheme || {
    primary: '#0d6efd',
    secondary: '#6c757d',
    accent: '#ffc107',
    background: '#ffffff',
    text: '#212529'
  };
  
  const typography = businessInfo.typography || {
    headings: 'Roboto',
    body: 'Open Sans'
  };
  
  const heroImage = images[0] || { url: 'https://via.placeholder.com/1200x600', alt: 'Hero image' };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=${typography.headings.replace(' ', '+')}:wght@300;400;600;700&family=${typography.body.replace(' ', '+')}:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${colorScheme.primary};
            --secondary-color: ${colorScheme.secondary};
            --accent-color: ${colorScheme.accent};
            --background-color: ${colorScheme.background};
            --text-color: ${colorScheme.text};
            --heading-font: '${typography.headings}', sans-serif;
            --body-font: '${typography.body}', sans-serif;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--body-font);
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--heading-font);
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .navbar {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-bottom: 3px solid var(--primary-color);
        }
        
        .navbar-brand {
            font-weight: 700;
            font-size: 1.8rem;
            color: var(--primary-color) !important;
        }
        
        .nav-link {
            font-weight: 600 !important;
            color: #212529 !important;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            margin: 0 8px;
            padding: 8px 16px !important;
            border-radius: 6px;
        }
        
        .nav-link:hover, .nav-link.active {
            color: white !important;
            background: var(--primary-color) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
        
        .hero-section {
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${heroImage.url}');
            background-size: cover;
            background-position: center;
            min-height: 80vh;
            display: flex;
            align-items: center;
            color: white;
            text-align: center;
        }
        
        .hero-content h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            color: white;
        }
        
        .hero-content p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
            padding: 12px 30px;
            font-weight: 600;
            border-radius: 50px;
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            background-color: var(--accent-color);
            border-color: var(--accent-color);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .section {
            padding: 80px 0;
        }
        
        .section-title {
            text-align: center;
            margin-bottom: 50px;
            font-size: 2.5rem;
        }
        
        .feature-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            margin-bottom: 30px;
        }
        
        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 50px 0 30px;
        }
        
        .contact-form {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="#home-section">${businessInfo.businessName}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link ${page.name === 'home' ? 'active' : ''}" href="/">Home</a></li>
                    <li class="nav-item"><a class="nav-link ${page.name === 'about' ? 'active' : ''}" href="/about">About</a></li>
                    <li class="nav-item"><a class="nav-link ${page.name === 'services' ? 'active' : ''}" href="/services">Services</a></li>
                    <li class="nav-item"><a class="nav-link ${page.name === 'contact' ? 'active' : ''}" href="/contact">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>
    
    <!-- Page Content -->
    <main>
        ${generatePageContent(page, businessInfo, websiteContent)}
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-white text-center py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>${businessInfo.businessName}</h5>
                    <p>${websiteContent.brandMessage}</p>
                </div>
                <div class="col-md-4">
                    <h5>Services</h5>
                    <ul class="list-unstyled">
                        ${(businessInfo.services || []).slice(0, 3).map((service: any) => `
                            <li>${service.name || service}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Contact</h5>
                    <p>${businessInfo.location || 'Contact us for more information'}</p>
                </div>
            </div>
            <hr class="my-3">
            <p class="mb-0">&copy; 2024 ${businessInfo.businessName}. All rights reserved.</p>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

// Function to generate page-specific content
function generatePageContent(page: WebsitePage, businessInfo: BusinessInfo, websiteContent: WebsiteContent): string {
  switch (page.name) {
    case 'home':
      return `
        <section class="hero-section" id="home-section">
            <div class="container">
                <div class="hero-content">
                    <h1>${page.sections[0]?.title || `Welcome to ${businessInfo.businessName}`}</h1>
                    <p>${page.sections[0]?.content || businessInfo.description}</p>
                    <a href="/contact" class="btn btn-primary btn-lg">${page.sections[0]?.callToAction || 'Get Started'}</a>
                </div>
            </div>
        </section>
        
        <section class="section" id="features">
            <div class="container">
                <h2 class="section-title">Why Choose Us</h2>
                <div class="row">
                    ${websiteContent.valuePropositions.map((value, index) => `
                        <div class="col-md-4">
                            <div class="feature-card">
                                <div class="text-center mb-3">
                                    <i class="fas fa-star fa-3x" style="color: var(--primary-color);"></i>
                                </div>
                                <h4 class="text-center">${value}</h4>
                                <p class="text-center">Professional service that exceeds expectations.</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
      `;
      
    case 'about':
      return `
        <section class="section" style="padding-top: 120px;" id="about-section">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h1>${page.title}</h1>
                        <p class="lead">Learn more about our story and mission.</p>
                        <div class="mt-4">
                            ${page.sections.map(section => `
                                <h3>${section.title}</h3>
                                <p>${section.content}</p>
                            `).join('')}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <img src="https://via.placeholder.com/600x400" class="img-fluid rounded" alt="About us">
                    </div>
                </div>
            </div>
        </section>
      `;
      
    case 'services':
      return `
        <section class="section" style="padding-top: 120px;" id="services-section">
            <div class="container">
                <h1 class="section-title">Our Services</h1>
                <div class="row">
                    ${page.sections.map(section => `
                        <div class="col-md-6 mb-4">
                            <div class="feature-card">
                                <h4>${section.title}</h4>
                                <p>${section.content}</p>
                                <a href="/contact" class="btn btn-primary">${section.callToAction || 'Learn More'}</a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
      `;
      
    case 'contact':
      return `
        <section class="section" style="padding-top: 120px;" id="contact-section">
            <div class="container">
                <h1 class="section-title">Contact Us</h1>
                <div class="row">
                    <div class="col-md-8 mx-auto">
                        <div class="contact-form">
                            <form>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="name" class="form-label">Name</label>
                                        <input type="text" class="form-control" id="name" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="email" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="subject" class="form-label">Subject</label>
                                    <input type="text" class="form-control" id="subject" required>
                                </div>
                                <div class="mb-3">
                                    <label for="message" class="form-label">Message</label>
                                    <textarea class="form-control" id="message" rows="5" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary btn-lg w-100">Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      `;
      
    default:
      return `
        <section class="section" style="padding-top: 120px;">
            <div class="container">
                <h1>${page.title}</h1>
                <p>Content for ${page.name} page.</p>
            </div>
        </section>
      `;
  }
}

// Function to generate location-specific page
async function generateLocationPage(businessInfo: BusinessInfo, location: LocationItem, websiteContent: WebsiteContent, images: UnsplashImage[]): Promise<GeneratedPage> {
  const logPrefix = `[generate-website:${businessInfo.projectId}]`;
  console.log(`${logPrefix} Starting location page generation for: ${location.name}`);
  console.log(`${logPrefix} Location data:`, JSON.stringify(location, null, 2));
  
  const colorScheme = businessInfo.colorScheme || {
    primary: '#0d6efd',
    secondary: '#6c757d',
    accent: '#ffc107',
    background: '#ffffff',
    text: '#212529'
  };
  
  const typography = businessInfo.typography || {
    headings: 'Roboto',
    body: 'Open Sans'
  };
  
  const heroImage = images[0] || { url: 'https://via.placeholder.com/1200x600', alt: 'Location image' };
  
  const locationSlug = location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  console.log(`${logPrefix} Generated location slug: ${locationSlug}`);
  
  // Safe access to location properties with fallbacks
  const locationCity = location.city || '';
  const locationState = location.state || '';
  const locationServices = location.services || [];
  const locationMetadata = location.metadata || { description: '', localAreaKeywords: [] };
  
  const pageTitle = `${businessInfo.businessName} - ${location.name} | ${locationCity}, ${locationState}`;
  const metaDescription = locationMetadata.description || `Visit ${businessInfo.businessName} at our ${location.name} location in ${locationCity}, ${locationState}. ${locationServices.join(', ')}.`;
  
  const locationKeywords = [
    ...(Array.isArray(locationMetadata.localAreaKeywords) ? locationMetadata.localAreaKeywords : []),
    `${businessInfo.businessName} ${locationCity}`,
    `${businessInfo.businessType} ${locationCity}`,
    ...locationServices.map(service => `${service} ${locationCity}`),
    `${locationCity} ${businessInfo.businessType}`,
    `${locationState} ${businessInfo.businessType}`
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${metaDescription}">
    <meta name="keywords" content="${locationKeywords.join(', ')}">
    
    <!-- Local SEO structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "${businessInfo.businessName}",
      "description": "${location.metadata.description}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${location.address}",
        "addressLocality": "${location.city}",
        "addressRegion": "${location.state}",
        "postalCode": "${location.zipCode}",
        "addressCountry": "${location.country}"
      },
      ${location.phone ? `"telephone": "${location.phone}",` : ''}
      ${location.email ? `"email": "${location.email}",` : ''}
      "url": "/locations/${locationSlug}",
      "priceRange": "$$",
      "servesCuisine": "${businessInfo.businessType}",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Services",
        "itemListElement": [
          ${location.services.map(service => `{
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "${service}"
            }
          }`).join(',')}
        ]
      }
    }
    </script>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=${typography.headings.replace(' ', '+')}:wght@300;400;600;700&family=${typography.body.replace(' ', '+')}:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${colorScheme.primary};
            --secondary-color: ${colorScheme.secondary};
            --accent-color: ${colorScheme.accent};
            --background-color: ${colorScheme.background};
            --text-color: ${colorScheme.text};
            --heading-font: '${typography.headings}', sans-serif;
            --body-font: '${typography.body}', sans-serif;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: var(--body-font);
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
        }
        
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--heading-font);
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .navbar {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-bottom: 3px solid var(--primary-color);
        }
        
        .location-hero {
            background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${heroImage.url}');
            background-size: cover;
            background-position: center;
            min-height: 60vh;
            display: flex;
            align-items: center;
            color: white;
            text-align: center;
        }
        
        .location-info {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-top: -50px;
            position: relative;
            z-index: 10;
        }
        
        .service-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            margin-bottom: 20px;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
        }
        
        .contact-info {
            background: var(--primary-color);
            color: white;
            padding: 30px;
            border-radius: 15px;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="/">${businessInfo.businessName}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="/services">Services</a></li>
                    <li class="nav-item"><a class="nav-link" href="/locations">Locations</a></li>
                    <li class="nav-item"><a class="nav-link" href="/contact">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>
    
    <!-- Location Hero -->
    <section class="location-hero">
        <div class="container">
            <h1 class="display-4 mb-3">${businessInfo.businessName}</h1>
            <h2 class="h3 mb-4">${location.name}</h2>
            <p class="lead">${location.metadata.description || `Visit us at our ${location.name} location`}</p>
        </div>
    </section>
    
    <!-- Location Details -->
    <section class="py-5">
        <div class="container">
            <div class="location-info">
                <div class="row">
                    <div class="col-md-8">
                        <h3>About This Location</h3>
                        <p>${location.metadata.description || `Our ${location.name} location offers exceptional ${businessInfo.businessType.toLowerCase()} services in ${location.city}, ${location.state}.`}</p>
                        
                        <h4 class="mt-4">Services Available Here</h4>
                        <div class="row">
                            ${(businessInfo.services || []).map(service => `
                                <div class="col-md-6 mb-3">
                                    <div class="service-card ${location.services.includes(service.name) ? 'border-success' : ''}">
                                        <h5>
                                            <i class="${location.services.includes(service.name) ? 'fas fa-check-circle text-success' : 'fas fa-circle text-muted'} me-2"></i>
                                            ${service.name}
                                        </h5>
                                        <p class="text-muted mb-0">${service.description || `Professional ${service.name.toLowerCase()} services`}</p>
                                        ${service.price && businessInfo.showPricing ? `<p class="badge bg-primary mt-2">${service.price}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="contact-info">
                            <h4><i class="fas fa-map-marker-alt me-2"></i>Visit Us</h4>
                            <p class="mb-3">
                                ${location.address}<br>
                                ${location.city}, ${location.state} ${location.zipCode}<br>
                                ${location.country}
                            </p>
                            
                            ${location.phone ? `
                                <h5><i class="fas fa-phone me-2"></i>Call Us</h5>
                                <p class="mb-3"><a href="tel:${location.phone}" class="text-white">${location.phone}</a></p>
                            ` : ''}
                            
                            ${location.email ? `
                                <h5><i class="fas fa-envelope me-2"></i>Email Us</h5>
                                <p class="mb-3"><a href="mailto:${location.email}" class="text-white">${location.email}</a></p>
                            ` : ''}
                            
                            <a href="/contact" class="btn btn-light btn-lg w-100 mt-3">Get Directions</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer -->
    <footer class="bg-dark text-white py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>${businessInfo.businessName}</h5>
                    <p>${businessInfo.description}</p>
                </div>
                <div class="col-md-6">
                    <h5>Other Locations</h5>
                    ${(businessInfo.locations || []).filter(loc => loc.id !== location.id).slice(0, 3).map(otherLoc => `
                        <p><a href="/locations/${otherLoc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}" class="text-light">${otherLoc.name} - ${otherLoc.city}</a></p>
                    `).join('')}
                    <a href="/locations" class="text-light">View All Locations →</a>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

  return {
    name: `location-${locationSlug}`,
    title: pageTitle,
    html: html,
    url: `/locations/${locationSlug}`
  };
}

// Function to generate locations index page
async function generateLocationsIndexPage(businessInfo: BusinessInfo, websiteContent: WebsiteContent, images: UnsplashImage[]): Promise<GeneratedPage> {
  const colorScheme = businessInfo.colorScheme || {
    primary: '#0d6efd',
    secondary: '#6c757d',
    accent: '#ffc107',
    background: '#ffffff',
    text: '#212529'
  };
  
  const typography = businessInfo.typography || {
    headings: 'Roboto',
    body: 'Open Sans'
  };
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessInfo.businessName} - All Locations</title>
    <meta name="description" content="Find ${businessInfo.businessName} locations near you. We serve multiple areas with professional ${businessInfo.businessType.toLowerCase()} services.">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=${typography.headings.replace(' ', '+')}:wght@300;400;600;700&family=${typography.body.replace(' ', '+')}:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${colorScheme.primary};
            --secondary-color: ${colorScheme.secondary};
            --accent-color: ${colorScheme.accent};
            --background-color: ${colorScheme.background};
            --text-color: ${colorScheme.text};
            --heading-font: '${typography.headings}', sans-serif;
            --body-font: '${typography.body}', sans-serif;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: var(--body-font);
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
        }
        
        .navbar {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-bottom: 3px solid var(--primary-color);
        }
        
        .location-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            overflow: hidden;
            margin-bottom: 30px;
        }
        
        .location-card:hover {
            transform: translateY(-10px);
        }
        
        .primary-badge {
            background: var(--accent-color);
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="/">${businessInfo.businessName}</a>
            <div class="collapse navbar-collapse">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="/about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="/services">Services</a></li>
                    <li class="nav-item"><a class="nav-link active" href="/locations">Locations</a></li>
                    <li class="nav-item"><a class="nav-link" href="/contact">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>
    
    <!-- Hero -->
    <section class="py-5 mt-5 bg-light">
        <div class="container">
            <div class="text-center">
                <h1 class="display-4 mb-4">Our Locations</h1>
                <p class="lead">Find the ${businessInfo.businessName} location nearest to you</p>
            </div>
        </div>
    </section>
    
    <!-- Locations Grid -->
    <section class="py-5">
        <div class="container">
            <div class="row">
                ${(businessInfo.locations || []).map(location => {
                  const locationSlug = location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                  return `
                    <div class="col-md-6 col-lg-4">
                        <div class="location-card">
                            <div class="p-4">
                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <h4 class="mb-0">${location.name}</h4>
                                    ${location.isPrimary ? '<span class="primary-badge">Primary</span>' : ''}
                                </div>
                                
                                <p class="text-muted mb-3">
                                    <i class="fas fa-map-marker-alt me-2"></i>
                                    ${location.name}
                                </p>
                                
                                ${location.phone ? `
                                    <p class="text-muted mb-3">
                                        <i class="fas fa-phone me-2"></i>
                                        <a href="tel:${location.phone}">${location.phone}</a>
                                    </p>
                                ` : ''}
                                
                                <div class="mb-3">
                                    <small class="text-muted">Services:</small>
                                    <div class="mt-2 d-flex flex-wrap gap-1">
                                        ${(businessInfo.services || []).map(service => `
                                            <span class="badge ${location.services.includes(service.name) ? 'bg-success' : 'bg-secondary'} me-1 mb-1">
                                                ${service.name}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="d-flex gap-2">
                                    <a href="/locations/${locationSlug}" class="btn btn-primary flex-fill">View Details</a>
                                    <a href="/contact" class="btn btn-outline-primary">Get Directions</a>
                                </div>
                            </div>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    </section>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

  return {
    name: 'locations-index',
    title: `${businessInfo.businessName} - All Locations`,
    html: html,
    url: '/locations'
  };
}