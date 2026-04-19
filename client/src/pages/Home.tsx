import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Zap, Lock, TrendingUp, Users, Bot, ArrowRight, Radio } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
    const { connected } = useWallet();
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Grid bg */}
            <div className="fixed inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

            <nav className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm sticky top-0">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-white">Solana Sentinels</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setLocation("/feed")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                            <Radio className="w-3 h-3 text-red-400 animate-pulse" /> Live feed
                        </button>
                        <button onClick={() => setLocation("/arena")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                            <Zap className="w-3 h-3 text-amber-400" /> Trust arena
                        </button>
                        <WalletMultiButton />
                    </div>
                </div>
            </nav>

            <div className="relative z-10">
                {/* Hero */}
                <section className="max-w-4xl mx-auto px-6 py-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs mb-8 font-mono">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Built for Solana Hackathon 2026
                    </div>
                    <h1 className="text-6xl font-bold leading-tight mb-6">
                        The trust layer for<br />
                        <span className="text-indigo-400">the agentic economy</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                        ZK-compressed identity and reputation for humans and AI agents. One program, universal trust.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {connected ? (
                            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-all">
                                Open dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <WalletMultiButton />
                        )}
                        <button onClick={() => setLocation("/arena")} className="flex items-center gap-2 px-6 py-3 border border-white/15 hover:border-white/30 rounded-xl text-sm transition-all">
                            <Zap className="w-4 h-4 text-amber-400" /> Watch the arena
                        </button>
                    </div>
                </section>

                {/* Unique features highlight */}
                <section className="max-w-6xl mx-auto px-6 pb-16">
                    <div className="grid grid-cols-3 gap-4 mb-16">
                        {[
                            {
                                icon: <Bot className="w-5 h-5 text-indigo-400" />,
                                tag: "UNIQUE",
                                title: "Human vs AI Trust Arena",
                                desc: "Watch a live battle between human and AI agent reputation building. Same program, same rules — the machines are learning fast.",
                                cta: "Enter arena",
                                path: "/arena",
                                color: "border-indigo-500/30 bg-indigo-500/5",
                            },
                            {
                                icon: <Radio className="w-5 h-5 text-red-400" />,
                                tag: "LIVE",
                                title: "Real-time reputation feed",
                                desc: "Watch the Solana Sentinels network accumulate reputation events as they happen — PayFi transactions, DAO votes, ZK verifications.",
                                cta: "View live feed",
                                path: "/feed",
                                color: "border-red-500/20 bg-red-500/5",
                            },
                            {
                                icon: <Shield className="w-5 h-5 text-emerald-400" />,
                                tag: "CORE",
                                title: "ZK-compressed identity",
                                desc: "One Anchor program handles both IdentityType::Human and IdentityType::AIAgent. Prove reputation thresholds with zero-knowledge proofs.",
                                cta: "Get your identity",
                                path: "/dashboard",
                                color: "border-emerald-500/20 bg-emerald-500/5",
                            },
                        ].map(f => (
                            <div key={f.title} className={`rounded-2xl border ${f.color} p-6 flex flex-col`}>
                                <div className="flex items-center gap-2 mb-4">
                                    {f.icon}
                                    <span className="text-xs font-mono text-slate-500">{f.tag}</span>
                                </div>
                                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-400 flex-1 mb-4 leading-relaxed">{f.desc}</p>
                                <button onClick={() => setLocation(f.path)} className="flex items-center gap-1.5 text-sm text-white hover:opacity-80 transition-opacity">
                                    {f.cta} <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* How it works */}
                    <div className="border border-white/10 rounded-2xl p-8 bg-slate-900">
                        <h2 className="text-xl font-bold text-white mb-6">Why this matters right now</h2>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                                <p>AI agents are about to transact with your money. They'll buy tokens, pay for APIs, fulfill contracts — all autonomously. The question is: <strong className="text-white">how does anyone trust them?</strong></p>
                                <p>Existing identity systems were built for humans. Solana Sentinels is the first system designed from the ground up for the agentic economy — where the same trust infrastructure serves both people and the AI agents they deploy.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: <Lock className="w-4 h-4 text-blue-400" />, title: "ZK-Compressed", desc: "10,000x cheaper state storage on Solana L1" },
                                    { icon: <Zap className="w-4 h-4 text-amber-400" />, title: "Blinks native", desc: "Share reputation anywhere via solana-action: links" },
                                    { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, title: "PayFi verified", desc: "Financial history builds real, on-chain reputation" },
                                    { icon: <Users className="w-4 h-4 text-purple-400" />, title: "Agent Registry", desc: "Linked to Solana Foundation Agent Registry" },
                                ].map(s => (
                                    <div key={s.title} className="bg-white/3 border border-white/8 rounded-xl p-3">
                                        {s.icon}
                                        <div className="text-xs font-medium text-white mt-2 mb-0.5">{s.title}</div>
                                        <div className="text-xs text-slate-500">{s.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-600 font-mono">
                    Solana Sentinels © 2026 · Built for Solana Hackathon · Devnet
                </footer>
            </div>
        </div>
    );
}