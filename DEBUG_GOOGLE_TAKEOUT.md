# 🐛 DEBUG: Google Takeout GPS Not Found

## ❓ QUESTIONS TO ANSWER:

### 1. Are you uploading BOTH files?
When you click "Select Files", are you selecting:
- ✅ The photo (.jpg)  
- ✅ The .json file  

**Both at the same time?**

---

### 2. What do you see in the upload page?
After selecting files, do you see:
```
✓ X photo(s) selected
✓ X JSON file(s) selected
```

---

### 3. What error message do you get?
Is it:
- ❌ "No GPS data found"
- ❌ Different error?
- ❌ Success message but photos don't show on map?

---

### 4. What's in your JSON file?

**Run this test:**

1. Open one of your `.json` files in Notepad
2. Look for GPS data

**Example of what it should look like:**

```json
{
  "title": "IMG_1234.jpg",
  "geoData": {
    "latitude": 45.4415,
    "longitude": -75.6005,
    "altitude": 0.0
  },
  "photoTakenTime": {
    "timestamp": "1234567890"
  }
}
```

**Do you see `"geoData"` with lat/lng?**

---

## 🔧 TROUBLESHOOTING STEPS:

### **Step 1: Check JSON Files Have GPS**

Open a `.json` file and look for:
- `"geoData"`
- `"latitude"`
- `"longitude"`

If these are missing or `0.0`, Google didn't save location data.

---

### **Step 2: Run Test Script**

Download and run `test_google_takeout_json.ps1`:

```powershell
# Edit the path in the script first
.\test_google_takeout_json.ps1
```

This will show you what's in your JSON files.

---

### **Step 3: Verify File Upload**

When you select files, you should see BOTH listed:
- `photo1.jpg`
- `photo1.jpg.json`

If you only see the photos, the JSON files aren't being selected.

---

## 🚨 COMMON ISSUES:

### **Issue 1: JSON files don't have GPS**
**Cause:** Photos were taken without location services enabled  
**Fix:** Only photos taken with GPS will have location data in Google Takeout

### **Issue 2: Only uploading photos, not JSON**
**Cause:** Not selecting the .json files when uploading  
**Fix:** Select BOTH the .jpg AND .json files together

### **Issue 3: JSON file naming mismatch**
**Cause:** JSON file name doesn't match photo name  
**Fix:** Ensure files are named like:
- `IMG_1234.jpg`
- `IMG_1234.jpg.json` ← Must match exactly

---

## ✅ WHAT TO SEND ME:

1. **Contents of one JSON file** (open in Notepad, copy-paste here)
2. **Error message you see** (exact text)
3. **Screenshot of file selection** (showing both files selected)

Then I can fix the exact issue!

---

## 🎯 EXPECTED BEHAVIOR:

**When it works:**
```
Upload files: 
  - IMG_1234.jpg
  - IMG_1234.jpg.json

Result:
✓ GPS source: google_takeout_json
✓ Neighborhood: Beacon Hill South - Cardinal Heights
✓ Public location: Chapel Hill Community Centre
```

**If this isn't happening, send me the debug info above!**
