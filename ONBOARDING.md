# OTTAWA RENOVATION MAP - COMPLETE SETUP GUIDE

## THE PROBLEM

Your project has files trying to import from `@/lib/supabase/client` but that file doesn't exist.

This causes: `Type error: Module '"@/lib/supabase/client"' declares 'createClient' locally, but it is not exported.`

## THE SOLUTION

Follow this guide EXACTLY. No shortcuts. No patches.

---

## PART 1: PROJECT STRUCTURE (What You MUST Have)

```
projects-helpottawa/
├── app/
│   ├── admin/
│   │   └── upload/
│   │       └── page.tsx          ✓ EXISTS (upload page)
│   ├── api/
│   │   └── upload/
│   │       └── route.ts           ✓ EXISTS (API endpoint)
│   ├── map/
│   │   └── page.tsx               ✓ EXISTS (map page)
│   ├── layout.tsx                 ✓ EXISTS
│   ├── globals.css                ✓ EXISTS
│   └── favicon.ico                ✓ EXISTS
├── lib/                           ❌ MISSING - THIS IS THE PROBLEM
│   └── supabase/
│       └── client.ts              ❌ THIS FILE DOESN'T EXIST
├── public/                        ✓ EXISTS
├── .env.local                     ✓ EXISTS
├── next.config.ts                 ✓ EXISTS
├── package.json                   ✓ EXISTS
├── tsconfig.json                  ✓ EXISTS
└── README.md                      ✓ EXISTS
```

**THE MISSING PIECE: `lib/supabase/client.ts`**

---

## PART 2: CREATE THE MISSING FILE

Run these commands:

```powershell
cd C:\Users\Acer\Desktop\projects-helpottawa

# Create lib folder
mkdir lib
mkdir lib\supabase

# Create the client file
notepad lib\supabase\client.ts
```

**Copy this into the file:**

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function createClient() {
  return supabase;
}
```

**Save and close Notepad.**

---

## PART 3: VERIFY YOUR .env.local FILE

```powershell
notepad .env.local
```

**It MUST contain these 3 lines (with your actual values):**

```
NEXT_PUBLIC_SUPABASE_URL=https://ixwmgvbnvihviqxfuruq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (your actual key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your actual key)
```

**Get these keys from:**
https://supabase.com/dashboard/project/ixwmgvbnvihviqxfuruq/settings/api

---

## PART 4: TEST LOCALLY

```powershell
npm run dev
```

**Go to:** http://localhost:3000/map

**If it works locally, proceed to Part 5.**

**If it fails, send me the error.**

---

## PART 5: COMMIT AND PUSH

```powershell
git add .
git commit -m "add missing supabase client file"
git push
```

---

## PART 6: DEPLOY TO VERCEL

### Option A: If Project Already Exists

1. Go to: https://vercel.com/dashboard
2. Click: design-layout-map
3. Settings → Environment Variables
4. Add these 3 (if not already there):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ixwmgvbnvihviqxfuruq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase)
5. Deployments tab → Wait for auto-build
6. Should work now

### Option B: Delete and Start Fresh

1. Vercel → design-layout-map → Settings → Delete Project
2. Go to: https://vercel.com/new
3. Import: UpgradeOttawa/projects-helpottawa
4. Framework: Next.js
5. Root Directory: (leave empty)
6. Add 3 environment variables (see above)
7. Deploy

---

## PART 7: TROUBLESHOOTING

### Error: "Module not found: @/lib/supabase/client"
**Fix:** You didn't create the `lib/supabase/client.ts` file. Go back to Part 2.

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Fix:** Your .env.local file is incomplete. Go back to Part 3.

### Vercel builds old commit
**Fix:** Make a new commit:
```powershell
echo "." >> README.md
git add README.md
git commit -m "trigger"
git push
```

### Build succeeds but shows 404
**Fix:** Go to the correct URL: `https://your-url.vercel.app/map` (note the `/map`)

---

## WHY THIS HAPPENED

1. You started with a Next.js template
2. Files were created that imported from `@/lib/supabase/client`
3. But that file was never created
4. TypeScript compilation fails because the import doesn't exist
5. I kept deleting files instead of creating the missing one

---

## THE COMPLETE FIX

**ONE FILE WAS MISSING: `lib/supabase/client.ts`**

**Create it (Part 2) → Test (Part 4) → Deploy (Part 6) → DONE**

---

## AFTER DEPLOYMENT

Your site will be live at:
- Main page: `https://design-layout-map.vercel.app`
- Map page: `https://design-layout-map.vercel.app/map`
- Upload page: `https://design-layout-map.vercel.app/admin/upload`

---

## NEXT STEPS

1. Upload more photos
2. Clean up Supabase storage (you're at 676% of free tier)
3. Consider upgrading Supabase to Pro ($25/month) if you need more storage

---

## IF THIS STILL DOESN'T WORK

**Send me:**
1. The exact error message
2. Output of: `dir lib\supabase`
3. Output of: `type lib\supabase\client.ts`

**And I'll fix it for real this time.**
