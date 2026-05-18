'use client'

import type {
  Product,
  Category,
  Sale,
  Expense,
  ExpenseCategory,
  Customer,
  CashRegister,
  StoreInfo,
} from './types'

const STORAGE_KEYS = {
  products: 'mbongo_products',
  categories: 'mbongo_categories',
  sales: 'mbongo_sales',
  expenses: 'mbongo_expenses',
  expenseCategories: 'mbongo_expense_categories',
  customers: 'mbongo_customers',
  cashRegisters: 'mbongo_cash_registers',
  storeInfo: 'mbongo_store_info',
}

// In-memory cache: avoids re-parsing localStorage on every read.
// Invalidated on every write to that key.
const _cache: Record<string, unknown> = {}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  if (Object.prototype.hasOwnProperty.call(_cache, key)) return _cache[key] as T
  const raw = localStorage.getItem(key)
  const value: T = raw ? JSON.parse(raw) : defaultValue
  _cache[key] = value
  return value
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  _cache[key] = value
  localStorage.setItem(key, JSON.stringify(value))
}

export function initializeStore() {
  const categories = getItem<Category[]>(STORAGE_KEYS.categories, [])
  if (categories.length === 0) {
    const defaultCategories: Category[] = [
      { id: '1', name: 'Boissons', description: 'Boissons et eaux' },
      { id: '2', name: 'Vivres', description: 'Riz, farine, huile, mil…' },
      { id: '3', name: 'Épicerie', description: 'Conserves, condiments, sucre' },
      { id: '4', name: 'Hygiène', description: 'Savon, shampoing, désinfectant' },
      { id: '5', name: 'Cosmétiques', description: 'Produits de beauté' },
      { id: '6', name: 'Électronique', description: 'Téléphones, accessoires' },
      { id: '7', name: 'Textile', description: 'Vêtements et tissus' },
      { id: '8', name: 'Autres', description: 'Produits divers' },
    ]
    setItem(STORAGE_KEYS.categories, defaultCategories)
  }

  const expenseCategories = getItem<ExpenseCategory[]>(STORAGE_KEYS.expenseCategories, [])
  if (expenseCategories.length === 0) {
    const defaultExpenseCategories: ExpenseCategory[] = [
      { id: '1', name: 'Loyer local' },
      { id: '2', name: 'Électricité ENERCA' },
      { id: '3', name: 'Eau SODECA' },
      { id: '4', name: 'Salaires' },
      { id: '5', name: 'Transport & livraison' },
      { id: '6', name: 'Approvisionnement' },
      { id: '7', name: 'Taxes & impôts' },
      { id: '8', name: 'Téléphone & internet' },
      { id: '9', name: 'Entretien local' },
      { id: '10', name: 'Autres charges' },
    ]
    setItem(STORAGE_KEYS.expenseCategories, defaultExpenseCategories)
  }

  const storeInfo = getItem<StoreInfo | null>(STORAGE_KEYS.storeInfo, null)
  if (!storeInfo) {
    const defaultStoreInfo: StoreInfo = {
      name: 'Ma Boutique',
      address: 'Avenue Boganda, Bangui, RCA',
      phone: '+236 75 00 00 00',
      email: 'contact@maboutique.cf',
    }
    setItem(STORAGE_KEYS.storeInfo, defaultStoreInfo)
  }
}

// Products
export function getProducts(): Product[] {
  return getItem<Product[]>(STORAGE_KEYS.products, [])
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts()
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  setItem(STORAGE_KEYS.products, [...products, newProduct])
  return newProduct
}

export function updateProduct(id: string, data: Partial<Product>): void {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...data, updatedAt: new Date().toISOString() }
    setItem(STORAGE_KEYS.products, products)
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts()
  setItem(STORAGE_KEYS.products, products.filter((p) => p.id !== id))
}

export function updateProductQuantity(id: string, quantityChange: number): void {
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index].quantity += quantityChange
    products[index].updatedAt = new Date().toISOString()
    setItem(STORAGE_KEYS.products, products)
  }
}

// Categories
export function getCategories(): Category[] {
  return getItem<Category[]>(STORAGE_KEYS.categories, [])
}

export function addCategory(category: Omit<Category, 'id'>): Category {
  const categories = getCategories()
  const newCategory: Category = {
    ...category,
    id: Date.now().toString(),
  }
  setItem(STORAGE_KEYS.categories, [...categories, newCategory])
  return newCategory
}

export function deleteCategory(id: string): void {
  const categories = getCategories()
  setItem(STORAGE_KEYS.categories, categories.filter((c) => c.id !== id))
}

// Sales
export function getSales(): Sale[] {
  return getItem<Sale[]>(STORAGE_KEYS.sales, [])
}

