import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
  UnspentWithUsd,
} from '@/types';
import { MemoryAddressStorage } from '@/cache/address/memory-address-storage';
import { LocalStorageAddressStorage } from '@/cache/address/localstorage-address-storage';
import { LocalStorageMainPageStorage } from '@/cache/main-page/localstorage-main-page-storage';
import { type AddressStorage } from '@/cache/address/address-storage';
import { CACHE_LOCALSTORAGE } from '@/config';

const hasAnyLocalStorage =
  LocalStorageMainPageStorage.hasAnyDataInLocalStorage() ||
  LocalStorageAddressStorage.hasAnyDataInLocalStorage();

export class AddressCache {
  private static instance: AddressCache;
  private static strategy: AddressStorage =
    CACHE_LOCALSTORAGE || hasAnyLocalStorage
      ? LocalStorageAddressStorage.getInstance()
      : MemoryAddressStorage.getInstance();

  private constructor() {}

  static getInstance(): AddressCache {
    if (!AddressCache.instance) {
      AddressCache.instance = new AddressCache();
    }

    return AddressCache.instance;
  }

  static getStrategyType(): string {
    return AddressCache.strategy.getType();
  }

  private static migrateDataTo(to: AddressStorage) {
    const from = AddressCache.strategy;
    if (from.getType() === to.getType()) {
      return;
    }

    to.addAllTokens(from.getAllTokens());
    to.addAllInternalTransactions(from.getAllInternalTransactions());
    to.addAllTokenTransfersTransactions(from.getAllTokenTransfersTransactions());
    to.addAllUnspent(from.getAllUnspent());
    to.addAllUpdatedAtTimestamp(from.getAllUpdatedAtTimestamp());
    to.addAllTokenInfo(from.getAllTokenInfo());
    to.addAllTokenCreator(from.getAllTokenCreator());
    to.addAllEns(from.getAllEns());
    to.addAllFavoriteAddresses(from.getFavoriteAddresses());

    from.clearAll();
  }

  static useLocalStorage(): void {
    const newStrategy = LocalStorageAddressStorage.getInstance();
    this.migrateDataTo(newStrategy);
    this.strategy = newStrategy;
  }
  static useMemoryStorage(): void {
    const newStrategy = MemoryAddressStorage.getInstance();
    this.migrateDataTo(newStrategy);
    this.strategy = newStrategy;
  }

  clearLocalStorage(): void {
    LocalStorageAddressStorage.removeAllDataFromLocalStorage();
  }

  clearAll(): void {
    AddressCache.strategy.clearAll();
  }

  clear(): void {
    AddressCache.strategy.clear();
  }

  clearAddressesForUpdate(addresses: string[]): void {
    AddressCache.strategy.clearAddressesForUpdate(addresses);
  }

  clearFavorites(): void {
    AddressCache.strategy.clearFavorites();
  }

  allCachedAddresses(): string[] {
    return AddressCache.strategy.allCachedAddresses();
  }

  /**
   * Update date timestamp cache
   */

  hasUpdatedAtTimestampForEveryAddress(addresses: string[]): boolean {
    return AddressCache.strategy.hasUpdatedAtTimestampForEveryAddress(addresses);
  }

  getUpdatedAtTimestampForAddresses(addresses: string[]): Map<string, number> {
    return AddressCache.strategy.getUpdatedAtTimestampForAddresses(addresses);
  }

  getLowestUpdatedAtTimestampForAddresses(addresses: string[]): number {
    return AddressCache.strategy.getLowestUpdatedAtTimestampForAddresses(addresses);
  }

  setUpdatedAtTimestampForAddresses(addresses: string[], timestamp: number): void {
    AddressCache.strategy.setUpdatedAtTimestampForAddresses(addresses, timestamp);
  }

  /**
   * Token Creator Cache
   */

