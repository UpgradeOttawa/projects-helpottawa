# 🎯 SMART UPLOAD WITH GPS AUTO-DETECTION
## Automatic Neighborhood Assignment + Privacy Jittering

---

## ✅ WHAT THIS DOES:

1. **Extracts GPS** from photo EXIF automatically
2. **Matches to actual neighborhood** (Beacon Hill, Convent Glen, not "Ottawa")
3. **Jitters GPS** to nearest public location (park/library) for privacy
4. **Auto-uploads** with no manual selection needed

---

## 🔧 SETUP (10 MINUTES):

### **STEP 1: Install Dependencies**

```powershell
cd C:\Users\Acer\Desktop\projects-helpottawa

npm install exifreader
```

---

### **STEP 2: Add Service Role Key**

**Edit `.env.local` and add:**

```
NEXT_PUBLIC_SUPABASE_URL=https://ixwmgvbnvihviqxfuruq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ADD THIS LINE (get from Supabase dashboard):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get service role key:**
1. Go to: https://supabase.com/dashboard/project/ixwmgvbnvihviqxfuruq/settings/api
2. Copy "service_role" key (NOT the anon key)
3. Paste into .env.local

---

### **STEP 3: Create API Route**

**Create folder:**
```powershell
mkdir app\api
mkdir app\api\upload
```

**Save `api_upload_route.ts` as:**
```
app\api\upload\route.ts
```

**⚠️ IMPORTANT:** You need to add ALL 118 neighborhoods to the NEIGHBORHOODS array in route.ts

I only included a few examples. Use the data from `ottawa_ons_neighbourhoods_index.csv`.

---

### **STEP 4: Replace Upload Page**

**Replace:**
```
app\admin\upload\page.tsx
```

**With:**
```
SMART_upload_page.tsx
```

---

### **STEP 5: Add Public Locations**

**Edit `app/api/upload/route.ts` and expand PUBLIC_LOCATIONS array:**

```typescript
const PUBLIC_LOCATIONS = [
  // Orleans area
  { name: "Petrie Island Park", lat: 45.4724, lng: -75.4963 },
  { name: "Orleans Library", lat: 45.4694, lng: -75.5164 },
  { name: "Chapel Hill Community Centre", lat: 45.4522, lng: -75.5333 },
  { name: "Fallingbrook Community Centre", lat: 45.4625, lng: -75.5236 },
  { name: "Convent Glen Park", lat: 45.4786, lng: -75.5372 },
  
  // Kanata area
  { name: "Walter Baker Park", lat: 45.3165, lng: -75.9065 },
  { name: "Kanata Centrum Community Centre", lat: 45.3089, lng: -75.8967 },
  { name: "Beaverbrook Library", lat: 45.3260, lng: -75.9002 },
  
  // Barrhaven area
  { name: "Walter Baker Sports Centre", lat: 45.2737, lng: -75.7485 },
  { name: "Barrhaven Library", lat: 45.2732, lng: -75.7338 },
  
  // Add more for each neighborhood...
];
```

**Goal:** Have 2-3 public locations per neighborhood.

---

## 🚀 TEST IT:

### **1. Start dev server:**

```powershell
npm run dev
```

### **2. Go to upload page:**

```
http://localhost:3000/admin/upload
```

### **3. Upload a photo with GPS:**

- Select photo (MUST have location data)
- Choose room type
- Click Upload
- Should see:
  ```
  ✓ Neighborhood: Beacon Hill South - Cardinal Heights
  ✓ Public location: Chapel Hill Community Centre
  ```

### **4. Check map:**

```
http://localhost:3000/map
```

**Photo should appear on map at jittered public location, NOT exact GPS.**

---

## 🐛 TROUBLESHOOTING:

### **Error: "No GPS data in photo"**

**Fix:** Photo doesn't have location metadata. Solutions:
- Take new photos with location enabled
- Use Google Photos Takeout (preserves GPS)
- Add GPS manually with photo editing software

### **Error: "Service role key not found"**

**Fix:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### **Error: "Neighborhood not found"**

**Fix:** GPS coordinates outside Ottawa, or NEIGHBORHOODS array incomplete.

Add all 118 neighborhoods from the CSV file.

---

## 📊 HOW IT WORKS:

### **1. GPS Extraction**

```
Photo uploaded
  ↓
EXIF reader extracts GPS
  ↓
Lat: 45.4415, Lng: -75.6005
```

### **2. Neighborhood Matching**

```
GPS: 45.4415, -75.6005
  ↓
Find nearest neighborhood centroid
  ↓
Match: "Beacon Hill South - Cardinal Heights"
```

### **3. GPS Jittering (Privacy)**

```
Original GPS: 45.4415, -75.6005
  ↓
Find nearest public location
  ↓
Chapel Hill Community Centre: 45.4522, -75.5333
  ↓
Add random offset (±50m)
  ↓
Final GPS: 45.4525, -75.5331
```

### **4. Display**

```
Map shows photo at:
  45.4525, -75.5331 (near Chapel Hill CC)
  
NOT at actual house location:
  45.4415, -75.6005 (protected!)
```

---

## ✅ BENEFITS:

1. **No manual sorting** - Auto-detects neighborhood
2. **Privacy protected** - Location jittered to public place
3. **Accurate neighborhoods** - Uses real Ottawa neighborhood boundaries
4. **Scalable** - Works for all 118 Ottawa neighborhoods

---

## 🎯 NEXT STEPS:

### **After this works:**

1. ✅ Bulk import existing photos with GPS
2. ✅ Add neighborhood filter to map
3. ✅ Show neighborhood stats on hub page
4. ✅ Add "Photos in your neighborhood" feature

### **Future enhancements:**

- Load neighborhoods from Supabase (not hardcoded)
- Use GeoJSON polygon matching (not just nearest centroid)
- Let users verify/correct auto-detected neighborhood
- Add more public locations per neighborhood

---

## 💾 LOADING ALL 118 NEIGHBORHOODS:

**I'll create a script to load them:**

You have `ottawa_ons_neighbourhoods_index.csv` with all data.

**Two options:**

**A) Load into Supabase** (recommended)
- Create `neighborhoods` table with name, lat, lng
- API queries database instead of hardcoded array
- Easier to update

**B) Generate TypeScript array** (quick but static)
- Convert CSV → TypeScript array
- Paste into API route
- Harder to maintain

**Which do you want?**

---

## 🚨 CRITICAL FOR THIS TO WORK:

1. ✅ Photos MUST have GPS in EXIF
2. ✅ Service role key in .env.local
3. ✅ All 118 neighborhoods loaded
4. ✅ Public locations mapped per neighborhood

**Without these, upload will fail.**

---

**Want me to:**
- **A)** Create script to load neighborhoods into Supabase
- **B)** Generate complete NEIGHBORHOODS TypeScript array
- **C)** Create bulk import tool for existing photos

**Pick one and I'll do it now.** 🚀
