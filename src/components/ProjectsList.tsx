import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Globe, Clock, CheckCircle, AlertCircle, ExternalLink, Trash2, Eye, Info } from "lucide-react";

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

interface ProjectsListProps {
  onProjectSelect?: (project: Project) => void;
  onCreateNew?: () => void;
}

export const ProjectsList = ({ onProjectSelect, onCreateNew }: ProjectsListProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('website_projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  // Get the internal preview URL for a project
  const getInternalPreviewUrl = (projectId: string) => {
    return `/preview?projectId=${projectId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete related records first
      await supabase.from('generation_progress').delete().eq('project_id', projectId);
      await supabase.from('website_page_drafts').delete().eq('project_id', projectId);
      await supabase.from('website_generated_data').delete().eq('project_id', projectId);
      await supabase.from('website_deployments').delete().eq('project_id', projectId);
      
      // Delete the project
      const { error } = await supabase.from('website_projects').delete().eq('id', projectId);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchProjects} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-6">Create your first website project to get started</p>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create Your First Website
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create New Project
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg mb-1">{project.business_name}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 px-2 py-1"
                    >
                      <Link to={`/projects/${project.id}`}>
                        <Info className="w-3 h-3 mr-1" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {project.business_type} • {project.location}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                      {getStatusText(project.status)}
                    </div>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {formatDate(project.created_at)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(getInternalPreviewUrl(project.id), '_blank');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  {project.deployment_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.deployment_url, '_blank');
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Site
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
