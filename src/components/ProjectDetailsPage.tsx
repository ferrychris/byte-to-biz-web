import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Globe,
  FileText,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Briefcase,
  Home,
  Info,
  Phone,
  Map,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

interface ProjectDetails {
  id: string;
  business_name: string;
  business_type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  preview_url?: string;
  deployment_url?: string;
  is_public?: boolean;
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: string;
    featured?: boolean;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    services: string[];
    isPrimary: boolean;
  }>;
}

interface GeneratedPage {
  name: string;
  title: string;
  url: string;
  html?: string;
}

interface GeneratedData {
  pages?: GeneratedPage[];
  html?: string;
  previewUrl?: string;
}

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const handleVisibilityChange = async (value: boolean) => {
    if (!id) return;
    try {
      setUpdatingVisibility(true);
      const { error } = await supabase
        .from('website_projects')
        .update({ is_public: value })
        .eq('id', id);
      if (error) throw error;
      setProject((prev) => prev ? { ...prev, is_public: value } : prev);
    } catch (err) {
      console.error('Failed to update visibility', err);
      // Optionally add a toast here
    } finally {
      setUpdatingVisibility(false);
    }
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('website_projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (projectError) throw projectError;
        if (!projectData) throw new Error("Project not found");
        
        setProject(projectData);
        
        // Try to fetch generated pages if the table exists
        try {
          const { data: generatedData } = await supabase
            .from('website_generated_data')
            .select('metadata')
            .eq('project_id', id)
            .single();
            
          // Extract pages from metadata if available
          if (generatedData?.metadata && typeof generatedData.metadata === 'object') {
            // Use a more specific type than any
            const metadata = generatedData.metadata as Record<string, unknown>;
            if (metadata.pages && Array.isArray(metadata.pages)) {
              setGeneratedPages(metadata.pages);
            } else {
              setGeneratedPages([]);
            }
          } else {
            setGeneratedPages([]);
          }
        } catch (pageError) {
          console.log('No generated pages found or table does not exist');
          setGeneratedPages([]);
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch project details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader>
            <CardTitle>Error Loading Project</CardTitle>
            <CardDescription>
              {error || "Project not found. Please try again or contact support."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group pages by type - with null checks
  const mainPages = generatedPages.filter(page => 
    page && page.name && !page.name.startsWith('location-') && page.name !== 'locations-index'
  );
  
  const locationPages = generatedPages.filter(page => 
    page && page.name && page.name.startsWith('location-')
  );
  
  const locationsIndexPage = generatedPages.find(page => 
    page && page.name === 'locations-index'
  );

  // Resolve the project preview/deployment link
  const projectLink = project.preview_url || project.deployment_url || '';

  // Helper function to safely get URL
  const safeUrl = (url?: string) => url || '';

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">{project.business_name}</h1>
          <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
            {project.status === 'completed' ? 'Live' : 'Processing'}
          </Badge>
        </div>
        
        {projectLink && (
          <Button asChild>
            <a href={`${projectLink}&page=home`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> View Website
            </a>
          </Button>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Website Details</CardTitle>
          <CardDescription>
            {project.business_type} business in {project.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm">{project.business_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm">{project.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm">{project.services?.length || 0} Services</span>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
            <div>
              <p className="text-sm font-medium">Public website</p>
              <p className="text-xs text-muted-foreground">When public, anyone with the link can view your site.</p>
            </div>
            <Switch
              checked={!!project.is_public}
              onCheckedChange={handleVisibilityChange}
              disabled={updatingVisibility}
            />
          </div>

          {projectLink && (
            <div className="mb-2">
              <p className="text-sm text-muted-foreground mb-1">Project Link</p>
              <div className="flex items-center gap-2">
                <a
                  href={`${projectLink}&page=home`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm truncate text-primary hover:underline"
                  title={projectLink}
                >
                  {projectLink}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(projectLink)}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Services
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Locations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Website Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Main Pages</h3>
                  <div className="space-y-2">
                    {mainPages.map((page) => (
                      <div 
                        key={page.name || 'unknown'} 
                        className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          if (projectLink && page.name) {
                            window.open(`${projectLink}&page=${page.name}`, '_blank');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {page.name === 'home' && <Home className="w-4 h-4 text-primary" />}
                          {page.name === 'about' && <Info className="w-4 h-4 text-primary" />}
                          {page.name === 'services' && <Briefcase className="w-4 h-4 text-primary" />}
                          {page.name === 'contact' && <Phone className="w-4 h-4 text-primary" />}
                          <span>{page.title || page.name}</span>
                        </div>
                        {projectLink && (
                          <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                            <a href={`${projectLink}&page=${page.name}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" /> View
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Location Pages</h3>
                  <div className="space-y-2">
                    {locationsIndexPage && (
                      <div 
                        className="p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          if (projectLink && locationsIndexPage?.name) {
                            window.open(`${projectLink}&page=${locationsIndexPage.name}`, '_blank');
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4 text-primary" />
                          <span>All Locations</span>
                        </div>
                        {projectLink && (
                          <Button asChild size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                            <a href={`${projectLink}&page=${locationsIndexPage.name}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" /> View
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {locationPages.length > 0 ? (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">{locationPages.length} location pages available</p>
                        <Button asChild size="sm">
                          <Link to={`#locations`} onClick={() => setActiveTab("locations")}>
                            View All Locations
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 border border-dashed rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">No location pages available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedPages.length > 0 ? (
                  generatedPages.map((page) => (
                    <div 
                      key={page.name || 'unknown'} 
                      className="p-4 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (project.preview_url && page.name) {
                          window.open(`${project.preview_url}&page=${page.name}`, '_blank');
                        }
                      }}
                    >
                      <div>
                        <h3 className="font-medium">{page.title || page.name}</h3>
                        <p className="text-sm text-muted-foreground">/{safeUrl(page.url).replace(/^\//, '')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.preview_url && (
                          <Button asChild size="sm" onClick={(e) => e.stopPropagation()}>
                            <a href={`${project.preview_url}&page=${page.name}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" /> View Page
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <p className="text-muted-foreground">No pages have been generated yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Services
              </CardTitle>
              <CardDescription>
                View all services offered by your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.services && project.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.services.map((service, index) => (
                    <div key={service.id || index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.featured && (
                          <Badge variant="default">Featured</Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                      {service.price && (
                        <Badge variant="outline" className="mt-2">{service.price}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground">No services added to this website</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                View all business locations and their dedicated pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.locations && project.locations.length > 0 ? (
                <div className="space-y-4">
                  {project.locations.map((location) => {
                    const locationSlug = location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    const locationPage = locationPages.find(page => 
                      page && page.name === `location-${locationSlug}`
                    );
                    
                    return (
                      <div key={location.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4 bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <h3 className="font-medium">{location.name}</h3>
                            {location.isPrimary && (
                              <Badge>Primary</Badge>
                            )}
                          </div>
                          {locationPage && projectLink && (
                            <Button asChild size="sm">
                              <a href={`${projectLink}&page=${locationPage.name}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" /> View Page
                              </a>
                            </Button>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Services at this location:</h4>
                            <div className="flex flex-wrap gap-2">
                              {project.services?.map((service, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={location.services.includes(service.name) ? "default" : "outline"}
                                >
                                  {service.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <p>{[location.address, location.city, location.state, location.zipCode].filter(Boolean).join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground">No locations have been added to this website</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
