import { api } from './client';

export interface OHLCVBar {
  timestamp: string;
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  volume:    number;
}

export interface OHLCVResponse {
  symbol:    string;
  timeframe: string;
  start:     string;
  end:       string;
  n_bars:    number;
  data:      OHLCVBar[];
}

export interface NewsArticle {
  headline:     string;
  published_at: string;
  source?:      string;
  url?:         string;
  symbol?:      string;
}

export interface NewsResponse {
  symbol:     string;
  n_articles: number;
  showing:    number;
  data:       NewsArticle[];
}

export interface Fundamentals {
  symbol:            string;
  pe_ratio:          number | null;
  pb_ratio:          number | null;
  revenue_growth:    number | null;
  earnings_surprise: number | null;
  market_cap:        number | null;
  eps:               number | null;
  as_of:             string | null;
}

export interface MacroPoint {
  date:   string;
  series: string;
  value:  number;
}

export interface MacroResponse {
  series:   string;
  n_points: number;
  data:     MacroPoint[];
}

export interface SymbolSearchResult {
  symbol:            string;
  valid:             boolean;
  latest_close?:     number;
  latest_date?:      string;
  n_bars_available?: number;
}

export const getOHLCV = (
  symbol: string,
  timeframe = '1d',
  start = '2020-01-01',
  end = '2025-01-01'
): Promise<OHLCVResponse> =>
  api.get('/data/ohlcv', { params: { symbol, timeframe, start, end } }).then(r => r.data);

export const getNews = (
  symbol: string,
  start = '2020-01-01',
  end = '2025-01-01',
  limit = 50
): Promise<NewsResponse> =>
  api.get('/data/news', { params: { symbol, start, end, limit } }).then(r => r.data);

export const getFundamentals = (symbol: string): Promise<Fundamentals> =>
  api.get('/data/fundamentals', { params: { symbol } }).then(r => r.data);

export const getMacro = (
  series: string,
  start = '2020-01-01',
  end = '2025-01-01'
): Promise<MacroResponse> =>
  api.get('/data/macro', { params: { series, start, end } }).then(r => r.data);

export const searchSymbol = (q: string): Promise<SymbolSearchResult> =>
  api.get('/data/symbols/search', { params: { q } }).then(r => r.data);
