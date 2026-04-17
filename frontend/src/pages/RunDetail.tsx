import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldAlert, Zap, Server, Code2, CheckCircle2, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function RunDetail() {
  const { id } = useParams()
  const [isFixing, setIsFixing] = useState(false)
  const [isFixed, setIsFixed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleFix = () => {
    setIsFixing(true)
    setTimeout(() => {
      setIsFixing(false)
      setIsFixed(true)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-[500px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-6 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-4">
        <Link to="/audit" className="p-2 glass-panel rounded-md text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Run Details: <span className="text-primary">{id}</span></h2>
          <p className="text-zinc-400 text-sm mt-1">Evaluated 2 mins ago by <span className="font-mono text-zinc-300">system:terraform</span></p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Violation Card */}
          <Card className={`border shadow-lg ${isFixed ? 'border-green-500/30 bg-green-950/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-red-500/30 bg-red-950/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]'} relative overflow-hidden transition-all duration-700`}>
            {isFixed && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent z-0 pointer-events-none" />
            )}
            <CardHeader className="border-b border-white/5 pb-4 relative z-10 bg-black/20">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`p-2.5 rounded-lg border ${isFixed ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`}>
                    {isFixed ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">S3 buckets must not be public</CardTitle>
                    <p className="text-zinc-400 text-sm mt-1">Policy: <span className="font-mono text-zinc-300 bg-white/5 px-1.5 py-0.5 rounded">POL-001</span></p>
                  </div>
                </div>
                <Badge variant={isFixed ? 'success' : 'destructive'} className={`text-sm px-3 py-1 uppercase tracking-widest ${isFixed ? 'shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}>
                  {isFixed ? 'RESOLVED' : 'FAILED'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">Why it matters</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Publicly accessible S3 buckets can expose sensitive data to unauthorized individuals, leading to data breaches and compliance violations. Ensuring buckets are private creates a critical defense-in-depth layer.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D0D12] rounded-lg border border-red-500/20 p-0 overflow-hidden shadow-inner">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-950/30 px-4 py-2 border-b border-red-500/10">
                      <Code2 className="h-3.5 w-3.5" /> DETECTED CONFIGURATION
                    </div>
                    <pre className="text-xs text-zinc-300 font-mono p-4 overflow-x-auto leading-loose">
                      <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = "company-prod-data"\n}\n\n`}
                      <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket_public_access_block"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = aws_s3_bucket.prod.id\n`}
                      <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- block_public_acls       = false</span>
                      <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- block_public_policy     = false</span>
                      <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- ignore_public_acls      = false</span>
                      <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- restrict_public_buckets = false</span>
                      {`}`}
                    </pre>
                  </div>

                  <div className="bg-[#0D0D12] rounded-lg border border-green-500/20 p-0 overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.05)] relative">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-medium bg-green-950/30 px-4 py-2 border-b border-green-500/10">
                      <Code2 className="h-3.5 w-3.5" /> REQUIRED CONFIGURATION
                    </div>
                    <pre className="text-xs text-zinc-300 font-mono p-4 overflow-x-auto leading-loose">
                      <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = "company-prod-data"\n}\n\n`}
                      <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket_public_access_block"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = aws_s3_bucket.prod.id\n`}
                      <span className="text-green-400 bg-green-500/10 -mx-4 px-4 block border-l-2 border-green-500">+ block_public_acls       = true</span>
                      <span className="text-green-400 bg-green-500/10 -mx-4 px-4 block border-l-2 border-green-500">+ block_public_policy     = true</span>
                      <span className="text-green-400 bg-green-500/10 -mx-4 px-4 block border-l-2 border-green-500">+ ignore_public_acls      = true</span>
                      <span className="text-green-400 bg-green-500/10 -mx-4 px-4 block border-l-2 border-green-500">+ restrict_public_buckets = true</span>
                      {`}`}
                    </pre>
                  </div>
                </div>

                {!isFixed && (
                  <div className="flex items-center justify-between mt-6 p-4 rounded-lg bg-black/40 border border-white/5 shadow-inner">
                    <p className="text-sm text-zinc-400">
                      You can instantly generate a fix for this configuration via a new branch.
                    </p>
                    <Button 
                      onClick={handleFix}
                      disabled={isFixing}
                      className={`gap-2 px-6 h-11 bg-primary text-white hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] ${isFixing ? 'opacity-80 animate-pulse' : ''}`}
                    >
                      {isFixing ? (
                        <>Applying Fix...</>
                      ) : (
                        <><Zap className="h-4 w-4 fill-white" /> Fix Now</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3 border-b border-white/5 bg-black/20">
              <CardTitle className="text-sm font-semibold tracking-wide text-zinc-300">RESOURCE CONTEXT</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-sm">
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs mb-1.5 uppercase font-medium">Resource ARN</span>
                <span className="font-mono text-zinc-300 break-all bg-[#0D0D12] p-2 rounded border border-white/5 text-xs shadow-inner">
                  arn:aws:s3:::company-prod-data
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs mb-1.5 uppercase font-medium">Environment</span>
                <div className="flex items-center gap-2 font-medium text-zinc-200 bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/5">
                  <Server className="h-3.5 w-3.5 text-zinc-400" /> Production
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 text-xs mb-1.5 uppercase font-medium">Module Path</span>
                <span className="font-mono text-zinc-300 bg-[#0D0D12] p-2 rounded border border-white/5 text-xs shadow-inner">modules/storage/main.tf</span>
              </div>
            </CardContent>
          </Card>

          {isFixed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-5 flex gap-4 text-sm shadow-[0_0_30px_rgba(124,58,237,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              <div className="flex flex-col">
                <p className="text-white font-semibold text-base mb-1">Pull Request Created</p>
                <p className="text-zinc-400 leading-relaxed">A fix has been generated and a PR is waiting for your review.</p>
                <a href="#" className="inline-block mt-3 text-primary font-medium hover:text-white transition-colors group flex items-center gap-1">
                  View PR #142 <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
