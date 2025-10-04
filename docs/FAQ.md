# Fabstir LLM Chat - Frequently Asked Questions

## General Questions

### What is Fabstir LLM Chat?

Fabstir is a decentralized, peer-to-peer AI chat marketplace built on blockchain. It connects users directly with AI model hosts for private, secure conversations. Unlike traditional AI services, Fabstir operates on a P2P network where:
- No single company controls the infrastructure
- Payments are secured by blockchain smart contracts
- Users maintain full control of their data
- Pricing is transparent (pay per token)
- Multiple AI models available from various hosts

### How is this different from ChatGPT?

| Feature | Fabstir | ChatGPT |
|---------|---------|---------|
| Architecture | Decentralized P2P | Centralized server |
| Payment | Blockchain (USDC/ETH) | Credit card subscription |
| Privacy | Self-custody, ephemeral | Company-controlled |
| Model Choice | Multiple models | OpenAI models only |
| Pricing | Pay-per-token | Monthly subscription |
| Control | User-owned wallet | Account-based |
| Transparency | Open source, on-chain | Proprietary |

**Key Advantages:**
- **Decentralized**: No single point of failure
- **Transparent**: See exact costs before chatting
- **Privacy**: Messages not permanently stored
- **Choice**: Select from multiple AI models
- **Control**: Your wallet, your data

### What is S5 storage?

S5 is a decentralized storage protocol used to save your preferences. Think of it like Dropbox, but:
- **Decentralized**: Data stored across distributed nodes (no single server)
- **Encrypted**: Your settings are encrypted before storage
- **Wallet-linked**: Access settings from any device with same wallet
- **Cached**: 5-minute local cache for performance
- **Persistent**: Data survives even if some nodes go offline
- **Privacy-focused**: No personal information required

**How it works:**
1. You change a setting (e.g., select new model)
2. Setting encrypted with your wallet signature
3. Stored on S5 distributed network
4. Cached locally for 5 minutes
5. Accessible from any device using same wallet

### Why do I need a Web3 wallet?

A Web3 wallet is required for several reasons:
- **Authentication**: Proves your identity without passwords
- **Payments**: Send USDC/ETH for AI sessions
- **Settings**: Encrypts and retrieves your preferences from S5
- **Security**: Non-custodial (you control private keys)
- **Sessions**: Smart contracts require wallet signatures

**Supported Wallets:**
- MetaMask
- WalletConnect (Rainbow, Trust Wallet, etc.)
- Coinbase Wallet
- Any wallet supporting Base Sepolia network

---

## Settings & Sync

### Why do my settings sync across devices?

Settings sync because they're saved to S5 decentralized storage linked to your wallet address:

**The Process:**
1. **Device A**: Change setting → Saved to S5 (linked to wallet address)
2. **Device B**: Same wallet → Loads same settings from S5
3. **Result**: Identical preferences across all devices

**What's Synced:**
- Selected AI model
- Recently used models (up to 5)
- Last host address
- Theme preference (Light/Dark/Auto)
- Payment token (USDC/ETH)
- Advanced Settings panel state

**Not Synced:**
- Active sessions (device-specific)
- WebSocket connections
- Temporary UI state
- Browser cache

### How long does cross-device sync take?

**Typical sync time: 0-5 minutes**

**The Timeline:**
1. **0s**: Change setting on Device A
2. **0s**: Immediately saved to S5 storage
3. **0-5min**: Device B's cache expires (5-minute TTL)
4. **5min+**: Device B loads fresh settings from S5
5. **Done**: Settings now synced

**Why 5 minutes?**
- **Performance**: Reduces S5 queries
- **Cost**: Minimizes blockchain operations
- **Battery**: Saves device resources
- **Standard**: Matches S5 cache duration

**Force immediate sync:**
- Refresh page on Device B (Ctrl+F5)
- Clear browser cache
- Restart browser

### Can I use different settings on different devices?

**No**, settings are wallet-based. Same wallet = same settings everywhere.

**Why This Design?**
- **Consistency**: Predictable experience across devices
- **Simplicity**: One set of preferences to manage
- **Security**: Settings tied to cryptographic identity
- **Sync**: Automatic without configuration

