import { Badge } from "@/components/ui/badge";
import { projectStatuses } from "@/constants/project-statuses";
import type { ProjectStatus } from "@/types/database";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const config = projectStatuses[status];
  return (
    <Badge
      className={`${config.bgColor} ${config.textColor} border-0 ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}
