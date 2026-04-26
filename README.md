# GhostDrop

**Decentralized Dead Man's Switch Vault on Aptos & Shelby Protocol**

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)

---

## Overview

GhostDrop is a self-custody, decentralized dead man's switch solution built on the **Aptos blockchain** and **Shelby Protocol**. It enables users to encrypt sensitive files, distribute them across decentralized storage, and automatically notify beneficiaries if the owner fails to check in within a specified interval.

### Key Differentiators

- **Zero-Knowledge Architecture**: All encryption happens client-side. GhostDrop never sees keys, passphrases, or unencrypted data.
- **Decentralized Permanence**: Files are stored on Shelby's distributed network of nodes, making them verifiable, immutable, and permanently available.
- **Heartbeat Mechanism**: The owner "checks in" periodically to signal control. If the heartbeat stops, beneficiaries are automatically notified and the vault drops.
- **Unlimited File Size**: No restrictions on vault size. Upload gigabyte-scale files securely.
- **Multi-Recipient Support**: Add unlimited trusted contacts to a single vault. Each recipient receives a unique encrypted access token.

---

## Architecture

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Frontend Framework** | React with TypeScript | 19.0 / 5.8 | Modern reactive UI with type safety |
| **Build Tool** | Vite | 6.2.0 | Fast development server & optimized builds |
| **Styling** | TailwindCSS | 4.0 | Responsive design system |
| **Blockchain SDK** | @aptos-labs/ts-sdk | 6.3.1 | Aptos network interaction |
| **Wallet Adapter** | @aptos-labs/wallet-adapter-react | 8.3.3 | AIP-62 compliant wallet integration |
| **Storage Protocol** | @shelby-protocol/sdk | 0.3.0 | Decentralized blob storage & erasure coding |
| **State Management** | @tanstack/react-query | 5.95.2 | Server state caching & synchronization |
| **Encryption** | Web Crypto API (AES-256-GCM) | Native | Client-side file encryption |
| **Notifications** | Resend + Nodemailer | 6.10.0 / 8.0.4 | Email and Telegram delivery |
| **Deployment** | Vercel | - | Edge-optimized serverless hosting |

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Browser (Client-Side)                                  │
├──────────────────┬──────────────────┬───────────────────────┤
│ 1. File Upload   │ 2. AES-256 GCM   │ 3. Key Encryption     │
│ (Local)          │ Encryption       │ (Passphrase-based)    │
│                  │ (IV + Ciphertext)│                       │
└──────────────────┴──────────────────┴───────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ Shelby Protocol Network          │
        ├─────────────────────────────────┤
        │ • Distributed Storage Nodes      │
        │ • Reed-Solomon Erasure Coding    │
        │ • Cryptographic Commitments      │
        │ • Merkle Tree Verification       │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ Aptos Blockchain                │
        ├─────────────────────────────────┤
        │ • Blob Registration Txn          │
        │ • Ownership Proof                │
        │ • Expiration Metadata            │
        └─────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │ GhostDrop Watchdog Service       │
        ├─────────────────────────────────┤
        │ • Monitors Check-in Status       │
        │ • Triggers on Expiration         │
        │ • Sends Notifications (Email/TG) │
        │ • Stores Passphrases Securely    │
        └─────────────────────────────────┘
```

### Security Model

**Encryption Layers:**
1. **File Encryption**: AES-256-GCM with random IV, encrypted locally
2. **Key Encryption**: Recipient secret + PBKDF2 key derivation → AES-256-GCM
3. **On-Chain**: Only blob commitments and metadata stored (encrypted contents on Shelby)

**Trust Model:**
- No server-side secrets required
- Owner controls all cryptographic keys
- Beneficiaries derive access via shared passphrase (out-of-band)
- GhostDrop backend only stores: account address, metadata blob name, passphrase (for watchdog delivery)

---

## Features

### Core Functionality

- ✅ **Unlimited File Upload**: No hard size limits. Upload files from KB to GB scale.
- ✅ **AES-256-GCM Encryption**: Military-grade symmetric encryption with authenticated encryption mode.
- ✅ **Multi-Recipient Distribution**: Add unlimited beneficiaries with unique access tokens per vault.
- ✅ **Customizable Expiration**: Set drop timer in seconds, minutes, hours, days, or months.
- ✅ **Check-In Mechanism**: Extend expiration by visiting dashboard and clicking "Check In".
- ✅ **Passphrase Protection**: Recipients need owner's passphrase + download link to access vault.
- ✅ **Email & Telegram Notifications**: Automatic delivery when vault drops.
- ✅ **Recipient Name Support**: Personalize messages with recipient identification.
- ✅ **On-Chain Verification**: Blob ownership and expiration tracked on Aptos testnet.
- ✅ **Decentralized Storage**: Shelby Protocol distributes data across global node network.

### Dashboard

- View all active vaults with countdown timers
- Real-time status indicators (Active/Dropped)
- Quick actions: Check In, Edit Timer, Delete Vault
- Search & filter capabilities
- Recipient list display
- Receive & decrypt functionality for beneficiaries

### Administrative

- Vault deletion with blockchain deregistration
- Timer extension via check-in
- Watchdog monitoring and notification delivery
- Recipient management

---

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Aptos Wallet** (Petra Plugin recommended)
- **ShelbyUSD Testnet Tokens** (for storage fees)

### Installation

```bash
# Clone repository
git clone https://github.com/Yachtmask/Ghostdrop.git
cd Ghostdrop

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Environment Configuration

