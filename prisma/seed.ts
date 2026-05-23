import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up new models first
  await prisma.knowledgeGraphRelation.deleteMany();
  await prisma.knowledgeGraphEntity.deleteMany();
  await prisma.learningInsight.deleteMany();
  await prisma.agentMemory.deleteMany();
  await prisma.knowledgeEntry.deleteMany();

  // Clean up existing data
  await prisma.stockMovement.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.stockCategory.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.feedbackTemplate.deleteMany();
  await prisma.businessProfile.deleteMany();

  // Create Business Profile
  const business = await prisma.businessProfile.create({
    data: {
      name: "Toko Serba Ada",
      type: "Retail",
      description: "Toko serba ada yang menyediakan berbagai kebutuhan sehari-hari",
      settings: JSON.stringify({ currency: "IDR", timezone: "Asia/Jakarta" }),
    },
  });

  // Create Channels
  const channelWhatsApp = await prisma.channel.create({
    data: {
      name: "WhatsApp",
      type: "WHATSAPP",
      isActive: true,
      config: JSON.stringify({ phoneNumber: "+6281234567890" }),
      businessId: business.id,
    },
  });

  const channelTelegram = await prisma.channel.create({
    data: {
      name: "Telegram",
      type: "TELEGRAM",
      isActive: true,
      config: JSON.stringify({ botToken: "xxx-telegram-token" }),
      businessId: business.id,
    },
  });

  const channelEmail = await prisma.channel.create({
    data: {
      name: "Email",
      type: "EMAIL",
      isActive: true,
      config: JSON.stringify({ email: "cs@tokoserbaada.id" }),
      businessId: business.id,
    },
  });

  const channelInstagram = await prisma.channel.create({
    data: {
      name: "Instagram",
      type: "INSTAGRAM",
      isActive: false,
      config: JSON.stringify({ username: "@tokoserbaada" }),
      businessId: business.id,
    },
  });

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Budi Santoso", phone: "+6281234567001", email: "budi@email.com", channel: "WhatsApp", notes: "Pelanggan tetap" } }),
    prisma.customer.create({ data: { name: "Siti Rahmawati", phone: "+6281234567002", email: "siti@email.com", channel: "WhatsApp", notes: "Sering beli elektronik" } }),
    prisma.customer.create({ data: { name: "Ahmad Hidayat", phone: "+6281234567003", email: "ahmad@email.com", channel: "Telegram", notes: null } }),
    prisma.customer.create({ data: { name: "Dewi Lestari", phone: "+6281234567004", email: "dewi@email.com", channel: "Email", notes: "Reseller" } }),
    prisma.customer.create({ data: { name: "Rudi Hermawan", phone: "+6281234567005", email: null, channel: "WhatsApp", notes: "Pembeli grosir" } }),
    prisma.customer.create({ data: { name: "Nur Aisyah", phone: "+6281234567006", email: "aisyah@email.com", channel: "Instagram", notes: null } }),
    prisma.customer.create({ data: { name: "Hendra Wijaya", phone: "+6281234567007", email: "hendra@email.com", channel: "WhatsApp", notes: "Pelanggan baru" } }),
    prisma.customer.create({ data: { name: "Fitri Handayani", phone: "+6281234567008", email: "fitri@email.com", channel: "Telegram", notes: null } }),
    prisma.customer.create({ data: { name: "Agus Prasetyo", phone: "+6281234567009", email: null, channel: "WhatsApp", notes: "Langganan bulanan" } }),
    prisma.customer.create({ data: { name: "Rina Marlina", phone: "+6281234567010", email: "rina@email.com", channel: "Email", notes: "Perlu follow up" } }),
  ]);

  // Create Conversations with Messages
  const conversations = [];
  const channels = [channelWhatsApp, channelTelegram, channelEmail, channelInstagram];

  for (let i = 0; i < 15; i++) {
    const customer = customers[i % customers.length];
    const channel = channels[i % channels.length];
    const status = i < 8 ? "ACTIVE" : i < 12 ? "RESOLVED" : "PENDING";

    const conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        channelId: channel.id,
        status,
        lastMessage: `Pesan terakhir dari percakapan ${i + 1}`,
        lastMessageAt: new Date(Date.now() - i * 3600000),
        unreadCount: i < 5 ? Math.floor(Math.random() * 5) + 1 : 0,
      },
    });
    conversations.push(conversation);

    // Add messages to each conversation
    const messageCount = Math.floor(Math.random() * 5) + 2;
    for (let j = 0; j < messageCount; j++) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: j % 2 === 0
            ? `Halo, saya ingin bertanya tentang produk ${j + 1}`
            : `Terima kasih, berikut informasi yang Anda butuhkan tentang produk ${j + 1}`,
          sender: j % 2 === 0 ? "CUSTOMER" : "ADMIN",
          sentAt: new Date(Date.now() - (messageCount - j) * 600000),
          isRead: j < messageCount - 1,
        },
      });
    }
  }

  // Create Follow Ups
  const followUpData = [
    { title: "Kirim penawaran harga grosir", description: "Budi meminta harga khusus untuk pembelian 100 unit", status: "PENDING", priority: "HIGH", daysFromNow: 1 },
    { title: "Follow up pembayaran", description: "Invoice #001 belum dibayar", status: "OVERDUE", priority: "HIGH", daysFromNow: -2 },
    { title: "Konfirmasi pengiriman", description: "Paket sudah dikirim, konfirmasi ke pelanggan", status: "DONE", priority: "MEDIUM", daysFromNow: -1 },
    { title: "Update katalog produk baru", description: "Kirim katalog produk baru ke Dewi", status: "PENDING", priority: "MEDIUM", daysFromNow: 3 },
    { title: "Respon komplain kualitas", description: "Pelanggan komplain tentang kualitas produk", status: "OVERDUE", priority: "HIGH", daysFromNow: -3 },
    { title: "Jadwalkan demo produk", description: "Atur jadwal demo untuk pelanggan potensial", status: "PENDING", priority: "LOW", daysFromNow: 5 },
    { title: "Kirim ucapan terima kasih", description: "Kirim pesan terima kasih setelah pembelian besar", status: "DONE", priority: "LOW", daysFromNow: -1 },
    { title: "Review pesanan bulanan", description: "Review dan proses pesanan bulanan Agus", status: "PENDING", priority: "MEDIUM", daysFromNow: 2 },
  ];

  for (let i = 0; i < followUpData.length; i++) {
    const fu = followUpData[i];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + fu.daysFromNow);

    await prisma.followUp.create({
      data: {
        customerId: customers[i % customers.length].id,
        title: fu.title,
        description: fu.description,
        dueDate,
        status: fu.status,
        priority: fu.priority,
      },
    });
  }

  // Create Feedback
  for (let i = 0; i < 5; i++) {
    await prisma.feedback.create({
      data: {
        customerId: customers[i].id,
        conversationId: conversations[i].id,
        content: [
          "Pelayanan sangat memuaskan, respon cepat!",
          "Produk sesuai deskripsi, pengiriman tepat waktu",
          "Cukup baik, tapi bisa lebih cepat responnya",
          "Sangat puas dengan kualitas produk",
          "Harga kompetitif dan pelayanan ramah",
        ][i],
        rating: [5, 5, 3, 4, 5][i],
        templateUsed: i < 3 ? "Template Kepuasan" : null,
      },
    });
  }

  // Create Stock Categories
  const catElektronik = await prisma.stockCategory.create({
    data: { name: "Elektronik", description: "Barang-barang elektronik dan gadget", businessId: business.id },
  });

  const catMakanan = await prisma.stockCategory.create({
    data: { name: "Makanan & Minuman", description: "Produk makanan dan minuman", businessId: business.id },
  });

  const catAksesoris = await prisma.stockCategory.create({
    data: { name: "Aksesoris", description: "Aksesoris HP dan komputer", businessId: business.id },
  });

  // Create Stock Items
  const stockItems = await Promise.all([
    prisma.stockItem.create({ data: { name: "Charger USB-C", sku: "ELK-001", categoryId: catElektronik.id, quantity: 45, minThreshold: 10, unit: "pcs", price: 75000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Kabel Data Lightning", sku: "ELK-002", categoryId: catElektronik.id, quantity: 3, minThreshold: 10, unit: "pcs", price: 50000, lastRestocked: new Date(Date.now() - 7 * 86400000) } }),
    prisma.stockItem.create({ data: { name: "Power Bank 10000mAh", sku: "ELK-003", categoryId: catElektronik.id, quantity: 20, minThreshold: 5, unit: "pcs", price: 150000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Earphone Bluetooth", sku: "ELK-004", categoryId: catElektronik.id, quantity: 8, minThreshold: 10, unit: "pcs", price: 120000, lastRestocked: new Date(Date.now() - 14 * 86400000) } }),
    prisma.stockItem.create({ data: { name: "TWS Wireless", sku: "ELK-005", categoryId: catElektronik.id, quantity: 15, minThreshold: 5, unit: "pcs", price: 200000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Mie Instan Box", sku: "MKN-001", categoryId: catMakanan.id, quantity: 50, minThreshold: 20, unit: "box", price: 95000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Air Mineral 600ml", sku: "MKN-002", categoryId: catMakanan.id, quantity: 100, minThreshold: 30, unit: "botol", price: 4000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Kopi Sachet", sku: "MKN-003", categoryId: catMakanan.id, quantity: 2, minThreshold: 15, unit: "pack", price: 35000, lastRestocked: new Date(Date.now() - 10 * 86400000) } }),
    prisma.stockItem.create({ data: { name: "Snack Keripik", sku: "MKN-004", categoryId: catMakanan.id, quantity: 30, minThreshold: 10, unit: "pack", price: 15000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Susu UHT 1L", sku: "MKN-005", categoryId: catMakanan.id, quantity: 25, minThreshold: 10, unit: "kotak", price: 18000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Case HP Universal", sku: "AKS-001", categoryId: catAksesoris.id, quantity: 60, minThreshold: 15, unit: "pcs", price: 25000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Screen Protector", sku: "AKS-002", categoryId: catAksesoris.id, quantity: 4, minThreshold: 10, unit: "pcs", price: 30000, lastRestocked: new Date(Date.now() - 5 * 86400000) } }),
    prisma.stockItem.create({ data: { name: "Pop Socket", sku: "AKS-003", categoryId: catAksesoris.id, quantity: 35, minThreshold: 10, unit: "pcs", price: 15000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Strap HP", sku: "AKS-004", categoryId: catAksesoris.id, quantity: 40, minThreshold: 10, unit: "pcs", price: 10000, lastRestocked: new Date() } }),
    prisma.stockItem.create({ data: { name: "Holder HP Mobil", sku: "AKS-005", categoryId: catAksesoris.id, quantity: 12, minThreshold: 5, unit: "pcs", price: 45000, lastRestocked: new Date() } }),
  ]);

  // Create Stock Movements
  const movementData = [
    { itemIdx: 0, type: "IN", quantity: 50, notes: "Restok dari supplier" },
    { itemIdx: 0, type: "OUT", quantity: 5, notes: "Penjualan harian" },
    { itemIdx: 1, type: "OUT", quantity: 7, notes: "Penjualan online" },
    { itemIdx: 2, type: "IN", quantity: 20, notes: "Stok baru dari distributor" },
    { itemIdx: 3, type: "OUT", quantity: 2, notes: "Pembelian langsung" },
    { itemIdx: 4, type: "IN", quantity: 15, notes: "Restok mingguan" },
    { itemIdx: 5, type: "IN", quantity: 30, notes: "Restok dari agen" },
    { itemIdx: 5, type: "OUT", quantity: 10, notes: "Penjualan grosir" },
    { itemIdx: 6, type: "IN", quantity: 100, notes: "Stok baru" },
    { itemIdx: 7, type: "OUT", quantity: 13, notes: "Hampir habis" },
    { itemIdx: 8, type: "IN", quantity: 30, notes: "Restok bulanan" },
    { itemIdx: 9, type: "OUT", quantity: 5, notes: "Penjualan" },
    { itemIdx: 10, type: "IN", quantity: 60, notes: "Stok baru dari pabrik" },
    { itemIdx: 11, type: "OUT", quantity: 6, notes: "Penjualan promo" },
    { itemIdx: 12, type: "IN", quantity: 35, notes: "Restok" },
    { itemIdx: 13, type: "OUT", quantity: 10, notes: "Penjualan" },
    { itemIdx: 13, type: "IN", quantity: 50, notes: "Restok besar" },
    { itemIdx: 14, type: "IN", quantity: 12, notes: "Stok awal" },
    { itemIdx: 2, type: "OUT", quantity: 3, notes: "Penjualan marketplace" },
    { itemIdx: 4, type: "OUT", quantity: 2, notes: "Penjualan COD" },
  ];

  for (const mov of movementData) {
    await prisma.stockMovement.create({
      data: {
        stockItemId: stockItems[mov.itemIdx].id,
        type: mov.type,
        quantity: mov.quantity,
        notes: mov.notes,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
      },
    });
  }

  // Create Feedback Templates
  await prisma.feedbackTemplate.createMany({
    data: [
      { name: "Template Kepuasan", content: "Terima kasih telah berbelanja di {nama_toko}! Bagaimana pengalaman Anda? Beri rating 1-5.", category: "Kepuasan" },
      { name: "Template Pengiriman", content: "Hai {nama_pelanggan}, paket Anda sudah sampai? Mohon konfirmasi dan beri rating pengiriman.", category: "Pengiriman" },
      { name: "Template Produk", content: "Bagaimana kualitas produk {nama_produk} yang Anda beli? Kami tunggu feedback Anda!", category: "Produk" },
      { name: "Template Layanan", content: "Apakah tim kami sudah membantu menyelesaikan masalah Anda? Beri kami masukan.", category: "Layanan" },
      { name: "Template Rekomendasi", content: "Apakah Anda akan merekomendasikan {nama_toko} ke teman? Beri tahu kami alasannya!", category: "Rekomendasi" },
    ],
  });

  // Create Knowledge Entries
  await prisma.knowledgeEntry.createMany({
    data: [
      {
        title: "Riwayat Chat - Komplain Pengiriman",
        content: "Pelanggan Budi mengeluhkan keterlambatan pengiriman 3 hari. Diselesaikan dengan memberikan voucher diskon 10% untuk pembelian berikutnya.",
        category: "CHAT_HISTORY",
        tags: "komplain,pengiriman,voucher",
        source: "conversation-log",
        isActive: true,
      },
      {
        title: "FAQ - Cara Melacak Pesanan",
        content: "Pelanggan dapat melacak pesanan melalui link yang dikirim via WhatsApp setelah pengiriman. Nomor resi juga tersedia di halaman pesanan.",
        category: "FAQ",
        tags: "tracking,pengiriman,resi",
        source: "knowledge-base",
        isActive: true,
      },
      {
        title: "FAQ - Kebijakan Pengembalian",
        content: "Pengembalian barang dapat dilakukan dalam 7 hari setelah penerimaan. Barang harus dalam kondisi asli dan disertai bukti pembelian.",
        category: "FAQ",
        tags: "retur,pengembalian,kebijakan",
        source: "knowledge-base",
        isActive: true,
      },
      {
        title: "Info Produk - Charger USB-C Fast Charging",
        content: "Charger USB-C 20W mendukung fast charging untuk iPhone 12+ dan Samsung S21+. Garansi 6 bulan. Tersedia warna hitam dan putih.",
        category: "PRODUCT_INFO",
        tags: "charger,usb-c,elektronik",
        source: "product-catalog",
        isActive: true,
      },
      {
        title: "SOP - Penanganan Komplain Pelanggan",
        content: "1. Dengarkan keluhan pelanggan dengan sabar. 2. Minta maaf atas ketidaknyamanan. 3. Identifikasi masalah utama. 4. Tawarkan solusi (refund/penggantian/voucher). 5. Follow up dalam 24 jam.",
        category: "SOP",
        tags: "komplain,prosedur,penanganan",
        source: "internal-doc",
        isActive: true,
      },
      {
        title: "Template Respon - Ucapan Selamat Datang",
        content: "Halo {nama}! Selamat datang di Toko Serba Ada. Ada yang bisa kami bantu hari ini? Kami siap melayani Anda dengan senang hati.",
        category: "RESPONSE_TEMPLATE",
        tags: "greeting,welcome,template",
        source: "template-library",
        isActive: true,
      },
      {
        title: "Template Respon - Konfirmasi Pesanan",
        content: "Terima kasih {nama}! Pesanan Anda #{nomor_pesanan} sudah kami terima dan sedang diproses. Estimasi pengiriman 2-3 hari kerja.",
        category: "RESPONSE_TEMPLATE",
        tags: "konfirmasi,pesanan,template",
        source: "template-library",
        isActive: true,
      },
      {
        title: "Panduan Tone - Komunikasi dengan Pelanggan",
        content: "Gunakan bahasa yang ramah dan profesional. Hindari bahasa terlalu formal. Gunakan emoji secukupnya. Selalu sebut nama pelanggan. Akhiri dengan pertanyaan apakah ada yang bisa dibantu lagi.",
        category: "TONE_GUIDELINE",
        tags: "tone,komunikasi,panduan",
        source: "brand-guide",
        isActive: true,
      },
    ],
  });

  // Create Agent Memory entries
  await prisma.agentMemory.createMany({
    data: [
      {
        tier: "WORKING",
        content: "Sedang menangani percakapan dengan Budi tentang status pengiriman pesanan #12345",
        context: "active-conversation",
        strength: 1.0,
        accessCount: 5,
        decayFactor: 0.9,
        metadata: JSON.stringify({ conversationId: "conv-001", customerId: "budi" }),
      },
      {
        tier: "WORKING",
        content: "Pelanggan Siti bertanya tentang ketersediaan Power Bank 10000mAh warna putih",
        context: "active-conversation",
        strength: 0.9,
        accessCount: 3,
        decayFactor: 0.9,
        metadata: JSON.stringify({ conversationId: "conv-002", customerId: "siti" }),
      },
      {
        tier: "EPISODIC",
        content: "Minggu lalu ada lonjakan komplain pengiriman karena ekspedisi partner mengalami keterlambatan. Masalah sudah diselesaikan dengan switch ke ekspedisi cadangan.",
        context: "incident-summary",
        strength: 0.7,
        accessCount: 8,
        decayFactor: 0.95,
        metadata: JSON.stringify({ week: "2024-W50", type: "incident" }),
      },
      {
        tier: "SEMANTIC",
        content: "Pelanggan yang membeli charger USB-C sering juga membeli kabel data dan case HP. Rata-rata nilai transaksi bundling Rp 150.000.",
        context: "product-knowledge",
        strength: 0.85,
        accessCount: 15,
        decayFactor: 0.98,
        metadata: JSON.stringify({ category: "cross-sell", confidence: 0.85 }),
      },
      {
        tier: "PROCEDURAL",
        content: "Ketika pelanggan komplain tentang barang rusak: 1) Minta foto bukti, 2) Verifikasi dengan data pesanan, 3) Tawarkan penggantian atau refund, 4) Proses dalam 1x24 jam",
        context: "complaint-handling",
        strength: 0.95,
        accessCount: 25,
        decayFactor: 0.99,
        metadata: JSON.stringify({ type: "procedure", domain: "complaint" }),
      },
    ],
  });

  // Create Learning Insights
  await prisma.learningInsight.createMany({
    data: [
      {
        type: "PATTERN",
        content: "Pelanggan yang menghubungi antara jam 19:00-21:00 cenderung memiliki waktu respons yang lebih lama. Disarankan prioritaskan chat di jam tersebut.",
        source: "conversation-analysis",
        confidence: 0.78,
        applied: true,
        appliedAt: new Date(Date.now() - 3 * 86400000),
        impact: "Waktu respons rata-rata turun 15% di jam sibuk",
      },
      {
        type: "IMPROVEMENT",
        content: "Menambahkan link tracking otomatis di pesan konfirmasi pengiriman dapat mengurangi pertanyaan 'dimana pesanan saya' sebesar 40%.",
        source: "feedback-analysis",
        confidence: 0.82,
        applied: false,
        appliedAt: null,
        impact: null,
      },
      {
        type: "SUGGESTION",
        content: "Berdasarkan pola pembelian, pelanggan yang membeli produk elektronik sering kembali dalam 2 minggu untuk aksesoris. Pertimbangkan follow-up otomatis.",
        source: "purchase-pattern",
        confidence: 0.65,
        applied: false,
        appliedAt: null,
        impact: null,
      },
      {
        type: "CORRECTION",
        content: "Respons template untuk komplain pengiriman sebelumnya terlalu formal. Admin mengubah tone menjadi lebih empati dan personal.",
        source: "admin-feedback",
        confidence: 0.9,
        applied: true,
        appliedAt: new Date(Date.now() - 7 * 86400000),
        impact: "Rating kepuasan pelanggan naik dari 3.5 ke 4.2 untuk kasus komplain",
      },
    ],
  });

  // Create Knowledge Graph Entities
  const entityBudi = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Budi Santoso",
      type: "CUSTOMER",
      properties: JSON.stringify({ segment: "loyal", totalOrders: 15, avgOrderValue: 200000 }),
    },
  });

  const entityCharger = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Charger USB-C",
      type: "PRODUCT",
      properties: JSON.stringify({ sku: "ELK-001", price: 75000, category: "Elektronik" }),
    },
  });

  const entityPengiriman = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Keterlambatan Pengiriman",
      type: "ISSUE",
      properties: JSON.stringify({ frequency: "medium", avgResolutionTime: "24h" }),
    },
  });

  const entityVoucher = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Voucher Diskon 10%",
      type: "SOLUTION",
      properties: JSON.stringify({ type: "compensation", validDays: 30 }),
    },
  });

  const entityElektronik = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Elektronik & Gadget",
      type: "TOPIC",
      properties: JSON.stringify({ productCount: 5, popularItems: ["charger", "powerbank", "tws"] }),
    },
  });

  const entityKabelData = await prisma.knowledgeGraphEntity.create({
    data: {
      name: "Kabel Data Lightning",
      type: "PRODUCT",
      properties: JSON.stringify({ sku: "ELK-002", price: 50000, category: "Elektronik" }),
    },
  });

  // Create Knowledge Graph Relations
  await prisma.knowledgeGraphRelation.createMany({
    data: [
      {
        fromEntityId: entityBudi.id,
        toEntityId: entityCharger.id,
        relationType: "PURCHASED",
        weight: 0.9,
        metadata: JSON.stringify({ lastPurchase: "2024-12-01", quantity: 2 }),
      },
      {
        fromEntityId: entityBudi.id,
        toEntityId: entityPengiriman.id,
        relationType: "REPORTED",
        weight: 0.7,
        metadata: JSON.stringify({ date: "2024-12-10", resolved: true }),
      },
      {
        fromEntityId: entityPengiriman.id,
        toEntityId: entityVoucher.id,
        relationType: "RESOLVED_BY",
        weight: 0.85,
        metadata: JSON.stringify({ successRate: 0.8 }),
      },
      {
        fromEntityId: entityCharger.id,
        toEntityId: entityElektronik.id,
        relationType: "BELONGS_TO",
        weight: 1.0,
        metadata: null,
      },
      {
        fromEntityId: entityCharger.id,
        toEntityId: entityKabelData.id,
        relationType: "FREQUENTLY_BOUGHT_WITH",
        weight: 0.75,
        metadata: JSON.stringify({ coOccurrence: 0.6 }),
      },
    ],
  });

  console.log("Seed data berhasil dibuat!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
