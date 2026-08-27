'use client';

import {Bar, BarChart, CartesianGrid, XAxis} from 'recharts';

import {formatDate, formatNumber} from '@/locale/formatters';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/ui/components/chart';
import type {RevenueMonth} from '../../../../orm';

interface RevenueChartProps {
  data: RevenueMonth[];
  /** Translated "Revenue" label shown in the tooltip. */
  label: string;
  /** Currency to format amounts in (code drives the Intl currency style). */
  currencyCode: string;
  currencyScale: number;
}

export function RevenueChart({
  data,
  label,
  currencyCode,
  currencyScale,
}: RevenueChartProps) {
  const config = {
    revenue: {label, color: 'hsl(var(--success))'},
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart accessibilityLayer data={data} margin={{left: 12, right: 12}}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={4}
          tickFormatter={value => formatDate(value, {dateFormat: 'MMM'})}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={value =>
                formatDate(value, {dateFormat: 'MMM YYYY'})
              }
              formatter={value =>
                String(
                  formatNumber(Number(value), {
                    type: 'DECIMAL',
                    scale: currencyScale,
                    currency: currencyCode,
                  }),
                )
              }
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
