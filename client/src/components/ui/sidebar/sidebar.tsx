import * as React from "react";
import { useSidebar } from "./sidebar-context";
import { MobileSidebar } from "./mobile-sidebar";
import { DesktopSidebar } from "./desktop-sidebar";
import * as Primitives from "./sidebar-primitives";

type Props = React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

export const Sidebar = React.forwardRef<HTMLDivElement, Props>(
  ({ side = "left", variant = "sidebar", collapsible = "offcanvas", children, ...props }, ref) => {
    const { isMobile, openMobile, setOpenMobile, open } = useSidebar();
    return isMobile ? (
      <MobileSidebar open={openMobile} onOpenChange={setOpenMobile} side={side} {...props}>
        {children}
      </MobileSidebar>
    ) : (
      <DesktopSidebar open={open} side={side} variant={variant} collapsible={collapsible} {...props}>
        {children}
      </DesktopSidebar>
    );
  }
);
Sidebar.displayName = "Sidebar";

// Re-export everything so imports don't break
export * from "./sidebar-context";
export * from "./sidebar-primitives";
