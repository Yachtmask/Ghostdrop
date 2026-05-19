<p align="center">
  <img src="https://img.shields.io/badge/Aptos-Testnet-blue?style=for-the-badge" alt="Aptos Testnet" />
  <img src="https://img.shields.io/badge/Shelby-Protocol-purple?style=for-the-badge" alt="Shelby Protocol" />
  <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-green?style=for-the-badge" alt="AES-256-GCM" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

# GhostDrop

### Powering Digital Sovereignty on Aptos

---

## Overview

**GhostDrop** is a decentralized Dead Man Switch built on the [Aptos](https://aptos.dev/) blockchain with [Shelby Protocol](https://shelby.xyz/) for encrypted blob storage. It enables users to encrypt sensitive data locally and store it verifiably on the Shelby network. If the user becomes inactive for a configured period of time, the encrypted data is automatically released to designated recipients via email.

> Your heartbeat keeps it secure. Your silence releases it.

---

## Features

| Feature | Description |
|---------|-------------|
| **Zero-Knowledge Encryption** | Files are encrypted locally using AES-256-GCM before upload. Keys never leave your device. |
| **Decentralized Storage** | Encrypted blobs are stored on the Shelby network — verifiable, immutable, and always available. |
| **Dead Man Switch** | Configurable inactivity timer triggers automatic data release to recipients. |
| **Wallet Authentication** | Secure login via Aptos-compatible wallets (Petra). |
| **Email Notifications** | Recipients are notified via email with decryption access when the switch triggers. |
| **Check-In Mechanism** | Reset your timer by checking in from your wallet — proving you're still active. |
| **Vault Management** | Create, monitor, extend, and delete vaults from a unified dashboard. |

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
- **Blockchain:** Aptos Testnet (via `@aptos-labs/ts-sdk`)
- **Storage:** Shelby Protocol Testnet (`@shelby-protocol/sdk`)
- **Encryption:** Web Crypto API (AES-256-GCM)
- **Backend:** Express.js with node-cron watchdog
- **Notifications:** Nodemailer (Gmail), Resend, EmailJS
- **Wallet:** Petra Wallet Adapter

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Encrypt │→ │ Upload Blob  │→ │ Register on Aptos │  │
│  │  (Local) │  │ (Shelby SDK) │  │ (Wallet Sign)     │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Server (Express.js)                     │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ Watchdog Cron│→ │ Check Timers   │→ │ Send Email  │  │
│  │ (Every Min)  │  │ (Shelby Fetch) │  │ (Nodemailer)│  │
│  └──────────────┘  └────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- An Aptos-compatible wallet (e.g., [Petra](https://petra.app/))
- A Shelby API key from [Geomi](https://geomi.dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yachtmask/Ghostdrop.git
cd Ghostdrop

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: Shelby Protocol API Key (get from https://geomi.dev)
NEXT_PUBLIC_SHELBY_API_KEY=your_shelby_api_key_here

# Optional: Email notification providers
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
RESEND_API_KEY=your_resend_key

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token

# Optional: App URL for download links
APP_URL=http://localhost:3000
```

### Run Locally

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm run preview
```

The app will be available at `http://localhost:3000`.

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variable `NEXT_PUBLIC_SHELBY_API_KEY` in **Settings → Environment Variables**:
   - **Key:** `NEXT_PUBLIC_SHELBY_API_KEY`
   - **Value:** Your API key from Geomi
4. Deploy.

> **Note:** The backend watchdog server (`server.ts`) requires a persistent Node.js runtime and cannot run on Vercel's serverless platform. For production use, deploy the server separately on a VPS or use a service like Railway/Render.

---

## How It Works

1. **Connect Wallet** — Authenticate with your Aptos wallet.
2. **Create a Vault** — Upload a file, set a timer duration, add recipient emails, and provide a passphrase.
3. **Encryption** — The file is encrypted locally with AES-256-GCM. The key is derived and packaged for each recipient.
4. **Upload** — The encrypted blob and metadata are uploaded to the Shelby network and registered on Aptos.
5. **Watchdog** — A background cron job monitors vault timers. If your check-in expires, recipients are notified.
6. **Check-In** — Visit your dashboard and check in to reset the timer and prove activity.
7. **Release** — If the timer expires, recipients receive an email with a download link and decryption passphrase.

---

## Live Demo

**[https://ghostdrop-nine.vercel.app](https://ghostdrop-nine.vercel.app)**

---

## Security Considerations

- All encryption happens client-side — keys never leave the browser.
- Passphrases are stored server-side only for auto-release functionality.
- The watchdog server should be deployed in a secure, trusted environment.
- Always use app-specific passwords for Gmail integration.
- API keys should be stored as environment variables, never hardcoded.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>GhostDrop</strong> — Secure your legacy. Built for those who think ahead.
</p>
