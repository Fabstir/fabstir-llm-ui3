# Developer Notes - Fabstir LLM Chat UI

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Settings Schema](#settings-schema)
3. [Caching Strategy](#caching-strategy)
4. [Smart Host Selection Algorithm](#smart-host-selection-algorithm)
5. [Offline Support](#offline-support)
6. [Known Limitations](#known-limitations)
7. [Future Enhancements](#future-enhancements)
8. [Code Patterns](#code-patterns)

---

## Architecture Overview

### Simplified UX Redesign

This codebase implements a **conversation-first** chat interface following a simplified UX redesign pattern:

**Core Principles**:
- **Model-first selection**: Users choose AI models by capability/price, system auto-selects compatible hosts
- **Persistent state**: Settings saved to S5 decentralized storage, sync across devices
- **Chat-centric UI**: 70% of screen for conversation, technical complexity hidden in Advanced Settings panel
- **Smart defaults**: Returning users see chat immediately, no repeated setup
- **Graceful degradation**: Works offline with cached settings

### Component Hierarchy

```
app/chat/page.tsx (Main coordinator)
├── SetupWizard (First-time users)
│   ├── Model selection
│   ├── Theme selection
│   └── Payment token preference
│
├── CompactHeader (Minimal top bar)
│   ├── Model name (clickable → ModelSelector)
│   ├── Balance (clickable → deposit)
│   └── Logo/branding
│
├── ChatInterface (Conversation area)
│   ├── Messages (Framer Motion animations)
│   ├── ChatInput (bottom-pinned)
│   └── EmptyState (no messages)
│
└── AdvancedSettingsPanel (Collapsible)
    ├── SettingsPanel (summary + reset)
    ├── ThemeSelector
    ├── PaymentTokenSelector
    ├── Host selector (manual override)
    └── Session details
```

### State Management

**React Query** for SDK data:
- Host discovery
- Session state
- Account balances

**React State** + **S5 Storage** for user preferences:
- Model selection
- Theme
- Payment token
- Advanced panel state

### SDK Integration Pattern

All SDK interactions follow the **Manager Pattern**:

```typescript
// ✅ Correct: Get managers from authenticated SDK
const sessionManager = await sdk.getSessionManager();
const paymentManager = sdk.getPaymentManager();
const storageManager = await sdk.getStorageManager();

// ❌ Wrong: Don't instantiate managers directly
const manager = new SessionManager(); // Will fail
```

**Contract addresses**: Always retrieve from `ChainRegistry`:

```typescript
const chainRegistry = sdk.getChainRegistry();
const usdcAddress = chainRegistry.getContractAddress('USDC_TOKEN');
const jobMarketplace = chainRegistry.getContractAddress('JOB_MARKETPLACE');
```

---

## Settings Schema

### UserSettings Type

Defined in `@fabstir/sdk-core`:

```typescript
interface UserSettings {
  version: UserSettingsVersion;        // Schema version (currently 1)
  lastUpdated: number;                 // Unix timestamp

  // Model preferences
  selectedModel?: string;              // Currently selected model ID
  lastUsedModels?: string[];           // Recently used (max 5)

  // Host preferences
  lastHostAddress?: string;            // Last successfully used host
  preferredHosts?: string[];           // User-favorited hosts

  // Payment preferences
  preferredPaymentToken?: 'USDC' | 'ETH';
  autoApproveAmount?: string;          // Auto-approve threshold

  // UI preferences
  theme?: 'light' | 'dark' | 'auto';
  advancedSettingsExpanded?: boolean;
}
```

### Partial Updates

Updates use `PartialUserSettings` - you only need to provide fields that change:

```typescript
// Update just the theme
await storageManager.updateUserSettings({ theme: 'dark' });

// Update model + recent list
await storageManager.updateUserSettings({
  selectedModel: 'llama-3.2-1b',
  lastUsedModels: ['llama-3.2-1b', 'tiny-vicuna-1b']
});
```

**Auto-updated fields**:
- `lastUpdated` - SDK automatically sets to `Date.now()` on every update
- `version` - SDK manages schema migrations automatically

### First-Time User Detection

```typescript
const settings = await storageManager.getUserSettings();

if (settings === null) {
  // First-time user - show setup wizard
  showSetupWizard();
} else {
  // Returning user - restore preferences
  applyUserPreferences(settings);
}
```

---

## Caching Strategy

### Dual-Layer Caching

**Layer 1: SDK In-Memory Cache**
- **TTL**: 5 minutes
- **Location**: SDK's StorageManager
- **Invalidation**: Time-based or manual via `refreshSettings()`
- **Scope**: Per SDK instance

**Layer 2: localStorage Cache**
- **TTL**: 5 minutes (matches SDK)
- **Location**: Browser localStorage (`fabstir_user_settings_cache`)
- **Purpose**: Offline fallback, faster initial load
- **Format**:
  ```typescript
  {
    data: UserSettings,
    timestamp: number
  }
  ```

### Cache Flow

**On Load**:
1. Check SDK cache (in-memory)
2. If miss: Fetch from S5 → Cache in SDK + localStorage
3. If S5 fails: Use localStorage cache (stale data acceptable)
4. If no cache: Return `null` (first-time user)

**On Update** (Optimistic):
1. Update React state immediately (UI re-renders)
2. Save to S5 in background
3. On success: Update both caches
4. On error: Keep optimistic state, queue for sync

### Cache Invalidation

**Automatic**:
- TTL expires after 5 minutes
- SDK clears cache on authentication change
- localStorage cache cleared if corrupt

**Manual**:
```typescript
await refreshSettings(); // Bypasses all caches
```

### Cross-Device Sync Timing

**Device A** changes settings:
- Saved to S5 immediately
- Device A cache updated immediately

**Device B** sees changes:
- After existing cache expires (up to 5 minutes)
- Or after manual refresh
- Or after page reload (if cache expired)

**Expected delay**: 0-5 minutes depending on when Device B's cache expires.

---

## Smart Host Selection Algorithm

### Overview

When a user selects a model, the system automatically finds a compatible host using the following algorithm:

**File**: `hooks/use-hosts.ts` → `selectHostForModel()`

### Algorithm Steps

1. **Discover Hosts** (if not already discovered)
   ```typescript
   const hosts = await hostManager.discoverAllActiveHostsWithModels();
   ```

2. **Filter Compatible Hosts**
   ```typescript
   const compatibleHosts = hosts.filter(host =>
     host.models.some(model =>
       model.includes(modelId) || modelId.includes(model)
     )
   );
   ```

   **Matching logic**: Substring match (allows flexibility in model naming)
   - `tiny-vicuna-1b.q4_k_m.gguf` matches host with `tiny-vicuna-1b`
   - `llama-3.2-1b-instruct` matches host with `llama-3.2-1b`

3. **Random Selection** (Load Balancing)
   ```typescript
   const randomIndex = Math.floor(Math.random() * compatibleHosts.length);
   const selected = compatibleHosts[randomIndex];
   ```

   **Why random?**
   - Distributes load across multiple hosts
   - Prevents all users selecting the same "best" host
   - Simple and fair distribution

4. **Fallback Handling**
   ```typescript
   if (compatibleHosts.length === 0) {
     // Show error: "No hosts support this model"
     // Suggest: Try different model or manual host selection
     return null;
   }
   ```

### Host Discovery Details

Each discovered host includes:

```typescript
interface ParsedHost {
  address: string;          // Ethereum address (unique ID)
  endpoint: string;         // WebSocket URL for AI connection
  models: string[];         // Supported model IDs
  stake: bigint;           // FAB tokens staked (reputation)
}
```

**Stake information** fetched via:
```typescript
const hostStatus = await hostManager.getHostStatus(host.address);
// Returns: { stake: bigint, ... }
```

### Manual Override

Users can manually select hosts via **Advanced Settings Panel**:
- Opens `HostSelector` modal
- Shows all discovered hosts with models/stake
- Updates `lastHostAddress` in settings

---

## Offline Support

### Network Detection

```typescript
// Browser online/offline events
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Initial state
const isOnline = navigator.onLine;
```

### Sync Queue

**Problem**: User makes settings changes while offline
**Solution**: Queue updates for later sync

```typescript
interface SyncQueue {
  queue: PartialUserSettings[];  // Pending updates
}

// On network error
if (isNetworkError(err)) {
  setSyncQueue(prev => [...prev, partial]);
  setError('Offline - changes will sync when reconnected');
}

// On reconnection
window.addEventListener('online', () => {
  processSyncQueue(); // Attempt to save all queued updates
});
```

### Offline User Experience

1. **Initial load offline**:
   - Use localStorage cache (if available)
   - Show cached settings (may be up to 5 min stale)
   - Display offline banner

2. **Changes made offline**:
   - UI updates immediately (optimistic)
   - Updates queued for sync
   - Banner shows "X pending changes"

3. **Connection restored**:
   - Auto-sync queued updates
   - Banner disappears
   - Settings now saved to S5

### Error Classification

```typescript
function isNetworkError(error: any): boolean {
  return (
    !navigator.onLine ||
    error.message?.includes('network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('timeout') ||
    error.code === 'NETWORK_ERROR'
  );
}
```

- **Network errors** → Queue for retry
- **Other errors** → Log and continue (eventual consistency)

---

## Known Limitations

### 1. Cross-Device Sync Delay

**Issue**: Changes on Device A take up to 5 minutes to appear on Device B

**Cause**: Both SDK and localStorage use 5-minute cache TTL

**Impact**: Low - settings changes are infrequent

**Mitigation**: Manual refresh option available

**Status**: ✅ Documented, acceptable UX trade-off for performance

### 2. S5 Portal Dependency

**Issue**: App requires S5 portal availability for settings sync

**Cause**: Settings stored on decentralized S5 network

**Fallback**: localStorage cache (up to 5 min stale)

**Impact**: Medium - offline mode works but no cross-device sync

**Status**: ✅ Mitigated with localStorage fallback

### 3. Last-Write-Wins Conflict Resolution

**Issue**: Concurrent edits on multiple devices → last write overwrites

**Example**:
- Device A sets theme to `dark` at 10:00:00
- Device B sets theme to `light` at 10:00:01
- Result: All devices eventually show `light` (last write wins)

**Impact**: Low - settings changes rarely concurrent

**Mitigation**: None currently (CRDTs would be over-engineering)

**Status**: ✅ Acceptable for current use case

### 4. No Real-Time Sync

**Issue**: Changes don't appear instantly on other devices

**Cause**: Polling-based architecture (cache TTL)

**Impact**: Low - not chat messages, just preferences

**Alternative**: WebSocket-based real-time sync (future enhancement)

**Status**: ⏳ Could be improved (see Future Enhancements)

### 5. localStorage Size Limits

**Issue**: localStorage limited to ~5-10MB per domain

**Current usage**: ~1KB for settings cache + ~10KB for sync queue

**Mitigation**: Sync queue limited to 100 items max

**Status**: ✅ Not a practical concern

### 6. Browser Compatibility

**Requirements**:
- `window.localStorage` (IE8+)
- `window.matchMedia` for Auto theme (IE10+)
- `navigator.onLine` (IE4+)

**Status**: ✅ Supported by all modern browsers

---

## Future Enhancements

### Priority 1: Real-Time Settings Sync

**Current**: 5-minute cache delay for cross-device sync
**Proposed**: WebSocket-based push notifications

**Implementation**:
```typescript
// Subscribe to settings changes
const unsubscribe = await storageManager.subscribeToSettings((updated) => {
  setSettings(updated);
  applyUserPreferences(updated);
});

// S5 WebSocket emits on remote changes
// Instant sync across devices
```

**Benefits**:
- Instant cross-device sync
- Better multi-device UX
- No polling overhead

**Effort**: Medium (SDK enhancement needed)

### Priority 2: Host Favorites System

**Current**: Smart selection picks random host
**Proposed**: User can favorite hosts, get priority

**Implementation**:
```typescript
// Settings schema addition
interface UserSettings {
  // ... existing fields
  favoriteHosts?: string[];  // Ordered by preference
}

// Selection algorithm update
function selectHostForModel(modelId: string): ParsedHost {
  // 1. Filter compatible hosts
  const compatible = hosts.filter(/*...*/);

  // 2. Check if any favorites are compatible
  const favoriteCompatible = compatible.filter(h =>
    settings.favoriteHosts?.includes(h.address)
  );

  // 3. Prefer favorites, fallback to random
  if (favoriteCompatible.length > 0) {
    return favoriteCompatible[0]; // Use first favorite
  }

  return compatible[randomIndex]; // Fallback
}
```

**Benefits**:
- Users build trust with reliable hosts
- Hosts rewarded for good service
- Faster selection (cached favorites)

**Effort**: Low (UI + algorithm update)

### Priority 3: Model Performance Ratings

**Current**: No feedback on model quality
**Proposed**: Users rate model responses, aggregated ratings

**Implementation**:
```typescript
interface UserSettings {
  // ... existing fields
  modelRatings?: {
    [modelId: string]: {
      rating: number;      // 1-5 stars
      sessions: number;    // Total sessions with model
      lastUsed: number;    // Timestamp
    }
  };
}

// Show in model selector
<ModelCard>
  <h3>{model.name}</h3>
  <p>Your rating: {settings.modelRatings?.[model.id]?.rating || 'Not rated'}</p>
  <Button onClick={rateModel}>Rate this model</Button>
</ModelCard>
```

**Benefits**:
- Help users choose best model
- Personal preference learning
- Quality feedback for hosts

**Effort**: Medium (UI + analytics)

### Priority 4: Session History Storage

**Current**: Only current session tracked
**Proposed**: S5-backed conversation history

**Implementation**:
```typescript
// StorageManager methods (hypothetical)
await storageManager.saveConversation(sessionId, messages);
const history = await storageManager.getConversationHistory();

interface ConversationHistory {
  sessionId: string;
  modelId: string;
  hostAddress: string;
  messages: Message[];
  timestamp: number;
  tokenCount: number;
  cost: string;
}
```

**Benefits**:
- Resume conversations across devices
- Search past conversations
- Better cost tracking

**Effort**: High (requires SDK enhancement)

### Priority 5: Settings Import/Export

**Current**: Settings tied to wallet address
**Proposed**: Export/import settings as JSON

**Implementation**:
```typescript
// Export settings
const exportSettings = () => {
  const json = JSON.stringify(settings, null, 2);
  downloadFile('fabstir-settings.json', json);
};

// Import settings
const importSettings = async (file: File) => {
  const json = await file.text();
  const imported = JSON.parse(json);
  await storageManager.saveUserSettings(imported);
};
```

**Benefits**:
- Backup settings before reset
- Share settings with other wallets
- Migration tool

**Effort**: Low (pure UI feature)

### Priority 6: Advanced Host Selection

**Current**: Random selection from compatible hosts
**Proposed**: Weighted selection by stake/performance

**Algorithm**:
```typescript
function selectHostWeighted(compatibleHosts: ParsedHost[]): ParsedHost {
  // Calculate weights based on stake
  const weights = compatibleHosts.map(h => Number(h.stake) / 1e18);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Weighted random selection
  let random = Math.random() * totalWeight;
  for (let i = 0; i < compatibleHosts.length; i++) {
    random -= weights[i];
    if (random <= 0) return compatibleHosts[i];
  }

  return compatibleHosts[0]; // Fallback
}
```

**Benefits**:
- Reward high-stake hosts (more reliable)
- Natural load balancing
- Incentivizes host quality

**Effort**: Low (algorithm update)

---

## Code Patterns

### Pattern 1: Optimistic UI Updates

**All settings updates use optimistic pattern**:

```typescript
const updateSettings = async (partial: PartialUserSettings) => {
  // 1. Update local state IMMEDIATELY (synchronous)
  setSettings(prev => ({ ...prev, ...partial }));

  // 2. Save to S5 in background (async)
  try {
    await storageManager.updateUserSettings(partial);
  } catch (error) {
    // 3. On error: DON'T revert (eventual consistency)
    console.error('Background save failed:', error);
  }
};
```

**Why?**
- UI feels instant (no loading spinners)
- Network delays don't block user
- Settings eventually sync via retry logic

### Pattern 2: Error Handling

**Non-blocking error strategy**:

```typescript
try {
  await updateSettings({ theme: 'dark' });
  toast({ title: 'Theme saved' });
} catch (error) {
  // Log error but don't interrupt user flow
  console.error('Settings save failed:', error);

  // Show subtle warning, keep UI state
  toast({
    title: 'Warning',
    description: 'Theme applied but not saved',
    variant: 'warning'
  });

  // User can continue - settings will retry on next connection
}
```

**Principle**: Settings are UX enhancement, not critical path.

### Pattern 3: React Query for SDK Data

**Caching SDK calls**:

```typescript
export function useHosts(hostManager: HostManager | null) {
  const { data: availableHosts, refetch } = useQuery({
    queryKey: ['hosts'],
    queryFn: async () => {
      return await hostManager.discoverAllActiveHostsWithModels();
    },
    enabled: false,    // Manual trigger only
    staleTime: 30000,  // Cache for 30 seconds
  });

  return { availableHosts, discoverHosts: refetch };
}
```

**Benefits**:
- Automatic caching
- De-duplication
- Background refetching
- Loading states

### Pattern 4: Analytics (Privacy-First)

**NO PII tracked**:

```typescript
// ✅ Good: Track model selection
analytics.modelSelected(modelId, source);

// ❌ Bad: Don't track wallet addresses
analytics.walletUsed(walletAddress); // NO!

// ✅ Good: Track anonymized events
analytics.hostAutoSelected(modelId); // Just model ID, no wallet
```

**Environment control**:
```typescript
// .env.local
NEXT_PUBLIC_ANALYTICS_ENABLED=false  // Disable in dev

// Analytics respects flag
if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') {
  console.log('Analytics disabled');
  return;
}
```

### Pattern 5: TypeScript Strict Mode

**All SDK types imported**:

```typescript
import type {
  UserSettings,
  PartialUserSettings,
  UserSettingsVersion,
  StorageManager
} from '@fabstir/sdk-core';

// ✅ Properly typed
const settings: UserSettings | null = await storageManager.getUserSettings();

// ❌ Avoid 'any'
const settings: any = await storageManager.getUserSettings(); // NO!
```

**Async typing**:
```typescript
async function loadSettings(): Promise<UserSettings | null> {
  const settings = await storageManager.getUserSettings();
  return settings;
}
```

---

## Debugging Tips

### Settings Not Syncing?

1. **Check cache TTL**: Wait 5 minutes for cache to expire
2. **Force refresh**: `await refreshSettings()`
3. **Check S5 portal**: Is it accessible?
4. **Inspect localStorage**: Look for `fabstir_user_settings_cache`
5. **Check network tab**: Look for S5 API calls

### Console Commands

```javascript
// View cached settings
JSON.parse(localStorage.getItem('fabstir_user_settings_cache'))

// Clear cache
localStorage.removeItem('fabstir_user_settings_cache')

// View analytics events
JSON.parse(localStorage.getItem('fabstir_analytics_events') || '[]')

// Check online status
navigator.onLine
```

### Common Issues

**"Settings not saving"**:
- Check if `storageManager` is initialized
- Verify wallet is connected
- Check browser console for errors
- Confirm S5 portal is reachable

**"Theme not applying"**:
- Check `document.documentElement.classList`
- Verify theme in settings: `settings.theme`
- Check CSS transitions in `globals.css`

**"Host selection fails"**:
- Check if hosts discovered: `availableHosts.length`
- Verify model ID matches: `host.models.includes(modelId)`
- Check console for compatibility logs

---

## File Reference

**Core Settings Files**:
- `hooks/use-user-settings.ts` - Settings hook with S5 + localStorage
- `components/setup-wizard.tsx` - First-time user onboarding
- `components/settings-panel.tsx` - Settings summary + reset

**Smart Selection Files**:
- `hooks/use-hosts.ts` - Host discovery + smart selection algorithm
- `components/model-selector.tsx` - Model selection UI

**Offline Support Files**:
- `components/offline-banner.tsx` - Visual offline indicator
- `hooks/use-user-settings.ts` - Sync queue implementation

**Analytics Files**:
- `lib/analytics.ts` - Privacy-first event tracking
- `app/chat/page.tsx` - Analytics integration points

---

## Questions?

- **SDK API Reference**: `docs/sdk-reference/SDK_API.md`
- **Settings Integration Guide**: `docs/sdk-reference/UI_DEVELOPER_SETTINGS_GUIDE.md`
- **User Documentation**: `docs/USER_GUIDE.md`
- **FAQ**: `docs/FAQ.md`
- **Implementation Plan**: `docs/SIMPLFIED_UI_IMPLEMENTATION_PLAN.md`
