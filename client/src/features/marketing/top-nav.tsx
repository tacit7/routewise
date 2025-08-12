import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, LogIn, UserPlus, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGhost } from "@/components/ui/button-ghost";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-context";

type TopNavProps = {
  authButtons?: "inline" | "menu";
  showLogo?: boolean;
};

export function TopNav({ authButtons = "menu", showLogo = true }: TopNavProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Auth Buttons - Always show on desktop for better UX */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100"
                    aria-label={`User menu for ${user?.name || 'User'}`}
                  >
                    <Avatar className="h-9 w-9">
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg border bg-white">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDashboard}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

        </div>
      </div>
    </nav>
  );
}