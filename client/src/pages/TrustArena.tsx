import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Zap, Bot, User, Activity, ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface Entity {
    id: string;
    name: string;
    type: "human" | "agent";
    score: number;
    events: ReputationEvent[];
    level: number;
    streak: number;
}

interface ReputationEvent {
    id: string;
    type: "payfi" | "governance" | "contract" | "community" | "zk_verify";
    label: string;
    points: number;
    timestamp: Date;
    txSig?: string;
}

const EVENT_TYPES = {
    payfi: { label: "PayFi transaction", points: [8, 15, 22], color: "#3b82f6", icon: "💸" },
    governance: { label: "DAO vote cast", points: [25, 25, 25], color: "#8b5cf6", icon: "🗳️" },
    contract: { label: "Contract fulfilled", points: [50, 75, 100], color: "#10b981", icon: "✅" },
    community: { label: "Community contribution", points: [20, 35, 50], color: "#f59e0b", icon: "🤝" },
    zk_verify: { label: "ZK proof verified", points: [30, 30, 30], color: "#06b6d4", icon: "🔐" },
};

function randomTxSig(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789";
    return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getLevel(score: number): number {
    if (score < 100) return 1;
    if (score < 250) return 2;
    if (score < 500) return 3;
    if (score < 900) return 4;
    return 5;
}

function getLevelLabel(level: number): string {
    return ["Recruit", "Scout", "Guardian", "Sentinel", "Vanguard"][level - 1];
}

export default function TrustArena() {
    const { connected, publicKey } = useWallet();
    const [, setLocation] = useLocation();
    const [running, setRunning] = useState(false);
    const [round, setRound] = useState(0);
    const [winner, setWinner] = useState<"human" | "agent" | null>(null);
    const [floatingPoints, setFloatingPoints] = useState<{ id: string; points: number; x: number; y: number; side: "left" | "right" }[]>([]);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const humanName = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
        : "HumanWallet";

    const [human, setHuman] = useState<Entity>({
        id: "human",
        name: humanName,
        type: "human",
        score: 100,
        events: [],
        level: 1,
        streak: 0,
    });

    const [agent, setAgent] = useState<Entity>({
        id: "agent",
        name: "SentinelBot-7",
        type: "agent",
        score: 100,
        events: [],
        level: 1,
        streak: 0,
    });

    const fireEvent = useCallback((entity: "human" | "agent") => {
        const types = Object.keys(EVENT_TYPES) as (keyof typeof EVENT_TYPES)[];
        // Agents skew toward payfi and zk_verify; humans toward governance and community
        const weightedTypes = entity === "agent"
            ? [...types, "payfi", "payfi", "zk_verify", "zk_verify", "contract"]
            : [...types, "governance", "governance", "community", "community", "contract"];
        const type = weightedTypes[Math.floor(Math.random() * weightedTypes.length)] as keyof typeof EVENT_TYPES;
        const cfg = EVENT_TYPES[type];
        const pts = cfg.points[Math.floor(Math.random() * cfg.points.length)];
        const event: ReputationEvent = {
            id: Math.random().toString(36).slice(2),
            type,
            label: cfg.label,
            points: pts,
            timestamp: new Date(),
            txSig: randomTxSig(),
        };

        const side = entity === "human" ? "left" : "right";
        const fp = {
            id: Math.random().toString(36).slice(2),
            points: pts,
            x: Math.random() * 40 + 10,
            y: Math.random() * 40 + 20,
            side,
        };
        setFloatingPoints(prev => [...prev, fp]);
        setTimeout(() => setFloatingPoints(prev => prev.filter(f => f.id !== fp.id)), 1200);

        if (entity === "human") {
            setHuman(prev => {
                const newScore = prev.score + pts;
                return {
                    ...prev,
                    score: newScore,
                    level: getLevel(newScore),
                    streak: prev.streak + 1,
                    events: [event, ...prev.events].slice(0, 12),
                };
            });
        } else {
            setAgent(prev => {
                const newScore = prev.score + pts;
                return {
                    ...prev,
                    score: newScore,
                    level: getLevel(newScore),
                    streak: prev.streak + 1,
                    events: [event, ...prev.events].slice(0, 12),
                };
            });
        }
    }, []);

    const startArena = () => {
        setRound(0);
        setWinner(null);
        setHuman(prev => ({ ...prev, score: 100, events: [], level: 1, streak: 0 }));
        setAgent(prev => ({ ...prev, score: 100, events: [], level: 1, streak: 0 }));
        setRunning(true);
    };

    const stopArena = () => {
        setRunning(false);
        if (tickRef.current) clearInterval(tickRef.current);
    };

    useEffect(() => {
        if (!running) return;
        let r = 0;
        const MAX_ROUNDS = 30;
        tickRef.current = setInterval(() => {
            r++;
            setRound(r);
            // Each tick: fire 1-2 events per entity with some randomness
            if (Math.random() > 0.3) fireEvent("human");
            if (Math.random() > 0.2) fireEvent("agent"); // agents slightly faster
            if (Math.random() > 0.6) fireEvent("human");
            if (Math.random() > 0.5) fireEvent("agent");

            if (r >= MAX_ROUNDS) {
                clearInterval(tickRef.current!);
                setRunning(false);
                setHuman(h => {
                    setAgent(a => {
                        setWinner(h.score >= a.score ? "human" : "agent");
                        return a;
                    });
                    return h;
                });
            }
        }, 800);
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [running, fireEvent]);

    useEffect(() => {
        if (publicKey) {
            setHuman(prev => ({ ...prev, name: `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` }));
        }
    }, [publicKey]);

    const maxScore = Math.max(human.score, agent.score, 200);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-mono relative overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
            }} />

            {/* Nav */}
            <nav className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setLocation("/dashboard")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm text-emerald-400 font-medium">TRUST ARENA</span>
                        <span className="text-xs text-slate-500">· Solana Devnet</span>
                    </div>
                </div>
                <WalletMultiButton />
            </nav>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        <span className="text-white">Human </span>
                        <span className="text-slate-500">vs</span>
                        <span className="text-indigo-400"> AI Agent</span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Live on-chain reputation battle · Round {round}/30
                    </p>
                </div>

                {/* Progress bar for round */}
                <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${(round / 30) * 100}%` }}
                    />
                </div>

                {/* Winner banner */}
                {winner && (
                    <div className={`mb-6 rounded-xl border p-4 flex items-center justify-center gap-3 ${winner === "human"
                            ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        }`}>
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold text-lg">
                            {winner === "human" ? `${human.name} wins!` : `${agent.name} wins!`}
                        </span>
                        <span className="text-sm opacity-70">
                            {winner === "human"
                                ? `${human.score} pts — Humans still got it.`
                                : `${agent.score} pts — The machines are rising.`}
                        </span>
                    </div>
                )}

                {/* Arena */}
                <div className="grid grid-cols-2 gap-4 mb-6 relative">

                    {/* Floating point indicators */}
                    {floatingPoints.map(fp => (
                        <div
                            key={fp.id}
                            className="absolute pointer-events-none z-20 font-bold text-emerald-400 text-sm animate-bounce"
                            style={{
                                left: fp.side === "left" ? `${fp.x}%` : `${50 + fp.x / 2}%`,
                                top: `${fp.y}%`,
                                animation: "floatUp 1.2s ease-out forwards",
                            }}
                        >
                            +{fp.points}
                        </div>
                    ))}

                    {/* Human side */}
                    <EntityPanel entity={human} isWinner={winner === "human"} maxScore={maxScore} color="blue" />

                    {/* Agent side */}
                    <EntityPanel entity={agent} isWinner={winner === "agent"} maxScore={maxScore} color="indigo" />
                </div>

                {/* VS divider with live score diff */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-400">
                        {Math.abs(human.score - agent.score)} pt difference
                    </div>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    {!running && !winner && (
                        <Button
                            onClick={startArena}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-11 text-sm font-medium"
                        >
                            <Zap className="w-4 h-4" />
                            Start arena battle
                        </Button>
                    )}
                    {running && (
                        <Button
                            onClick={stopArena}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 px-8 h-11 text-sm"
                        >
                            Stop
                        </Button>
                    )}
                    {winner && (
                        <Button
                            onClick={startArena}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-11 text-sm font-medium"
                        >
                            Run again
                        </Button>
                    )}
                    <Button
                        onClick={() => setLocation("/dashboard")}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 px-6 h-11 text-sm"
                    >
                        View my identity
                    </Button>
                </div>

                {/* Explainer */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    {[
                        { icon: "🔐", title: "ZK-Compressed", desc: "All identity state stored as compressed Merkle trees on Solana L1" },
                        { icon: "⚡", title: "Same program, two identities", desc: "The Sentinel program treats humans and AI agents identically" },
                        { icon: "🏛️", title: "Trust is portable", desc: "Reputation follows the wallet across every dApp in the ecosystem" },
                    ].map(item => (
                        <div key={item.title} className="bg-white/3 border border-white/8 rounded-xl p-4">
                            <div className="text-xl mb-2">{item.icon}</div>
                            <div className="text-xs font-medium text-white mb-1">{item.title}</div>
                            <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }
      `}</style>
        </div>
    );
}

