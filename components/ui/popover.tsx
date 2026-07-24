"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const PopoverContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  
  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      }
      setUncontrolledOpen(value);
    },
    [onOpenChange]
  );

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("PopoverTrigger must be used within Popover");

  const { isOpen, setIsOpen } = context;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        if ((children.props as any)?.onClick) (children.props as any).onClick(e);
        handleClick(e);
      }
    });
  }

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    showArrow?: boolean;
  }
>(({ className, align = "center", children, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) return null;

  const { isOpen, setIsOpen } = context;

  if (!isOpen) return null;

  const alignClass = align === "start" 
    ? "left-0" 
    : align === "end" 
      ? "right-0" 
      : "left-1/2 -translate-x-1/2";

  return (
    <>
      {/* Backdrop overlay to close when clicking outside */}
      <div 
        className="fixed inset-0 z-[90] bg-transparent" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />
      <div
        ref={ref}
        className={cn(
          "absolute mt-2 z-[100] max-h-[450px] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-lg outline-none",
          alignClass,
          className
        )}
        {...props}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
});
PopoverContent.displayName = "PopoverContent";

export const PopoverAnchor = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export { PopoverTrigger as Trigger, PopoverContent as Content };