Create `.env.local` in the project root:

```env
# Email Configuration (Choose one)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# OR

RESEND_API_KEY=re_xxxxx

# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456:ABCDEFGhijklmnopqrstuvwxyz

# Application Configuration
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Start production server
npm start
```

---

## Usage Guide

### For Vault Owners

#### 1. Connect Wallet
Click the wallet icon in the top-right corner and select your Aptos account connected to testnet.

#### 2. Create a Vault
Navigate to **Create Dead Man's Switch**:
- **Select File**: Upload any file (no size limit)
- **Set Timer**: Choose expiration interval (default: 30 days)
- **Set Passphrase**: Create a strong passphrase (shown to user, not stored)
- **Add Recipients**: Email addresses required; Telegram & Aptos address optional
- **Prepare Vault**: Client-side encryption begins
- **Confirm Upload**: Wallet signature required; blobs upload to Shelby

#### 3. Manage Your Vaults
From the Dashboard:
- **Check In**: Reset expiration timer
- **Edit Timer**: Modify duration for specific vault
- **Delete**: Permanently remove vault from Shelby network
- **View Recipients**: See who has access to each vault

#### 4. Stay Active
The heartbeat mechanism requires periodic check-ins. Failure to check in results in automatic notification delivery.

### For Beneficiaries

#### 1. Receive Notification
When vault expires, beneficiary receives email/Telegram with:
- Download link to encrypted file
- Blob ID and recipient's encrypted key package
- Vault owner's address for verification

#### 2. Decrypt & Download
From the notification link:
- Enter the passphrase (provided separately by owner)
- Click "Decrypt & Download"
- File is decrypted locally and auto-downloaded

#### 3. Alternative: Dashboard Receive
Go to **Dashboard** → **Receive & Decrypt**:
- Paste download link or enter blob ID
- Enter passphrase
- File downloads automatically

---

## API Reference

### Watchdog Service Endpoints

```typescript
// Register vault for monitoring
POST /api/watch
{
  accountAddress: "0x...",
  metadataBlobName: "ghostdrop_meta_1234567890.json",
  passphrase: "user-provided-passphrase" // Stored securely server-side
}

// Check vault status and get metadata blob list
GET /api/vaults/:accountAddress
Response: {
  metadataBlobs: ["blob1", "blob2"],
  extensions: { "blob1": 1234567890 }
}

// Extend vault expiration via check-in
POST /api/checkin
{
  accountAddress: "0x...",
  metadataBlobName: "ghostdrop_meta_1234567890.json",
  durationMs: 2592000000 // 30 days in milliseconds
}

// Deregister vault from monitoring
DELETE /api/watch
{
  accountAddress: "0x...",
  metadataBlobName: "ghostdrop_meta_1234567890.json"
}

// Manual watchdog trigger (debugging)
GET /api/trigger-watchdog
Response: {
  success: true,
  logs: ["Checked vault 1...", "Triggered drop for vault 2..."]
}

// Test notification delivery
POST /api/test-notifications
{
  email: "recipient@example.com",
  telegram: "123456789"
}
```

---

## Security Considerations

### Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| Network interception | All data encrypted locally; TLS for transmission |
| Server compromise | GhostDrop stores only: address, blob names, passphrase |
| Wallet theft | On-chain transactions require owner signature |
| Recipient key exposure | Encrypted key package requires passphrase to decrypt |
| Shelby node failure | Reed-Solomon erasure coding (8-of-12 minimum) |
| Blockchain reorg | Shelby protocol uses Aptos testnet finality |
| Passphrase guessing | PBKDF2 with 100,000 iterations on key derivation |

### Best Practices

1. **Use Strong Passphrases**: Minimum 12 characters with mixed case, numbers, symbols
2. **Out-of-Band Passphrase**: Share passphrase separately from download link
3. **Regular Check-ins**: Set conservative expiration intervals
4. **Monitor Watchdog**: Verify watchdog service is running (`GET /api/health`)
5. **Test Recovery**: Validate decryption flow before real usage
6. **Keep ShelbyUSD Funded**: Maintain testnet tokens for storage fees

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect repository to Vercel dashboard
# https://vercel.com/new

# 3. Environment variables in Vercel dashboard
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
TELEGRAM_BOT_TOKEN=...
APP_URL=https://ghostdrop.vercel.app

# 4. Deploy triggers automatically on push
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ghostdrop .
docker run -p 3000:3000 \
  -e GMAIL_APP_PASSWORD=xxx \
  -e TELEGRAM_BOT_TOKEN=xxx \
  ghostdrop
