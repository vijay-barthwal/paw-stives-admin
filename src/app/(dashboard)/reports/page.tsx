"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { apiClient } from "@/lib/api-client"

type ReportsSummary = {
  totalUsers: number
  totalProviders: { pending: number; approved: number; rejected: number }
  totalPets: number
  totalAppointments: { pending: number; confirmed: number; completed: number; cancelled: number }
  totalRevenue: number
}

type TrendPoint = { date: string; bookings: number; revenue: number }

const RANGE_OPTIONS = [7, 30, 90] as const

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat("en-US")

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function StatTile({ icon, label, value, tone }: { icon: string; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col gap-space-2xs rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <span className={`flex size-10 items-center justify-center rounded-xl bg-surface-container-high ${tone ?? "text-primary"}`}>
        <MaterialIcon name={icon} size={20} />
      </span>
      <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{value}</span>
      <span className="font-label-md text-label-md font-semibold text-on-surface-variant">{label}</span>
    </div>
  )
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
  valueFormatter,
  isLoading,
}: {
  title: string
  data: TrendPoint[]
  dataKey: "bookings" | "revenue"
  color: string
  valueFormatter: (value: number) => string
  isLoading: boolean
}) {
  const gradientId = `gradient-${dataKey}`

  return (
    <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h2>
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Not enough data yet for this range.</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-container-high)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                axisLine={{ stroke: "var(--surface-container-high)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                axisLine={false}
                tickLine={false}
                width={dataKey === "revenue" ? 56 : 32}
                tickFormatter={valueFormatter}
              />
              <Tooltip
                formatter={(value) => [valueFormatter(Number(value)), dataKey === "bookings" ? "Bookings" : "Revenue"]}
                labelFormatter={(label) => formatShortDate(String(label))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--surface-container-high)",
                  background: "var(--surface-container-lowest)",
                  color: "var(--on-surface)",
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ReportsPage() {
  const [summary, setSummary] = React.useState<ReportsSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = React.useState(true)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)

  const [range, setRange] = React.useState<(typeof RANGE_OPTIONS)[number]>(30)
  const [trend, setTrend] = React.useState<TrendPoint[]>([])
  const [trendLoading, setTrendLoading] = React.useState(true)
  const [trendError, setTrendError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional
    setSummaryLoading(true)
    setSummaryError(null)
    apiClient
      .get<ReportsSummary>("/reports/summary")
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err instanceof Error ? err.message : "Failed to load platform metrics.")
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional (re-fetches when range changes)
    setTrendLoading(true)
    setTrendError(null)
    apiClient
      .get<TrendPoint[]>("/reports/trend", { days: range })
      .then((data) => {
        if (!cancelled) setTrend(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setTrendError(err instanceof Error ? err.message : "Failed to load trend data.")
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Reports &amp; Analytics</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Platform-wide metrics and booking trends.</p>
      </div>

      {summaryError ? (
        <div className="flex flex-col items-center gap-space-xs rounded-2xl bg-surface-container-lowest p-space-2xl text-center shadow-sm">
          <MaterialIcon name="error" size={26} className="text-destructive" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">{summaryError}</p>
        </div>
      ) : summaryLoading ? (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon="group" label="Total users" value={numberFormatter.format(summary?.totalUsers ?? 0)} />
          <StatTile icon="pets" label="Total pets" value={numberFormatter.format(summary?.totalPets ?? 0)} tone="text-secondary" />
          <StatTile
            icon="payments"
            label="Total revenue"
            value={currencyFormatter.format(summary?.totalRevenue ?? 0)}
            tone="text-tertiary"
          />
          <StatTile
            icon="verified"
            label="Approved clinics"
            value={numberFormatter.format(summary?.totalProviders?.approved ?? 0)}
          />
          <StatTile
            icon="hourglass_top"
            label="Pending clinics"
            value={numberFormatter.format(summary?.totalProviders?.pending ?? 0)}
          />
          <StatTile icon="block" label="Rejected clinics" value={numberFormatter.format(summary?.totalProviders?.rejected ?? 0)} tone="text-destructive" />
          <StatTile
            icon="event_available"
            label="Confirmed appointments"
            value={numberFormatter.format(summary?.totalAppointments?.confirmed ?? 0)}
          />
          <StatTile
            icon="event_busy"
            label="Cancelled appointments"
            value={numberFormatter.format(summary?.totalAppointments?.cancelled ?? 0)}
            tone="text-destructive"
          />
        </div>
      )}

      <div className="flex items-center gap-space-2xs self-start">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={`font-label-md text-label-md rounded-full px-space-md py-2 font-semibold transition-colors ${
              range === option ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {option} days
          </button>
        ))}
      </div>

      {trendError ? (
        <div className="flex flex-col items-center gap-space-xs rounded-2xl bg-surface-container-lowest p-space-2xl text-center shadow-sm">
          <MaterialIcon name="error" size={26} className="text-destructive" />
          <p className="font-body-sm text-body-sm text-on-surface-variant">{trendError}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <ChartCard
            title="Bookings per day"
            data={trend}
            dataKey="bookings"
            color="var(--primary)"
            valueFormatter={(value) => numberFormatter.format(value)}
            isLoading={trendLoading}
          />
          <ChartCard
            title="Revenue per day"
            data={trend}
            dataKey="revenue"
            color="var(--tertiary)"
            valueFormatter={(value) => currencyFormatter.format(value)}
            isLoading={trendLoading}
          />
        </div>
      )}
    </div>
  )
}

export default ReportsPage
