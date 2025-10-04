# Fabstir LLM Chat - User Guide

## Introduction

### What is Fabstir LLM Chat?

Fabstir LLM Chat is a decentralized, peer-to-peer AI chat application built on blockchain technology. It connects you directly with AI model hosts in a secure, transparent marketplace where you pay only for what you use.

### Key Features

- **Decentralized Network**: Connect directly to P2P AI hosts (no middleman)
- **Blockchain Payments**: Secure smart contract-based sessions
- **Multiple AI Models**: Choose from TinyVicuna, Llama 3.2, and more
- **Cross-Device Sync**: Your preferences sync across all devices
- **Transparent Pricing**: See exact costs per token before you chat
- **Offline Support**: Works with cached data when offline

### What is S5 Storage?

S5 is a decentralized storage protocol that saves your preferences securely. Your settings are:
- Encrypted and stored across distributed nodes
- Accessible from any device using the same wallet
- Cached for 5 minutes for optimal performance
- Persistent and reliable

---

## Getting Started

### First-Time Setup

When you first open Fabstir LLM Chat, you'll complete a simple 3-step wizard:

**Step 1: Connect Your Wallet**
1. Click "Connect Wallet" button
2. Choose your Web3 wallet (MetaMask, WalletConnect, Coinbase Wallet, etc.)
3. Approve the connection in your wallet
4. Your address appears in the header

**Step 2: Choose Your AI Model**
1. Browse available models with pricing info:
   - **TinyVicuna 1B**: Fastest response, lowest cost ($0.001/msg)
   - **Llama 3.2 1B Instruct**: Balanced speed and quality ($0.002/msg)
   - **Llama 3.2 3B Instruct**: Higher quality responses ($0.005/msg)
2. Click on your preferred model
3. Model is saved automatically

**Step 3: Select Theme**
1. Choose your preferred appearance:
   - **Light**: Bright and clear
   - **Dark**: Easy on the eyes
   - **Auto**: Follows your system preference
2. Theme applies immediately

**Step 4: Pick Payment Token**
1. Choose your preferred payment method:
   - **USDC**: Stablecoin pegged to $1
   - **ETH**: Ethereum's native token
2. This becomes your default for new sessions

**Step 5: Complete Setup**
- Click "Complete Setup"
- Your preferences are saved to S5 storage
- Chat interface appears

### Returning Users

If you've used Fabstir before:
1. Open the app
2. Settings load automatically from S5
3. Chat interface appears immediately
4. Your last used model is pre-selected
5. Start chatting right away!

---

## Core Features

### Changing AI Models

You can change your AI model anytime:

1. **Click model name** in the header (e.g., "Llama 3.2 1B Instruct")
2. **Browse available models** in the modal:
   - View pricing, speed, and quality information
   - See "Recently Used" models at the top
   - Explore all available models below
3. **Select new model** by clicking on it
4. **Auto-connection**: App automatically finds a compatible host
5. **Saved preference**: New model becomes your default

The app will:
- Discover all active hosts on the network
- Filter hosts that support your selected model
- Randomly select from compatible hosts
- Connect automatically

### Managing Funds

To deposit funds for AI sessions:

1. **Click balance** in the header (e.g., "$8.80 USDC")
2. **Deposit Modal opens** with two options:
   - **PRIMARY Account**: Your main wallet
   - **SUB Account**: Smart account for popup-free transactions
3. **Select deposit method**:
   - Choose USDC or ETH
   - Enter amount to deposit
4. **Approve transaction** in your wallet
5. **Funds available immediately**

**Account Types:**
- **PRIMARY**: Your connected wallet address
- **SUB**: Auto-created smart account (Base Account Kit)
  - First transaction creates it
  - Enables popup-free subsequent transactions
  - Holds USDC for sessions

### Starting a Chat Session

To begin chatting with AI:

1. **Click "Start Session"** button
   - Default session: ~$2 (USDC or ETH)
   - Duration: 24 hours
   - Tokens: Based on pricing tier
2. **Approve payment** in your wallet
3. **Session created** on blockchain
4. **WebSocket connected** to AI host
5. **Start chatting!**

Session details:
- **Token tracking**: Real-time token usage displayed
- **Cost calculation**: Exact cost per token shown
- **Session ID**: Displayed in Advanced Settings
- **Auto-end**: Sessions end when time expires or funds depleted

### Sending Messages

Once your session is active:

