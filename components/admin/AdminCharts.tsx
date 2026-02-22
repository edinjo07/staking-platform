'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DailyChartPoint {
  date: string    // "Mon 17", "Tue 18" etc.
  users: number
  deposits: number
  withdrawals: number
  stakes: number
}

interface AdminChartsProps {
  data: DailyChartPoint[]
}

export function AdminCharts({ data }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* User & Stake Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Growth — Users &amp; Stakes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 12, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="users"
                name="New Users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="stakes"
                name="New Stakes"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deposit & Withdrawal Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Volume — Deposits &amp; Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 12, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="deposits" name="Deposits ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Withdrawals ($)" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
