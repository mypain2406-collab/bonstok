const { useState, useEffect, useCallback, useRef } = React;

const API_BASE = window.API_BASE;

function fmtNum(n) {
  if (n === null || n === undefined || !isFinite(n)) return "-";
  return Number(n).toLocaleString("id-ID");
}

function fmtDate(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch (e) {
    return iso;
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
        <a href="#/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">Bon Persediaan</span>
        </a>
      </div>
    </header>
  );
}

const inputCls = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Card({ children, className }) {
  return <div className={"bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 " + (className || "")}>{children}</div>;
}

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const color = type === "error" ? "bg-red-600" : "bg-neutral-900";
  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 ${color} text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg z-50 max-w-[90vw]`}
      onClick={onClose}>
      {message}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return [toast, show];
}

// ---------------- Barcode helpers (rooms) ----------------
// Barcode ruangan berupa QR code yang berisi LINK langsung ke Bon Persediaan dengan
// ruangan sudah otomatis terisi (?rb=<kode>). Jadi cukup discan pakai kamera
// HP biasa (bukan harus dari dalam aplikasi) untuk langsung membuka halaman
// bon dengan ruangan sudah terisi.

function roomBarcodeUrl(barcode) {
  return `${window.location.origin}${window.location.pathname}?rb=${encodeURIComponent(barcode)}`;
}

// Kalau yang kescan/keketik ternyata link lengkap (?rb=KODE), ambil KODE-nya
// saja. Kalau bukan link, anggap itu memang kode barcode mentah.
function extractRoomBarcode(text) {
  if (!text) return text;
  try {
    const url = new URL(text);
    const rb = url.searchParams.get("rb");
    if (rb) return rb;
  } catch (e) {
    // bukan URL, pakai apa adanya
  }
  return text;
}

function roomQrDataUrl(barcode) {
  // Library QR-nya membuat data URL secara async (deteksi dukungan canvas
  // butuh satu tick), jadi di-bungkus Promise dengan polling singkat supaya
  // pasti dapat gambar sebelum dipakai buat cetak.
  return new Promise((resolve) => {
    try {
      const div = document.createElement("div");
      new window.QRCode(div, {
        text: roomBarcodeUrl(barcode),
        width: 220,
        height: 220,
        correctLevel: window.QRCode.CorrectLevel.M,
      });
      let tries = 0;
      const check = () => {
        const img = div.querySelector("img");
        if (img && img.src) {
          resolve(img.src);
        } else if (tries++ < 50) {
          setTimeout(check, 20);
        } else {
          resolve("");
        }
      };
      check();
    } catch (e) {
      resolve("");
    }
  });
}

async function printRoomBarcodes(rooms) {
  const win = window.open("", "_blank");
  if (!win) return;
  const qrUrls = await Promise.all(rooms.map((r) => roomQrDataUrl(r.barcode)));
  const cards = rooms.map((r, i) => `
    <div style="display:inline-block;border:1px solid #ccc;border-radius:10px;padding:14px;margin:8px;text-align:center;width:230px;vertical-align:top;">
      <div style="font-weight:700;font-size:14px;margin-bottom:8px;">${r.name}</div>
      <img src="${qrUrls[i]}" style="max-width:100%;" />
      <div style="font-size:10px;color:#999;margin-top:6px;word-break:break-all;">${roomBarcodeUrl(r.barcode)}</div>
    </div>`).join("");
  win.document.write(`<!DOCTYPE html><html><head><title>Barcode Ruangan - Bon Persediaan</title>
    <style>body{font-family:sans-serif;padding:16px;} @media print { body { padding: 0; } }</style>
    </head><body>${cards}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch (e) {} }, 350);
}

// ---------------- Barcode scanner modal (camera) ----------------

function ScannerModal({ onDetected, onClose, title, hint }) {
  const readerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let scanner = null;
    let stopped = false;
    try {
      scanner = new Html5Qrcode("bonstok-reader");
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().then(() => scanner.clear()).catch(() => {});
          onDetected(decodedText);
        },
        () => {}
      ).catch((err) => setError("Tidak bisa mengakses kamera: " + err));
    } catch (err) {
      setError("Kamera tidak tersedia di perangkat ini.");
    }
    return () => {
      if (scanner && !stopped) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-40" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">{title || "Scan Barcode"}</div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 text-sm font-bold">Tutup</button>
        </div>
        <div id="bonstok-reader" ref={readerRef}></div>
        {error && <div className="text-red-600 text-xs mt-3">{error}</div>}
        <div className="text-xs text-neutral-500 mt-3">{hint || "Arahkan kamera ke barcode."}</div>
      </div>
    </div>
  );
}

// Urutkan daftar barang: yang stoknya 0 (habis) ditaruh paling bawah, sisanya
// tetap dalam urutan aslinya (alfabetis, dari backend) karena Array.sort di JS
// stabil sejak ES2019.
function sortItemsByStock(items) {
    return [...items].sort((a, b) => {
          const aOut = (a.current_stock || 0) <= 0;
          const bOut = (b.current_stock || 0) <= 0;
          if (aOut === bOut) return 0;
          return aOut ? 1 : -1;
    });
}

// ---------------- Gudang (warehouse bon) — kiosk-style user flow ----------------

