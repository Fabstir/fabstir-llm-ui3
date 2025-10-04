# Fabstir LLM Chat UI - Simplified UX Redesign Plan

## Overview

This document outlines the implementation of a simplified, user-friendly chat interface that prioritizes the conversation experience. The redesign uses SDK v1.2.0's user settings storage for persistent preferences across devices.

**Core Principles**:
- **Model-first selection**: Users choose models by capability/price, system auto-selects compatible hosts
- **Persistent state**: Settings saved to S5 decentralized storage, sync across devices
- **Chat-centric**: 70% of screen for conversation, hide technical complexity
- **Smart defaults**: Returning users see chat immediately, no repeated setup
- **Graceful degradation**: Works offline with cached settings

**Reference Documents**:
- `docs/SDK_USER_SETTINGS_SPEC.md` - SDK settings feature request
- `docs/sdk-reference/UI_DEVELOPER_SETTINGS_GUIDE.md` - SDK v1.2.0 settings integration guide
- `docs/sdk-reference/SDK_API.md` - Complete SDK API reference
- `examples/chat-context-popupfree-sdk-demo.tsx` - Reference implementation

---

## Phase 1: User Settings Foundation ✅

### Overview

Implement the user settings React hook and S5 storage integration using SDK v1.2.0's new StorageManager methods.

### Sub-Phase 1.1: Create User Settings Hook ✅

**Milestones**:
- [x] `useUserSettings` hook created with proper TypeScript types
- [x] Settings loading on component mount
- [x] Update, reset, and refresh methods implemented
- [x] Error handling for S5 unavailable scenarios
- [x] Loading and error states properly managed

**Implementation Files**:
```
hooks/
└── use-user-settings.ts          # User settings hook with S5 integration
```

**Key Tasks**:
1. Import SDK types: `UserSettings`, `PartialUserSettings`, `UserSettingsVersion`
2. Create hook with state for: `settings`, `loading`, `error`
3. Implement `loadSettings()` using `storageManager.getUserSettings()`
4. Implement `updateSettings()` using `storageManager.updateUserSettings()`
5. Implement `resetSettings()` using `storageManager.clearUserSettings()`
6. Add `refreshSettings()` to bypass cache
7. Add useEffect to load settings on mount

**Success Criteria**:
- ✅ Hook loads settings on mount (returns `null` for first-time users)
- ✅ `updateSettings()` saves to S5 and updates local state
- ✅ `resetSettings()` clears settings and invalidates cache
- ✅ Graceful error handling when S5 unavailable
- ✅ TypeScript types correctly imported from SDK

### Sub-Phase 1.2: First-Time User Detection ✅

**Milestones**:
- [x] App initialization checks for existing settings
- [x] First-time users identified (`settings === null`)
- [x] Returning users have preferences restored
- [x] Default values used when settings unavailable

**Implementation Files**:
```
app/
└── chat/
    └── page.tsx                   # App initialization logic (updated)
```

**Key Tasks**:
1. Add `useUserSettings(storageManager)` to chat page
2. Check if `settings === null` (first-time user)
3. If null → Set `showSetupWizard = true`
4. If settings exist → Restore preferences and show chat
5. Apply restored settings: model, theme, payment token
6. Handle loading state with spinner/skeleton

**Success Criteria**:
- ✅ First-time user sees setup wizard
- ✅ Returning user sees chat immediately
- ✅ Preferences automatically restored from S5
- ✅ Loading state shown while fetching settings
- ✅ No errors if S5 unavailable (use defaults)

### Sub-Phase 1.3: Setup Wizard Component ✅

**Milestones**:
- [x] Multi-step wizard component created
- [x] Model selection step with pricing info
- [x] Theme selection step (light/dark/auto)
- [x] Payment token preference step (USDC/ETH)
- [x] Settings saved to S5 on completion
- [x] Smooth animations between steps

**Implementation Files**:
```
components/
├── setup-wizard.tsx               # Multi-step first-time setup
└── ui/
    ├── card.tsx                   # shadcn card (existing)
    ├── button.tsx                 # shadcn button (existing)
    └── select.tsx                 # shadcn select (add if needed)
```

