import { StoreOrder, StoreSettings } from '../types/store';

export function formatWhatsAppOrderMessage(
  order: StoreOrder,
  settings: StoreSettings,
  lang: 'zh' | 'en' = 'zh'
): string {
  const deliveryMethodLabels: Record<string, string> =
    lang === 'en'
      ? {
          express_delivery: 'Express Delivery (Malaysia-wide)',
          store_pickup: 'Store Pickup (Chai Leng Park)',
          self_collection: 'Collection Point',
        }
      : {
          express_delivery: '快遞宅配到府 (Express Delivery)',
          store_pickup: '門市自取 (Store Pickup)',
          self_collection: '自提點取貨 (Collection Point)',
        };

  const paymentMethodLabels: Record<string, string> = {
    duitnow: 'DuitNow QR',
    tng: "Touch 'n Go eWallet",
    bank_transfer: lang === 'en' ? 'Bank Transfer (Public Bank)' : '銀行轉賬 (Public Bank)',
  };

  const itemsList = order.items
    .map((item, index) => {
      return lang === 'en'
        ? `${index + 1}. *${item.productName}* [${item.unitWeight}]\n   Qty: ${item.quantity} | Unit: RM ${item.price} (Subtotal: RM ${item.price * item.quantity})`
        : `${index + 1}. *${item.productName}* [${item.unitWeight}]\n   數量: ${item.quantity} 包/罐 | 單價: RM ${item.price} (小計: RM ${item.price * item.quantity})`;
    })
    .join('\n');

  const isWebReceiptUrl = Boolean(order.paymentProofUrl && order.paymentProofUrl.startsWith('http'));
  const receiptFooterSection = order.paymentProofUrl
    ? isWebReceiptUrl
      ? lang === 'en'
        ? `\n--------------------------------\n📸 *Payment Receipt Link (Tap to verify):*\n${order.paymentProofUrl}`
        : `\n--------------------------------\n📸 *付款截圖憑證連結 (點擊開啟原圖核對)：*\n${order.paymentProofUrl}`
      : lang === 'en'
      ? `\n--------------------------------\n📸 *Payment Screenshot:* Uploaded in order (please attach image here if needed)`
      : `\n--------------------------------\n📸 *付款截圖:* 已隨單上傳（亦可在此對話附上截圖核對）`
    : '';

  const hasReferrer = Boolean(order.referralCode && order.referralCode.trim());
  const referrerDisplayName = order.referralName && order.referralName !== '自然流量 / 直客'
    ? order.referralName
    : order.referralCode || '';
  const referrerLineEn = hasReferrer
    ? `🤝 *Referrer:* ${referrerDisplayName} (${order.referralCode})\n`
    : '';
  const referrerLineZh = hasReferrer
    ? `🤝 *推薦人:* ${referrerDisplayName} (${order.referralCode})\n`
    : '';

  if (lang === 'en') {
    return `🥓 *【${settings.storeName}】New Order Notification*
_${settings.storeSubname}_
--------------------------------
📋 *Order ID:* #${order.id}
📅 *Order Time:* ${new Date(order.createdAt).toLocaleString('en-MY')}
${referrerLineEn}--------------------------------
👤 *Customer:* ${order.customer.name}
📞 *Phone:* ${order.customer.phone}
${order.customer.email ? `✉️ *Email:* ${order.customer.email}\n` : ''}🚚 *Delivery:* ${deliveryMethodLabels[order.customer.deliveryMethod] || order.customer.deliveryMethod}
📍 *Address:* ${order.customer.address}${order.customer.postalCode ? ` (${order.customer.postalCode})` : ''}
💳 *Payment:* ${paymentMethodLabels[order.customer.paymentMethod] || order.customer.paymentMethod}
${order.customer.notes ? `📝 *Notes:* ${order.customer.notes}\n` : ''}--------------------------------
📦 *Order Items:*
${itemsList}
--------------------------------
💵 *Subtotal:* RM ${order.subtotal}
🚚 *Shipping:* ${order.shippingFee === 0 ? 'Free Shipping' : `RM ${order.shippingFee}`}
${order.appliedPromoCode ? `🎟️ *Promo Code:* ${order.appliedPromoCode}\n` : ''}${order.discount > 0 ? `🏷️ *Discount:* -RM ${order.discount}\n` : ''}${order.freeGiftName ? `🎁 *Free Gift:* ${order.freeGiftName}\n` : ''}💰 *Total Paid:* *RM ${order.total}*
--------------------------------
Thank you for supporting ${settings.storeName}! Madam Heng will verify your payment receipt and arrange fresh charcoal-grilled dispatch shortly.${receiptFooterSection}`;
  }

  return `🥓 *【${settings.storeName}】新訂單通知*
_${settings.storeSubname}_
--------------------------------
📋 *訂單編號:* #${order.id}
📅 *下單時間:* ${new Date(order.createdAt).toLocaleString('zh-MY')}
${referrerLineZh}--------------------------------
👤 *顧客姓名:* ${order.customer.name}
📞 *聯絡電話:* ${order.customer.phone}
${order.customer.email ? `✉️ *電子郵件:* ${order.customer.email}\n` : ''}🚚 *配送方式:* ${deliveryMethodLabels[order.customer.deliveryMethod] || order.customer.deliveryMethod}
📍 *收件地址:* ${order.customer.address}${order.customer.postalCode ? ` (${order.customer.postalCode})` : ''}
💳 *付款方式:* ${paymentMethodLabels[order.customer.paymentMethod] || order.customer.paymentMethod}
${order.customer.notes ? `📝 *訂單備註:* ${order.customer.notes}\n` : ''}--------------------------------
📦 *訂購商品明細:*
${itemsList}
--------------------------------
💵 *商品小計:* RM ${order.subtotal}
🚚 *快遞運費:* ${order.shippingFee === 0 ? '全馬免運 (Free Shipping)' : `RM ${order.shippingFee}`}
${order.appliedPromoCode ? `🎟️ *使用優惠碼:* ${order.appliedPromoCode}\n` : ''}${order.discount > 0 ? `🏷️ *折扣優惠:* -RM ${order.discount}\n` : ''}${order.freeGiftName ? `🎁 *隨單贈品:* ${order.freeGiftName}\n` : ''}💰 *實付總額:* *RM ${order.total}*
--------------------------------
謝謝您的支持！老闆娘王銮娇將盡快核對您的付款截圖並安排新鮮炭烤出貨。如有任何問題請直接回覆此 WhatsApp！${receiptFooterSection}`;
}

