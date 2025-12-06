
import { cn } from "@/lib/utils";

interface GradientTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function GradientTitle({ children, className, as: Component = 'h1' }: GradientTitleProps) {
  return (
    <Component
      className={cn(
        'font-headline text-4xl md:text-5xl font-extralight tracking-tighter bg-gradient-to-b from-[#DFC4A8] to-[#796A5B] bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </Component>
  );
}
