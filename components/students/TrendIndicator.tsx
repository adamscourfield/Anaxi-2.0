interface TrendIndicatorProps {
  delta: number | null | undefined;
  metricType?: "behaviour" | "attendance";
  label?: string;
}

export function TrendIndicator({ delta, metricType = "behaviour", label }: TrendIndicatorProps) {
  if (delta === null || delta === undefined) {
    return <span className="text-text-muted" title="No previous data">–</span>;
  }

  let icon: string;
  let colorClass: string;

  if (delta === 0) {
    icon = "–";
    colorClass = "text-text-muted";
  } else if (delta > 0) {
    icon = "↑";
    // behaviour: up = bad (red), attendance: up = good (green)
    colorClass = metricType === "attendance" ? "text-green-600" : "text-red-600";
  } else {
    icon = "↓";
    // behaviour: down = good (green), attendance: down = bad (red)
    colorClass = metricType === "attendance" ? "text-red-600" : "text-green-600";
  }

  const tooltipText = label
    ? `${label}: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}`
    : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;

  return (
    <span className={colorClass} title={tooltipText} aria-label={tooltipText}>
      {icon}
    </span>
  );
}
