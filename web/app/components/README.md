# Agents-of-Truth

> **Every AI skill is just an HTTP call. We built the rails to make that call trustless.**

[![Chainlink Convergence 2026](https://img.shields.io/badge/Chainlink-Convergence%202026-375BD2?style=flat-square)](https://chain.link/hackathon)
[![Privacy Track](https://img.shields.io/badge/Track-Privacy-blueviolet?style=flat-square)]()
[![CRE & AI Track](https://img.shields.io/badge/Track-CRE%20%26%20AI-orange?style=flat-square)]()
[![Base Sepolia](https://img.shields.io/badge/Chain-Base%20Sepolia-0052FF?style=flat-square)]()

---

## The Problem

The agentic AI revolution is producing millions of skills, tools, and MCP servers. Every single one of them is locked behind a platform, a subscription, or a vendor relationship.

**Three things are broken:**

1. **Monetisation** — Skill creators charge subscriptions. AI agents don't have credit cards. There's no native per-call payment primitive.
2. **Credential exposure** — To deploy a skill, creators hand their API keys to third-party servers. One breach, every key is compromised.
3. **Platform lock-in** — Skills built for one LLM ecosystem can't be discovered or called by agents on another. There's no open registry.

---

## The Insight

> *Every skill. Every tool. Every MCP. Under the hood — it's just an HTTP call.*

If every skill is an HTTP endpoint, you can:
- Gate it with a payment protocol (`x402` — HTTP 402 + USDC)
- Execute it inside a trusted enclave (`Chainlink CRE`) 
- Protect the creator's credentials with threshold encryption (`Vault DON`)

No platform. No subscription. No key exposure. Just a call that pays itself.

---

## What We Built

**Agents-of-Truth** is an open, permissionless protocol for AI skill execution with three guarantees:

| Guarantee | How |
|---|---|
| **Per-call payment** | x402 protocol — agent pays 0.001 USDC on Base, payment is the authentication |
| **Credential privacy** | Vault DON threshold encryption — no single node holds the creator's API key |
| **Trustless execution** | CRE DON — BFT consensus across nodes, result verified before on-chain write |

---

## How It Works

```
AI Agent
  │
  │  POST /v1/skill/analyze
  ▼
x402 Gateway ──── 402 Payment Required ────► Agent pays 0.001 USDC on Base (~2s)
  │
  │  ServiceRequested event emitted on-chain
  ▼
Chainlink CRE Workflow  (all DON nodes execute in parallel)
  │
  ├──► Vault DON ──► getSecret(CREATOR_API_KEY)
  │                   threshold decryption — no single node holds the full key
  │                   key assembled in memory only
  │
  ├──► ConfidentialHTTPClient
  │       Bearer ${apiKey}  ──►  Skill API
  │                          ◄── 200 OK { result }
  │       apiKey: never logged, never on-chain, never visible to agent
  │
  └──► EVMClient ──► KeystoneForwarder ──► X402Agent.fulfillService()
                      multi-node signed report, verified on-chain

Creator receives USDC ✓  |  Agent receives verified result ✓
```

**7 steps. Atomic. Per call. No platform cut.**

---

## Repository Structure

```
cre/
├── execution/              # Log-triggered workflow — on-chain fulfillment
│   └── workflow/
│       ├── main.ts                          # Core: verify → execute → report
│       ├── contracts/evm/ts/generated/
│       │   ├── X402Agent.ts                 # Generated contract bindings
│       │   └── X402Agent_mock.ts            # Test mocks
│       ├── config.staging.json              # Base Sepolia + x402 facilitator
│       ├── config.production.json
│       ├── workflow.yaml
│       └── package.json
│
└── privacy/                # HTTP-triggered workflow — confidential execution
    └── workflow/
        ├── main.ts                          # Core: x402 verify → Vault → Conf.HTTP
        ├── config.staging.json
        ├── config.production.json
        ├── workflow.yaml
        └── package.json
```

---

## Technical Deep-Dive

### Workflow 1 — `cre/execution` (Log-Triggered, On-Chain Fulfillment)

Triggered by the `ServiceRequested` event emitted by the `X402Agent` smart contract. When an agent pays on-chain, the contract emits an event containing `serviceUrl` and `paymentPayload`. The CRE DON picks this up and orchestrates the full flow.

```typescript
// main.ts — three steps, one handler
const onLogTrigger = (runtime: Runtime<Config>, log: DecodedLog<ServiceRequestedDecoded>) => {

  // STEP 1 — Verify x402 payment proof via Coinbase facilitator
  const verifyRes = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: runtime.config.facilitator_verify_url,  // api.cdp.coinbase.com/platform/v2/x402/verify
      method: "POST",
      bodyString: JSON.stringify({ paymentProof: event.paymentPayload }),
      encryptOutput: false
    }
  }).result();

  // STEP 2 — Execute the skill (Confidential HTTP)
  const serviceRes = confidentialClient.sendRequest(runtime, {
    vaultDonSecrets: [],
    request: {
      url: event.serviceUrl,
      multiHeaders: { "X-X402-Payment-Proof": { values: [event.paymentPayload] } },
      encryptOutput: false
    }
  }).result();

  // STEP 3 — Write verified result on-chain via KeystoneForwarder
  agentContract.writeReportFromFulfillService(runtime, event.agent, resultData);
};
```

**`X402Agent` Contract Interface:**

```solidity
// Emitted when agent requests a skill with proof of x402 payment
event ServiceRequested(
  address indexed agent,
  string serviceUrl,
  string paymentPayload
);

// Called by CRE DON after verified execution
function fulfillService(address agent, string resultData) external;
```

---

### Workflow 2 — `cre/privacy` (HTTP-Triggered, Vault Secret Injection)

The privacy showcase. Accepts a `resource_url`, `payment_proof`, and optional `secret_id`. If a `secret_id` is provided, the Vault DON retrieves the corresponding creator API key via threshold decryption and injects it as a `Bearer` token — assembled in memory, used once, never logged.

```typescript
// THE PRIVACY CORE — secret never touches a log or the chain
const secrets = req.secret_id ? [{ key: req.secret_id, version: 1 }] : [];

const serviceRes = confidentialClient.sendRequest(runtime, {
  vaultDonSecrets: secrets,                          // ← Vault threshold decryption
  request: {
    url: req.resource_url,
    multiHeaders: {
      "Authorization": { values: [`Bearer {{.${req.secret_id}}}`] }, // ← injected at runtime
      "X-X402-Payment-Proof": { values: [req.payment_proof] }
    },
    encryptOutput: true                              // ← response encrypted in transit
  }
}).result();
```

**Request schema (Zod-validated, WASM-compatible):**

```typescript
const x402RequestSchema = z.object({
  resource_url:  z.string().url(),
  method:        z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  parameters:    z.record(z.string(), z.any()).optional(),
  payment_proof: z.string().min(1),
  secret_id:     z.string().optional(),  // present → Vault key injection
});
```

> **Note:** We use `.url()` with Zod rather than `.startsWith("http")` to maintain compatibility with the Javy WASM execution engine inside CRE.

---

## Privacy Model

The privacy guarantee is enforced at the **protocol level** — not by policy, not by trust in a single operator.

```
Creator deposits API key
          │
          ▼
  Vault DON — threshold encrypted
  ┌────┬────┬────┬────┬────┐
  │ N1 │ N2 │ N3 │ N4 │ N5 │  ← each holds one partial share
  └────┴────┴────┴────┴────┘
          │
          │  At runtime: quorum assembles plaintext in memory
          ▼
  Key used for one HTTP call
  Never logged. Never on-chain. Never visible to agent.
          │
          ▼
  Key discarded after call ✓
```

- **Threshold encryption** — attacker needs to compromise a quorum of nodes, not just one
- **`encryptOutput: true`** — API response encrypted in transit across the DON
- **Versioned secrets** — `{ key: secret_id, version: 1 }` supports key rotation without workflow redeployment
- **BFT consensus** — all nodes execute independently; result accepted only if quorum agrees

---

## Tech Stack

| Layer | Technology |
|---|---|
| Payment protocol | [x402](https://x402.org) — HTTP 402 + USDC |
| Payment verification | Coinbase `api.cdp.coinbase.com/platform/v2/x402/verify` |
| Settlement chain | Base Sepolia — chain selector `11155111` |
| Execution layer | Chainlink CRE — DON + BFT consensus |
| Secret management | Chainlink Vault DON — threshold encryption |
| Confidential HTTP | `ConfidentialHTTPClient` · `@chainlink/cre-sdk ^1.0.9` |
| On-chain writes | `EVMClient` → `KeystoneForwarder` → `X402Agent` |
| Runtime | Bun + TypeScript compiled to WASM via Javy (`cre-compile`) |

---

## Getting Started

### Prerequisites

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install CRE CLI
# See: https://docs.chain.link/chainlink-automation/cre
```

### Install & Simulate

```bash
# Execution workflow
cd cre/execution/workflow
bun install
cre workflow simulate . --target=staging-settings

# Privacy workflow
cd cre/privacy/workflow
bun install
cre workflow simulate . -T staging-settings --http-payload ../test-payload.json
```

### Test Payload (privacy workflow)

```json
{
  "resource_url": "https://echo.free.beeceptor.com",
  "method": "POST",
  "parameters": { "test": true },
  "payment_proof": "test_payment_payload",
  "secret_id": "CREATOR_API_KEY"
}
```

### Compile to WASM

```bash
cd cre/privacy/workflow
bun x tsc --noEmit          # type check
bun x cre-compile main.ts   # → main.wasm for DON deployment
```

### Environment

```bash
# .env — only needed if simulating chain writes
CRE_ETH_PRIVATE_KEY=<your_funded_base_sepolia_key>

# For workflows without chain writes, any dummy key works:
CRE_ETH_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
```

---

## Deployed Contracts

| Contract | Network | Address |
|---|---|---|
| `X402Agent` | Base Sepolia | `0x` — _add after deployment_ |

---

## Vision

The agentic economy needs infrastructure that doesn't exist yet. Agents need to discover, call, and pay for skills without human intermediaries. Creators need to monetise their work without handing over their credentials.

Agents-of-Truth is the primitive that makes this possible:

- **Open registry** — any skill, any chain, discoverable by any agent
- **Per-call economics** — atomic USDC payments, no subscriptions, no platform fees
- **Cryptographic privacy** — creator credentials protected at the protocol level, not by trust

When every HTTP call can pay itself and protect its secrets, the marketplace for AI capabilities becomes open, global, and permissionless.

---

## Team

| Name | Role | Contact |
|---|---|---|
| _add name_ | _add role_ | _add link_ |
| _add name_ | _add role_ | _add link_ |

**Demo:** _add demo link_
**Video:** _add video link_
**Live site:** _add Netlify/Vercel URL_

---

## Hackathon Tracks

- **🔒 Privacy Track** — Vault DON threshold encryption + CRE Confidential HTTP ensuring creator API keys are never exposed to any agent, operator, or third party
- **🤖 CRE & AI Track** — Full CRE workflow: log trigger from on-chain event, Confidential HTTP execution, EVMClient on-chain write via KeystoneForwarder, Vault secret injection

---

*Built at Chainlink Convergence 2026 · UNLICENSED*
