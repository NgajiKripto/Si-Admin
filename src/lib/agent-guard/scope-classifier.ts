export interface ScopeResult {
  inScope: boolean;
  detectedTopic?: string;
  confidence: number;
  reason?: string;
}

// Keyword-to-topic mapping for Indonesian customer service
const TOPIC_KEYWORDS: Record<string, string[]> = {
  produk: [
    "produk", "barang", "item", "katalog", "model", "tipe",
    "varian", "warna", "ukuran", "spesifikasi", "fitur",
  ],
  harga: [
    "harga", "berapa", "biaya", "diskon", "potongan", "promo",
    "murah", "mahal", "budget", "range harga", "price",
  ],
  pengiriman: [
    "kirim", "ongkir", "ekspedisi", "kurir", "tracking", "resi",
    "estimasi sampai", "alamat", "pengiriman", "dikirim", "sampai",
    "jne", "jnt", "sicepat", "anteraja", "gosend",
  ],
  pembayaran: [
    "bayar", "transfer", "payment", "invoice", "tagihan", "cicilan",
    "cod", "dana", "gopay", "ovo", "shopeepay", "bca", "bni",
    "mandiri", "bri", "rekening", "pembayaran",
  ],
  keluhan: [
    "komplain", "keluhan", "masalah", "rusak", "cacat", "kecewa",
    "refund", "tidak puas", "mengecewakan", "buruk",
  ],
  retur: [
    "retur", "tukar", "kembalikan", "return", "pengembalian",
    "tukar barang", "ganti",
  ],
  stok: [
    "stok", "tersedia", "ready", "habis", "kosong", "pre-order",
    "restock", "ada", "available",
  ],
  jam_operasional: [
    "buka", "tutup", "jam", "operasional", "libur", "weekend",
    "hari kerja", "waktu", "jadwal",
  ],
  promo: [
    "promo", "sale", "flash sale", "voucher", "kupon", "cashback",
    "diskon", "penawaran", "deal",
  ],
  garansi: [
    "garansi", "warranty", "klaim", "kerusakan", "perbaikan",
    "service", "servis",
  ],
};

const CONFIDENCE_THRESHOLD = 0.3;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function classifyScope(
  input: string,
  allowedTopics: string[]
): ScopeResult {
  const normalizedInput = input.toLowerCase();

  let bestTopic: string | undefined;
  let bestConfidence = 0;

  for (const topic of allowedTopics) {
    // Use predefined keywords if available, otherwise fall back to the
    // topic name itself so custom admin-added topics can still match.
    const keywords = TOPIC_KEYWORDS[topic] ?? [topic];

    let matchCount = 0;
    for (const keyword of keywords) {
      // Use word boundary to prevent partial word matches
      // (e.g., "produk" should not match "produksi")
      const keywordLower = keyword.toLowerCase();
      const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'i');
      if (wordBoundaryRegex.test(normalizedInput)) {
        matchCount++;
      }
    }

    // Calculate confidence relative to keyword list size to prevent
    // inflation on short inputs.
    const confidence = matchCount > 0
      ? Math.min(1.0, matchCount / Math.max(3, keywords.length * 0.3))
      : 0;

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestTopic = topic;
    }
  }

  const inScope = bestConfidence >= CONFIDENCE_THRESHOLD;

  return {
    inScope,
    detectedTopic: inScope ? bestTopic : undefined,
    confidence: bestConfidence,
    reason: inScope
      ? undefined
      : "Pesan tidak termasuk dalam topik yang diizinkan",
  };
}
