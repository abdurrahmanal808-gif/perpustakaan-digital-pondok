import { BookOpen } from "lucide-react";
import { formatDisplayTitle } from "@/lib/format";

type DefaultBookCoverProps = {
  title: string;
  className?: string;
};

export function DefaultBookCover({ title, className = "" }: DefaultBookCoverProps) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-pondok p-5 text-center text-bone ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-bone/10">
        <BookOpen className="text-gold" size={28} />
      </div>
      <p className="line-clamp-4 text-sm font-bold leading-6">
        {formatDisplayTitle(title)}
      </p>
      <span className="mt-4 h-1 w-16 rounded-full bg-gold" />
    </div>
  );
}
