import { IndicatorTrendChart } from "./IndicatorTrendChart";
import { EmployeeFeedbackMonth } from "../types/feedback";

export function BonusTrendChart({ data }: { data: EmployeeFeedbackMonth[] }) {
  return (
    <IndicatorTrendChart
      data={data}
      month={(m) => m.month}
      value={(m) => m.bonus.total}
      label="Desempenho Total"
      color="#2563eb"
      formatValue={(v) => `${v.toFixed(1)}%`}
      domain={[0, 100]}
    />
  );
}
