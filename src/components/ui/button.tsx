import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-[linear-gradient(135deg,#0341a5_0%,#0568d6_100%)] text-white shadow-[0_4px_16px_rgba(3,65,165,0.35)] hover:shadow-[0_6px_20px_rgba(3,65,165,0.55)] hover:brightness-110 transition-[box-shadow,filter] disabled:opacity-40",
        "brand-outline": "border border-[rgba(3,65,165,0.30)] text-[#0341a5] bg-transparent hover:bg-[#0341a5] hover:text-white hover:shadow-[0_4px_16px_rgba(3,65,165,0.25)] transition-[background,color,box-shadow] disabled:opacity-40",
        "brand-ghost": "text-[#0341a5] bg-transparent hover:bg-[linear-gradient(135deg,#f0f5ff_0%,#e8f0fe_100%)] hover:shadow-[0_2px_8px_rgba(3,65,165,0.12)] transition-[background,box-shadow] disabled:opacity-40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
