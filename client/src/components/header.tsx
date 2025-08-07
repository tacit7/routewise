import React, { useState } from "react";
import { Route, User, LogOut, Settings, Menu, X, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-context";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { useLocation } from "wouter";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const openAuthDialog = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo - Clickable */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setLocation(isAuthenticated ? '/dashboard' : '/');
              }}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              title={`Go to ${isAuthenticated ? 'dashboard' : 'home'}`}
            >
              <img
                src="/logo.svg"
                alt="RouteWise logo"
                className="w-12 h-12"
                title="RouteWise"
              />
              <h1 className="text-2xl font-bold text-slate-800">RouteWise</h1>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {isAuthenticated && (
                <button
                  onClick={() => setLocation("/interests")}
                  className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Compass className="h-4 w-4" />
                  Discover
                </button>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="text-slate-600 hover:text-primary transition-colors"
                >
                  My Trips
                </button>
              )}
              <a
                href="#"
                className="text-slate-600 hover:text-primary transition-colors"
              >
                Help
              </a>

              {/* Authentication Section */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user?.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => openAuthDialog("login")}
                    className="text-slate-600 hover:text-primary"
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => openAuthDialog("register")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 py-4">
              <nav className="flex flex-col space-y-3">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setLocation("/interests");
                      setMobileMenuOpen(false);
                    }}
                    className="text-slate-600 hover:text-primary transition-colors px-2 py-2 text-left flex items-center gap-2"
                  >
                    <Compass className="h-4 w-4" />
                    Discover
                  </button>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setLocation("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className="text-slate-600 hover:text-primary transition-colors px-2 py-2 text-left"
                  >
                    My Trips
                  </button>
                )}
                <a
                  href="#"
                  className="text-slate-600 hover:text-primary transition-colors px-2 py-2"
                >
                  Help
                </a>

                {/* Mobile Authentication */}
                {isAuthenticated ? (
                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <div className="px-2 py-2 text-sm text-slate-700 font-medium">
                      Signed in as {user?.username}
                    </div>
                    <button className="text-slate-600 hover:text-primary transition-colors px-2 py-2 w-full text-left">
                      Profile
                    </button>
                    <button className="text-slate-600 hover:text-primary transition-colors px-2 py-2 w-full text-left">
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-slate-600 hover:text-primary transition-colors px-2 py-2 w-full text-left"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => openAuthDialog("login")}
                      className="w-full justify-start text-slate-600 hover:text-primary"
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={() => openAuthDialog("register")}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Sign up
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Authentication Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </DialogTitle>
          </DialogHeader>

          {authMode === "login" ? (
            <LoginForm
              onSwitchToRegister={() => setAuthMode("register")}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setAuthMode("login")}
              onSuccess={handleAuthSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
