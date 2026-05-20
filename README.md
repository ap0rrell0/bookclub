# 📚 Book Club Reading List

A mobile-first web app to track your book club reading list. Search books via Google Books, import from Goodreads, and keep track of what your club has read together.

## Features
- 🔍 Search books via Google Books API (auto-fills title, author, genre, cover)
- 📥 Import your library from a Goodreads CSV export
- 📚 Mark books as "Read with Book Club" with a meeting date
- ⭐ Rate and add notes to every book
- 🎨 18 genres with color-coded tags
- 💾 Data saved locally in your browser (localStorage)
- 📱 Mobile-optimized for iPhone & Android

## Local Development

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Deploy to Vercel via GitHub

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bookclub.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `bookclub` repository
4. Vercel auto-detects Vite — click **Deploy**
5. Done! Your app is live at `https://bookclub-xxx.vercel.app`

> **Note:** Data is stored in each user's browser localStorage — perfect for personal use. Each device keeps its own list.

## Tech Stack
- React 18
- Vite 5
- Google Books API (free, no key needed)
- localStorage for persistence