**Workaround** (if needed):
- Use different wallets for different preferences
- Each wallet has independent settings
- Switch wallets to switch preferences

### What happens if I reset my preferences?

When you reset preferences:

**Immediately:**
- ✅ All settings deleted from S5 storage
- ✅ Page reloads automatically
- ✅ Setup wizard appears (first-time experience)
- ✅ Must complete 3-step wizard again

**Settings Deleted:**
- Selected AI model
- Recently used models list
- Last host address
- Theme preference
- Payment token preference
- Advanced Settings panel state

**Not Affected:**
- Blockchain transactions (permanent)
- Wallet balance (unchanged)
- Browser cache (separate)
- S5 account (still exists)

**⚠️ Cannot Be Undone!**
- Settings are permanently deleted
- No backup or recovery
- Make note of current settings if needed

---

## Offline & Connectivity

### What happens if I'm offline?

The app continues to work with cached data:

**What Works Offline:**
- ✅ View cached settings (up to 5 minutes old)
- ✅ Browse cached model list
- ✅ View last session information
- ✅ Change preferences (queued for sync)
- ✅ View cached balances

**What Doesn't Work:**
- ❌ Start new sessions (requires blockchain)
- ❌ Send chat messages (requires WebSocket)
- ❌ Discover hosts (requires network)
- ❌ Load fresh settings from S5
- ❌ Make deposits (requires blockchain)

**User Experience:**
- Orange "You're offline" banner appears
- Shows count of pending changes
- "Retry" button to attempt reconnection
- App remains functional for viewing

**When Reconnected:**
- Banner disappears automatically
- Queued changes sync to S5
- Fresh data loaded from network
- Full functionality restored

### Can I chat offline?

**No**, active chat requires:
- ✅ Active internet connection
- ✅ Connected Web3 wallet
- ✅ Running blockchain session
- ✅ Live WebSocket to AI host
- ✅ Real-time token streaming

**Why No Offline Chat?**
- AI inference requires live host connection
- Blockchain transactions need network
- WebSocket streaming is real-time only
- Token proofs submitted on-chain

**Offline Alternatives:**
- View cached chat history (if available)
- Prepare messages for sending later
- Review session costs and analytics

### What if S5 storage is unavailable?

If S5 is down or unreachable:

**App Response:**
1. Shows "Unable to load settings" error
2. Offers two options:
   - **Retry**: Attempt to load again
   - **Use Defaults**: Continue with default preferences
3. You can still use the app with defaults

**Using Defaults:**
- Model: TinyVicuna 1B (most common)
- Theme: Auto (system preference)
- Payment: USDC
- No recent models list
- No saved host

**When S5 Reconnects:**
- Settings will save normally
- Queued changes sync automatically
- Preferences resume normal operation

**Persistence:**
- Settings cached in localStorage (5 minutes)
- Even if S5 down, recent settings available
- Full recovery once S5 accessible again

---

## Models & Hosts

### How do I change my default model?

**Quick Method** (via Header):
1. Click model name in header (e.g., "Llama 3.2 1B Instruct")
2. Model selector modal opens
3. Click desired model
4. Auto-saved as new default
5. Modal closes, header updates

**Advanced Method** (via Settings):
1. Expand Advanced Settings panel
2. Click "Select Model" button
3. Choose model from list
4. Settings saved automatically

**After Selection:**
- Becomes your default for future sessions
- Added to "Recently Used" list (max 5)
- App finds compatible host automatically
- Preference syncs across devices (5-min delay)

### What if no hosts support my chosen model?

**Error Message:**
"No compatible hosts found for this model"

**Why This Happens:**
- Model is newer/less common
- All hosts for this model offline
- Temporary network issues
- Discovery process incomplete

**Solutions (in order):**

1. **Try Different Model**:
   - Select TinyVicuna 1B (usually available)
   - Check "Recently Used" (likely to have hosts)

2. **Refresh Host List**:
   - Click "Discover Hosts" button
   - Wait for discovery to complete
   - Retry model selection