```

---

## Development

### Project Structure

```
ghostdrop/
├── src/
│   ├── App.tsx                    # Root component with providers
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global Tailwind styles
│   ├── pages/
│   │   ├── CreateVault.tsx        # Vault creation flow
│   │   ├── Dashboard.tsx          # Vault management & monitoring
│   │   ├── Download.tsx           # Recipient decryption
│   │   ├── Settings.tsx           # User preferences
│   │   └── LandingPage.tsx        # Marketing page
│   ├── services/
│   │   ├── encryptionService.ts   # AES-256-GCM encryption/decryption
│   │   ├── shelbyService.ts       # Shelby Protocol integration
│   │   └── emailService.ts        # Email template formatting
│   ├── components/
│   │   └── Navbar.tsx             # Navigation bar
│   ├── hooks/
│   │   └── useSettings.ts         # User settings hook
│   └── utils/
│       └── crypto.ts              # Legacy crypto utilities
├── server.ts                       # Express server + watchdog cron
├── vite.config.ts                 # Build configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies
├── .npmrc                         # NPM configuration
└── README.md                      # This file
```

### Running Tests

```bash
# Currently using local testing; CI/CD tests can be added
npm run build  # Verify TypeScript compilation
```

### Code Style

- **Language**: TypeScript with strict mode enabled
- **Formatting**: Prettier (configure in `.prettierrc`)
- **Linting**: ESLint (configure in `.eslintrc`)
- **Components**: React functional components with hooks

### Key Dependencies

```json
{
  "@aptos-labs/ts-sdk": "^6.3.1",
  "@aptos-labs/wallet-adapter-react": "^8.3.3",
  "@shelby-protocol/sdk": "^0.3.0",
  "@shelby-protocol/react": "^2.0.0",
  "@tanstack/react-query": "^5.95.2",
  "react": "^19.0.0",
  "typescript": "^5.8.2",
  "vite": "^6.2.0"
}
```

---

## Troubleshooting

### Upload Fails with "Transaction Rejected"
- Ensure wallet is connected and switched to **Aptos Testnet**
- Check account has sufficient ShelbyUSD balance for storage fees
- Verify wallet has permission to sign transactions

### Watchdog Notifications Not Received
- Verify `GMAIL_APP_PASSWORD` or `RESEND_API_KEY` is configured
- Check email spam/promotions folder
- For Telegram, ensure bot token is valid and user has started the bot
- Run `GET /api/test-notifications` to diagnose

### File Decryption Fails
- Confirm passphrase matches what owner provided
- Verify download link integrity (not truncated)
- Try again—temporary network issues are possible
- Check browser console for detailed error

### Server Won't Start
- Verify Node.js version ≥ 18: `node --version`
- Check `.env.local` has required variables
- Run `npm install` again to ensure all dependencies present
- Check port 3000 is available: `lsof -i :3000`

---

## Roadmap

### Q3 2026
- ✅ Core vault creation & expiration
- ✅ Multi-recipient support
- ✅ Decentralized storage integration

### Q4 2026 (Planned)
- [ ] Multi-signature vaults
- [ ] On-chain inheritance messages
- [ ] Automated Aptos digital asset distribution
- [ ] Mainnet support (Aptos & Shelby)
- [ ] Browser extension for quick access

### Q1 2027 (Planned)
- [ ] Advanced privacy modes (mixing services)
- [ ] Biometric authentication
- [ ] Legacy contact emergency bypass
- [ ] Advanced metrics & analytics

---

## Contributing

We welcome contributions from the community. To contribute:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request with detailed description

Please ensure:
- Code follows TypeScript strict mode
- All new features include error handling
- Console logging uses `[FEATURE_NAME]` prefix for debugging
- Sensitive operations show user-friendly toast notifications

---

## Security & Privacy

- **No Data Collection**: GhostDrop does not track user behavior or collect analytics
- **Open Source**: Audit and verify code yourself
- **Testnet Only**: Currently operates on Aptos testnet (not production assets)
- **Self-Custody**: Users retain full control of encryption keys

### Report Security Issues

⚠️ **Do not open public issues for security vulnerabilities.**

Email security concerns to: [security@ghostdrop.dev]

---

## License

GhostDrop is released under the **MIT License**. See [LICENSE](./LICENSE) file for details.

---

## Contact & Support

- **Website**: https://ghostdrop.dev
- **GitHub Issues**: [Report bugs & request features](https://github.com/Yachtmask/Ghostdrop/issues)
- **Documentation**: See [docs/](./docs) directory for detailed guides
- **Discord**: Join our community for support and updates

---

## Acknowledgments

Built with:
- **Aptos Labs** - High-performance blockchain platform
- **Shelby Protocol** - Decentralized storage infrastructure
- **React & TypeScript** - Modern web development
- **Tailwind CSS** - Utility-first styling

---

**GhostDrop: Securing Digital Legacies on the Blockchain**

*Your data, your vault, your legacy.*
