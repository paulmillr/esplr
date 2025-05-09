import type { TxInfoExtended, TransactionListItem } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';
import { MemoryMainPageStorage } from '@/cache/main-page/memory-main-page-storage';
import { LocalStorageMainPageStorage } from '@/cache/main-page/localstorage-main-page-storage';
import { LocalStorageAddressStorage } from '@/cache/address/localstorage-address-storage';
import { type MainPageStorage } from '@/cache/main-page/main-page-storage';
import { CACHE_LOCALSTORAGE } from '@/config';

const hasAnyLocalStorage =
  LocalStorageMainPageStorage.hasAnyDataInLocalStorage() ||
  LocalStorageAddressStorage.hasAnyDataInLocalStorage();

export class MainPageCache {
  private static instance: MainPageCache = new MainPageCache();
  private static strategy: MainPageStorage =
    CACHE_LOCALSTORAGE || hasAnyLocalStorage
      ? LocalStorageMainPageStorage.getInstance()
      : MemoryMainPageStorage.getInstance();

  private constructor() {}

  static getInstance(): MainPageCache {
    return MainPageCache.instance;
  }

  static getStrategyType(): string {
    return MainPageCache.strategy.getType();
  }

  private static migrateDataTo(to: MainPageStorage) {
    const from = MainPageCache.strategy;
    if (from.getType() === to.getType()) {
      return;
    }

    to.setEthPrice(from.getEthPrice());
    to.setGasPriceGwei(from.getGasPriceGwei());
    to.setFavoriteAddresses(from.getFavoriteAddresses());
    to.setFavoriteTxns(from.getFavoriteTxns());
    to.setLastBlocks(from.getLastBlocks());
    to.setLastTxns(from.getLastTxns());
    to.setMaxPriorityFeeGwei(from.getMaxPriorityFeeGwei());
    to.setLastUpdateTimestamp(from.getLastUpdateTimestamp());

    from.clear();
  }

  static useLocalStorage(): void {
    const newStrategy = LocalStorageMainPageStorage.getInstance();
    this.migrateDataTo(newStrategy);
    this.strategy = newStrategy;
  }
  static useMemoryStorage(): void {
    const newStrategy = MemoryMainPageStorage.getInstance();
    this.migrateDataTo(newStrategy);
    this.strategy = newStrategy;
  }

  clearLocalStorage(): void {
    LocalStorageMainPageStorage.removeAllDataFromLocalStorage();
  }

  clear(): void {
    MainPageCache.strategy.clear();
  }

  clearFavorites(): void {
    MainPageCache.strategy.clearFavorites();
  }

  hasData(): boolean {
    return MainPageCache.strategy.hasData();
  }
  hasDataWithPrice(): boolean {
    return MainPageCache.strategy.hasDataWithPrice();
  }
  hasAnyData(): boolean {
    return MainPageCache.strategy.hasAnyData();
  }

  setEthPrice(ethPrice: number): void {
    MainPageCache.strategy.setEthPrice(ethPrice);
  }
  getEthPrice(): number {
    return MainPageCache.strategy.getEthPrice();
  }

  setGasPriceGwei(gasPriceGwei: string): void {
    MainPageCache.strategy.setGasPriceGwei(gasPriceGwei);
  }
  getGasPriceGwei(): string {
    return MainPageCache.strategy.getGasPriceGwei();
  }

  setFavoriteAddresses(favoriteAddresses: string[]): void {
    MainPageCache.strategy.setFavoriteAddresses(favoriteAddresses);
  }
  getFavoriteAddresses(): string[] {
    return MainPageCache.strategy.getFavoriteAddresses();
  }

  setFavoriteTxns(favoriteTxns: TransactionListItem[][]): void {
    MainPageCache.strategy.setFavoriteTxns(favoriteTxns);
  }
  getFavoriteTxns(): TransactionListItem[][] {
    return MainPageCache.strategy.getFavoriteTxns();
  }

  setLastBlocks(lastBlocks: BlockInfo[]): void {
    MainPageCache.strategy.setLastBlocks(lastBlocks);
  }
  getLastBlocks(): BlockInfo[] {
    return MainPageCache.strategy.getLastBlocks();
  }

  setLastTxns(lastTxns: TxInfoExtended[]): void {
    MainPageCache.strategy.setLastTxns(lastTxns);
  }
  getLastTxns(): TxInfoExtended[] {
    return MainPageCache.strategy.getLastTxns();
  }

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void {
    MainPageCache.strategy.setMaxPriorityFeeGwei(maxPriorityFeeGwei);
  }
  getMaxPriorityFeeGwei(): string {
    return MainPageCache.strategy.getMaxPriorityFeeGwei();
  }

  setLastUpdateTimestamp(timestamp: number): void {
    MainPageCache.strategy.setLastUpdateTimestamp(timestamp);
  }
  getLastUpdateTimestamp(): number {
    return MainPageCache.strategy.getLastUpdateTimestamp();
  }
}
