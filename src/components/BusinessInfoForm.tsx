import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Building2, MapPin, Users, Palette, LayoutTemplate, Check } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
}

interface BusinessInfo {
  businessName: string;
  businessType: string;
  description: string;
  location: string;
  contactEmail: string;
  targetAudience: string;
  projectId: string;
  websiteTemplate: string;
  colorScheme: ColorScheme;
  typography: Typography;
}

interface BusinessInfoFormProps {
  onSubmit: (data: BusinessInfo) => void;
  isLoading?: boolean;
}

const businessTypes = [
  "Restaurant & Food Service",
  "Retail & E-commerce",
  "Professional Services",
  "Healthcare & Medical",
  "Technology & Software",
  "Real Estate",
  "Fitness & Wellness",
  "Education & Training",
  "Automotive",
  "Beauty & Personal Care",
  "Construction & Home Services",
  "Financial Services",
  "Non-profit Organization",
  "Other"
];

export const BusinessInfoForm = ({ onSubmit, isLoading = false }: BusinessInfoFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    description: "",
    location: "",
    contactEmail: "",
    targetAudience: "",
    websiteTemplate: "modern-business",
    colorScheme: {
      primary: "#0d6efd",
      secondary: "#6c757d",
      accent: "#ffc107",
      background: "#ffffff",
      text: "#212529"
    },
    typography: {
      headings: "Roboto",
      body: "Open Sans"
    }
  });
  
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Fetch website templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('website_templates')
          .select('*')
          .eq('is_active', true);
          
        if (error) throw error;
        if (data) setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    
    fetchTemplates();
  }, []);

  const [errors, setErrors] = useState<Partial<BusinessInfo>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessInfo> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.businessType) {
      newErrors.businessType = "Please select a business type";
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = "Please provide at least 10 characters describing your business";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required for local SEO";
    }

    if (!formData.contactEmail.trim() || !formData.contactEmail.includes("@")) {
      newErrors.contactEmail = "Valid email address is required";
    }
    
    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = "Please describe your target audience";
    }
    
    if (!formData.websiteTemplate) {
      newErrors.websiteTemplate = "Please select a website template";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;
    
    try {
      // Create project in database
      const { data: project, error } = await supabase
        .from('website_projects')
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          business_type: formData.businessType,
          description: formData.description,
          target_audience: formData.targetAudience,
          location: formData.location,
          website_template: formData.websiteTemplate,
          color_scheme: formData.colorScheme,
          typography: formData.typography,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      onSubmit({ ...formData, projectId: project.id });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const updateField = <T extends keyof typeof formData>(field: T, value: typeof formData[T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof BusinessInfo]) {
      setErrors(prev => ({ ...prev, [field as keyof BusinessInfo]: undefined }));
    }
  };
  
  const updateColorScheme = (colorKey: keyof ColorScheme, value: string) => {
    setFormData(prev => ({
      ...prev,
      colorScheme: {
        ...prev.colorScheme,
        [colorKey]: value
      }
    }));
  };
  
  const updateTypography = (typographyKey: keyof Typography, value: string) => {
    setFormData(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [typographyKey]: value
      }
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gradient-card border-border/50 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl gradient-text">Tell us about your business</CardTitle>
        <CardDescription className="text-muted-foreground">
          We'll use this information to generate a professional website tailored specifically for your business
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Basic Info
              </TabsTrigger>
              <TabsTrigger value="design" className="flex items-center gap-2">
                <Palette className="w-4 h-4" /> Design
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Template
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2 text-foreground">
                    <Building2 className="w-4 h-4" />
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., Acme Coffee Shop"
                    value={formData.businessName}
                    onChange={(e) => updateField("businessName", e.target.value)}
                    className={`bg-input/50 border-border focus:border-primary transition-smooth ${
                      errors.businessName ? "border-destructive" : ""
                    }`}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4" />
                    Location / City
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className={`bg-input/50 border-border focus:border-primary transition-smooth ${
                      errors.location ? "border-destructive" : ""
                    }`}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType" className="text-foreground">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => updateField("businessType", value)}>
                  <SelectTrigger className={`bg-input/50 border-border focus:border-primary transition-smooth ${
                    errors.businessType ? "border-destructive" : ""
                  }`}>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type} className="focus:bg-accent/10">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-sm text-destructive">{errors.businessType}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-foreground">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    className={`bg-input/50 border-border focus:border-primary transition-smooth ${
                      errors.contactEmail ? "border-destructive" : ""
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive">{errors.contactEmail}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4" />
                    Target Audience
                  </Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Young professionals, families, etc."
                    value={formData.targetAudience}
                    onChange={(e) => updateField("targetAudience", e.target.value)}
                    className={`bg-input/50 border-border focus:border-primary transition-smooth ${
                      errors.targetAudience ? "border-destructive" : ""
                    }`}
                  />
                  {errors.targetAudience && (
                    <p className="text-sm text-destructive">{errors.targetAudience}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  Business Description
                  <span className="text-muted-foreground text-sm ml-2">
                    (Tell us what makes your business special)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business, what services you offer, your target customers, and what makes you unique. The more details you provide, the better your website will be!"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  className={`bg-input/50 border-border focus:border-primary transition-smooth resize-none ${
                    errors.description ? "border-destructive" : ""
                  }`}
                />
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Design Tab */}
            <TabsContent value="design" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor" className="text-sm">Primary</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        id="primaryColor"
                        value={formData.colorScheme.primary}
                        onChange={(e) => updateColorScheme("primary", e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor" className="text-sm">Secondary</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        id="secondaryColor"
                        value={formData.colorScheme.secondary}
                        onChange={(e) => updateColorScheme("secondary", e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accentColor" className="text-sm">Accent</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        id="accentColor"
                        value={formData.colorScheme.accent}
                        onChange={(e) => updateColorScheme("accent", e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor" className="text-sm">Background</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        id="backgroundColor"
                        value={formData.colorScheme.background}
                        onChange={(e) => updateColorScheme("background", e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="textColor" className="text-sm">Text</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        id="textColor"
                        value={formData.colorScheme.text}
                        onChange={(e) => updateColorScheme("text", e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headingsFont">Headings Font</Label>
                    <Select 
                      value={formData.typography.headings} 
                      onValueChange={(value) => updateTypography("headings", value)}
                    >
                      <SelectTrigger className="bg-input/50 border-border">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Oswald">Oswald</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bodyFont">Body Font</Label>
                    <Select 
                      value={formData.typography.body} 
                      onValueChange={(value) => updateTypography("body", value)}
                    >
                      <SelectTrigger className="bg-input/50 border-border">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Nunito">Nunito</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                <h4 className="font-medium mb-2">Preview</h4>
                <div 
                  className="p-4 rounded-lg" 
                  style={{ backgroundColor: formData.colorScheme.background, color: formData.colorScheme.text }}
                >
                  <h3 
                    className="text-xl mb-2" 
                    style={{ 
                      fontFamily: formData.typography.headings, 
                      color: formData.colorScheme.primary 
                    }}
                  >
                    {formData.businessName || "Your Business Name"}
                  </h3>
                  <p style={{ fontFamily: formData.typography.body }}>
                    {formData.description.substring(0, 100) || "Your business description will appear here."}
                    {formData.description.length > 100 ? "..." : ""}
                  </p>
                  <button 
                    className="mt-3 px-4 py-2 rounded-md" 
                    style={{ 
                      backgroundColor: formData.colorScheme.primary, 
                      color: "#fff",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </TabsContent>
            
            {/* Template Tab */}
            <TabsContent value="template" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Website Template</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a template that best fits your business needs. Each template comes with different layouts and features.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.length > 0 ? templates.map((template) => (
                    <div 
                      key={template.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${formData.websiteTemplate === template.id ? 'ring-2 ring-primary' : 'border-border/50 hover:border-primary/50'}`}
                      onClick={() => updateField("websiteTemplate", template.id)}
                    >
                      <div className="aspect-video bg-muted relative">
                        <img 
                          src={template.preview_image_url} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                        {formData.websiteTemplate === template.id && (
                          <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center p-8 border border-dashed rounded-lg border-border/50">
                      <p className="text-muted-foreground">Loading templates...</p>
                    </div>
                  )}
                </div>
                
                {errors.websiteTemplate && (
                  <p className="text-sm text-destructive">{errors.websiteTemplate}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between pt-4">
            {activeTab !== "basic" ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setActiveTab(activeTab === "design" ? "basic" : "design")}
              >
                Back
              </Button>
            ) : <div></div>}
            
            {activeTab !== "template" ? (
              <Button 
                type="button" 
                className="ml-auto"
                onClick={() => setActiveTab(activeTab === "basic" ? "design" : "template")}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="ml-auto bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium py-3 h-auto transition-smooth glow-primary"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Your Website...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate My Website
                  </div>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};