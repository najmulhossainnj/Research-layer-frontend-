export const queryKeys = {
  ohlcv: (symbol: string, timeframe: string, start: string, end: string) =>
    ['data', 'ohlcv', symbol, timeframe, start, end] as const,

  news: (symbol: string, start: string, end: string) =>
    ['data', 'news', symbol, start, end] as const,

  fundamentals: (symbol: string) =>
    ['data', 'fundamentals', symbol] as const,

  macro: (series: string, start: string, end: string) =>
    ['data', 'macro', series, start, end] as const,

  symbolSearch: (q: string) =>
    ['data', 'symbols', 'search', q] as const,
};
