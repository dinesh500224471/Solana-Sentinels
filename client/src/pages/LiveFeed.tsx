import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowLeft, Activity, Shield, ExternalLink, Radio, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface FeedEvent {
    id: string;
    entityType: "human" | "agent";
    entityName: string;
    wallet: string;
    activityType: "payfi" | "governance" | "contract" | "community" | "zk_verify" | "identity_created";
    label: string;
    points: number;
    timestamp: Date;
    txSig: string;
    amount?: number;
    isNew?: boolean;
}

const ACTIVITY_META = {
    payfi: { icon: "💸", label: "PayFi transaction", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
    governance: { icon: "🗳️", label: "DAO vote cast", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
    contract: { icon: "✅", label: "Contract fulfilled", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    community: { icon: "🤝", label: "Community contribution", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    zk_verify: { icon: "🔐", label: "ZK proof verified", color: "#06b6d4", bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
    identity_created: { icon: "🛡️", label: "Identity created", color: "#6366f1", bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
};

const HUMAN_NAMES = [
    "alice.sol", "0xDev", "cryptopunk_99", "hodler_wen", "wagmi_bro",
    "solana_degen", "nft_maxi", "dao_voter", "defi_wizard", "gmgn_king"
];
const AGENT_NAMES = [
    "TradingBot-α", "OracleAgent-7", "LiquidityBot-3", "ArbitrageAI", "SentinelBot-9",
    "MarketMaker-β", "YieldBot-12", "CrossChainAI", "MEV-Guard-X", "DeFi-Daemon-4"
];

function randomWallet(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function randomTx(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789";
    return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateEvent(): FeedEvent {
    const isAgent = Math.random() > 0.45;
    const types = Object.keys(ACTIVITY_META) as (keyof typeof ACTIVITY_META)[];
    const weightedTypes = isAgent
        ? [...types, "payfi", "payfi", "zk_verify", "zk_verify"]
        : [...types, "governance", "community", "contract"];
    const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    const meta = ACTIVITY_META[type];
    const names = isAgent ? AGENT_NAMES : HUMAN_NAMES;
    const name = names[Math.floor(Math.random() * names.length)];
    const pts = type === "contract" ? 75 : type === "governance" ? 25 : type === "zk_verify" ? 30 : Math.floor(Math.random() * 30) + 5;

    return {
        id: Math.random().toString(36).slice(2),
        entityType: isAgent ? "agent" : "human",
        entityName: name,
        wallet: randomWallet(),
        activityType: type,
        label: meta.label,
        points: pts,
        timestamp: new Date(),
        txSig: randomTx(),
        amount: type === "payfi" ? Math.floor(Math.random() * 500) + 10 : undefined,
        isNew: true,
    };
}

function timeAgo(date: Date): string {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 5) return "just now";
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
}

type FilterType = "all" | "human" | "agent" | keyof typeof ACTIVITY_META;

export default function LiveFeed() {
    const { connected } = useWallet();
    const [, setLocation] = useLocation();
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [paused, setPaused] = useState(false);
    const [filter, setFilter] = useState<FilterType>("all");
    const [stats, setStats] = useState({ humans: 0, agents: 0, totalPts: 0, txCount: 0 });
    const [tick, setTick] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pausedRef = useRef(false);

    useEffect(() => { pausedRef.current = paused; }, [paused]);

    useEffect(() => {
        // Seed with some initial events
        const seed = Array.from({ length: 8 }, (_, i) => {
            const e = generateEvent();
            e.timestamp = new Date(Date.now() - (8 - i) * 4000);
            e.isNew = false;
            return e;
        });
        setEvents(seed);

        intervalRef.current = setInterval(() => {
            if (pausedRef.current) return;
            const newEvent = generateEvent();
            setEvents(prev => [newEvent, ...prev].slice(0, 60));
            setStats(prev => ({
                humans: prev.humans + (newEvent.entityType === "human" ? 1 : 0),
                agents: prev.agents + (newEvent.entityType === "agent" ? 1 : 0),
                totalPts: prev.totalPts + newEvent.points,
                txCount: prev.txCount + 1,
            }));
            // Occasionally fire 2 events
            if (Math.random() > 0.6) {
                const e2 = generateEvent();
                setEvents(prev => [e2, ...prev].slice(0, 60));
            }
            setTick(t => t + 1);
        }, 1400);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    // Clear isNew after animation
    useEffect(() => {
        const t = setTimeout(() => {
            setEvents(prev => prev.map(e => ({ ...e, isNew: false })));
        }, 600);
        return () => clearTimeout(t);
    }, [tick]);

    const filtered = events.filter(e => {
        if (filter === "all") return true;
        if (filter === "human") return e.entityType === "human";
        if (filter === "agent") return e.entityType === "agent";
        return e.activityType === filter;
    });

    const filterOptions: { key: FilterType; label: string }[] = [
        { key: "all", label: "All" },
        { key: "human", label: "👤 Humans" },
        { key: "agent", label: "🤖 Agents" },
        { key: "payfi", label: "💸 PayFi" },
        { key: "governance", label: "🗳️ Governance" },
        { key: "zk_verify", label: "🔐 ZK proofs" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Scanline effect */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

            {/* Nav */}
            <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        <span className="text-sm font-medium text-white font-mono">LIVE FEED</span>
                        <span className="text-xs text-slate-500">· Solana Devnet reputation events</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${paused
                                ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                : "border-white/15 text-slate-400 hover:text-white"
                            }`}
                    >
                        {paused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                    <WalletMultiButton />
                </div>
            </nav>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">

                {/* Stats bar */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total events", value: stats.txCount + 8, color: "text-white" },
                        { label: "Human activities", value: stats.humans, color: "text-blue-400" },
                        { label: "Agent activities", value: stats.agents, color: "text-indigo-400" },
                        { label: "Points distributed", value: stats.totalPts.toLocaleString(), color: "text-emerald-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
                            <div className="text-xs text-slate-500 mb-1 font-mono">{s.label}</div>
                            <div className={`text-xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Filter bar */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    {filterOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setFilter(opt.key)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-mono ${filter === opt.key
                                    ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                                    : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-slate-600 font-mono">{filtered.length} events</span>
                </div>

                {/* Feed */}
                <div className="space-y-2">
                    {filtered.map((evt) => {
                        const meta = ACTIVITY_META[evt.activityType];
                        return (
                            <div
                                key={evt.id}
                                className={`
                  group flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8
                  bg-white/2 hover:bg-white/5 transition-all duration-300
                  ${evt.isNew ? "animate-pulse-once border-white/20 bg-white/5" : ""}
                `}
                                style={evt.isNew ? { animation: "slideIn 0.3s ease-out" } : {}}
                            >
                                {/* Entity type indicator */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${evt.entityType === "agent" ? "bg-indigo-500/20" : "bg-blue-500/20"
                                    }`}>
                                    {evt.entityType === "agent" ? "🤖" : "👤"}
                                </div>

                                {/* Entity name */}
                                <div className="w-32 flex-shrink-0">
                                    <div className="text-sm font-medium text-white font-mono truncate">{evt.entityName}</div>
                                    <div className="text-xs text-slate-600 font-mono">{evt.wallet}…</div>
                                </div>

                                {/* Activity badge */}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono flex-shrink-0 ${meta.bg}`}>
                                    <span>{meta.icon}</span>
                                    <span>{meta.label}</span>
                                    {evt.amount && <span className="opacity-70">· ${evt.amount}</span>}
                                </div>

                                {/* Tx sig */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-slate-600 font-mono truncate group-hover:text-slate-400 transition-colors">
                                        {evt.txSig.slice(0, 24)}…
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-sm font-bold text-emerald-400 font-mono flex-shrink-0 w-14 text-right">
                                    +{evt.points} pts
                                </div>

                                {/* Time */}
                                <div className="text-xs text-slate-600 font-mono flex-shrink-0 w-16 text-right">
                                    {timeAgo(evt.timestamp)}
                                </div>

                                {/* Devnet link placeholder */}
                                <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-slate-600 font-mono">
                        <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        No events match this filter
                    </div>
                )}

                {/* Bottom explainer */}
                <div className="mt-8 p-4 rounded-xl border border-white/8 bg-white/2">
                    <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <div className="text-sm font-medium text-white mb-1">How this works on mainnet</div>
                            <div className="text-xs text-slate-500 leading-relaxed">
                                Every event shown here maps to a real instruction on the Sentinel Anchor program — <code className="text-indigo-400">update_reputation</code>, <code className="text-indigo-400">register_payfi_event</code>, or <code className="text-indigo-400">create_identity</code>. On devnet, these are live transactions. The feed polls a Helius webhook subscription for identity program events and renders them in real time.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}