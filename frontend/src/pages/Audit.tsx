import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { Filter, ChevronRight, Download } from "lucide-react"
import { mockApi, type AuditLog } from "@/api/mockBackend"
import { Skeleton } from "@/components/ui/skeleton"

export default function Audit() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const [isExporting, setIsExporting] = useState(false)
  
  useEffect(() => {
    mockApi.getAuditLogs().then(res => {
      setLogs(res)
      setLoading(false)
    })
  }, [])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      // Normally would trigger a file download here
    }, 1500)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs</h2>
          <p className="text-slate-500 text-sm mt-1">Detailed evaluation logs across infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`px-4 py-2 text-slate-700 font-medium text-sm rounded-md transition-all shadow-sm inline-flex items-center gap-2 border bg-white border-slate-300 ${isExporting ? 'opacity-70 bg-slate-50 border-slate-200' : 'hover:bg-slate-50 hover:border-slate-400'}`}
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <><Download className="h-4 w-4" /> Export CSV</>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200 rounded-md">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" /> Filters:
        </span>
        <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5">
          <option>All Environments</option>
          <option>Production</option>
          <option>Staging</option>
        </select>
        <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5">
          <option>All Statuses</option>
          <option>FAIL</option>
          <option>PASS</option>
        </select>
        <select className="bg-white border border-slate-300 text-slate-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5">
          <option>All Teams</option>
          <option>Platform</option>
          <option>Security</option>
        </select>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-medium">
                <tr>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Policy Evaluated</th>
                  <th className="px-4 py-3">Triggered By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  ))
                ) : logs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => navigate(`/run/${log.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs group-hover:text-blue-600 transition-colors">{log.id}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-mono max-w-[200px] truncate">{log.resource}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium text-xs">{log.policy}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{log.user}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'FAIL' ? 'destructive' : 'secondary'} className={log.status === 'PASS' ? 'bg-green-100 text-green-800 hover:bg-green-100 font-medium border-transparent' : 'font-medium'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.time}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
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
