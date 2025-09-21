// Enhanced design templates with modern styling and full page sections
// Includes Lucide icons integration for professional appearance

export interface DesignTemplate {
  name: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headings: string;
    body: string;
  };
  layout: string;
  icons: Record<string, string>; // Lucide icon names
}

export const classicTemplate: DesignTemplate = {
  name: 'classic',
  colorScheme: {
    primary: '#2563eb', // Blue
    secondary: '#64748b', // Slate
    accent: '#f59e0b', // Amber
    background: '#ffffff',
    text: '#1e293b',
    muted: '#64748b'
  },
  typography: {
    headings: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif'
  },
  layout: 'classic',
  icons: {
    phone: 'phone',
    email: 'mail',
    location: 'map-pin',
    clock: 'clock',
    check: 'check',
    star: 'star',
    arrow: 'arrow-right',
    menu: 'menu',
    close: 'x',
    quote: 'quote',
    shield: 'shield-check',
    users: 'users',
    briefcase: 'briefcase',
    home: 'home',
    service: 'wrench',
    contact: 'message-circle',
    about: 'info',
    gallery: 'image',
    testimonial: 'heart',
    feature: 'zap',
    award: 'award',
    globe: 'globe',
    facebook: 'facebook',
    twitter: 'twitter',
    instagram: 'instagram',
    linkedin: 'linkedin'
  }
};

export const modernTemplate: DesignTemplate = {
  name: 'modern',
  colorScheme: {
    primary: '#6366f1', // Indigo
    secondary: '#374151', // Gray
    accent: '#10b981', // Emerald
    background: '#ffffff',
    text: '#111827',
    muted: '#6b7280'
  },
  typography: {
    headings: 'Poppins, system-ui, sans-serif',
    body: 'Open Sans, system-ui, sans-serif'
  },
  layout: 'modern',
  icons: {
    phone: 'smartphone',
    email: 'mail',
    location: 'map-pin',
    clock: 'clock',
    check: 'check-circle',
    star: 'star',
    arrow: 'arrow-right',
    menu: 'menu',
    close: 'x',
    quote: 'quote',
    shield: 'shield',
    users: 'users-2',
    briefcase: 'briefcase',
    home: 'home',
    service: 'settings',
    contact: 'message-square',
    about: 'user',
    gallery: 'images',
    testimonial: 'thumbs-up',
    feature: 'lightning-bolt',
    award: 'trophy',
    globe: 'globe-2',
    facebook: 'facebook',
    twitter: 'twitter',
    instagram: 'instagram',
    linkedin: 'linkedin'
  }
};

export const professionalTemplate: DesignTemplate = {
  name: 'professional',
  colorScheme: {
    primary: '#1f2937', // Gray-800
    secondary: '#4b5563', // Gray-600
    accent: '#dc2626', // Red
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280'
  },
  typography: {
    headings: 'Merriweather, serif',
    body: 'Source Sans Pro, sans-serif'
  },
  layout: 'professional',
  icons: {
    phone: 'phone-call',
    email: 'mail',
    location: 'map-pin',
    clock: 'clock',
    check: 'check',
    star: 'star',
    arrow: 'chevron-right',
    menu: 'menu',
    close: 'x',
    quote: 'quote',
    shield: 'shield-check',
    users: 'users',
    briefcase: 'briefcase',
    home: 'home',
    service: 'tool',
    contact: 'phone',
    about: 'building',
    gallery: 'image',
    testimonial: 'message-circle',
    feature: 'check-circle',
    award: 'award',
    globe: 'globe',
    facebook: 'facebook',
    twitter: 'twitter',
    instagram: 'instagram',
    linkedin: 'linkedin'
  }
};

export function getTemplate(templateName?: string): DesignTemplate {
  switch (templateName) {
    case 'modern':
      return modernTemplate;
    case 'professional':
      return professionalTemplate;
    case 'classic':
    default:
      return classicTemplate;
  }
}

// Generate Lucide icon HTML
export function getLucideIcon(iconName: string, className: string = 'w-5 h-5'): string {
  // In a real implementation, we'd use the actual Lucide icon SVGs
  // For now, we'll return a placeholder that can be replaced with actual icons
  return `<i data-lucide="${iconName}" class="${className}"></i>`;
}

