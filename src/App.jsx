import { useState, useEffect, useRef, useCallback } from "react";

const INITIAL_BOOKS = [
  { id: 16, title: "The Locked Door", author: "Freida McFadden", genre: "Psychological Thriller", status: "Currently Reading", rating: null, notes: "", cover: "" },
  { id: 15, title: "The Handmaid's Tale", author: "Margaret Atwood", genre: "Dystopian Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 14, title: "Secret Santa", author: "Laura Dave", genre: "Psychological Thriller", status: "Read", rating: null, notes: "", cover: "" },
  { id: 13, title: "Mi Isla", author: "Elisabet Benavent", genre: "Contemporary Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 12, title: "Pídeme lo que quieras", author: "Megan Maxwell", genre: "Erotic Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 11, title: "The Maid", author: "Nita Prose", genre: "Cozy Mystery", status: "Read", rating: null, notes: "", cover: "" },
  { id: 10, title: "46335", author: "Colleen Hoover", genre: "New Adult Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 9, title: "Lessons in Chemistry", author: "Bonnie Garmus", genre: "Historical Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 8, title: "Happy Place", author: "Emily Henry", genre: "Contemporary Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 7, title: "Un Cuento Perfecto", author: "Elisabet Benavent", genre: "Contemporary Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 6, title: "The Four Winds", author: "Kristin Hannah", genre: "Historical Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 5, title: "The Nightingale", author: "Kristin Hannah", genre: "Historical Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 4, title: "One True Loves", author: "Taylor Jenkins Reid", genre: "Contemporary Romance", status: "Read", rating: null, notes: "", cover: "" },
  { id: 3, title: "Daisy Jones and the Six", author: "Taylor Jenkins Reid", genre: "Historical Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 2, title: "Carrie Soto Is Back", author: "Taylor Jenkins Reid", genre: "Contemporary Fiction", status: "Read", rating: null, notes: "", cover: "" },
  { id: 1, title: "Maybe in Another Life", author: "Taylor Jenkins Reid", genre: "Contemporary Romance", status: "Read", rating: null, notes: "", cover: "" },
];

const GENRES = [
  "Psychological Thriller","Thriller","Mystery","Cozy Mystery",
  "Dystopian Fiction","Science Fiction","Fantasy","Historical Fiction",
  "Contemporary Fiction","Contemporary Romance","Historical Romance",
  "Erotic Romance","New Adult Romance","Literary Fiction",
  "Women's Fiction","Suspense","Horror","Other"
];
const STATUSES = ["Read","Currently Reading","To Read","Did Not Finish"];

const GOODREADS_STATUS_MAP = {
  "read": "Read",
  "currently-reading": "Currently Reading",
  "to-read": "To Read",
};

const genreColors = {
  "Psychological Thriller":"#b83232","Thriller":"#c8453a","Mystery":"#7a4a2a",
  "Cozy Mystery":"#c17f3b","Dystopian Fiction":"#4a4a7a","Science Fiction":"#2a5fa8",
  "Fantasy":"#6a3abf","Historical Fiction":"#8a5c30","Contemporary Fiction":"#3d7a60",
  "Contemporary Romance":"#c45c8a","Historical Romance":"#a04060","Erotic Romance":"#d4357a",
  "New Adult Romance":"#e07090","Literary Fiction":"#2a6fa8","Women's Fiction":"#b05090",
  "Suspense":"#8a3a3a","Horror":"#3a1a1a","Other":"#888",
};

// ─── Map Google Books categories + description → our genres ───────────────
function mapGoogleGenre(cats = [], description = "", title = "") {
  // Combine all signals into one searchable string
  const joined = [...cats, description.slice(0, 400), title].join(" ").toLowerCase();

  // Most specific matches first
  if (joined.includes("psychological thriller") || joined.includes("psychological suspense")) return "Psychological Thriller";
  if (joined.includes("cozy mystery") || joined.includes("cosy mystery")) return "Cozy Mystery";
  if ((joined.includes("mystery") || joined.includes("whodunit")) && !joined.includes("thriller")) return "Mystery";
  if (joined.includes("thriller")) return "Thriller";
  if (joined.includes("dystop")) return "Dystopian Fiction";
  if (joined.includes("science fiction") || joined.includes("sci-fi") || joined.includes("scifi")) return "Science Fiction";
  if (joined.includes("horror") || joined.includes("supernatural terror")) return "Horror";
  if (joined.includes("suspense")) return "Suspense";
  if (joined.includes("historical fiction") || joined.includes("historical novel") || (joined.includes("histor") && joined.includes("war"))) return "Historical Fiction";
  if (joined.includes("historical romance")) return "Historical Romance";
  if (joined.includes("erotica") || joined.includes("erotic romance")) return "Erotic Romance";
  if (joined.includes("new adult")) return "New Adult Romance";
  if (joined.includes("romance") && joined.includes("histor")) return "Historical Romance";
  if (joined.includes("romance") || joined.includes("love story") || joined.includes("falling in love")) return "Contemporary Romance";
  if (joined.includes("fantasy")) return "Fantasy";
  if (joined.includes("histor")) return "Historical Fiction";
  if (joined.includes("literary fiction") || joined.includes("literary novel")) return "Literary Fiction";
  if (joined.includes("women's fiction") || joined.includes("chick lit") || joined.includes("women's lit")) return "Women's Fiction";
  if (joined.includes("fiction")) return "Contemporary Fiction";
  return "Other";
}

// ─── Google Books search ───────────────────────────────────────────────────
async function searchGoogleBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.items || []).map(item => {
    const v = item.volumeInfo || {};
    const cats = v.categories || [];
    const description = v.description || "";
    const title = v.title || "";
    return {
      googleId: item.id,
      title,
      author: (v.authors || []).join(", "),
      genre: mapGoogleGenre(cats, description, title),
      rawCategories: cats, // keep original for display
      cover: (() => {
        const links = v.imageLinks || {};
        const raw = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail || "";
        return raw
          .replace("http://", "https://")
          .replace("&zoom=1", "&zoom=2")
          .replace("&edge=curl", "");
      })(),
      description,
      pageCount: v.pageCount || null,
      publishedDate: v.publishedDate || "",
    };
  });
}

