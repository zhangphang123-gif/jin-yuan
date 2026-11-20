export interface QuoteItem {
  productId: string;
  quantity: number;
  packType: 'unit' | 'case';
  customNotes?: string;
}

export interface BuyerInfo {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  destinationCity: string;
  targetDeliveryDate: string;
  notes: string;
}
