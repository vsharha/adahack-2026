# Optiver Screenshot Capture Guide

**Purpose:** Add 4 screenshots to README for judge presentation

---

## 📸 Required Screenshots

| # | Name | File | Dimensions | What to Show |
|---|------|------|------------|--------------|
| 1 | Hero Section | `screenshot-hero.png` | 1920×1080 | Top of page: title, key metrics, correlation toggle |
| 2 | Portfolio Comparison | `screenshot-comparison.png` | 1920×1080 | Bar chart with 3 portfolios |
| 3 | Holdings Table | `screenshot-holdings.png` | 1920×1080 | Table with search box, filtered results |
| 4 | Map | `screenshot-map.png` | 1920×1080 | World map with project circles |

---

## 🎯 Capture Steps

### 1. Prepare the App

```bash
# Start the app
cd /home/bugra2426/Downloads/adahack-2026
./apps/optiver/start.sh

# Open browser
# http://localhost:3000
```

### 2. Set Up Browser

```
1. Open Chrome DevTools (F12)
2. Set to desktop mode (toggle device toolbar OFF)
3. Set zoom to 100%
4. Set window width to 1920px
5. Turn on dark mode (optional, looks professional)
```

### 3. Capture Each Screenshot

**Method A: Full Page Screenshot (Chrome DevTools)**
```
1. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
2. Type "screenshot"
3. Select "Capture full size screenshot"
4. Save to docs/optiver/
```

**Method B: Screenshot Tool (Linux)**
```bash
# Select area
gnome-screenshot -a -f ~/Downloads/screenshot.png

# Or use Flameshot (recommended)
flameshot gui
```

**Method C: Browser Extension**
- Use "GoFullPage" or "Nimbus Screenshot" extension
- Capture entire page or selected area

---

## 📐 Composition Tips

### Hero Section
- Show full width
- Include AdaHack badge
- Show correlation toggle visible
- Capture key metrics cards at bottom

### Portfolio Comparison
- Scroll to chart section
- Show all 3 bars clearly
- Include legend
- Show correlation selector visible

### Holdings Table
- Type "China" in search box (shows filtering)
- Show 5 filtered results
- Include sort/filter controls
- Show project count badge

### Map
- Scroll to map section
- Show all country circles
- Zoom to fit all markers
- Include legend if visible

---

## 🎨 Styling Recommendations

**For Professional Look:**
- Use dark mode (more striking for charts)
- Ensure no browser UI visible (address bar, tabs)
- Clean background (no other windows)
- Good contrast (check accessibility)

**For Consistency:**
- Same zoom level (100%)
- Same window width (1920px)
- Same theme (all light or all dark)
- Similar vertical spacing

---

## 📁 File Management

```bash
# Save location
cd /home/bugra2426/Downloads/adahack-2026/docs/optiver/

# Naming convention
screenshot-hero.png
screenshot-comparison.png
screenshot-holdings.png
screenshot-map.png

# Optimize (optional)
pngquant --quality=65-80 screenshot-hero.png
```

---

## ✅ After Capture

1. **Test images load:**
   ```bash
   # From repo root
   cat apps/optiver/README.md | grep screenshot
   ```

2. **Commit:**
   ```bash
   git add docs/optiver/screenshot-*.png apps/optiver/README.md
   git commit -m "Add README screenshots for judge presentation"
   git push
   ```

3. **Verify on GitHub:**
   - Open repo on github.com
   - Check README renders correctly
   - Images load properly

---

## 🚀 Quick Alternative (5 min)

If short on time, capture **just one** hero screenshot:

```bash
# Full page capture
# Save as docs/optiver/screenshot.png
# Update README to reference single image
```

Update README section to:
```markdown
## Demo Screenshot

![Optiver Dashboard](../../docs/optiver/screenshot.png)
_Dashboard showing portfolio comparison, diversification breakdown, and risk metrics_
```

---

**Time estimate:** 15-20 minutes for all 4 screenshots

*Guide generated: 2026-10-03*
