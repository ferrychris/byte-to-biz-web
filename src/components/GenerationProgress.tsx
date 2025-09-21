import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2, Sparkles, Code, Palette, Globe, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GenerationStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "active" | "completed" | "error";
  progress: number;
}

interface GenerationProgressProps {
  isGenerating: boolean;
  onComplete?: () => void;
  projectId?: string;
}

const initialStages: GenerationStage[] = [
  {
    id: "planning",
    title: "Planning Structure",
    description: "Analyzing your business and planning website architecture",
    icon: Sparkles,
    status: "pending",
    progress: 0,
  },
  {
    id: "content",
    title: "Generating Content",
    description: "Creating professional copy and selecting relevant images",
    icon: Code,
    status: "pending",
    progress: 0,
  },
  {
    id: "design",
    title: "Designing Interface",
    description: "Building beautiful layouts and responsive design",
    icon: Palette,
    status: "pending",
    progress: 0,
  },
  {
    id: "optimization",
    title: "Optimizing Performance",
    description: "Enhancing SEO, accessibility, and loading speed",
    icon: Globe,
    status: "pending",
    progress: 0,
  },
  {
    id: "deployment",
    title: "Preparing Deployment",
    description: "Finalizing your website and preparing for launch",
    icon: Rocket,
    status: "pending",
    progress: 0,
  },
];

export const GenerationProgress = ({ isGenerating, onComplete, projectId }: GenerationProgressProps) => {
  const [stages, setStages] = useState<GenerationStage[]>(initialStages);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Real-time progress tracking
  useEffect(() => {
    if (!isGenerating || !projectId) return;

    const pollProgress = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-progress', {
          body: { projectId }
        });

        if (data?.progress) {
          const { stage, progress_percentage } = data.progress;
          setOverallProgress(progress_percentage);

          // Update stages based on current stage
          const stageMap: { [key: string]: number } = {
            'planning': 0,
            'content_generation': 1,
            'code_generation': 2,
            'finalization': 3,
            'completed': 4
          };

          const currentIndex = stageMap[stage] || 0;
          setCurrentStageIndex(currentIndex);

          setStages(prev => prev.map((stageItem, index) => {
            if (index < currentIndex) {
              return { ...stageItem, status: "completed" as const, progress: 100 };
            } else if (index === currentIndex) {
              return { 
                ...stageItem, 
                status: stage === 'completed' ? "completed" as const : "active" as const, 
                progress: progress_percentage 
              };
            } else {
              return { ...stageItem, status: "pending" as const, progress: 0 };
            }
          }));

          // Check if completed
          if (stage === 'completed' || progress_percentage === 100) {
            setTimeout(() => onComplete?.(), 1000);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Initial poll
    pollProgress();

    // Poll every 2 seconds
    const interval = setInterval(pollProgress, 2000);

    return () => clearInterval(interval);
  }, [isGenerating, projectId, onComplete]);

  // Simulate generation progress (fallback if no projectId)
  useEffect(() => {
    if (!isGenerating || projectId) return;

    const simulateProgress = () => {
      const totalStages = stages.length;
      const stageTime = 8000; // 8 seconds per stage
      const updateInterval = 100; // Update every 100ms

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += updateInterval;
        
        const currentStage = Math.floor(elapsed / stageTime);
        const stageProgress = ((elapsed % stageTime) / stageTime) * 100;
        const totalProgress = (currentStage * 100 + stageProgress) / totalStages;

        setCurrentStageIndex(currentStage);
        setOverallProgress(Math.min(totalProgress, 100));

        setStages(prev => prev.map((stage, index) => {
          if (index < currentStage) {
            return { ...stage, status: "completed" as const, progress: 100 };
          } else if (index === currentStage && currentStage < totalStages) {
            return { ...stage, status: "active" as const, progress: stageProgress };
          } else {
            return { ...stage, status: "pending" as const, progress: 0 };
          }
        }));

        // Complete all stages
        if (currentStage >= totalStages) {
          clearInterval(interval);
          setStages(prev => prev.map(stage => ({ ...stage, status: "completed" as const, progress: 100 })));
          setOverallProgress(100);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        }
      }, updateInterval);

      return () => clearInterval(interval);
    };

    return simulateProgress();
  }, [isGenerating, onComplete, projectId]);

  const getStageIcon = (stage: GenerationStage) => {
    const IconComponent = stage.icon;
    
    if (stage.status === "completed") {
      return <CheckCircle className="w-5 h-5 text-success" />;
    } else if (stage.status === "active") {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    } else {
      return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: GenerationStage["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case "active":
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  if (!isGenerating && overallProgress === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-card border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl gradient-text">Generating Your Website</CardTitle>
          <div className="text-sm text-muted-foreground">
            {Math.round(overallProgress)}% Complete
          </div>
        </div>
        <Progress 
          value={overallProgress} 
          className="h-2 bg-muted/50"
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`flex items-start gap-4 p-4 rounded-lg transition-smooth ${
              stage.status === "active" 
                ? "bg-primary/5 border border-primary/20" 
                : stage.status === "completed"
                ? "bg-success/5 border border-success/20"
                : "bg-muted/20 border border-transparent"
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {getStageIcon(stage)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`font-medium ${
                  stage.status === "active" ? "text-primary" : 
                  stage.status === "completed" ? "text-success" : 
                  "text-foreground"
                }`}>
                  {stage.title}
                </h3>
                {getStatusBadge(stage.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {stage.description}
              </p>
              
              {stage.status === "active" && (
                <div className="space-y-1">
                  <Progress 
                    value={stage.progress} 
                    className="h-1 bg-muted/50"
                  />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(stage.progress)}% complete
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {overallProgress === 100 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success border border-success/20 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Website generation completed successfully!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};