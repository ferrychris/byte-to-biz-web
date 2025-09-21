import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from './ConfirmationDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Building2, MapPin, Users, Palette, LayoutTemplate, Check, Briefcase, Plus, X, Clock, Globe, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ServiceItem {
  name: string;
  description: string;
  price?: string;
  featured: boolean;
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
  services: string[]; // Services offered at this location
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
  businessName: string;
  businessType: string;
  description: string;
  location: string; // Keep for backward compatibility
  locations: LocationItem[];
  contactEmail: string;
  targetAudience: string;
  projectId: string;
  websiteTemplate: string;
  colorScheme: ColorScheme;
  typography: Typography;
  services: ServiceItem[];
  showPricing: boolean;
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

// Helper function to get service suggestions based on business type
const getServiceSuggestions = (businessType: string): string[] => {
  const suggestions: Record<string, string[]> = {
    "Restaurant & Food Service": ["Dine-in Service", "Takeout", "Catering", "Private Events", "Delivery", "Meal Prep"],
    "Retail & E-commerce": ["Online Shopping", "In-store Pickup", "Product Customization", "Gift Wrapping", "Loyalty Program"],
    "Professional Services": ["Consultation", "Project Management", "Ongoing Support", "Training", "Auditing"],
    "Healthcare & Medical": ["Check-ups", "Specialized Care", "Emergency Services", "Telehealth", "Preventive Care"],
    "Technology & Software": ["Software Development", "IT Support", "Cloud Services", "Data Analysis", "Cybersecurity"],
    "Real Estate": ["Property Listings", "Buyer Representation", "Seller Representation", "Property Management", "Consultations"],
    "Fitness & Wellness": ["Personal Training", "Group Classes", "Nutrition Planning", "Wellness Coaching", "Massage Therapy"],
    "Education & Training": ["Courses", "Workshops", "One-on-One Tutoring", "Certification Programs", "Corporate Training"],
    "Automotive": ["Repairs & Maintenance", "Detailing", "Parts & Accessories", "Towing", "Inspections"],
    "Beauty & Personal Care": ["Haircuts & Styling", "Skincare", "Nail Services", "Makeup", "Spa Treatments"],
    "Construction & Home Services": ["Remodeling", "Repairs", "New Construction", "Maintenance", "Inspections"],
    "Financial Services": ["Financial Planning", "Tax Preparation", "Investment Management", "Insurance", "Retirement Planning"],
    "Non-profit Organization": ["Community Programs", "Fundraising Events", "Volunteer Opportunities", "Education & Awareness", "Support Services"]
  };
  
  return suggestions[businessType] || ["Service 1", "Service 2", "Service 3", "Premium Package", "Consultation"];
};

