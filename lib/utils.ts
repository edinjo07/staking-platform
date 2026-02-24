import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a URL to prevent XSS - only permits http/https and relative paths.
 * Returns an empty string for any unsafe URL (e.g. javascript:, data:).
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('blob:')) {
    return trimmed
  }
  return ''
}

/**
 * Sanitize an email address for use in mailto: href attributes.
 * Returns empty string if the value doesn't look like a valid email.
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return ''
  const trimmed = email.trim()
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmed) ? trimmed : ''
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return `${amount.toFixed(8)} ${currency}`
}

/**
 * Format a number with comma separators
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM dd, yyyy')
}

/**
 * Format a datetime to readable string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM dd, yyyy HH:mm')
}

/**
 * Format time ago (relative)
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * Generate a random referral code
 */
export function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calculate staking profit
 */
export function calculateStakingReturns(
  amount: number,
  dailyRoi: number,
  durationDays: number
): { dailyProfit: number; totalProfit: number; totalReturn: number } {
  const dailyProfit = (amount * dailyRoi) / 100
  const totalProfit = dailyProfit * durationDays
  const totalReturn = amount + totalProfit
  return { dailyProfit, totalProfit, totalReturn }
}

/**
 * Mask email for privacy (e.g. "j****@gmail.com")
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 1))
  return `${maskedLocal}@${domain}`
}

/**
 * Paginate array
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; total: number; totalPages: number; page: number } {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    total,
    totalPages,
    page,
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-green-500 bg-green-500/10',
    COMPLETED: 'text-blue-500 bg-blue-500/10',
    CANCELLED: 'text-red-500 bg-red-500/10',
    PENDING: 'text-yellow-500 bg-yellow-500/10',
    APPROVED: 'text-green-500 bg-green-500/10',
    REJECTED: 'text-red-500 bg-red-500/10',
    CONFIRMED: 'text-green-500 bg-green-500/10',
    FAILED: 'text-red-500 bg-red-500/10',
    PROCESSING: 'text-blue-500 bg-blue-500/10',
  }
  return map[status] || 'text-gray-500 bg-gray-500/10'
}

/**
 * API response helpers
 */
export function successResponse(data: any, status: number = 200) {
  return Response.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status: number = 400) {
  return Response.json({ success: false, error: message }, { status })
}