3. **Wait and Retry**:
   - Hosts come online periodically
   - Check back in 5-10 minutes
   - Network might be syncing

4. **Manual Host Selection**:
   - Expand Advanced Settings
   - Click "Change Host"
   - Browse available hosts manually
   - See which models each supports

5. **Check Network**:
   - Verify internet connection
   - Confirm Base Sepolia network active
   - Try refreshing entire page

### How are hosts selected automatically?

The **Smart Host Selection** algorithm:

```
1. User selects a model (e.g., "Llama 3.2 1B Instruct")
   ↓
2. App discovers all active hosts on network
   ↓
3. Filter hosts that support the selected model
   ↓
4. Randomly select from compatible hosts
   ↓
5. Auto-connect to selected host
   ↓
6. Save host address to preferences
```

**Benefits:**
- **Automatic**: No manual host selection needed
- **Load Balancing**: Random selection distributes traffic
- **Compatible**: Only hosts supporting your model
- **Fast**: Pre-filtered list for quick connection

**Randomization:**
- Prevents single host overload
- Fair distribution across network
- Better uptime (if one fails, others available)

### Can I choose a specific host manually?

**Yes!** Manual host selection available:

**Steps:**
1. Expand **Advanced Settings** panel (click ⚙️)
2. Scroll to **Host Information** section
3. Click **"Change Host"** button
4. Browse available hosts:
   - View host address
   - See supported models
   - Check stake amount (reliability indicator)
   - Review endpoint URL
5. Click on preferred host
6. Host saved to preferences
7. Modal closes, connection established

**When to Use Manual Selection:**
- Prefer specific host (better performance)
- Trust certain host more
- Testing/debugging purposes
- Host recommended by community
- Previous good experience

**Auto vs Manual:**
- **Auto**: Convenient, balanced, always available
- **Manual**: Control, consistency, preference-based

---

## Payments & Costs

### What payment tokens are supported?

**Two payment options:**

**USDC (USD Coin)**
- Stablecoin pegged to US Dollar ($1 = 1 USDC)
- Predictable pricing
- No exchange rate volatility
- Recommended for most users

**ETH (Ethereum)**
- Native blockchain token
- Variable price (market-based)
- Higher transaction fees
- For users with ETH holdings

**Default Session Costs:**
- USDC: $2.00 for ~2000 tokens
- ETH: ~0.0006 ETH (~$2.40)

**Changing Preference:**
- Advanced Settings → Payment Token
- Toggle between USDC and ETH
- Affects future sessions only
- Current session unaffected

### How much does a typical session cost?

**Default Session:**
- **Duration**: 24 hours
- **USDC Cost**: $2.00 (~2000 tokens)
- **ETH Cost**: ~0.0006 ETH (~$2.40 at current prices)
- **Proof Interval**: 100 tokens

**Cost Breakdown:**
- **90% to Host**: AI inference provider
- **10% to Treasury**: Protocol maintenance

**Variable Pricing** (by model):
| Model | Price per Message | Session Cost |
|-------|-------------------|--------------|
| TinyVicuna 1B | $0.001 | ~$2.00 |
| Llama 3.2 1B | $0.002 | ~$2.00 |
| Llama 3.2 3B | $0.005 | ~$2.00 |

**Factors Affecting Cost:**
- Message length (more tokens = higher cost)
- Model complexity (3B more expensive than 1B)
- Session duration (longer = more messages)
- Market rates (ETH price varies)

### What are PRIMARY and SUB accounts?

**Two account types for payments:**

**PRIMARY Account**
- Your connected wallet address
- Main account for deposits
- Requires popup approval for each transaction
- Full control, maximum security

**SUB Account** (Smart Account)
- Auto-created on first transaction
- Sub-account of your PRIMARY
- **Popup-free** transactions after first approval
- Uses Base Account Kit (Coinbase technology)
- Spend permissions configured automatically

**How SUB Account Works:**
1. First deposit: Approve in wallet (creates SUB account)
2. Set spend permission (max amount, duration)
3. Subsequent transactions: **No popups!**
4. Uses `wallet_sendCalls` (EIP-5792)
5. Batched transactions for efficiency

