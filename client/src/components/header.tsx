import React from "react";
import { useLocation } from "wouter";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface HeaderProps {
  leftContent?: React.ReactNode; // Back button, etc.
  centerContent?: React.ReactNode; // Title, trip info, etc.
  rightContent?: React.ReactNode; // Actions, save button, etc.
  showLogo?: boolean; // Whether to show logo in left section
  showUserMenu?: boolean; // Whether to show user menu in right section
}

export default function Header({ 
  leftContent, 
  centerContent, 
  rightContent, 
  showLogo = true, 
  showUserMenu = true 
}: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      const devLog = (...args: any[]) => import.meta.env.DEV && console.log(...args);
      devLog('Sign out error:', error);
    }
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
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-white" role="banner">
      <div className="container flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left section - Logo and leftContent */}
        <div className="flex items-center gap-4">
          {showLogo && (
            <button
              onClick={() => setLocation('/')}
              className="hover:opacity-80 transition-opacity focus-ring text-white"
              aria-label="Go to home page"
            >
              <span className="font-semibold text-lg text-white">
                RouteWise
              </span>
            </button>
          )}
          
          {leftContent && (
            <div className="flex items-center gap-2">
              {leftContent}
            </div>
          )}
        </div>

        {/* Center section */}
        {centerContent && (
          <div className="flex justify-center px-2 min-w-0">
            {centerContent}
          </div>
        )}

        {/* Right section - rightContent and user menu */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {rightContent && (
            <div className="flex items-center gap-3">
              {rightContent}
            </div>
          )}
          
          {showUserMenu && (
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0 hover:bg-white/10 focus-ring text-white"
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
                  <DropdownMenuContent align="end" className="w-56 shadow-lg border-2 bg-white border-border">
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
                      onClick={() => setLocation('/profile')}
                      className="cursor-pointer focus:bg-[var(--primary-hover)] focus:text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation('/settings')}
                      className="cursor-pointer focus:bg-[var(--primary-hover)] focus:text-white"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:bg-[var(--primary-hover)] focus:text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setLocation('/auth')}
                  variant="default"
                  size="sm"
                  className="focus-ring"
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
