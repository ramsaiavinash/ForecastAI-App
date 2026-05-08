import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FileText,
  CheckCircle,
  Shield,
  FolderOpen,
  Download,
  ChevronLeft,
  Menu,
  X,
  TrendingUp,
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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
        }}
        transition={{ duration: 0.3 }}
        className="relative hidden md:flex flex-col border-r border-slate-800"
        style={{ backgroundColor: "#0f172a" }}
      >
        {/* Logo Area */}
        <motion.div
          className="flex flex-col items-center justify-center py-8 px-4 border-b border-slate-800"
          animate={{ gap: isCollapsed ? 0 : 12 }}
        >
          <motion.div
            animate={{
              scale: isCollapsed ? 1 : 1,
            }}
            className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-lg"
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-center"
              >
                <div className="text-sm font-bold text-white">Revenue Forecast</div>
                <div className="text-xs text-emerald-500">FY 2026</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors relative group border-l-4 ${
                  isActive
                    ? "border-l-emerald-500 bg-slate-900/30 text-emerald-500"
                    : "border-l-transparent text-slate-400 hover:text-white hover:bg-slate-900/20"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/20 transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-72 border-r border-slate-800 z-40 md:hidden flex flex-col"
            style={{ backgroundColor: "#0f172a" }}
          >
            {/* Logo Area */}
            <div className="flex flex-col items-center justify-center py-8 px-4 border-b border-slate-800">
              <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-white font-bold text-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-center mt-3">
                <div className="text-sm font-bold text-white">Revenue Forecast</div>
                <div className="text-xs text-emerald-500">FY 2026</div>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map(({ icon: Icon, label, path }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors border-l-4 ${
                      isActive
                        ? "border-l-emerald-500 bg-slate-900/30 text-emerald-500"
                        : "border-l-transparent text-slate-400 hover:text-white hover:bg-slate-900/20"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Close Button */}
            <div className="px-4 py-4 border-t border-slate-800">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/20 transition-colors"
              >
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-900" />
          </button>
          <div className="text-lg font-bold text-slate-900">Revenue Forecast</div>
          <div className="w-10" />
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}