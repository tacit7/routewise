import { Menu, UserCircle, Settings, LogOut, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetOverlay, SheetPortal } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface User {
  full_name?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
}

interface MobileMenuProps { 
  className?: string;
}

const ROUTES = {
  DASHBOARD: "/dashboard",
  INTERESTS: "/interests",
  PROFILE: "/profile",
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES];

const getUserInitials = (user: User | null | undefined): string => {
  if (user?.full_name) return user.full_name.split(" ").map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2);
  if (user?.username) return user.username.charAt(0).toUpperCase();
  if (user?.email) return user.email.charAt(0).toUpperCase();
  return "U";
};

const getDisplayName = (user: User | null | undefined): string => 
  user?.full_name || user?.username || user?.email || "User";

export default function MobileMenu({ className }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  const userInitials = useMemo(() => getUserInitials(user), [user]);
  const displayName = useMemo(() => getDisplayName(user), [user]);

  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      if (!isMounted.current) return;
      setOpen(false);
      toast({ 
        title: "Logged out", 
        description: "You have been successfully logged out." 
      });
    } catch (error) {
      console.error("Logout failed:", error);
      if (!isMounted.current) return;
      toast({ 
        title: "Logout failed", 
        description: "There was an error logging out. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      if (isMounted.current) setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path: Route) => {
    setLocation(path);
    setOpen(false);
  };

  const NAV_ITEMS = [
    { label: "Dashboard", icon: Home, to: ROUTES.DASHBOARD },
    { label: "Interests", icon: Settings, to: ROUTES.INTERESTS },
  ] as const;

  const menuButton = "w-full justify-start h-14 text-base font-medium mx-2 rounded-xl";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) triggerRef.current?.focus();
      }}
    >
      <SheetTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          className={cn("md:hidden", className)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetPortal>
        {/* Custom overlay with background scrim */}
        <SheetOverlay className="bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-300 data-[state=open]:duration-300" />
        
        {/* Full page mobile-optimized menu content */}
        <SheetContent 
          side="right" 
          className="w-full sm:w-96 bg-white/95 backdrop-blur-md border-none shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-300 data-[state=open]:duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)', // Safari support
          }}
        >
        <SheetHeader className="pb-6">
          <SheetTitle className="text-left text-foreground font-semibold">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full py-2">
          {/* Enhanced User Profile Section for mobile */}
          <section aria-labelledby="menu-profile" className="flex items-center gap-4 p-6 rounded-lg bg-white/60 backdrop-blur-sm mb-8 mx-2 shadow-sm">
            <h2 id="menu-profile" className="sr-only">User profile</h2>
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.avatar ?? undefined} alt="" aria-hidden="true" />
              <AvatarFallback className="text-base bg-green-100 text-green-700">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-semibold text-base text-gray-900">{displayName}</p>
              {user.email && <p className="text-sm text-gray-600 mt-1">{user.email}</p>}
            </div>
          </section>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-3 px-2">
            {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
              <Button
                key={to}
                variant="ghost"
                className={cn(menuButton, location === to && "bg-green-50 text-green-700 hover:bg-green-100")}
                aria-current={location === to ? "page" : undefined}
                onClick={() => handleNavigation(to)}
              >
                <Icon className="mr-4 h-6 w-6" />
                {label}
              </Button>
            ))}

            <Separator className="my-8 mx-4" />

            {/* User Actions */}
            <Button
              variant="ghost"
              className={menuButton}
              onClick={() => console.log('TODO(profile): implement profile navigation')}
            >
              <UserCircle className="mr-4 h-6 w-6" />
              Profile
            </Button>

            <Button
              variant="ghost"
              className={cn(menuButton, "text-red-600 hover:text-red-700 hover:bg-red-50")}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span
                    role="status"
                    aria-live="polite"
                    className="mr-4 inline-flex h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-4 h-6 w-6" />
                  Log out
                </>
              )}
            </Button>
          </nav>
        </div>
        </SheetContent>
      </SheetPortal>
    </Sheet>
  );
}