# Plan: WEB-4724 - BankID (app-switch 3DS) Challenge Lost on Browser Reload

## Problem Analysis

### Issue Summary
When using Swedish 3DS (BankID app-switch) on Samsung Internet for Android, the browser reloads the tab upon return from the BankID app. This causes:
1. The in-page 3DS challenge to fail (uses `redirect: "if_required"`)
2. The purchase state (`operation_session_id`) stored in memory to be lost
3. `SetupIntent` never confirms
4. `purchase()` neither resolves nor rejects, returning customer to paywall

### Root Cause
The current implementation has two fundamental issues:

1. **In-memory state only**: The `PurchaseOperationHelper` class stores `operationSessionId` as an instance property (line 185 in `purchase-operation-helper.ts`):
   ```typescript
   private operationSessionId: string | null = null;
   ```
   This state is lost when the browser reloads.

2. **In-page 3DS confirmation**: The `StripeService.confirmElements` method uses `redirect: "if_required"` (line 407 in `stripe-service.ts`):
   ```typescript
   const baseOptions = {
     clientSecret,
     redirect: "if_required" as const,
   };
   ```
   This works for most 3DS flows but fails when the browser reloads during an external app-switch (like BankID).

### Affected Flow
```
1. User enters card details → triggers 3DS
2. Stripe opens BankID app (app-switch)
3. User completes authentication in BankID
4. Browser receives focus back → Samsung Internet reloads tab
5. All JavaScript state is lost
6. SetupIntent is orphaned, purchase() hangs
```

## Proposed Solution

### Approach: Hybrid Redirect + State Persistence

Implement a two-pronged solution that:
1. Uses redirect-based 3DS confirmation with a `return_url`
2. Persists purchase session state in `sessionStorage` for recovery

### Implementation Components

#### 1. State Persistence Layer (New File)

Create `src/helpers/checkout-session-storage.ts`:

```typescript
interface PersistedCheckoutSession {
  operationSessionId: string;
  clientSecret: string;
  timestamp: number;
  productId: string;
  email?: string;
}

const STORAGE_KEY = 'rc_checkout_session';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function persistCheckoutSession(session: PersistedCheckoutSession): void;
export function getPersistedCheckoutSession(): PersistedCheckoutSession | null;
export function clearPersistedCheckoutSession(): void;
export function hasValidPersistedSession(): boolean;
```

**Key functionality:**
- Persist `operationSessionId`, `clientSecret`, and metadata before 3DS
- Retrieve session on page load
- Clear session after successful purchase or explicit cancellation
- Auto-expire stale sessions

#### 2. Modify StripeService.confirmElements (stripe-service.ts)

Update to support redirect-based confirmation:

```typescript
static async confirmElements(
  stripe: Stripe,
  elements: StripeElements,
  clientSecret: string,
  confirmationTokenId?: string,
  returnUrl?: string, // NEW: optional return URL
) {
  const baseOptions = {
    clientSecret,
    redirect: returnUrl ? "always" as const : "if_required" as const,
    ...(returnUrl ? { return_url: returnUrl } : {}),
  };
  // ... rest of implementation
}
```

**Why `redirect: "always"` when `returnUrl` is provided:**
- Forces Stripe to always use the redirect flow
- Ensures consistent behavior across all 3DS types
- The `return_url` includes query parameters for session recovery

#### 3. Update PurchaseOperationHelper (purchase-operation-helper.ts)

Add persistence integration:

```typescript
export class PurchaseOperationHelper {
  // Existing method - add persistence
  async checkoutComplete(options: {...}): Promise<CheckoutCompleteResponse> {
    // ... existing logic
    const response = await this.backend.postCheckoutComplete(...);
    
    // NEW: Persist session before 3DS
    if (response.gateway_params?.client_secret) {
      persistCheckoutSession({
        operationSessionId: this.operationSessionId!,
        clientSecret: response.gateway_params.client_secret,
        timestamp: Date.now(),
        productId: /* from context */,
        email: options.email,
      });
    }
    
    return response;
  }

  // NEW: Resume from persisted session
  resumeFromPersistedSession(): boolean {
    const session = getPersistedCheckoutSession();
    if (session && !isSessionExpired(session)) {
      this.operationSessionId = session.operationSessionId;
      return true;
    }
    return false;
  }
}
```

#### 4. Update Payment Entry Page (payment-entry-page.svelte)

Handle redirect returns and session recovery:

