# React setState During Render Error Fixes

## Problem Description

The application was experiencing a React error:
```
Error: Cannot update a component (`FormProvider`) while rendering a different component (`DJContractForm`). 
To locate the bad setState() call inside `DJContractForm`, follow the stack trace as described in https://react.dev/link/setstate-in-render
```

This error occurs when `updateContractFormData()` is called during the render phase of a component, which violates React's rules.

## Root Cause

The error was caused by multiple event handlers calling `updateContractFormData()` directly during component render, which triggers a state update in the FormProvider while the DJContractForm component is still rendering.

## Solution Strategy

**Key Principle**: Defer all context updates using `setTimeout(() => {}, 0)` to move them out of the render phase while preserving all data persistence functionality.

## Fixed Functions

### 1. handleChange Function
**Location**: `app/page.js` lines ~1905-1960
**Issue**: Called `updateContractFormData()` directly in `setFormData` callback
**Fix**: Wrapped context update in `setTimeout`

```javascript
// Before (problematic)
setFormData((prev) => {
  // ... logic ...
  updateContractFormData(newData); // ❌ setState during render
  return newData;
});

// After (fixed)
setFormData((prev) => {
  // ... logic ...
  setTimeout(() => {
    updateContractFormData(newData); // ✅ Deferred to next tick
  }, 0);
  return newData;
});
```

### 2. handlePaymentMethodSelect Function
**Location**: `app/page.js` lines ~2690-2720
**Issue**: Called `updateContractFormData()` in `setFormData` callback
**Fix**: Wrapped context update in `setTimeout`

### 3. GenreSelectionModal - applyChanges Function
**Location**: `app/page.js` lines ~2796-2810
**Issue**: Called `updateContractFormData()` directly after `setFormData`
**Fix**: Wrapped context update in `setTimeout`

### 4. Service Toggle Handlers
**Location**: `app/page.js` lines ~3786-3820
**Issue**: Called `updateContractFormData()` directly in click handlers
**Fix**: Wrapped context update in `setTimeout`

### 5. Streaming Service Selection
**Location**: `app/page.js` lines ~4044-4080
**Issue**: Called `updateContractFormData()` directly in onClick handlers
**Fix**: Wrapped context update in `setTimeout`

### 6. Payment Amount Selection
**Location**: `app/page.js` lines ~4320-4420
**Issue**: Called `updateContractFormData()` directly in onChange and onClick handlers
**Fix**: Wrapped context update in `setTimeout`

## Data Persistence Preservation

### ✅ What Was Preserved

1. **FormContext Integration**: All form data still syncs with the FormContext
2. **localStorage Backup**: Direct localStorage saves remain immediate for reliability
3. **Cross-Tab Synchronization**: Storage event listeners still work
4. **Page Navigation Persistence**: Data persists when navigating between contract and agenda forms
5. **Window Focus/Visibility Reload**: Data reloads when returning to the page
6. **Data Sanitization**: All the data sanitization logic remains intact

### ✅ How Data Flow Works

1. **User Input** → `setFormData()` (immediate local state update)
2. **localStorage Save** → Immediate backup save
3. **Context Update** → Deferred via `setTimeout` (prevents React error)
4. **Cross-Component Sync** → FormContext propagates changes to other components

### ✅ Benefits of This Approach

- **No Data Loss**: localStorage saves happen immediately
- **No Performance Impact**: `setTimeout(..., 0)` has minimal delay
- **React Compliance**: Moves state updates out of render phase
- **Maintains UX**: Users see immediate feedback from local state
- **Preserves Reliability**: Multiple persistence layers still work

## Additional Fixes

### Layout.js Client Component
**Issue**: Metadata exports not allowed in client components
**Fix**: Moved metadata to manual head tags and removed exports

### Error Boundary
**Added**: Better error handling for the payment success page

## Testing Verification

The fixes ensure:
- ✅ No React setState during render errors
- ✅ Form data persists between main contract page and agenda form
- ✅ Data survives page refreshes and navigation
- ✅ Cross-tab synchronization works
- ✅ All form interactions work smoothly
- ✅ Payment flow remains functional

## Code Pattern for Future Development

When adding new form interactions, use this pattern:

```javascript
const handleNewFormChange = (newValue) => {
  const newData = { ...formData, newField: newValue };
  
  // 1. Update local state immediately
  setFormData(newData);
  
  // 2. Save to localStorage immediately (backup)
  try {
    localStorage.setItem('djContractFormData', JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  // 3. Defer context update to avoid setState during render
  setTimeout(() => {
    updateContractFormData(newData);
  }, 0);
};
```

This pattern ensures React compliance while maintaining robust data persistence. 