import React, { useState } from 'react';
import { StoreOrder, CustomerProfile, StoreSettings } from '../../types/store';
import { Search, MessageCircle, ShoppingBag, Eye, User, Calendar } from 'lucide-react';
import { formatWhatsAppPhone } from '../../utils/whatsapp';

interface CustomerListProps {
  orders: StoreOrder[];
  settings: StoreSettings;
}

export const CustomerList: React.FC<CustomerListProps> = ({ orders, settings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Derive customers list from orders
  const customers: CustomerProfile[] = React.useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    orders.forEach((o) => {
      const key = o.customer.phone || o.customer.name;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: `cust-${key.replace(/[^a-zA-Z0-9]/g, '')}`,
          name: o.customer.name,
          phone: o.customer.phone,
          email: o.customer.email,
          firstOrderDate: o.createdAt,
          lastOrderDate: o.createdAt,
          totalOrders: 1,
          totalSpent: o.total,
          address: o.customer.address,
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += o.total;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
          existing.address = o.customer.address;
        }
        if (new Date(o.createdAt) < new Date(existing.firstOrderDate)) {
          existing.firstOrderDate = o.createdAt;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
  });

  const buildWhatsAppHref = (phone: string, name: string) => {
    const cleanPhone = formatWhatsAppPhone(phone);
    const msg = encodeURIComponent(
      `您好 ${name}！我們是【${settings.storeName}】客服，感謝您對我們傳統炭烤肉乾、酥香肉鬆與手工年餅的支持！如有任何加購或送禮訂購問題，歡迎隨時與我們聯絡。`
    );
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  };

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) => o.customer.phone === selectedCustomer.phone || o.customer.name === selectedCustomer.name
      )
    : [];

  return (
    <div className="space-y-6">
      
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-brand text-xl font-bold text-stone-900 dark:text-stone-100">
            顧客名冊與購買記錄 (Customers & Purchase Records)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            顧客下單時自動儲存建檔 · 共 {customers.length} 位客戶資料
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋顧客姓名、手機或電郵..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-800"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-semibold">
                <th className="py-3 px-4">顧客姓名</th>
                <th className="py-3 px-4">WhatsApp / 手機</th>
                <th className="py-3 px-4">配送常住地址</th>
                <th className="py-3 px-4 text-center">累計訂單數</th>
                <th className="py-3 px-4 text-right">累計消費總額</th>
                <th className="py-3 px-4">最近下單日期</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    暫無符合條件的顧客記錄
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 dark:text-stone-100">
                        {cust.name}
                      </div>
                      {cust.email && (
                        <div className="text-[11px] text-stone-400">{cust.email}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-stone-700 dark:text-stone-300">
                      {cust.phone}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 max-w-xs truncate">
                      {cust.address}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-900 dark:text-stone-100">
                      {cust.totalOrders} 筆
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-800 dark:text-amber-400">
                      RM {cust.totalSpent}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(cust.lastOrderDate).toLocaleDateString('zh-MY')}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={buildWhatsAppHref(cust.phone, cust.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>歷次訂單</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="font-serif-brand text-lg font-bold">
                  {selectedCustomer.name} 的歷史購買記錄
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedCustomer.phone} · 累計消費 RM {selectedCustomer.totalSpent}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 text-xs">
              {customerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 space-y-1.5"
                >
                  <div className="flex justify-between font-bold">
                    <span className="font-mono">#{ord.id}</span>
                    <span className="text-amber-800 dark:text-amber-400 font-mono">RM {ord.total}</span>
                  </div>
                  <div className="text-[11px] text-stone-400">
                    下單時間: {new Date(ord.createdAt).toLocaleString('zh-MY')} · 狀態: {ord.status.toUpperCase()}
                  </div>
                  <div className="text-stone-700 dark:text-stone-300">
                    {ord.items.map((it) => `${it.productName} × ${it.quantity}`).join('，')}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
