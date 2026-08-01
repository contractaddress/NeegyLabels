const EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  base: 'https://basescan.org/address/',
  bsc: 'https://bscscan.com/address/',
  arbitrum: 'https://arbiscan.io/address/',
  optimism: 'https://optimistic.etherscan.io/address/',
  polygon: 'https://polygonscan.com/address/',
  avalanche: 'https://snowtrace.io/address/',
  unichain: 'https://uniscan.xyz/address/',
  robinhood: 'https://robinhoodchain.blockscout.com/address/',
  hyperliquid: 'https://hyperliquid.cloud/address/',
};

export function explorerUrl(chain: string, address: string): string | null {
  const base = EXPLORERS[chain];
  return base ? `${base}${address}` : null;
}