// Full page section templates with modern design
export function generateHeroSection(
  title: string,
  subtitle: string,
  ctaText: string,
  backgroundImage?: string,
  template: DesignTemplate = classicTemplate
): string {
  const bgStyle = backgroundImage 
    ? `background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${backgroundImage}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, ${template.colorScheme.primary}, ${template.colorScheme.accent});`;

  return `
    <section class="hero-section" style="${bgStyle} color: white; padding: 100px 0; text-align: center;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <h1 style="font-family: ${template.typography.headings}; font-size: 3.5rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.2;">
          ${title}
        </h1>
        <p style="font-family: ${template.typography.body}; font-size: 1.25rem; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; opacity: 0.95;">
          ${subtitle}
        </p>
        <a href="#contact" class="cta-button" style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${template.colorScheme.accent}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          ${ctaText}
          ${getLucideIcon(template.icons.arrow, 'w-5 h-5')}
        </a>
      </div>
    </section>`;
}

export function generateFeaturesSection(
  title: string,
  features: Array<{title: string, description: string}>,
  template: DesignTemplate = classicTemplate
): string {
  const featureCards = features.map(feature => `
    <div class="feature-card" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s ease;">
      <div style="background: ${template.colorScheme.primary}; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
        ${getLucideIcon(template.icons.feature, 'w-6 h-6')}
      </div>
      <h3 style="font-family: ${template.typography.headings}; font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: ${template.colorScheme.text};">
        ${feature.title}
      </h3>
      <p style="font-family: ${template.typography.body}; color: ${template.colorScheme.muted}; line-height: 1.6;">
        ${feature.description}
      </p>
    </div>
  `).join('');

  return `
    <section class="features-section" style="padding: 80px 0; background: #f8fafc;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <h2 style="font-family: ${template.typography.headings}; font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 3rem; color: ${template.colorScheme.text};">
          ${title}
        </h2>
        <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          ${featureCards}
        </div>
      </div>
    </section>`;
}

export function generateServicesSection(
  title: string,
  services: Array<{name: string, description: string, price?: string}>,
  template: DesignTemplate = classicTemplate
): string {
  const serviceCards = services.map(service => `
    <div class="service-card" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-left: 4px solid ${template.colorScheme.primary};">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <div style="background: ${template.colorScheme.primary}; color: white; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          ${getLucideIcon(template.icons.service, 'w-5 h-5')}
        </div>
        <div>
          <h3 style="font-family: ${template.typography.headings}; font-size: 1.5rem; font-weight: 600; color: ${template.colorScheme.text}; margin: 0;">
            ${service.name}
          </h3>
          ${service.price ? `<p style="color: ${template.colorScheme.accent}; font-weight: 600; margin: 0.25rem 0 0;">${service.price}</p>` : ''}
        </div>
      </div>
      <p style="font-family: ${template.typography.body}; color: ${template.colorScheme.muted}; line-height: 1.6; margin: 0;">
        ${service.description}
      </p>
    </div>
  `).join('');

  return `
    <section class="services-section" style="padding: 80px 0;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <h2 style="font-family: ${template.typography.headings}; font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 3rem; color: ${template.colorScheme.text};">
          ${title}
        </h2>
        <div class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem;">
          ${serviceCards}
        </div>
      </div>
    </section>`;
}

