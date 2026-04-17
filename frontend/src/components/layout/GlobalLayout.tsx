import { useState, useRef, useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { Shield, Search, Bell, Home, LayoutDashboard, FileText, Activity, Check, LogOut, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
// @ts-ignore - framer motion might be available
import { AnimatePresence, motion } from "framer-motion"

const navigation = [
  { name: "Home", href: "/", icon: Home, exact: true },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Policies", href: "/policies", icon: Shield },
  { name: "Audit Logs", href: "/audit", icon: FileText },
  { name: "Current Run", href: "/run/1234", icon: Activity },
]

const regions = ["us-east-1", "us-west-2", "eu-central-1", "ap-southeast-2"]

const notifications = [
  { id: 1, title: "Scan Completed", desc: "Production environment scan finished.", time: "2m ago", unread: true },
  { id: 2, title: "Critical Violation", desc: "S3 buckets must not be public.", time: "15m ago", unread: true },
  { id: 3, title: "Policy Updated", desc: "Network security rules modified by Admin.", time: "1h ago", unread: false },
]

export default function GlobalLayout() {
  const location = useLocation()
  
  const [activeRegion, setActiveRegion] = useState(regions[0])
  const [showRegion, setShowRegion] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Close menus when clicking outside
  const headerRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If clicking inside header, let local toggles handle it.
      // Wait, if we click outside header, we close everything.
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowRegion(false)
        setShowNotif(false)
        setShowProfile(false)
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Global Sticky Header */}
      <header ref={headerRef} className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 shadow-sm shadow-blue-500/5">
        
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">PolicyOps</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.href 
                : location.pathname.startsWith(item.href);
                
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => { setShowRegion(false); setShowNotif(false); setShowProfile(false); }}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all relative",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: Search, Region, Profile */}
        <div className="flex items-center gap-4 relative">
          <div className="relative hidden w-64 lg:block">
            <Search className={`absolute left-2.5 top-2.5 h-4 w-4 transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full bg-slate-100/50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              onFocus={() => { setIsSearchFocused(true); setShowRegion(false); setShowNotif(false); setShowProfile(false); }}
            />
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-10 left-0 w-full bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50 p-2"
                >
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1">Recent Searches</div>
                  <div onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer mt-1 transition-colors">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">run: <span className="font-mono text-xs">1234</span></span>
                  </div>
                  <div onClick={() => setIsSearchFocused(false)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700">S3 buckets must not be public</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => { setShowRegion(!showRegion); setShowNotif(false); setShowProfile(false); setIsSearchFocused(false); }}
              className={`flex items-center gap-1 border rounded-md px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm ${showRegion ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
              {activeRegion}
            </button>
            <AnimatePresence>
              {showRegion && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-10 w-48 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50 py-1">
                  {regions.map(r => (
                    <div key={r} onClick={() => { setActiveRegion(r); setShowRegion(false) }} className={`flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer ${activeRegion === r ? 'bg-slate-50 font-medium' : ''}`}>
                      <span>{r}</span>
                      {activeRegion === r && <Check className="h-4 w-4 text-blue-600" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative border-l border-slate-200 pl-4 ml-1 flex items-center">
            <button 
              onClick={() => { setShowNotif(!showNotif); setShowRegion(false); setShowProfile(false); setIsSearchFocused(false); }}
              className={`transition-colors p-1.5 rounded-md ${showNotif ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <AnimatePresence>
              {showNotif && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-10 w-80 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                        <div className="flex items-start justify-between mb-1">
                          <span className={`text-sm font-medium ${n.unread ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</span>
                          <span className="text-xs text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <span className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">View all alerts</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowRegion(false); setShowNotif(false); setIsSearchFocused(false); }}
              className={`h-8 w-8 ml-1 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all border break-inside-avoid ${showProfile ? 'ring-2 ring-blue-500 ring-offset-2 border-white shadow-md' : 'border-white hover:shadow-md'}`}
            >
              JD
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-10 w-56 bg-white border border-slate-200 shadow-lg rounded-md overflow-hidden z-50">
                   <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                     <p className="text-sm font-semibold text-slate-900">John Doe</p>
                     <p className="text-xs text-slate-500 truncate">johndoe@policyops.internal</p>
                   </div>
                   <div className="py-1">
                     <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 group">
                       <User className="h-4 w-4 text-slate-400 group-hover:text-blue-500" /> My Profile
                     </Link>
                     <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 group">
                       <Settings className="h-4 w-4 text-slate-400 group-hover:text-blue-500" /> Account Settings
                     </Link>
                   </div>
                   <div className="border-t border-slate-100 py-1">
                     <Link onClick={() => setShowProfile(false)} to="#" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                       <LogOut className="h-4 w-4" /> Sign out
                     </Link>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto relative px-0" onClick={() => setIsSearchFocused(false)}>
        <Outlet />
      </main>
    </div>
  )
}
