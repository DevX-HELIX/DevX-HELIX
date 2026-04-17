import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal } from "lucide-react"
import { mockApi, type Policy } from "@/api/mockBackend"
import { Skeleton } from "@/components/ui/skeleton"

export default function Policies() {
  const [searchTerm, setSearchTerm] = useState("")
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockApi.getPolicies().then(res => {
      setPolicies(res)
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
          <h2 className="text-2xl font-bold tracking-tight">Active Policies</h2>
          <p className="text-zinc-400 text-sm mt-1">Manage rules, severities, and enforcement modes.</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white font-medium text-sm rounded-md hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          Create Policy
        </button>
      </div>

      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search policies..."
                className="w-full bg-black/40 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-white/10 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Policy Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Target Mode</th>
                  <th className="px-6 py-4 font-medium text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4"><Skeleton className="h-8 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No policies found matching your search.
                    </td>
                  </tr>
                ) : policies.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((policy) => (
                  <tr key={policy.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      <div className="group-hover:text-primary transition-colors">{policy.name}</div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{policy.id}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{policy.category}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        policy.severity === 'Critical' ? 'destructive' : 
                        policy.severity === 'High' ? 'destructive' : 
                        policy.severity === 'Medium' ? 'secondary' : 'outline'
                      } className={policy.severity === 'Critical' ? 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}>
                        {policy.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {/* Interactive toggle mock */}
                      <div className="inline-flex items-center rounded-full p-0.5 bg-black/50 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
                         <div className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${policy.status === 'Audit' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500'}`}>
                           Audit
                         </div>
                         <div className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${policy.status === 'Enforced' ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'text-zinc-500'}`}>
                           Enforce
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500">{policy.updated}</td>
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
