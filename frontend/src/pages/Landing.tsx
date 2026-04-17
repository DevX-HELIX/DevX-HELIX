import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Shield, Settings, BarChart3, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Landing() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen"
    >
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-32 flex flex-col items-center text-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50 -z-20" />

        <div className="max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full text-blue-700 bg-blue-100/50 border border-blue-200 backdrop-blur-sm shadow-sm inline-flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Policy-as-Code Engine 2.0 Just Launched
            </Badge>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8"
          >
            Automate Infrastructure <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Governance with Confidence</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Deploy faster and safer. Continuously monitor, audit, and auto-remediate your cloud infrastructure before violations reach production.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <button className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:bg-blue-700 transition-all flex items-center gap-2 group">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/dashboard">
              <button className="px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                View Dashboard
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Abstract Illustration */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 w-full max-w-4xl px-6"
        >
          <div className="relative rounded-xl overflow-hidden border border-white shadow-2xl shadow-blue-900/10 bg-white/60 backdrop-blur-xl aspect-[21/9] flex items-center justify-center">
            {/* Minimalist dashboard abstraction */}
            <div className="absolute inset-x-0 top-0 h-10 border-b border-slate-200/50 bg-slate-50/50 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
            </div>
            <div className="mt-10 p-8 grid grid-cols-3 gap-6 w-full h-full opacity-70">
               <div className="bg-slate-100 rounded-lg flex-1 h-32" />
               <div className="bg-slate-100 rounded-lg flex-1 h-32" />
               <div className="bg-slate-100 rounded-lg flex-1 h-32" />
               <div className="col-span-2 bg-slate-100 rounded-lg flex-1 h-48" />
               <div className="bg-slate-100 rounded-lg flex-1 h-48" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* METRICS SECTION */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
          <div className="text-center px-4">
            <div className="text-4xl font-extrabold text-blue-600 mb-2">99.9%</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Compliance Rate</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-extrabold text-slate-900 mb-2">10k+</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Daily Scans</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-extrabold text-slate-900 mb-2">&lt;2s</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Fix Time</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-extrabold text-slate-900 mb-2">150+</div>
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Built-in Rules</div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise-grade Infrastructure Control</h2>
            <p className="text-slate-600 text-lg">Everything you need to secure, monitor, and automate your cloud footprint consistently across all environments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-xl hover:shadow-blue-900/5 group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                <Shield className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Policy Enforcement</h3>
              <p className="text-slate-600 leading-relaxed">
                Automatically block misconfigured resources from reaching production using native CI/CD integrations and webhook gates.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-xl hover:shadow-purple-900/5 group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                <Settings className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Auto-Fix Engine</h3>
              <p className="text-slate-600 leading-relaxed">
                Don't just detect issues. Automatically generate pull requests that resolve violations natively in your Terraform or CloudFormation code.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-xl hover:shadow-emerald-900/5 group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                <BarChart3 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Compliance Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Gain real-time visibility into your entire fleet. Track compliance drift over time and map violations to SOC2, HIPAA, or CIS standards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

    </motion.div>
  )
}