export function generateTestimonialsSection(
  title: string,
  testimonials: Array<{quote: string, author: string, role?: string}>,
  template: DesignTemplate = classicTemplate
): string {
  const testimonialCards = testimonials.map(testimonial => `
    <div class="testimonial-card" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center;">
      <div style="color: ${template.colorScheme.primary}; margin-bottom: 1rem;">
        ${getLucideIcon(template.icons.quote, 'w-8 h-8')}
      </div>
      <p style="font-family: ${template.typography.body}; font-size: 1.1rem; line-height: 1.7; color: ${template.colorScheme.text}; margin-bottom: 1.5rem; font-style: italic;">
        "${testimonial.quote}"
      </p>
      <div>
        <h4 style="font-family: ${template.typography.headings}; font-weight: 600; color: ${template.colorScheme.text}; margin: 0;">
          ${testimonial.author}
        </h4>
        ${testimonial.role ? `<p style="color: ${template.colorScheme.muted}; margin: 0.25rem 0 0; font-size: 0.9rem;">${testimonial.role}</p>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <section class="testimonials-section" style="padding: 80px 0; background: #f8fafc;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <h2 style="font-family: ${template.typography.headings}; font-size: 2.5rem; font-weight: 700; text-align: center; margin-bottom: 3rem; color: ${template.colorScheme.text};">
          ${title}
        </h2>
        <div class="testimonials-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          ${testimonialCards}
        </div>
      </div>
    </section>`;
}

export function generateContactSection(
  title: string,
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  },
  template: DesignTemplate = classicTemplate
): string {
  const contactItems = [];
  
  if (contactInfo.phone) {
    contactItems.push(`
      <div class="contact-item" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: ${template.colorScheme.primary}; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${getLucideIcon(template.icons.phone, 'w-5 h-5')}
        </div>
        <div>
          <h4 style="font-family: ${template.typography.headings}; font-weight: 600; color: ${template.colorScheme.text}; margin: 0;">Phone</h4>
          <p style="font-family: ${template.typography.body}; color: ${template.colorScheme.muted}; margin: 0.25rem 0 0;">${contactInfo.phone}</p>
        </div>
      </div>
    `);
  }
  
  if (contactInfo.email) {
    contactItems.push(`
      <div class="contact-item" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: ${template.colorScheme.primary}; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${getLucideIcon(template.icons.email, 'w-5 h-5')}
        </div>
        <div>
          <h4 style="font-family: ${template.typography.headings}; font-weight: 600; color: ${template.colorScheme.text}; margin: 0;">Email</h4>
          <p style="font-family: ${template.typography.body}; color: ${template.colorScheme.muted}; margin: 0.25rem 0 0;">${contactInfo.email}</p>
        </div>
      </div>
    `);
  }
  
  if (contactInfo.address) {
    contactItems.push(`
      <div class="contact-item" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: ${template.colorScheme.primary}; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${getLucideIcon(template.icons.location, 'w-5 h-5')}
        </div>
        <div>
          <h4 style="font-family: ${template.typography.headings}; font-weight: 600; color: ${template.colorScheme.text}; margin: 0;">Address</h4>
          <p style="font-family: ${template.typography.body}; color: ${template.colorScheme.muted}; margin: 0.25rem 0 0;">${contactInfo.address}</p>
        </div>
      </div>
    `);
  }

  return `
    <section class="contact-section" style="padding: 80px 0;">
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">
          <div>
            <h2 style="font-family: ${template.typography.headings}; font-size: 2.5rem; font-weight: 700; margin-bottom: 2rem; color: ${template.colorScheme.text};">
              ${title}
            </h2>
            ${contactItems.join('')}
          </div>
          <div>
            <form class="contact-form" style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: ${template.colorScheme.text};">Name</label>
                <input type="text" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: ${template.typography.body};" required>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: ${template.colorScheme.text};">Email</label>
                <input type="email" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: ${template.typography.body};" required>
              </div>
              <div style="margin-bottom: 2rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: ${template.colorScheme.text};">Message</label>
                <textarea rows="4" style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-family: ${template.typography.body}; resize: vertical;" required></textarea>
              </div>
              <button type="submit" style="background: ${template.colorScheme.primary}; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; font-family: ${template.typography.body};">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>`;
}

// Generate enhanced CSS with design template
export function generateEnhancedCss(
  colorScheme: { primary: string; secondary: string; accent: string; background: string; text: string; muted: string },
  typography: { headings: string; body: string },
  template: DesignTemplate
): string {
  return `
/* Enhanced CSS with Design Template */
:root {
  --primary-color: ${colorScheme.primary};
  --secondary-color: ${colorScheme.secondary};
  --accent-color: ${colorScheme.accent};
  --background-color: ${colorScheme.background};
  --text-color: ${colorScheme.text};
  --muted-color: ${colorScheme.muted};
}

body {
  font-family: '${typography.body}', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

h1, h2, h3, h4, h5, h6 {
  font-family: '${typography.headings}', sans-serif;
  font-weight: 600;
}

.navbar {
  background: transparent !important;
  transition: all 0.3s ease;
  padding: 15px 0;
}

.navbar.scrolled {
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
}

.navbar-brand {
  font-family: '${typography.headings}', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--text-color) !important;
}

.nav-link {
  font-weight: 500;
  color: var(--text-color) !important;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--primary-color) !important;
}

.btn-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  font-weight: 600;
  padding: 12px 30px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

footer {
  background: var(--text-color);
  color: var(--background-color);
  padding: 3rem 0 2rem;
}

.text-primary {
  color: var(--primary-color) !important;
}

.bg-primary {
  background-color: var(--primary-color) !important;
}

/* Lucide Icons Styling */
[data-lucide] {
  stroke-width: 2;
}

/* Section Spacing */
.section {
  padding: 80px 0;
}

.section.bg-light {
  background-color: #f8fafc !important;
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2.5rem !important;
  }
  
  .section {
    padding: 60px 0;
  }
  
  .features-grid,
  .services-grid,
  .testimonials-grid {
    grid-template-columns: 1fr !important;
  }
}
  `;
}