export function addSale(sale: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>): Sale {
  const sales = getSales()
  const today = new Date()
  const invoiceNumber = `FAC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(sales.length + 1).padStart(4, '0')}`

  const newSale: Sale = {
    ...sale,
    id: Date.now().toString(),
    invoiceNumber,
    createdAt: new Date().toISOString(),
  }
  setItem(STORAGE_KEYS.sales, [...sales, newSale])

  // Batch all product quantity decrements in one read + one write
  const products = getProducts()
  let dirty = false
  for (const item of sale.items) {
    const idx = products.findIndex((p) => p.id === item.productId)
    if (idx !== -1) {
      products[idx] = { ...products[idx], quantity: products[idx].quantity - item.quantity, updatedAt: new Date().toISOString() }
      dirty = true
    }
  }
  if (dirty) setItem(STORAGE_KEYS.products, products)

  return newSale
}

export function getTodaySales(): Sale[] {
  const sales = getSales()
  const today = new Date().toDateString()
  return sales.filter((s) => new Date(s.createdAt).toDateString() === today)
}

// Expenses
export function getExpenses(): Expense[] {
  return getItem<Expense[]>(STORAGE_KEYS.expenses, [])
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const expenses = getExpenses()
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  setItem(STORAGE_KEYS.expenses, [...expenses, newExpense])
  return newExpense
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses()
  setItem(STORAGE_KEYS.expenses, expenses.filter((e) => e.id !== id))
}

export function getTodayExpenses(): Expense[] {
  const expenses = getExpenses()
  const today = new Date().toDateString()
  return expenses.filter((e) => new Date(e.createdAt).toDateString() === today)
}

// Expense Categories
export function getExpenseCategories(): ExpenseCategory[] {
  return getItem<ExpenseCategory[]>(STORAGE_KEYS.expenseCategories, [])
}

export function addExpenseCategory(category: Omit<ExpenseCategory, 'id'>): ExpenseCategory {
  const categories = getExpenseCategories()
  const newCategory: ExpenseCategory = {
    ...category,
    id: Date.now().toString(),
  }
  setItem(STORAGE_KEYS.expenseCategories, [...categories, newCategory])
  return newCategory
}

// Customers
export function getCustomers(): Customer[] {
  return getItem<Customer[]>(STORAGE_KEYS.customers, [])
}

export function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'balance'>): Customer {
  const customers = getCustomers()
  const newCustomer: Customer = {
    ...customer,
    id: Date.now().toString(),
    balance: 0,
    createdAt: new Date().toISOString(),
  }
  setItem(STORAGE_KEYS.customers, [...customers, newCustomer])
  return newCustomer
}

export function updateCustomer(id: string, data: Partial<Customer>): void {
  const customers = getCustomers()
  const index = customers.findIndex((c) => c.id === id)
  if (index !== -1) {
    customers[index] = { ...customers[index], ...data }
    setItem(STORAGE_KEYS.customers, customers)
  }
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers()
  setItem(STORAGE_KEYS.customers, customers.filter((c) => c.id !== id))
}

// Cash Register
export function getCashRegisters(): CashRegister[] {
  return getItem<CashRegister[]>(STORAGE_KEYS.cashRegisters, [])
}

export function getOpenCashRegister(): CashRegister | null {
  const registers = getCashRegisters()
  return registers.find((r) => r.status === 'open') || null
}

export function openCashRegister(openingBalance: number, userId: string, userName: string): CashRegister {
  const registers = getCashRegisters()
  const newRegister: CashRegister = {
    id: Date.now().toString(),
    openingBalance,
    totalSales: 0,
    totalExpenses: 0,
    openedAt: new Date().toISOString(),
    userId,
    userName,
    status: 'open',
  }
  setItem(STORAGE_KEYS.cashRegisters, [...registers, newRegister])
  return newRegister
}

export function closeCashRegister(id: string): void {
  const registers = getCashRegisters()
  const index = registers.findIndex((r) => r.id === id)
  if (index !== -1) {
    const todaySales = getTodaySales()
    const todayExpenses = getTodayExpenses()
    const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0)
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
    
    registers[index] = {
      ...registers[index],
      totalSales,
      totalExpenses,
      closingBalance: registers[index].openingBalance + totalSales - totalExpenses,
      closedAt: new Date().toISOString(),
      status: 'closed',
    }
    setItem(STORAGE_KEYS.cashRegisters, registers)
  }
}

// Store Info
export function getStoreInfo(): StoreInfo {
  return getItem<StoreInfo>(STORAGE_KEYS.storeInfo, {
    name: 'Ma Boutique',
    address: 'Dakar, Sénégal',
    phone: '+221 77 123 45 67',
    email: 'contact@maboutique.sn',
  })
}

export function updateStoreInfo(info: StoreInfo): void {
  setItem(STORAGE_KEYS.storeInfo, info)
}

// Utility
const _cfaFmt = typeof Intl !== 'undefined'
  ? new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  : null

export function formatCFA(amount: number): string {
  return (_cfaFmt ? _cfaFmt.format(Math.round(amount)) : Math.round(amount).toString()) + ' FCFA'
}