1. **Type your message** in the input box at the bottom
2. **Press Enter** or click the **Send** button
3. **AI responds** with streaming text (appears word-by-word)
4. **Token usage** updates in real-time
5. **Cost tracked** for transparency

**Keyboard Shortcuts:**
- `Enter`: Send message
- `Shift + Enter`: New line in message

---

## Advanced Features

### Advanced Settings Panel

Access advanced options by clicking **"⚙️ Show Advanced"** at the bottom:

**Session Details** (when active):
- Session ID (shortened for display)
- Total tokens used
- Total cost in USD
- Session status badge

**Host Information**:
- Host wallet address
- WebSocket endpoint
- Host stake amount (FAB tokens)
- "Change Host" button (manual selection)

**Account Balances**:
- PRIMARY account balance (USDC)
- SUB account balance (USDC)
- "Deposit More" button

**AI Model**:
- Currently selected model
- "Select Model" button (same as header click)

**Payment Token**:
- Toggle between USDC and ETH
- Affects future sessions only
- Visual feedback on selection

**Theme**:
- Switch between Light/Dark/Auto
- Applies immediately
- Syncs across devices

**Usage Analytics**:
- View usage history (coming soon)
- Track costs over time
- Performance metrics

**Settings Panel**:
- View all current settings
- See last updated timestamp
- Reset all preferences button

### Theme Preferences

Customize your app appearance:

1. **Expand Advanced Settings** panel
2. **Find "Theme" section**
3. **Choose preferred mode**:
   - **Light**: White background, dark text
   - **Dark**: Dark background, light text
   - **Auto**: Matches your system/browser preference
4. **Changes apply immediately**
5. **Syncs to all devices** (5-minute delay)

**Auto Mode Benefits:**
- Automatically switches with system theme
- No manual changes needed
- Consistent with OS appearance
- Saves eye strain (dark at night, light during day)

### Payment Token Selection

Set your default payment method:

1. **Expand Advanced Settings** panel
2. **Find "Payment Token" section**
3. **Click USDC or ETH** button:
   - **USDC**: Stablecoin ($1 = 1 USDC), predictable pricing
   - **ETH**: Native token, variable price
4. **Selection highlighted** with ring indicator
5. **Affects future sessions** (current session unchanged)
6. **Saved to preferences** automatically

### Offline Mode

The app works offline with cached data:

**When You Go Offline:**
- Orange **"You're offline" banner** appears at top
- Shows pending changes count
- "Retry" button to attempt reconnection
- App continues with cached settings (up to 5 minutes old)

**What Works Offline:**
- View cached settings
- Browse cached model list
- View last session info
- Change preferences (queued for sync)

**What Doesn't Work:**
- Starting new sessions (requires blockchain)
- Sending messages (requires WebSocket)
- Discovering hosts (requires network)
- Loading new settings from S5

**When You Reconnect:**
- Banner disappears automatically
- Queued changes sync to S5
- Fresh data loaded
- Full functionality restored

---

## Settings Sync

### Cross-Device Sync

Your preferences sync across all devices using the same wallet:

**How It Works:**
1. Change settings on **Device A** (e.g., select new model)
2. Settings **saved immediately** to S5 decentralized storage
3. **Device B** has a 5-minute cache of settings
4. After cache expires, **Device B loads** fresh settings from S5
5. Changes appear on **Device B** (within 5 minutes)

**What Syncs:**
- Selected AI model
- Recently used models list (max 5)
- Last used host address
- Theme preference (Light/Dark/Auto)
- Payment token preference (USDC/ETH)
- Advanced Settings panel state (expanded/collapsed)

**Cache Strategy:**
- **5-minute TTL** (Time To Live)
- Balances performance with freshness
- Matches S5 cache duration
- Predictable sync timing

### Resetting Preferences

If you want to start fresh:

1. **Expand Advanced Settings** panel
2. **Scroll to "Settings Panel"** (at bottom)
3. **Click "Reset All"** button (destructive/red)
4. **Confirmation dialog appears** listing what will be deleted:
   - Selected AI model
   - Payment token preference
   - Theme preference
   - Recently used models
   - Host preferences
5. **Click "Reset All Preferences"** to confirm
6. **Page reloads** automatically
7. **Setup wizard appears** (first-time experience)

**⚠️ Warning**: This action cannot be undone!

---

## Troubleshooting

### App is Slow to Load

