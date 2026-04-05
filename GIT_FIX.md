# Git Push Fix Guide

## Issue: Git Push Rejected
```
! [rejected] main -> main (fetch first)  
error: failed to push some refs
```

## Cause
- You're in backend directory instead of root
- Remote has changes you don't have locally
- Need to pull remote changes first

## Solution: Step by Step

### Step 1: Go to Root Directory
```bash
cd D:\Projects\VoteOn
# NOT: D:\Projects\VoteOn\backend
```

### Step 2: Pull Remote Changes
```bash
git pull origin main
```

### Step 3: Add Your New Files
```bash
git add main.py
git add RENDER_QUICK_FIX.md
git add runtime.txt
git add Procfile
```

### Step 4: Commit Changes
```bash
git commit -m "Add root main.py wrapper and deployment fixes for Render"
```

### Step 5: Push to GitHub
```bash
git push origin main
```

## If There Are Merge Conflicts

If step 2 shows conflicts:
```bash
# Open the conflicted files
# Look for <<<<<<< HEAD and >>>>>>> marks
# Edit to keep what you want
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## Alternative: Force Push (Use Carefully)
Only if you're sure you want to overwrite remote:
```bash
git push --force-with-lease origin main
```

**Try the pull method first!** 🚀