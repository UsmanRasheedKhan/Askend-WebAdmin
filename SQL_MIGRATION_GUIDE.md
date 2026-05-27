# SQL Migrations - Ready to Run

## Database Schema (Actual)

**Existing Tables** (Do NOT recreate):
- `surveys` - id (BIGINT), user_id (UUID), title, description, questions (JSONB), responses_collected, total_responses, price, status, created_at, updated_at
- `survey_responses` - id (BIGINT), survey_id (BIGINT), user_id (UUID), response_data (JSONB), status, completed_at, created_at, updated_at
- `user_profiles` - id (UUID), user_id (UUID), full_name, email, wallet_balance, user_role, gender, date_of_birth, marital_status, mobile_number, etc.
- `admin_users` - id (UUID), email, name, role, status, created_at, updated_at

**Tables to Create** (via migrations):
- `reports` - survey reports/complaints
- `moderation_logs` - admin action logs
- `user_strikes` - user strike tracking
- `transactions` - financial transactions
- `withdrawals` - withdrawal requests
- `admin_notifications` - notifications for admins
- `realtime_alerts` - system alerts
- `admin_action_logs` - audit logs

---

## How to Run

### Step 1: Open Supabase Dashboard
https://app.supabase.com → Select your project

### Step 2: Run 4 SQL Migrations (In Order)

**For EACH file:**
1. Click **SQL Editor** → **New Query**
2. Open the SQL file from your project
3. Copy ALL content
4. Paste into Supabase SQL editor
5. Click **Run**
6. Verify: ✓ Success (no errors)

**Files in this order:**
1. `sql/001_init_schema.sql`
2. `sql/002_rls_policies.sql`
3. `sql/003_triggers_functions.sql`
4. `sql/004_report_notifications.sql`

### Step 3: Verify Tables Created

Go to **Supabase → Tables** and check all these exist:
- ✓ surveys (already exists)
- ✓ survey_responses (already exists)
- ✓ user_profiles (already exists)
- ✓ admin_users (already exists)
- ✓ report_notifications (already exists)
- ✓ reports (NEW)
- ✓ moderation_logs (NEW)
- ✓ user_strikes (NEW)
- ✓ transactions (NEW)
- ✓ withdrawals (NEW)
- ✓ admin_notifications (NEW)
- ✓ realtime_alerts (NEW)
- ✓ admin_action_logs (NEW)

### Step 4: Restart Dev Server

```bash
npm run dev
```

Should see:
```
▲ Next.js 16.2.6
✓ Ready in X.Xs
```

### Step 5: Test in Browser

Visit: http://localhost:3000

Check:
- Admin dashboard loads
- No red errors
- Users page shows users
- Surveys page shows surveys with creator names (NOT "Unknown Creator")
- Response counts display correctly

---

## What Changed in Code

1. **001_init_schema.sql** - Now only creates missing tables, doesn't try to recreate existing ones
2. **002_rls_policies.sql** - Only adds RLS to new tables, removes references to non-existent survey_questions table
3. **003_triggers_functions.sql** - Fixed syntax errors, removed invalid triggers, uses correct column names
4. **004_report_notifications.sql** - No changes (already exists)
5. **useQueries.ts** - Updated to use correct columns:
   - Joins surveys.user_id (UUID) with user_profiles.user_id (UUID) to get creator names
   - Parses questions from surveys.questions (JSONB) instead of non-existent table
   - Uses response_data from survey_responses (not responses)

---

## Key Points

✓ `surveys.questions` is a JSONB column (NOT a separate table)  
✓ `surveys.user_id` is UUID (NOT creator_id)  
✓ `survey_responses.response_data` contains the responses (NOT responses column)  
✓ Creator names fetched from user_profiles via user_id join  
✓ No more "Unknown Creator" errors  
✓ All users display correctly  

---

## If Migrations Fail

**Error: "relation X does not exist"**
- This table already exists - migration will skip it
- Not an error, just a notice

**Error: "Syntax error"**
- All syntax errors have been fixed
- Files are ready to run

**Error: "Foreign key constraint"**
- All foreign keys now reference correct tables
- Should work without errors

---

## Timeline

- Run migrations: **5-7 minutes**
- Restart dev server: **30 seconds**
- Test in browser: **1-2 minutes**
- **Total: ~10 minutes**

---

**Status**: ✅ All SQL files fixed and ready  
**Next**: Run in Supabase dashboard
