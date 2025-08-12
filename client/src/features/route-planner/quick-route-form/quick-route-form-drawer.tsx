import { useState } from "react";
import { QuickRouteForm } from "./quick-route-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MapPin, ArrowRight } from "lucide-react";

type QuickRouteFormDrawerProps = React.ComponentProps<typeof QuickRouteForm> & {
  triggerText?: string;
  triggerVariant?: "default" | "secondary" | "outline";
};

export function QuickRouteFormDrawer({ 
  triggerText = "Start Planning Your Route",
  triggerVariant = "default",
  onSubmit,
  ...props 
}: QuickRouteFormDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFormSubmit = (startCity: string, endCity: string) => {
    setIsOpen(false);
    if (onSubmit) {
      onSubmit(startCity, endCity);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant={triggerVariant}
          size="lg"
          className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary-hover text-white border-0"
        >
          <MapPin className="mr-2 h-5 w-5" />
          {triggerText}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="bg-white rounded-t-xl border-t-2 border-primary-100">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="text-xl font-bold text-slate-900">Plan Your Route</SheetTitle>
          <p className="text-muted-foreground">Where would you like to go?</p>
        </SheetHeader>
        
        <div className="pb-6">
          <QuickRouteForm 
            density="comfortable" 
            showHeader={false}
            onSubmit={handleFormSubmit}
            {...props} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}