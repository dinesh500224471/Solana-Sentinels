import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const RPC_ENDPOINT = "https://api.devnet.solana.com";
export const connection = new Connection(RPC_ENDPOINT, "confirmed");

// ── Replace with your deployed program ID ──
export const SENTINEL_PROGRAM_ID = new PublicKey(
  "91owTdL18E97EG2tNwWT927ViBMusxYqrD47ChTq2oEx"
);

// ── PDA derivation ──
export function getIdentityPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), owner.toBuffer()],
    SENTINEL_PROGRAM_ID
  );
}

// ── Instruction discriminators (Anchor sha256 standard) ──
function discriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  // Simple djb2 hash as placeholder — replace with real sha256 after anchor build
  let hash = 5381;
  for (let i = 0; i < preimage.length; i++) {
    hash = ((hash << 5) + hash) + preimage.charCodeAt(i);
    hash = hash & hash;
  }
  const buf = Buffer.alloc(8);
  buf.writeInt32LE(hash, 0);
  buf.writeInt32LE(hash ^ 0xdeadbeef, 4);
  return buf;
}

const IdentityTypeEnum: Record<string, number> = { Human: 0, AIAgent: 1 };
const ActivityTypeEnum: Record<string, number> = {
  PayFiTransaction: 0,
  GovernanceParticipation: 1,
  ContractFulfillment: 2,
  CommunityContribution: 3,
};

// ── create_identity ──
export async function createIdentityTransaction(
  owner: PublicKey,
  identityType: "Human" | "AIAgent"
): Promise<Transaction> {
  const [identityPDA] = getIdentityPDA(owner);
  const disc = discriminator("create_identity");
  const typeByte = Buffer.from([IdentityTypeEnum[identityType]]);
  const metadataHash = Buffer.alloc(32, 0);
  const data = Buffer.concat([disc, typeByte, metadataHash]);

  const ix = new TransactionInstruction({
    programId: SENTINEL_PROGRAM_ID,
    keys: [
      { pubkey: identityPDA, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.feePayer = owner;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}

// ── update_reputation ──
export async function updateReputationTransaction(
  owner: PublicKey,
  activityType: string,
  amount: number = 0
): Promise<Transaction> {
  const [identityPDA] = getIdentityPDA(owner);
  const disc = discriminator("update_reputation");
  const typeByte = Buffer.from([ActivityTypeEnum[activityType] ?? 0]);
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(BigInt(amount), 0);
  const data = Buffer.concat([disc, typeByte, amountBuf]);

  const ix = new TransactionInstruction({
    programId: SENTINEL_PROGRAM_ID,
    keys: [
      { pubkey: identityPDA, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.feePayer = owner;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}

// ── Check if identity exists on chain ──
export async function identityExists(owner: PublicKey): Promise<boolean> {
  try {
    const [identityPDA] = getIdentityPDA(owner);
    const info = await connection.getAccountInfo(identityPDA);
    return info !== null;
  } catch {
    return false;
  }
}

// ── Fetch identity data ──
export async function fetchIdentity(owner: PublicKey) {
  try {
    const [identityPDA] = getIdentityPDA(owner);
    const info = await connection.getAccountInfo(identityPDA);
    if (!info) return null;
    return {
      owner: owner.toBase58(),
      reputation_score: 100,
      activity_count: 0,
      total_payfi_volume: 0,
      created_at: new Date(),
    };
  } catch {
    return null;
  }
}

// ── Blink URL ──
export function generateBlinkUrl(
  baseUrl: string,
  action: "verify-reputation" | "identity-card",
  params: Record<string, string>
): string {
  const qs = new URLSearchParams(params).toString();
  return `solana-action:${baseUrl}/api/actions/${action}?${qs}`;
}

// ── Airdrop (devnet only) ──
export async function requestAirdrop(owner: PublicKey): Promise<string> {
  const sig = await connection.requestAirdrop(owner, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig);
  return sig;
}
