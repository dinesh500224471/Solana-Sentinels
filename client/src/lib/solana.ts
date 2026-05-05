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

// ── Your deployed program ID ──
export const SENTINEL_PROGRAM_ID = new PublicKey(
  "91owTdL18E97EG2tNwWT927ViBMusxYqrD47ChTq2oEx"
);

// ── Correct Anchor discriminators (sha256("global:<name>")[0..8]) ──
const DISCRIMINATORS: Record<string, number[]> = {
  create_identity:      [12, 253, 209, 41, 176, 51, 195, 179],
  update_reputation:    [194, 220, 43, 201, 54, 209, 49, 178],
  register_payfi_event: [143, 112, 242, 94, 206, 150, 86, 169],
};

function discriminator(name: string): Buffer {
  return Buffer.from(DISCRIMINATORS[name]);
}

const IdentityTypeEnum: Record<string, number> = { Human: 0, AIAgent: 1 };
const ActivityTypeEnum: Record<string, number> = {
  PayFiTransaction: 0,
  GovernanceParticipation: 1,
  ContractFulfillment: 2,
  CommunityContribution: 3,
};

export function getIdentityPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), owner.toBuffer()],
    SENTINEL_PROGRAM_ID
  );
}

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

export async function identityExists(owner: PublicKey): Promise<boolean> {
  try {
    const [identityPDA] = getIdentityPDA(owner);
    const info = await connection.getAccountInfo(identityPDA);
    return info !== null;
  } catch {
    return false;
  }
}

export async function fetchIdentity(owner: PublicKey) {
  try {
    const [identityPDA] = getIdentityPDA(owner);
    const info = await connection.getAccountInfo(identityPDA);
    if (!info) return null;
    const data = info.data.slice(8);
    const reputationScore = data.readUInt32LE(65);
    const activityCount = data.readUInt32LE(69);
    return {
      owner: owner.toBase58(),
      reputation_score: reputationScore,
      activity_count: activityCount,
      total_payfi_volume: 0,
      created_at: new Date(),
    };
  } catch {
    return null;
  }
}

export function generateBlinkUrl(
  baseUrl: string,
  action: "verify-reputation" | "identity-card",
  params: Record<string, string>
): string {
  const qs = new URLSearchParams(params).toString();
  return `solana-action:${baseUrl}/api/actions/${action}?${qs}`;
}

export async function requestAirdrop(owner: PublicKey): Promise<string> {
  const sig = await connection.requestAirdrop(owner, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig);
  return sig;
}