export const CODE: Record<string, () => string> = {
  s1: () => `
<div class="cl hl"><span class="lnum">1</span><span><span class="hl-kw">import</span> { <span class="hl-fn">paymentMiddleware</span> } <span class="kw">from</span> <span class="st">"x402-express"</span>;</span></div>
<div class="cl"><span class="lnum">2</span><span><span class="kw">import</span> { <span class="fn">createWallet</span> } <span class="kw">from</span> <span class="st">"x402-wallet"</span>;</span></div>
<div class="cl"><span class="lnum">3</span><span></span></div>
<div class="cl hd"><span class="lnum">4</span><span><span class="cm">// x402: agent pays 0.001 USDC per call</span></span></div>
<div class="cl hl"><span class="lnum">5</span><span>app.<span class="hl-fn">use</span>(<span class="hl-fn">paymentMiddleware</span>(wallet, {</span></div>
<div class="cl hl"><span class="lnum">6</span><span>  <span class="hl-st">"POST /v1/skill/analyze"</span>: {</span></div>
<div class="cl hl"><span class="lnum">7</span><span>    price: <span class="hl-st">"$0.001"</span>,</span></div>
<div class="cl hl"><span class="lnum">8</span><span>    network: <span class="hl-st">"base-sepolia"</span>,</span></div>
<div class="cl hl"><span class="lnum">9</span><span>    asset: <span class="hl-st">"USDC"</span></span></div>
<div class="cl hl"><span class="lnum">10</span><span>  }</span></div>
<div class="cl hl"><span class="lnum">11</span><span>}));</span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">Agent sends <code>POST /v1/skill/analyze</code>. Server responds <code>HTTP 402</code> with payment details (price, network, payTo). Agent signs EIP-3009, then retries with <code>X-PAYMENT</code> header.</div></div>`,
  s2: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// After x402 payment verified</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span><span class="hl-kw">const</span> receipt = <span class="kw">await</span> facilitator.<span class="hl-fn">verify</span>(</span></div>
<div class="cl hl"><span class="lnum">3</span><span>  req.headers[<span class="hl-st">"x-payment"</span>]</span></div>
<div class="cl hl"><span class="lnum">4</span><span>);</span></div>
<div class="cl"><span class="lnum">5</span><span></span></div>
<div class="cl hd"><span class="lnum">6</span><span><span class="cm">// Trigger CRE workflow via JWT</span></span></div>
<div class="cl hl"><span class="lnum">7</span><span><span class="hl-kw">const</span> jwt = <span class="fn">signJWT</span>({</span></div>
<div class="cl hl"><span class="lnum">8</span><span>  workflowId: <span class="hl-st">"cre-analyze"</span>,</span></div>
<div class="cl hl"><span class="lnum">9</span><span>  txHash: receipt.<span class="fn">txHash</span>,</span></div>
<div class="cl hl"><span class="lnum">10</span><span>  paidAmount: <span class="hl-st">"0.001"</span></span></div>
<div class="cl hl"><span class="lnum">11</span><span>});</span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">Facilitator calls <code>POST /verify</code> to validate payment proof. Once confirmed, submits USDC transfer on Base L2. Returns <code>HTTP 200</code>. API Call generates a signed JWT to trigger CRE.</div></div>`,
  s3: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// CRE workflow handler</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span><span class="hl-kw">func</span> <span class="hl-fn">Handle</span>(ctx runtime.Context) {</span></div>
<div class="cl hl"><span class="lnum">3</span><span>  jwt := ctx.<span class="hl-fn">GetTrigger</span>()</span></div>
<div class="cl hl"><span class="lnum">4</span><span>  claims := <span class="fn">verifyJWT</span>(jwt)</span></div>
<div class="cl"><span class="lnum">5</span><span></span></div>
<div class="cl hd"><span class="lnum">6</span><span>  <span class="cm">// Workflow begins execution</span></span></div>
<div class="cl hl"><span class="lnum">7</span><span>  workflow := runtime.<span class="hl-fn">NewWorkflow</span>(</span></div>
<div class="cl hl"><span class="lnum">8</span><span>    claims.WorkflowID,</span></div>
<div class="cl hl"><span class="lnum">9</span><span>  )</span></div>
<div class="cl"><span class="lnum">10</span><span>  workflow.<span class="fn">Start</span>()</span></div>
<div class="cl"><span class="lnum">11</span><span>}</span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">CRE runtime receives <code>POST /cre/trigger</code> with the JWT. Verifies claims and starts the Chainlink workflow. Next: fetch secrets from Vault DON.</div></div>`,
  s4: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// Vault DON — threshold decryption</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span>secret := runtime.<span class="hl-fn">GetSecret</span>(</span></div>
