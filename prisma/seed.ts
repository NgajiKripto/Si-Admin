import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
