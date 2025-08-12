import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGhost } from "@/components/ui/button-ghost";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth-context";

type TopNavProps = {
  authButtons?: "inline" | "menu";
  showLogo?: boolean;
};

export function TopNav({ authButtons = "menu", showLogo = true }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignIn = () => {
    setLocation('/auth');
    setMobileMenuOpen(false);
  };

  const handleSignUp = () => {
    setLocation('/auth?mode=signup');
    setMobileMenuOpen(false);
  };

  const handleDashboard = () => {
    setLocation('/dashboard');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          {showLogo && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setLocation('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <i className="fas fa-route text-white text-lg md:text-xl"></i>
                </div>
                <span className="text-xl md:text-2xl font-bold text-slate-900">RouteWise</span>
              </button>
            </div>
          )}

          {/* Desktop Auth Buttons */}
          {authButtons === "inline" && (
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <Button onClick={handleDashboard} variant="outline">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button onClick={handleSignIn} variant="ghost" className="text-slate-600 hover:text-slate-900">
                    Sign In
                  </Button>
                  <Button onClick={handleSignUp} className="bg-primary hover:bg-primary-hover text-white">
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          {authButtons === "menu" && (
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <ButtonGhost size="icon" className="text-slate-600 hover:text-slate-900">
                    <Menu className="h-6 w-6" />
                  </ButtonGhost>
                </SheetTrigger>
                
                <SheetContent side="right" className="w-64 bg-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <Button
                          onClick={handleDashboard}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          Dashboard
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleSignIn}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          <LogIn className="mr-3 h-5 w-5" />
                          Sign In
                        </Button>
                        <Button
                          onClick={handleSignUp}
                          className="justify-start w-full h-12 bg-primary hover:bg-primary-hover text-white"
                        >
                          <UserPlus className="mr-3 h-5 w-5" />
                          Sign Up
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Desktop Menu Button (when using menu mode) */}
          {authButtons === "menu" && (
            <div className="hidden md:flex items-center">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <ButtonGhost className="text-slate-600 hover:text-slate-900 px-4">
                    <Menu className="h-5 w-5 mr-2" />
                    Menu
                  </ButtonGhost>
                </SheetTrigger>
                
                <SheetContent side="right" className="w-64 bg-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <Button
                          onClick={handleDashboard}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          Dashboard
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleSignIn}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          <LogIn className="mr-3 h-5 w-5" />
                          Sign In
                        </Button>
                        <Button
                          onClick={handleSignUp}
                          className="justify-start w-full h-12 bg-primary hover:bg-primary-hover text-white"
                        >
                          <UserPlus className="mr-3 h-5 w-5" />
                          Sign Up
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}