# v0.3.1 Release - Price Age Filtering Feature

## Overview
Added price age filtering feature (v0.3.1) allowing users to exclude prices older than 1/7/30/90 days or unlimited (no filter).

## Changes Made

### 1. Configuration
- **src/constants/index.js**: Added `maxPriceAgeDays` to `DEFAULT_CONFIG` with default value `null` (unlimited)

### 2. Utilities
- **src/utils/priceFilter.js** (NEW): Created new utility module with:
  - `isPriceWithinAgeLimit(lastUpdated, maxAgeDays)`: Checks if a price is recent enough
  - `filterPricesByAge(priceMap, maxAgeDays)`: Filters price map by age threshold

### 3. Store Updates  
- **src/stores/useJsonStore.js**:
  - Added import of `isPriceWithinAgeLimit` utility
  - Updated `getPriceMapWithPersonal()` method to:
    - Accept `maxPriceAgeDays` from appStore config
    - Filter prices by age before including them in unified price map
    - Include age filter in cache key for proper invalidation

### 4. UI Components
- **src/components/FloatingFilter.vue**:
  - Added new column for price age filter in filter panel header
  - Added dropdown select for 5 options: Unlimited, 1 day, 7 days, 30 days, 90 days
  - Uses `v-model.number` to bind to `store.config.maxPriceAgeDays`

### 5. Translations
Added translations to all 4 language files (French, English, Spanish, Portuguese) in `src/names/`:

**Keys added:**
- `config_max_price_age`: Filter label
- `price_age_unlimited`: "Unlimited" / "Illimité" / "Ilimitado"
- `price_age_1day`: "1 day" / "1 jour" / "1 día" / "1 dia"
- `price_age_7days`: "7 days" / "7 jours" / "7 días" / "7 dias"
- `price_age_30days`: "30 days" / "30 jours" / "30 días" / "30 dias"
- `price_age_90days`: "90 days" / "90 jours" / "90 días" / "90 dias"

**Updated Files:**
- `src/names/fr.json`
- `src/names/en.json`
- `src/names/es.json`
- `src/names/pt.json`

### 6. Tests
- **public/tests/unit/priceFilter.test.js** (NEW): Comprehensive test suite with 18 tests covering:
  - `isPriceWithinAgeLimit()`: Age boundary checking for 1/7/30/90 days
  - `filterPricesByAge()`: Map filtering with various price formats
  - Edge cases: no timestamps, mixed formats, no limit scenarios

**Test Results:**
- ✓ 9 tests for `isPriceWithinAgeLimit()`
- ✓ 9 tests for `filterPricesByAge()`
- ✓ All 133 total tests passing

### 7. Version Bumps
- **package.json**: 0.3.0 → 0.3.1
- **package-lock.json**: 0.3.0 → 0.3.1
- **src-tauri/Cargo.toml**: 0.3.0 → 0.3.1
- **src-tauri/tauri.conf.json**: 0.3.0 → 0.3.1

## Feature Behavior

### How It Works
1. User selects price age filter from dropdown in filter panel
2. When retrieving unified price map in views:
   - Personal prices: Included if within age limit (if set)
   - Collective prices: Included if within age limit AND not overridden by personal price
3. Prices without timestamps are always excluded (only if age filter is active)
4. Default is unlimited (null) - includes all prices regardless of age

### Impact on Views
The filter applies automatically to:
- **RentabilityHourView**: Uses `getPriceMapWithPersonal()`
- **RentabilityCraftView**: Uses `getPriceMapWithPersonal()`
- **RentabilityRunView**: Uses `getPriceMapWithPersonal()`
- **PricesView**: Can display filtered prices based on config

### Cache Behavior
- Cache is invalidated when price age filter changes
- Cache key now includes `maxPriceAgeDays` to distinguish filter states

## Technical Details

### Age Calculation
```javascript
ageMs = Date.now() - lastUpdated
ageInDays = ageMs / (1000 * 60 * 60 * 24)
isValid = ageInDays <= maxAgeDays
```

### Storage Format
Prices stored with timestamps:
```javascript
{
  [itemId]: {
    price: number,
    lastUpdated: timestamp (ms)
  }
}
```

### Price Priority (Unchanged)
1. Personal prices (localStorage)
2. Collective prices (Firebase) fallback
3. Age filter applied after priority rules

## Testing

Run tests:
```bash
npm test           # Watch mode
npm test -- --run  # Single run
```

All tests pass: **133 tests, 0 failures**

## Notes for Users
- Filter is optional (default = unlimited)
- Selecting "Unlimited" disables the age filter
- Only prices with timestamps can be properly filtered
- Personal and collective prices filtering works independently
- Filter is persistent (saved in localStorage via appStore config)
