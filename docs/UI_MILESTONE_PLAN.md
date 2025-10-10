# Fabstir LLM Chat UI - Functional Milestone Development Plan

## Overview

This document provides a structured, milestone-based approach for building the Fabstir LLM Chat UI using Claude Code. Each phase produces visually verifiable, working features that build toward a complete ChatGPT-like interface for the P2P LLM marketplace.

**Core Principle**: Build functional, visually complete components at each step. No test files needed - verify everything works in the browser.

**Reference**: Follow `docs/UI_DEVELOPER_CHAT_GUIDE.md` for detailed implementation patterns and `examples/chat-context-popupfree-sdk-demo.tsx` for complex integrations.

---

## Phase 1: Foundation & Core Setup

### Overview

Set up the Next.js project with all dependencies, configurations, and base layout following UI_DEVELOPER_CHAT_GUIDE.md Part 1.

### Milestones

- [ ] Next.js 14+ project created with TypeScript, Tailwind, and App Router
- [ ] All dependencies installed (SDK, Web3, UI libraries)
- [ ] Environment variables configured
- [ ] Tailwind configuration with custom animations
- [ ] Base layout with providers structure
- [ ] Project runs without errors on localhost:3000

### Implementation Files

```
fabstir-llm-ui3/
├── package.json                    # All dependencies from guide
├── .env.local                      # Environment variables
├── tailwind.config.ts              # Custom animations config
├── app/
│   ├── layout.tsx                  # Root layout shell
│   ├── globals.css                 # Tailwind directives
│   └── page.tsx                    # Placeholder home page
└── lib/
    └── utils.ts                    # cn() utility function
```

### Key Tasks

