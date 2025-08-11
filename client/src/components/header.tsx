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
      console.error('Sign out error:', error);
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
    <header className="bg-card text-card-foreground border-b border-border shadow-sm" role="banner">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left section - Logo and leftContent */}
        <div className="flex items-center gap-4">
          {showLogo && (
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-ring"
              aria-label="Go to home page"
            >
              <img 
                src="/logo.svg" 
                alt="RouteWise" 
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg text-primary hidden sm:inline">
                RouteWise
              </span>
            </button>
          )}
          
          {leftContent && (
            <div className="flex items-center gap-2">
              {leftContent}
            </div>
          )}
          
          {/* Center content when no explicit left content */}
          {!leftContent && centerContent && (
            <div className="flex-1 ml-4">
              {centerContent}
            </div>
          )}
        </div>

        {/* Center section (when there is left content) */}
        {leftContent && centerContent && (
          <div className="flex-1 px-4">
            <div className="flex justify-center">
              {centerContent}
            </div>
          </div>
        )}

        {/* Right section - rightContent and user menu */}
        <div className="flex items-center gap-3">
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
                      className="relative h-10 w-10 rounded-full p-0 hover:bg-muted focus-ring"
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
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56"
                    style={{ 
                      backgroundColor: 'var(--card)', 
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)'
                    }}
                  >
                    <DropdownMenuLabel 
                      className="font-normal"
                      style={{ color: 'var(--text)' }}
                    >
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator style={{ borderColor: 'var(--border)' }} />
                    <DropdownMenuItem 
                      onClick={() => setLocation('/profile')}
                      className="cursor-pointer focus-ring"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text)';
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation('/settings')}
                      className="cursor-pointer focus-ring"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text)';
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ borderColor: 'var(--border)' }} />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer focus-ring"
                      style={{ color: 'var(--destructive)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--destructive-50)';
                        e.currentTarget.style.color = 'var(--destructive)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--destructive)';
                      }}
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
