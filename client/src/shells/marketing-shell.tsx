import { TopNav } from "@/features/marketing/top-nav";
import Footer from "@/components/footer";

type MarketingShellProps = {
  children: React.ReactNode;
  navAuthButtons?: "inline" | "menu";
  showLogo?: boolean;
};

export function MarketingShell({ 
  children, 
  navAuthButtons = "menu", 
  showLogo = true 
}: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <TopNav authButtons={navAuthButtons} showLogo={showLogo} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}