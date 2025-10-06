import React, { useEffect, useState, useRef } from "react";

export default function App() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alternateArts, setAlternateArts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ set: "", type: "", rarity: "" });

  const colors = [
    { key: 'w', label: 'White', symbol: 'https://svgs.scryfall.io/card-symbols/W.svg' },
    { key: 'u', label: 'Blue', symbol: 'https://svgs.scryfall.io/card-symbols/U.svg' },
    { key: 'b', label: 'Black', symbol: 'https://svgs.scryfall.io/card-symbols/B.svg' },
    { key: 'r', label: 'Red', symbol: 'https://svgs.scryfall.io/card-symbols/R.svg' },
    { key: 'g', label: 'Green', symbol: 'https://svgs.scryfall.io/card-symbols/G.svg' },
    { key: 'c', label: 'Colorless', symbol: 'https://svgs.scryfall.io/card-symbols/C.svg' }
  ];

  const rarities = ["common", "uncommon", "rare", "mythic"];

  const cardRef = useRef(null);

  async function fetchCardById(id) {
    setLoading(true);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/${id}`);
      const data = await res.json();
      setCard(data);
      setRecent((r) => [data, ...r.filter((c) => c.id !== data.id)].slice(0, 10));
      if (data.prints_search_uri) {
        const printsRes = await fetch(data.prints_search_uri);
        const prints = await printsRes.json();
        const arts = (prints.data || []).filter((p) => p.image_uris).map((p) => ({ id: p.id, image: p.image_uris.small }));
        setAlternateArts(arts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRandom(color) {
    setLoading(true);
    try {
      let url = "https://api.scryfall.com/cards/random";
      if (color) url += `?q=color:${color}`;
      const res = await fetch(url);
      const data = await res.json();
      await fetchCardById(data.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function searchCard() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      let q = query.trim();
      if (filters.set) q += ` set:${filters.set}`;
      if (filters.type) q += ` type:${filters.type}`;
      if (filters.rarity) q += ` rarity:${filters.rarity}`;
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        await fetchCardById(data.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>MTG Card Generator</h1>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search for a card..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
        />
        <button onClick={searchCard} style={styles.searchButton}>Search</button>
        <select value={filters.set} onChange={(e) => setFilters({ ...filters, set: e.target.value })} style={styles.select}>
          <option value="">All Sets</option>
          <option value="eld">Throne of Eldraine</option>
          <option value="khm">Kaldheim</option>
          <option value="iko">Ikoria</option>
          <option value="mom">March of the Machine</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} style={styles.select}>
          <option value="">All Types</option>
          <option value="creature">Creature</option>
          <option value="instant">Instant</option>
          <option value="sorcery">Sorcery</option>
          <option value="enchantment">Enchantment</option>
          <option value="artifact">Artifact</option>
          <option value="planeswalker">Planeswalker</option>
          <option value="land">Land</option>
        </select>
        <select value={filters.rarity} onChange={(e) => setFilters({ ...filters, rarity: e.target.value })} style={styles.select}>
          <option value="">All Rarities</option>
          {rarities.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={styles.colorRow}>
        {colors.map((c) => (
          <button key={c.key} onClick={() => { setSelectedColor(c.key); fetchRandom(c.key); }} style={{ ...styles.colorButton, border: selectedColor === c.key ? '2px solid white' : 'none' }}>
            <img src={c.symbol} alt={c.label} style={{ width: 24, height: 24 }} />
          </button>
        ))}
      </div>

      <button onClick={() => fetchRandom()} style={styles.randomButton}>Random Card</button>

      <div ref={cardRef} style={styles.cardContainer}>
        {loading ? <p>Loading...</p> : card ? (
          <img src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal} alt={card.name} style={styles.cardImage} />
        ) : <p>No card loaded</p>}
      </div>

      {alternateArts.length > 0 && (
        <div style={styles.altArtSection}>
          <h3>Alternate Arts</h3>
          <div style={styles.altArtRow}>
            {alternateArts.map((a) => (
              <img key={a.id} src={a.image} alt="alt art" style={styles.altArtThumb} onClick={() => fetchCardById(a.id)} />
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div style={styles.recentSection}>
          <h3>Recently Viewed</h3>
          <div style={styles.altArtRow}>
            {recent.map((r) => (
              <img key={r.id} src={r.image_uris?.small || r.card_faces?.[0]?.image_uris?.small} alt={r.name} style={styles.altArtThumb} onClick={() => fetchCardById(r.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: 'linear-gradient(180deg, #061021, #081224)',
    color: 'white',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20
  },
  title: { fontSize: 24, marginBottom: 10 },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    padding: 8,
    borderRadius: 6,
    border: '1px solid #444',
    background: '#0f1724',
    color: 'white',
  },
  searchButton: {
    padding: '8px 16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  select: {
    padding: 8,
    borderRadius: 6,
    border: '1px solid #444',
    background: '#1e293b',
    color: 'white',
  },
  colorRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  colorButton: {
    background: '#0f1724',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
  },
  randomButton: {
    padding: '10px 20px',
    background: '#1e293b',
    color: 'white',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  cardContainer: {
    width: 320,
    height: 448,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    perspective: 1000,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 12,
    boxShadow: '0 18px 40px rgba(0,0,0,0.6)',
    transition: 'transform 0.6s ease',
  },
  altArtSection: {
    marginTop: 20,
    width: '90%',
    maxWidth: 500,
  },
  recentSection: {
    marginTop: 20,
    width: '90%',
    maxWidth: 500,
  },
  altArtRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  altArtThumb: {
    width: 72,
    height: 100,
    objectFit: 'cover',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
};
