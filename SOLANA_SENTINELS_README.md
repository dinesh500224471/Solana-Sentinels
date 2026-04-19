
# Solana Sentinels: ZK-Compressed Agentic Identity & Reputation Network

## Project Overview

**Solana Sentinels** is a hackathon MVP for a decentralized identity and reputation system on Solana. It enables both human users and AI agents to establish verifiable, privacy-preserving identities and accumulate dynamic reputation scores based on on-chain activities.

This project demonstrates the integration of Solana's cutting-edge primitives:
- **ZK-Compression** for scalable, privacy-preserving state storage
- **Solana Blinks & Actions** for seamless interaction
- **PayFi Integration** for verifiable financial reputation building
- **AI Agent Support** via the Solana Agent Registry

## Project Structure

```
solana-sentinels/
├── client/                          # React frontend application
│   ├── public/                      # Static assets (favicon, robots.txt)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page with features overview
│   │   │   ├── Dashboard.tsx       # Main identity & reputation dashboard
│   │   │   └── NotFound.tsx        # 404 page
│   │   ├── components/             # Reusable UI components (shadcn/ui)
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx    # Theme management (light/dark)
│   │   │   └── WalletContext.tsx   # Solana wallet integration
│   │   ├── lib/
│   │   │   └── solana.ts           # Solana utilities & program interactions
│   │   ├── App.tsx                 # Main app router
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global styles & design tokens
│   └── index.html                  # HTML template
├── server/                          # Express backend
│   ├── index.ts                    # Main server entry point
│   └── actions.ts                  # Solana Actions API endpoints (Blinks)
├── programs/
│   └── sentinel/
│       ├── src/
│       │   └── lib.rs              # Anchor program for Identity & Reputation
│       └── Cargo.toml              # Rust dependencies
├── package.json                    # Node.js dependencies
└── README.md                        # This file
```

## Core Components

### 1. Frontend (React + Solana Wallet Adapter)

The frontend provides a user-friendly interface for:
- **Wallet Connection**: Connect via Phantom or other Solana wallets
- **Identity Creation**: Create a new Sentinel Identity
- **Reputation Dashboard**: View reputation score, activity count, and PayFi volume
- **Blink Sharing**: Generate and share reputation proofs via Blinks

**Key Pages:**
- **Home** (`/`): Landing page with feature overview and CTA
- **Dashboard** (`/dashboard`): Main interface for identity and reputation management

### 2. On-Chain Program (Anchor/Rust)

The Solana program (`programs/sentinel/src/lib.rs`) implements:

**Instructions:**
- `create_identity`: Initialize a new ZK-compressed identity account
- `update_reputation`: Update reputation based on verified activities
- `verify_reputation_threshold`: Check if identity meets a minimum reputation threshold
- `register_payfi_event`: Record PayFi transactions for reputation building

**Data Structures:**
- `Identity`: Stores owner, identity type, metadata hash, reputation score, and activity history
- `IdentityType`: Enum for Human or AIAgent identities
- `ActivityType`: Enum for different activity types (PayFi, Governance, Contracts, Community)

### 3. Solana Actions API (Blinks Integration)

The Actions API (`server/actions.ts`) provides endpoints for Solana Blinks:

**Endpoints:**
- `GET /api/actions/verify-reputation`: Metadata for reputation verification Blink
- `POST /api/actions/verify-reputation`: Build transaction for reputation verification
- `GET /api/blinks/identity-card`: Metadata for identity card Blink
- `GET /api/actions/get-identity`: Retrieve identity information

These endpoints return transaction metadata that can be embedded in Blinks for seamless on-chain interaction.

## Getting Started

### Prerequisites

- Node.js 22.x
- pnpm (package manager)
- Solana CLI (for local development)
- Phantom wallet or another Solana wallet

### Installation

```bash
# Install dependencies
pnpm install

# Install Solana dependencies
pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-phantom
```

### Development

```bash
# Start the dev server
pnpm dev

# The app will be available at http://localhost:3000
```

### Building for Production

```bash
# Build the frontend and backend
pnpm build

# Start the production server
pnpm start
```

## How to Use

### 1. Connect Your Wallet

Click the "Connect Wallet" button and select your Solana wallet (Phantom recommended).

### 2. Create Your Sentinel Identity

On the Dashboard, click "Create Identity" to initialize your on-chain identity account.

### 3. View Your Reputation

Your reputation score is displayed on the Dashboard. It starts at 100 points and increases based on:
- PayFi transactions (USDC volume)
- Governance participation
- Contract fulfillment
- Community contributions

