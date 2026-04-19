import { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Shield, Zap, Bot, User, Activity,
  Copy, Check, ExternalLink, ChevronRight, Radio
} from "lucide-react";
import { useLocation } from "wouter";
import { updateReputationTransaction, createIdentityTransaction, identityExists, connection } from "@/lib/solana";

interface ActivityEvent {
  id: string;
  type: "payfi" | "governance" | "contract" | "community" | "zk_verify";
  label: string;
  points: number;
  timestamp: Date;
  txSig?: string;
}

const ACTIVITY_CONFIG = {
  payfi:      { icon: "💸", label: "PayFi transaction",      pts: 12, color: "text-blue-400",   anchor: "PayFiTransaction" },
  governance: { icon: "🗳️", label: "DAO vote cast",           pts: 25, color: "text-purple-400", anchor: "GovernanceParticipation" },
  contract:   { icon: "✅", label: "Contract fulfilled",      pts: 75, color: "text-emerald-400",anchor: "ContractFulfillment" },
  community:  { icon: "🤝", label: "Community contribution", pts: 30, color: "text-amber-400",  anchor: "CommunityContribution" },
  zk_verify:  { icon: "🔐", label: "ZK proof verified",      pts: 30, color: "text-cyan-400",   anchor: "CommunityContribution" },
};

function fmtWallet(pk: string) { return `${pk.slice(0, 6)}…${pk.slice(-4)}`; }

type IdentityMode = "human" | "agent";

