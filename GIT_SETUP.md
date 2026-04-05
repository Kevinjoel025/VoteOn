# Git Repository Setup Fix

## Issue: "fatal: not a git repository"
The git repository is not initialized in D:\Projects\VoteOn

## Solution: Initialize Git Repository

### Step 1: Check if .git exists elsewhere
```bash
# Check if git is in backend folder
dir D:\Projects\VoteOn\backend\.git

# Or check root
dir D:\Projects\VoteOn\.git
```

### Step 2: Initialize Git in Root Directory
```bash
cd D:\Projects\VoteOn
git init
```

### Step 3: Add Remote Repository
```bash
git remote add origin https://github.com/Kevinjoel025/VoteOn.git
```

### Step 4: Add and Commit All Files
```bash
git add .
git commit -m "Initial commit with complete VoteOn backend and frontend"
```

### Step 5: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## If Repository Already Exists on GitHub

If you already have files on GitHub:

```bash
cd D:\Projects\VoteOn
git clone https://github.com/Kevinjoel025/VoteOn.git temp_repo
xcopy temp_repo\.git .\ /E /H
rmdir /s temp_repo
git add .
git commit -m "Update with all files"
git push origin main
```