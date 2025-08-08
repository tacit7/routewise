import * as React from "react";
import { cn } from "@/lib/utils";

type DesktopSidebarProps = React.ComponentProps<"div"> & {
  open: boolean;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  widthRem?: string; // "16rem"
  iconWidthRem?: string; // "3rem"
};

export function DesktopSidebar({
  open,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  widthRem = "16rem",
  iconWidthRem = "3rem",
  className,
  children,
  ...props
}: DesktopSidebarProps) {
  const state = open ? "expanded" : "collapsed";

  if (collapsible === "none") {
    return (
      <div
        className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}
        style={{ "--sidebar-width": widthRem } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      {/* gap spacer */}
      <div
        className={cn(
          "relative bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
        )}
        style={{ "--sidebar-width": widthRem, "--sidebar-width-icon": iconWidthRem } as React.CSSProperties}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        style={{ "--sidebar-width": widthRem, "--sidebar-width-icon": iconWidthRem } as React.CSSProperties}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-[--sidebar-width] flex-col bg-sidebar
                     group-data-[variant=floating]:rounded-lg
                     group-data-[variant=floating]:border
                     group-data-[variant=floating]:border-sidebar-border
                     group-data-[variant=floating]:shadow"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
