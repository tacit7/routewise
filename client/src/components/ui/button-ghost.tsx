import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonGhostVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-white hover:bg-white/10",
        accent: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-12 min-h-[48px] px-4 py-2",
        sm: "h-10 min-h-[44px] rounded-md px-3",
        lg: "h-14 min-h-[56px] rounded-md px-8",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonGhostProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonGhostVariants> {
  asChild?: boolean;
}

const ButtonGhost = React.forwardRef<HTMLButtonElement, ButtonGhostProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonGhostVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonGhost.displayName = "ButtonGhost";

export { ButtonGhost, buttonGhostVariants };