**Possible Causes:**
- Slow internet connection
- RPC endpoint congestion
- Browser cache issues
- Wallet extension problems

**Solutions:**
1. Check your internet speed
2. Try different network connection
3. Clear browser cache (Ctrl+Shift+Delete)
4. Disable browser extensions temporarily
5. Try incognito/private mode
6. Switch to different RPC endpoint (advanced)

### Settings Not Syncing

**Symptoms:**
- Changes on Device A don't appear on Device B
- Old preferences keep appearing
- Settings revert after refresh

**Solutions:**
1. **Wait 5+ minutes** (cache must expire first)
2. **Verify same wallet** used on both devices
3. **Check S5 status**: Look for error messages
4. **Force refresh**: Ctrl+F5 or Cmd+Shift+R
5. **Check browser console** for errors (F12)
6. **Try resetting preferences** if corruption suspected

### "No Compatible Hosts" Error

**Why This Happens:**
- Selected model has no active hosts
- All hosts for this model are offline
- Network discovery issues
- Blockchain sync problems

**Solutions:**
1. **Try different model** (TinyVicuna usually has hosts)
2. **Click "Discover Hosts"** to refresh host list
3. **Wait and retry** (hosts come online periodically)
4. **Check network status** (Base Sepolia)
5. **Verify internet connection**
6. **Use recently used model** (likely to have hosts)

### Session Won't Start

**Common Issues:**
- Insufficient balance in wallet
- Wallet not connected properly
- Wrong blockchain network
- Smart contract interaction failed

**Solutions:**
1. **Check balance** in header (need ~$2 minimum)
2. **Click "Deposit More"** if balance low
3. **Verify wallet connection** (disconnect/reconnect)
4. **Confirm network**: Must be Base Sepolia (Chain ID: 84532)
5. **Check wallet approval**: Session requires 2 transactions
6. **Try different browser/wallet**
7. **Refresh page** and retry

### Offline Banner Stuck

**If offline banner won't disappear:**

**Solutions:**
1. **Check actual internet**: Open another website
2. **Check browser status**: Look for offline indicator
3. **Force refresh**: Ctrl+F5
4. **Clear service workers**: DevTools > Application > Service Workers > Unregister
5. **Check DevTools console** for network errors (F12)
6. **Restart browser**

### Chat Messages Not Sending

**Symptoms:**
- Message typed but won't send
- Send button disabled
- No response from AI
- Error toast appears

**Solutions:**
1. **Verify session active**: Check "Active" badge
2. **Check balance**: Must have sufficient USDC/ETH
3. **Test WebSocket**: Look for connection errors in console
4. **End and restart session** if stuck
5. **Try different host** (via Advanced Settings)
6. **Refresh page** and reconnect

---

## Tips & Best Practices

### Model Selection
- **Start with TinyVicuna 1B**: Fastest and cheapest for testing
- **Upgrade to Llama 3.2 1B**: Better quality, still affordable
- **Use Llama 3.2 3B**: Best quality for important tasks
- **Check "Recently Used"**: Quick access to your favorite models

### Balance Management
- **Keep ~$5 USDC**: Enough for multiple sessions
- **Use SUB account**: Popup-free transactions after first deposit
- **Monitor spending**: Check cost dashboard in Advanced Settings
- **Deposit in advance**: Avoid interruptions during chat

### Theme Usage
- **Use Auto mode**: Automatically matches system (day/night)
- **Dark mode**: Reduces eye strain in low light
- **Light mode**: Better readability in bright environments
- **Syncs everywhere**: Set once, applies to all devices

### Offline Strategy
- **5-minute cache**: Settings work offline briefly
- **Plan ahead**: Make changes while online
- **Sync aware**: Wait 5 minutes for cross-device changes
- **Check banner**: Orange banner means offline/syncing

### Cross-Device Sync
- **Be patient**: 5-minute delay is normal
- **Same wallet required**: Different wallets = different settings
- **Force refresh**: Ctrl+F5 after 5 minutes if not updated
- **Clear cache**: If settings seem corrupted

### Reset Preferences
- **Last resort**: Only reset if experiencing persistent issues
- **Cannot undo**: All preferences deleted permanently
- **Fresh start**: Returns to setup wizard
- **Backup first**: Note your preferences before resetting

---

## Security & Privacy

### Wallet Security
- **Private keys never shared**: App never requests your private key
- **Transaction approval**: Every action requires your explicit consent
- **Non-custodial**: You control your funds at all times
- **Smart contract**: Audited code securing payments
- **Open source**: Transparent and verifiable