// ─── Map Goodreads shelf names → our genres ────────────────────────────────
function mapGoodreadsShelfGenre(shelves) {
  const s = (shelves || "").toLowerCase();
  if (s.includes("psychological-thriller") || s.includes("psychological thriller")) return "Psychological Thriller";
  if (s.includes("cozy-mystery") || s.includes("cozy mystery")) return "Cozy Mystery";
  if (s.includes("mystery")) return "Mystery";
  if (s.includes("thriller")) return "Thriller";
  if (s.includes("dystopia") || s.includes("dystopian")) return "Dystopian Fiction";
  if (s.includes("science-fiction") || s.includes("sci-fi") || s.includes("scifi")) return "Science Fiction";
  if (s.includes("horror")) return "Horror";
  if (s.includes("historical-romance")) return "Historical Romance";
  if (s.includes("historical")) return "Historical Fiction";
  if (s.includes("erotica") || s.includes("erotic")) return "Erotic Romance";
  if (s.includes("new-adult") || s.includes("new adult")) return "New Adult Romance";
  if (s.includes("romance")) return "Contemporary Romance";
  if (s.includes("literary")) return "Literary Fiction";
  if (s.includes("women") || s.includes("chick-lit")) return "Women's Fiction";
  if (s.includes("suspense")) return "Suspense";
  if (s.includes("fantasy")) return "Fantasy";
  if (s.includes("fiction")) return "Contemporary Fiction";
  return "";
}

