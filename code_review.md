# Code Review – `MobileMenu`

*Reviewer stance: ultra-picky senior React dev. Focused on correctness, a11y, DX, and maintainability.*

---

## TL;DR (Top Fixes First)

1. **Type your **`` (ditch `any`).
2. **Replace inline CSS vars** with Tailwind tokens.
3. **Add a11y affordances**: `aria-current`, focus return to trigger, proper loading status.
4. **Reduce repetition** (extract shared Tailwind classes / nav items).
5. **Unmount-safe async** in `handleLogout`.
6. **Remove unused import** (`MapPin`).

---

## React Best Practices

### ✅ What’s good

- Utility fns (`getUserInitials`, `getDisplayName`) are outside the component → no per-render re-creations.
- Local state is minimal and purposeful (`open`, `isLoggingOut`).
- Side-effects (logout + toast) are handled cleanly in one place.

### ⚠️ Improvements

**1) Strong typing for **``

- Current: `any` → loses editor safety and invites runtime bugs.
- Suggested:

```ts
interface User {
  full_name?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
}
```

If `useAuth` is generic-capable:

```ts
const { user, logout } = useAuth<User>();
```

**2) Derive and use current path**

- You’re discarding the current location by doing `const [, setLocation] = useLocation()`.
- Keep it for active states and a11y:

```ts
const [location, setLocation] = useLocation();
```

**3) Unmount-safe **``

- Prevent state updates on unmounted component during slow network:

```ts
const isMounted = useRef(true);
useEffect(() => () => { isMounted.current = false; }, []);

const handleLogout = async () => {
  if (isLoggingOut) return;
  setIsLoggingOut(true);
  try {
    await logout();
    if (!isMounted.current) return;
    setOpen(false);
    toast({ title: "Logged out", description: "You have been successfully logged out." });
  } catch (error) {
    console.error('Logout failed:', error);
    if (!isMounted.current) return;
    toast({
      title: "Logout failed",
      description: "There was an error logging out. Please try again.",
      variant: "destructive",
    });
  } finally {
    if (isMounted.current) setIsLoggingOut(false);
  }
};
```

**4) Avoid inline anonymous callbacks** for repetitive nav items (minor perf/readability): extract a `NavItem` or a data-driven list.

---

## Tailwind CSS

### ✅ What’s good

- Consistent sizing (`h-5 w-5`) and spacing (`gap-3`, `space-y-2`).
- Mobile-only trigger via `md:hidden` is appropriate.

### ⚠️ Improvements

**1) Replace inline style props**

- Current:

```jsx
<SheetContent side="right" className="w-80 sm:w-96" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
```

- Better (uses design tokens and theming):

```jsx
<SheetContent side="right" className="w-80 sm:w-96 bg-background border-border">
```

**2) DRY up repeated classes**

```ts
const menuButton = "w-full justify-start h-12 text-base";
```

Use `className={cn(menuButton, "text-destructive hover:text-destructive hover:bg-destructive/10")}` for the logout variant.

**3) Semantic containers**

- Profile block is a `div`; consider `<section aria-labelledby="menu-profile">` with a visually hidden heading for SR users (optional but nice).

---

## Accessibility (a11y)

**1) Active state & SR support**

- Add `aria-current="page"` on the active nav button to inform screen readers, and a visual style if possible.

```tsx
<Button
  variant="ghost"
  className={cn(menuButton, location === ROUTES.DASHBOARD && "bg-muted")}
  aria-current={location === ROUTES.DASHBOARD ? 'page' : undefined}
  onClick={() => handleNavigation(ROUTES.DASHBOARD)}
>
  <Home className="mr-3 h-5 w-5" />
  Dashboard
</Button>
```

**2) Focus management**

- After closing the sheet, return focus to the trigger for keyboard users.

