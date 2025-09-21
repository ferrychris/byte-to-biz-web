import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Building2, MapPin } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BusinessInfo {
  businessName: string;
  businessType: string;
  description: string;
  location: string;
  contactEmail: string;
  projectId: string;
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
  });

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
          target_audience: formData.contactEmail, // Store contact email as target audience for now
          location: formData.location,
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

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-card border-border/50 backdrop-blur-sm">
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium py-3 h-auto transition-smooth glow-primary"
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
        </form>
      </CardContent>
    </Card>
  );
};