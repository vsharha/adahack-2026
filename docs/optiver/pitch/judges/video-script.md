# 2-Minute Demo Video Script

**Format:** Loom screen recording with voiceover  
**Length:** 2 minutes (strict)  
**Audience:** Judges who may watch asynchronously

---

## 🎬 Pre-Recording Setup (5 min)

```bash
# 1. Start the app
cd /home/bugra2426/Downloads/adahack-2026
./apps/optiver/start.sh

# 2. Open browser to http://localhost:3000

# 3. Set up recording
# - Install Loom (loom.com) or use OBS
# - Set to record: Screen + Webcam (optional) + Mic
# - Test audio levels

# 4. Prepare browser
# - Close all other tabs
# - Set to desktop view (1920×1080)
# - Turn on dark mode (looks professional)
# - Disable notifications
```

---

## 📽️ Recording Flow (2:00 total)

### 0:00-0:15 — Hook (15 sec)

**Visual:** Show homepage hero  
**Audio:**

> "What if I told you the cheapest carbon portfolio fails 32% of the time?  
> I'm [Your Name], and this is Optiver — our solution for the Optiver challenge."

---

### 0:15-0:45 — Problem & Solution (30 sec)

**Visual:** Scroll to portfolio comparison chart  
**Audio:**

> "Companies buy carbon offsets to meet sustainability goals. But projects fail —  
> wildfires, fraud, poor management.
>
> We compare three strategies:
>
> - Cheapest nominal: $94K but only 68% success rate
> - Cheapest expected: $115K, 85% success
> - Our diversified approach: $182K, 97-99% success
>
> Spending twice as much buys thirty percentage points higher reliability."

---

### 0:45-1:15 — Interactive Demo (30 sec)

**Visual:** Click correlation toggle (ρ=0 → 0.3 → 0.6)  
**Audio:**

> "This control switches between saved simulations with different shared-risk assumptions.
> Watch the modelled success rates update: 99.3%, 98.3%, 97%.
>
> We simulate 10,000 failure scenarios across different correlation strengths  
> to stress-test each portfolio."

---

### 1:15-1:40 — Full-group failure drill (25 sec)

**Visual:** Scroll to Shock check; select VCS, then China
**Audio:**

> "A hypothetical failure of every VCS project would leave 66,668 tonnes: below target.
> A full failure of the largest country group, China, leaves 108,336 tonnes: above target.
> This drill shows severity, not the probability of either event."

---

### 1:40-2:00 — Close (20 sec)

**Visual:** Scroll back to top, click Download PDF  
**Audio:**

> "All code is in this repo. Run `./apps/optiver/start.sh` to reproduce.  
> The judge summary has the full breakdown.
>
> Thank you — happy to take questions!"

**Visual:** Fade to black or show repo URL

---

## 🎯 Recording Tips

### Do's

- ✅ Speak clearly and slowly (nerves make you speed up)
- ✅ Pause briefly between sections
- ✅ Keep mouse movements smooth and deliberate
- ✅ Use a quiet room with no background noise
- ✅ Do 1-2 practice runs before recording

### Don'ts

- ❌ Don't read directly from script (sound natural)
- ❌ Don't rush (2 minutes is longer than you think)
- ❌ Don't show browser tabs, bookmarks, or notifications
- ❌ Don't apologize for mistakes (just re-record that section)

---

## 🎤 Audio Setup

**Best:** USB microphone (Blue Yeti, Audio-Technica)  
**Good:** Laptop mic in quiet room  
**Avoid:** Bluetooth headphones (latency issues)

**Test:** Record 10 seconds, play back, check for:

- Background noise
- Clarity
- Volume (not too quiet, not clipping)

---

## 🎬 Recording Tools

### Loom (Recommended)

- **Pros:** Easy, auto-uploads, shareable link
- **Cons:** Free tier has 5-min limit (perfect for us)
- **Setup:** Install Chrome extension, click record

### OBS Studio

- **Pros:** Free, unlimited, professional features
- **Cons:** More complex setup
- **Setup:** Screen capture + audio input, record to MP4

### QuickTime (Mac)

- **Pros:** Built-in, simple
- **Cons:** No webcam overlay, manual editing needed
- **Setup:** File → New Screen Recording

---

## 📁 File Management

**If using Loom:**

- Auto-uploads to cloud
- Share link: `loom.com/share/xxxxx`
- Download MP4 for backup

**If using OBS/QuickTime:**

- Save to: `docs/optiver/pitch/judges/demo-video.mp4`
- Upload to YouTube (unlisted) or Google Drive
- Add link to README

---

## ✅ Post-Recording Checklist

- [ ] Watch full video (check for errors)
- [ ] Verify audio is clear throughout
- [ ] Check video length (1:50-2:10 ideal)
- [ ] Upload to Loom/YouTube/Drive
- [ ] Add link to README:
  ```markdown
  ## Demo Video

  [Watch 2-min walkthrough](https://loom.com/share/xxxxx)
  ```
- [ ] Share link with teammates
- [ ] Backup copy locally

---

## 🚀 Backup Plan

**If recording fails:**

1. Use the written pitch script (`script.md`)
2. Show CLI output instead
3. Present live during judging

**Remember:** The demo video is **supplementary**, not required.  
Your live demo + pitch script are the main deliverables.

---

## 📊 Example Videos (For Reference)

Good demo video structure:

1. Hook (problem statement)
2. Show solution
3. Interactive demo
4. Call to action

Avoid:

- Long introductions
- Showing code
- Technical deep-dives
- Apologizing for bugs

---

**Time estimate:** 20 minutes total (5 min setup, 5 min practice, 10 min recording)

_Script generated: 2026-10-03 for AdaHack 2026_
