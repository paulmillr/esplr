import type { TxInfoExtended, TransactionListItem } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';

export interface MainPageStorage {
  clear(): void;
  clearFavorites(): void;
  hasData(): boolean;
  hasDataWithPrice(): boolean;
  hasAnyData(): boolean;
  getType(): string;

  setEthPrice(ethPrice: number): void;
  getEthPrice(): number;

  setGasPriceGwei(gasPriceGwei: string): void;
  getGasPriceGwei(): string;

  setFavoriteAddresses(favoriteAddresses: string[]): void;
  getFavoriteAddresses(): string[];

  setFavoriteTxns(favoriteTxns: TransactionListItem[][]): void;
  getFavoriteTxns(): TransactionListItem[][];

  setLastBlocks(lastBlocks: BlockInfo[]): void;
  getLastBlocks(): BlockInfo[];

  setLastTxns(lastTxns: TxInfoExtended[]): void;
  getLastTxns(): TxInfoExtended[];

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void;
  getMaxPriorityFeeGwei(): string;

  setLastUpdateTimestamp(timestamp: number): void;
  getLastUpdateTimestamp(): number;
}
