# Beame Teeth Straightener - Landing Page

## Overview

This is a **dual-site** landing page system with separate pages optimized for English and Chinese. Each version has its own proportions and styling optimized for its language, ensuring perfect text fitting and layout.

## Files Structure

```
landing/
├── index.html          # Chinese (中文) landing page
├── index-en.html       # English landing page
├── style.css           # CSS optimized for Chinese text
├── style-en.css        # CSS optimized for English text
├── script.js           # JavaScript for page functionality
└── Font/               # Comfortaa and Omnium font files
```

## Language Support

Two separate optimized pages:
- **Chinese (中文)** - `index.html` with `style.css`
- **English (EN)** - `index-en.html` with `style-en.css`

Users switch between pages using the language button in the navigation bar. Each page has its own:
- Font sizing optimized for the language
- Text proportions that work naturally
- Spacing and layout tailored to text length
- No compromises trying to fit both languages in one layout

## Key Features

### Exact Styling from aligner.vue

All CSS classes and styling are copied directly from aligner.vue:
- `.computer_img_top` - Hero banner animation
- `.service3_h2` - Section headers
- `.advisory` - Consultation options container
- `.box` / `.box2` - Desktop and mobile card styles
- `.box_text` - Hover overlay effect
- `.box_btn` - Button styles
- `.BraceTeeth` - Information boxes
- Color scheme: #00ce7c (primary green), #00e467 (hover green)

### Hover Effects (Desktop)

Matches the exact hover behavior from aligner.vue:
- Boxes scale up on hover (1.2x)
- Other boxes shrink (0.9x)
- Overlay appears with description and button
- Smooth transitions

### Mobile Responsive

- Desktop: Side-by-side hoverable boxes
- Mobile: Stacked cards with full descriptions visible
- Breakpoint: 850px (same as aligner.vue)

## Navigation

### Language Switching
- Click **中文** button → navigates to `index.html` (Chinese)
- Click **EN** button → navigates to `index-en.html` (English)

### "Start Analysis" Button
All "Start AI Analysis" buttons link to `../app.html` (the teeth straightener analysis tool)

### "Book Consultation" Button
Shows an alert (can be customized to link to booking system or WhatsApp)

## Updating Content

### To update Chinese text:
Edit `index.html` directly. All text is static HTML.

### To update English text:
Edit `index-en.html` directly. All text is static HTML.

### To update styling:
- **Chinese styling**: Edit `style.css`
- **English styling**: Edit `style-en.css`

Each file is independent, making it easy to optimize layout for each language.

## Design Philosophy

**Separate pages > Forced single layout**

Instead of trying to fit English and Chinese into the same layout with CSS hacks:
- Chinese page uses Chinese-optimized font sizes and spacing
- English page uses English-optimized font sizes and spacing
- No language-specific CSS overrides needed
- Cleaner code, better user experience

## Fonts

Uses the Comfortaa Regular font from the `/Font/` folder:
- `Comfortaa-Regular.ttf` - Main body font
- `Omnium-ExtraBold.otf` - Available for headings
- `Omnium-Bold.otf` - Available for emphasis

## Responsive Breakpoints

Matching aligner.vue:
- Large screens: > 1024px
- Tablets: 850px - 1024px
- Mobile: < 850px
- Small mobile: < 480px

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome

## Development

### Local Testing

```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using the project's dev server
cd .. && npm run dev
```

### Production Build

The landing pages are static HTML/CSS/JS and work with the existing Vite setup.

## Integration

Entry point flow:
1. User visits site → `../index.html` redirects to `landing/index.html` (Chinese)
2. User clicks language switcher → navigates to `landing/index-en.html` (English)
3. User clicks "Start AI Analysis" → redirects to `../app.html`
4. User uses the teeth straightener analysis tool

## Notes

- Each language has its own optimized page for the best user experience
- No translation attributes or complex language switching logic
- Clean, maintainable code
- Perfect text fitting in all sections
- Fully responsive with the same design as aligner.vue
