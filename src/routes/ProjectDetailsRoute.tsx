import { ProjectDetailsPage } from "@/components/ProjectDetailsPage";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const ProjectDetailsRoute = () => {
  return (
    <AuthGuard>
      <ErrorBoundary>
        <ProjectDetailsPage />
      </ErrorBoundary>
    </AuthGuard>
  );
};
