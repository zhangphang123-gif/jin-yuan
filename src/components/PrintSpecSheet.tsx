import React from 'react';
import { ProductItem } from '../data/products';
import { QuoteItem, BuyerInfo } from '../types/quote';

interface PrintSpecSheetProps {
  mode: 'product-spec' | 'wholesale-rfq' | null;
  product: ProductItem | null;
  quoteItems: QuoteItem[];
  products: ProductItem[];
  buyerInfo: BuyerInfo | null;
  onClose: () => void;
}

export const PrintSpecSheet: React.FC<PrintSpecSheetProps> = ({
  mode,
  product,
  quoteItems,
  products,
  buyerInfo,
  onClose,
}) => {
  if (!mode) return null;

  const currentDate = new Date().toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const stagedProducts = quoteItems.map((item) => {
    const p = products.find((prod) => prod.id === item.productId);
    return {
      ...item,
      product: p,
    };
  }).filter((item) => item.product !== undefined);

  return (
    <div className="fixed inset-0 z-50 bg-white text-stone-900 overflow-y-auto p-8 sm:p-12 print:p-0">
      
      {/* Screen Control Bar (Hidden during actual print) */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between no-print bg-stone-100 p-4 rounded-xl border border-stone-300">
        <div>
          <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
            列印與 PDF 導出預覽 (Print / Export Preview)
          </span>
          <span className="text-xs text-stone-500">
            請點擊「立即列印」並在系統對話框選擇「另存為 PDF」或實體印表機。
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-colors cursor-pointer"
          >
            立即列印 / 存為 PDF
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded-md hover:bg-stone-50 transition-colors cursor-pointer"
          >
            關閉預覽
          </button>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT CONTAINER */}
      <div className="max-w-4xl mx-auto bg-white p-8 border border-stone-200 print:border-none print:p-0 font-sans">
        
        {/* Document Header */}
        <div className="border-b-2 border-stone-900 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-serif-brand text-2xl font-bold tracking-tight text-stone-950">
              錦源企業（香港）有限公司
            </h1>
            <p className="text-xs font-mono text-stone-600 tracking-wider">
              KAM YUEN ENTERPRISE (HK) CO., LIMITED · EST. 1968
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              香港九龍官塘榮業街 · 官方網址: www.comein.com.hk · 專業餐飲及商業批發
            </p>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="font-mono font-bold text-stone-900">
              {mode === 'product-spec' ? 'PRODUCT SPECIFICATION SHEET (TDS)' : 'OFFICIAL WHOLESALE RFQ INQUIRY'}
            </div>
            <div className="text-stone-500">文件日期: {currentDate}</div>
            <div className="text-stone-500 font-mono">
              REF: {mode === 'product-spec' ? `SPEC-${product?.sku}` : `RFQ-KY-${Math.floor(Date.now() / 1000)}`}
            </div>
          </div>
        </div>

        {/* MODE 1: PRODUCT SPECIFICATION SHEET */}
        {mode === 'product-spec' && product && (
          <div className="space-y-6 text-xs">
            
            <div className="bg-stone-50 p-4 rounded border border-stone-200">
              <span className="text-[11px] font-mono font-bold text-stone-500 block">ITEM IDENTIFIER</span>
              <h2 className="text-xl font-serif-brand font-bold text-stone-950 mt-1">
                {product.nameZh}
              </h2>
              <p className="text-stone-600 font-mono text-xs">{product.nameEn}</p>
              <div className="flex gap-4 mt-2 text-stone-500">
                <span>貨號 (SKU): <strong>{product.sku}</strong></span>
                <span>品類: <strong>{product.categoryLabelZh}</strong></span>
                <span>產地: <strong>{product.origin}</strong></span>
              </div>
            </div>

            {/* Spec Table */}
            <table className="w-full border-collapse border border-stone-300">
              <tbody>
                <tr className="border-b border-stone-200">
                  <td className="w-1/3 p-2.5 font-semibold bg-stone-50 border-r border-stone-200">標準零售單件規格</td>
                  <td className="p-2.5 font-mono">{product.unitNetWeight}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">商業整箱裝箱率</td>
                  <td className="p-2.5 font-mono">{product.casePacking}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">外箱尺寸 (L × W × H)</td>
                  <td className="p-2.5 font-mono">{product.cartonDimensions}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">保質期 (Shelf Life)</td>
                  <td className="p-2.5 font-mono">{product.shelfLife}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">儲存條件 (Storage)</td>
                  <td className="p-2.5">{product.storageInstructions}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">質量安全認證體系</td>
                  <td className="p-2.5">{product.certifications.join(', ')}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">過敏原信息 (Allergens)</td>
                  <td className="p-2.5 font-semibold text-stone-800">{product.allergens.join(', ')}</td>
                </tr>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">配料清單 (Ingredients)</td>
                  <td className="p-2.5 leading-relaxed">
                    <div>{product.ingredientsZh}</div>
                    <div className="text-stone-500 italic mt-0.5">{product.ingredientsEn}</div>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-stone-50 border-r border-stone-200">風味筆記與特徵</td>
                  <td className="p-2.5">{product.flavorProfile.join(' · ')}</td>
                </tr>
              </tbody>
            </table>

            {/* Chef Pairing Guideline on Spec */}
            <div className="p-4 border border-stone-300 rounded bg-stone-50/50 space-y-2">
              <h3 className="font-semibold text-stone-900 border-b border-stone-200 pb-1">
                推薦餐飲主廚應用建議 (Culinary Application Recommendation)
              </h3>
              <p className="font-medium text-stone-800">
                推薦菜品：{product.recipePairing.dishNameZh} ({product.recipePairing.dishNameEn})
              </p>
              <p className="text-stone-600">
                調味黃金比例：{product.recipePairing.ratioTip}
              </p>
              <p className="text-stone-500 italic text-[11px]">
                烹飪秘訣：{product.recipePairing.chefSecret}
              </p>
            </div>

          </div>
        )}

        {/* MODE 2: WHOLESALE RFQ INQUIRY SHEET */}
        {mode === 'wholesale-rfq' && (
          <div className="space-y-6 text-xs">
            
            {/* Buyer Profile Box */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-300 rounded">
              <div>
                <span className="text-stone-400 font-mono block text-[10px]">CLIENT / BUYER DETAILS</span>
                <div className="font-bold text-sm text-stone-950 mt-1">
                  {buyerInfo?.companyName || '（未提供公司名稱）'}
                </div>
                <div className="text-stone-600 mt-1">
                  聯絡人: {buyerInfo?.contactPerson || '未填寫'}
                </div>
                <div className="text-stone-600">
                  電話: {buyerInfo?.phone || '未填寫'}
                </div>
                <div className="text-stone-600">
                  電郵: {buyerInfo?.email || '未填寫'}
                </div>
              </div>

              <div>
                <span className="text-stone-400 font-mono block text-[10px]">DELIVERY & PROCUREMENT TERMS</span>
                <div className="text-stone-600 mt-1">
                  經營型態: {buyerInfo?.businessType}
                </div>
                <div className="text-stone-600">
                  指定目的地: {buyerInfo?.destinationCity || '標準倉儲交割'}
                </div>
                <div className="text-stone-600">
                  特殊備註: {buyerInfo?.notes || '無特殊需求'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full border-collapse border border-stone-300">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 text-left">
                  <th className="p-2.5 font-semibold">項次</th>
                  <th className="p-2.5 font-semibold">貨號 SKU</th>
                  <th className="p-2.5 font-semibold">商品名稱與描述</th>
                  <th className="p-2.5 font-semibold">包裝規格</th>
                  <th className="p-2.5 font-semibold text-right">詢價數量</th>
                </tr>
              </thead>
              <tbody>
                {stagedProducts.map((item, idx) => (
                  <tr key={idx} className="border-b border-stone-200">
                    <td className="p-2.5 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold">{item.product?.sku}</td>
                    <td className="p-2.5">
                      <div className="font-bold">{item.product?.nameZh}</div>
                      <div className="text-stone-500 text-[11px]">{item.product?.nameEn}</div>
                    </td>
                    <td className="p-2.5 font-mono">
                      {item.packType === 'case' ? item.product?.casePacking : item.product?.unitNetWeight}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-right">
                      {item.quantity} {item.packType === 'case' ? '箱 (Cartons)' : '件 (Units)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary & Terms */}
            <div className="p-4 border border-stone-200 rounded text-stone-600 space-y-1.5 text-[11px]">
              <div className="font-semibold text-stone-900">採購須知與商業條款：</div>
              <p>1. 本詢價單僅作為商業規格與大宗批發採購意向書，正式報價單（包含運費、關稅及批量折扣）將由錦源業務經理於 24 小時內回覆。</p>
              <p>2. 標準起訂量 (MOQ) 依個別品項規定，支持拼箱與混合整櫃出貨 (FCL / LCL)。</p>
              <p>3. 所有食品批次均附帶出廠微生物及理化檢驗報告 (COA) 與出入境檢驗檢疫證明。</p>
            </div>

          </div>
        )}

        {/* Document Footer & Signature block */}
        <div className="mt-12 pt-6 border-t border-stone-300 flex justify-between items-end text-xs text-stone-500">
          <div>
            <p>錦源企業（香港）有限公司 授權專用章</p>
            <p className="font-mono text-[10px] mt-1">QUALITY ASSURANCE & COMMERCIAL SALES DEPT.</p>
          </div>
          <div className="text-right border-t border-stone-400 pt-1 w-48">
            <p className="text-[11px]">客戶簽署 / 商業蓋章 Confirmation</p>
          </div>
        </div>

      </div>

    </div>
  );
};
