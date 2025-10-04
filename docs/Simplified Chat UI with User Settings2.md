──────────────────────────────────────────────────────────────────────────────────────────
Implementation Plan: Simplified Chat UI with User Settings

Overview

Implement the simplified, model-first chat UI using SDK v1.2.0's new user settings storage

---

Phase 1: User Settings Foundation

1.1 Create React Hook (hooks/use-user-settings.ts)

- Copy implementation from UI_DEVELOPER_SETTINGS_GUIDE.md
- Add TypeScript imports from SDK
- Include loading, error, and update states
- Add methods: updateSettings, resetSettings, refreshSettings
  1.2 Create Setup Wizard (components/setup-wizard.tsx)  

- Step 1: Model selection (with pricing info)
- Step 2: Theme preference (light/dark/auto)
- Step 3: Payment token (USDC/ETH)
- Save to S5 via saveUserSettings()
- Show only for first-time users
  1.3 Update App Initialization (app/chat/page.tsx)  

- Load settings on mount with getUserSettings()
- If settings === null → Show setup wizard
- If settings exists → Apply preferences and show chat
- Auto-restore: model, theme, payment token, last host  


---

Phase 2: Simplified Chat Layout

2.1 Create Compact Header (components/compact-header.tsx)

┌────────────────────────────────────────┐  
│ Fabstir | TinyLlama 1B | $8.80 │  
└────────────────────────────────────────┘

- App name (left)
- Selected model (center, clickable to change)
- PRIMARY balance (right, clickable to deposit)
  2.2 Restructure Chat Page Layout  


┌─ Header ──────────────────────────┐  
│ Fabstir | Model | Balance │  
├───────────────────────────────────┤  
│ [Start Session ($2 USDC)] │  
├─ Chat (70% screen) ───────────────┤  
│ │  
│ 👤 You: ... │  
│ 🤖 AI: ... │  
│ │  
├─ Input (15% screen) ──────────────┤  
│ Type message... [Send] │  
├─ Advanced Settings (5%) ──────────┤  
│ ⚙️ [Show Advanced ▼] │  
└───────────────────────────────────┘

2.3 Create Advanced Settings Panel (components/advanced-settings-panel.tsx)

Collapsed by default, expands to show:

- Session details (ID, tokens, cost, duration)
- Host information (address, endpoint, stake, [Change Host])
- Account balances (PRIMARY balance, [Deposit More])
- Change model selector
- Usage analytics ([View Analytics →])
- Reset preferences button  


Save advancedSettingsExpanded preference to settings

---

Phase 3: Model-First Selection

3.1 Create Model Selector (components/model-selector.tsx)

- Grid/list of available models with:
  - Model name (e.g., "TinyVicuna 1B")
  - Description (e.g., "Fastest, lowest cost")
  - Pricing (e.g., "$0.001 per message")
- Show "Recently Used" section if lastUsedModels exists
- Auto-save on selection via updateSettings({ selectedModel })
- Update recent models list (max 5)
  3.2 Smart Host Selection  


When user picks model:

1. Discover all hosts
2. Filter: hosts supporting this model
3. Randomly select compatible host (from filtered list)
4. Auto-connect to selected host
5. Save lastHostAddress to settings  


3.3 Hide Host Selector by Default

- Move to Advanced Settings panel
- Show full host list only when user clicks [Change Host]
- Otherwise, use smart auto-selection  


---

Phase 4: UI Polish & Optimization

4.1 Loading States

- Show spinner while loading settings (loading === true)
- Skeleton screens for chat interface
- Progressive loading (show cached settings immediately)
  4.2 Optimistic Updates  

- Update UI immediately when user changes preferences
- Save to S5 in background
- Show subtle toast on save success
- Don't block UI if save fails
  4.3 Error Handling  

- Non-blocking: Settings save failures don't stop chat
- Show warning toast if S5 unavailable
- Graceful degradation: Use defaults if settings fail to load
  4.4 Remove Complexity  

- Hide SUB account entirely (internal Base Account detail)
- Only show PRIMARY balance
- Simplify wallet connection (just "Connect" button)
- Move technical details to Advanced Settings  


---

Phase 5: Persistence & Cross-Device Sync

5.1 Auto-Save User Choices

Save these automatically:

- Model selection → selectedModel
- Host selection → lastHostAddress
- Payment token → preferredPaymentToken
- Theme changes → theme
- Advanced panel state → advancedSettingsExpanded
  5.2 Recently Used Lists  

- Track last 5 models → lastUsedModels
- Show in Model Selector for quick access
  5.3 Test Cross-Device  

- Open app in two browsers
- Change model in Browser A
- After 5 min (cache expiry), Browser B should see update  


---

Implementation Order

Week 1:

1. Create use-user-settings hook
2. Create setup wizard
3. Update app initialization (first-time user detection)
4. Test settings save/load  


Week 2:

5. Create compact header
6. Restructure chat page layout
7. Create advanced settings panel (collapsible)
8. Hide complexity (SUB account, etc.)  


Week 3:

9. Create model selector with auto-save
10. Implement smart host selection
11. Move host browsing to Advanced Settings
12. Add optimistic updates & error handling  


Week 4:

13. Polish UI animations
14. Test cross-device sync
15. Add analytics tracking
16. Final testing & bug fixes  


---

Files to Create/Modify

New Files:

- hooks/use-user-settings.ts - Settings hook
- components/setup-wizard.tsx - First-time setup
- components/compact-header.tsx - Minimal top bar
- components/model-selector.tsx - Model grid with auto-save
- components/advanced-settings-panel.tsx - Collapsible details  


Modified Files:

- app/chat/page.tsx - Restructured layout, settings integration
- components/chat-interface.tsx - Expand to fill screen
- components/host-selector.tsx - Move to Advanced Settings
- components/session-controls.tsx - Simplify controls
- hooks/use-chat-session.ts - Use settings for defaults  


---

Success Criteria

✅ First-time user sees setup wizard (model, theme, payment)

✅ Returning user sees chat immediately (no setup)

✅ Model selection auto-selects compatible host

✅ Settings persist across browser sessions

✅ Settings sync across devices (5-min delay acceptable)

✅ Chat takes up 70%+ of screen space

✅ SUB account hidden from UI

✅ Advanced details collapsed by default

✅ All saves happen in background (non-blocking)

✅ Graceful degradation if S5 unavailable

---

Ready to implement? Start with Phase 1 (User Settings Foundation)
