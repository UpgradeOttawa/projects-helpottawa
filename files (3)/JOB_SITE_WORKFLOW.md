# 🏗️ ORGANIZE PHOTOS BY JOB SITE
## For Contractors with Multiple Projects

---

## 🎯 YOUR SITUATION:

You're a contractor with photos from multiple job sites:
- ✅ Pembroke City Hall (2012) - No GPS in photos
- ✅ Other jobs in Ottawa area - May have GPS
- ✅ Various neighborhoods - Mixed GPS data

**Solution:** Organize by job site, manually assign GPS to old jobs.

---

## 📁 RECOMMENDED FOLDER STRUCTURE:

```
renovation-platform/
├── test_photos_batch2/
│   └── pembroke_city_hall_2012/
│       ├── IMG_2046.JPG
│       ├── IMG_2046.JPG.json
│       ├── IMG_2047.JPG
│       └── IMG_2047.JPG.json
│
├── test_photos_batch3/
│   └── orleans_bathroom_2023/
│       ├── (photos with GPS)
│
└── test_photos_batch4/
    └── kanata_kitchen_2024/
        ├── (photos with GPS)
```

---

## 🚀 WORKFLOW:

### **STEP 1: Separate by Job Site**

Move photos into folders by project:

```powershell
# Example
mkdir "test_photos_batch2\pembroke_city_hall_2012"
Move-Item "test_photos_batch2\IMG_*.JPG*" "test_photos_batch2\pembroke_city_hall_2012\"
```

---

### **STEP 2: Assign GPS to Old Jobs**

For projects WITHOUT GPS (like Pembroke 2012):

1. Run `batch_assign_gps.ps1`
2. Enter job site location
3. Script updates all JSON files with GPS

**Pembroke City Hall:**
- Lat: `45.8267`
- Lng: `-77.1113`

---

### **STEP 3: Upload by Batch**

Upload one job site at a time:

1. Go to: http://localhost:3000/admin/upload
2. Select files from ONE job folder
3. Set room type (bathroom, kitchen, etc.)
4. Upload
5. Verify on map
6. Move to next job

---

## 📋 COMMON JOB SITES (Ontario):

**Add these to your batch_assign_gps.ps1:**

```powershell
$jobSites = @{
    "pembroke_city_hall" = @{
        name = "Pembroke City Hall"
        lat = 45.8267
        lng = -77.1113
    }
    
    "ottawa_city_hall" = @{
        name = "Ottawa City Hall"
        lat = 45.4215
        lng = -75.6972
    }
    
    "orleans_library" = @{
        name = "Orleans Library"
        lat = 45.4694
        lng = -75.5164
    }
    
    "kanata_rec_centre" = @{
        name = "Kanata Recreation Centre"
        lat = 45.3089
        lng = -75.8967
    }
    
    # Add your own job sites here
}
```

---

## ⚠️ IMPORTANT: Pembroke vs Ottawa

**Pembroke is NOT in Ottawa!**

Your system is designed for Ottawa neighborhoods. Photos from Pembroke will:
- ✅ Upload successfully with GPS
- ⚠️ Be assigned to nearest Ottawa neighborhood (wrong!)
- ❌ Show on Ottawa map (far away)

**Solutions:**

**Option A: Add Pembroke as a city (better)**
- Add Pembroke to `cities` table in Supabase
- System treats it separately from Ottawa
- Can filter by city

**Option B: Keep everything as Ottawa (quick)**
- Just upload with Pembroke GPS
- System will assign to nearest Ottawa neighborhood
- Photos show up, but location is off

**Which do you prefer?**

---

## 🎯 RECOMMENDED APPROACH:

### **For NOW:**

1. **Focus on Ottawa-area jobs first**
   - Upload photos that already have GPS
   - These will map correctly to neighborhoods

2. **Skip Pembroke for now**
   - Save those photos for later
   - Once system is working, we'll add Pembroke as a city

3. **Get the system working**
   - See photos on map
   - Verify neighborhoods work
   - Test the workflow

### **For LATER:**

1. Add more cities to database
2. Upload Pembroke photos
3. Create city filter on map
4. Expand beyond Ottawa

---

## 💡 ALTERNATIVE: Manual Upload Interface

Want me to create a page where you can:
- Upload photo
- Click on map to set location
- Assign room type
- Add project notes

**This would work for photos WITHOUT GPS.**

---

## 🎯 WHAT DO YOU WANT TO DO?

**A)** Focus on Ottawa photos with GPS first (get system working)

**B)** Add Pembroke as a city now (more setup, but complete)

**C)** Create manual upload interface (click map to place photos)

**D)** Use batch assign script for Pembroke, upload anyway (quick & dirty)

**Pick one and I'll help you execute!** 🚀
