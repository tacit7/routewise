import Header from "@/components/header";

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
      <Header 
        leftContent={leftContent}
        centerContent={centerContent}
        rightContent={rightContent}
        showLogo={showLogo}
        showUserMenu={showUserMenu}
      />
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}