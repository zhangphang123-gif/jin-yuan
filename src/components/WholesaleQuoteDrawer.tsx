import React, { useState } from 'react';
import { QuoteItem, BuyerInfo } from '../types/quote';
import { ProductItem } from '../data/products';
import {
  X,
  Trash2,
  Printer,
  Copy,
  Check,
  Send,
  Building2,
  PackageCheck,
  ArrowRight
} from 'lucide-react';

interface WholesaleQuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quoteItems: QuoteItem[];
  products: ProductItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdatePackType: (productId: string, packType: 'unit' | 'case') => void;
  onRemoveItem: (productId: string) => void;
  onClearAll: () => void;
  onPrintQuote: (buyer: BuyerInfo) => void;
}

export const WholesaleQuoteDrawer: React.FC<WholesaleQuoteDrawerProps> = ({
  isOpen,
  onClose,
  quoteItems,
  products,
  onUpdateQuantity,
  onUpdatePackType,
  onRemoveItem,
  onClearAll,
  onPrintQuote,
}) => {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: '餐飲酒樓 / 餐廳 (Restaurant)',
    destinationCity: '香港 / 廣東 (Hong Kong / GD)',
    targetDeliveryDate: '',
    notes: '',
  });

  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Match items with products
  const stagedProducts = quoteItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      product,
    };
  }).filter((item) => item.product !== undefined);

  const totalCartons = stagedProducts.reduce((acc, item) => {
    return acc + (item.packType === 'case' ? item.quantity : Math.ceil(item.quantity / 24));
  }, 0);

  const handleCopySummary = () => {
    const text = `【錦源 KAM YUEN 商業採購詢價單】
公司名稱: ${buyerInfo.companyName || '未填寫'}
聯絡人: ${buyerInfo.contactPerson || '未填寫'}
電話: ${buyerInfo.phone || '未填寫'}
送貨地點: ${buyerInfo.destinationCity}
----------------------------------------
詢價商品清單:
${stagedProducts.map((item, idx) => `${idx + 1}. [${item.product?.sku}] ${item.product?.nameZh} × ${item.quantity} ${item.packType === 'case' ? '箱 (Cartons)' : '件 (Units)'}`).join('\n')}
----------------------------------------
預估總箱數: 約 ${totalCartons} 箱
備註說明: ${buyerInfo.notes || '無特殊需求'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/50 backdrop-blur-xs no-print">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
            <div>
              <h2 className="font-serif-brand text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>批發採購詢價單</span>
                <span className="text-xs font-mono font-normal text-stone-500">
                  (RFQ Basket)
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                已選 {stagedProducts.length} 項品類 · 預估約 {totalCartons} 箱貨量
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {stagedProducts.length === 0 ? (
              <div className="py-16 text-center text-stone-400 dark:text-stone-500 space-y-3">
                <Building2 className="w-12 h-12 mx-auto stroke-1 opacity-50" />
                <p className="text-sm">目前詢價清單尚無任何商品</p>
                <p className="text-xs text-stone-400">
                  請至目錄瀏覽商品並點選「加詢價」以組裝商業報價單
                </p>
              </div>
            ) : submitted ? (
              <div className="py-12 px-4 text-center space-y-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
                <PackageCheck className="w-14 h-14 mx-auto text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-serif-brand text-xl font-bold text-stone-900 dark:text-stone-100">
                  詢價單建立完成！
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  感謝您的採購需求，編號 <span className="font-mono font-bold">RFQ-KY-{Math.floor(100000 + Math.random() * 900000)}</span> 已經生成。
                  您可點擊下方按鈕直接導出官方 PDF 或列印紙本。
                </p>

                <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                  <button
                    onClick={() => onPrintQuote(buyerInfo)}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>列印 / 存為正式 PDF 報價單</span>
                  </button>
                  <button
                    onClick={handleCopySummary}
                    className="w-full py-2 px-4 text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已複製內容！' : '複製文字清單'}</span>
                  </button>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-stone-400 hover:text-stone-700 underline pt-2"
                  >
                    返回編輯品項
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Staged Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 pb-1 border-b border-stone-200 dark:border-stone-800">
                    <span>採購品項明細 (Selected Line Items)</span>
                    <button
                      onClick={onClearAll}
                      className="text-stone-400 hover:text-red-600 transition-colors text-[11px] cursor-pointer"
                    >
                      清空清單
                    </button>
                  </div>

                  {stagedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded">
                            {item.product?.sku}
                          </span>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {item.product?.nameZh}
                          </span>
                        </div>

                        {/* Packaging Tier Switcher */}
                        <div className="flex items-center gap-3 pt-1 text-xs">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`pack-${item.productId}`}
                              checked={item.packType === 'case'}
                              onChange={() => onUpdatePackType(item.productId, 'case')}
                              className="text-stone-900"
                            />
                            <span className="text-stone-700 dark:text-stone-300">整箱 (Case)</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`pack-${item.productId}`}
                              checked={item.packType === 'unit'}
                              onChange={() => onUpdatePackType(item.productId, 'unit')}
                              className="text-stone-900"
                            />
                            <span className="text-stone-700 dark:text-stone-300">零售件 (Unit)</span>
                          </label>
                        </div>

                        <div className="text-[11px] text-stone-400">
                          {item.packType === 'case'
                            ? `包裝：${item.product?.casePacking}`
                            : `規格：${item.product?.unitNetWeight}`}
                        </div>
                      </div>

                      {/* Quantity & Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-900">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="px-2 py-1 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-1 text-xs font-mono font-semibold text-stone-900 dark:text-stone-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="px-2 py-1 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="移除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Buyer / Procurement Details Form */}
                <form onSubmit={handleSubmitInquiry} className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    採購單位資料 (Procurement Details)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-500 mb-1">公司名稱 / 餐廳名 *</label>
                      <input
                        type="text"
                        required
                        value={buyerInfo.companyName}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, companyName: e.target.value })}
                        placeholder="例：錦繡海鮮酒家"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-500 mb-1">採購聯絡人 *</label>
                      <input
                        type="text"
                        required
                        value={buyerInfo.contactPerson}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, contactPerson: e.target.value })}
                        placeholder="例：陳總廚 / 張經理"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-500 mb-1">公務電郵 *</label>
                      <input
                        type="email"
                        required
                        value={buyerInfo.email}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                        placeholder="procurement@restaurant.com"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-500 mb-1">聯絡電話 / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={buyerInfo.phone}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                        placeholder="+852 9123 4567"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-stone-500 mb-1">配送目的地 / 港口</label>
                      <input
                        type="text"
                        value={buyerInfo.destinationCity}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, destinationCity: e.target.value })}
                        placeholder="例：香港葵涌倉庫 / 深圳鹽田 / 新加坡"
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-stone-500 mb-1">特殊訂製或商標需求 (OEM / Private Label Notes)</label>
                      <textarea
                        rows={2}
                        value={buyerInfo.notes}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, notes: e.target.value })}
                        placeholder="如有特殊分裝、大宗桶裝或貼牌要求請在此說明..."
                        className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>確認並生成官方詢價單 (Generate RFQ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintQuote(buyerInfo)}
                      className="py-3 px-3.5 text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center gap-1.5"
                      title="快速列印"
                    >
                      <Printer className="w-4 h-4" />
                      <span>列印</span>
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
