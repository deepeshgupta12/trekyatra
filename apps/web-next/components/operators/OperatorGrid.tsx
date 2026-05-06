import OperatorCard from "./OperatorCard";
import type { OperatorPublic } from "@/lib/api";

interface Props {
  operators: OperatorPublic[];
}

export default function OperatorGrid({ operators }: Props) {
  if (operators.length === 0) {
    return (
      <div className="text-center py-16 text-white/30">
        No operators found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {operators.map((op) => (
        <OperatorCard key={op.id} operator={op} />
      ))}
    </div>
  );
}