**Key Tasks**:
1. Create `SetupWizard` component with 3 steps
2. **Step 1**: Model selection dropdown with descriptions and pricing
3. **Step 2**: Theme selector (3 buttons: Light/Dark/Auto)
4. **Step 3**: Payment token (2 buttons: USDC/ETH)
5. Add "Next" and "Back" navigation between steps
6. On completion: call `storageManager.saveUserSettings()`
7. Redirect to chat page after save succeeds

**Success Criteria**:
- ✅ Wizard shows 3 clear steps
- ✅ User can navigate forward/back
- ✅ Settings saved to S5 on completion
- ✅ After save, wizard closes and chat appears
- ✅ Clean UI with Fabstir branding colors

---

## Phase 2: Simplified Chat Layout ✅

### Overview

Restructure the chat page to be conversation-first, with a minimal header, expanded chat area, and collapsible advanced settings.

### Sub-Phase 2.1: Compact Header ✅

**Milestones**:
- [x] Minimal top bar with essential info only
- [x] Model name displayed (clickable to change)
- [x] PRIMARY balance shown (clickable to deposit)
- [x] Logo/branding on left
- [x] Clean, single-line design

**Implementation Files**:
```
components/
└── compact-header.tsx             # Minimal top bar component
```

**Key Tasks**:
1. Create header component: `CompactHeader.tsx`
2. Left side: Fabstir logo/name
3. Center: Model name with dropdown icon (clickable)
4. Right side: PRIMARY balance with "💰" icon (clickable)
5. On model click → Show model selector modal
6. On balance click → Show deposit modal
7. Style: Single line, ~ 50px height, sticky at top

**Success Criteria**:
- ✅ Header fixed at top of page
- ✅ Shows current model name
- ✅ Shows PRIMARY account balance
- ✅ Clicking model opens selector
- ✅ Clicking balance opens deposit UI
- ✅ Clean, minimal design (not cluttered)

### Sub-Phase 2.2: Expand Chat Interface ✅

**Milestones**:
- [x] Chat conversation takes 60-70% of screen height
- [x] User input box always visible at bottom
- [x] Auto-scroll to latest message
- [x] Message animations working
- [x] Empty state shown when no messages

**Implementation Files**:
```
components/
└── chat-interface.tsx             # Expanded chat UI (updated)
```

**Key Tasks**:
1. Update `ChatInterface` to use flexbox layout
2. Set conversation area to `flex-grow` (fills available space)
3. Pin input box to bottom with `sticky` or flex layout
4. Remove any top/side margins that waste space
5. Ensure messages scroll properly
6. Add empty state: "Send your first message..."
7. Test on different screen sizes (mobile, tablet, desktop)

**Success Criteria**:
- ✅ Chat fills 60-70% of viewport height
- ✅ Scrollbar appears when messages overflow
- ✅ Input box always visible at bottom
- ✅ Auto-scrolls to new messages
- ✅ Responsive on mobile and desktop
- ✅ Empty state shown when no conversation

### Sub-Phase 2.3: Advanced Settings Panel (Collapsible) ✅

**Milestones**:
- [x] Collapsible panel component created
- [x] Shows session details when expanded
- [x] Shows host information when expanded
- [x] Shows account balances when expanded
- [x] Collapsed state saved to user settings
- [x] Smooth expand/collapse animation

**Implementation Files**:
```
components/
├── advanced-settings-panel.tsx    # Collapsible details panel
└── ui/
    ├── collapsible.tsx            # shadcn collapsible (add)
    └── separator.tsx              # shadcn separator (add)
```

**Key Tasks**:
1. Create `AdvancedSettingsPanel` component
2. Use shadcn `Collapsible` for expand/collapse
3. Trigger button: "⚙️ Advanced Settings ▼" (at bottom of page)
4. **Expanded content sections**:
   - Session Details (ID, tokens, cost, duration)
   - Host Information (address, endpoint, stake, [Change Host] button)
   - Account Balances (PRIMARY, [Deposit More] button)
   - Change Model ([Select Model] button)
   - Usage Analytics ([View Analytics] link)
   - Reset Preferences ([Reset] button)