function GudangPage() {
  const [toast, showToast] = useToast();
  const now = useClock();
  const [requesterName, setRequesterName] = useState("");
  const [room, setRoom] = useState(null); // { id, name, barcode }
  const [showRoomScanner, setShowRoomScanner] = useState(false);
  const [roomQuery, setRoomQuery] = useState("");
  const [roomOptions, setRoomOptions] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [cart, setCart] = useState([]); // [{item_id, name, unit, qty, current_stock, photo}]
  const [itemQuery, setItemQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedBon, setSubmittedBon] = useState(null);

  const lookupRoomBarcode = async (raw) => {
    if (!raw) return;
    const code = extractRoomBarcode(String(raw).trim());
    try {
      const r = await fetch(`${API_BASE}/rooms/by-barcode/${encodeURIComponent(code)}`);
      if (!r.ok) {
        showToast("Ruangan dengan barcode itu tidak ditemukan", "error");
        return;
      }
      const rm = await r.json();
      setRoom(rm);
      showToast(`Ruangan: ${rm.name}`);
    } catch (err) {
      showToast("Gagal mencari ruangan", "error");
    }
  };

  // Kalau halaman dibuka lewat link dari barcode ruangan (?rb=KODE), yang
  // biasanya discan langsung pakai kamera HP, ruangan otomatis terisi tanpa
  // perlu scan ulang di dalam aplikasi.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rb = params.get("rb");
    if (rb) {
      lookupRoomBarcode(rb);
      const url = new URL(window.location.href);
      url.searchParams.delete("rb");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Satu pencarian ini dipakai untuk kode ruangan (hasil scan alat) MAUPUN
  // nama ruangan — backend sudah mencocokkan keduanya. Kalau kotak kosong,
  // tampilkan semua ruangan supaya dropdown-nya langsung terisi.
  const doSearchRoom = async (q) => {
    setRoomQuery(q);
    setLoadingRooms(true);
    try {
      const url = q ? `${API_BASE}/rooms?search=${encodeURIComponent(q)}` : `${API_BASE}/rooms`;
      const r = await fetch(url);
      const data = await r.json();
      setRoomOptions(data);
    } catch (err) {
      setRoomOptions([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Begitu halaman dibuka, langsung muat semua ruangan supaya dropdown
  // terisi tanpa harus mengetik apa-apa dulu.
  useEffect(() => {
    doSearchRoom("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kalau hasil scan/ketik pas Enter, langsung pilih ruangan yang paling
  // cocok (biasanya cuma ada 1 hasil kalau ketik/scan kode persis).
  const onRoomQueryKeyDown = (e) => {
    if (e.key === "Enter" && roomOptions.length > 0) {
      e.preventDefault();
      setRoom(roomOptions[0]);
    }
  };

  const onRoomSelectChange = (e) => {
    const rm = roomOptions.find((r) => r.id === e.target.value);
    if (rm) setRoom(rm);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item_id === item.id);
      if (existing) {
        return prev.map((c) => (c.item_id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item_id: item.id, name: item.name, unit: item.unit, qty: 1, current_stock: item.current_stock, photo: item.photo || null }];
    });
  };

  const doSearch = async (q) => {
    setItemQuery(q);
    setSearching(true);
    try {
      // Kalau kotak pencarian kosong, tetap tampilkan SEMUA barang persediaan
      // (bukan dikosongkan) supaya user bisa scroll lihat semua referensi barang.
      const url = q ? `${API_BASE}/items?search=${encodeURIComponent(q)}` : `${API_BASE}/items`;
      const r = await fetch(url);
      const data = await r.json();
      setSearchResults(sortItemsByStock(data));
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Begitu ruangan terisi (baik lewat scan QR, ketik kode, atau pilih dari
  // pencarian), langsung muat semua barang persediaan supaya listnya
  // terlihat tanpa harus mengetik apa-apa dulu.
  useEffect(() => {
    if (room) {
      doSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const updateQty = (item_id, qty) => {
    setCart((prev) => prev.map((c) => (c.item_id === item_id ? { ...c, qty: Math.max(1, qty) } : c)));
  };

  const removeFromCart = (item_id) => {
    setCart((prev) => prev.filter((c) => c.item_id !== item_id));
  };

  const submitBon = async () => {
    if (!requesterName.trim() || !room) {
      showToast("Isi nama peminta dan scan/pilih ruangan dulu", "error");
      return;
    }
    if (cart.length === 0) {
      showToast("Keranjang masih kosong", "error");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/bon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester_name: requesterName,
          room_id: room.id,
          room: room.name,
          items: cart.map((c) => ({ item_id: c.item_id, qty: c.qty })),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal mengajukan bon");
      }
      const bon = await r.json();
      setSubmittedBon(bon);
      setCart([]);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setSubmittedBon(null);
    setRequesterName("");
    setRoom(null);
    setCart([]);
    setSearchResults([]);
  };

  const tanggalStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const jamStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (submittedBon) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <div className="text-center">
            <div className="text-4xl">✅</div>
            <h1 className="text-2xl font-black mt-3">Bon Berhasil Diajukan</h1>
            <p className="text-neutral-600 mt-2">Menunggu persetujuan admin. Bon ini dicatat atas nama <b>{submittedBon.requester_name}</b> dari <b>{submittedBon.room}</b>.</p>
          </div>
          <ul className="mt-6 text-sm space-y-1 border-t border-neutral-100 pt-4">
            {submittedBon.items.map((line, i) => (
              <li key={i} className="flex justify-between border-b border-neutral-100 pb-1">
                <span>{line.item_name}</span>
                <span className="font-semibold">{fmtNum(line.qty)} {line.unit}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 mt-6">
            <a
              href={`${API_BASE}/bon/${submittedBon.id}/nota-dinas`}
              className="text-center bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700"
            >
              📄 Unduh Nota Dinas (Word)
            </a>
            <button onClick={startOver} className="border border-neutral-300 rounded-lg py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-neutral-50">
              Ajukan Bon Baru
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">📦 Gudang</div>
      <h1 className="text-3xl font-black tracking-tight mt-2">Ajukan Bon Barang</h1>
      <p className="text-neutral-600 mt-2">Scan barcode QR yang ditempel di ruangan pakai kamera HP — ruangan otomatis terisi. Lalu pilih barang lewat pencarian nama, dan ajukan bon untuk disetujui admin.</p>
      <p className="text-sm text-neutral-500 mt-2">{tanggalStr} — {jamStr}</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <Field label="Nama">
                <input className={inputCls} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Nama Anda" />
              </Field>

              <Field label="Ruangan / Unit Kerja">
                {room ? (
                  <div className="flex items-center justify-between bg-neutral-100 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-sm font-bold">{room.name}</div>
                      <div className="text-xs text-neutral-400">{room.barcode}</div>
                    </div>
<button onClick={() => { setRoom(null); doSearchRoom(""); }} className="text-xs font-bold uppercase underline">Ganti</button>
    </div>
    ) : (
      <div>
      <input
      className={inputCls}
        value={roomQuery}
          onChange={(e) => doSearchRoom(e.target.value)}
            onKeyDown={onRoomQueryKeyDown}
              placeholder="Scan/ketik kode ruangan, atau cari nama ruangan..."
                autoFocus
                  />
                  <select
                  className={`${inputCls} mt-2`}
value=""
  onChange={onRoomSelectChange}
    >
    <option value="">
  {loadingRooms ? "Memuat..." : roomOptions.length === 0 ? "Ruangan tidak ditemukan" : "-- Pilih ruangan --"}
</option>
{roomOptions.map((rm) => (
  <option key={rm.id} value={rm.id}>{rm.name} ({rm.barcode})</option>
  ))}
    </select>
    <button
    onClick={() => setShowRoomScanner(true)}
      className="mt-3 w-full border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase tracking-wider hover:bg-neutral-50"
        >
        📷 Scan Barcode Ruangan
        </button>
        </div>
        )}
          </Field>
          </div>
          </Card>

{room && (
  <Card>
  <Field label="Cari nama barang persediaan">
  <input
  className={inputCls}
    placeholder="Ketik nama barang, atau lihat semua di bawah..."
      value={itemQuery}
        onChange={(e) => doSearch(e.target.value)}
          autoFocus
            />
            </Field>
 {searching && <div className="text-xs text-neutral-400 mt-2">Mencari...</div>}
   <select
   className={`${inputCls} mt-2`}
 value=""
   onChange={(e) => {
     const it = searchResults.find((x) => x.id === e.target.value);
     if (it) { addToCart(it); showToast(`${it.name} ditambahkan`); }
   }}
     >
     <option value="">
   {searching ? "Memuat..." : searchResults.length === 0 ? "Tidak ada barang ditemukan" : "-- Pilih barang untuk ditambahkan --"}
</option>
{searchResults.map((it) => {
  const outOfStock = (it.current_stock || 0) <= 0;
  return (
    <option key={it.id} value={it.id}>
{it.name} — {outOfStock ? "Stok habis" : `Stok: ${fmtNum(it.current_stock)} ${it.unit}`}
</option>
  );
})}
  </select>
  </Card>
                              )}
        </div>

        <Card>
          <div className="font-bold mb-3">Keranjang Bon ({cart.length})</div>
          {cart.length === 0 && <div className="text-sm text-neutral-400">Belum ada barang. Cari nama barang untuk menambahkan.</div>}
          <div className="space-y-3">
            {cart.map((c) => (
              <div key={c.item_id} className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0">
          {c.photo ? (
            <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-lg object-cover border border-neutral-200 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300 text-xs flex-shrink-0">[img]</div>
              )}
                <div className="flex-1">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-neutral-400">Stok tersedia: {fmtNum(c.current_stock)} {c.unit}</div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={c.qty}
                  onChange={(e) => updateQty(c.item_id, Number(e.target.value))}
                  className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm text-center"
                />
                <button onClick={() => removeFromCart(c.item_id)} className="text-red-600 text-xs font-bold uppercase">Hapus</button>
              </div>
            ))}
          </div>
          <button
            onClick={submitBon}
            disabled={submitting}
            className="mt-5 w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Ajukan Bon"}
          </button>
        </Card>
      </div>

      {showRoomScanner && (
        <ScannerModal
          title="Scan Barcode Ruangan"
          hint="Arahkan kamera ke barcode yang ditempel di ruangan."
          onClose={() => setShowRoomScanner(false)}
          onDetected={(code) => { setShowRoomScanner(false); lookupRoomBarcode(code); }}
        />
      )}
      <Toast message={toast && toast.message} type={toast && toast.type} onClose={() => {}} />
    </div>
  );
}

// ---------------- Klinik (medicine stock) — login perawat ----------------

function useNurseToken() {
  const [token, setToken] = useState(localStorage.getItem("bonstok_nurse_token") || "");
  const save = (t) => { localStorage.setItem("bonstok_nurse_token", t); setToken(t); };
  const clear = () => { localStorage.removeItem("bonstok_nurse_token"); setToken(""); };
  return [token, save, clear];
}

function NurseLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/nurse/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) throw new Error("Password salah");
      const data = await r.json();
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">💊 Klinik</div>
      <h1 className="text-2xl font-black mt-2">Login Perawat</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Password">
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </Field>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={busy} className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50">
          {busy ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}

function KlinikPage({ token, onLogout }) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [toast, showToast] = useToast();
  const [medicines, setMedicines] = useState([]);
  const [nurseName, setNurseName] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [type, setType] = useState("keluar");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`${API_BASE}/medicines`, { headers: authHeaders });
    if (r.status === 401) {
      onLogout();
      return;
    }
    const data = await r.json();
    setMedicines(data);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!nurseName.trim() || !medicineId) {
      showToast("Isi nama perawat dan pilih obat dulu", "error");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/medicine-transactions`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ medicine_id: medicineId, type, qty: Number(qty), nurse_name: nurseName, note }),
      });
      if (r.status === 401) {
        onLogout();
        return;
      }
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal mencatat transaksi");
      }
      showToast("Stok obat berhasil diperbarui.");
      setQty(1);
      setNote("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">💊 Klinik</div>
          <h1 className="text-3xl font-black tracking-tight mt-2">Stok Obat Klinik</h1>
        </div>
        <button onClick={onLogout} className="border border-neutral-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg h-fit">Keluar</button>
      </div>
      <p className="text-neutral-600 mt-2">Catat obat masuk (diterima) atau keluar (dipakai/diberikan) — stok terupdate langsung.</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nama Perawat">
              <input className={inputCls} value={nurseName} onChange={(e) => setNurseName(e.target.value)} placeholder="Nama Anda" />
            </Field>
            <Field label="Obat">
              <select className={inputCls} value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
                <option value="">-- Pilih obat --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (stok: {fmtNum(m.current_stock)} {m.unit})</option>
                ))}
              </select>
            </Field>
            <Field label="Jenis Transaksi">
              <div className="flex gap-2">
                <button type="button" onClick={() => setType("masuk")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase border ${type === "masuk" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                  Masuk
                </button>
                <button type="button" onClick={() => setType("keluar")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase border ${type === "keluar" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                  Keluar
                </button>
              </div>
            </Field>
            <Field label="Jumlah">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Catatan (opsional)">
              <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: diberikan ke pasien / diterima dari supplier" />
            </Field>
            <button disabled={submitting} className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </Card>

        <Card>
          <div className="font-bold mb-3">Stok Obat Saat Ini</div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {medicines.map((m) => (
              <div key={m.id} className="flex justify-between items-center border-b border-neutral-100 pb-2 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  {m.category && <div className="text-xs text-neutral-400">{m.category}</div>}
                </div>
                <div className={`text-sm font-bold ${m.current_stock <= m.min_stock ? "text-red-600" : "text-neutral-800"}`}>
                  {fmtNum(m.current_stock)} {m.unit}
                </div>
              </div>
            ))}
            {medicines.length === 0 && <div className="text-sm text-neutral-400">Belum ada data obat.</div>}
          </div>
        </Card>
      </div>
      <Toast message={toast && toast.message} type={toast && toast.type} onClose={() => {}} />
    </div>
  );
}

function KlinikGate() {
  const [token, saveToken, clearToken] = useNurseToken();
  if (!token) return <NurseLogin onLogin={saveToken} />;
  return <KlinikPage token={token} onLogout={clearToken} />;
}

// ---------------- Admin ----------------

function useAdminToken() {
  const [token, setToken] = useState(localStorage.getItem("bonstok_admin_token") || "");
  const save = (t) => { localStorage.setItem("bonstok_admin_token", t); setToken(t); };
  const clear = () => { localStorage.removeItem("bonstok_admin_token"); setToken(""); };
  return [token, save, clear];
}

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) throw new Error("Password salah");
      const data = await r.json();
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-2xl font-black">Admin Bon Persediaan</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Password">
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </Field>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={busy} className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50">
          {busy ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}

function StatCard({ label, value, alert }) {
  return (
    <div className={`border rounded-xl p-4 bg-white ${alert ? "border-red-300" : "border-neutral-200"}`}>
      <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</div>
      <div className={`text-2xl font-black mt-1 ${alert ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}

const TABS = [
  { key: "bon", label: "Approval Bon" },
  { key: "items", label: "Persediaan" },
  { key: "rooms", label: "Ruangan" },
  { key: "klinik", label: "Manajemen Klinik" },
];

function ImportItemsPanel({ authHeaders, onImported }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [onlyWithStock, setOnlyWithStock] = useState(true);

  const doPreview = async () => {
    if (!file) return;
    setLoadingPreview(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/admin/items/import-preview`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.detail || "Gagal membaca file");
        setRows(null);
        return;
      }
      setRows(data.rows.map((row) => ({
        ...row,
        include: true,
        action: row.existing ? "update" : "create",
      })));
    } catch (err) {
      setError("Gagal membaca file");
    } finally {
      setLoadingPreview(false);
    }
  };

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

// Barang dianggap "masih ada stok" berdasarkan angka saldo terakhir yang
  // terbaca dari PDF (pdf_stock). Kalau filter aktif, barang dengan stok PDF
  // 0/kosong disembunyikan dari tabel DAN tidak ikut diimpor, walau checkbox
  // include-nya masih true di state.
  const hasStock = (r) => (r.pdf_stock || 0) > 0;
  const effectiveInclude = (r) => r.include && (!onlyWithStock || hasStock(r));

  const doCommit = async () => {
    if (!rows) return;
    setCommitting(true);
    setError("");
    try {
      const payloadRows = rows.map((r) => ({
        bmn_code: r.bmn_code,
        name: r.name,
        unit: r.unit,
        action: effectiveInclude(r) ? r.action : "skip",
        item_id: r.existing ? r.existing.id : null,
        pdf_stock: r.pdf_stock || 0,
      }));
      const resp = await fetch(`${API_BASE}/admin/items/import-commit`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data.detail || "Gagal mengimpor barang");
        return;
      }
      setResult(data);
      setRows(null);
      setFile(null);
      onImported();
    } catch (err) {
      setError("Gagal mengimpor barang");
    } finally {
      setCommitting(false);
    }
  };

  const includedCount = rows ? rows.filter(effectiveInclude).length : 0;
  const withStockCount = rows ? rows.filter(hasStock).length : 0;
  const visibleRows = rows
    ? rows.map((r, idx) => ({ ...r, _idx: idx })).filter((r) => !onlyWithStock || hasStock(r))
    : null;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-4">
      <div className="font-bold text-sm mb-2">Import Nama Barang dari PDF</div>
      <p className="text-xs text-neutral-500 mb-3">
        Upload file PDF "Rincian Buku Persediaan" (satu barang per halaman). Sistem akan membaca KODE BARANG, NAMA BARANG, dan SATUAN, lalu Anda bisa meninjau sebelum disimpan.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => { setFile(e.target.files[0] || null); setRows(null); setResult(null); setError(""); }}
          className="text-xs"
        />
        <button
          onClick={doPreview}
          disabled={!file || loadingPreview}
          className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg disabled:opacity-40"
        >
          {loadingPreview ? "Membaca..." : "Baca & Tinjau"}
        </button>
      </div>

      {error && <div className="text-xs text-red-600 mt-3">{error}</div>}

      {result && (
        <div className="text-xs text-green-700 mt-3 font-semibold">
          Selesai: {result.created} barang baru dibuat, {result.updated} diperbarui, {result.skipped} dilewati.
        </div>
      )}

      {rows && (
        <div className="mt-4">
          <label className="flex items-center gap-2 text-xs text-neutral-600 mb-2">
            <input type="checkbox" checked={onlyWithStock} onChange={(e) => setOnlyWithStock(e.target.checked)} />
            Hanya ambil barang yang masih ada sisa stok (menurut saldo terakhir di PDF)
          </label>
          <div className="text-xs text-neutral-500 mb-2">
            {rows.length} barang terbaca dari PDF, {withStockCount} yang masih ada stok, {includedCount} dipilih untuk diimpor.
          </div>
          <div className="border border-neutral-200 rounded-xl overflow-auto max-h-96">
            <table className="w-full text-xs min-w-[750px]">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="text-left font-bold uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                  <th className="p-2"></th>
                  <th className="p-2">Kode BMN</th>
                  <th className="p-2">Nama Barang</th>
                  <th className="p-2">Satuan</th>
                  <th className="p-2">Stok (PDF)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.bmn_code + r._idx} className="border-b border-neutral-100 last:border-0">
                    <td className="p-2">
                      <input type="checkbox" checked={r.include} onChange={(e) => updateRow(r._idx, { include: e.target.checked })} />
                    </td>
                    <td className="p-2 text-neutral-400 whitespace-nowrap">{r.bmn_code}</td>
                    <td className="p-2">
                      <input
                        className="border border-neutral-200 rounded px-2 py-1 w-full"
                        value={r.name}
                        onChange={(e) => updateRow(r._idx, { name: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="border border-neutral-200 rounded px-2 py-1 w-20"
                        value={r.unit}
                        onChange={(e) => updateRow(r._idx, { unit: e.target.value })}
                      />
                    </td>
                    <td className={`p-2 whitespace-nowrap ${hasStock(r) ? "" : "text-neutral-400"}`}>{fmtNum(r.pdf_stock || 0)}</td>
                    <td className="p-2">
                      {r.existing ? (
                        <span className="text-amber-600">Sudah ada: "{r.existing.name}" ({fmtNum(r.existing.current_stock)} {r.existing.unit}) → akan diperbarui</span>
                      ) : (
                        <span className="text-green-600">Barang baru</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr><td colSpan="6" className="p-3 text-neutral-400">Tidak ada barang dengan sisa stok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={doCommit}
            disabled={committing || includedCount === 0}
            className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg mt-3 disabled:opacity-40"
          >
            {committing ? "Menyimpan..." : `Import ${includedCount} Barang Terpilih`}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ token, onLogout }) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState("bon");
  const [stats, setStats] = useState(null);
  const [bonList, setBonList] = useState([]);
  const [bonFilter, setBonFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [history, setHistory] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [itemTx, setItemTx] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [sRes, bRes, iRes, mRes, hRes, rRes, itRes] = await Promise.all([
      fetch(`${API_BASE}/admin/stats`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/bon${bonFilter ? "?status=" + bonFilter : ""}`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/items`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/medicines`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/medicine-transactions`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/rooms`, { headers: authHeaders }),
      fetch(`${API_BASE}/admin/item-transactions`, { headers: authHeaders }),
    ]);
    if ([sRes, bRes, iRes, mRes, hRes, rRes, itRes].some((r) => r.status === 401)) {
      onLogout();
      return;
    }
    setStats(await sRes.json());
    setBonList(await bRes.json());
    setItems(await iRes.json());
    setMedicines(await mRes.json());
    setHistory(await hRes.json());
    setRooms(await rRes.json());
    setItemTx(await itRes.json());
    setLoading(false);
  }, [token, bonFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const decideBon = async (id, action) => {
    await fetch(`${API_BASE}/admin/bon/${id}/${action}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    loadAll();
  };

  const saveItem = async (item) => {
    const method = item.id ? "PUT" : "POST";
    const url = item.id ? `${API_BASE}/admin/items/${item.id}` : `${API_BASE}/admin/items`;
    const r = await fetch(url, {
      method,
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err.detail || "Gagal menyimpan barang");
      return;
    }
    setEditingItem(null);
    loadAll();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Hapus barang ini?")) return;
    await fetch(`${API_BASE}/admin/items/${id}`, { method: "DELETE", headers: authHeaders });
    loadAll();
  };

  const saveMedicine = async (med) => {
    const method = med.id ? "PUT" : "POST";
    const url = med.id ? `${API_BASE}/admin/medicines/${med.id}` : `${API_BASE}/admin/medicines`;
    await fetch(url, {
      method,
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(med),
    });
    setEditingMedicine(null);
    loadAll();
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm("Hapus obat ini?")) return;
    await fetch(`${API_BASE}/admin/medicines/${id}`, { method: "DELETE", headers: authHeaders });
    loadAll();
  };

  const saveRoom = async (room) => {
    const method = room.id ? "PUT" : "POST";
    const url = room.id ? `${API_BASE}/admin/rooms/${room.id}` : `${API_BASE}/admin/rooms`;
    const r = await fetch(url, {
      method,
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ name: room.name }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert(err.detail || "Gagal menyimpan ruangan");
      return;
    }
    setEditingRoom(null);
    loadAll();
  };

  const deleteRoom = async (id) => {
    if (!window.confirm("Hapus ruangan ini? Barcode yang sudah dicetak tidak akan berfungsi lagi.")) return;
    await fetch(`${API_BASE}/admin/rooms/${id}`, { method: "DELETE", headers: authHeaders });
    loadAll();
  };

  const downloadReport = async (module, format, start, end) => {
    const params = new URLSearchParams({ module, format });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const r = await fetch(`${API_BASE}/admin/report?${params.toString()}`, { headers: authHeaders });
    if (!r.ok) {
      alert("Gagal membuat laporan");
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-persediaan-${module}.${format === "xlsx" ? "xlsx" : "pdf"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const submitStockIn = async (payload) => {
    const r = await fetch(`${API_BASE}/admin/items/stock-in`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || "Gagal mencatat barang masuk");
    }
    loadAll();
    return r.json();
  };

  const submitMedicineTx = async (payload) => {
    const r = await fetch(`${API_BASE}/admin/medicines/transaction`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || "Gagal mencatat obat masuk/keluar");
    }
    loadAll();
    return r.json();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-neutral-500">Memuat...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Dashboard Admin</h1>
        <button onClick={onLogout} className="border border-neutral-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg">Keluar</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatCard label="Bon Pending" value={stats.pending_bon} alert={stats.pending_bon > 0} />
          <StatCard label="Barang Stok Rendah" value={stats.low_stock_items} alert={stats.low_stock_items > 0} />
          <StatCard label="Obat Stok Rendah" value={stats.low_stock_medicines} alert={stats.low_stock_medicines > 0} />
          <StatCard label="Total Barang" value={stats.total_items} />
        </div>
      )}

      <div className="flex gap-1 flex-wrap mt-8 border-b border-neutral-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-bold uppercase tracking-wide border-b-2 -mb-px ${tab === t.key ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "bon" && (
        <div className="mt-6">
          <div className="flex gap-2 mb-4">
            {["pending", "approved", "rejected", ""].map((s) => (
              <button key={s || "all"} onClick={() => setBonFilter(s)}
                className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg border ${bonFilter === s ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                {s || "Semua"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {bonList.map((b) => (
              <Card key={b.id}>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="font-bold">{b.requester_name} — {b.room}</div>
                    <div className="text-xs text-neutral-400">{fmtDate(b.requested_at)}</div>
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${b.status === "pending" ? "bg-yellow-100 text-yellow-800" : b.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {b.status}
                  </span>
                </div>
                <ul className="mt-3 text-sm space-y-1">
                  {b.items.map((line, i) => (
                    <li key={i} className="flex justify-between border-b border-neutral-100 pb-1">
                      <span>{line.item_name}</span>
                      <span className="font-semibold">{fmtNum(line.qty)} {line.unit}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {b.status === "pending" && (
                    <>
                      <button onClick={() => decideBon(b.id, "approve")} className="flex-1 bg-neutral-900 text-white text-xs font-bold uppercase py-2 rounded-lg">Setujui</button>
                      <button onClick={() => decideBon(b.id, "reject")} className="flex-1 border border-red-300 text-red-600 text-xs font-bold uppercase py-2 rounded-lg">Tolak</button>
                    </>
                  )}
                  <a
                    href={`${API_BASE}/bon/${b.id}/nota-dinas`}
                    className="flex-1 text-center border border-neutral-300 text-xs font-bold uppercase py-2 rounded-lg hover:bg-neutral-50"
                  >
                    📄 Nota Dinas
                  </a>
                </div>
              </Card>
            ))}
            {bonList.length === 0 && <div className="text-sm text-neutral-400">Tidak ada bon.</div>}
          </div>
        </div>
      )}

      {tab === "items" && (
        <div className="mt-6 space-y-6">
          <ImportItemsPanel authHeaders={authHeaders} onImported={loadAll} />

          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="font-bold">Daftar Barang</div>
              <button onClick={() => setEditingItem({ name: "", barcode: "", unit: "pcs", category: "", current_stock: 0, min_stock: 0 })}
                className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg">
                + Barang Baru
              </button>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                    <th className="p-3">Nama</th>
                    <th className="p-3">Barcode</th>
                    <th className="p-3">Stok</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-neutral-100 last:border-0">
                      <td className="p-3">
                        <div className="font-semibold">{it.name}</div>
                        <div className="text-xs text-neutral-400">{it.category}</div>
                      </td>
                      <td className="p-3 text-xs text-neutral-500">{it.barcode}</td>
                      <td className={`p-3 font-bold ${it.current_stock <= it.min_stock ? "text-red-600" : ""}`}>{fmtNum(it.current_stock)} {it.unit}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditingItem(it)} className="text-xs font-bold uppercase mr-3 underline">Edit</button>
                        <button onClick={() => deleteItem(it.id)} className="text-xs font-bold uppercase text-red-600 underline">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <PersediaanTab items={items} itemTx={itemTx} onStockIn={submitStockIn} onDownload={downloadReport} />
        </div>
      )}

      {tab === "rooms" && (
        <div className="mt-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setEditingRoom({ name: "" })}
              className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg">
              + Ruangan Baru
            </button>
            <button onClick={() => rooms.length && printRoomBarcodes(rooms)}
              disabled={!rooms.length}
              className="border border-neutral-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg disabled:opacity-40">
              🖨️ Cetak Semua Barcode
            </button>
          </div>
          <p className="text-xs text-neutral-500 mb-4">Cetak barcode dan tempel di masing-masing ruangan. Saat bon diajukan, barcode ini discan untuk identifikasi ruangan/bagian peminta.</p>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                  <th className="p-3">Nama Ruangan</th>
                  <th className="p-3">Kode Barcode</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-xs text-neutral-500">{r.barcode}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => printRoomBarcodes([r])} className="text-xs font-bold uppercase mr-3 underline">Cetak</button>
                      <button onClick={() => setEditingRoom(r)} className="text-xs font-bold uppercase mr-3 underline">Edit</button>
                      <button onClick={() => deleteRoom(r.id)} className="text-xs font-bold uppercase text-red-600 underline">Hapus</button>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr><td colSpan="3" className="p-3 text-sm text-neutral-400">Belum ada ruangan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "klinik" && (
        <KlinikTab
          authHeaders={authHeaders}
          onImported={loadAll}
          medicines={medicines}
          medicineTx={history}
          onMedicineTx={submitMedicineTx}
          onDownload={downloadReport}
          onNewMedicine={() => setEditingMedicine({ name: "", unit: "pcs", category: "", current_stock: 0, min_stock: 0 })}
          onEditMedicine={setEditingMedicine}
          onDeleteMedicine={deleteMedicine}
        />
      )}

      {editingItem && (
        <ItemEditModal item={editingItem} onClose={() => setEditingItem(null)} onSave={saveItem} />
      )}
      {editingMedicine && (
        <MedicineEditModal medicine={editingMedicine} onClose={() => setEditingMedicine(null)} onSave={saveMedicine} />
      )}
      {editingRoom && (
        <RoomEditModal room={editingRoom} onClose={() => setEditingRoom(null)} onSave={saveRoom} />
      )}
    </div>
  );
}

function ItemEditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, current_stock: Number(form.current_stock), min_stock: Number(form.min_stock) });
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">{item.id ? "Edit Barang" : "Barang Baru"}</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nama Barang">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Barcode">
            <input className={inputCls} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} required />
          </Field>
          <Field label="Kategori">
            <input className={inputCls} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Satuan">
              <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
            <Field label="Stok Saat Ini">
              <input type="number" className={inputCls} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} />
            </Field>
          </div>
          <Field label="Stok Minimum (alert)">
            <input type="number" className={inputCls} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase">Batal</button>
            <button type="submit" className="flex-1 bg-neutral-900 text-white rounded-lg py-2 text-sm font-bold uppercase">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MedicineEditModal({ medicine, onClose, onSave }) {
  const [form, setForm] = useState({ ...medicine });
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, current_stock: Number(form.current_stock), min_stock: Number(form.min_stock) });
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">{medicine.id ? "Edit Obat" : "Obat Baru"}</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nama Obat">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Kategori">
            <input className={inputCls} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Satuan">
              <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Field>
            <Field label="Stok Saat Ini">
              <input type="number" className={inputCls} value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} />
            </Field>
          </div>
          <Field label="Stok Minimum (alert)">
            <input type="number" className={inputCls} value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase">Batal</button>
            <button type="submit" className="flex-1 bg-neutral-900 text-white rounded-lg py-2 text-sm font-bold uppercase">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoomEditModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({ ...room });
  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-4">{room.id ? "Edit Ruangan" : "Ruangan Baru"}</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nama Ruangan / Bagian">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Klinik, Kamtib, Tata Usaha" required autoFocus />
          </Field>
          {room.id && (
            <div className="text-xs text-neutral-500">Kode barcode: <span className="font-mono">{room.barcode}</span> (tidak berubah)</div>
          )}
          {!room.id && (
            <div className="text-xs text-neutral-500">Kode barcode akan dibuat otomatis dan bisa langsung dicetak setelah disimpan.</div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase">Batal</button>
            <button type="submit" className="flex-1 bg-neutral-900 text-white rounded-lg py-2 text-sm font-bold uppercase">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------- Admin: Persediaan (stock-in + laporan) ----------------

function PersediaanTab({ items, itemTx, onStockIn, onDownload }) {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [itemId, setItemId] = useState("");
  const [newName, setNewName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [reportModule, setReportModule] = useState("items");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const onPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) { setPhoto(null); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "existing" && !itemId) {
      setError("Pilih barang dulu");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      setError("Isi nama barang baru");
      return;
    }
    if (!qty || Number(qty) <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        qty: Number(qty),
        unit,
        photo,
        note,
      };
      if (mode === "existing") payload.item_id = itemId;
      else payload.name = newName.trim();

      await onStockIn(payload);
      setQty(1);
      setNote("");
      setNewName("");
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="font-bold mb-4">Catat Barang Masuk</div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("existing")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${mode === "existing" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
              Barang Sudah Ada
            </button>
            <button type="button" onClick={() => setMode("new")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${mode === "new" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
              Barang Baru
            </button>
          </div>

          {mode === "existing" ? (
            <Field label="Nama Barang">
              <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
                <option value="">-- Pilih barang --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} (stok: {fmtNum(it.current_stock)} {it.unit})</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Nama Barang Baru">
              <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Tinta Printer" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Satuan">
              <input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, rim, botol, dus..." />
            </Field>
          </div>

          <Field label="Foto Barang / Bukti (opsional)">
            <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="text-sm" />
            {photo && <img src={photo} alt="preview" className="mt-2 h-24 rounded-lg border border-neutral-200 object-cover" />}
          </Field>

          <Field label="Catatan (opsional)">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: pembelian dari toko X, no. faktur..." />
          </Field>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button disabled={submitting} className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan Barang Masuk"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="font-bold mb-4">Unduh Laporan Keluar Masuk Barang</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Modul">
            <select className={inputCls} value={reportModule} onChange={(e) => setReportModule(e.target.value)}>
              <option value="items">Barang Gudang</option>
              <option value="medicines">Obat Klinik</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dari Tanggal">
              <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Sampai Tanggal">
              <input type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onDownload(reportModule, "pdf", start, end)}
            className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase hover:bg-neutral-50">
            Unduh PDF
          </button>
          <button onClick={() => onDownload(reportModule, "xlsx", start, end)}
            className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase hover:bg-neutral-50">
            Unduh Excel
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-3">Laporan berisi total masuk, total keluar dalam periode, dan saldo stok saat ini untuk tiap barang.</p>
      </Card>

      <Card>
        <div className="font-bold mb-3">Riwayat Barang Masuk / Keluar</div>
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                <th className="p-3">Waktu</th>
                <th className="p-3">Barang</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Catatan</th>
                <th className="p-3">Foto</th>
              </tr>
            </thead>
            <tbody>
              {itemTx.map((h) => (
                <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(h.created_at)}</td>
                  <td className="p-3 font-semibold">{h.item_name}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${h.type === "masuk" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{h.type}</span>
                  </td>
                  <td className="p-3">{fmtNum(h.qty)} {h.unit}</td>
                  <td className="p-3 text-xs text-neutral-500">{h.note || "-"}</td>
                  <td className="p-3">
                    {h.photo ? <img src={h.photo} alt="" className="h-10 w-10 object-cover rounded-lg border border-neutral-200" /> : "-"}
                  </td>
                </tr>
              ))}
              {itemTx.length === 0 && (
                <tr><td colSpan="6" className="p-3 text-sm text-neutral-400">Belum ada riwayat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ImportMedicinesPanel({ authHeaders, onImported }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const doPreview = async () => {
    if (!file) return;
    setLoadingPreview(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/admin/medicines/import-preview`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.detail || "Gagal membaca file");
        setRows(null);
        return;
      }
      setRows(data.rows.map((row) => ({
        ...row,
        include: true,
        action: row.existing ? "update" : "create",
      })));
    } catch (err) {
      setError("Gagal membaca file");
    } finally {
      setLoadingPreview(false);
    }
  };

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const doCommit = async () => {
    if (!rows) return;
    setCommitting(true);
    setError("");
    try {
      const payloadRows = rows.map((r) => ({
        name: r.name,
        unit: r.unit,
        stock: Number(r.stock) || 0,
        action: r.include ? r.action : "skip",
        medicine_id: r.existing ? r.existing.id : null,
      }));
      const resp = await fetch(`${API_BASE}/admin/medicines/import-commit`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payloadRows }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data.detail || "Gagal mengimpor obat");
        return;
      }
      setResult(data);
      setRows(null);
      setFile(null);
      onImported();
    } catch (err) {
      setError("Gagal mengimpor obat");
    } finally {
      setCommitting(false);
    }
  };

  const includedCount = rows ? rows.filter((r) => r.include).length : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="font-bold text-sm mb-2">Import Nama & Stok Obat dari File</div>
      <p className="text-xs text-neutral-500 mb-3">
        Upload file Excel (.xlsx), Word (.docx), atau PDF dengan format bebas — asal ada daftar/tabel nama obat dan jumlah stok. Sistem akan menebak kolom nama, satuan, dan stok secara otomatis, lalu Anda bisa meninjau sebelum disimpan.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="file"
          accept=".xlsx,.xlsm,.xls,.docx,.pdf"
          onChange={(e) => { setFile(e.target.files[0] || null); setRows(null); setResult(null); setError(""); }}
          className="text-xs"
        />
        <button
          onClick={doPreview}
          disabled={!file || loadingPreview}
          className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg disabled:opacity-40"
        >
          {loadingPreview ? "Membaca..." : "Baca & Tinjau"}
        </button>
      </div>

      {error && <div className="text-xs text-red-600 mt-3">{error}</div>}

      {result && (
        <div className="text-xs text-green-700 mt-3 font-semibold">
          Selesai: {result.created} obat baru dibuat, {result.updated} diperbarui, {result.skipped} dilewati.
        </div>
      )}

      {rows && (
        <div className="mt-4">
          <div className="text-xs text-neutral-500 mb-2">
            {rows.length} obat terbaca dari file, {includedCount} dipilih untuk diimpor.
          </div>
          <div className="border border-neutral-200 rounded-xl overflow-auto max-h-96">
            <table className="w-full text-xs min-w-[650px]">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="text-left font-bold uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
                  <th className="p-2"></th>
                  <th className="p-2">Nama Obat</th>
                  <th className="p-2">Satuan</th>
                  <th className="p-2">Stok</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.name + idx} className="border-b border-neutral-100 last:border-0">
                    <td className="p-2">
                      <input type="checkbox" checked={r.include} onChange={(e) => updateRow(idx, { include: e.target.checked })} />
                    </td>
                    <td className="p-2">
                      <input
                        className="border border-neutral-200 rounded px-2 py-1 w-full"
                        value={r.name}
                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="border border-neutral-200 rounded px-2 py-1 w-20"
                        value={r.unit}
                        onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="border border-neutral-200 rounded px-2 py-1 w-24"
                        value={r.stock}
                        onChange={(e) => updateRow(idx, { stock: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      {r.existing ? (
                        <span className="text-amber-600">Sudah ada: "{r.existing.name}" ({fmtNum(r.existing.current_stock)} {r.existing.unit}) → akan diperbarui</span>
                      ) : (
                        <span className="text-green-600">Obat baru</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan="5" className="p-3 text-neutral-400">Tidak ada data terbaca.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={doCommit}
            disabled={committing || includedCount === 0}
            className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg mt-3 disabled:opacity-40"
          >
            {committing ? "Menyimpan..." : `Import ${includedCount} Obat Terpilih`}
          </button>
        </div>
      )}
    </div>
  );
}

function KlinikTab({ authHeaders, onImported, medicines, medicineTx, onMedicineTx, onDownload, onNewMedicine, onEditMedicine, onDeleteMedicine }) {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [type, setType] = useState("masuk"); // "masuk" | "keluar"
  const [medicineId, setMedicineId] = useState("");
  const [newName, setNewName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const onPhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) { setPhoto(null); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "existing" && !medicineId) {
      setError("Pilih obat dulu");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      setError("Isi nama obat baru");
      return;
    }
    if (!qty || Number(qty) <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        type,
        qty: Number(qty),
        unit,
        photo,
        note,
      };
      if (mode === "existing") payload.medicine_id = medicineId;
      else payload.name = newName.trim();

      await onMedicineTx(payload);
      setQty(1);
      setNote("");
      setNewName("");
      setPhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <ImportMedicinesPanel authHeaders={authHeaders} onImported={onImported} />

      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="font-bold">Daftar Obat</div>
          <button onClick={onNewMedicine}
            className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg">
            + Obat Baru
          </button>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                <th className="p-3">Nama</th>
                <th className="p-3">Stok</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3">
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-neutral-400">{m.category}</div>
                  </td>
                  <td className={`p-3 font-bold ${m.current_stock <= m.min_stock ? "text-red-600" : ""}`}>{fmtNum(m.current_stock)} {m.unit}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => onEditMedicine(m)} className="text-xs font-bold uppercase mr-3 underline">Edit</button>
                    <button onClick={() => onDeleteMedicine(m.id)} className="text-xs font-bold uppercase text-red-600 underline">Hapus</button>
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr><td colSpan="3" className="p-3 text-sm text-neutral-400">Belum ada obat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="font-bold mb-4">Catat Obat Masuk / Keluar</div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("masuk")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${type === "masuk" ? "bg-green-600 text-white border-green-600" : "border-neutral-300"}`}>
              Obat Masuk
            </button>
            <button type="button" onClick={() => { setType("keluar"); setMode("existing"); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${type === "keluar" ? "bg-red-600 text-white border-red-600" : "border-neutral-300"}`}>
              Obat Keluar
            </button>
          </div>

          {type === "masuk" && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("existing")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${mode === "existing" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                Obat Sudah Ada
              </button>
              <button type="button" onClick={() => setMode("new")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${mode === "new" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                Obat Baru
              </button>
            </div>
          )}

          {mode === "existing" ? (
            <Field label="Nama Obat">
              <select className={inputCls} value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
                <option value="">-- Pilih obat --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (stok: {fmtNum(m.current_stock)} {m.unit})</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Nama Obat Baru">
              <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Paracetamol 500mg" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Satuan">
              <input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="strip, botol, pcs..." />
            </Field>
          </div>

          <Field label="Foto Bukti (opsional)">
            <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="text-sm" />
            {photo && <img src={photo} alt="preview" className="mt-2 h-24 rounded-lg border border-neutral-200 object-cover" />}
          </Field>

          <Field label="Catatan (opsional)">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dipakai pasien X, dari distributor Y..." />
          </Field>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button disabled={submitting} className={`w-full text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg disabled:opacity-50 ${type === "keluar" ? "bg-red-600 hover:bg-red-700" : "bg-neutral-900 hover:bg-neutral-700"}`}>
            {submitting ? "Menyimpan..." : type === "keluar" ? "Simpan Obat Keluar" : "Simpan Obat Masuk"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="font-bold mb-4">Unduh Laporan Keluar Masuk Obat</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dari Tanggal">
            <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Sampai Tanggal">
            <input type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => onDownload("medicines", "pdf", start, end)}
            className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase hover:bg-neutral-50">
            Unduh PDF
          </button>
          <button onClick={() => onDownload("medicines", "xlsx", start, end)}
            className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase hover:bg-neutral-50">
            Unduh Excel
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-3">Laporan berisi total masuk, total keluar dalam periode, dan saldo stok saat ini untuk tiap obat.</p>
      </Card>

      <Card>
        <div className="font-bold mb-3">Riwayat Obat Masuk / Keluar</div>
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                <th className="p-3">Waktu</th>
                <th className="p-3">Obat</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Catatan / Oleh</th>
                <th className="p-3">Foto</th>
              </tr>
            </thead>
            <tbody>
              {medicineTx.map((h) => (
                <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(h.created_at)}</td>
                  <td className="p-3 font-semibold">{h.medicine_name}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${h.type === "masuk" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{h.type}</span>
                  </td>
                  <td className="p-3">{fmtNum(h.qty)} {h.unit || ""}</td>
                  <td className="p-3 text-xs text-neutral-500">{h.note || (h.nurse_name ? `Perawat: ${h.nurse_name}` : "-")}</td>
                  <td className="p-3">
                    {h.photo ? <img src={h.photo} alt="" className="h-10 w-10 object-cover rounded-lg border border-neutral-200" /> : "-"}
                  </td>
                </tr>
              ))}
              {medicineTx.length === 0 && (
                <tr><td colSpan="6" className="p-3 text-sm text-neutral-400">Belum ada riwayat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AdminPage() {
  const [token, saveToken, clearToken] = useAdminToken();
  if (!token) return <AdminLogin onLogin={saveToken} />;
  return <AdminDashboard token={token} onLogout={clearToken} />;
}

// ---------------- Root ----------------

function App() {
  const hash = useHashRoute();
  const path = hash.replace(/^#\/?/, "");

  let content;
  if (path === "klinik") content = <KlinikGate />;
  else if (path === "admin") content = <AdminPage />;
  else content = <GudangPage />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{content}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