**When to Use Each:**
- **PRIMARY**: Initial deposits, large amounts, manual control
- **SUB**: Regular sessions, convenience, popup-free UX

**Security:**
- Both equally secure
- SUB limited by spend permission
- Can revoke SUB permission anytime
- PRIMARY always has full control

### How do I deposit more funds?

**Deposit Process:**

1. **Click Balance** in header (e.g., "$8.80 USDC")
2. **Deposit Modal Opens**:
   - Choose account (PRIMARY or SUB)
   - Select token (USDC or ETH)
3. **Enter Amount**:
   - Minimum: ~$2 (one session)
   - Recommended: $5-10 (multiple sessions)
4. **Approve Transaction**:
   - PRIMARY: Wallet popup approval
   - SUB: May be popup-free (if permission set)
5. **Confirmation**:
   - Transaction submitted to blockchain
   - Wait for confirmation (~15 seconds)
   - Balance updates automatically
6. **Start Chatting**:
   - Sufficient funds now available
   - Create session and begin

**Tips:**
- Deposit enough for multiple sessions
- Use SUB account for convenience
- USDC recommended (stable pricing)
- Monitor balance in header

---

## Troubleshooting

### "Wallet not connected" error

**Symptoms:**
- Can't access app features
- Error toast appears
- No wallet address in header

**Solutions:**

1. **Initial Connection**:
   - Click "Connect Wallet" button (top right)
   - Choose wallet provider (MetaMask, WalletConnect, etc.)
   - Approve connection in wallet popup
   - Verify address appears in header

2. **Reconnection** (if disconnected):
   - Click wallet address in header
   - Select "Connect Wallet" again
   - Approve in wallet
   - Refresh page if needed

3. **Wallet Issues**:
   - Ensure wallet extension installed
   - Verify wallet unlocked
   - Check network is Base Sepolia (Chain ID: 84532)
   - Try different browser/incognito mode

4. **Persistent Problems**:
   - Restart browser
   - Reinstall wallet extension
   - Clear browser cache
   - Try different wallet provider

### Session stuck on "Starting..."

**Symptoms:**
- "Start Session" clicked
- Loading spinner indefinitely
- No session created
- Balance not deducted

**Common Causes & Solutions:**

**1. Insufficient Balance**
- Check header balance (need ~$2 minimum)
- Click balance → Deposit more funds
- Wait for confirmation, retry

**2. Network Issues**
- Verify Base Sepolia network selected in wallet
- Check internet connection
- Try different RPC endpoint
- Refresh page and retry

**3. Transaction Failed**
- Check wallet for failed transaction
- Increase gas price (if custom)
- Approve both transactions (deposit + session)
- Retry after confirmation

**4. Smart Contract Error**
- View wallet transaction details
- Check error message
- Verify sufficient token approval
- May need to reset allowance

**5. General Fixes**:
- Refresh page (Ctrl+F5)
- Disconnect and reconnect wallet
- Try different browser
- Clear cache and retry

### Settings not saving

**Symptoms:**
- Changes don't persist
- Reverts to old settings
- No "Settings updated" toast
- Error in console

**Diagnostics:**

1. **Check Connection**:
   - Verify internet active
   - Test with another website
   - Check browser offline indicator

2. **Verify Wallet**:
   - Confirm wallet connected
   - Check wallet address in header
   - Disconnect and reconnect if needed

3. **Browser Console** (F12):
   - Look for S5 errors
   - Check network tab for failed requests
   - Note any error messages

**Solutions:**

**S5 Storage Issue**:
- Wait and retry (S5 may be temporarily unavailable)
- Settings will queue and sync when S5 recovers
- Use "Use Defaults" option if urgent

**Browser Problem**:
- Try incognito/private mode
- Different browser
- Clear all site data
- Disable extensions temporarily

**Cache Corruption**:
- Clear localStorage: DevTools > Application > Local Storage > Clear
- Refresh page
- Retry settings change

**Last Resort**:
- Reset all preferences (Advanced Settings)
- Reconfigure from scratch
- Report bug if persists

