# Example Photos Directory

This directory contains placeholder example photos for the 4-stage photo capture interface.

## Purpose

These example photos serve as:
- **Development placeholders** - Pre-filled photos for testing without re-capturing
- **Demo material** - Show what a completed scan looks like
- **Testing data** - Consistent test photos for form validation

## Required Files

Place the following 4 files in this directory:

1. **front_smile.png** - Front Open View
2. **lower_front.png** - Lower Teeth View
3. **upper_front.png** - Upper Teeth View
4. **side_bite.png** - Side Open View

## How to Generate Example Photos

### Method 1: Using the App (Recommended)

1. Open the analysis app
2. Navigate to the "Photo Scan" tab
3. Capture all 4 required photos
4. Press the **`E`** key on your keyboard
5. 4 PNG files will download to your Downloads folder
6. Move the 4 files to this directory (`/public/example-photos/`)
7. Refresh the page - photos will auto-load

### Method 2: Manual Placement

1. Take 4 photos using any method
2. Convert/save them as PNG files
3. Rename them to match the required filenames above
4. Place them in this directory
5. Refresh the page

## Auto-Loading Behavior

- When the "Photo Scan" tab is opened, the app automatically attempts to load photos from this directory
- If all 4 photos are found, they are loaded and marked with "EXAMPLE" badges
- The orange border and badge indicate these are placeholder photos
- When you capture a new photo, it replaces the example photo in that slot

## Clearing Example Photos

To remove example photos:
1. Delete the 4 PNG files from this directory
2. Refresh the page
3. Or press **`C`** key for instructions

## Notes

- Photos must be in PNG format
- Filenames are case-sensitive
- Photos are loaded via HTTP fetch, so the dev server must be running
- Example photos are gitignored by default (add to .gitignore if needed)

## .gitignore

If you want to keep example photos private, add this to your `.gitignore`:

```
public/example-photos/*.png
```

Or if you want to commit them for the team, don't add them to .gitignore.
