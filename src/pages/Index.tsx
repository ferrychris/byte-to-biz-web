import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Globe, Rocket, ArrowRight, CheckCircle } from "lucide-react";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { GenerationProgress } from "@/components/GenerationProgress";
import { WebsitePreview } from "@/components/WebsitePreview";

interface BusinessInfo {
  businessName: string;
  businessType: string;
  description: string;
  location: string;
  contactEmail: string;
}

type AppState = "landing" | "form" | "generating" | "preview";

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("landing");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [generatedWebsite, setGeneratedWebsite] = useState({
    url: "https://acme-coffee-shop.netlify.app",
    title: "Acme Coffee Shop - Premium Coffee Experience",
    description: "Professional website generated with AI"
  });

  const handleGetStarted = () => {
    setCurrentState("form");
  };

  const handleFormSubmit = (data: BusinessInfo) => {
    setBusinessInfo(data);
    setCurrentState("generating");
  };

  const handleGenerationComplete = () => {
    setCurrentState("preview");
  };

  const handleStartOver = () => {
    setCurrentState("landing");
    setBusinessInfo(null);
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Advanced AI creates professional websites tailored to your business in minutes"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "From concept to live website in under 3 minutes with our optimized generation process"
    },
    {
      icon: Globe,
      title: "SEO Optimized",
      description: "Built-in SEO best practices ensure your website ranks well in search results"
    },
    {
      icon: Rocket,
      title: "Instant Deployment",
      description: "Automatically deployed to fast, secure hosting with a custom domain"
    }
  ];

  const stats = [
    { label: "Websites Generated", value: "10,000+" },
    { label: "Average Generation Time", value: "2.3 min" },
    { label: "Customer Satisfaction", value: "98%" },
    { label: "Uptime Guarantee", value: "99.9%" }
  ];

  if (currentState === "form") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentState("landing")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              ← Back to Home
            </Button>
          </div>
          <BusinessInfoForm
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    );
  }

  if (currentState === "generating") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <GenerationProgress
            isGenerating={true}
            onComplete={handleGenerationComplete}
          />
        </div>
      </div>
    );
  }

  if (currentState === "preview") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-hero-text mb-4">
              Your Website is Ready! 🎉
            </h1>
            <p className="text-muted-foreground mb-6">
              Your professional website has been generated and is now live. You can preview it below.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleStartOver}
                variant="outline"
                className="border-border/50"
              >
                Generate Another Website
              </Button>
            </div>
          </div>
          
          <WebsitePreview
            websiteData={generatedWebsite}
            isVisible={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-primary glow-primary">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">WebGenAI</span>
            </div>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary transition-smooth"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold gradient-hero-text mb-6 leading-tight">
              AI-Powered Website Generator
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your business idea into a professional website in minutes. 
              Just describe your business, and our AI does the rest.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary h-12 px-8 text-lg transition-smooth"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Website
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-lg border-border/50 hover:bg-muted/50 transition-smooth"
              >
                View Demo
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Everything You Need to Go Online
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform handles every aspect of creating your professional website
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              From idea to live website in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Describe Your Business",
                  description: "Tell us about your business, industry, and what makes you unique"
                },
                {
                  step: "02",
                  title: "AI Generates Your Site",
                  description: "Our AI creates professional content, design, and code tailored for you"
                },
                {
                  step: "03",
                  title: "Launch & Customize",
                  description: "Your website goes live instantly with options to customize and expand"
                }
              ].map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="bg-gradient-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-glow">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full">
                      <ArrowRight className="w-6 h-6 text-primary/50 mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold gradient-hero-text mb-6">
              Ready to Build Your Website?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses who've already created their professional online presence with WebGenAI
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-8">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-muted-foreground">No coding required</span>
              <span className="text-muted-foreground mx-2">•</span>
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-muted-foreground">Live in minutes</span>
              <span className="text-muted-foreground mx-2">•</span>
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-muted-foreground">Professional results</span>
            </div>

            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary h-14 px-10 text-xl transition-smooth"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Start Generating Now
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
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">WebGenAI</span>
            </div>
            <div className="text-muted-foreground text-center md:text-right">
              <p>&copy; 2024 WebGenAI. All rights reserved.</p>
              <p className="text-sm mt-1">Powered by advanced AI technology</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;