### 4. Share Your Identity via Blink

Click "Share as Blink" to generate a shareable link that allows others to verify your reputation without leaving their current interface.

## Hackathon MVP Features

This is a **Minimum Viable Product** designed to demonstrate core concepts within a hackathon timeframe:

✅ **Implemented:**
- Solana wallet integration (Phantom)
- Mock identity creation and reputation tracking
- Dashboard UI for identity and reputation display
- Solana Actions API endpoints for Blinks
- Landing page with feature overview
- Responsive design with Tailwind CSS

⏳ **Next Steps (Post-Hackathon):**
- Deploy the Anchor program to Solana Devnet
- Integrate actual on-chain transactions
- Implement ZK-Compression using Light Protocol
- Build full Blinks integration with transaction signing
- Add PayFi event recording from real transactions
- Implement AI Agent Registry integration
- Add reputation oracle network for off-chain data

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Wallet Integration** | @solana/wallet-adapter-react, Phantom |
| **Backend** | Express.js, TypeScript |
| **On-Chain** | Anchor Framework, Rust, Solana Web3.js |
| **State Management** | React Context API |
| **Routing** | Wouter |
| **Build Tool** | Vite |

## API Endpoints

### Solana Actions API

**Verify Reputation**
```
GET /api/actions/verify-reputation?identity={pubkey}&threshold={score}
POST /api/actions/verify-reputation
```

**Identity Card**
```
GET /api/blinks/identity-card
```

**Get Identity Info**
```
GET /api/actions/get-identity?owner={pubkey}
```

## Environment Variables

The application uses the following environment variables (automatically injected):

- `VITE_APP_ID`: Application identifier
- `VITE_APP_TITLE`: Application title
- `VITE_ANALYTICS_ENDPOINT`: Analytics endpoint
- `VITE_ANALYTICS_WEBSITE_ID`: Analytics website ID

## Deployment

### Frontend Deployment

The frontend is deployed as a static site on Manus. Use the Management UI to:
1. Create a checkpoint
2. Click "Publish" to deploy

### On-Chain Program Deployment

To deploy the Anchor program to Solana Devnet:

```bash
# Build the program
cd programs/sentinel
cargo build-bpf

# Deploy to Devnet
solana program deploy target/deploy/sentinel.so --url devnet
```

Update the `SENTINEL_PROGRAM_ID` in `client/src/lib/solana.ts` with the deployed program ID.

## Key Design Decisions

1. **Mock Implementation for MVP**: The current implementation uses mock data for identity and reputation. In production, these would interact with actual on-chain accounts.

2. **Devnet Focus**: The application is configured to use Solana Devnet for development. Update `RPC_ENDPOINT` in `client/src/lib/solana.ts` for Mainnet.

3. **Privacy-First Design**: The UI emphasizes selective disclosure and privacy, aligning with ZK-Compression principles.

4. **Modular Architecture**: Components are designed to be easily extended with real on-chain logic.

## Testing

### Manual Testing Checklist

- [ ] Wallet connection works
- [ ] Identity creation succeeds
- [ ] Reputation score displays correctly
- [ ] Blink URL is generated and shareable
- [ ] Dashboard responsive on mobile
- [ ] Actions API endpoints return correct metadata

### Unit Tests (Future)

```bash
pnpm test
```

## Troubleshooting

### Wallet Connection Issues

- Ensure Phantom wallet is installed and unlocked
- Check that you're on Solana Devnet
- Try refreshing the page

### Build Errors

- Clear node_modules: `rm -rf node_modules && pnpm install`
- Restart dev server: `pnpm dev`

### Program Deployment Issues

- Ensure Solana CLI is installed: `solana --version`
- Check wallet balance: `solana balance`
- Verify Devnet connection: `solana config get`

## Future Enhancements

1. **ZK-Compression Integration**: Use Light Protocol for scalable, rent-free state storage
2. **Full Blinks Support**: Implement transaction signing and verification
3. **PayFi Integration**: Record real USDC transactions for reputation
4. **Oracle Network**: Decentralized data feed for off-chain reputation sources
5. **AI Agent Support**: Full integration with Solana Agent Registry
6. **Governance**: DAO-style reputation-weighted voting
7. **DeFi Integration**: Undercollateralized lending based on reputation

## References

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [ZK Compression](https://www.zkcompression.com/)
- [Solana Actions](https://solana.com/solutions/actions)

## License

MIT

## Support

For questions or issues, please open an issue on the project repository or reach out to the development team.

---

**Built for the Solana Hackathon 2026**
