---
name: bankr
description: AI-powered crypto trading agent, wallet API, and LLM gateway via natural language. Use when the user wants to trade crypto, check portfolio balances (with PnL and NFTs), view token prices, search tokens, transfer crypto, manage NFTs, use leverage (Hyperliquid or Avantis), bet on Polymarket, deploy tokens, set up automated trading, sign and submit raw transactions, call or deploy x402 paid API endpoints, browse the web, or access LLM models through the Bankr LLM gateway funded by your Bankr wallet. Supports Base, Ethereum, Polygon, Solana, and Unichain.
metadata:
  {
    "clawdbot":
      {
        "emoji": "📺",
        "homepage": "https://bankr.bot",
        "requires": { "bins": ["bankr"] },
      },
  }
---

# Bankr

Execute crypto trading and DeFi operations using natural language. Two integration options:

1. **Bankr CLI** (recommended) — Install `@bankr/cli` for a batteries-included terminal experience
2. **REST API** — Call `https://api.bankr.bot` directly from any language or tool

Both use the same API key. The API has two layers:
- **Wallet API** (`/wallet/*`) — Direct, synchronous endpoints for portfolio, transfers, signing, and transaction submission
- **Agent API** (`/agent/*`) — AI-powered async prompt endpoint for natural language operations

## Getting an API Key

Before using either option, you need a Bankr API key. Two ways to get one:

**Option A: Headless email login (recommended for agents)**

Two-step flow — send OTP, then verify and complete setup. See "First-Time Setup" below for the full guided flow with user preference prompts.

```bash
# Step 1 — send OTP to email
bankr login email user@example.com

# Step 2 — verify OTP and generate API key (options based on user preferences)
bankr login email user@example.com --code 123456 --accept-terms --key-name "My Agent" --read-write
```

This creates a wallet, accepts terms, and generates an API key — no browser needed. Before running step 2, ask the user which APIs they need (wallet, agent, both via `--read-write`, LLM gateway) and their preferred key name.

**Option B: Bankr Terminal**

