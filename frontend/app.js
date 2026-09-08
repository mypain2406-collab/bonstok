const { useState, useEffect, useCallback, useRef } = React;

const API_BASE = window.API_BASE;
const LOGO_DATA_URI = "data:image/png;base64,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";

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
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-3">
        <a href="#/" className="flex items-center gap-2">
          <img src={LOGO_DATA_URI} alt="Barang Milik Negara - Lapas Palangkaraya" className="h-14 w-auto" />
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
  const [cart, setCart] = useState([]); // [{item_id, name, unit, qty, current_stock, photo, freeform}]
  const [jenis, setJenis] = useState("persediaan"); // "persediaan" | "nota_dinas"
  const [freeName, setFreeName] = useState("");
  const [freeUnit, setFreeUnit] = useState("pcs");
  const [freeQty, setFreeQty] = useState(1);
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
      return [...prev, { _cid: `it_${item.id}`, item_id: item.id, name: item.name, unit: item.unit, qty: 1, current_stock: item.current_stock, photo: item.photo || null, freeform: false }];
    });
  };

  const addFreeformToCart = () => {
    const name = freeName.trim();
    if (!name) return;
    setCart((prev) => [...prev, { _cid: `free_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, item_id: null, name, unit: freeUnit.trim() || "pcs", qty: Math.max(1, Number(freeQty) || 1), current_stock: null, photo: null, freeform: true }]);
    setFreeName("");
    setFreeUnit("pcs");
    setFreeQty(1);
  };

  const switchJenis = (j) => {
    if (j === jenis) return;
    setJenis(j);
    setCart([]);
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

  const updateQty = (cid, qty) => {
    setCart((prev) => prev.map((c) => (c._cid === cid ? { ...c, qty: Math.max(1, qty) } : c)));
  };

  const removeFromCart = (cid) => {
    setCart((prev) => prev.filter((c) => c._cid !== cid));
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
          jenis,
          items: cart.map((c) => (
            jenis === "nota_dinas"
              ? { item_name: c.name, unit: c.unit, qty: c.qty }
              : { item_id: c.item_id, qty: c.qty }
          )),
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
    setJenis("persediaan");
    setFreeName("");
    setFreeUnit("pcs");
    setFreeQty(1);
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

              <Field label="Jenis Permintaan">
                <div className="flex gap-2">
                  <button type="button" onClick={() => switchJenis("persediaan")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${jenis === "persediaan" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                    Permintaan Barang (Persediaan)
                  </button>
                  <button type="button" onClick={() => switchJenis("nota_dinas")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${jenis === "nota_dinas" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"}`}>
                    Nota Dinas Kebutuhan Lainnya
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  {jenis === "persediaan"
                    ? "Ambil barang yang tersedia di stok persediaan gudang."
                    : "Ajukan kebutuhan barang lain yang tidak tersedia di stok persediaan (dicatat sebagai permintaan, tidak memotong stok)."}
                </p>
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

{room && jenis === "persediaan" && (
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

              {room && jenis === "nota_dinas" && (
                <Card>
                  <div className="font-bold mb-3">Tambah Kebutuhan Barang</div>
                  <div className="space-y-3">
                    <Field label="Nama Barang">
                      <input className={inputCls} value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Contoh: Kertas A4, Toner Printer..." />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Jumlah">
                        <input type="number" min="1" className={inputCls} value={freeQty} onChange={(e) => setFreeQty(e.target.value)} />
                      </Field>
                      <Field label="Satuan">
                        <input className={inputCls} value={freeUnit} onChange={(e) => setFreeUnit(e.target.value)} placeholder="pcs, rim, box..." />
                      </Field>
                    </div>
                    <button type="button" onClick={addFreeformToCart}
                      className="w-full border border-neutral-300 rounded-lg py-2 text-sm font-bold uppercase tracking-wider hover:bg-neutral-50">
                      + Tambah ke Daftar
                    </button>
                  </div>
                </Card>
              )}
        </div>

        <Card>
          <div className="font-bold mb-3">Keranjang Bon ({cart.length})</div>
          {cart.length === 0 && <div className="text-sm text-neutral-400">Belum ada barang. Cari nama barang untuk menambahkan.</div>}
          <div className="space-y-3">
            {cart.map((c) => (
              <div key={c._cid} className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0">
          {c.photo ? (
            <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-lg object-cover border border-neutral-200 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300 text-xs flex-shrink-0">[img]</div>
              )}
                <div className="flex-1">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-neutral-400">{c.freeform ? "Kebutuhan di luar stok" : `Stok tersedia: ${fmtNum(c.current_stock)} ${c.unit}`}</div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={c.qty}
                  onChange={(e) => updateQty(c._cid, Number(e.target.value))}
                  className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm text-center"
                />
                <button onClick={() => removeFromCart(c._cid)} className="text-red-600 text-xs font-bold uppercase">Hapus</button>
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
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) throw new Error("Username atau password salah");
      const data = await r.json();
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1330] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={LOGO_DATA_URI} alt="Barang Milik Negara - Lapas Palangkaraya" className="h-24 w-auto mb-3" />
          <div className="text-white font-black tracking-widest uppercase text-sm">Bon Persediaan</div>
          <div className="text-white/60 text-xs mt-0.5">Lapas Palangkaraya</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-black">Admin Bon Persediaan</h1>
          <p className="text-sm text-neutral-500 mt-1">Lapas Palangkaraya — khusus admin</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Username">
              <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </Field>
            <Field label="Password">
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button disabled={busy} className="w-full bg-[#1d2b6b] text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-[#141d4a] disabled:opacity-50">
              {busy ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, alert, icon, color }) {
  return (
    <div className={`border rounded-xl p-4 bg-white ${alert ? "border-red-300" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">{label}</div>
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${color || "bg-neutral-100"} flex items-center justify-center text-sm`}>{icon}</div>
        )}
      </div>
      <div className={`text-2xl font-black mt-1 ${alert ? "text-red-600" : ""}`}>{value}</div>
    </div>
  );
}

const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", icon: "\ud83d\udcca" },
  { key: "bon", label: "Persetujuan Bon", icon: "\ud83d\udcdd" },
  { key: "keluar", label: "Bon Barang Persediaan", icon: "\ud83d\udce4" },
  { key: "masuk", label: "Mutasi Masuk", icon: "\ud83d\udce5" },
  { key: "klinik", label: "Persediaan Obat Klinik", icon: "\ud83d\udc89" },
];
const NAV_DATA = [
  { key: "items", label: "Data Barang", icon: "\ud83d\udce6" },
  { key: "rooms", label: "Ruangan", icon: "\ud83c\udfe2" },
  { key: "report", label: "Laporan", icon: "\ud83d\udcc4" },
];
const NAV_ALL = [...NAV_MAIN, ...NAV_DATA];

function AdminSidebar({ tab, setTab, onLogout }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 bg-[#0b1330] text-white min-h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/10 flex flex-col items-center text-center">
        <img src={LOGO_DATA_URI} alt="Barang Milik Negara - Lapas Palangkaraya" className="h-16 w-auto mb-2.5" />
        <div className="font-black tracking-wide text-sm uppercase leading-tight">Bon Persediaan</div>
        <div className="text-xs text-neutral-400 mt-0.5">Lapas Palangkaraya</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_MAIN.map((n) => (
          <button key={n.key} onClick={() => setTab(n.key)}
            className={`w-full flex items-center gap-2 text-left text-sm font-semibold px-3 py-2.5 rounded-lg transition ${tab === n.key ? "bg-[#2b3f8c] text-white" : "text-neutral-300 hover:bg-white/10"}`}>
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
        <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Manajemen Data</div>
        {NAV_DATA.map((n) => (
          <button key={n.key} onClick={() => setTab(n.key)}
            className={`w-full flex items-center gap-2 text-left text-sm font-semibold px-3 py-2.5 rounded-lg transition ${tab === n.key ? "bg-[#2b3f8c] text-white" : "text-neutral-300 hover:bg-white/10"}`}>
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <button onClick={onLogout} className="w-full border border-white/20 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-white/10">Keluar</button>
        <div className="text-[10px] text-neutral-500 text-center tracking-widest">v1.0.0</div>
      </div>
    </aside>
  );
}

function MobileTabBar({ tab, setTab }) {
  return (
    <div className="md:hidden flex gap-1 flex-wrap mb-6 border-b border-neutral-200">
      {NAV_ALL.map((n) => (
        <button key={n.key} onClick={() => setTab(n.key)}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wide border-b-2 -mb-px ${tab === n.key ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400"}`}>
          {n.label}
        </button>
      ))}
    </div>
  );
}

function DashboardHome({ stats, items }) {
  const totalStock = items.reduce((sum, it) => sum + (it.current_stock || 0), 0);
  const byCategory = {};
  items.forEach((it) => {
    const cat = it.category || "Tanpa Kategori";
    if (!byCategory[cat]) byCategory[cat] = { count: 0, stock: 0 };
    byCategory[cat].count += 1;
    byCategory[cat].stock += it.current_stock || 0;
  });
  const catRows = Object.entries(byCategory).sort((a, b) => b[1].stock - a[1].stock);
  const maxCatStock = Math.max(1, ...catRows.map(([, v]) => v.stock));
  const barColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500", "bg-purple-500", "bg-neutral-400"];

  return (
    <div>
      <h1 className="text-2xl font-black">Dashboard</h1>
      <p className="text-neutral-500 text-sm mt-1">Ringkasan persediaan LP PKY.</p>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <StatCard icon="📦" color="bg-blue-100" label="Total Item Barang" value={fmtNum(items.length)} />
          <StatCard icon="✅" color="bg-emerald-100" label="Stok Tersedia" value={fmtNum(totalStock)} />
          <StatCard icon="⚠️" color="bg-amber-100" label="Stok Menipis" value={stats.low_stock_items} alert={stats.low_stock_items > 0} />
          <StatCard icon="📤" color="bg-red-100" label="Barang Keluar (Bulan Ini)" value={fmtNum(stats.keluar_bulan_ini)} />
          <StatCard icon="📥" color="bg-sky-100" label="Barang Masuk (Bulan Ini)" value={fmtNum(stats.masuk_bulan_ini)} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <div className="font-bold mb-4">Kategori Barang</div>
          <div className="space-y-3">
            {catRows.map(([cat, v], i) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold">{cat}</span>
                  <span className="text-neutral-400">{v.count} item &middot; {fmtNum(v.stock)} stok</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div className={`h-full rounded-full ${barColors[i % barColors.length]}`} style={{ width: `${Math.max(4, (v.stock / maxCatStock) * 100)}%` }} />
                </div>
              </div>
            ))}
            {catRows.length === 0 && <div className="text-sm text-neutral-400">Belum ada barang.</div>}
          </div>
        </Card>

        <Card>
          <div className="font-bold mb-4">Status Bon</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Menunggu Persetujuan</span>
              <span className="font-bold">{stats ? stats.pending_bon : "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Disetujui</span>
              <span className="font-bold">{stats ? stats.approved_bon : "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Ditolak</span>
              <span className="font-bold">{stats ? stats.rejected_bon : "-"}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MutasiKeluarPanel({ items, itemTx, onItemTx }) {
  const [itemId, setItemId] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!itemId) { setError("Pilih barang dulu"); return; }
    if (!qty || Number(qty) <= 0) { setError("Jumlah harus lebih dari 0"); return; }
    setSubmitting(true);
    try {
      await onItemTx({ item_id: itemId, type: "keluar", qty: Number(qty), unit, note });
      setQty(1);
      setNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const keluarHistory = itemTx.filter((h) => h.type === "keluar");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Mutasi Keluar</h1>
      <Card>
        <div className="font-bold mb-4">Catat Barang Keluar</div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama Barang">
            <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">-- Pilih barang --</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name} (stok: {fmtNum(it.current_stock)} {it.unit})</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jumlah">
              <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Satuan">
              <input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, rim, botol, dus..." />
            </Field>
          </div>
          <Field label="Catatan (opsional)">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dipakai untuk kegiatan X..." />
          </Field>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button disabled={submitting} className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-widest py-2.5 rounded-lg hover:bg-neutral-700 disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan Barang Keluar"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="font-bold mb-3">Riwayat Barang Keluar</div>
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200">
                <th className="p-3">Waktu</th>
                <th className="p-3">Barang</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {keluarHistory.map((h) => (
                <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(h.created_at)}</td>
                  <td className="p-3 font-semibold">{h.item_name}</td>
                  <td className="p-3">{fmtNum(h.qty)} {h.unit}</td>
                  <td className="p-3 text-xs text-neutral-500">{h.note || "-"}</td>
                </tr>
              ))}
              {keluarHistory.length === 0 && (
                <tr><td colSpan="4" className="p-3 text-sm text-neutral-400">Belum ada riwayat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function LaporanPanel({ onDownload }) {
  const [reportModule, setReportModule] = useState("items");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Laporan</h1>
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
    </div>
  );
}

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
  const [tab, setTab] = useState("dashboard");
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
  const [realisasiMap, setRealisasiMap] = useState({}); // { [bonId]: [qty, qty, ...] }

  const setRealisasi = (bonId, idx, value) => {
    setRealisasiMap((prev) => {
      const arr = (prev[bonId] || []).slice();
      arr[idx] = value;
      return { ...prev, [bonId]: arr };
    });
  };

  const realisasiFor = (bon, idx) => {
    const v = realisasiMap[bon.id] && realisasiMap[bon.id][idx];
    return v === undefined || v === "" ? bon.items[idx].qty : v;
  };

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

  const decideBon = async (id, action, bon) => {
    const body = action === "approve" && bon
      ? { realizations: bon.items.map((_, idx) => Number(realisasiFor(bon, idx))) }
      : {};
    await fetch(`${API_BASE}/admin/bon/${id}/${action}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  const submitItemTx = async (payload) => {
    const r = await fetch(`${API_BASE}/admin/items/transaction`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || "Gagal mencatat mutasi barang");
    }
    loadAll();
    return r.json();
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-neutral-500">Memuat...</div>;

  return (
    <div className="min-h-screen flex">
      <AdminSidebar tab={tab} setTab={setTab} onLogout={onLogout} />
      <div className="flex-1 min-w-0">
        <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="font-bold text-sm text-neutral-700">{(NAV_ALL.find((n) => n.key === tab) || {}).label || "Dashboard"}</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">A</div>
            <span className="text-sm font-semibold text-neutral-700">Admin</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          <div className="md:hidden flex items-center justify-between mb-4">
            <h1 className="text-xl font-black">Bon Persediaan</h1>
            <button onClick={onLogout} className="border border-neutral-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg">Keluar</button>
          </div>
          <MobileTabBar tab={tab} setTab={setTab} />

          {tab === "dashboard" && <DashboardHome stats={stats} items={items} />}

          {tab === "keluar" && <GudangPage />}

          {tab === "masuk" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-black">Mutasi Masuk</h1>
              <ImportItemsPanel authHeaders={authHeaders} onImported={loadAll} />
              <PersediaanTab items={items} itemTx={itemTx} onStockIn={submitStockIn} />
            </div>
          )}

          {tab === "report" && <LaporanPanel onDownload={downloadReport} />}

          {tab === "bon" && (
            <div>
              <h1 className="text-2xl font-black mb-6">Persetujuan Bon</h1>
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
                        <div className="font-bold flex items-center gap-2 flex-wrap">
                          <span>{b.requester_name} — {b.room}</span>
                          {b.jenis === "nota_dinas" && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">Nota Dinas</span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400">{fmtDate(b.requested_at)}</div>
                      </div>
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${b.status === "pending" ? "bg-yellow-100 text-yellow-800" : b.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {b.status}
                      </span>
                    </div>
                    <ul className="mt-3 text-sm space-y-1">
                      {b.items.map((line, i) => (
                        <li key={i} className="flex justify-between items-center gap-3 border-b border-neutral-100 pb-1.5 pt-1">
                          <span className="flex-1">{line.item_name}</span>
                          <span className="text-neutral-400 text-xs whitespace-nowrap">diminta {fmtNum(line.qty)} {line.unit}</span>
                          {b.status === "pending" ? (
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] uppercase font-bold text-neutral-400">realisasi</span>
                              <input
                                type="number" min="0" step="any"
                                className="w-20 rounded border border-neutral-300 px-2 py-1 text-xs text-right"
                                value={realisasiFor(b, i)}
                                onChange={(e) => setRealisasi(b.id, i, e.target.value)}
                              />
                              <span className="text-xs text-neutral-500">{line.unit}</span>
                            </span>
                          ) : (
                            <span className="font-semibold text-xs whitespace-nowrap">
                              realisasi {line.realisasi_qty !== undefined && line.realisasi_qty !== null ? fmtNum(line.realisasi_qty) : "-"} {line.unit}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {b.status === "pending" && (
                        <>
                          <button onClick={() => decideBon(b.id, "approve", b)} className="flex-1 bg-neutral-900 text-white text-xs font-bold uppercase py-2 rounded-lg">Setujui</button>
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
            <div>
              <h1 className="text-2xl font-black mb-6">Data Barang</h1>
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
            </div>
          )}

          {tab === "rooms" && (
            <div>
              <h1 className="text-2xl font-black mb-6">Ruangan</h1>
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
      </div>
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

function PersediaanTab({ items, itemTx, onStockIn }) {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [itemId, setItemId] = useState("");
  const [newName, setNewName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        <div className="font-bold mb-3">Riwayat Barang Masuk</div>
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
              {itemTx.filter((h) => h.type === "masuk").map((h) => (
                <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(h.created_at)}</td>
                  <td className="p-3 font-semibold">{h.item_name}</td>
                  <td className="p-3">
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-green-100 text-green-800">{h.type}</span>
                  </td>
                  <td className="p-3">{fmtNum(h.qty)} {h.unit}</td>
                  <td className="p-3 text-xs text-neutral-500">{h.note || "-"}</td>
                  <td className="p-3">
                    {h.photo ? <img src={h.photo} alt="" className="h-10 w-10 object-cover rounded-lg border border-neutral-200" /> : "-"}
                  </td>
                </tr>
              ))}
              {itemTx.filter((h) => h.type === "masuk").length === 0 && (
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
