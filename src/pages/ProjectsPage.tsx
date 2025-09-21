import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/AuthForm";
import { ProjectsList } from "@/components/ProjectsList";
import { ArrowLeft, FolderOpen, Plus } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <AuthForm onAuthSuccess={() => navigate(0)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-2xl font-bold">Projects</h1>
          </div>
          <Button onClick={() => navigate("/dashboard")}> 
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>

        <div className="mb-4 text-muted-foreground flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span>Your website projects</span>
        </div>

        <ProjectsList
          onProjectSelect={(project) => navigate(`/projects/${project.id}`)}
          onCreateNew={() => navigate("/dashboard")}
        />
      </div>
    </div>
  );
}
