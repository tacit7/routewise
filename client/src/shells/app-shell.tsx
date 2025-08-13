import { TopNav } from "@/features/marketing/top-nav";

type AppShellProps = {
  children: React.ReactNode;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showLogo?: boolean;
  showUserMenu?: boolean;
  authButtons?: "inline" | "menu";
};

export function AppShell({ 
  children, 
  leftContent, 
  centerContent, 
  rightContent,
  showLogo = true,
  showUserMenu = true,
  authButtons = "menu"
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav authButtons={authButtons} showLogo={showLogo} />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}