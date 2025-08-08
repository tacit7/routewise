// mobile-sidebar.tsx
import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileSidebarProps = React.ComponentProps<"div"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  widthRem?: string; // e.g. "18rem"
};

export function MobileSidebar({
  open,
  onOpenChange,
  side = "left",
  widthRem = "18rem",
  className,
  children,
  ...props
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-sidebar="sidebar"
        data-mobile="true"
        side={side}
        className={cn("bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden", className)}
        style={{ "--sidebar-width": widthRem } as React.CSSProperties}
        {...props}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar</SheetTitle>
          <SheetDescription>Mobile sidebar</SheetDescription>
        </SheetHeader>
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