5. Save expanded state: `updateSettings({ advancedSettingsExpanded: true/false })`
6. Animate expand/collapse with Framer Motion

**Success Criteria**:
- ✅ Panel collapsed by default (5% of screen)
- ✅ Clicking trigger expands panel smoothly
- ✅ Expanded state persisted to S5
- ✅ Shows all technical details when expanded
- ✅ Easy to collapse again
- ✅ Doesn't interfere with chat input

### Sub-Phase 2.4: Hide Complexity (SUB Account) ✅

**Milestones**:
- [x] SUB account address removed from UI
- [x] Only PRIMARY balance shown
- [x] Spend permission details hidden
- [x] Base Account connection simplified
- [x] User sees only essential info

**Implementation Files**:
```
components/
├── usdc-deposit.tsx               # Updated (hide SUB)
└── session-controls.tsx           # Updated (simplified)
app/
└── chat/
    └── page.tsx                   # Updated (remove SUB references)
```

**Key Tasks**:
1. Remove all SUB account address displays from UI
2. Update `USDCDeposit` component:
   - Remove SUB account balance row
   - Show only PRIMARY balance and EOA balance
   - Remove "SUB Account (Spender)" section
3. Update wallet connection card:
   - Just show "Base Account Connected" (no addresses)
   - Remove explanations about SUB/PRIMARY split
4. Update balance check messages:
   - Don't mention SUB account in warnings
   - Just say "Deposit to your account" (not "PRIMARY")
5. Move technical details to Advanced Settings panel

**Success Criteria**:
- ✅ No SUB account address visible in main UI
- ✅ Only PRIMARY balance shown
- ✅ Wallet connection simplified
- ✅ Warning messages user-friendly
- ✅ Technical details only in Advanced Settings

---

## Phase 3: Model-First Selection ✅

### Overview

Implement model selection as the primary user choice, with automatic compatible host selection.

### Sub-Phase 3.1: Model Selector Component ✅

**Milestones**:
- [x] Model grid/list component created
- [x] Shows all available models with metadata
- [x] Displays pricing, speed, quality info
- [x] Recently used models highlighted
- [x] Auto-saves selection to S5
- [x] Updates recent models list

**Implementation Files**:
```
components/
├── model-selector.tsx             # Model selection grid/list
└── ui/
    ├── dialog.tsx                 # shadcn dialog (for modal)
    └── badge.tsx                  # shadcn badge (existing)
```

**Key Tasks**:
1. Create `ModelSelector` component with modal dialog
2. Define `AVAILABLE_MODELS` array with metadata:
   ```typescript
   {
     id: 'tiny-vicuna-1b.q4_k_m.gguf',
     name: 'TinyVicuna 1B',
     description: 'Fastest, lowest cost',
     pricing: '$0.001 per message',
     speed: 'Very Fast',
     quality: 'Good'
   }
   ```
3. Show "Recently Used" section if `settings.lastUsedModels` exists
4. Grid layout: Cards for each model (name, description, pricing)
5. On selection: `updateSettings({ selectedModel, lastUsedModels })`
6. Update `lastUsedModels`: add selected model to front, keep max 5
7. Close modal after selection

**Success Criteria**:
- ✅ Modal opens when clicking model name in header
- ✅ Shows all available models in grid
- ✅ Recently used models at top
- ✅ Selection saves to S5 immediately
- ✅ Modal closes after selection
- ✅ Model name updates in header

### Sub-Phase 3.2: Smart Host Selection ✅

**Milestones**:
- [x] Automatic host discovery when model selected
- [x] Filters hosts supporting selected model
- [x] Randomly picks from compatible hosts
- [x] Saves last used host to settings
- [x] Shows loading state during discovery
- [x] Error handling if no hosts support model

**Implementation Files**:
```
hooks/
└── use-hosts.ts                   # Updated with smart selection
```

**Key Tasks**:
1. Update `useHosts` hook with `selectHostForModel()` function
2. When model changes:
   - Trigger `discoverHosts()`
   - Filter: `hosts.filter(h => h.models.includes(selectedModel))`
   - Randomly select: `compatible[Math.floor(Math.random() * compatible.length)]`