  addTokenCreator(address: string, tokenCreator: OtsGetContractCreatorResponse): void {
    AddressCache.strategy.addTokenCreator(address, tokenCreator);
  }

  getTokenCreator(address: string): OtsGetContractCreatorResponse | undefined {
    return AddressCache.strategy.getTokenCreator(address);
  }

  hasTokenCreator(address: string): boolean {
    return AddressCache.strategy.hasTokenCreator(address);
  }

  removeTokenCreator(address: string): void {
    AddressCache.strategy.removeTokenCreator(address);
  }

  /**
   * Token Info Cache
   */

  addTokenInfo(address: string, tokenInfo: ERC20TokenInfo | null): void {
    AddressCache.strategy.addTokenInfo(address, tokenInfo);
  }

  getTokenInfo(address: string): ERC20TokenInfo | undefined | null {
    return AddressCache.strategy.getTokenInfo(address);
  }

  hasTokenInfo(address: string): boolean {
    return AddressCache.strategy.hasTokenInfo(address);
  }

  /**
   * ENS Cache
   */
  addEns(address: string, ens: string): void {
    AddressCache.strategy.addEns(address, ens);
  }
  getEns(address: string): string | undefined {
    return AddressCache.strategy.getEns(address);
  }
  hasEns(address: string): boolean {
    return AddressCache.strategy.hasEns(address);
  }

  /**
   * Unspent Cache
   */

  addUnspent(address: string, unspent: UnspentWithUsd): void {
    AddressCache.strategy.addUnspent(address, unspent);
  }

  getUnspent(address: string): UnspentWithUsd | undefined {
    return AddressCache.strategy.getUnspent(address);
  }

  hasUnspent(address: string): boolean {
    return AddressCache.strategy.hasUnspent(address);
  }

  removeUnspent(address: string): void {
    AddressCache.strategy.removeUnspent(address);
  }

  /**
   * Tokens Balances Cache
   */

  addTokens(address: string, tokens: TokenBalance[]): void {
    AddressCache.strategy.addTokens(address, tokens);
  }

  hasTokensForEveryAddress(addresses: string[]): boolean {
    return AddressCache.strategy.hasTokensForEveryAddress(addresses);
  }

  getTokensForAddresses(addresses: string[]): Map<string, TokenBalance[]> {
    return AddressCache.strategy.getTokensForAddresses(addresses);
  }

  /**
   * Internal Transactions Cache
   */

  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void {
    AddressCache.strategy.addInternalTransactions(address, transactions);
  }

  getInternalTransactions(address: string): TransactionListItem[][] | undefined {
    return AddressCache.strategy.getInternalTransactions(address);
  }

  hasInternalTransactionsForEveryAddress(addresses: string[]): boolean {
    return AddressCache.strategy.hasInternalTransactionsForEveryAddress(addresses);
  }

  getInternalTransactionsForAddresses(addresses: string[]): Map<string, TransactionListItem[][]> {
    return AddressCache.strategy.getInternalTransactionsForAddresses(addresses);
  }

  /**
   * Token Transfers Transactions Cache
   */

  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void {
    AddressCache.strategy.addTokenTransfersTransactions(address, transactions);
  }

  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined {
    return AddressCache.strategy.getTokenTransfersTransactions(address);
  }

  hasTokenTransfersTransactionsAddress(address: string): boolean {
    return AddressCache.strategy.hasTokenTransfersTransactionsAddress(address);
  }

  /**
   * FAVOURITE ADDRESSES
   */

  getFavoriteAddresses(): Set<string> {
    return AddressCache.strategy.getFavoriteAddresses();
  }

  addFavoriteAddress(address: string): void {
    AddressCache.strategy.addFavoriteAddress(address);
  }

  isFavoriteAddress(address: string): boolean {
    return AddressCache.strategy.isFavoriteAddress(address);
  }

  removeFavoriteAddress(address: string): void {
    AddressCache.strategy.removeFavoriteAddress(address);
  }
}
