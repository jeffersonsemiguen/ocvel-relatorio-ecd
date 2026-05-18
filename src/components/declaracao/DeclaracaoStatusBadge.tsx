import { cn } from "@/lib/utils";
import {
  STATUS_DECLARACAO_LABEL,
  STATUS_DECLARACAO_VARIANT,
} from "@/constants/status";
import { Badge } from "@/components/ui/badge";
import type { StatusDeclaracao } from "@/types/domain";

interface Props {
  status: StatusDeclaracao;
  className?: string;
}

export function DeclaracaoStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={STATUS_DECLARACAO_VARIANT[status]} className={cn(className)}>
      {STATUS_DECLARACAO_LABEL[status]}
    </Badge>
  );
}