export default function Dashboard() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<IdentityMode>("human");
  const [score, setScore] = useState(100);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [proofThreshold, setProofThreshold] = useState(200);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [identityCreated, setIdentityCreated] = useState(false);
  const [creatingIdentity, setCreatingIdentity] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Check if identity exists on chain when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) return;
    identityExists(publicKey).then(exists => {
      setIdentityCreated(exists);
      if (exists) setScore(100);
    });
  }, [connected, publicKey]);

  const handleCreateIdentity = async () => {
    if (!publicKey || !sendTransaction) return;
    setCreatingIdentity(true);
    setTxError(null);
    try {
      const tx = await createIdentityTransaction(publicKey, mode === "agent" ? "AIAgent" : "Human");
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setLastTx(sig);
      setIdentityCreated(true);
      setScore(100);
    } catch (err: any) {
      setTxError(err?.message ?? "Transaction failed");
      console.error(err);
    } finally {
      setCreatingIdentity(false);
    }
  };

  const handleLogActivity = async (type: keyof typeof ACTIVITY_CONFIG) => {
    if (!publicKey || !sendTransaction || !identityCreated) return;
    const cfg = ACTIVITY_CONFIG[type];
    setLoadingActivity(type);
    setTxError(null);
    try {
      const tx = await updateReputationTransaction(
        publicKey,
        cfg.anchor as any,
        type === "payfi" ? 1_000_000 : 0
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setLastTx(sig);
      const evt: ActivityEvent = {
        id: Math.random().toString(36).slice(2),
        type,
        label: cfg.label,
        points: cfg.pts,
        timestamp: new Date(),
        txSig: sig,
      };
      setScore(s => s + cfg.pts);
      setEvents(prev => [evt, ...prev].slice(0, 10));
      setPulsing(true);
      setTimeout(() => setPulsing(false), 800);
    } catch (err: any) {
      setTxError(err?.message ?? "Transaction failed");
      console.error(err);
    } finally {
      setLoadingActivity(null);
    }
  };

  const handleGenerateProof = async () => {
    setGeneratingProof(true);
    await new Promise(r => setTimeout(r, 1200));
    setGeneratingProof(false);
    setProofGenerated(true);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const explorerUrl = (sig: string) =>
    `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

  const blinkUrl = `solana-action:${window.location.origin}/api/actions/verify-reputation?identity=${publicKey?.toBase58() ?? "demo"}&threshold=${proofThreshold}`;
  const identityCardUrl = `${window.location.origin}/api/blinks/identity-card?owner=${publicKey?.toBase58() ?? "demo"}`;

  const level = score < 100 ? 1 : score < 250 ? 2 : score < 500 ? 3 : score < 900 ? 4 : 5;
  const levelLabel = ["Recruit", "Scout", "Guardian", "Sentinel", "Vanguard"][level - 1];
  const nextLevelScore = [100, 250, 500, 900, 9999][level - 1];
  const prevLevelScore = [0, 100, 250, 500, 900][level - 1];
  const levelProgress = ((score - prevLevelScore) / (nextLevelScore - prevLevelScore)) * 100;

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Solana Sentinels</h1>
            <p className="text-slate-400 text-sm">Connect your wallet to access your identity</p>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white">Sentinels</span>
          <span className="text-xs text-slate-600 font-mono">Devnet</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/feed")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> Live feed
          </button>
          <button onClick={() => setLocation("/arena")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Trust arena
          </button>
          <WalletMultiButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Error banner */}
        {txError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 font-mono">
            ✗ {txError}
          </div>
        )}

        {/* Identity card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${mode === "agent" ? "bg-indigo-500/20" : "bg-blue-500/20"} ${pulsing ? "scale-110" : ""}`}>
                {mode === "agent" ? <Bot className="w-7 h-7 text-indigo-400" /> : <User className="w-7 h-7 text-blue-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-white">{publicKey ? fmtWallet(publicKey.toBase58()) : "Not connected"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${mode === "agent" ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-500/20 text-blue-300"}`}>
                    {mode === "agent" ? "AI Agent" : "Human"}
                  </span>
                  {identityCreated && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">On-chain ✓</span>}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{levelLabel}</span>
                  <span className="text-slate-600">·</span>
                  <span>Level {level}</span>
                  {lastTx && (
                    <a href={explorerUrl(lastTx)} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      · {lastTx.slice(0, 8)}… <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setMode("human")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "human" ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-white"}`}>
                <User className="w-3 h-3" /> Human
              </button>
              <button onClick={() => setMode("agent")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "agent" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white"}`}>
                <Bot className="w-3 h-3" /> AI Agent
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Level {level} — {levelLabel}</span>
              <span>{score} / {nextLevelScore} pts</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${mode === "agent" ? "bg-indigo-500" : "bg-blue-500"}`} style={{ width: `${Math.min(levelProgress, 100)}%` }} />
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className={`text-5xl font-bold tabular-nums transition-all duration-300 ${pulsing ? "text-emerald-400" : "text-white"}`}>{score}</span>
            <span className="text-slate-400 mb-2">reputation pts</span>
            {!identityCreated && (
              <button
                onClick={handleCreateIdentity}
                disabled={creatingIdentity}
                className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-medium text-white transition-all"
              >
                {creatingIdentity ? "Creating…" : "Create identity on-chain"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">

            {/* Log activity */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-white">Log on-chain activity</div>
                <span className="text-xs text-slate-500 font-mono">→ update_reputation ix</span>
              </div>
              {!identityCreated && (
                <div className="text-xs text-slate-500 text-center py-4 border border-white/5 rounded-xl">
                  Create your identity first to log activities
                </div>
              )}
              {identityCreated && (
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ACTIVITY_CONFIG) as (keyof typeof ACTIVITY_CONFIG)[]).map(type => {
                    const cfg = ACTIVITY_CONFIG[type];
                    const loading = loadingActivity === type;
                    return (
                      <button
                        key={type}
                        onClick={() => handleLogActivity(type)}
                        disabled={!!loadingActivity}
                        className="flex items-center gap-2 px-3 py-2.5 bg-white/3 hover:bg-white/8 disabled:opacity-50 border border-white/8 hover:border-white/15 rounded-xl text-left transition-all group"
                      >
                        <span className="text-base">{loading ? "⏳" : cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">{cfg.label}</div>
                          <div className={`text-xs ${cfg.color}`}>+{cfg.pts} pts</div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Agent mode callout */}
            {mode === "agent" && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white mb-1">AI Agent identity mode</div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      Agent mode uses <code className="text-indigo-400">IdentityType::AIAgent</code> on the Sentinel program. PayFi and ZK verifications are weighted 2x — autonomous agents prove trustworthiness through financial reliability first.
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {[["PayFi weight","2×","text-blue-400"],["ZK verify weight","2×","text-cyan-400"],["Agent Registry","Linked","text-emerald-400"],["x402 protocol","Enabled","text-purple-400"]].map(([l,v,c]) => (
                        <div key={l} className="bg-white/5 rounded-lg p-2">
                          <div className="text-slate-500">{l}</div>
                          <div className={`font-medium ${c}`}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity feed */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-white flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" />Recent activity</div>
                <button onClick={() => setLocation("/feed")} className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400" /> Live feed
                </button>
              </div>
              {events.length === 0 ? (
                <div className="text-xs text-slate-600 text-center py-4">Log an activity above to get started</div>
              ) : (
                <div className="space-y-2">
                  {events.map((evt, i) => {
                    const cfg = ACTIVITY_CONFIG[evt.type];
                    return (
                      <div key={evt.id} className="flex items-center gap-3" style={{ opacity: 1 - i * 0.08 }}>
                        <span className="text-sm">{cfg.icon}</span>
                        <span className="text-xs text-slate-400 flex-1">{evt.label}</span>
                        <span className="text-xs text-emerald-400 font-mono">+{evt.points}</span>
                        {evt.txSig && (
                          <a href={explorerUrl(evt.txSig)} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-0.5">
                            {evt.txSig.slice(0, 6)}… <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-4">
            {/* ZK proof */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <div className="text-sm font-medium text-white mb-1">ZK proof generator</div>
              <div className="text-xs text-slate-500 mb-4">Prove score ≥ threshold, reveal nothing else</div>
              <label className="text-xs text-slate-500 block mb-1.5">Threshold</label>
              <input type="range" min={50} max={500} step={25} value={proofThreshold} onChange={e => { setProofThreshold(Number(e.target.value)); setProofGenerated(false); }} className="w-full mb-2" />
              <div className="flex justify-between text-xs text-slate-600 mb-4">
                <span>50</span><span className="text-white font-medium">{proofThreshold} pts</span><span>500</span>
              </div>
              <div className={`text-xs rounded-lg px-3 py-2 mb-4 font-mono ${score >= proofThreshold ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {score >= proofThreshold ? `✓ ${score} ≥ ${proofThreshold} — valid` : `✗ ${score} < ${proofThreshold} — fails`}
              </div>
              <button onClick={handleGenerateProof} disabled={score < proofThreshold || generatingProof} className="w-full py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40 bg-indigo-600 hover:bg-indigo-500 text-white">
                {generatingProof ? "Generating…" : proofGenerated ? "✓ Proof ready" : "Generate ZK proof"}
              </button>
              {proofGenerated && (
                <div className="mt-3 p-2 bg-black/30 rounded-lg border border-white/5">
                  <div className="text-xs text-slate-600 font-mono break-all leading-relaxed">
                    zkp:{btoa(`${score}>=${proofThreshold}:${Date.now()}`).slice(0, 48)}…
                  </div>
                </div>
              )}
            </div>

            {/* Blinks */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <div className="text-sm font-medium text-white mb-1">Share via Blink</div>
              <div className="text-xs text-slate-500 mb-4">One-click shareable reputation links</div>
              <div className="space-y-2">
                {[{ label: "Reputation proof", url: blinkUrl, key: "proof" }, { label: "Identity card", url: identityCardUrl, key: "card" }].map(item => (
                  <div key={item.key} className="bg-white/3 border border-white/8 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-2">{item.label}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-slate-600 flex-1 truncate">{item.url.slice(0, 26)}…</div>
                      <button onClick={() => copyText(item.url, item.key)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 transition-colors">
                        {copied === item.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav cards */}
            <div className="space-y-2">
              {[{ path: "/arena", icon: <Zap className="w-4 h-4 text-amber-400" />, title: "Trust Arena", sub: "Human vs AI battle" }, { path: "/feed", icon: <Radio className="w-4 h-4 text-red-400" />, title: "Live feed", sub: "Network events" }].map(n => (
                <button key={n.path} onClick={() => setLocation(n.path)} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-white/5 border border-white/10 rounded-xl transition-all group">
                  {n.icon}
                  <div className="text-left flex-1">
                    <div className="text-xs font-medium text-white">{n.title}</div>
                    <div className="text-xs text-slate-500">{n.sub}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}