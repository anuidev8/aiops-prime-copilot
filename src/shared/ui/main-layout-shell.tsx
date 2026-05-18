"use client";

import React from "react";
import Link from "next/link";

function SidebarIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 opacity-60">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );
}

export function MainLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#0b0f19]/80 backdrop-blur-xl flex flex-col p-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
            {/* Avatar placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-900" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Farhad Hosen</div>
            <div className="text-xs text-slate-500">ID: 942-X01</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-4 px-2">Project</div>
          
          <Link href="/aiops" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-transparent border border-cyan-500/30 text-white shadow-[inset_4px_0_0_0_rgba(0,240,255,1),0_0_15px_0_rgba(0,240,255,0.1)] transition-all">
            <SidebarIcon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M3 3v18h18 M3 16l4-4 4 4 4-4 4 4" />
            <span className="text-sm">Markets</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M12 2v20 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            <span className="text-sm">Risk</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            <span className="text-sm">Portfolio</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <span className="text-sm">Logs</span>
          </Link>

          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 mt-6 px-2">Project</div>
          
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <span className="text-sm">Settings</span>
          </Link>

          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <SidebarIcon path="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <span className="text-sm">Support</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-[#0b0f19]/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {["Ingest", "Features", "Agents", "Execute"].map((tab) => (
              <button key={tab} className="px-4 py-1.5 rounded-full text-xs font-medium border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-2 bg-slate-900/30">
                <div className="w-3 h-3 rounded-sm border border-current opacity-60" />
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search" 
                className="w-64 bg-slate-900/50 border border-slate-700/50 rounded-full pl-9 pr-12 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <span className="px-1 border border-slate-700 rounded">⌘</span>
                <span className="px-1 border border-slate-700 rounded">K</span>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700/50 text-xs font-medium text-slate-300 bg-slate-900/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Pipeline live
            </button>

            <button className="px-5 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all border border-cyan-400/30">
              Recalibrate
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 relative z-0">
          {children}
        </div>
      </div>
    </div>
  );
}
