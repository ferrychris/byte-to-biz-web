import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  ChevronDown,
  Leaf,
  Palette,
  Zap,
  Globe,
  Hammer,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const features = [
    {
      icon: Leaf,
      title: "Fast SEO Growth",
      description: "AI-optimized content that ranks higher in search results"
    },
    {
      icon: Palette,
      title: "Customizable Templates",
      description: "Beautiful designs that adapt to your brand identity"
    },
    {
      icon: Zap,
      title: "AI Content Generation",
      description: "Engaging copy written specifically for your business"
    },
    {
      icon: Globe,
      title: "Analytics & Integrations",
      description: "Track performance and connect with your favorite tools"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Select Your Business",
      description: "Tell us about your business type and requirements"
    },
    {
      number: "2",
      title: "Customize SEO Pages",
      description: "Add your unique details and preferences for each page"
    },
    {
      number: "3",
      title: "Publish & Rank",
      description: "Your SEO-optimized pages go live and start ranking"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Cohen",
      role: "CEO at FlexFit",
      stars: 5,
      text: "This tool completely transformed our online presence. We're now ranking for keywords we couldn't compete for before. The AI-generated content is surprisingly good!"
    },
    {
      name: "James Wilson",
      role: "Marketing Director",
      stars: 5,
      text: "I've tried many SEO tools but this one stands out. The pages it creates are not only optimized for search engines but also look professional and convert well."
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "$29",
      period: "/month",
      features: [
        "5 SEO Pages",
        "Basic Analytics",
        "Standard Support",
        "1 User"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      features: [
        "15 SEO Pages",
        "Advanced Analytics",
        "Priority Support",
        "3 Users",
        "Custom Branding"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Custom",
      price: "Custom",
      period: "",
      features: [
        "Unlimited SEO Pages",
        "Enterprise Analytics",
        "Dedicated Support",
        "Unlimited Users",
        "White Labeling"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "What is an SEO page?",
      answer: "An SEO page is a webpage specifically designed to rank well in search engines. Our tool creates these pages with optimized content, meta tags, and structure to help your business get found online."
    },
    {
      question: "How does the AI content generation work?",
      answer: "Our advanced AI analyzes your business type, target keywords, and competitor content to generate unique, engaging, and SEO-optimized content for your pages. The content is tailored to your specific industry and audience."
    },
    {
      question: "Can I edit the generated content?",
      answer: "Yes, you have full control to edit, refine, or completely change any content our AI generates. We provide a user-friendly editor that allows you to make changes while maintaining SEO best practices."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-primary glow-primary">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Siteforge</span>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              </nav>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login">Log In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold gradient-hero-text mb-6 leading-tight">
                Generate High-Ranking SEO Pages in Minutes
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Siteforge is a new platform for creating stunning websites with AI-powered content. Boost your online presence and rank higher in search results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary h-12 px-8 text-lg transition-smooth"
                >
                  Get Started Free
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-12 px-8 text-lg border-border/50 hover:bg-muted/50 transition-smooth"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-card rounded-lg border border-border/50 shadow-lg p-4">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">Website Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Key Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Siteforge is a complete solution for creating high-performing websites that rank well and convert visitors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-card p-6 rounded-xl border border-border/50 backdrop-blur-sm hover:shadow-card transition-smooth"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Creating high-ranking SEO pages has never been easier
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-gradient-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-glow">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full -translate-x-1/2">
                      <ArrowRight className="w-6 h-6 text-primary/50 mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by businesses of all sizes to improve their online presence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-card p-6 rounded-xl border border-border/50 shadow-sm"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-card p-6 rounded-xl border ${plan.popular ? 'border-primary shadow-glow-sm' : 'border-border/50'} relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold py-1 px-3 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-end justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-primary mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-gradient-primary text-primary-foreground' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our platform
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-card p-6 rounded-xl border border-border/50"
              >
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="mt-4 text-muted-foreground">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-card p-8 md:p-12 rounded-2xl border border-border/50 shadow-lg">
            <h2 className="text-3xl font-bold gradient-hero-text mb-6">
              Ready to Boost Your SEO?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Take the first step toward higher rankings and more traffic today
            </p>
            <Button 
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary h-12 px-8 text-lg transition-smooth"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="p-2 rounded-lg bg-gradient-primary glow-primary">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Siteforge</span>
            </div>
            <div className="flex gap-6 mb-4 md:mb-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
            </div>
            <div className="text-muted-foreground text-center md:text-right">
              <p>&copy; 2025 Siteforge. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
