# Task 2-3 Implementation Report

## Summary
Both Task 2 (API date filters) and Task 3 (TodoForm initialDate prop) completed successfully with no blockers.

## Task 2: API 날짜 필터 추가
**Status:** DONE

### Changes
1. **types/todo.ts** - Added `dateFrom`, `dateTo`, `noDate` fields to Filters interface
2. **app/api/todos/route.ts** - Replaced entire file with new implementation including:
   - Date parameter extraction from query params
   - Conditional filtering for date ranges
   - Special handling for `noDate` filter (returns todos with null dueDate)
   - Changed orderBy from `createdAt` to `dueDate` for date-sorted results

### Commit
```
394fb90 feat: add dateFrom/dateTo/noDate filter to todos API
```

## Task 3: TodoForm initialDate prop
**Status:** DONE

### Changes
1. **components/TodoForm.tsx**
   - Added `initialDate?: string` prop to Props interface
   - Updated function signature to destructure `initialDate`
   - Modified dueDate useState to use `initialDate` as fallback when no initialValues.dueDate exists

### Commit
```
4ce1fc6 feat: add initialDate prop to TodoForm
```

## Verification
- All files modified per spec
- Both commits created successfully
- No TypeScript compilation errors
- No blocking issues encountered

## Concerns
None. Both tasks completed as specified.

## UTC Date Parsing Fix
**Status:** DONE

### Issue
`new Date()` parses YYYY-MM-DD strings inconsistently across environments (UTC vs local time), causing off-by-one-day filtering errors.

### Fix Applied
Modified `app/api/todos/route.ts` to add explicit UTC timezone suffix:
- `new Date(dateFrom)` → `new Date(dateFrom + 'T00:00:00Z')`
- `new Date(dateTo + 'T23:59:59')` → `new Date(dateTo + 'T23:59:59Z')`

### Commit
```
1957e9c fix: use UTC timezone for date range filtering
```
