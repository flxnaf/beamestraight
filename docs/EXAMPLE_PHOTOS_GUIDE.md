# Example Photos Feature Guide

## Overview
The example photos feature allows you to save permanent placeholder photos as files in the project that will be displayed when the 4-stage photo capture interface loads. This is useful for development, testing, and demonstrations.

## Quick Start

1. **Capture 4 photos** in the Photo Scan tab
2. **Press `E`** to download them
3. **Move files** to `/public/example-photos/`
4. **Refresh** - photos auto-load!

## How to Use

### 1. **Capture 4 Photos**
   - Navigate to the "Photo Scan" tab in the analysis interface
   - Take all 4 required photos:
     - Front Open View
     - Lower Teeth View
     - Upper Teeth View
     - Side Open View

### 2. **Save as Example Photos**
   - Once all 4 photos are captured, press the **`E`** key on your keyboard
   - 4 PNG files will automatically download:
     - `front_smile.png`
     - `lower_front.png`
     - `upper_front.png`
     - `side_bite.png`
   - Move these 4 files to: `/public/example-photos/`
   - An alert will show you the exact instructions

### 3. **Visual Indicators**
   - Example photos are marked with:
     - An orange **"EXAMPLE"** badge in the top-left corner
     - An orange border around the thumbnail
     - Slightly reduced opacity (85%)
   - This makes it clear which photos are placeholders vs. newly captured photos

### 4. **Auto-Loading**
   - When you reload the page or start a new session:
     - The app automatically checks `/public/example-photos/` for the 4 PNG files
     - If found, they load into all 4 slots
     - They serve as placeholders showing what a complete scan looks like
   - When you capture a new photo in any slot:
     - The example photo flag is cleared
     - The new photo replaces the example without the "EXAMPLE" badge

### 5. **Clear Example Photos**
   - Press the **`C`** key on your keyboard to see instructions
   - Delete the 4 PNG files from `/public/example-photos/`
   - Refresh the page
   - The 4 photo slots will be empty

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Save current 4 photos as examples |
| `C` | Clear all example photos |

## Technical Details

- **Storage**: Example photos are stored as PNG files in `/public/example-photos/`
- **Format**: PNG image files (not base64 data URLs)
- **Persistence**: Files persist permanently until manually deleted
- **Size**: Each photo is ~200-500KB depending on compression
- **Loading**: Photos are fetched via HTTP when the Photo Scan tab opens

## File Structure

```
/public
  /example-photos
    ├── README.md           (this explains the folder)
    ├── front_smile.png     (Front Open View)
    ├── lower_front.png     (Lower Teeth View)
    ├── upper_front.png     (Upper Teeth View)
    └── side_bite.png       (Side Open View)
```

## Use Cases

1. **Development**: Quickly test the form submission flow without re-capturing photos
2. **Demonstrations**: Show potential users what a completed scan looks like
3. **Testing**: Verify API integration and form validation with consistent test data
4. **Training**: Help team members understand the expected photo quality
5. **Version Control**: Commit example photos to repo for team-wide consistency

## Version Control

### To share example photos with team:
Keep the files in `/public/example-photos/` (not in .gitignore)

### To keep example photos private:
Add to `.gitignore`:
```
public/example-photos/*.png
```

## Notes

- Example photos only work in the "Photo Scan" tab (Tab 3)
- They do not affect the AI Preview or Treatment Plan tabs
- Photos are served via HTTP, so the dev server must be running
- Filenames are case-sensitive and must match exactly
- All 4 files are optional - app loads whatever is available

## Troubleshooting

**Photos not loading?**
- Check that files are in `/public/example-photos/` (not `/analysis/example-photos/`)
- Verify filenames match exactly (case-sensitive)
- Check browser console for 404 errors
- Ensure dev server is running (`npm run dev`)
- Check browser console for "[DEBUG] Loaded example photos" message

**Download not working?**
- Ensure all 4 photos are captured before pressing `E`
- Check browser's download settings
- Try a different browser if downloads are blocked

**Example badge not showing?**
- Ensure CSS is loaded properly
- Check that `usingExamplePhotos` flag is set to `true` in the console
- Try refreshing the page
- Check that files were successfully loaded in Network tab

**Files in wrong location?**
The correct path is: `/public/example-photos/` (relative to project root)
NOT: `/analysis/example-photos/` or `/src/example-photos/`
