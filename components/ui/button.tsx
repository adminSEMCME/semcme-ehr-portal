import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-semcmeBlue text-white hover:bg-[#013e7a]",
        inverted: "bg-white text-semcmeBlue hover:bg-slate-100",
        subtle:
          "bg-slate-200 text-semcmeBlue shadow-sm hover:bg-white hover:scale-[1.02]",
        outline:
          "border border-[#02519c] bg-transparent text-semcmeBlue shadow-xs hover:border-[#02519c] hover:bg-[#02519c] hover:text-white hover:shadow-xs dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        ghost:
          "bg-transparent text-semcmeBlue hover:bg-slate-100 hover:text-semcmeBlue",
        ghostInverted:
          "bg-transparent text-white hover:bg-white/10 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-red-600 text-white hover:bg-red-800",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        accent: "bg-purple-600 text-white hover:bg-purple-700",
        assessment: "bg-blue-600 text-white hover:bg-blue-700",
        dropdown:
          "w-full justify-between bg-white text-semcmeBlue shadow-sm hover:bg-slate-100",
        unstyled: "",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        md: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        lg: "h-11 px-6 py-3 text-base has-[>svg]:px-4",
        xl: "h-13 px-8 py-3 text-lg has-[>svg]:px-4",
        card: "h-9 px-6 py-3 text-base has-[>svg]:px-4",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function getTextFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return getTextFromChildren(child.props.children);
      }

      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  title,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const ariaLabel = props["aria-label"];
  const fallbackTitle =
    title ??
    (typeof ariaLabel === "string" ? ariaLabel : undefined) ??
    getTextFromChildren(children) ??
    undefined;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      title={fallbackTitle || undefined}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
