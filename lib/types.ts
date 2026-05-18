export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'caissier' | 'gestionnaire'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  purchasePrice: number
  sellingPrice: number
  quantity: number
  minStock: number
  unit: string
  barcode?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'mobile' | 'card' | 'credit'
  customerId?: string
  customerName?: string
  userId: string
  userName: string
  createdAt: string
  invoiceNumber: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  userId: string
  userName: string
  createdAt: string
}

export interface ExpenseCategory {
  id: string
  name: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  balance: number
  createdAt: string
}

export interface CashRegister {
  id: string
  openingBalance: number
  closingBalance?: number
  totalSales: number
  totalExpenses: number
  openedAt: string
  closedAt?: string
  userId: string
  userName: string
  status: 'open' | 'closed'
}

export interface StoreInfo {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
}

export interface DashboardStats {
  todaySales: number
  todayExpenses: number
  todayProfit: number
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
  cashInRegister: number
}
