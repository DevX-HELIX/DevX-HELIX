import { useState, useRef, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  Shield, Bell, LayoutDashboard, FileText, Activity,
  Check, LogOut, Settings, User, Play, List
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Current Run", href: "/current-run", icon: Activity },
  { name: "Validate", href: "/validate", icon: Play },
  { name: "Policies", href: "/policies", icon: Shield },
  { name: "Audit Trail", href: "/audit", icon: List },
]

const notifications = [
  { id: 1, title: "Policy Engine Ready", desc: "All policy rules loaded and active.", time: "Now", unread: true },
  { id: 2, title: "MongoDB Connected", desc: "Audit logging is enabled.", time: "1m ago", unread: false },
]

export default function GlobalLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowNotif(false)
        setShowProfile(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Global header */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 shadow-sm"
      >
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600 shadow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900 tracking-tight">PolicyOps</span>
              <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-widest">Policy-as-Code</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-0.5">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => { setShowNotif(false); setShowProfile(false) }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all relative",
                    isActive
                      ? "text-blue-700 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: Status indicator, Notifications, Profile */}
        <div className="flex items-center gap-3 relative">
          {/* Live backend indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Backend · Live
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
              className={`relative transition-colors p-1.5 rounded-md ${showNotif ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
            >
              <Bell className="h-4 w-4" />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-9 w-72 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                    <span className="font-semibold text-xs text-slate-700">Notifications</span>
                    <span className="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${n.unread ? "bg-blue-50/30" : ""}`}>
                      <div className="flex items-start justify-between mb-0.5">
                        <span className={`text-xs font-semibold ${n.unread ? "text-slate-900" : "text-slate-600"}`}>{n.title}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{n.desc}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
              className={`h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-all border-2 ${showProfile ? "ring-2 ring-blue-500 ring-offset-1 border-white shadow-md" : "border-white hover:shadow-md"}`}
            >
              JD
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-9 w-52 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">John Doe</p>
                    <p className="text-xs text-slate-500">Policy Admin</p>
                  </div>
                  <div className="py-1">
                    <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 group">
                      <User className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" /> My Profile
                    </Link>
                    <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 group">
                      <Activity className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" /> Activity Log
                    </Link>
                    <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 group">
                      <Settings className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 w-full" onClick={() => { setShowNotif(false); setShowProfile(false) }}>
        <Outlet />
      </main>
    </div>
  )
}