### "Failed to load preferences" error

**When This Happens:**
- App startup
- After page refresh
- When loading settings from S5
- Network interruption

**Error Message Shows:**
"Unable to load settings. Using defaults."

**What It Means:**
- S5 storage unreachable
- Network connectivity issue
- Cache expired, can't refresh
- No previous settings saved

**Available Options:**

**1. Retry**
- Click "Retry" button
- Attempts to load from S5 again
- May succeed if temporary issue
- Can retry multiple times

**2. Use Defaults**
- Click "Use Defaults" button
- Continue with default preferences:
  - Model: TinyVicuna 1B
  - Theme: Auto
  - Payment: USDC
  - No recent history
- Settings will save once S5 accessible

**When to Use Each:**
- **Retry**: If you have custom settings you want
- **Use Defaults**: If you need to proceed quickly

**After S5 Recovers:**
- Settings save normally
- Preferences sync properly
- Full functionality restored

---

## Privacy & Security

### Is my data private?

**Yes!** Fabstir prioritizes privacy:

**Messages:**
- ✅ Ephemeral (not permanently stored)
- ✅ Transmitted via encrypted WebSocket
- ✅ Only between you and AI host
- ✅ No central server logging

**Settings:**
- ✅ Encrypted before S5 storage
- ✅ Decentralized (no single point of access)
- ✅ Wallet-linked (only you can decrypt)
- ✅ Minimal data (just preferences)

**Blockchain:**
- ✅ Only payment and proof data on-chain
- ✅ Wallet address visible (public by nature)
- ✅ Transaction amounts public (blockchain standard)
- ✅ Message content **NOT** on blockchain

**What's NOT Private:**
- Wallet address (public blockchain)
- Transaction amounts (on-chain transparency)
- Session creation events (public blockchain)
- Payment history (blockchain records)

### What analytics are collected?

**If Analytics Enabled** (configurable):

**Events Tracked:**
- Model selection (model ID, source)
- Theme changes (light/dark/auto)
- Settings reset (timestamp only)
- Setup wizard completion
- Host auto-selection (model ID only)

**NOT Tracked:**
- ❌ Wallet addresses (privacy-first)
- ❌ Personal information (no PII)
- ❌ Message content (ephemeral)
- ❌ IP addresses (decentralized)
- ❌ Device identifiers (anonymous)

**Where Stored:**
- **Dev Mode** (localhost): Console logs only
- **Production**: localStorage (last 100 events)
- **No Third Parties**: Never sent externally (yet)

**Purpose:**
- Improve user experience
- Identify common preferences
- Optimize model selection
- Debug issues

### Can I disable analytics?

**Yes!** Analytics is optional:

