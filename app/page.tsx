export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-hidden px-4">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-slate-300 blur-[130px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[130px] rounded-full animate-pulse px-4" />
            </div>

            <div className="relative z-10 text-center max-w-2xl w-full">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center p-4 border border-slate-200 dark:border-slate-700">
                        <img src="/logo.png" alt="Brownmine Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Institutional Intelligence</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                    Brownmine <span className="text-indigo-600 dark:text-indigo-400">Portal</span>
                </h1>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium max-w-lg mx-auto">
                    Secure interface for localized business intelligence. Access your personalized dashboard using your provided institutional token.
                </p>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto w-full">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Secure Authentication</h2>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 mb-6 break-all">
                        /demo/[access-token]
                    </div>
                    <a
                        href="/demo/test-token-123"
                        className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        Access Sample Dashboard
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </a>
                </div>

                <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">
                    © 2026 Brownmine Data Solutions
                </p>
            </div>
        </div>
    );
}