### S5 Storage Privacy
- **Encrypted**: Your settings are encrypted before storage
- **Decentralized**: No single point of failure
- **Wallet-linked**: Only accessible with your wallet
- **Ephemeral chat**: Messages not permanently stored
- **Blockchain minimal**: Only payment/proof data on-chain

### Analytics Privacy
- **Optional**: Controlled by environment variable
- **No PII**: Never tracks personal information
- **No wallet addresses**: Privacy-first analytics
- **What's tracked**: Model selections, theme changes, setup completion
- **Dev mode**: Events only logged to console (localhost)
- **Production**: Events stored in localStorage (last 100)

### Data Protection
- **Messages**: Ephemeral, not saved permanently
- **Settings**: Encrypted in S5, cached locally
- **Payments**: Blockchain records only (transparent)
- **Privacy**: No data sold or shared with third parties
- **GDPR friendly**: Minimal data collection

---

## Screenshots

*Note: Screenshots will be added in a future update. For now, please refer to the text descriptions and follow along in the live app.*

Planned screenshots:
- [ ] First-time setup wizard (3 steps)
- [ ] Main chat interface with active session
- [ ] Model selector modal with pricing
- [ ] Advanced settings panel (expanded view)
- [ ] Deposit funds modal (PRIMARY/SUB accounts)
- [ ] Settings panel with reset confirmation
- [ ] Offline mode banner display

---

## Support

### Where to Get Help

**Documentation:**
- Check [FAQ.md](./FAQ.md) for common questions
- Review this guide for detailed instructions
- See [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) for technical details

**Community:**
- GitHub Issues: [fabstir-llm-marketplace](https://github.com/Fabstir/fabstir-llm-marketplace/issues)
- Discord: [Join our Discord](#) (coming soon)
- Telegram: [Join our Telegram](#) (coming soon)

**Direct Contact:**
- Email: support@fabstir.com
- Twitter: [@FabstirApp](#)

### Reporting Bugs

If you encounter a bug:

1. **Check FAQ first**: Your issue might have a known solution
2. **Search GitHub Issues**: Someone may have reported it already
3. **Create new issue** with:
   - **Steps to reproduce**: Detailed instructions
   - **Expected behavior**: What should happen
   - **Actual behavior**: What actually happened
   - **Screenshots**: If applicable
   - **Environment**: Browser, wallet, OS info
   - **Console errors**: Copy from DevTools (F12)

**Example Bug Report:**
```
Title: Session won't start with Llama 3.2 3B model

Steps to reproduce:
1. Select Llama 3.2 3B Instruct model
2. Click "Start Session"
3. Approve payment in MetaMask
4. Session creation fails with error

Expected: Session should start successfully
Actual: Error toast "Session creation failed"

Environment:
- Browser: Chrome 120.0
- Wallet: MetaMask 11.5.0
- OS: Windows 11
- Network: Base Sepolia

Console error:
Error: Transaction reverted: insufficient allowance
```

### Feature Requests

Have an idea to improve Fabstir?

1. **Check existing requests**: Avoid duplicates
2. **Describe use case**: Why is this needed?
3. **Propose solution**: How should it work?
4. **Consider impact**: Who benefits?

---

## Developer Documentation

For technical details, see:
- [DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) - Architecture and implementation
- [SDK_API.md](./sdk-reference/SDK_API.md) - Complete SDK reference
- [UI_DEVELOPER_CHAT_GUIDE.md](./sdk-reference/UI_DEVELOPER_CHAT_GUIDE.md) - Chat implementation guide

---

## Glossary

**Blockchain**: Distributed ledger technology securing transactions
**DApp**: Decentralized Application (no central server)
**ETH**: Ethereum's native cryptocurrency
**Gas**: Transaction fee on blockchain
**P2P**: Peer-to-peer (direct connection, no middleman)
**RPC**: Remote Procedure Call (blockchain communication)
**S5**: Decentralized storage protocol
**Smart Contract**: Self-executing code on blockchain
**USDC**: USD Coin, stablecoin pegged to US Dollar
**Web3**: Decentralized internet using blockchain
**Wallet**: Software holding your crypto private keys

---

*Last Updated: [Date will be auto-generated]*
*Version: 1.0.0*
*Fabstir LLM Chat - Decentralized AI for Everyone*