```typescript
onMount(async () => {
  // NEW: Check for Stripe redirect return
  const urlParams = new URLSearchParams(window.location.search);
  const redirectStatus = urlParams.get('redirect_status');
  const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
  const setupIntentClientSecret = urlParams.get('setup_intent_client_secret');
  
  if (redirectStatus && (paymentIntentClientSecret || setupIntentClientSecret)) {
    // Clear URL params to prevent re-processing
    window.history.replaceState({}, '', window.location.pathname);
    
    // Resume from persisted session
    const session = getPersistedCheckoutSession();
    if (session) {
      if (redirectStatus === 'succeeded') {
        // Resume polling for completion
        await resumePurchasePolling(session);
      } else {
        // Handle failure
        handleRedirectFailure(redirectStatus);
      }
      return;
    }
  }
  
  // ... existing onMount logic
});
```

#### 5. Return URL Construction

Create helper for building return URLs with context:

```typescript
function buildStripeReturnUrl(): string {
  const url = new URL(window.location.href);
  // Clean existing Stripe params
  url.searchParams.delete('redirect_status');
  url.searchParams.delete('payment_intent');
  url.searchParams.delete('payment_intent_client_secret');
  url.searchParams.delete('setup_intent');
  url.searchParams.delete('setup_intent_client_secret');
  return url.toString();
}
```

### Recovery Flow After Reload

```
1. Page loads after BankID redirect
2. Check URL for Stripe redirect params (redirect_status, etc.)
3. If present:
   a. Retrieve persisted session from sessionStorage
   b. Validate session (not expired, matches intent)
   c. Poll getCheckoutStatus with operationSessionId
   d. Complete purchase flow or show error
4. Clear persisted session
5. Clean URL params via replaceState
```

### Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Session expired (>30 min) | Show error, require restart |
| Session mismatch | Clear and show error |
| Network failure during recovery | Retry with backoff, then error |
| User closes tab before 3DS | Session expires naturally |
| Duplicate recovery attempts | Idempotent polling handles this |
| SetupIntent already failed | getCheckoutStatus returns Failed status |

### Testing Strategy

1. **Unit Tests**
   - `checkout-session-storage.ts`: persistence, retrieval, expiry
   - `stripe-service.ts`: return_url construction and usage
   - `purchase-operation-helper.ts`: resume logic

2. **Integration Tests**
   - Mock 3DS redirect flow
   - Simulate page reload with persisted state
   - Verify polling resumes correctly

3. **Manual Testing**
   - Samsung Internet + Swedish card (BankID)
   - Various browsers with 3DS app-switch
   - Edge cases: expired sessions, network failures

### Migration & Rollout

1. **Feature Flag** (optional but recommended)
   - Initially deploy behind a flag
   - Enable for Swedish cards first
   - Monitor for issues before full rollout

2. **Backward Compatibility**
   - `return_url` is only set when needed (can be conditional)
   - Non-redirect 3DS flows continue to work as before

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/helpers/checkout-session-storage.ts` | NEW | Session persistence utilities |
| `src/stripe/stripe-service.ts` | MODIFY | Add `returnUrl` parameter to `confirmElements` |
| `src/helpers/purchase-operation-helper.ts` | MODIFY | Integrate persistence, add resume method |
| `src/ui/pages/payment-entry-page.svelte` | MODIFY | Handle redirect returns, recover sessions |
| `src/ui/purchases-ui.svelte` | MODIFY | Pass return URL context to child components |

### Estimated Complexity

- **Core implementation**: Medium complexity
- **Testing**: Medium-high (requires mocking browser behaviors)
- **Risk**: Low-medium (isolated to 3DS redirect flows)

### Dependencies

- No backend changes required (existing endpoints support this)
- No new Stripe API features required
- `sessionStorage` API (widely supported)

### Related Issues

- [WEB-4367](https://linear.app/revenuecat/issue/WEB-4367/support-redirect-based-payment-methods-in-stripe-billing) - May share implementation patterns

---

## Open Questions

1. Should we always use redirect for 3DS, or only for specific user agents (e.g., Samsung Internet)?
2. Should session persistence use `localStorage` (survives tab close) or `sessionStorage` (tab-scoped)?
3. Do we need a user-facing "resuming purchase" loading state?

## Recommendation

Proceed with the hybrid approach using `sessionStorage`. This provides the safest recovery mechanism while limiting the scope to the current browser session. The implementation can be extended later if broader persistence is needed.
