import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="text-center relative animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-1 mb-8 group">
          <span className="text-2xl font-bold text-foreground tracking-tight">
            Audit
          </span>
          <span className="text-2xl font-bold text-accent">Flow</span>
          <ArrowRight className="h-5 w-5 text-accent -ml-1 transition-transform group-hover:translate-x-1" />
        </div>

        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-accent">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
