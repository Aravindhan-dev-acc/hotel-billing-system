export type UserRole = 'ADMIN' | 'STAFF' | 'OWNER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active?: number;
  created_at?: string;
}

export interface Item {
  id: number;
  item_code: string;
  name: string;
  category: string;
  price: number;
  tax_percent: number;
  is_available: number;
  created_at?: string;
  updated_at?: string;
}

export interface BillLineItem {
  id?: number;
  item_id: number;
  item_name: string;
  item_code: string;
  unit_price: number;
  quantity: number;
  tax_percent: number;
  line_total: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  room_number: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OTHER';
  payment_status: 'PAID' | 'PENDING' | 'CANCELLED';
  created_by: number;
  created_at: string;
  items?: BillLineItem[];
}

export type LicenseStatus = 'TRIAL_ACTIVE' | 'ACTIVE' | 'EXPIRED' | 'BLOCKED';

export interface LicenseState {
  status: LicenseStatus;
  reason?: string;
  licenseKey?: string | null;
  activationDate?: string | null;
  expiryDate?: string | null;
  trialStartDate?: string;
  trialBillLimit?: number;
  trialBillCount?: number;
  customerName?: string | null;
  daysRemaining?: number;
  billsRemaining?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface HotelSettings {
  hotel_name: string;
  hotel_address: string;
  hotel_phone: string;
  hotel_email: string;
  hotel_gstin: string;
  hotel_logo_url: string;
  currency_symbol: string;
  default_tax_percent: string;
  invoice_prefix: string;
  invoice_footer_note: string;
  receipt_paper_size: '80mm' | 'A4';
  printer_name: string;
  [key: string]: string;
}