**Environment Variable:**
```
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

**Default Behavior:**
- **Development** (localhost): Disabled by default
- **Production**: Enabled by default
- **Override**: Set env var to change

**How to Disable:**
1. Set environment variable to `false`
2. Rebuild app: `npm run build`
3. Restart server
4. Verify in console (should see: "Analytics disabled")

**Impact of Disabling:**
- ✅ No events tracked
- ✅ No data in localStorage
- ✅ Fully private usage
- ❌ Developers can't identify common issues
- ❌ No usage insights for improvements

### Is my wallet safe?

**Yes!** Wallet security is paramount:

**Private Keys:**
- ✅ **Never Requested**: App never asks for private keys
- ✅ **Never Transmitted**: Keys stay in your wallet
- ✅ **Never Stored**: No key storage in app
- ✅ **Wallet-Controlled**: Only wallet handles keys

**Transactions:**
- ✅ **Explicit Approval**: Every transaction requires wallet popup
- ✅ **Clear Intent**: Action details shown before approval
- ✅ **Non-Custodial**: You control when to approve
- ✅ **Reversible**: Can reject any transaction

**Smart Contracts:**
- ✅ **Audited**: Code reviewed by security experts [link needed]
- ✅ **Open Source**: Fully transparent and verifiable
- ✅ **Battle-Tested**: Inherited from production-ready code
- ✅ **Upgradeable**: Security patches possible

**Best Practices:**
- Use reputable wallet (MetaMask, Coinbase, etc.)
- Verify transaction details before approving
- Keep wallet software updated
- Never share seed phrase/private keys
- Use hardware wallet for large amounts

---

## Advanced Topics

### What is the proof system?

The proof system ensures hosts deliver tokens before receiving payment:

**How It Works:**
1. **Session Starts**: User deposits $2 to smart contract
2. **Chat Begins**: User sends messages, AI responds
3. **Proofs Submitted**: Host submits proof every 100 tokens
4. **Verification**: Smart contract verifies proof validity
5. **Payment Released**: Verified tokens paid to host
6. **Session Ends**: Final proof submitted, remainder paid

**Proof Interval:**
- Default: 100 tokens
- Host must prove delivery every 100 tokens
- Ensures incremental payment (not all upfront)
- Prevents host fraud

**Payment Distribution:**
- 90% to Host (AI inference provider)
- 10% to Treasury (protocol maintenance)

**Security Benefits:**
- Hosts can't take payment without delivery
- Users protected from non-delivery
- Automated via smart contracts
- No disputes needed (math proves delivery)

### How does popup-free payment work?

**Base Account Kit** (Coinbase technology):

**First Transaction** (One Popup):
1. User deposits to PRIMARY account
2. Wallet popup requests approval
3. **SUB account created** automatically
4. **Spend permission set**:
   - Token: USDC
   - Amount: Up to configured maximum
   - Duration: 30 days
   - Period: Daily reset

**Subsequent Transactions** (No Popups):
1. User clicks "Start Session"
2. App uses `wallet_sendCalls` (EIP-5792)
3. Transaction sent from SUB account
4. **No popup needed** (within spend limit)
5. Session starts immediately

**Technical Details:**
- **EIP-5792**: Wallet method for batched calls
- **Spend Permission**: Set on first transaction
- **SUB Account**: Derived from PRIMARY (secure)
- **Manager Contract**: 0xf85210B21cC50302F477BA56686d2019dC9b67Ad

**Benefits:**
- Faster session start (no popup delay)
- Better UX (seamless experience)
- Batched transactions (gas optimization)
- Revocable permissions (user control)

### What blockchain network is used?

**Base Sepolia (Testnet)**

**Network Details:**
- **Chain ID**: 84532
- **Type**: Ethereum L2 (Layer 2)
- **Parent**: Base (Coinbase L2)
- **Purpose**: Testing before mainnet
- **RPC**: Alchemy endpoint

**Why Base Sepolia?**
- **Low Fees**: Cheaper than Ethereum mainnet
- **Fast**: Quick transaction confirmation (~2 seconds)
- **EVM Compatible**: Works with Ethereum tools
- **Base Account Kit**: Native support for smart accounts
- **Testnet**: Safe for development/testing

**Network Configuration:**
```
Network Name: Base Sepolia
Chain ID: 84532
Currency: ETH
RPC URL: https://base-sepolia.g.alchemy.com/v2/[key]
Block Explorer: https://sepolia.basescan.org
```

**Adding to Wallet:**
1. Open MetaMask
2. Networks → Add Network
3. Enter details above
4. Save and switch

### Can I use this on mainnet?

**Not yet.** Currently testnet only.

**Mainnet Requirements:**
- ✅ Smart contract audits completed
- ✅ Security testing comprehensive
- ✅ Production RPC endpoints configured
- ✅ Real USDC/ETH integration
- ✅ Host network stable and reliable
- ✅ Full legal compliance

**Testnet vs Mainnet:**

| Aspect | Testnet (Current) | Mainnet (Future) |
|--------|-------------------|------------------|
| Funds | Test tokens (free) | Real crypto |
| Risk | None (test only) | Financial risk |
| Hosts | Development hosts | Production hosts |
| Audits | In progress | Completed |
| Speed | Faster (less traffic) | Variable |
| Cost | Free | Real costs |

**Mainnet Timeline:**
- Audits: Q1 2025 [tentative]
- Beta Launch: Q2 2025 [tentative]
- Full Launch: Q3 2025 [tentative]

**Stay Updated:**
- Follow [@FabstirApp](#) on Twitter
- Join Discord for announcements
- Check GitHub releases

---

## Getting Help

### Where can I get support?

**Documentation:**
- [USER_GUIDE.md](./USER_GUIDE.md) - Comprehensive guide
- [FAQ.md](./FAQ.md) - This document
- [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) - Technical docs

**Community:**
- **GitHub Issues**: [fabstir-llm-marketplace](https://github.com/Fabstir/fabstir-llm-marketplace/issues)
- **Discord**: [Join our Discord](#) (coming soon)
- **Telegram**: [Join our Telegram](#) (coming soon)
- **Forum**: [Discourse forum](#) (planned)

**Direct Contact:**
- **Email**: support@fabstir.com
- **Twitter**: [@FabstirApp](#)
- **LinkedIn**: [Fabstir Company](#)

**Emergency:**
- Smart contract issues: security@fabstir.com
- Critical bugs: urgent@fabstir.com

### How do I report a bug?

**Before Reporting:**
1. Check this FAQ for known issues
2. Search [GitHub Issues](https://github.com/Fabstir/fabstir-llm-marketplace/issues)
3. Try troubleshooting steps in USER_GUIDE.md
4. Attempt reproduction in different browser

**Creating Bug Report:**

**Required Information:**
- **Title**: Clear, concise summary
- **Steps**: Detailed reproduction steps
- **Expected**: What should happen
- **Actual**: What actually happened
- **Environment**:
  - Browser (Chrome, Firefox, etc.) + version
  - Wallet (MetaMask, Coinbase, etc.) + version
  - OS (Windows, Mac, Linux) + version
  - Network (Base Sepolia confirmed)
- **Screenshots**: If applicable
- **Console Errors**: Copy from DevTools (F12 → Console)

**Example Report:**
```markdown
**Title**: Session creation fails with Llama 3.2 3B model

