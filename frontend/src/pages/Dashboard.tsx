import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldAlert, CheckCircle2, TrendingUp } from "lucide-react"
import { mockApi, type DashboardMetrics } from "@/api/mockBackend"
import { Skeleton } from "@/components/ui/skeleton"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from "recharts"

const COLORS = ['#10b981', '#ef4444']

export default function Dashboard() {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockApi.getDashboardMetrics().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-80" />
          <Skeleton className="col-span-3 h-80" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time infrastructure governance metrics.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Overall Compliance", value: `${data.complianceScore}%`, icon: CheckCircle2, trend: "+2.5%" },
          { title: "Active Policies", value: data.activePolicies, icon: Activity, trend: "0" },
          { title: "Critical Violations", value: data.criticalViolations, icon: ShieldAlert, trend: "-12%" },
          { title: "Scans Today", value: data.scansToday, icon: TrendingUp, trend: "+1k" },
        ].map((metric, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              <p className="text-xs text-zinc-500 mt-1">
                <span className={metric.trend.startsWith('+') ? 'text-green-500' : metric.trend.startsWith('-') ? 'text-green-500' : 'text-zinc-400'}>
                  {metric.trend}
                </span> relative to yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(24,24,27,0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0, filter: 'drop-shadow(0px 0px 5px rgba(139,92,246,0.8))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center relative">
             <div className="h-[200px] w-full absolute drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data.pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={85}
                     startAngle={90}
                     endAngle={-270}
                     stroke="none"
                     dataKey="value"
                   >
                     {data.pieData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="text-center z-10 pointer-events-none mt-2">
               <span className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{data.complianceScore}</span>
               <span className="text-xl text-zinc-400 font-medium">%</span>
               <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest font-semibold">Score</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Violated Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.barData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} width={40} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(24,24,27,0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="violations" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(0, 84%, ${Math.max(40, 60 - index * 5)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0 hover:bg-white/[0.02] p-2 -mx-2 rounded transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{item.evt}</span>
                    <span className="text-xs text-zinc-500">{item.time} • {item.env}</span>
                  </div>
                  <Badge variant={item.status === 'Pass' ? 'success' : 'destructive'} className={item.status !== 'Pass' ? 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