// ─── Goodreads CSV parser ──────────────────────────────────────────────────
function parseGoodreadsCSV(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  function splitCSVRow(line) {
    const cols = []; let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQuote && line[i+1] === '"') { cur += '"'; i++; } else inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim()); return cols;
  }

  const headerIdx = lines.findIndex(l => l.trim().length > 0);
  if (headerIdx < 0) return [];
  const headers = splitCSVRow(lines[headerIdx]).map(h => h.replace(/"/g,"").trim().toLowerCase());
  const idx = (name) => headers.findIndex(h => h.includes(name));

  const iTitle    = idx("title");
  const iAuthor   = idx("author");
  const iShelf    = idx("exclusive shelf");
  const iRating   = idx("my rating");
  const iShelves  = idx("bookshelves");
  const iDateRead = idx("date read");

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitCSVRow(line);
    const clean = (n) => n >= 0 ? (cols[n] || "").replace(/^"|"$/g,"").trim() : "";
    const title = clean(iTitle);
    if (!title || title.toLowerCase() === "title") continue;
    const shelf = clean(iShelf);
    const allShelves = clean(iShelves) + " " + shelf;
    const rawRating = parseInt(clean(iRating)) || null;
    const rawAuthor = clean(iAuthor);
    const author = rawAuthor.replace(/^([^,]+),\s*(.+)$/, "$2 $1");
    rows.push({
      title, author,
      status: GOODREADS_STATUS_MAP[shelf] || "To Read",
      rating: rawRating && rawRating > 0 ? rawRating : null,
      genre: mapGoodreadsShelfGenre(allShelves) || "Other",
      cover: "", notes: "",
      readWithBookClub: false,
      dateRead: clean(iDateRead) || "",
    });
  }
  return rows;
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          style={{ fontSize: 24, cursor: "pointer", color: star <= (hovered ?? value ?? 0) ? "#f5a623" : "#ddd", transition: "color 0.15s", userSelect: "none" }}
        >★</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    "Read": { bg: "#e6f4ea", text: "#2d7a3a", border: "#b7dfc0" },
    "Currently Reading": { bg: "#fff3e0", text: "#b85c00", border: "#ffcc80" },
    "To Read": { bg: "#e8eaf6", text: "#3949ab", border: "#c5cae9" },
    "Did Not Finish": { bg: "#fce4ec", text: "#c62828", border: "#f48fb1" },
  };
  const c = colors[status] || colors["To Read"];
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ─── Google Books Search Panel ─────────────────────────────────────────────
function BookSearchPanel({ onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  const doSearch = useCallback(async (query) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true); setError("");
    try {
      const res = await searchGoogleBooks(query);
      setResults(res);
      if (res.length === 0) setError("No books found. Try a different title.");
    } catch { setError("Search failed. Check your connection."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(q), 500);
  }, [q, doSearch]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search Google Books by title or author…"
          style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "#fafafa" }}
        />
        {loading && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#aaa" }}>⏳</span>}
      </div>
      {error && <div style={{ fontSize: 12, color: "#c00", marginBottom: 8, textAlign: "center" }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {results.map((r, i) => (
          <div key={i} onClick={() => onSelect(r)}
            style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1.5px solid #ede8ff", background: "#fff", cursor: "pointer", alignItems: "center", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background="#f5f0ff"}
            onMouseLeave={e => e.currentTarget.style.background="#fff"}
          >
            {r.cover
              ? <img src={r.cover} alt="" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
              : null
            }
            <div style={{ width: 36, height: 52, borderRadius: 4, background: "#ede8ff", flexShrink: 0, display: r.cover ? "none" : "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Playfair Display', serif", color: "#1a0a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{r.author}{r.publishedDate ? ` · ${r.publishedDate.slice(0,4)}` : ""}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: genreColors[r.genre] || "#888", fontWeight: 700, background: (genreColors[r.genre]||"#888")+"18", padding:"1px 6px", borderRadius:6 }}>{r.genre}</span>
                {r.rawCategories && r.rawCategories.length > 0 && r.rawCategories[0] !== r.genre && (
                  <span style={{ fontSize: 10, color: "#999", background: "#f0f0f0", padding:"1px 6px", borderRadius:6 }}>📖 {r.rawCategories[0]}</span>
                )}
              </div>
            </div>
            <span style={{ fontSize: 18, color: "#7c3aed", flexShrink: 0 }}>＋</span>
          </div>
        ))}
      </div>
      {results.length === 0 && !loading && !error && q.length === 0 && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "30px 0", fontSize: 13 }}>
          <div style={{ fontSize: 32 }}>📚</div>
          <div style={{ marginTop: 8 }}>Type to search millions of books</div>
        </div>
      )}
    </div>
  );
}