```ts
const triggerRef = useRef<HTMLButtonElement>(null);
// In SheetTrigger: <Button ref={triggerRef} ...>
// In onOpenChange:
onOpenChange={(next) => {
  setOpen(next);
  if (!next) triggerRef.current?.focus();
}}
```

**3) Loading feedback**

- Spinner should announce loading state.

```jsx
<span
  role="status"
  aria-live="polite"
  className="mr-3 inline-flex h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
/>
```

**4) Avatar ALT**

- `alt={displayName}` is okay, but avatars are often decorative when the name is adjacent. Consider `alt=""` + `aria-hidden` on the image, *or* keep as-is but don’t duplicate info for SRs.

---

## Code Design & Readability

- Remove **unused import**: `MapPin`.
- Replace `// TODO` with `// TODO(profile): implement profile navigation` so it’s grep-friendly.
- Prefer a **data-driven nav** array to avoid copy/paste errors and ease reordering.

Example:

```ts
const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, to: ROUTES.DASHBOARD },
  { label: 'Interests', icon: Settings, to: ROUTES.INTERESTS },
];
```

---

## General Engineering

**Error Handling**

- Logging to `console.error` is fine during dev; consider integrating with an error reporter (Sentry, etc.).

**Testing**

- With the data-driven nav + extracted `NavItem` component, you can render and test each item independently.
- Mock `useAuth`, `useLocation`, `useToast` in tests; or accept optional props for DI to make unit tests easier.

---

## Refactored Example (Ready-to-Drop-In)

```tsx
import { Menu, UserCircle, Settings, LogOut, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

interface MobileMenuProps { className?: string }

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

const getDisplayName = (user: User | null | undefined): string => user?.full_name || user?.username || user?.email || "User";

export default function MobileMenu({ className }: MobileMenuProps) {
  const { user, logout } = useAuth<User>();
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
      toast({ title: "Logged out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("Logout failed:", error);
      if (!isMounted.current) return;
      toast({ title: "Logout failed", description: "There was an error logging out. Please try again.", variant: "destructive" });
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

  const menuButton = "w-full justify-start h-12 text-base";

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

      <SheetContent side="right" className="w-80 sm:w-96 bg-background border-border">
        <SheetHeader>
          <SheetTitle className="text-left text-foreground">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full py-6">
          {/* User Profile Section */}
          <section aria-labelledby="menu-profile" className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 mb-6">
            <h2 id="menu-profile" className="sr-only">User profile</h2>
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar ?? undefined} alt="" aria-hidden="true" />
              <AvatarFallback className="text-sm bg-primary/10">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-medium text-sm text-foreground">{displayName}</p>
              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </section>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
              <Button
                key={to}
                variant="ghost"
                className={cn(menuButton, location === to && "bg-muted")}
                aria-current={location === to ? "page" : undefined}
                onClick={() => handleNavigation(to)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </Button>
            ))}

            <Separator className="my-4" />

            {/* User Actions */}
            <Button
              variant="ghost"
              className={menuButton}
              onClick={() => handleNavigation(ROUTES.PROFILE)}
            >
              <UserCircle className="mr-3 h-5 w-5" />
              Profile
            </Button>

            <Button
              variant="ghost"
              className={cn(menuButton, "text-destructive hover:text-destructive hover:bg-destructive/10")}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span
                    role="status"
                    aria-live="polite"
                    className="mr-3 inline-flex h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-3 h-5 w-5" />
                  Log out
                </>
              )}
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Optional Nice-to-Haves

- Add keyboard shortcuts (e.g., `Esc` to close sheet is usually built-in, but confirm).
- Transition reduce: respect `prefers-reduced-motion` for animations/spinners if you add more motion.
- Analytics: track nav clicks (but keep it accessible and performant).

---

## Final Notes

- The refactor stays aligned with shadcn/ui conventions, leans on Tailwind tokens for themeability, and improves a11y without changing the UX.
- If you later split this into a desktop + mobile menu, keep the data-driven `NAV_ITEMS` so both share the same source of truth.

