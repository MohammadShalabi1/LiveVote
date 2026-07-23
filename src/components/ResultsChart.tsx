import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type ResultsChartProps = {
  results: {
    id: string;
    text: string;
    count: number;
    percentage: number;
  }[];
};
export function ResultsChart({ results }: ResultsChartProps) {
    console.log(results);
  return (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={results}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="text" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
        </ResponsiveContainer>
  );
}