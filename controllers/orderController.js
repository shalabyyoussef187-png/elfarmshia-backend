const prisma = require('../utils/prisma');
const pusher = require('../Pusher');
const { trackAction, getOrCreateSessionId } = require('../utils/trackVisit');
const { sendTelegramMessage } = require('../utils/telegram');

// ✅ إنشاء أوردر
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      addressText,
      lat,
      lng,
      productId,
      quantity
    } = req.body;

    // 🔍 تأكد إن المنتج موجود ومتاح بكمية تكفي
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'المنتج مش موجود' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'الكمية المطلوبة غير متوفرة' });
    }


    // ✅ إنشاء الأوردر وتحديث كمية المنتج
    const newQuantity = product.quantity - quantity;
    const isAvailable = newQuantity > 0 ? product.isAvailable : false;

    const [order, updatedProduct] = await prisma.$transaction([
      prisma.order.create({
        data: {
          customerName,
          phone,
          addressText,
          lat,
          lng,
          productId,
          productName: product.name,
          quantity,
        },
        include: { product: { select: { id: true, name: true, price: true } } }
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          quantity: newQuantity,
          isAvailable: isAvailable
        }
      })
    ]);

    // Track order creation as a business action in background.
    const sessionId = getOrCreateSessionId(req, res);
    trackAction({
      req,
      actionType: 'create_order',
      resourceId: String(order.id),
      resourceType: 'order',
      sessionId,
      properties: {
        productId: String(product.id),
        quantity,
      },
    });

    try {
      await pusher.trigger('pharma-channel', 'order-created', {
        message: `🛒 أوردر جديد: ${product.name}`,
        data: order,
        timestamp: new Date(),
      });
    } catch (pusherErr) {
      console.error('Pusher trigger failed:', pusherErr.message);
    }

    // Send Telegram Notification
    const telegramMessage = `
🛒 <b>أوردر جديد !</b>

👤 <b>العميل:</b> ${customerName}
📞 <b>الموبايل:</b> ${phone}
📍 <b>العنوان:</b> ${addressText}
🗺️ <b>الموقع (GPS):</b> <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}">رابط جوجل ماب</a>
📦 <b>المنتج:</b> ${product.name}
🔢 <b>الكمية:</b> ${quantity}
💰 <b>السعر:</b> ${product.price}
💵 <b>الإجمالي:</b> ${product.price * quantity}
    `;
    await sendTelegramMessage(telegramMessage);

    res.status(201).json({ success: true, data: order });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// ✅ GET كل الأوردرات (للأدمن)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { product: { select: { id: true, name: true, price: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: orders });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ GET أوردر واحد
exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { product: { select: { id: true, name: true, price: true } } }
    });

    if (!order) {
      return res.status(404).json({ message: 'الأوردر مش موجود' });
    }

    res.json({ success: true, data: order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ تحديث status (للأدمن)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // جلب الأوردر الحالي أولاً
    const existingOrder = await prisma.order.findUnique({
      where: { id: req.params.id }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'الأوردر مش موجود' });
    }

    // تحديث الأوردر
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { product: { select: { id: true, name: true } } }
    });

    // الحالات اللي بتعتبر إن الأوردر تم تأكيده أو تسليمه
    const successStatuses = ['confirmed', 'delivered', 'تم التسليم', 'shipped'];
    
    // تم إلغاء خصم الكمية هنا لأنها بتنخصم تلقائي عند إنشاء الأوردر


    res.json({ success: true, data: order });

  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'الأوردر مش موجود' });
    }
    res.status(500).json({ message: err.message });
  }
};



// ✅ حذف أوردر
exports.deleteOrder = async (req, res) => {
  try {
    await prisma.order.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'تم حذف الأوردر' });

  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'الأوردر مش موجود' });
    }
    res.status(500).json({ message: err.message });
  }
};