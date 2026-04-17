import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { Filter, ChevronRight } from "lucide-react"
import { mockApi, type AuditLog } from "@/api/mockBackend"
import { Skeleton } from "@/components/ui/skeleton"

export default function Audit() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockApi.getAuditLogs().then(res => {
      setLogs(res)
      setLoading(false)
    })
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-zinc-400 text-sm mt-1">Detailed evaluation logs across infrastructure.</p>
        </div>
        <button className="p-2 glass-panel rounded-md text-zinc-300 hover:text-white transition-all hover:bg-white/10 flex items-center gap-2 text-sm shadow-[0_0_10px_rgba(255,255,255,0.05)]">
          <Filter className="h-4 w-4" />
          More Filters
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Run ID</th>
                  <th className="px-6 py-4 font-medium">Resource</th>
                  <th className="px-6 py-4 font-medium">Policy Evaluated</th>
                  <th className="px-6 py-4 font-medium">Triggered By</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : logs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => navigate(`/run/${log.id}`)}
                    className="border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs group-hover:text-primary transition-colors">{log.id}</td>
                    <td className="px-6 py-4 text-zinc-200 text-xs max-w-[200px] truncate">{log.resource}</td>
                    <td className="px-6 py-4 text-zinc-300">{log.policy}</td>
                    <td className="px-6 py-4 text-zinc-400">{log.user}</td>
                    <td className="px-6 py-4">
                      <Badge variant={log.status === 'FAIL' ? 'destructive' : 'success'} className={log.status === 'FAIL' ? 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{log.time}</td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
