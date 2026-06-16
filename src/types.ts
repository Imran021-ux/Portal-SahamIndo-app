/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Stock {
  ticker: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number; // in Billion IDR
  peRatio: number;
  dividendYield: number; // in percentage
  pbv?: number;          // Price to Book Value
  der?: number;          // Debt to Equity Ratio (%)
  roe?: number;          // Return on Equity (%)
  eps?: number;          // Earnings Per Share (IDR)
  freeCashFlow?: number;  // Free Cash Flow (Billion IDR)
  ocf?: number;          // Operating Cash Flow (Billion IDR)
  sector: string;
  history: number[]; // Last 10 price entries for graph visualization
  bid: number;
  ask: number;
  low: number;
  high: number;
  isSyariah?: boolean;
  isReal?: boolean;
  verificationRequired?: boolean;
  isAnomali?: boolean;
  statusText?: string;
  source?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  ticker?: string;
  time: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface UserSession {
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export interface MarketTracerRequest {
  ticker: string;
  question?: string;
}

export interface TechnicalIndicator {
  name: string;
  value: string;
  status: 'buy' | 'sell' | 'neutral';
}
