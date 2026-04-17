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
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full mt-8">
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
      className="flex flex-col gap-6 max-w-5xl mx-auto mt-4"
    >
      <div className="flex items-center gap-4">
        <Link to="/audit" className="p-2 border border-slate-200 bg-white rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Run Details: <span className="text-blue-600">{id}</span></h2>
          <p className="text-slate-500 text-sm mt-1">Evaluated 2 mins ago by <span className="font-mono text-slate-600 font-medium">system:terraform</span></p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Violation Card */}
          <Card className={`border shadow-sm rounded-md transition-all duration-500 ${isFixed ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
            <CardHeader className="border-b border-slate-100 pb-4 relative z-10 bg-slate-50 rounded-t-md">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`p-2.5 rounded-lg border ${isFixed ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {isFixed ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">S3 buckets must not be public</CardTitle>
                    <p className="text-slate-500 text-sm mt-1">Policy: <span className="font-mono text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded">POL-001</span></p>
                  </div>
                </div>
                <Badge variant={isFixed ? 'secondary' : 'destructive'} className={`text-xs px-3 py-1 uppercase tracking-widest ${isFixed ? 'bg-green-100 text-green-800 hover:bg-green-100 font-medium' : 'font-medium'}`}>
                  {isFixed ? 'RESOLVED' : 'FAILED'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Why it matters</h4>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Publicly accessible S3 buckets can expose sensitive data to unauthorized individuals, leading to data breaches and compliance violations. Ensuring buckets are private creates a critical defense-in-depth layer.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="bg-slate-900 rounded-md border border-slate-800 p-0 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-950/40 px-4 py-2 border-b border-red-900/30">
                      <Code2 className="h-3.5 w-3.5" /> DETECTED CONFIGURATION
                    </div>
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 pb-2">
                      <pre className="text-xs text-slate-300 font-mono p-4 leading-loose min-w-max">
                        <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = "company-prod-data"\n}\n\n`}
                        <span className="text-purple-400">resource</span> <span className="text-green-300">"aws_s3_bucket_public_access_block"</span> <span className="text-yellow-300">"prod"</span> {`{\n  bucket = aws_s3_bucket.prod.id\n`}
                        <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- block_public_acls       = false</span>
                        <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- block_public_policy     = false</span>
                        <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- ignore_public_acls      = false</span>
                        <span className="text-red-400 bg-red-500/10 -mx-4 px-4 block border-l-2 border-red-500">- restrict_public_buckets = false</span>
                        {`}`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-md border border-slate-800 p-0 overflow-hidden shadow-sm relative">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-medium bg-green-950/30 px-4 py-2 border-b border-green-900/30">
                      <Code2 className="h-3.5 w-3.5" /> REQUIRED CONFIGURATION
                    </div>
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 pb-2">
                      <pre className="text-xs text-slate-300 font-mono p-4 leading-loose min-w-max">
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
                </div>

                {!isFixed && (
                  <div className="flex items-center justify-between mt-6 p-5 rounded-md bg-slate-50 border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-600 font-medium">
                      You can instantly generate a fix for this configuration via a new branch.
                    </p>
                    <Button 
                      onClick={handleFix}
                      disabled={isFixing}
                      className={`gap-2 px-6 h-10 bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm ${isFixing ? 'opacity-80' : ''}`}
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
          <Card className="border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">RESOURCE CONTEXT</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs mb-1.5 font-semibold uppercase tracking-wide">Resource ARN</span>
                <span className="font-mono text-slate-700 break-all bg-slate-50 p-2 rounded border border-slate-200/60 text-xs">
                  arn:aws:s3:::company-prod-data
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs mb-1.5 font-semibold uppercase tracking-wide">Environment</span>
                <div className="flex items-center gap-2 font-medium text-slate-700 bg-slate-50 w-fit px-3 py-1.5 rounded-md border border-slate-200/60 text-xs">
                  <Server className="h-3.5 w-3.5 text-slate-500" /> Production
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs mb-1.5 font-semibold uppercase tracking-wide">Module Path</span>
                <span className="font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-200/60 text-xs">modules/storage/main.tf</span>
              </div>
            </CardContent>
          </Card>

          {isFixed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-md p-5 flex gap-4 text-sm shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <CheckCircle2 className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <p className="text-slate-900 font-semibold text-base mb-1">Pull Request Created</p>
                <p className="text-slate-600 leading-relaxed">A fix has been generated and a PR is waiting for your review.</p>
                <a href="#" className="inline-flex mt-3 text-blue-600 font-medium hover:text-blue-700 transition-colors group items-center gap-1">
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
