import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH_MOBILE } from "./sidebar-context";

type Props = React.ComponentProps<"div"> & {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  side?: "left" | "right";
};

export const MobileSidebar: React.FC<Props> = ({ open, onOpenChange, side = "left", children, className }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-sidebar="sidebar"
        data-mobile="true"
        side={side}
        className={cn("bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden", className)}
        style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
          <SheetDescription>Displays the mobile sidebar</SheetDescription>
        </SheetHeader>
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
};
