import type { TxInfoExtended, TransactionListItem } from '@/types';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';
import { type MainPageStorage } from '@/cache/main-page/main-page-storage';

export class MemoryMainPageStorage implements MainPageStorage {
  private static instance: MemoryMainPageStorage;

  private gasPriceGwei: string = '';
  private maxPriorityFeeGwei: string = '';
  private favoriteAddresses = <string[]>[];
  private favoriteTxns = <TransactionListItem[][]>[];
  private lastBlocks = <BlockInfo[]>[];
  private lastTxns = <TxInfoExtended[]>[];
  private ethPrice = 0;
  private lastUpdateTimestamp = 0;

  private constructor() {}

  static getInstance(): MemoryMainPageStorage {
    if (!MemoryMainPageStorage.instance) {
      MemoryMainPageStorage.instance = new MemoryMainPageStorage();
    }
    return MemoryMainPageStorage.instance;
  }

  getType(): string {
    return 'memory';
  }

  clear(): void {
    this.gasPriceGwei = '';
    this.maxPriorityFeeGwei = '';
    this.favoriteAddresses = [];
    this.favoriteTxns = [];
    this.lastBlocks = [];
    this.lastTxns = [];
    this.ethPrice = 0;
    this.lastUpdateTimestamp = 0;
  }

  clearFavorites(): void {
    this.favoriteAddresses = [];
    this.favoriteTxns = [];
  }

  hasData(): boolean {
    // favoriteAddresses and favoriteTxns are not checked, because they may be empty
    return (
      this.gasPriceGwei !== '' &&
      this.maxPriorityFeeGwei !== '' &&
      this.lastBlocks.length !== 0 &&
      this.lastTxns.length !== 0 &&
      this.lastUpdateTimestamp !== 0
    );
  }
  hasDataWithPrice(): boolean {
    return this.hasData() && this.ethPrice !== 0;
  }

  hasAnyData(): boolean {
    return (
      this.gasPriceGwei !== '' ||
      this.maxPriorityFeeGwei !== '' ||
      this.favoriteAddresses.length !== 0 ||
      this.favoriteTxns.length !== 0 ||
      this.lastBlocks.length !== 0 ||
      this.lastTxns.length !== 0 ||
      this.ethPrice !== 0 ||
      this.lastUpdateTimestamp !== 0
    );
  }

  setEthPrice(ethPrice: number): void {
    this.ethPrice = ethPrice;
  }
  getEthPrice(): number {
    return this.ethPrice;
  }

  setGasPriceGwei(gasPriceGwei: string): void {
    this.gasPriceGwei = gasPriceGwei;
  }
  getGasPriceGwei(): string {
    return this.gasPriceGwei;
  }

  setFavoriteAddresses(favoriteAddresses: string[]): void {
    this.favoriteAddresses = favoriteAddresses;
  }
  getFavoriteAddresses(): string[] {
    return this.favoriteAddresses;
  }

  setFavoriteTxns(favoriteTxns: TransactionListItem[][]): void {
    this.favoriteTxns = favoriteTxns;
  }
  getFavoriteTxns(): TransactionListItem[][] {
    return this.favoriteTxns;
  }

  setLastBlocks(lastBlocks: BlockInfo[]): void {
    this.lastBlocks = lastBlocks;
  }
  getLastBlocks(): BlockInfo[] {
    return this.lastBlocks;
  }

  setLastTxns(lastTxns: TxInfoExtended[]): void {
    this.lastTxns = lastTxns;
  }
  getLastTxns(): TxInfoExtended[] {
    return this.lastTxns;
  }

  setMaxPriorityFeeGwei(maxPriorityFeeGwei: string): void {
    this.maxPriorityFeeGwei = maxPriorityFeeGwei;
  }
  getMaxPriorityFeeGwei(): string {
    return this.maxPriorityFeeGwei;
  }

  setLastUpdateTimestamp(timestamp: number): void {
    this.lastUpdateTimestamp = timestamp;
  }
  getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
  }
}
