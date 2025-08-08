import * as React from "react";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from "./sidebar-context";

type Props = React.ComponentProps<"div"> & {
  open: boolean;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

export const DesktopSidebar: React.FC<Props> = ({
  open,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  children,
  className,
}) => {
  const state = open ? "expanded" : "collapsed";

  if (collapsible === "none") {
    return (
      <div
        className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground", className)}
        style={{ "--sidebar-width": SIDEBAR_WIDTH } as React.CSSProperties}
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
      <div
        className={cn()}
        style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON } as React.CSSProperties}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:-left-[var(--sidebar-width)]"
            : "right-0 group-data-[collapsible=offcanvas]:-right-[var(--sidebar-width)]",
          className
        )}
      >
        <div className="flex h-full w-full flex-col bg-sidebar">{children}</div>
      </div>
    </div>
  );
};