// ─── Book Modal ────────────────────────────────────────────────────────────
function BookModal({ book, onSave, onClose, onDelete, isNew }) {
  const [form, setForm] = useState(book);
  const [tab, setTab] = useState(isNew ? "search" : "manual");
  const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSelectFromSearch = (result) => {
    setForm(f => ({
      ...f,
      title: result.title,
      author: result.author,
      genre: result.genre,
      cover: result.cover,
      notes: result.description ? result.description.slice(0, 200) + (result.description.length > 200 ? "…" : "") : f.notes,
    }));
    setTab("manual");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,10,30,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", padding: "24px 20px 44px", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontFamily: "'Playfair Display', serif", color: "#1a0a2e" }}>
            {isNew ? "Add New Book" : "Edit Book"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        {/* Tabs (only for new books) */}
        {isNew && (
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 12, overflow: "hidden", border: "1.5px solid #ede8ff" }}>
            {[["search", "🔍 Search Books"], ["manual", "✏️ Enter Manually"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "10px 0", border: "none", background: tab === key ? "#4a1a8a" : "#fff", color: tab === key ? "#fff" : "#666", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Search Tab */}
        {tab === "search" && isNew && (
          <>
            <BookSearchPanel onSelect={handleSelectFromSearch} />
            {(form.title) && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#f5f0ff", borderRadius: 10, fontSize: 13, color: "#4a1a8a", fontWeight: 600 }}>
                ✓ Selected: <em>{form.title}</em> — tap "Enter Manually" to edit details
              </div>
            )}
          </>
        )}

        {/* Manual / Edit Tab */}
        {tab === "manual" && (
          <>
            {/* Cover preview */}
            {form.cover && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <img src={form.cover} alt="" style={{ height: 90, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
              </div>
            )}

            {[{ label: "Title", field: "title" }, { label: "Author", field: "author" }].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
                <input value={form[field] || ""} onChange={e => handleChange(field, e.target.value)}
                  style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "#fafafa" }} />
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Genre</label>
              <select value={form.genre || ""} onChange={e => handleChange("genre", e.target.value)}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, background: "#fafafa", outline: "none", boxSizing: "border-box" }}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Status</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleChange("status", s)}
                    style={{ padding: "7px 13px", borderRadius: 20, border: "1.5px solid", borderColor: form.status === s ? "#4a1a8a" : "#e0e0e0", background: form.status === s ? "#4a1a8a" : "#fff", color: form.status === s ? "#fff" : "#555", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Rating</label>
              <StarRating value={form.rating} onChange={val => handleChange("rating", val)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Notes</label>
              <textarea value={form.notes || ""} onChange={e => handleChange("notes", e.target.value)} rows={3} placeholder="Your thoughts on this book…"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", background: "#fafafa", outline: "none" }} />
            </div>

            {/* Book Club Toggle */}
            <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, border: "1.5px solid", borderColor: form.readWithBookClub ? "#7c3aed" : "#e8e0ff", background: form.readWithBookClub ? "#f5f0ff" : "#fafafa", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: form.readWithBookClub ? "#4a1a8a" : "#555" }}>📚 Read with Book Club</div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Mark this as a book club selection</div>
                </div>
                <div onClick={() => handleChange("readWithBookClub", !form.readWithBookClub)}
                  style={{ width: 44, height: 26, borderRadius: 13, background: form.readWithBookClub ? "#7c3aed" : "#ddd", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: form.readWithBookClub ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                </div>
              </div>
              {form.readWithBookClub && (
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9a70d0", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Book Club Meeting Date</label>
                  <input type="date" value={form.bookClubDate || ""} onChange={e => handleChange("bookClubDate", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #c4a8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "#fff" }} />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 9 }}>
              {!isNew && (
                <button onClick={() => onDelete(book.id)}
                  style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #ffcccc", background: "#fff5f5", color: "#c62828", fontSize: 14, fontWeight: 700, cursor: "pointer", width: 50, flexShrink: 0 }}>
                  🗑
                </button>
              )}
              <button onClick={() => onSave(form)}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4a1a8a, #7c3aed)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(74,26,138,0.3)" }}>
                {isNew ? "Add Book" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CSV Import Modal ──────────────────────────────────────────────────────
function CSVImportModal({ onImport, onClose }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const books = parseGoodreadsCSV(ev.target.result);
        if (books.length === 0) { setError("No books found. Make sure this is a Goodreads export CSV."); return; }
        setPreview(books);
        setError("");
      } catch { setError("Could not parse this file. Please use a Goodreads export CSV."); }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    await onImport(preview);
    setImporting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(20,10,30,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", padding: "24px 20px 44px", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontFamily: "'Playfair Display', serif", color: "#1a0a2e" }}>Import from Goodreads</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        {/* Instructions */}
        <div style={{ background: "#f5f0ff", borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: "#3a1a6e", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>📥 How to export from Goodreads:</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            <li>Go to <strong>goodreads.com</strong> on a browser</li>
            <li>Click <strong>My Books</strong> → <strong>Import and Export</strong></li>
            <li>Click <strong>Export Library</strong></li>
            <li>Download the CSV file, then upload it below</li>
          </ol>
        </div>

        {!preview ? (
          <>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current.click()}
              style={{ width: "100%", padding: "18px 0", borderRadius: 14, border: "2px dashed #c4b0f0", background: "#faf8ff", color: "#4a1a8a", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
              📂 Choose Goodreads CSV File
            </button>
            {error && <div style={{ marginTop: 10, fontSize: 13, color: "#c62828", textAlign: "center" }}>{error}</div>}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 12, fontWeight: 700, color: "#2d7a3a", fontSize: 14 }}>
              ✓ Found <strong>{preview.length} books</strong> — preview:
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {preview.slice(0, 10).map((b, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: "#f9f9f9", fontSize: 12, marginBottom: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#1a0a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                      <div style={{ color: "#888", marginTop: 1 }}>{b.author}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: genreColors[b.genre] || "#888", background: (genreColors[b.genre]||"#888")+"18", padding: "1px 7px", borderRadius: 8 }}>{b.genre}</span>
                        {b.rating && <span style={{ fontSize: 10, color: "#f5a623", fontWeight: 700 }}>{"★".repeat(b.rating)}</span>}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
              {preview.length > 10 && (
                <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, padding: "6px 0" }}>…and {preview.length - 10} more</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 9 }}>
              <button onClick={() => setPreview(null)} style={{ padding: "13px 0", borderRadius: 12, border: "1.5px solid #e0d8f8", background: "#fff", color: "#666", fontSize: 14, fontWeight: 700, cursor: "pointer", width: 80, flexShrink: 0 }}>
                Back
              </button>
              <button onClick={handleImport} disabled={importing}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2d7a3a, #43a854)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: importing ? "default" : "pointer", opacity: importing ? 0.7 : 1 }}>
                {importing ? "Importing…" : `Import ${preview.length} Books`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────
function StatsBar({ books }) {
  const read = books.filter(b => b.status === "Read").length;
  const reading = books.filter(b => b.status === "Currently Reading").length;
  const toRead = books.filter(b => b.status === "To Read").length;
  const rated = books.filter(b => b.rating);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 0 2px", scrollbarWidth: "none" }}>
      {[
        { label: "Read", value: read, color: "#2d7a3a", bg: "#e6f4ea" },
        { label: "Reading", value: reading, color: "#b85c00", bg: "#fff3e0" },
        { label: "To Read", value: toRead, color: "#3949ab", bg: "#e8eaf6" },
        { label: "Avg ★", value: avgRating, color: "#b8860b", bg: "#fffde7" },
      ].map(({ label, value, color, bg }) => (
        <div key={label} style={{ background: bg, borderRadius: 12, padding: "10px 16px", minWidth: 72, textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Playfair Display', serif" }}>{value}</div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function BookClubApp() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showCSV, setShowCSV] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("number");
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  useEffect(() => {
    (async () => {
      try {
        const result = { value: localStorage.getItem("bookclub-books") };
        if (result && result.value) {
          const stored = JSON.parse(result.value);
          const OLD = new Set(["Thriller","Fantasy","Literary Fiction","Romance","Historical Fantasy","Mystery Thriller","Sci-Fi",""]);
          const correctGenres = Object.fromEntries(INITIAL_BOOKS.map(b => [b.id, b.genre]));
          const migrated = stored.map(b => ({ cover: "", ...b, genre: (!b.genre || OLD.has(b.genre)) && correctGenres[b.id] ? correctGenres[b.id] : b.genre }));
          setBooks(migrated);
        } else {
          setBooks(INITIAL_BOOKS);
        }
      } catch { setBooks(INITIAL_BOOKS); }
      setLoading(false);
    })();
  }, []);

  const saveTimeout = useRef(null);
  useEffect(() => {
    if (loading) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        localStorage.setItem("bookclub-books", JSON.stringify(books));
        setSaved(true); setTimeout(() => setSaved(false), 1800);
      } catch {}
    }, 600);
  }, [books, loading]);

  const handleSave = (form) => {
    setBooks(bs => {
      const exists = bs.find(b => b.id === form.id);
      if (exists) return bs.map(b => b.id === form.id ? form : b);
      const maxId = Math.max(0, ...bs.map(b => b.id));
      return [{ ...form, id: maxId + 1 }, ...bs];
    });
    setModal(null);
    showToast("📚 Book saved!");
  };

  const handleDelete = (id) => {
    if (confirm("Remove this book?")) {
      setBooks(bs => bs.filter(b => b.id !== id));
      setModal(null);
      showToast("🗑 Book removed");
    }
  };

  const handleCSVImport = async (imported) => {
    setBooks(bs => {
      const maxId = Math.max(0, ...bs.map(b => b.id));
      const existing = new Set(bs.map(b => b.title.toLowerCase().trim()));
      const newOnes = imported
        .filter(b => !existing.has(b.title.toLowerCase().trim()))
        .map((b, i) => ({ ...b, id: maxId + 1 + i }));
      return [...newOnes, ...bs];
    });
    setShowCSV(false);
    showToast(`✅ Imported ${imported.length} books from Goodreads!`);
  };

  const statuses = ["All", ...STATUSES];
  let filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });
  if (sortBy === "number") filtered = [...filtered].sort((a, b) => b.id - a.id);
  else if (sortBy === "title") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === "author") filtered = [...filtered].sort((a, b) => a.author.localeCompare(b.author));
  else if (sortBy === "rating") filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sortBy === "genre") filtered = [...filtered].sort((a, b) => (a.genre || "").localeCompare(b.genre || "") || a.title.localeCompare(b.title));

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f4ff" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>📚</div><div style={{ fontFamily: "'Playfair Display', serif", color: "#4a1a8a", marginTop: 12 }}>Loading…</div></div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f7f4ff 0%,#fdf6ff 60%,#f0f8ff 100%)", fontFamily: "'DM Sans', sans-serif", maxWidth: 520, margin: "0 auto", paddingBottom: 110 }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1a0a2e 0%,#3b1a6e 100%)", padding: "48px 24px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>📖 Book Club</div>
                <h1 style={{ margin: 0, fontSize: 28, fontFamily: "'Playfair Display', serif", color: "#fff", fontWeight: 800, lineHeight: 1.2 }}>Reading List</h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ fontSize: 11, color: saved ? "#a8f0c0" : "rgba(255,255,255,0.3)", fontWeight: 600, transition: "color 0.3s" }}>
                  {saved ? "✓ Saved" : `${books.length} books`}
                </div>
                <button onClick={() => setShowCSV(true)} style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  📥 Goodreads CSV
                </button>
              </div>
            </div>
            <div style={{ marginTop: 18 }}><StatsBar books={books} /></div>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ padding: "14px 14px 0" }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#aaa" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or author…"
              style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, border: "1.5px solid #e8e0ff", fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(74,26,138,0.07)" }} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid", borderColor: filterStatus === s ? "#4a1a8a" : "#e0d8f8", background: filterStatus === s ? "#4a1a8a" : "#fff", color: filterStatus === s ? "#fff" : "#666", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }}>
                {s === "Currently Reading" ? "Reading" : s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: "#bbb", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Sort:</span>
            {[["number","#"],["title","Title"],["author","Author"],["rating","★"],["genre","Genre"]].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)}
                style={{ padding: "4px 10px", borderRadius: 20, border: "1.5px solid", borderColor: sortBy === val ? "#7c3aed" : "#e0d8f8", background: sortBy === val ? "#f3eeff" : "transparent", color: sortBy === val ? "#7c3aed" : "#888", fontSize: 11, cursor: "pointer", fontWeight: 700, transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Book List */}
        <div style={{ padding: "8px 14px 0" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
              <div style={{ fontSize: 40 }}>📭</div>
              <div style={{ marginTop: 12, fontWeight: 600 }}>No books found</div>
            </div>
          )}
          {filtered.map((book, i) => (
            <div key={book.id} onClick={() => setModal({ book, isNew: false })}
              style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", marginBottom: 9, boxShadow: "0 2px 10px rgba(74,26,138,0.07)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: "1.5px solid rgba(74,26,138,0.07)", transition: "all 0.15s", animation: `fadeSlide 0.3s ease ${i * 0.025}s both` }}>
              {book.cover
                ? <img src={book.cover} alt="" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                    style={{ width: 38, height: 54, objectFit: "cover", borderRadius: 6, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
                : null
              }
              <div style={{ width: 38, height: 54, borderRadius: 6, background: book.status === "Currently Reading" ? "linear-gradient(135deg,#ff8c00,#ffb347)" : "linear-gradient(135deg,#4a1a8a,#7c3aed)", display: book.cover ? "none" : "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                {book.id}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a0a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Playfair Display', serif" }}>{book.title}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{book.author}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: genreColors[book.genre] || "#888", background: (genreColors[book.genre]||"#888")+"18", padding: "2px 7px", borderRadius: 8 }}>{book.genre}</span>
                  {book.readWithBookClub && <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#f0eaff", padding: "2px 7px", borderRadius: 8 }}>📚 Book Club</span>}
                  {book.rating && <span style={{ fontSize: 11, color: "#f5a623", fontWeight: 700 }}>{"★".repeat(book.rating)}</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}><StatusBadge status={book.status} /></div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <button onClick={() => setModal({ book: { id: null, title: "", author: "", genre: "Contemporary Fiction", status: "To Read", rating: null, notes: "", cover: "" }, isNew: true })}
          style={{ position: "fixed", bottom: 28, right: 20, width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#4a1a8a,#7c3aed)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", boxShadow: "0 6px 20px rgba(74,26,138,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          +
        </button>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#1a0a2e", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", whiteSpace: "nowrap", animation: "fadeSlide 0.3s ease" }}>
            {toast}
          </div>
        )}

        {modal && <BookModal book={modal.book} isNew={modal.isNew} onSave={handleSave} onDelete={handleDelete} onClose={() => setModal(null)} />}
        {showCSV && <CSVImportModal onImport={handleCSVImport} onClose={() => setShowCSV(false)} />}

        <style>{`
          @keyframes fadeSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          * { -webkit-tap-highlight-color: transparent; }
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </>
  );
}
