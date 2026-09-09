import { getChainExplorerBase } from './db/chains.ts';

export function explorerUrl(chain: string, address: string): string | null {
  const base = getChainExplorerBase(chain);
  return base ? `${base}/address/${encodeURIComponent(address)}` : null;
}
