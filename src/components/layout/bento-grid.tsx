import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns on desktop (default 12) */
  cols?: number;
}

export function BentoGrid({
  cols = 12,
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 12 && "grid-cols-4 sm:grid-cols-8 lg:grid-cols-12",
        cols === 6 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column span on mobile (1-4, default 4 = full width) */
  colSpanSm?: 1 | 2 | 3 | 4;
  /** Column span on tablet (1-8, default 4) */
  colSpanMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Column span on desktop (1-12, default 4) */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Row span (default 1) */
  rowSpan?: 1 | 2 | 3;
}

const colSpanSmClasses = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

const colSpanMdClasses = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
};

const colSpanLgClasses = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

const rowSpanClasses = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

export function BentoItem({
  colSpanSm = 4,
  colSpanMd = 4,
  colSpan = 4,
  rowSpan = 1,
  className,
  children,
  ...props
}: BentoItemProps) {
  return (
    <div
      className={cn(
        colSpanSmClasses[colSpanSm],
        colSpanMdClasses[colSpanMd],
        colSpanLgClasses[colSpan],
        rowSpanClasses[rowSpan],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
