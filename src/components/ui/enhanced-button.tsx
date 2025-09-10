import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        mafia: "bg-gradient-to-r from-mafia-gold to-mafia-blood text-background hover:from-mafia-gold/90 hover:to-mafia-blood/90 shadow-lg",
        danger: "bg-gradient-to-r from-mafia-blood to-red-600 text-white hover:from-mafia-blood/90 hover:to-red-600/90 shadow-lg",
        success: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-600/90 hover:to-emerald-600/90 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  pulse?: boolean;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    success = false,
    error = false,
    pulse = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    const buttonProps = asChild ? {} : {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      animate: {
        ...(pulse && { scale: [1, 1.05, 1] }),
        ...(success && { backgroundColor: ["hsl(var(--primary))", "hsl(142, 76%, 36%)", "hsl(var(--primary))"] }),
        ...(error && { backgroundColor: ["hsl(var(--primary))", "hsl(0, 84%, 60%)", "hsl(var(--primary))"] }),
      },
      transition: {
        scale: { duration: 0.1 },
        ...(pulse && { scale: { duration: 1, repeat: Infinity } }),
        ...(success && { backgroundColor: { duration: 0.5 } }),
        ...(error && { backgroundColor: { duration: 0.5 } }),
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...buttonProps}
        {...props}
      >
        {loading && (
          <motion.div
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {success && (
          <motion.div
            className="mr-2 h-4 w-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            ✓
          </motion.div>
        )}
        {error && (
          <motion.div
            className="mr-2 h-4 w-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            ✕
          </motion.div>
        )}
        {children}
      </Comp>
    );
  }
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, buttonVariants };