**Steps to Reproduce**:
1. Connect wallet (MetaMask 11.5.0)
2. Select Llama 3.2 3B Instruct model
3. Click "Start Session" button
4. Approve payment in wallet
5. Session creation fails with error

**Expected Behavior**:
Session should start successfully, WebSocket should connect

**Actual Behavior**:
Error toast appears: "Session creation failed"
Transaction reverts in wallet

**Environment**:
- Browser: Chrome 120.0.6099.129
- Wallet: MetaMask 11.5.0
- OS: Windows 11 Pro
- Network: Base Sepolia (84532)

**Screenshots**:
[Attach screenshot of error]

**Console Errors**:
```
Error: Transaction reverted: insufficient allowance
    at Object.revert (contracts.js:234)
    at SessionManager.createSession (session.js:89)
```

**Additional Context**:
- PRIMARY account balance: 5.00 USDC
- No SUB account created yet
- First time selecting this model
```

**Priority Levels:**
- **Critical**: App unusable, security risk
- **High**: Major feature broken, affects many users
- **Medium**: Feature issue, workaround exists
- **Low**: Minor issue, cosmetic

### Where is the developer documentation?

**For Developers:**

**Main Documentation:**
- [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) - Architecture and implementation
- [SDK_API.md](./sdk-reference/SDK_API.md) - Complete SDK reference
- [SDK_QUICK_REFERENCE.md](./sdk-reference/SDK_QUICK_REFERENCE.md) - Quick SDK patterns
- [UI_DEVELOPER_CHAT_GUIDE.md](./sdk-reference/UI_DEVELOPER_CHAT_GUIDE.md) - Chat implementation

**Technical Topics:**
- Settings schema and S5 caching
- Smart host selection algorithm
- Analytics integration patterns
- Base Account Kit implementation
- WebSocket streaming protocol
- Smart contract interaction

**Code Examples:**
- `/examples` directory - Reference implementations
- Test files - Unit and integration tests
- Component source - Well-commented code

**Contributing:**
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- Code style guidelines
- Pull request process
- Testing requirements

---

*Last Updated: [Date will be auto-generated]*
*Version: 1.0.0*
*Fabstir LLM Chat - Frequently Asked Questions*