export function generateWhatsAppLink(
  order: StoreOrder,
  settings: StoreSettings,
  lang: 'zh' | 'en' = 'zh'
): string {
  const message = formatWhatsAppOrderMessage(order, settings, lang);
  const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // Normalize Malaysian local numbers (e.g. 0123456789 -> 60123456789)
  if (digits.startsWith('0')) {
    return `60${digits.slice(1)}`;
  }
  return digits;
}

export function formatTelHref(phone: string): string {
  const normalized = formatWhatsAppPhone(phone || '60124947842');
  return normalized ? `tel:+${normalized}` : 'tel:+60124947842';
}

export function formatDisplayPhone(phone: string): string {
  const normalized = formatWhatsAppPhone(phone || '60124947842');
  if (!normalized) return '+60 12-494 7842';
  // Format Malaysian mobile numbers neatly: +60 12-494 7842 or +60 11-2916 3398
  if (normalized.startsWith('60') && normalized.length === 11) {
    return `+60 ${normalized.slice(2, 4)}-${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }
  if (normalized.startsWith('60') && normalized.length === 12) {
    return `+60 ${normalized.slice(2, 4)}-${normalized.slice(4, 8)} ${normalized.slice(8)}`;
  }
  return `+${normalized}`;
}

export function formatShippedFollowUpMessage(
  order: StoreOrder,
  settings: StoreSettings,
  trackingOverride?: string
): string {
  const tracking = (trackingOverride ?? order.trackingNumber ?? '').trim();
  const itemsSummary = order.items
    .map((item) => `• ${item.productName} (${item.unitWeight}) × ${item.quantity}`)
    .join('\n');

  const trackingLine = tracking
    ? `📦 *快遞追蹤單號 (Tracking No.):* ${tracking}`
    : `📦 *快遞追蹤單號 (Tracking No.):* 待更新（我們將盡快補上最新物流單號）`;

  return `您好 ${order.customer.name}！我們是【${settings.storeName}】🔥

您的訂單 *#${order.id}* 已經完成炭烤包裝並*正式發貨 (Shipped)* 囉！

${trackingLine}
📍 *收件地址:* ${order.customer.address}${order.customer.postalCode ? ` (${order.customer.postalCode})` : ''}
🛍️ *訂購商品:*
${itemsSummary}

您可使用上方單號查詢最新配送進度。收到包裹後如有任何問題，或想再次回購傳統炭烤肉乾與年餅，歡迎隨時回覆此 WhatsApp 訊息聯繫我們！感謝您的支持 🙏`;
}

export function formatOrderFollowUpMessage(
  order: StoreOrder,
  settings: StoreSettings,
  trackingOverride?: string
): string {
  if (order.status === 'shipped') {
    return formatShippedFollowUpMessage(order, settings, trackingOverride);
  }

  const tracking = (trackingOverride ?? order.trackingNumber ?? '').trim();
  const itemsSummary = order.items
    .map((item) => `• ${item.productName} (${item.unitWeight}) × ${item.quantity}`)
    .join('\n');

  const statusPrompt =
    order.status === 'confirmed'
      ? '已經確認付款，目前正為您新鮮炭烤備貨中 🔥'
      : order.status === 'completed'
      ? '已完成配送，希望您喜歡我們的傳統炭烤美味！'
      : '我們已收到您的訂單，目前正在核對與安排處理中';

  const trackingSection = tracking
    ? `\n📦 *快遞追蹤單號 (Tracking No.):* ${tracking}`
    : '';

  return `您好 ${order.customer.name}！我們是【${settings.storeName}】。

關於您的訂單 *#${order.id}*（實付金額 RM ${order.total}），${statusPrompt}${trackingSection}
📍 *收件地址:* ${order.customer.address}${order.customer.postalCode ? ` (${order.customer.postalCode})` : ''}
🛍️ *訂購商品:*
${itemsSummary}

如有任何需要調整或疑問，歡迎隨時回覆此 WhatsApp 訊息聯繫我們 🙏`;
}

export function generateShippedFollowUpWhatsAppLink(
  order: StoreOrder,
  settings: StoreSettings,
  customMessage?: string,
  trackingOverride?: string
): string {
  const cleanPhone = formatWhatsAppPhone(order.customer.phone);
  const message =
    customMessage !== undefined
      ? customMessage
      : formatOrderFollowUpMessage(order, settings, trackingOverride);
  const encodedText = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
}

