import axios from 'axios'
import crypto from 'crypto'

const WESTWALLET_API_URL = process.env.WESTWALLET_API_URL || 'https://api.westwallet.io'
const WESTWALLET_API_KEY = process.env.WESTWALLET_API_KEY || ''

const westwalletClient = axios.create({
  baseURL: WESTWALLET_API_URL,
  headers: {
    'X-API-Key': WESTWALLET_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export interface GenerateAddressResponse {
  address: string
  currency: string
  network: string
}

export interface WalletBalance {
  currency: string
  balance: number
  pending: number
}

export interface TransactionInfo {
  txHash: string
  amount: number
  currency: string
  confirmations: number
  status: string
  timestamp: number
}

/**
 * Generate a deposit address for a specific currency
 */
export async function generateDepositAddress(
  currency: string,
  userId: string
): Promise<GenerateAddressResponse> {
  const response = await westwalletClient.post('/wallet/create-address', {
    currency: currency.toUpperCase(),
    label: `user_${userId}`,
  })
  return response.data
}

/**
 * Get wallet balance for a currency
 */
export async function getWalletBalance(currency: string): Promise<WalletBalance> {
  const response = await westwalletClient.get(`/wallet/balance/${currency.toUpperCase()}`)
  return response.data
}

/**
 * Send a withdrawal transaction
 */
export async function sendWithdrawal(
  currency: string,
  amount: number,
  toAddress: string,
  withdrawalId: string
): Promise<{ txHash: string }> {
  const response = await westwalletClient.post('/wallet/send', {
    currency: currency.toUpperCase(),
    amount: amount.toString(),
    address: toAddress,
    label: `withdrawal_${withdrawalId}`,
  })
  return response.data
}

/**
 * Get transaction details
 */
export async function getTransaction(txHash: string, currency: string): Promise<TransactionInfo> {
  const response = await westwalletClient.get(`/transactions/${txHash}`, {
    params: { currency: currency.toUpperCase() },
  })
  return response.data
}

/**
 * Verify a webhook signature from WestWallet
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', WESTWALLET_API_KEY)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expectedSignature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