export const BusinessInfoForm = ({ onSubmit, isLoading = false }: BusinessInfoFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    description: "",
    location: "",
    locations: [],
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
    },
    services: [],
    showPricing: false
  });
  
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [newService, setNewService] = useState({ name: "", description: "", price: "", featured: false });
  const [serviceError, setServiceError] = useState("");
  const [newLocation, setNewLocation] = useState({
    id: "",
    name: "",
    address: "", // No default value
    city: "", // No default value
    state: "", // No default value
    zipCode: "", // No default value
    country: "United States", // Default country only
    phone: "",
    email: "",
    services: [],
    businessHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: { open: "09:00", close: "17:00", closed: true },
      sunday: { open: "09:00", close: "17:00", closed: true }
    },
    metadata: {
      description: "",
      keywords: [],
      localAreaKeywords: []
    },
    isPrimary: false
  });
  const [locationError, setLocationError] = useState("");
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
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
    
    // Show confirmation dialog instead of immediately submitting
    setShowConfirmation(true);
  };
  
  const handleConfirmGeneration = async () => {
    if (!user) return;
    
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
          services: formData.services,
          show_pricing: formData.showPricing,
          locations: formData.locations,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      onSubmit({ ...formData, projectId: project.id });
    } catch (error) {
      console.error('Error creating project:', error);
      setShowConfirmation(false);
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
  
  const handleAddService = () => {
    if (!newService.name.trim()) {
      setServiceError("Service name is required");
      return;
    }
    
    if (!newService.description.trim()) {
      setServiceError("Service description is required");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { ...newService }]
    }));
    
    // Reset form
    setNewService({ name: "", description: "", price: "", featured: false });
    setServiceError("");
  };
  
  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };
  
  const addSuggestedService = (serviceName: string) => {
    // Check if service already exists
    if (formData.services.some(s => s.name === serviceName)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { 
        name: serviceName, 
        description: `Professional ${serviceName.toLowerCase()} services for your needs.`,
        price: "",
        featured: false
      }]
    }));
  };
  
  const handleAddLocation = async () => {
    if (!newLocation.name.trim()) {
      setLocationError("Location name is required");
      return;
    }
    
    // Only location name is required now
    
    // If this is set as primary, unmark other primary locations
    const updatedLocations = newLocation.isPrimary 
      ? formData.locations.map(loc => ({ ...loc, isPrimary: false }))
      : formData.locations;
    
    // Generate ID for the location
    const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setFormData(prev => ({
      ...prev,
      locations: [...updatedLocations, { ...newLocation, id: locationId }]
    }));
    
    // Reset form
    setNewLocation({
      id: "",
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      phone: "",
      email: "",
      services: [],
      businessHours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: { open: "09:00", close: "17:00", closed: true },
        sunday: { open: "09:00", close: "17:00", closed: true }
      },
      metadata: {
        description: "",
        keywords: [],
        localAreaKeywords: []
      },
      isPrimary: false
    });
    setLocationError("");
  };
  
  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gradient-card border-border/50 backdrop-blur-sm">
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmGeneration}
        title="Ready to generate your website?"
        description="We'll use the information you've provided to create a custom website for your business. This process may take a few minutes."
        isLoading={isLoading}
      />
      
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
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Basic Info
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Services
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Locations
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
            
            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Business Locations</h3>
                  <Badge variant="outline" className="text-xs">
                    SEO Optimized
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm">
                  Add all your business locations to create dedicated pages for each location, improving local SEO.
                </p>
                
                {/* Add new location form */}
                <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New Location
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="locationName">Location Name</Label>
                        <Input
                          id="locationName"
                          placeholder="e.g., Downtown Branch, Main Office"
                          value={newLocation.name}
                          onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                          className="bg-input/50 border-border"
                        />
                      </div>
                    </div>
                    
                    {/* Services at this location */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Services at this location:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.services.map((service, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`location-service-${index}`}
                              checked={newLocation.services.includes(service.name)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewLocation({
                                    ...newLocation,
                                    services: [...newLocation.services, service.name]
                                  });
                                } else {
                                  setNewLocation({
                                    ...newLocation,
                                    services: newLocation.services.filter(s => s !== service.name)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`location-service-${index}`} className="text-sm">
                              {service.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.services.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add services first to assign them to locations</p>
                      )}
                    </div>
                    
                    {/* SEO Metadata */}
                    <div className="p-3 border border-border/30 rounded-lg bg-muted/30">
                      <h5 className="font-medium text-sm mb-2">SEO Metadata</h5>
                      <p className="text-sm text-muted-foreground">Metadata will be automatically generated using AI</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primary-location"
                        checked={newLocation.isPrimary}
                        onCheckedChange={(checked) => setNewLocation({...newLocation, isPrimary: !!checked})}
                      />
                      <Label htmlFor="primary-location">This is the primary location</Label>
                    </div>
                    
                    {locationError && <p className="text-sm text-destructive">{locationError}</p>}
                    <Button 
                      type="button" 
                      onClick={handleAddLocation}
                      className="w-full"
                      disabled={isLoadingLocationData}
                    >
                      {isLoadingLocationData ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Validating Location...
                        </div>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Add Location
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Locations list */}
                <div className="space-y-3">
                  <h4 className="font-medium">Your Locations ({formData.locations.length})</h4>
                  {formData.locations.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-lg border-border/50">
                      <p className="text-muted-foreground">No locations added yet. Add your first location above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.locations.map((location, index) => (
                        <div key={location.id} className="p-4 border rounded-lg border-border/50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium">{location.name}</h5>
                                {location.isPrimary && (
                                  <Badge variant="default" className="text-xs">Primary</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {location.services.length} services
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {location.address}, {location.city}, {location.state} {location.zipCode}
                              </p>
                              {location.metadata.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {location.metadata.description.substring(0, 100)}...
                                </p>
                              )}
                              {location.metadata.localAreaKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {location.metadata.localAreaKeywords.slice(0, 3).map((keyword, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {location.metadata.localAreaKeywords.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{location.metadata.localAreaKeywords.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeLocation(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Services & Offerings</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-pricing"
                      checked={formData.showPricing}
                      onCheckedChange={(checked) => updateField("showPricing", checked)}
                    />
                    <Label htmlFor="show-pricing">Show Pricing</Label>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm">
                  Add the services or products your business offers. These will be featured on your website.
                </p>
                
                {/* Service suggestions based on business type */}
                {formData.businessType && (
                  <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                    <h4 className="font-medium mb-2">Suggested Services for {formData.businessType}</h4>
                    <div className="flex flex-wrap gap-2">
                      {getServiceSuggestions(formData.businessType).map((service, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() => addSuggestedService(service)}
                        >
                          + {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add new service form */}
                <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                  <h4 className="font-medium mb-3">Add Custom Service</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input
                          id="serviceName"
                          placeholder="e.g., Website Design"
                          value={newService.name}
                          onChange={(e) => setNewService({...newService, name: e.target.value})}
                          className="bg-input/50 border-border"
                        />
                      </div>
                      {formData.showPricing && (
                        <div>
                          <Label htmlFor="servicePrice">Price (optional)</Label>
                          <Input
                            id="servicePrice"
                            placeholder="e.g., $99 or Starting at $99"
                            value={newService.price}
                            onChange={(e) => setNewService({...newService, price: e.target.value})}
                            className="bg-input/50 border-border"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="serviceDescription">Description</Label>
                      <Textarea
                        id="serviceDescription"
                        placeholder="Brief description of this service"
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        className="bg-input/50 border-border resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured-service"
                        checked={newService.featured}
                        onCheckedChange={(checked) => setNewService({...newService, featured: checked})}
                      />
                      <Label htmlFor="featured-service">Featured Service (highlighted on homepage)</Label>
                    </div>
                    {serviceError && <p className="text-sm text-destructive">{serviceError}</p>}
                    <Button 
                      type="button" 
                      onClick={handleAddService}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Service
                    </Button>
                  </div>
                </div>
                
                {/* Services list */}
                <div className="space-y-3">
                  <h4 className="font-medium">Your Services ({formData.services.length})</h4>
                  {formData.services.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-lg border-border/50">
                      <p className="text-muted-foreground">No services added yet. Add some services above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.services.map((service, index) => (
                        <div key={index} className="p-3 border rounded-lg border-border/50 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{service.name}</h5>
                              {service.featured && (
                                <Badge variant="default" className="text-xs">Featured</Badge>
                              )}
                              {service.price && (
                                <Badge variant="outline" className="text-xs">{service.price}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeService(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
                onClick={() => {
                  // Sequential navigation through tabs
                  const tabOrder = ["basic", "services", "locations", "design", "template"];
                  const currentIndex = tabOrder.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabOrder[currentIndex - 1]);
                  }
                }}
              >
                Back
              </Button>
            ) : <div></div>}
            
            {activeTab !== "template" ? (
              <Button 
                type="button" 
                className="ml-auto"
                onClick={() => {
                  // Sequential navigation through tabs
                  const tabOrder = ["basic", "services", "locations", "design", "template"];
                  const currentIndex = tabOrder.indexOf(activeTab);
                  if (currentIndex < tabOrder.length - 1) {
                    setActiveTab(tabOrder[currentIndex + 1]);
                  }
                }}
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