function EntityPanel({ entity, isWinner, maxScore, color }: {
    entity: Entity;
    isWinner: boolean;
    maxScore: number;
    color: "blue" | "indigo";
}) {
    const isHuman = entity.type === "human";
    const borderColor = isWinner ? (color === "blue" ? "border-blue-400" : "border-indigo-400") : "border-white/10";
    const accentColor = color === "blue" ? "text-blue-400" : "text-indigo-400";
    const barColor = color === "blue" ? "bg-blue-500" : "bg-indigo-500";
    const bgGlow = isWinner ? (color === "blue" ? "bg-blue-500/5" : "bg-indigo-500/5") : "bg-white/2";

    return (
        <div className={`rounded-xl border ${borderColor} ${bgGlow} p-5 transition-all duration-300 relative overflow-hidden`}>
            {isWinner && (
                <div className="absolute top-3 right-3">
                    <Trophy className={`w-4 h-4 ${accentColor}`} />
                </div>
            )}

            {/* Identity header */}
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === "blue" ? "bg-blue-500/20" : "bg-indigo-500/20"}`}>
                    {isHuman ? <User className={`w-5 h-5 ${accentColor}`} /> : <Bot className={`w-5 h-5 ${accentColor}`} />}
                </div>
                <div>
                    <div className="font-bold text-sm text-white font-mono">{entity.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs ${accentColor}`}>{getLevelLabel(entity.level)}</span>
                        <span className="text-xs text-slate-600">· Lv.{entity.level}</span>
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <div className={`text-2xl font-bold ${accentColor} tabular-nums`}>{entity.score}</div>
                    <div className="text-xs text-slate-500">pts</div>
                </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-2 bg-white/5 rounded-full mb-5 overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${(entity.score / maxScore) * 100}%` }}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2.5">
                    <div className="text-xs text-slate-500 mb-0.5">Activities</div>
                    <div className="text-sm font-bold text-white">{entity.events.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                    <div className="text-xs text-slate-500 mb-0.5">Streak</div>
                    <div className="text-sm font-bold text-white">{entity.streak}</div>
                </div>
            </div>

            {/* Live event feed */}
            <div className="space-y-1.5 max-h-48 overflow-hidden">
                {entity.events.slice(0, 6).map((evt, i) => {
                    const cfg = EVENT_TYPES[evt.type];
                    return (
                        <div
                            key={evt.id}
                            className="flex items-center gap-2 text-xs"
                            style={{ opacity: 1 - i * 0.12 }}
                        >
                            <span>{cfg.icon}</span>
                            <span className="text-slate-400 flex-1 truncate">{evt.label}</span>
                            <span className="text-emerald-400 font-medium">+{evt.points}</span>
                        </div>
                    );
                })}
                {entity.events.length === 0 && (
                    <div className="text-xs text-slate-600 text-center py-2">Waiting for activity…</div>
                )}
            </div>

            {/* Latest tx */}
            {entity.events[0]?.txSig && (
                <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-slate-600 truncate font-mono">
                        {entity.events[0].txSig.slice(0, 20)}…
                    </div>
                </div>
            )}
        </div>
    );
}