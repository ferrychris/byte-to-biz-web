import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, ExternalLink, Download, Copy, Check } from "lucide-react";

interface WebsitePreviewProps {
  websiteData?: {
    url: string;
    title: string;
    description: string;
  };
  isVisible: boolean;
}

type ViewportType = "desktop" | "tablet" | "mobile";

export const WebsitePreview = ({ websiteData, isVisible }: WebsitePreviewProps) => {
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const [isCopied, setIsCopied] = useState(false);

  const getViewportDimensions = () => {
    switch (viewport) {
      case "mobile":
        return { width: "375px", height: "667px" };
      case "tablet":
        return { width: "768px", height: "1024px" };
      default:
        return { width: "100%", height: "600px" };
    }
  };

  const handleCopyUrl = async () => {
    if (websiteData?.url) {
      await navigator.clipboard.writeText(websiteData.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Mock website content for demo
  const mockWebsiteContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acme Coffee Shop - Premium Coffee Experience</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .hero { background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; padding: 4rem 2rem; text-align: center; }
            .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
            .hero p { font-size: 1.2rem; opacity: 0.9; }
            .section { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .btn { background: #8B5CF6; color: white; padding: 1rem 2rem; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
            footer { background: #1F2937; color: white; padding: 2rem; text-align: center; }
            @media (max-width: 768px) { .hero h1 { font-size: 2rem; } .section { padding: 2rem 1rem; } }
        </style>
    </head>
    <body>
        <div class="hero">
            <h1>Welcome to Acme Coffee Shop</h1>
            <p>Premium coffee experience in the heart of New York</p>
        </div>
        
        <div class="section">
            <h2 style="text-align: center; margin-bottom: 3rem; font-size: 2.5rem;">Our Services</h2>
            <div class="grid">
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Artisan Coffee</h3>
                    <p>Hand-crafted beverages made from the finest beans sourced globally.</p>
                </div>
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Fresh Pastries</h3>
                    <p>Daily-baked goods that perfectly complement our coffee selection.</p>
                </div>
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Cozy Atmosphere</h3>
                    <p>Perfect space for work, meetings, or relaxing with friends.</p>
                </div>
            </div>
        </div>
        
        <div class="section" style="background: #F9FAFB;">
            <h2 style="text-align: center; margin-bottom: 2rem;">Visit Us Today</h2>
            <div style="text-align: center;">
                <p style="margin-bottom: 2rem;">123 Coffee Street, New York, NY 10001</p>
                <button class="btn">Get Directions</button>
            </div>
        </div>
        
        <footer>
            <p>&copy; 2024 Acme Coffee Shop. All rights reserved.</p>
        </footer>
    </body>
    </html>
  `;

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-card border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl gradient-text">Website Preview</CardTitle>
            {websiteData && (
              <p className="text-muted-foreground text-sm mt-1">{websiteData.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Live Preview
            </Badge>
          </div>
        </div>

        {/* Viewport Controls */}
        <div className="flex items-center gap-2 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg">
            <Button
              variant={viewport === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewport("desktop")}
              className="h-8 px-3"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={viewport === "tablet" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewport("tablet")}
              className="h-8 px-3"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={viewport === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewport("mobile")}
              className="h-8 px-3"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {websiteData?.url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-8 px-3 border-border/50"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? "Copied!" : "Copy URL"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(websiteData.url, "_blank")}
                  className="h-8 px-3 border-border/50"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 border-border/50"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative">
          {/* Preview Frame */}
          <div 
            className={`mx-auto bg-background border border-border/50 rounded-lg overflow-hidden shadow-card transition-smooth ${
              viewport === "mobile" ? "shadow-lg" : ""
            }`}
            style={{
              width: getViewportDimensions().width,
              height: getViewportDimensions().height,
              maxWidth: "100%",
            }}
          >
            <iframe
              srcDoc={mockWebsiteContent}
              className="w-full h-full border-0"
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* URL Bar (for desktop view) */}
          {viewport === "desktop" && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 bg-muted/80 backdrop-blur-sm px-4 py-1 rounded-t-lg border border-b-0 border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-destructive/60"></div>
                  <div className="w-2 h-2 rounded-full bg-warning/60"></div>
                  <div className="w-2 h-2 rounded-full bg-success/60"></div>
                </div>
                <span className="font-mono">
                  {websiteData?.url || "https://acme-coffee-shop.netlify.app"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Website Info */}
        {websiteData && (
          <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/50">
            <h3 className="font-medium text-foreground mb-2">Generated Website Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="text-foreground">{websiteData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL:</span>
                <span className="text-primary font-mono">{websiteData.url}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};