import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, LogIn, UserPlus, User, Settings, LogOut, Heart, Share, CheckCircle, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGhost } from "@/components/ui/button-ghost";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import UserMenu from "@/components/UserMenu";

type TopNavProps = {
  authButtons?: "inline" | "menu";
  showLogo?: boolean;
};

export function TopNav({ authButtons = "menu", showLogo = true }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tripName, setTripName] = useState("My Trip");

  const handleSignIn = () => {
    window.location.href = '/auth/google';
    setMobileMenuOpen(false);
  };

  const handleSignUp = () => {
    window.location.href = '/auth/google';
    setMobileMenuOpen(false);
  };

  const handleDashboard = () => {
    setLocation('/dashboard');
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setMobileMenuOpen(false);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left - Add more results button */}
            <div className="flex-1">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/route-results')}
                className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Add more results
              </Button>
            </div>
            
            {/* Center - Trip Name Input */}
            <div className="flex-1 flex justify-center">
              <Input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="My Trip"
                className="text-lg font-semibold text-center border-0 shadow-none bg-transparent max-w-xs focus-visible:ring-1 focus-visible:ring-slate-400"
              />
            </div>
            
            {/* Right - Action Buttons and Avatar */}
            <div className="flex-1 flex items-center justify-end space-x-2">
              {/* Action Icons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-green-50 hover:text-green-700">
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-green-50 hover:text-green-700">
                    <Share className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-green-50 hover:text-green-700">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Finalize</p>
                </TooltipContent>
              </Tooltip>
            
            {/* Auth Section - Desktop */}
            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex items-center space-x-3">
                  <Button onClick={handleSignIn} variant="ghost" className="text-slate-600 hover:text-slate-900">
                    Sign In
                  </Button>
                  <Button onClick={handleSignUp} className="bg-primary hover:bg-primary-hover text-white">
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>

            {/* Mobile Menu Button */}
            {authButtons === "menu" && (
              <div className="md:hidden ml-3">
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
                          <div className="flex items-center space-x-3 mb-2">
                            <Avatar className="h-10 w-10">
                              {user?.picture && (
                                <AvatarImage 
                                  src={user.picture} 
                                  alt={user.name || 'User avatar'} 
                                />
                              )}
                              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                                {user?.name ? getUserInitials(user.name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleDashboard}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          <User className="mr-3 h-5 w-5" />
                          Dashboard
                        </Button>
                        <Button
                          onClick={() => {
                            setLocation('/interests');
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          <Heart className="mr-3 h-5 w-5" />
                          Interests
                        </Button>
                        <Button
                          onClick={() => {
                            setLocation('/profile');
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start w-full h-12"
                        >
                          <User className="mr-3 h-5 w-5" />
                          Profile
                        </Button>
                        <Button
                          onClick={handleLogout}
                          variant="ghost"
                          className="justify-start w-full h-12 text-destructive hover:text-destructive"
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign Out
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
    </TooltipProvider>
  );
}