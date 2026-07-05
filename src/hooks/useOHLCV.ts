import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getOHLCV } from '../api/data';

export function useOHLCV(symbol: string, timeframe = '1d', start = '2020-01-01', end = '2025-01-01') {
  return useQuery({
    queryKey: queryKeys.ohlcv(symbol, timeframe, start, end),
    queryFn:  () => getOHLCV(symbol, timeframe, start, end),
    staleTime: 5 * 60 * 1000,   // 5 minutes — prices don't need real-time refresh
    enabled:   !!symbol,
  });
}
