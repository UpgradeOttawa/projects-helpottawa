# 📁 FLATTEN GOOGLE TAKEOUT FOLDERS - QUICK GUIDE

## 🎯 PROBLEM:
Google Takeout stores photos in subfolders by date:
```
Google Photos/
├── 2023-01-15/
│   ├── IMG_001.jpg
│   └── IMG_001.jpg.json
├── 2023-01-16/
│   ├── IMG_002.jpg
│   └── IMG_002.jpg.json
└── 2023-01-17/
    ├── IMG_003.jpg
    └── IMG_003.jpg.json
```

**Upload interface can't handle this - needs all files in one folder!**

---

## ✅ SOLUTION: Flatten Everything

---

## 📝 STEP-BY-STEP:

### **STEP 1: Download Scripts**
Download these 2 PowerShell scripts:
1. `flatten_google_takeout.ps1`
2. `verify_json_gps.ps1`

---

### **STEP 2: Edit flatten_google_takeout.ps1**

Open the script in Notepad and **update line 4:**

```powershell
$sourceFolder = "C:\Users\Acer\Desktop\Takeout\Google Photos"  # ← CHANGE THIS
```

**Change to YOUR Google Takeout path** (where the subfolders are)

Examples:
- `C:\Users\Acer\Downloads\Takeout\Google Photos`
- `D:\Backups\Google Takeout\Google Photos`

**The target folder is already set correctly:**
```powershell
$targetFolder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"
```

---

### **STEP 3: Run Flatten Script**

Right-click `flatten_google_takeout.ps1` → **Run with PowerShell**

**You'll see:**
```
✓ Photo: IMG_001.jpg
✓ JSON:  IMG_001.jpg.json
✓ Photo: IMG_002.jpg
✓ JSON:  IMG_002.jpg.json
...

SUMMARY
========================================
Photos copied: 50
JSON files copied: 50
Total files: 100
```

**All files are now in one folder!**

---

### **STEP 4: Verify GPS Data**

Edit `verify_json_gps.ps1` line 4 if needed:
```powershell
$folder = "C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2"
```

Run the script: **Run with PowerShell**

**You'll see:**
```
File: IMG_001.jpg.json
  ✓ GPS Found (geoData)
    Lat: 45.4415
    Lng: -75.6005

SUMMARY
========================================
JSON files WITH GPS: 35
JSON files WITHOUT GPS: 15
```

**This tells you how many photos have GPS!**

---

### **STEP 5: Upload to Website**

1. Go to: http://localhost:3000/admin/upload
2. Click "Select Files"
3. Navigate to: `C:\Users\Acer\Desktop\renovation-platform\test_photos_batch2`
4. **Press Ctrl+A** to select ALL files (photos + JSON)
5. Click "Open"
6. Click "Upload"

**You should see:**
```
✓ GPS source: google_takeout_json
✓ Neighborhood: Beacon Hill South - Cardinal Heights
✓ Public location: Chapel Hill Community Centre
```

---

## ⚠️ COMMON ISSUES:

### **Issue: "No GPS data found"**

**Cause:** JSON files don't have location data

**Check:**
```powershell
# Open a JSON file in Notepad
# Look for:
"geoData": {
  "latitude": 45.4415,
  "longitude": -75.6005
}
```

**If lat/lng are both 0, the photo has no GPS.**

**Solution:**
- Photos were taken without location services
- Only photos with location will work
- Check your phone's camera settings

---

### **Issue: Script doesn't find files**

**Cause:** Wrong source path

**Fix:**
1. Open File Explorer
2. Navigate to your Google Takeout folder
3. Copy the full path from address bar
4. Paste into script line 4

---

### **Issue: "Access Denied" error**

**Cause:** PowerShell execution policy

**Fix:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted -Force
```

Then run the script again.

---

## 📊 EXPECTED RESULTS:

### **Good result:**
```
Photos copied: 50
JSON files copied: 50
Photos with JSON: 50
```
**All photos have GPS - ready to upload!**

---

### **Partial result:**
```
Photos copied: 50
JSON files copied: 50
JSON files WITH GPS: 30
JSON files WITHOUT GPS: 20
```
**30 photos will work, 20 won't (no GPS in Google Takeout)**

---

### **Bad result:**
```
Photos copied: 50
JSON files copied: 0
```
**No JSON files found - wrong source folder or photos don't have JSON files**

---

## 🎯 QUICK CHECKLIST:

- ✅ Updated source path in flatten script
- ✅ Ran flatten script - saw "Photos copied: X"
- ✅ Ran verify script - saw "JSON files WITH GPS: X"
- ✅ If X > 0, you can upload those photos
- ✅ Go to upload page, select ALL files (Ctrl+A)
- ✅ Upload and verify GPS detection works

---

## 💡 PRO TIP:

**If you have A LOT of photos:**

Process in batches:
1. Flatten 100 photos at a time
2. Upload and verify they work
3. Move to next batch

This prevents overwhelming the system with thousands of files.

---

**Any issues? Run the verify script and send me the output!** 🚀