1. Visit [bankr.bot/api](https://bankr.bot/api)
2. **Sign up / Sign in** — Enter your email and the one-time passcode (OTP) sent to it
3. **Generate an API key** — Create a key with **Wallet & Agent API** access enabled (the key starts with `bk_...`)

Both options automatically provision **EVM wallets** (Base, Ethereum, Polygon, Unichain) and a **Solana wallet** — no manual wallet setup needed.


## Option 1: Bankr CLI (Recommended)

### Install

```bash
bun install -g @bankr/cli
```

Or with npm:

```bash
npm install -g @bankr/cli
```

### First-Time Setup

#### Headless email login (recommended for agents)

When the user asks to log in with an email, walk them through this flow:

**Step 1 — Send verification code**

```bash
bankr login email <user-email>
```

**Step 2 — Ask the user for the OTP code and all preferences in a single message.** This avoids unnecessary back-and-forth. Ask for:

1. **OTP code** — the code they received via email
2. **Accept Terms of Service (REQUIRED)** — Present the [Terms of Service](https://bankr.bot/terms) link and confirm the user agrees. **The login command will fail for new users without `--accept-terms`.** You MUST ask for ToS acceptance and do not pass `--accept-terms` unless the user has explicitly confirmed.
3. **Which APIs do they need?**
   - **Wallet API** — enabled by default, use `--no-wallet-api` to disable
   - **Agent API** (`--agent-api`) — AI-powered prompts and natural language operations
   - **Token Launch** — enabled by default, use `--no-token-launch` to disable
   - Add `--read-write` to allow transactions (without it, enabled APIs are read-only)
4. **Enable LLM gateway access?** (`--llm`) — multi-model API at `llm.bankr.bot` (currently limited to beta testers). Skip if user doesn't need it.
5. **Key name?** (`--key-name`) — a display name for the API key (e.g. "My Agent", "Trading Bot")

**Step 3 — Construct and run the step 2 command** with the user's choices. **Do NOT execute if the user has not explicitly accepted the Terms of Service** — ask again if needed:

```bash
# Full access: wallet + agent with write + LLM
bankr login email <user-email> --code <otp> --accept-terms --key-name "My Agent" --agent-api --read-write --llm

# Agent with write access (AI can execute transactions)
bankr login email <user-email> --code <otp> --accept-terms --key-name "Trading Agent" --agent-api --read-write

# Default key (wallet + token launch, read-only)
bankr login email <user-email> --code <otp> --accept-terms --key-name "My Key"

# Agent read-only (research, prices, balances — no transactions)
bankr login email <user-email> --code <otp> --accept-terms --key-name "Research Agent" --agent-api

# LLM-only (no wallet, no token launch)
bankr login email <user-email> --code <otp> --accept-terms --key-name "LLM Client" --no-wallet-api --no-token-launch --llm
```


#### Login options reference

| Option | Description |
|--------|-------------|
| `--code <otp>` | OTP code received via email (step 2) |
| `--accept-terms` | Accept [Terms of Service](https://bankr.bot/terms) without prompting (required for new users) |
| `--key-name <name>` | Display name for the API key (e.g. "My Agent"). Prompted if omitted |
| `--no-wallet-api` | Disable Wallet API (enabled by default) |
| `--agent-api` | Enable Agent API (AI prompts, natural language operations) |
| `--read-write` | Disable read-only mode (allow transactions). Without this, enabled APIs are read-only |
| `--no-token-launch` | Disable Token Launch API (enabled by default) |
| `--llm` | Enable [LLM gateway](https://docs.bankr.bot/llm-gateway/overview) access (multi-model API at `llm.bankr.bot`). Currently limited to beta testers |
| `--allowed-ips <ips>` | Comma-separated IP/CIDR allowlist for the API key (e.g., `1.2.3.4,10.0.0.0/24`) |
| `--allowed-recipients <addresses>` | Comma-separated EVM/Solana addresses the key can send to (auto-classified by 0x prefix) |

**New key defaults** (when no flags are passed):

| Flag | Default | To change |
|------|---------|-----------|
| `walletApiEnabled` | Enabled | `--no-wallet-api` |
| `agentApiEnabled` | Disabled | `--agent-api` |
| `tokenLaunchApiEnabled` | Enabled | `--no-token-launch` |
| `llmGatewayEnabled` | Disabled | `--llm` |
| `readOnly` | Enabled (read-only) | `--read-write` |

Any option not provided on the command line will be prompted interactively by the CLI, so you can mix headless and interactive as needed.

#### Login with existing API key

If the user already has an API key:

```bash
bankr login --api-key bk_YOUR_KEY_HERE
```

If they need to create one at the Bankr Terminal:
1. Run `bankr login --url` — prints the terminal URL
2. Present the URL to the user, ask them to generate a `bk_...` key
3. Run `bankr login --api-key bk_THE_KEY`

#### Separate LLM Gateway Key (Optional)

If your LLM gateway key differs from your API key, pass `--llm-key` during login or run `bankr config set llmKey YOUR_LLM_KEY` afterward. When not set, the API key is used for both.

#### Verify Setup

```bash
bankr whoami
bankr wallet portfolio
bankr agent prompt "What is my balance?"
```


## Option 2: REST API (Direct)

No CLI installation required — call the API directly with `curl`, `fetch`, or any HTTP client.

### Authentication

All requests require an `X-API-Key` header:

```bash
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: bk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is my ETH balance?"}'
```

### Quick Example: Submit → Poll → Complete

```bash
# 1. Submit a prompt — returns a job ID
JOB=$(curl -s -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is my ETH balance?"}')
JOB_ID=$(echo "$JOB" | jq -r '.jobId')

# 2. Poll until terminal status
while true; do
  RESULT=$(curl -s "https://api.bankr.bot/agent/job/$JOB_ID" \
    -H "X-API-Key: $BANKR_API_KEY")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ] && break
  sleep 2
done

# 3. Read the response
echo "$RESULT" | jq -r '.response'
```

### Conversation Threads

Every prompt response includes a `threadId`. Pass it back to continue the conversation:

```bash
# Start — the response includes a threadId
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the price of ETH?"}'

# Continue — pass threadId to maintain context
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "And what about SOL?", "threadId": "thr_XYZ"}'
```

Omit `threadId` to start a new conversation. CLI equivalent: `bankr agent prompt --continue` (reuses last thread) or `bankr agent prompt --thread <id>`.


### API Endpoints Summary

#### Wallet API (`/wallet/*`) — Direct endpoints (synchronous)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/wallet/me` | GET | Read | Wallet info (address, chains) |
| `/wallet/portfolio` | GET | Read | Portfolio balances, supports `?include=pnl,nfts` for progressive loading |
| `/wallet/transfer` | POST | Write | Transfer tokens (multi-chain, supports `allowedRecipients` enforcement) |
| `/wallet/sign` | POST | Write | Sign messages, typed data, or transactions |
| `/wallet/submit` | POST | Write | Submit raw transactions to chain |

#### Agent API (`/agent/*`) — AI-powered endpoints (async)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/prompt` | POST | Submit a prompt (async, returns job ID) |
| `/agent/job/{jobId}` | GET | Check job status and results |
| `/agent/job/{jobId}/cancel` | POST | Cancel a running job |

#### Public endpoints (no auth required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token-launches` | GET | List recent token launches (cached, public) |

## CLI Command Reference (v0.3.x)

### `bankr wallet` — Wallet Operations

| Command | Description |
|---------|-------------|
| `bankr wallet` | Show wallet info (default: whoami) |
| `bankr wallet portfolio` | Portfolio balances across all chains |
| `bankr wallet portfolio --pnl` | Include profit/loss data |
| `bankr wallet portfolio --nfts` | Include NFT holdings |
| `bankr wallet portfolio --all` | Include both PnL and NFTs |
| `bankr wallet portfolio --chain <chains>` | Filter by chain(s) |
| `bankr wallet transfer --to <recipient> --token <symbol> --amount <amount>` | Transfer tokens |
| `bankr wallet sign` | Sign messages/typed data/transactions |
| `bankr wallet submit` | Submit raw transactions |

### `bankr agent` — AI Agent Operations

| Command | Description |
|---------|-------------|
| `bankr agent prompt <text>` | Send a prompt to the Bankr AI agent |
| `bankr agent prompt --continue <text>` | Continue the most recent conversation thread |
| `bankr agent prompt --thread <id> <text>` | Continue a specific conversation thread |
| `bankr agent status <jobId>` | Check the status of a running job |
| `bankr agent cancel <jobId>` | Cancel a running job |
| `bankr agent profile` | View/manage agent profile |
| `bankr agent skills` | Show all Bankr AI agent skills with examples |

### `bankr tokens` — Token Discovery

| Command | Description |
|---------|-------------|
| `bankr tokens search <query>` | Search for tokens by name or symbol |
| `bankr tokens info <symbol-or-address>` | Get detailed token information |


### `bankr club` — Bankr Club Membership

| Command | Description |
|---------|-------------|
| `bankr club` | Show membership status |
| `bankr club status` | Show plan, renewal date, and daily message count |
| `bankr club signup` | Subscribe (monthly, USDC default) |
| `bankr club signup --yearly` | Subscribe yearly ($198) |
| `bankr club signup --token <symbol-or-addr>` | Pay with USDC, BNKR, ETH, or any Base ERC-20 |
| `bankr club cancel` | Cancel subscription |

### Auth & Config Commands

| Command | Description |
|---------|-------------|
| `bankr login` | Authenticate with the Bankr API |
| `bankr login email <address>` | Send OTP to email (headless step 1) |
| `bankr login email <address> --code <otp> [options]` | Verify OTP and complete setup (headless step 2) |
| `bankr login --api-key <key>` | Login with an existing API key directly |
| `bankr logout` | Clear stored credentials |
| `bankr whoami` | Show current authentication info |
| `bankr config get [key]` | Get config value(s) |
| `bankr config set <key> <value>` | Set a config value |

### LLM Gateway Commands

| Command | Description |
|---------|-------------|
| `bankr llm models` | List available LLM models |
| `bankr llm credits` | Check credit balance |
| `bankr llm credits add <amount>` | Top up LLM credits from wallet |
| `bankr llm credits auto [--enable/--disable]` | View or configure auto top-up |
| `bankr llm setup openclaw [--install]` | Generate or install OpenClaw config |
| `bankr llm setup claude` | Show Claude Code environment setup |
| `bankr llm claude [args...]` | Launch Claude Code via the Bankr LLM Gateway |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BANKR_API_KEY` | API key (overrides stored key) |
| `BANKR_API_URL` | API URL (default: `https://api.bankr.bot`) |
| `BANKR_LLM_KEY` | LLM gateway key (falls back to `BANKR_API_KEY` if not set) |
| `BANKR_LLM_URL` | LLM gateway URL (default: `https://llm.bankr.bot`) |
| `BANKR_NOT_INTERACTIVE` | Set to `1` to enable non-interactive mode globally |


## Capabilities Overview

### Token Deployment

- **EVM (Base)**: Deploy ERC20 tokens via Clanker with customizable metadata and social links
- **Solana**: Launch SPL tokens via Raydium LaunchLab with bonding curve and auto-migration to CPMM
- Creator fee claiming on both chains
- Fee Key NFTs for Solana (50% LP trading fees post-migration)
- Optional fee recipient designation with 99.9%/0.1% split (Solana)
- Both creator AND fee recipient can claim bonding curve fees (gas sponsored)
- Optional vesting parameters (Solana)
- Rate limits: 1/day standard, 10/day Bankr Club (gas sponsored within limits)
- Tokens deployed through Bankr are always visible in your portfolio, even without market price data

### Trading Operations

- **Token Swaps**: Buy/sell/swap tokens across chains
- **Cross-Chain**: Bridge tokens between chains
- **Limit Orders**: Execute at target prices
- **Stop Loss**: Automatic sell protection
- **DCA**: Dollar-cost averaging strategies
- **TWAP**: Time-weighted average pricing

### Portfolio Management

- Check balances across all chains
- View USD valuations with optional PnL tracking
- View NFT holdings
- Track holdings by token or chain
- Real-time price updates
- Multi-chain aggregation

### Leverage Trading

- **Hyperliquid** (primary) — Perpetual futures on Hyperliquid L1 with on-chain order book. Crypto, stocks (TSLA, AAPL, NVDA via HIP-3), spot trading. Up to 50x leverage.
- **Avantis** (secondary) — Perpetuals on Base for crypto (up to 50x), forex and commodities (up to 100x)
- Stop loss, take profit, and position management on both platforms

### Polymarket Betting

- Search prediction markets
- Check odds
- Place bets on outcomes
- View positions
- Redeem winnings

### Automation

- Limit orders
- Stop loss orders
- DCA (dollar-cost averaging)
- TWAP (time-weighted average price)
- Scheduled commands


## Supported Chains

| Chain       | Native Token | Best For                      | Gas Cost |
| ----------- | ------------ | ----------------------------- | -------- |
| Base        | ETH          | Memecoins, general trading    | Very Low |
| Polygon     | POL          | Gaming, NFTs, frequent trades | Very Low |
| Ethereum    | ETH          | Blue chips, high liquidity    | High     |
| Solana      | SOL          | High-speed trading            | Minimal  |
| Unichain    | ETH          | Newer L2 option               | Very Low |
| World Chain | ETH          | Uniswap V3/V4 swaps          | Very Low |
| Arbitrum    | ETH          | DeFi, low-cost transactions   | Very Low |
| BNB Chain   | BNB          | BSC ecosystem trading         | Low      |

## Safety & Access Control

### Wallet-Level Security (bankr.bot → Security)

| Control | Default | Effect |
|---------|---------|--------|
| Pause all transactions | Off | Blocks every outbound transaction until unpaused |
| Daily spending limit | $500 / 24h | Rejects any tx that pushes rolling-24h USD outflow past the limit |
| Per-transaction limit | $500 | Rejects any single tx priced above the limit |
| Permitted recipients | Off | Restricts transfers/swaps to an allowlist |
| Disable arbitrary contract calls | Off | Blocks raw `/wallet/submit` and arbitrary transaction tools |

### API-Key Level Controls (bankr.bot/api)

- **Read-Only API Keys**: New keys default to `readOnly: true`. Use `--read-write` to disable.
- **IP Whitelisting**: Set `allowedIps` on your API key to restrict usage to specific IPs or CIDR ranges.
- **Recipient Allowlist**: Restrict which addresses the key can send funds to.

### Key Safety Rules

- Store keys in environment variables (`BANKR_API_KEY`, `BANKR_LLM_KEY`), never in source code
- Add `~/.bankr/` and `.env` to `.gitignore`
- Test with small amounts on low-cost chains (Base, Polygon) before production use
- Use `waitForConfirmation: true` with `/wallet/submit`
- Rotate keys periodically and revoke immediately if compromised


## Prompt Examples by Category

### Token Deployment

**Solana (LaunchLab):**

- "Launch a token called MOON on Solana"
- "Launch a token called FROG and give fees to @0xDeployer"
- "Deploy SpaceRocket with symbol ROCK"
- "Launch BRAIN and route fees to 7xKXtg..."
- "How much fees can I claim for MOON?"
- "Claim my fees for MOON" (works for creator or fee recipient)
- "Show my Fee Key NFTs"
- "Claim my fee NFT for ROCKET" (post-migration)
- "Transfer fees for MOON to 7xKXtg..."

**EVM (Clanker):**

- "Deploy a token called BankrFan with symbol BFAN on Base"
- "Claim fees for my token MTK"

### Trading

- "Buy $50 of ETH on Base"
- "Swap 0.1 ETH for USDC"
- "Sell 50% of my PEPE"
- "Bridge 100 USDC from Polygon to Base"

### Portfolio

- `bankr wallet portfolio` (direct, no AI processing)
- `bankr wallet portfolio --pnl` (include profit/loss)
- `bankr wallet portfolio --nfts` (include NFT holdings)
- "Show my portfolio"
- "What's my ETH balance?"

### Market Research

- "What's the price of Bitcoin?"
- "Analyze ETH price"
- "Trending tokens on Base"
- "Compare UNI vs SUSHI"

### Transfers

- "Send 0.1 ETH to vitalik.eth"
- "Transfer $20 USDC to @friend"
- "Send 50 USDC to 0x123..."

### Leverage

- "Long $100 of BTC on hyperliquid with 10x"
- "Short ETH with 5x on hyperliquid"
- "Show my hyperliquid positions"

### Automation

- "DCA $100 into ETH weekly"
- "Set limit order to buy ETH at $3,000"
- "Stop loss for all holdings at -20%"

### LLM Credits

- "Top up my LLM credits with $25"
- "Add $50 of LLM credits"
- "Top up LLM credits using my ETH"

## Resources

- **Documentation**: https://docs.bankr.bot
- **LLM Gateway Docs**: https://docs.bankr.bot/llm-gateway/overview
- **API Key Management**: https://bankr.bot/api
- **Terminal**: https://bankr.bot/terminal
- **CLI Package**: https://www.npmjs.com/package/@bankr/cli
- **Twitter**: @bankr_bot
