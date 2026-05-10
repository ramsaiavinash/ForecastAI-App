import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Upload, FileText, CheckCircle,
  Shield, FolderOpen, Download, ChevronLeft, Menu, X, TrendingUp,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Upload, label: "Import", path: "/import" },
  { icon: FileText, label: "Batch Review", path: "/batches" },
  { icon: CheckCircle, label: "PL Approval", path: "/approval/pl" },
  { icon: Shield, label: "PH Approval", path: "/approval/ph" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Download, label: "Export", path: "/export" },
];

export function SidebarLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = () => {
    if (isMobileOpen) setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? "64px" : "260px" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed left-0 top-0 bottom-0 hidden md:flex flex-col flex-shrink-0"
        style={{ backgroundColor: "#0a0f1e" }}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-sm font-bold text-white leading-tight">Revenue Forecast</div>
                <div className="text-xs text-green-400 font-medium">FY 2026</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group ${
                  isActive
                    ? "bg-slate-700/60 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-400 rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-green-400" : ""}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`text-sm whitespace-nowrap ${isActive ? "font-semibold text-white" : "font-medium"}`}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-slate-700/50">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform flex-shrink-0 ${isCollapsed ? "rotate-180" : ""}`} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ duration: 0.25 }}
            className="fixed left-0 top-0 bottom-0 w-56 z-40 md:hidden flex flex-col"
            style={{ backgroundColor: "#0a0f1e" }}
          >
            <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Revenue Forecast</div>
                <div className="text-xs text-green-400 font-medium">FY 2026</div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map(({ icon: Icon, label, path }) => (
                <NavLink
                  key={path} to={path} onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                      isActive ? "bg-slate-700/60 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-400 rounded-r-full" />}
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-green-400" : ""}`} />
                      <span className={`text-sm ${isActive ? "font-semibold text-white" : "font-medium"}`}>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-2 py-3 border-t border-slate-700/50">
              <button onClick={() => setIsMobileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 ml-[260px]">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-base font-bold text-slate-900">Revenue Forecast</div>
          <div className="w-9" />
        </div>
        <main className="flex-1 overflow-auto px-4 py-4" style={{ backgroundColor: "#f1f5f9" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