<div class="cl hl"><span class="lnum">3</span><span>  <span class="hl-st">"CREATOR_API_KEY"</span>,</span></div>
<div class="cl hl"><span class="lnum">4</span><span>)</span></div>
<div class="cl"><span class="lnum">5</span><span></span></div>
<div class="cl hd"><span class="lnum">6</span><span><span class="cm">// K-of-N nodes decrypt shares</span></span></div>
<div class="cl hd"><span class="lnum">7</span><span><span class="cm">// Secret never stored in plaintext</span></span></div>
<div class="cl hd"><span class="lnum">8</span><span><span class="cm">// Only available in secure enclave</span></span></div>
<div class="cl"><span class="lnum">9</span><span></span></div>
<div class="cl"><span class="lnum">10</span><span><span class="cm">// 🔑🔑🔑 → 🔓 recombined in TEE</span></span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">CRE sends <code>POST /getSecret</code> to Vault DON. K-of-N DON nodes contribute threshold decryption shares. Secret recombined only inside TEE — never on-chain, never in logs.</div></div>`,
  s5: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// Confidential HTTP — key used, never exposed</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span>resp := runtime.<span class="hl-fn">ConfidentialHTTP</span>(</span></div>
<div class="cl hl"><span class="lnum">3</span><span>  <span class="hl-st">"POST"</span>,</span></div>
<div class="cl hl"><span class="lnum">4</span><span>  <span class="hl-st">"https://api.creator.com/analyze"</span>,</span></div>
<div class="cl hl"><span class="lnum">5</span><span>  map[string]string{</span></div>
<div class="cl hl"><span class="lnum">6</span><span>    <span class="hl-st">"Authorization"</span>: secret,</span></div>
<div class="cl hl"><span class="lnum">7</span><span>  },</span></div>
<div class="cl"><span class="lnum">8</span><span>)</span></div>
<div class="cl"><span class="lnum">9</span><span></span></div>
<div class="cl hd"><span class="lnum">10</span><span><span class="cm">// 🗑️ secret = nil — discarded immediately</span></span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">CRE sends <code>POST /api/analyze</code> via Confidential HTTP. API key injected in Authorization header inside the enclave. After <code>HTTP 200</code>, the secret is discarded — never in output, logs, or chain.</div></div>`,
  s6: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// Return result — secret never in output</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span>result := resp.<span class="hl-fn">Body</span>()</span></div>
<div class="cl"><span class="lnum">3</span><span></span></div>
<div class="cl hd"><span class="lnum">4</span><span><span class="cm">// Strip any sensitive data</span></span></div>
<div class="cl hl"><span class="lnum">5</span><span>clean := <span class="fn">sanitize</span>(result)</span></div>
<div class="cl"><span class="lnum">6</span><span></span></div>
<div class="cl hl"><span class="lnum">7</span><span><span class="hl-kw">return</span> runtime.<span class="hl-fn">Response</span>{</span></div>
<div class="cl hl"><span class="lnum">8</span><span>  Status: <span class="nm">200</span>,</span></div>
<div class="cl hl"><span class="lnum">9</span><span>  Body:   clean,</span></div>
<div class="cl hl"><span class="lnum">10</span><span>}</span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>TRIGGERED FLOW</div><div class="cxb">CRE returns sanitized result via <code>HTTP 200</code> to API Call, which forwards the final response back to the Agent. Secret never appeared in output, logs, or on-chain.</div></div>`,
  s7: () => `
<div class="cl hd"><span class="lnum">1</span><span><span class="cm">// Settlement confirmation</span></span></div>
<div class="cl hl"><span class="lnum">2</span><span><span class="hl-kw">const</span> tx = <span class="kw">await</span> chain.<span class="hl-fn">getTransaction</span>(</span></div>
<div class="cl hl"><span class="lnum">3</span><span>  receipt.<span class="fn">txHash</span></span></div>
<div class="cl hl"><span class="lnum">4</span><span>);</span></div>
<div class="cl"><span class="lnum">5</span><span></span></div>
<div class="cl hd"><span class="lnum">6</span><span><span class="cm">// 0.001 USDC → Creator wallet</span></span></div>
<div class="cl hl"><span class="lnum">7</span><span>console.<span class="hl-fn">log</span>(<span class="hl-st">\`Settled: \${tx.amount} USDC\`</span>);</span></div>
<div class="cl hl"><span class="lnum">8</span><span>console.<span class="hl-fn">log</span>(<span class="hl-st">\`To: \${tx.payTo}\`</span>);</span></div>
<div class="cl hl"><span class="lnum">9</span><span>console.<span class="hl-fn">log</span>(<span class="hl-st">\`Block: \${tx.blockNumber}\`</span>);</span></div>
<div class="cl"><span class="lnum">10</span><span></span></div>
<div class="cl hd"><span class="lnum">11</span><span><span class="cm">// No subscription. No account. Per-call. Done.</span></span></div>
<div class="cx"><div class="cxt"><span class="dot-progress"></span>SETTLED</div><div class="cxb">USDC transfer of 0.001 confirmed on Base L2 in ~2 seconds. Creator gets paid atomically per call — no middleman, no subscription, no account needed.</div></div>`
};
