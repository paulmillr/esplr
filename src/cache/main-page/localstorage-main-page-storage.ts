import type { TxInfoExtended, TransactionListItem } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';
import { type MainPageStorage } from '@/cache/main-page/main-page-storage';
import { stringify, parse } from '@/utils/json';

export class LocalStorageMainPageStorage implements MainPageStorage {
  private static instance: LocalStorageMainPageStorage;
  private static prefix = 'main-page_';

  private constructor() {}

  static getInstance(): LocalStorageMainPageStorage {
    if (!LocalStorageMainPageStorage.instance) {
      LocalStorageMainPageStorage.instance = new LocalStorageMainPageStorage();
    }
    return LocalStorageMainPageStorage.instance;
  }

  private saveToLocalStorage(key: string, value: any): void {
    localStorage.setItem(LocalStorageMainPageStorage.prefix + key, stringify(value));
  }
  private getFromLocalStorage(key: string): any {
    const str = localStorage.getItem(LocalStorageMainPageStorage.prefix + key);
    return str ? parse(str) : null;
  }
  private removeFromLocalStorage(key: string): void {
    localStorage.removeItem(LocalStorageMainPageStorage.prefix + key);
  }

  public static hasAnyDataInLocalStorage(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LocalStorageMainPageStorage.prefix)) {
        return true;
      }
    }
    return false;
  }

  public static removeAllDataFromLocalStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LocalStorageMainPageStorage.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  getType(): string {
    return 'localstorage';
  }

  clear(): void {
    this.removeFromLocalStorage('gasPriceGwei');
    this.removeFromLocalStorage('maxPriorityFeeGwei');
    this.removeFromLocalStorage('favoriteAddresses');
    this.removeFromLocalStorage('favoriteTxns');
    this.removeFromLocalStorage('lastBlocks');
    this.removeFromLocalStorage('lastTxns');
    this.removeFromLocalStorage('ethPrice');
    this.removeFromLocalStorage('lastUpdateTimestamp');
  }

  clearFavorites(): void {
    this.removeFromLocalStorage('favoriteAddresses');
    this.removeFromLocalStorage('favoriteTxns');
  }

  hasData(): boolean {
    // favoriteAddresses and favoriteTxns are not checked, because they may be empty
    return (
      this.getFromLocalStorage('gasPriceGwei') !== null &&
      this.getFromLocalStorage('maxPriorityFeeGwei') !== null &&
      this.getFromLocalStorage('lastBlocks') !== null &&
      this.getFromLocalStorage('lastTxns') !== null &&
      this.getFromLocalStorage('lastUpdateTimestamp') !== null
    );
  }
  hasDataWithPrice(): boolean {
    return this.hasData() && this.getFromLocalStorage('ethPrice') !== null;
  }

  hasAnyData(): boolean {
    return (
      this.getFromLocalStorage('gasPriceGwei') !== null ||
      this.getFromLocalStorage('maxPriorityFeeGwei') !== null ||
      this.getFromLocalStorage('favoriteAddresses') !== null ||
      this.getFromLocalStorage('favoriteTxns') !== null ||
      this.getFromLocalStorage('lastBlocks') !== null ||
      this.getFromLocalStorage('lastTxns') !== null ||
      this.getFromLocalStorage('ethPrice') !== null ||
      this.getFromLocalStorage('lastUpdateTimestamp') !== null
    );
  }

  setEthPrice(ethPrice: number): void {
    if (ethPrice <= 0) {
      this.removeFromLocalStorage('ethPrice');
      return;
    }
    this.saveToLocalStorage('ethPrice', ethPrice);
  }
  getEthPrice(): number {
    const value = this.getFromLocalStorage('ethPrice') ?? 0;
    return Number(value);
  }

  setGasPriceGwei(gasPriceGwei: string): void {
    if (gasPriceGwei === '') {
      this.removeFromLocalStorage('gasPriceGwei');
      return;
    }
    this.saveToLocalStorage('gasPriceGwei', gasPriceGwei);
  }
  getGasPriceGwei(): string {
    return this.getFromLocalStorage('gasPriceGwei') ?? '';
  }

  setFavoriteAddresses(favoriteAddresses: string[]): void {
    if (!favoriteAddresses.length) {
      this.removeFromLocalStorage('favoriteAddresses');
      return;
    }
    this.saveToLocalStorage('favoriteAddresses', favoriteAddresses);
  }
  getFavoriteAddresses(): string[] {
    return this.getFromLocalStorage('favoriteAddresses') ?? [];
  }

  setFavoriteTxns(favoriteTxns: TransactionListItem[][]): void {
    if (!favoriteTxns.length) {
      this.removeFromLocalStorage('favoriteTxns');
      return;
    }
    this.saveToLocalStorage('favoriteTxns', favoriteTxns);
  }
  getFavoriteTxns(): TransactionListItem[][] {
    return this.getFromLocalStorage('favoriteTxns') ?? [];
  }

  setLastBlocks(lastBlocks: BlockInfo[]): void {
    if (!lastBlocks.length) {
      this.removeFromLocalStorage('lastBlocks');
      return;
    }
    this.saveToLocalStorage('lastBlocks', lastBlocks);
  }
  getLastBlocks(): BlockInfo[] {
    return this.getFromLocalStorage('lastBlocks') ?? [];
  }

  setLastTxns(lastTxns: TxInfoExtended[]): void {
    if (!lastTxns.length) {
      this.removeFromLocalStorage('lastTxns');
      return;
    }
    this.saveToLocalStorage('lastTxns', lastTxns);
  }
  getLastTxns(): TxInfoExtended[] {
    return this.getFromLocalStorage('lastTxns') ?? [];
  }

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void {
    if (maxPriorityFeeGwei === '') {
      this.removeFromLocalStorage('maxPriorityFeeGwei');
      return;
    }
    this.saveToLocalStorage('maxPriorityFeeGwei', maxPriorityFeeGwei);
  }
  getMaxPriorityFeeGwei(): string {
    return this.getFromLocalStorage('maxPriorityFeeGwei') ?? '';
  }

  setLastUpdateTimestamp(lastUpdateTimestamp: number): void {
    if (lastUpdateTimestamp <= 0) {
      this.removeFromLocalStorage('lastUpdateTimestamp');
      return;
    }
    this.saveToLocalStorage('lastUpdateTimestamp', lastUpdateTimestamp);
  }
  getLastUpdateTimestamp(): number {
    return this.getFromLocalStorage('lastUpdateTimestamp') ?? '';
  }
}
