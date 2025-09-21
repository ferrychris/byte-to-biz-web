import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Zap, Globe, Rocket, ArrowRight, CheckCircle, LogOut, FolderOpen,
  Plus, Hammer, Moon, Sun, BarChart3, Clock, Activity, RefreshCcw, Settings, Menu, X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { GenerationProgress } from "@/components/GenerationProgress";
import { WebsitePreview } from "@/components/WebsitePreview";
import { AuthForm } from "@/components/AuthForm";
import { ProjectsList } from "@/components/ProjectsList";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Project {
  id: string;
  business_name: string;
  business_type: string;
  description: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  deployment_url?: string;
}

type AppState = "auth" | "dashboard" | "form" | "generating" | "preview" | "projects";

const Index = () => {
  const { user, loading: authLoading, signOut, isLocalMode } = useAuth();
  const [currentState, setCurrentState] = useState<AppState>(authLoading ? "auth" : user ? "dashboard" : "auth");
  const { theme, setTheme } = useTheme();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [generatedWebsite, setGeneratedWebsite] = useState({
    url: "https://acme-coffee-shop.netlify.app",
    title: "Acme Coffee Shop - Premium Coffee Experience",
    description: "Professional website generated with AI"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");
  
  // Define fetchProjects with useCallback
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all projects for the user
      const { data: projects, error } = await supabase
        .from('website_projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Set recent projects (limit to 5)
      setRecentProjects(projects?.slice(0, 5) || []);

      // Calculate stats
      if (projects) {
        const total = projects.length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const inProgress = projects.filter(p => p.status === 'in_progress').length;
        const failed = projects.filter(p => p.status === 'failed').length;

        setProjectStats({
          total,
          completed,
          inProgress,
          failed
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Fetch projects and stats when component mounts
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const handleGetStarted = () => {
    setCurrentState("form");
  };

  const handleFormSubmit = async (data: BusinessInfo) => {
    setBusinessInfo(data);
    setCurrentState("generating");
    setIsGenerating(true);
    
    try {
      // Update project status to in_progress
      const { error: updateError } = await supabase
        .from('website_projects')
        .update({ status: 'in_progress' })
        .eq('id', data.projectId);
      
      if (updateError) {
        console.error('Error updating project status:', updateError);
      }

      // Call the generate-website edge function
      const { data: response, error } = await supabase.functions.invoke('generate-website', {
        body: {
          projectId: data.projectId,
          businessName: data.businessName,
          businessType: data.businessType,
          description: data.description,
          targetAudience: data.targetAudience,
          location: data.location,
          websiteTemplate: data.websiteTemplate,
          colorScheme: data.colorScheme,
          typography: data.typography
        }
      });

      if (error) {
        console.error('Error generating website:', error);
        // Update project status to failed
        await supabase
          .from('website_projects')
          .update({ status: 'failed' })
          .eq('id', data.projectId);
        setIsGenerating(false);
        setCurrentState("error");
        return;
      }

      console.log('Website generation response:', response);
      
      // Check if we have a preview URL
      if (response?.previewUrl) {
        setGeneratedWebsite({
          url: response.previewUrl,
          title: `${data.businessName} - Generated Website`,
          description: `Professional website for ${data.businessName}, a ${data.businessType} business`
        });
        setCurrentState("completed");
      } else {
        setCurrentState("error");
      }
    } catch (error) {
      console.error('Error generating website:', error);
      alert('Failed to generate website. Please try again.');
      setCurrentState("form");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerationComplete = () => {
    setCurrentState("preview");
  };

  const handleStartOver = () => {
    setCurrentState("dashboard");
    setBusinessInfo(null);
  };

  const handleAuthSuccess = () => {
    setCurrentState("dashboard");
  };

  const handleViewProjects = () => {
    setCurrentState("projects");
  };

  const handleProjectSelect = (project: Project) => {
    // Handle project selection - could show project details or regenerate
    console.log('Selected project:', project);
    // For now, let's go to the form with the project data
    setBusinessInfo({
      businessName: project.business_name,
      businessType: project.business_type,
      description: project.description,
      location: project.location,
      contactEmail: '', // We don't store this in the project
      projectId: project.id
    });
    setCurrentState("form");
  };

  const handleCreateNewProject = () => {
    setCurrentState("form");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth form if user is not authenticated
  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

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
              onClick={() => setCurrentState("dashboard")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <BusinessInfoForm
            onSubmit={handleFormSubmit}
            isLoading={isGenerating}
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
            isGenerating={isGenerating}
            onComplete={handleGenerationComplete}
            projectId={businessInfo?.projectId}
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
              <Button
                onClick={handleViewProjects}
                variant="outline"
                className="border-border/50"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                View All Projects
              </Button>
            </div>
          </div>
          {/* Direct preview link for testing */}
          <div className="text-center mb-6">
            <a
              href="http://localhost:8080/preview?projectId=11227a52-16d2-4b42-a4fa-04586e72c749"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open local preview: http://localhost:8080/preview?projectId=11227a52-16d2-4b42-a4fa-04586e72c749
            </a>
          </div>
          
          <WebsitePreview
            websiteData={generatedWebsite}
            isVisible={true}
          />
        </div>
      </div>
    );
  }

  if (currentState === "projects") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Button
              onClick={() => setCurrentState("dashboard")}
              variant="ghost"
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <ProjectsList
            onProjectSelect={handleProjectSelect}
            onCreateNew={handleCreateNewProject}
          />
        </div>
      </div>
    );
  }


  // Sidebar items and layout handled by Sidebar component

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="p-2 rounded-lg bg-gradient-primary glow-primary">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Siteforge</span>
            </div>
            <div className="flex items-center gap-4">
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
              <span className="text-sm text-muted-foreground hidden md:inline">
                Welcome, {user?.email}
              </span>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar Component */}
        <Sidebar 
          isOpen={sidebarOpen} 
          activeItem={activeSidebarItem} 
          onItemClick={setActiveSidebarItem} 
        />

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} transition-all duration-300 ease-in-out`}>
          <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
          Welcome, {user?.email}
            <p className="text-muted-foreground">Manage your website projects</p>
          </div>
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground glow-primary transition-smooth"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Website
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-primary mr-2" />
                <div className="text-2xl font-bold">{projectStats.total}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-success mr-2" />
                <div className="text-2xl font-bold">{projectStats.completed}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-amber-500 mr-2" />
                <div className="text-2xl font-bold">{projectStats.inProgress}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-destructive mr-2" />
                <div className="text-2xl font-bold">{projectStats.failed}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Recent Projects and Quick Actions */}
        <Tabs defaultValue="recent" className="mb-8">
          <TabsList>
            <TabsTrigger value="recent">Recent Projects</TabsTrigger>
            <TabsTrigger value="quick">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your recently created website projects</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : recentProjects.length > 0 ? (
                  <div className="space-y-4">
                    {recentProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <div>
                          <h3 className="font-medium">{project.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{project.business_type} • {new Date(project.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs ${project.status === 'completed' ? 'bg-success/20 text-success' : project.status === 'in_progress' ? 'bg-amber-500/20 text-amber-500' : project.status === 'failed' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                            {project.status === 'in_progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/projects/${project.id}`}>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first website project to get started</p>
                    <Button onClick={handleGetStarted}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                )}
              </CardContent>
              {recentProjects.length > 0 && (
                <CardFooter className="border-t bg-muted/50 flex justify-between">
                  <Button variant="ghost" size="sm" onClick={handleViewProjects}>
                    View All Projects
                  </Button>
                  <Button variant="ghost" size="sm" onClick={fetchProjects}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="quick" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentProjects.slice(0, 3).map((project, index) => (
                    <div key={index} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          {project.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : project.status === 'in_progress' ? (
                            <Activity className="h-5 w-5 text-primary" />
                          ) : (
                            <Clock className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="h-full w-px bg-border"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {project.status === 'completed'
                            ? 'Website completed'
                            : project.status === 'in_progress'
                            ? 'Website generation in progress'
                            : 'Website creation started'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.business_name} - {project.business_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {recentProjects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity to display
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Activity moved into Activity tab above */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;