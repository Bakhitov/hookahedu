import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  topClassName?: string;
  bottomClassName?: string;
};

export default function BrandLockup({
  className,
  topClassName,
  bottomClassName,
}: BrandLockupProps) {
  return (
    <span className={cn("font-serif text-foreground leading-none", className)}>
      <span className={cn("block text-xl md:text-lg font-black tracking-tight", topClassName)}>WinterGreen</span>
      <span className={cn("block text-xs md:text-xs font-normal tracking-[0.12em] uppercase", bottomClassName)}>
        Academia
      </span>
    </span>
  );
}
