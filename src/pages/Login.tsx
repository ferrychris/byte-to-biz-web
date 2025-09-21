import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-2">Log in</h1>
        <p className="text-muted-foreground mb-6">Access your dashboard to manage projects.</p>
        <AuthForm onAuthSuccess={() => navigate("/dashboard")} />
      </div>
    </div>
  );
}