1. Create Next.js project: `npx create-next-app@latest fabstir-llm-ui3 --typescript --tailwind --app`
2. Install all dependencies from Section 1.3 of the guide (CRITICAL - don't skip any)
3. Initialize shadcn/ui: `npx shadcn@latest init`
4. Add all shadcn components listed in the guide
5. Configure `.env.local` with RPC URLs and chain settings
6. Set up Tailwind config with pulse animation from guide
7. Create basic folder structure

### Success Criteria

- ✅ `npm run dev` starts without errors
- ✅ Tailwind styles working (test with a simple styled div)
- ✅ All dependencies installed successfully
- ✅ Environment variables loaded (console.log test)

---

## Phase 2: Wallet Connection & SDK Integration

### Overview

Implement wallet connection with RainbowKit and SDK initialization hooks following Part 2 of the guide.

### Milestones

- [ ] RainbowKit configured with multiple wallet support
- [ ] Wallet connection UI working (MetaMask, Coinbase, WalletConnect)
- [ ] SDK initialization hook (`useFabstirSDK`) functional
- [ ] Proper authentication flow with wallet
- [ ] Chain switching support (Base Sepolia)
- [ ] Visual feedback for connection states

### Implementation Files

```
fabstir-llm-ui3/
├── app/
│   ├── providers.tsx               # WagmiConfig + RainbowKit providers
│   └── layout.tsx                  # Updated with providers wrapper
├── components/
│   └── wallet-connect-button.tsx   # RainbowKit ConnectButton wrapper
├── hooks/
│   └── use-fabstir-sdk.ts         # SDK initialization and auth
└── lib/
    ├── wagmi-config.ts            # Wagmi chains and config
    └── constants.ts               # Chain IDs, contract addresses
```

### Key Tasks

1. Set up Wagmi configuration with Base Sepolia
2. Implement providers wrapper with RainbowKit
3. Create `useFabstirSDK` hook with proper initialization flow
4. Add wallet connection button to test in browser
5. Verify SDK authentication works after wallet connection
6. Add proper TypeScript types for all SDK managers

### Success Criteria

- ✅ Can connect MetaMask/wallet in browser
- ✅ Wallet address displays after connection
- ✅ SDK initializes and authenticates successfully
- ✅ Console shows "SDK initialized" without errors
- ✅ Can access SDK managers (sessionManager, paymentManager, etc.)

---

## Phase 3: Host Discovery & Selection

### Overview

Build the host discovery and selection UI components.

### Milestones

- [ ] Host discovery from blockchain working
- [ ] Host selector component with loading states
- [ ] Host metadata display (models, pricing, status)
- [ ] Automatic best host selection
- [ ] Manual host selection option
- [ ] Error handling for no hosts available

### Implementation Files

```
fabstir-llm-ui3/
├── components/
│   ├── host-selector.tsx          # Host selection UI
│   └── host-card.tsx              # Individual host display
└── hooks/
    └── use-hosts.ts               # Host discovery logic
```

### Key Tasks

1. Implement `useHosts` hook with React Query
2. Create HostSelector component from guide Section 3.5
3. Add loading skeleton while discovering hosts
4. Display host information cards
5. Implement auto-selection of best available host
6. Add refresh functionality

### Success Criteria

- ✅ "Discover Hosts" button triggers blockchain scan
- ✅ Available hosts display with metadata
- ✅ Can select a host for chat session
- ✅ Loading states work properly
- ✅ Handles "no hosts available" gracefully

---

## Phase 4: Core Chat Interface

### Overview

Build the main chat UI with message display, input, and animations following Section 3.3.

### Milestones

- [x] Message display with role-based styling
- [x] Smooth Framer Motion animations
- [x] Message input with keyboard shortcuts
- [x] Auto-scroll to latest message
- [x] Loading indicators for AI responses
- [x] Token count badges
- [x] Responsive design (mobile + desktop)

### Implementation Files

```
fabstir-llm-ui3/
├── components/
│   ├── chat-interface.tsx         # Main chat component
│   ├── chat-message.tsx          # Individual message component
│   ├── chat-input.tsx            # Input area component
│   └── typing-indicator.tsx      # AI thinking animation
└── hooks/
    └── use-chat.ts               # Chat state management
```

### Key Tasks

1. Implement ChatInterface component with ScrollArea
2. Add message rendering with role-based styling (user/assistant/system)
3. Implement Framer Motion animations for message appearance
4. Create input area with Shift+Enter for newline
5. Add auto-scroll behavior with useRef
6. Display token counts and costs per message
7. Add "AI is thinking..." loading state

### Success Criteria

- ✅ Messages display with proper styling (user=blue, assistant=green)
- ✅ Smooth animations when messages appear
- ✅ Input supports Enter to send, Shift+Enter for newline
- ✅ Auto-scrolls to bottom on new messages
- ✅ Shows loading indicator while waiting for response
- ✅ Mobile responsive layout works

---

## Phase 5: Session Management

### Overview

Implement session lifecycle management with payment handling.

### Milestones

- [x] Session creation with USDC deposit
- [x] Active session state management
- [x] Message sending through SDK
- [x] Context preservation across messages
- [x] Session ending with settlement
- [x] Balance tracking

### Implementation Files

```
fabstir-llm-ui3/
├── components/
│   ├── session-controls.tsx       # Start/end session buttons
│   └── session-status.tsx         # Active session indicator
└── hooks/
    └── use-chat-session.ts        # Full session management
```

### Key Tasks

1. Implement `useChatSession` hook from guide Section 3.2
2. Create SessionControls component with start/end buttons
3. Add USDC deposit flow ($2 default)
4. Implement message context building
5. Connect to WebSocket for streaming responses
6. Handle session end with payment settlement
7. Add toast notifications for all actions

### Success Criteria

- ✅ Can start session (requires USDC balance)
- ✅ Session ID displays when active
- ✅ Can send messages and receive AI responses
- ✅ Context preserved across multiple messages
- ✅ Can end session with proper settlement
- ✅ Toast notifications appear for all actions

---

## Phase 6: Cost Tracking & Analytics

### Overview

Build the cost dashboard with charts and usage tracking.

### Milestones

- [x] Real-time token counting
- [x] Cost calculation display
- [x] Usage charts with Recharts
- [x] Balance displays (USDC, ETH)
- [x] Earnings tracking for hosts
- [x] Session history view

### Implementation Files

```
fabstir-llm-ui3/
├── components/
│   ├── cost-dashboard.tsx         # Main dashboard component
│   ├── token-chart.tsx           # Token usage visualization
│   ├── balance-display.tsx       # Wallet balances
│   └── session-summary.tsx       # Session statistics
└── hooks/
    └── use-balances.ts           # Balance polling
```

### Key Tasks

1. Implement CostDashboard from guide Section 3.6
2. Add Recharts area chart for token usage
3. Create balance displays with auto-refresh
4. Track cumulative costs and tokens
5. Add session summary statistics
6. Implement CSV export for usage data

### Success Criteria

- ✅ Token count updates in real-time
- ✅ Cost calculation shows USD amount
- ✅ Chart visualizes token usage over time
- ✅ Balances refresh automatically
- ✅ Can export session data

---

## Phase 7: Complete App Assembly

### Overview

Wire everything together into the complete chat application following Part 4.

### Milestones

- [x] Main chat page with all components integrated
- [x] Tab interface for different payment modes
- [x] Settings panel for configuration
- [x] Error boundaries and fallbacks
- [x] Loading states throughout
- [x] Complete user flow working end-to-end

### Implementation Files

```
fabstir-llm-ui3/
├── app/
│   ├── chat/
│   │   └── page.tsx              # Main chat page
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   └── layout.tsx                # Updated with navigation
├── components/
│   ├── app-header.tsx            # Navigation header
│   ├── payment-mode-tabs.tsx    # ETH/USDC toggle
│   └── error-boundary.tsx       # Error handling wrapper
```

### Key Tasks

1. Create main chat page from guide Section 4.1
2. Integrate all components into cohesive UI
3. Add tabs for ETH vs USDC payment modes
4. Implement settings page for configuration
5. Add error boundaries for robustness
6. Create navigation header with branding
7. Test complete user flow

### Success Criteria

- [x] Complete flow: Connect → Discover → Start → Chat → End
- [x] All components work together seamlessly
- [x] Can switch between payment modes
- [x] Settings persist to localStorage
- [x] Errors handled gracefully
- [x] Professional, polished appearance

---

## Phase 8: Base Account Kit Integration (Advanced)

### Overview

Implement popup-free transactions using Base Account Kit following `chat-context-popupfree-sdk-demo.tsx`.

### Milestones

- [x] Base Account SDK setup
- [x] Sub-account creation
- [x] Spend permissions configuration
- [x] Popup-free session creation
- [x] Gasless transaction support
- [x] Permission caching

### Implementation Files

```
fabstir-llm-ui3/
├── hooks/
│   └── use-base-account.ts       # Base Account Kit integration
└── lib/
    ├── base-account.ts           # Account utilities
    └── spend-permissions.ts     # Permission management
```

### Key Tasks

1. Implement Base Account connection
2. Create sub-account setup flow
3. Configure spend permissions for SPM
4. Implement wallet_sendCalls for transactions
5. Cache S5 seed to avoid popups
6. Test popup-free flow after initial permission

### Success Criteria

- [x] First transaction: ONE popup for permission
- [x] Subsequent transactions: NO POPUPS
- [x] Sub-account displays separately from EOA
- [x] Gasless transactions working
- [x] Permissions persist across sessions

---

## Phase 9: Polish & Production Readiness

### Overview

Add final polish, optimizations, and production features.

### Milestones

- [x] S5 storage for conversation persistence
- [x] PWA configuration
- [x] Performance optimizations
- [x] Accessibility improvements
- [x] Analytics integration
- [x] Error tracking (Sentry)
- [x] Rate limiting
- [x] Session recovery

### Implementation Files

```
fabstir-llm-ui3/
├── hooks/
│   ├── use-s5-storage.ts        # S5 storage integration
│   ├── use-keyboard-shortcuts.ts # Keyboard navigation
│   └── use-session-recovery.ts  # Session recovery
├── lib/
│   ├── analytics.ts             # Usage tracking
│   ├── monitoring.ts            # Error tracking
│   └── rate-limit.ts            # Rate limiting
├── components/
│   ├── skip-nav.tsx             # Skip navigation link
│   ├── screen-reader-only.tsx   # Screen reader utilities
│   └── session-recovery-banner.tsx # Session recovery UI
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons (already present)
└── next.config.js               # PWA + bundle optimization
```

### Key Tasks

1. Implement S5 storage integration
2. Add PWA manifest and service worker
3. Optimize bundle size and performance
4. Add keyboard navigation support
5. Implement analytics tracking
6. Set up error monitoring
7. Add rate limiting middleware
8. Test on multiple devices and browsers

### Success Criteria

- ✅ Conversations persist across sessions
- ✅ Works offline (PWA)
- ✅ Lighthouse score > 90
- ✅ Fully keyboard navigable
- ✅ Analytics tracking working
- ✅ Errors reported to monitoring
- ✅ Handles high load gracefully

---

## Phase 10: Branding & Customization

### Overview

Apply Fabstir branding and create a unique visual identity.

### Milestones

- [x] Fabstir color scheme applied
- [x] Logo integration
- [x] Custom animations
- [x] Loading screens
- [x] Empty states
- [x] Success animations

### Implementation Files

```
fabstir-llm-ui3/
├── components/
│   ├── brand/
│   │   ├── logo.tsx             # Fabstir logo component
│   │   ├── loading-screen.tsx   # Branded loading screens
│   │   ├── animations.tsx       # Custom animations & success celebrations
│   │   ├── empty-state.tsx      # Beautiful empty states
│   │   └── index.ts             # Barrel export
├── app/
│   ├── globals.css              # Updated with Fabstir brand colors
│   └── chat/page.tsx            # Integrated branded components
├── components/
│   ├── app-header.tsx           # Updated with branded logo
│   └── chat-interface.tsx       # Updated with branded empty states
└── tailwind.config.ts           # Added custom Fabstir animations
```

### Key Tasks

1. Apply colors from `fabstir_color_profile_1.json`
2. Integrate logos from public folder
3. Create custom loading animations
4. Design beautiful empty states
5. Add micro-interactions
6. Implement success celebrations

### Success Criteria

- ✅ Consistent Fabstir branding throughout
- ✅ Smooth, professional animations
- ✅ Memorable user experience
- ✅ Stands out from generic interfaces
- ✅ Brand guidelines followed

---

## Phase 11: Dual Pricing System Integration (SDK v1.3.0)

### Overview

Integrate SDK v1.3.0's dual pricing system that separates native token (ETH/BNB) and stablecoin (USDC) pricing, allowing hosts to set independent prices for each payment method.

**Reference**: See `docs/DUAL_PRICING_INTEGRATION_PLAN.md` for detailed implementation plan with sub-phases.

### Milestones

- [ ] SDK v1.3.0 installed from tarball
- [ ] Type definitions updated with dual pricing fields
- [ ] Host discovery returns dual pricing data
- [ ] Session creation uses actual host pricing
- [ ] UI displays both USDC and ETH pricing
- [ ] Price filtering and sorting working
- [ ] Cost calculations accurate throughout

### Implementation Files

```
fabstir-llm-ui3/
├── types/
│   └── host.ts                    # Updated with dual pricing fields
├── hooks/
│   ├── use-hosts.ts              # Parse dual pricing from hosts
│   └── use-chat-session.ts       # Use actual host pricing
├── components/
│   ├── host-selector.tsx         # Display both prices
│   └── session-status.tsx        # Show pricing used in session
└── docs/
    └── DUAL_PRICING_INTEGRATION_PLAN.md  # Detailed sub-phase plan
```

### Key Tasks

1. **Sub-Phase 11.1**: SDK Upgrade & Environment Setup
2. **Sub-Phase 11.2**: Type System Updates
3. **Sub-Phase 11.3**: Host Discovery & Parsing
4. **Sub-Phase 11.4**: Session Creation Updates
5. **Sub-Phase 11.5**: UI Components & Display
6. **Sub-Phase 11.6**: Testing & Verification

### Success Criteria

- ✅ Hosts display both USDC and ETH prices
- ✅ Sessions use correct pricing based on payment token
- ✅ Cost calculations accurate to 6 decimals
- ✅ Backward compatible with fallback pricing (316 USDC)
- ✅ No hardcoded pricing values in code
- ✅ Users can see pricing before selecting host
- ✅ Blockchain verification confirms correct pricing

### Breaking Changes from v1.2.x

- ⚠️ `minPricePerToken` → `minPricePerTokenNative` + `minPricePerTokenStable`
- ⚠️ Must use `PaymentManager.approveToken()` for USDC approval
- ⚠️ Session config requires `chainId` parameter

---

## Development Guidelines

### For Claude Code

1. **Work through phases sequentially** - Each phase builds on the previous
2. **Complete full components** - Don't create simplified versions
3. **Include all imports and types** - Follow the guide exactly
4. **Test visually in browser** - Verify each milestone works
5. **Preserve all features** - Don't skip animations or polish
6. **Use the reference files** - Check examples when stuck

### Code Quality Standards

- TypeScript strict mode enabled
- All props and returns typed
- Error boundaries around major components
- Loading states for all async operations
- Responsive design for all screen sizes
- Accessibility attributes (ARIA labels)
- Meaningful variable and function names

### Testing Approach

- Visual verification in browser for each component
- Test wallet connection with real MetaMask
- Use Base Sepolia testnet for transactions
- Verify WebSocket connections with console logs
- Check responsive design at multiple breakpoints
- Test keyboard navigation and screen readers

---

## Success Metrics

### MVP Complete When

- [ ] User can connect wallet
- [ ] User can discover and select hosts
- [ ] User can start session with USDC payment
- [ ] User can have multi-turn conversations
- [ ] Context preserved across messages
- [ ] User can end session with settlement
- [ ] Cost tracking visible throughout
- [ ] Professional UI/UX comparable to ChatGPT

### Production Ready When

- [ ] Base Account Kit working (popup-free)
- [ ] S5 storage integrated
- [ ] Performance optimized (Lighthouse > 90)
- [ ] Error handling comprehensive
- [ ] Analytics tracking active
- [ ] Rate limiting implemented
- [ ] Fully accessible (WCAG 2.1 AA)
- [ ] Deployed to production environment

---

## Quick Start for Claude Code

```
Instructions for Claude Code:

1. Start with Phase 1: Create the Next.js project and install all dependencies from UI_DEVELOPER_CHAT_GUIDE.md Section 1.3
2. Set up the basic file structure and environment variables
3. Verify the project runs with `npm run dev`
4. Move to Phase 2: Implement wallet connection
5. Continue through each phase sequentially
6. After each component, verify it works visually in the browser
7. Don't skip any features - implement everything in the guide
8. Use chat-context-popupfree-sdk-demo.tsx as reference for complex parts
9. Ask for clarification if any part of the guide is unclear
10. Celebrate milestones - this is a substantial application!
```

---

## Resources

- **Primary Guide**: `docs/UI_DEVELOPER_CHAT_GUIDE.md`
- **Reference Implementation**: `examples/chat-context-popupfree-sdk-demo.tsx`
- **ETH Flow Example**: `examples/eth-mvp-flow-sdk.test.tsx`
- **SDK Quick Reference Documentation**: `docs/SDK_QUICK_REFERENCE.md`
- **SDK Documentation**: `docs/SDK_API.md`
- **Dual Pricing Integration Plan**: `docs/DUAL_PRICING_INTEGRATION_PLAN.md` (Phase 11)
- **Brand Assets**: `public/` folder and `docs/fabstir_color_profile_1.json`

---

**Remember**: The goal is to build a production-quality, visually stunning chat interface that showcases the power of the Fabstir P2P LLM marketplace. Every phase should produce working, polished features that delight users. Good luck! 🚀
