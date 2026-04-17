import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle, Wrench, RefreshCw, CheckCircle2 } from "lucide-react"
import { mockApi, type PolicyViolation } from "@/api/mockBackend"
import { Skeleton } from "@/components/ui/skeleton"

export default function Policies() {
  const [searchTerm, setSearchTerm] = useState("")
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Interactive States
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set())
  const [ackIds, setAckIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    mockApi.getPolicyViolations().then(res => {
      setViolations(res)
      setLoading(false)
    })
  }, [])

  const handleRunScan = () => {
    setIsScanning(true)
    setScanComplete(false)
    setTimeout(() => {
      setIsScanning(false)
      setScanComplete(true)
      setTimeout(() => setScanComplete(false), 3000)
    }, 2000)
  }

  const handleFix = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFixingId(id)
    setTimeout(() => {
      setFixingId(null)
      setFixedIds(prev => new Set(prev).add(id))
    }, 1500)
  }

  const handleAck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAckIds(prev => new Set(prev).add(id))
    setExpandedId(null)
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Policy Violations</h2>
          <p className="text-slate-500 text-sm mt-1">Review and remediate critical infrastructure policy violations.</p>
        </div>
        <button 
          onClick={handleRunScan}
          disabled={isScanning || scanComplete}
          className={`px-4 py-2 text-white font-medium text-sm rounded-md transition-all shadow-sm flex items-center gap-2 ${
            scanComplete 
              ? 'bg-green-600 hover:bg-green-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          } ${isScanning ? 'opacity-80' : ''}`}
        >
          {isScanning ? (
            <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning...</>
          ) : scanComplete ? (
            <><CheckCircle2 className="h-4 w-4" /> Scan Complete</>
          ) : (
             "Run Scan"
          )}
        </button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-md">
        <CardHeader className="border-b border-slate-200 pb-4 bg-white rounded-t-md">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search violations..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors bg-white">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white rounded-b-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-medium">
                <tr>
                  <th className="px-6 py-3 w-8"></th>
                  <th className="px-6 py-3">Policy Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Resource</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    </tr>
                  ))
                ) : violations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No violations found matching your search.
                    </td>
                  </tr>
                ) : violations.filter(v => 
                    v.name.toLowerCase().includes(searchTerm.toLowerCase()) && !ackIds.has(v.id)
                  ).map((violation) => {
                    const isFixed = fixedIds.has(violation.id);
                    return (
                  <React.Fragment key={violation.id}>
                    <tr 
                      className={`border-b border-slate-100 transition-colors cursor-pointer ${isFixed ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}
                      onClick={() => setExpandedId(expandedId === violation.id ? null : violation.id)}
                    >
                      <td className="px-6 py-4 text-slate-400">
                        {expandedId === violation.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{violation.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{violation.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isFixed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            RESOLVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            {violation.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          isFixed ? 'outline' :
                          violation.severity === 'Critical' ? 'destructive' : 
                          violation.severity === 'High' ? 'destructive' : 
                          violation.severity === 'Medium' ? 'secondary' : 'outline'
                        } className={isFixed ? 'border-green-200 text-green-700' : 'font-medium'}>
                          {violation.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[250px]">
                        {violation.resource}
                      </td>
                    </tr>
                    <AnimatePresence>
                    {expandedId === violation.id && (
                      <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`border-b border-slate-200 ${isFixed ? 'bg-green-50/20' : 'bg-slate-50'}`}>
                        <td colSpan={5} className={`px-6 py-6 border-l-2 ${isFixed ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                          <div className="flex flex-col gap-4 overflow-hidden">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-slate-900">
                                  <AlertCircle className={`h-4 w-4 ${isFixed ? 'text-green-500' : 'text-red-500'}`} />
                                  Violating Code Snippet
                                </h4>
                                <div className="bg-slate-900 rounded-md p-4 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 text-xs font-mono text-slate-300 border border-slate-800">
                                  <pre>
                                    <code>{violation.codeSnippet}</code>
                                  </pre>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-slate-900">
                                  <Wrench className={`h-4 w-4 ${isFixed ? 'text-green-500' : 'text-blue-500'}`} />
                                  Suggested Remediation
                                </h4>
                                <div className="bg-white border border-slate-200 rounded-md p-4 text-sm text-slate-700 leading-relaxed shadow-sm">
                                  {isFixed ? "Issue has been resolved automatically. A Pull Request with the fix was deployed to the main branch." : violation.fixSuggestion}
                                </div>
                                <div className="mt-4 flex gap-3">
                                  {!isFixed && (
                                    <>
                                      <button 
                                        onClick={(e) => handleFix(violation.id, e)}
                                        disabled={fixingId === violation.id}
                                        className={`px-4 py-2 bg-slate-900 text-white font-medium text-sm rounded-md hover:bg-slate-800 transition-colors shadow-sm inline-flex items-center gap-2 ${fixingId === violation.id ? 'opacity-80' : ''}`}
                                      >
                                        {fixingId === violation.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                                        {fixingId === violation.id ? "Fixing..." : "Generate Auto-Fix"}
                                      </button>
                                      <button 
                                        onClick={(e) => handleAck(violation.id, e)}
                                        className="px-4 py-2 bg-white text-slate-700 border border-slate-300 font-medium text-sm rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                                      >
                                        Acknowledge
                                      </button>
                                    </>
                                  )}
                                  {isFixed && (
                                    <span className="px-4 py-2 bg-green-100 text-green-800 font-medium text-sm rounded-md inline-flex items-center gap-2 border border-green-200">
                                      <CheckCircle2 className="h-4 w-4" /> Remediation Applied
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                    </AnimatePresence>
                  </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