3. Save to settings: `updateSettings({ lastHostAddress: selected.address })`
4. Show loading toast: "Finding compatible host..."
5. Show success toast: "Connected to host"
6. If no compatible hosts → Show error + suggest different model
7. Auto-trigger on model selection (no manual host browsing)

**Success Criteria**:
- ✅ Selecting model triggers host discovery
- ✅ Only compatible hosts considered
- ✅ Random selection from compatible hosts
- ✅ Host selection happens automatically
- ✅ User doesn't see host list (unless in Advanced Settings)
- ✅ Error shown if no compatible hosts

### Sub-Phase 3.3: Move Host Browsing to Advanced Settings ✅

**Milestones**:
- [x] Host selector hidden from main page
- [x] "Change Host" button in Advanced Settings
- [x] Host selector shown only when clicked
- [x] Manual selection still possible
- [x] Auto-selection remains default flow

**Implementation Files**:
```
components/
├── advanced-settings-panel.tsx    # Updated (add host selector)
└── host-selector.tsx              # Existing (moved here)
```

**Key Tasks**:
1. Remove `HostSelector` from main chat page
2. Add "Change Host" button to Advanced Settings panel
3. Show `HostSelector` in modal/expanded section when clicked
4. Allow manual selection (updates `lastHostAddress`)
5. Close selector after manual choice
6. Default behavior: Use auto-selected host (don't show selector)

**Success Criteria**:
- ✅ Main page doesn't show host list
- ✅ "Change Host" button in Advanced Settings
- ✅ Clicking shows full host selector
- ✅ Manual selection possible
- ✅ Default: auto-selected host used
- ✅ Most users never see host selector

**Implementation Complete**: Host selector removed from main page and moved to modal accessible via Advanced Settings panel.

---

## Phase 4: Persistence & Optimizations

### Overview

Implement auto-save for all user preferences, optimistic UI updates, and offline support.

### Sub-Phase 4.1: Auto-Save Preferences ✅

**Milestones**:
- [x] Model selection auto-saved
- [x] Host selection auto-saved
- [x] Payment token preference auto-saved
- [x] Theme changes auto-saved
- [x] Advanced panel state auto-saved
- [x] All saves non-blocking

**Implementation Files**:
```
components/
├── model-selector.tsx             # Updated (auto-save)
├── compact-header.tsx             # Updated (payment token)
└── advanced-settings-panel.tsx    # Updated (panel state)
```

**Key Tasks**:
1. In `ModelSelector`: Call `updateSettings({ selectedModel })` on selection
2. In payment token selector: Call `updateSettings({ preferredPaymentToken })`
3. In theme selector: Call `updateSettings({ theme })`
4. In Advanced Settings: Call `updateSettings({ advancedSettingsExpanded })`
5. Wrap all saves in try/catch (don't block UI on errors)
6. Show subtle toast on successful save (optional)
7. Log errors but don't interrupt user

**Success Criteria**:
- ✅ All user choices saved automatically
- ✅ No manual "Save" buttons needed
- ✅ Saves happen in background
- ✅ UI doesn't freeze during save
- ✅ Errors logged but don't block user
- ✅ Toast confirmation shown (subtle)

**Implementation Complete**: All preferences auto-save with proper error handling. Payment token and theme selectors added to Advanced Settings. Optimistic UI for theme changes.

### Sub-Phase 4.2: Optimistic UI Updates ✅

**Milestones**:
- [x] UI updates immediately on user action
- [x] S5 save happens in background
- [x] No rollback on save failure (eventual consistency)
- [x] Loading states minimal
- [x] Feels instant to user

**Implementation Files**:
```
hooks/
└── use-user-settings.ts           # Updated (optimistic updates)
```

**Key Tasks**:
1. Update `updateSettings()` to be optimistic:
   - Update local state immediately
   - Call `storageManager.updateUserSettings()` in background
   - On success: do nothing (state already updated)
   - On error: log warning, keep state (eventual consistency)
2. For theme changes: Apply CSS class immediately
3. For model changes: Update header immediately
4. Don't show loading spinners for settings updates
5. Trust S5 to eventually sync

**Success Criteria**:
- ✅ Theme change appears instantly
- ✅ Model change updates header immediately
- ✅ No loading spinners for settings
- ✅ Feels responsive and fast
- ✅ Background saves don't block UI
- ✅ Eventual consistency acceptable

**Implementation Complete**: Optimistic UI pattern was already implemented in useUserSettings hook. Improvements made:
- Toast notifications now show immediately for instant feedback
- Theme CSS applies immediately before save
- Payment token shows instant toast
- Comprehensive documentation added explaining the optimistic update pattern
- All settings updates use optimistic pattern: local state updates immediately, S5 saves in background

### Sub-Phase 4.3: Offline Support & Error Handling ✅

**Milestones**:
- [x] App works offline with cached settings
- [x] Graceful degradation when S5 unavailable
- [x] Clear error messages for users
- [x] Retry logic for failed saves
- [x] Sync when connection restored

**Implementation Files**:
```
hooks/
└── use-user-settings.ts           # Updated (offline support)
components/
└── offline-banner.tsx             # New (offline indicator)
```

**Key Tasks**:
1. Handle `getUserSettings()` errors:
   - Network error → Use stale cache if available
   - No cache → Show default settings
2. Handle `updateSettings()` errors:
   - Network error → Queue save for later
   - Show offline banner: "Offline - changes will sync when reconnected"
3. Create `OfflineBanner` component
4. Add retry logic: Attempt sync when navigator.onLine changes
5. Don't block user flow when offline

**Success Criteria**:
- ✅ App loads with cached settings when offline
- ✅ User can continue using app offline
- ✅ Changes queued for sync when connection returns
- ✅ Offline banner shown when no connection
- ✅ Auto-sync when connection restored
- ✅ No errors thrown to user

**Implementation Complete**: Full offline support added with localStorage caching and sync queue. Key features:
- **localStorage cache** with 5-minute TTL (matches S5 cache)
- **Offline detection** via navigator.onLine with online/offline event listeners
- **Sync queue** stores failed updates, automatically retries when connection restored
- **Network error detection** distinguishes network failures from other errors
- **OfflineBanner component** provides visual feedback with pending updates count
- **Graceful degradation** - app fully functional offline, syncs when reconnected
- **Auto-retry** via online event listener triggers processSyncQueue()

### Sub-Phase 4.4: Cross-Device Sync Testing

**Milestones**:
- [ ] Settings sync across multiple browsers
- [ ] 5-minute cache expiry verified
- [ ] Last-write-wins conflict resolution tested
- [ ] Changes propagate within reasonable time
- [ ] No data corruption on concurrent updates

**Implementation Files**:
```
(No new files - testing existing implementation)
```

**Key Tasks**:
1. Open app in Browser A and Browser B
2. Change model in Browser A → Verify saves to S5
3. Wait 5 minutes (cache expiry)
4. Refresh Browser B → Verify model change appears
5. Make concurrent changes (both browsers) → Verify last-write-wins
6. Test theme sync, payment token sync, panel state sync
7. Document any sync delays observed

**Success Criteria**:
- ✅ Changes in Browser A appear in Browser B after cache expiry
- ✅ 5-minute cache expiry working as expected
- ✅ Concurrent updates resolve with last-write-wins
- ✅ No data corruption or lost changes
- ✅ Sync delay acceptable (< 5 minutes)
- ✅ User experience smooth across devices

---

## Phase 5: UI Polish & Final Integration

### Overview

Polish the user interface, add analytics tracking, and ensure all components work together seamlessly.

### Sub-Phase 5.1: Theme System Integration ✅

**Milestones**:
- [x] Theme selector component created
- [x] Light/Dark/Auto modes working
- [x] Theme persisted to S5
- [x] Applied on app load
- [x] System preference detection (Auto mode)
- [x] Smooth theme transitions

**Implementation Files**:
```
components/
├── theme-selector.tsx             # Theme switcher component (created in 4.1)
└── advanced-settings-panel.tsx    # Updated (add theme selector)
app/
├── chat/page.tsx                  # Updated (theme application logic)
└── globals.css                    # Updated (smooth transitions)
```

**Key Tasks**:
1. ✅ Create `ThemeSelector` component with 3 buttons
2. ✅ Implement theme application:
   - Light: Remove `dark` class from `<html>`
   - Dark: Add `dark` class to `<html>`
   - Auto: Detect with `window.matchMedia('(prefers-color-scheme: dark)')`
3. ✅ On selection: `updateSettings({ theme })`
4. ✅ Apply theme on app load (from settings)
5. ✅ Add listener for system preference changes (Auto mode)
6. ✅ Add CSS transition: `html { transition: background-color 0.3s }`

**Success Criteria**:
- ✅ Theme selector in Advanced Settings
- ✅ All 3 modes working (Light/Dark/Auto)
- ✅ Theme persisted and restored
- ✅ Auto mode follows system preference
- ✅ Smooth transition animation
- ✅ Works across page reloads

**Implementation Complete**: Theme system fully integrated with:
- **applyTheme helper** - useCallback function that applies theme with Auto mode support
- **System preference detection** - Uses window.matchMedia to detect dark/light preference
- **Applied on app load** - Theme restored from settings and applied immediately
- **Preference change listener** - Listens for OS theme changes and re-applies when in Auto mode
- **Smooth CSS transitions** - Added to html element for 0.3s background-color and color transitions
- **ThemeSelector component** - Already created in Sub-Phase 4.1, integrated in Advanced Settings

### Sub-Phase 5.2: Settings Panel UI ✅

**Milestones**:
- [x] Settings panel component created
- [x] Shows current settings summary
- [x] Reset preferences button working
- [x] Confirmation dialog for reset
- [x] Last updated timestamp shown
- [x] Clean, organized layout

**Implementation Files**:
```
components/
├── settings-panel.tsx             # Settings summary/reset (created)
├── advanced-settings-panel.tsx    # Updated (integrate SettingsPanel)
└── ui/
    └── alert-dialog.tsx           # shadcn alert-dialog (added)
app/
└── chat/page.tsx                  # Updated (pass lastUpdated prop)
```

**Key Tasks**:
1. ✅ Create `SettingsPanel` component
2. ✅ Display current settings:
   - Model: `settings.selectedModel`
   - Payment: `settings.preferredPaymentToken`
   - Theme: `settings.theme`
   - Last updated: `new Date(settings.lastUpdated).toLocaleString()`
3. ✅ Add "Reset All Preferences" button
4. ✅ Show confirmation dialog: "Are you sure? This cannot be undone"
5. ✅ On confirm: `resetSettings()` → Reload page
6. ✅ Style with proper spacing and typography

**Success Criteria**:
- ✅ Panel shows current settings clearly
- ✅ Reset button requires confirmation
- ✅ Reset clears all settings
- ✅ Page reloads after reset
- ✅ First-time setup shown after reset
- ✅ Clean UI design

**Implementation Complete**: Settings panel fully integrated with:
- **SettingsPanel component** - Card-based UI showing settings summary
- **Settings display** - Shows model (with fallback), payment token (badge), theme (badge), last updated (formatted timestamp)
- **AlertDialog confirmation** - Detailed confirmation dialog before reset with list of what will be cleared
- **Reset functionality** - Calls resetSettings() and reloads page on confirm
- **Integrated into Advanced Settings** - Replaced old reset section with new SettingsPanel
- **Error handling** - Toast notification on reset failure
- **Clean UI** - Card layout with proper spacing, muted-foreground text, and badges for visual hierarchy

### Sub-Phase 5.3: Loading & Empty States

**Milestones**:
- [ ] Loading spinner for settings fetch
- [ ] Skeleton screens for chat
- [ ] Empty state for no messages
- [ ] Empty state for no models
- [ ] Error states with retry options
- [ ] Consistent loading UX

**Implementation Files**:
```
components/
├── loading-states.tsx             # Centralized loading components
└── empty-states.tsx               # Centralized empty state components
```

**Key Tasks**:
1. Create loading spinner component (use Loader2 from lucide-react)
2. Create skeleton screens for:
   - Chat messages (gray bars)
   - Model selector (card skeletons)
3. Create empty states:
   - No messages: "Send your first message to start chatting"
   - No models: "No models available. Try refreshing."
   - Settings error: "Unable to load settings. Using defaults."
4. Add retry buttons where appropriate
5. Use consistent styling (match Fabstir brand)

**Success Criteria**:
- ✅ Loading shown while fetching settings
- ✅ Skeleton screens during data loads
- ✅ Empty states have helpful messages
- ✅ Retry options work
- ✅ Consistent visual design
- ✅ No jarring layout shifts

### Sub-Phase 5.4: Analytics Integration

**Milestones**:
- [ ] Track model selection events
- [ ] Track host selection events
- [ ] Track theme changes
- [ ] Track settings resets
- [ ] Track setup wizard completion
- [ ] Privacy-conscious (no PII)

**Implementation Files**:
```
lib/
└── analytics.ts                   # Analytics tracking (updated)
```

**Key Tasks**:
1. Add analytics events to existing `analytics.ts`:
   - `model_selected`: { modelId, source: 'setup' | 'header' | 'selector' }
   - `host_auto_selected`: { hostAddress, modelId }
   - `theme_changed`: { theme: 'light' | 'dark' | 'auto' }
   - `settings_reset`: { timestamp }
   - `setup_completed`: { model, theme, paymentToken }
2. Call analytics on user actions
3. Ensure no PII tracked (no wallet addresses in events)
4. Make analytics optional (check env var)

**Success Criteria**:
- ✅ Events logged to console (dev mode)
- ✅ Events sent to analytics service (if configured)
- ✅ No PII or wallet addresses tracked
- ✅ Analytics optional (respects env var)
- ✅ Events well-structured and useful
- ✅ No errors from analytics calls

### Sub-Phase 5.5: Final Testing & Bug Fixes

**Milestones**:
- [ ] Full user journey tested (first-time user)
- [ ] Full user journey tested (returning user)
- [ ] Cross-device sync verified
- [ ] Offline mode tested
- [ ] All edge cases handled
- [ ] No console errors

**Implementation Files**:
```
(No new files - testing and fixes only)
```

**Key Tasks**:
1. **First-time user flow**:
   - Connect wallet → Setup wizard → Choose model/theme/payment → Chat
2. **Returning user flow**:
   - Open app → Settings load → Chat appears immediately
3. **Cross-device**:
   - Change settings on Device A → Verify sync to Device B
4. **Offline mode**:
   - Disconnect network → Verify app works with cache
5. **Edge cases**:
   - S5 unavailable (use defaults)
   - No compatible hosts (show error)
   - Corrupt settings (reset automatically)
6. Fix any bugs found during testing

**Success Criteria**:
- ✅ First-time user can complete setup smoothly
- ✅ Returning user sees chat immediately (< 2s load)
- ✅ Settings sync across devices within 5 minutes
- ✅ App works offline with cached data
- ✅ All edge cases handled gracefully
- ✅ No console errors or warnings
- ✅ UI smooth on mobile and desktop

---

## Phase 6: Documentation & Handoff

### Overview

Create user documentation, developer notes, and final code cleanup.

### Sub-Phase 6.1: User Documentation

**Milestones**:
- [ ] User guide written (how to use the UI)
- [ ] FAQ section created
- [ ] Screenshots added
- [ ] Troubleshooting guide
- [ ] Video walkthrough (optional)

**Implementation Files**:
```
docs/
├── USER_GUIDE.md                  # End-user documentation
└── FAQ.md                         # Common questions
```

**Key Tasks**:
1. Write user guide covering:
   - First-time setup process
   - How to change model
   - How to deposit funds
   - How to view advanced settings
   - How to reset preferences
2. Create FAQ:
   - What is S5 storage?
   - Why do my settings sync across devices?
   - What happens if I'm offline?
   - How do I change my default model?
3. Add screenshots of key UI screens
4. Write troubleshooting section (common issues)

**Success Criteria**:
- ✅ User guide complete and clear
- ✅ FAQ answers common questions
- ✅ Screenshots illustrate key features
- ✅ Troubleshooting helps resolve issues
- ✅ Documentation accessible to non-technical users

### Sub-Phase 6.2: Developer Notes

**Milestones**:
- [ ] Code comments added to complex sections
- [ ] Architecture overview documented
- [ ] Settings schema documented
- [ ] Known limitations listed
- [ ] Future enhancements outlined

**Implementation Files**:
```
docs/
└── DEVELOPER_NOTES.md             # Technical documentation
```

**Key Tasks**:
1. Document settings schema and fields
2. Explain S5 caching strategy (5-minute TTL)
3. Document smart host selection algorithm
4. List known limitations:
   - 5-minute sync delay for cross-device
   - Requires S5 portal availability
5. Outline future enhancements:
   - Real-time sync (WebSocket)
   - Host favorites system
   - Model performance ratings

**Success Criteria**:
- ✅ Architecture clearly explained
- ✅ Settings schema documented
- ✅ Caching behavior explained
- ✅ Limitations acknowledged
- ✅ Future roadmap outlined

### Sub-Phase 6.3: Code Cleanup & Optimization

**Milestones**:
- [ ] Unused code removed
- [ ] Console.logs cleaned up
- [ ] TypeScript strict mode passing
- [ ] ESLint warnings resolved
- [ ] Bundle size optimized

**Implementation Files**:
```
(All files reviewed and cleaned)
```

**Key Tasks**:
1. Remove commented-out code
2. Remove debug console.logs (keep error logs)
3. Fix all TypeScript errors
4. Fix all ESLint warnings
5. Run `npm run build` and check bundle size
6. Optimize large dependencies if needed
7. Add proper error boundaries

**Success Criteria**:
- ✅ No commented-out code
- ✅ No debug console.logs
- ✅ TypeScript strict mode passing
- ✅ No ESLint warnings
- ✅ Production build succeeds
- ✅ Bundle size reasonable (< 500 KB)

---

## Success Metrics (Overall)

### User Experience
- [ ] First-time user can start chatting within 60 seconds
- [ ] Returning user sees chat in < 2 seconds
- [ ] Chat takes 60-70% of screen space
- [ ] Settings sync across devices within 5 minutes
- [ ] App works offline with cached data
- [ ] No confusing technical details in main UI

### Technical
- [ ] All TypeScript errors resolved
- [ ] No console errors in production
- [ ] Production build succeeds
- [ ] Bundle size < 500 KB
- [ ] Settings save success rate > 95%
- [ ] Cross-device sync working

### Code Quality
- [ ] All components have proper TypeScript types
- [ ] Error handling in all async operations
- [ ] Loading states for all data fetches
- [ ] Empty states for all lists/grids
- [ ] Consistent styling (Fabstir brand)
- [ ] Responsive on mobile and desktop

---

## Implementation Timeline

### Week 1: Foundation
- **Days 1-2**: Phase 1 - User Settings Foundation
- **Days 3-4**: Phase 2.1-2.2 - Compact Header & Expand Chat
- **Day 5**: Phase 2.3 - Advanced Settings Panel

### Week 2: Core Features
- **Days 1-2**: Phase 2.4 & Phase 3.1 - Hide Complexity & Model Selector
- **Days 3-4**: Phase 3.2-3.3 - Smart Host Selection
- **Day 5**: Phase 4.1 - Auto-Save Preferences

### Week 3: Polish
- **Days 1-2**: Phase 4.2-4.3 - Optimistic Updates & Offline Support
- **Day 3**: Phase 4.4 - Cross-Device Sync Testing
- **Days 4-5**: Phase 5.1-5.3 - Theme System, Settings Panel, Loading States

### Week 4: Finalization
- **Days 1-2**: Phase 5.4-5.5 - Analytics & Final Testing
- **Days 3-4**: Phase 6.1-6.2 - Documentation
- **Day 5**: Phase 6.3 - Code Cleanup & Handoff

**Total Estimated Time**: 4 weeks

---

## Notes

- Tackle one sub-phase at a time
- Test each sub-phase before moving forward
- Document issues as they arise
- Prioritize user experience over technical perfection
- Keep existing working features intact while adding new ones
- Leverage SDK v1.2.0's user settings methods (already implemented!)
