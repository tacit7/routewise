import { TopNav } from "@/features/marketing/top-nav";

type AppShellProps = {
  children: React.ReactNode;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showLogo?: boolean;
  showUserMenu?: boolean;
};

export function AppShell({ 
  children, 
  leftContent, 
  centerContent, 
  rightContent,
  showLogo = true,
  showUserMenu = true 
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}