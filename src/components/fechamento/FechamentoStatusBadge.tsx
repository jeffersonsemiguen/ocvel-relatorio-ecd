import { cn } from "@/lib/utils";
import {
  STATUS_FECHAMENTO_LABEL,
  STATUS_FECHAMENTO_VARIANT,
} from "@/constants/status";
import { Badge } from "@/components/ui/badge";
import type { StatusFechamento } from "@/types/domain";

interface Props {
  status: StatusFechamento;
  className?: string;
}

export function FechamentoStatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant={STATUS_FECHAMENTO_VARIANT[status]}
      className={cn(className)}
    >
      {STATUS_FECHAMENTO_LABEL[status]}
    </Badge>
  );
}
