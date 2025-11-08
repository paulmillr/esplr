import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
  UnspentWithUsd,
  NftLog,
} from '@/types';
import { type AddressStorage } from '@/cache/address/address-storage';
import { stringify, parse } from '@/utils/json';

export class LocalStorageAddressStorage implements AddressStorage {
  private static instance: LocalStorageAddressStorage;
  private static prefix = 'address_';

  private constructor() {}

  static getInstance(): LocalStorageAddressStorage {
    if (!LocalStorageAddressStorage.instance) {
      LocalStorageAddressStorage.instance = new LocalStorageAddressStorage();
    }
    return LocalStorageAddressStorage.instance;
  }

  private saveToLocalStorage(key: string, value: any): void {
    if (typeof value === 'object' && !Object.keys(value).length) {
      this.removeFromLocalStorage(key);
      return;
    }
    localStorage.setItem(LocalStorageAddressStorage.prefix + key, stringify(value));
  }
  private getFromLocalStorage(key: string): any {
    const str = localStorage.getItem(LocalStorageAddressStorage.prefix + key);
    return str ? parse(str) : null;
  }
  private removeFromLocalStorage(key: string): void {
    localStorage.removeItem(LocalStorageAddressStorage.prefix + key);
  }

  public static hasAnyDataInLocalStorage(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LocalStorageAddressStorage.prefix)) {
        return true;
      }
    }
    return false;
  }

  public static removeAllDataFromLocalStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LocalStorageAddressStorage.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  getType(): string {
    return 'localstorage';
  }

  clearAll(): void {
    this.clear();
    this.removeFromLocalStorage('favoriteAddresses');
  }

  clear(): void {
    this.removeFromLocalStorage('tokens');
    this.removeFromLocalStorage('internalTransactions');
    this.removeFromLocalStorage('tokenTransfersTransactions');
    this.removeFromLocalStorage('unspent');
    this.removeFromLocalStorage('updatedAtTimestamp');
    this.removeFromLocalStorage('tokenInfo');
    this.removeFromLocalStorage('tokenCreator');
    this.removeFromLocalStorage('ens');
    this.removeFromLocalStorage('nftLogs');
  }

  // tokenTransfersTransactions is not cleared here (because we are not loading them from scratch later for optimization)
  clearAddressesForUpdate(addresses: string[]): void {
    const {
      tokens,
      internalTransactions,
      unspent,
      updatedAtTimestamp,
      tokenInfo,
      tokenCreator,
      ens,
      nftLogs,
    } = this.getAllCachedData();

    addresses.forEach((address) => {
      delete tokens[address];
      delete internalTransactions[address];
      delete unspent[address];
      delete updatedAtTimestamp[address];
      delete tokenInfo[address];
      delete tokenCreator[address];
      delete ens[address];
      delete nftLogs[address];
    });

    this.saveToLocalStorage('tokens', tokens);
    this.saveToLocalStorage('internalTransactions', internalTransactions);
    this.saveToLocalStorage('unspent', unspent);
    this.saveToLocalStorage('updatedAtTimestamp', updatedAtTimestamp);
    this.saveToLocalStorage('tokenInfo', tokenInfo);
    this.saveToLocalStorage('tokenCreator', tokenCreator);
    this.saveToLocalStorage('ens', ens);
    this.saveToLocalStorage('nftLogs', nftLogs);
  }

  clearFavorites(): void {
    const {
      tokens,
      internalTransactions,
      tokenTransfersTransactions,
      unspent,
      updatedAtTimestamp,
      tokenInfo,
      tokenCreator,
      ens,
      nftLogs,
    } = this.getAllCachedData();

    const favorites = this.getFavoriteAddresses();

    favorites.forEach((address) => {
      delete tokens[address];
      delete internalTransactions[address];
      delete tokenTransfersTransactions[address];
      delete unspent[address];
      delete updatedAtTimestamp[address];
      delete tokenInfo[address];
      delete tokenCreator[address];
      delete ens[address];
      delete nftLogs[address];
    });

    this.saveToLocalStorage('tokens', tokens);
    this.saveToLocalStorage('internalTransactions', internalTransactions);
    this.saveToLocalStorage('tokenTransfersTransactions', tokenTransfersTransactions);
    this.saveToLocalStorage('unspent', unspent);
    this.saveToLocalStorage('updatedAtTimestamp', updatedAtTimestamp);
    this.saveToLocalStorage('tokenInfo', tokenInfo);
    this.saveToLocalStorage('tokenCreator', tokenCreator);
    this.saveToLocalStorage('ens', ens);
    this.saveToLocalStorage('nftLogs', nftLogs);

    this.removeFromLocalStorage('favoriteAddresses');
  }

  allCachedAddresses(): string[] {
    const {
      tokens,
      internalTransactions,
      tokenTransfersTransactions,
      unspent,
      updatedAtTimestamp,
      tokenInfo,
      tokenCreator,
      ens,
      nftLogs,
    } = this.getAllCachedData();

    return Array.from(
      new Set([
        ...Object.keys(tokens),
        ...Object.keys(internalTransactions),
        ...Object.keys(tokenTransfersTransactions),
        ...Object.keys(unspent),
        ...Object.keys(updatedAtTimestamp),
        ...Object.keys(tokenInfo),
        ...Object.keys(tokenCreator),
        ...Object.keys(ens),
        ...Object.keys(nftLogs),
      ])
    );
  }

  private getAllCachedData = () => {
    const tokens = this.getFromLocalStorage('tokens') ?? {};
    const internalTransactions = this.getFromLocalStorage('internalTransactions') ?? {};
    const tokenTransfersTransactions = this.getFromLocalStorage('tokenTransfersTransactions') ?? {};
    const unspent = this.getFromLocalStorage('unspent') ?? {};
    const updatedAtTimestamp = this.getFromLocalStorage('updatedAtTimestamp') ?? {};
    const tokenInfo = this.getFromLocalStorage('tokenInfo') ?? {};
    const tokenCreator = this.getFromLocalStorage('tokenCreator') ?? {};
    const ens = this.getFromLocalStorage('ens') ?? {};
    const nftLogs = this.getFromLocalStorage('nftLogs') ?? {};

    return {
      tokens,
      internalTransactions,
      tokenTransfersTransactions,
      unspent,
      updatedAtTimestamp,
      tokenInfo,
      tokenCreator,
      ens,
      nftLogs,
    };
  };

  private addAllUnitToCache(cacheName: string, data: Map<string, any>): void {
    const cached: Record<string, any> = {};
    data.forEach((value: any, key: string) => {
      cached[key] = value;
    });
    this.saveToLocalStorage(cacheName, cached);
  }

  private getAllCachedUnitAsMap(cacheName: string): Map<string, any> {
    const cached = this.getFromLocalStorage(cacheName) ?? {};
    const resultMap: Map<string, any> = new Map();
    Object.keys(cached).forEach((key: string) => {
      const value = cached[key];
      resultMap.set(key, value);
    });
    return resultMap;
  }

  /**
   * Update date timestamp cache
   */

  addAllUpdatedAtTimestamp(updatedAtTimestamp: Map<string, number>): void {
    this.addAllUnitToCache('updatedAtTimestamp', updatedAtTimestamp);
  }
  getAllUpdatedAtTimestamp(): Map<string, number> {
    return this.getAllCachedUnitAsMap('updatedAtTimestamp');
  }

  hasUpdatedAtTimestampForEveryAddress(addresses: string[]): boolean {
    const cached = this.getFromLocalStorage('updatedAtTimestamp') ?? {};
    return addresses.every((address) => address in cached);
  }

  getUpdatedAtTimestampForAddresses(addresses: string[]): Map<string, number> {
    let cachedTimestamps: Map<string, number> = new Map();
    const cached = this.getFromLocalStorage('updatedAtTimestamp') ?? {};
    addresses.forEach((address: string) => {
      const timestamp = cached[address] ?? 0;
      cachedTimestamps.set(address, timestamp);
    });
    return cachedTimestamps;
  }

  getLowestUpdatedAtTimestampForAddresses(addresses: string[]): number {
    const cached = this.getUpdatedAtTimestampForAddresses(addresses);
    const timestamps = Array.from(cached.values()).filter((timestamp) => timestamp > 0);
    if (!timestamps.length) {
      return 0;
    }
    return Math.min(...timestamps);
  }

  setUpdatedAtTimestampForAddresses(addresses: string[], timestamp: number): void {
    const cached = this.getFromLocalStorage('updatedAtTimestamp') ?? {};
    addresses.forEach((address: string) => {
      cached[address] = timestamp;
    });
    this.saveToLocalStorage('updatedAtTimestamp', cached);
  }

  /**
   * Token Creator Cache
   */

  addAllTokenCreator(tokenCreators: Map<string, OtsGetContractCreatorResponse>): void {
    this.addAllUnitToCache('tokenCreator', tokenCreators);
  }
  getAllTokenCreator(): Map<string, OtsGetContractCreatorResponse> {
    return this.getAllCachedUnitAsMap('tokenCreator');
  }

  addTokenCreator(address: string, tokenCreator: OtsGetContractCreatorResponse): void {
    const cached = this.getFromLocalStorage('tokenCreator') ?? {};
    cached[address] = tokenCreator;
    this.saveToLocalStorage('tokenCreator', cached);
  }

  getTokenCreator(address: string): OtsGetContractCreatorResponse | undefined {
    const cached = this.getFromLocalStorage('tokenCreator') ?? {};
    return cached[address];
  }

  hasTokenCreator(address: string): boolean {
    const cached = this.getFromLocalStorage('tokenCreator') ?? {};
    return address in cached;
  }

  removeTokenCreator(address: string): void {
    const cached = this.getFromLocalStorage('tokenCreator') ?? {};
    delete cached[address];
    this.saveToLocalStorage('tokenCreator', cached);
  }

  /**
   * Token Info Cache
   */

  addAllTokenInfo(tokenInfo: Map<string, ERC20TokenInfo | null>): void {
    this.addAllUnitToCache('tokenInfo', tokenInfo);
  }
  getAllTokenInfo(): Map<string, ERC20TokenInfo | null> {
    return this.getAllCachedUnitAsMap('tokenInfo');
  }

  addTokenInfo(address: string, tokenInfo: ERC20TokenInfo | null): void {
    const cached = this.getFromLocalStorage('tokenInfo') ?? {};
    cached[address] = tokenInfo;
    this.saveToLocalStorage('tokenInfo', cached);
  }

  getTokenInfo(address: string): ERC20TokenInfo | undefined | null {
    const cached = this.getFromLocalStorage('tokenInfo') ?? {};
    return cached[address];
  }

  hasTokenInfo(address: string): boolean {
    const cached = this.getFromLocalStorage('tokenInfo') ?? {};
    return address in cached;
  }

  /**
   * ENS Cache
   */

  addAllEns(ens: Map<string, string>): void {
    this.addAllUnitToCache('ens', ens);
  }

  getAllEns(): Map<string, string> {
    return this.getAllCachedUnitAsMap('ens');
  }

  addEns(address: string, ens: string): void {
    const cached = this.getFromLocalStorage('ens') ?? {};
    cached[address] = ens;
    this.saveToLocalStorage('ens', cached);
  }

  getEns(address: string): string | undefined {
    const cached = this.getFromLocalStorage('ens') ?? {};
    return cached[address];
  }

  hasEns(address: string): boolean {
    const cached = this.getFromLocalStorage('ens') ?? {};
    return address in cached;
  }

  /**
   * Unspent Cache
   */

  addAllUnspent(unspents: Map<string, UnspentWithUsd>): void {
    this.addAllUnitToCache('unspent', unspents);
  }
  getAllUnspent(): Map<string, UnspentWithUsd> {
    return this.getAllCachedUnitAsMap('unspent');
  }

  addUnspent(address: string, unspent: UnspentWithUsd): void {
    const cached = this.getFromLocalStorage('unspent') ?? {};
    cached[address] = unspent;
    this.saveToLocalStorage('unspent', cached);
  }

  getUnspent(address: string): UnspentWithUsd | undefined {
    const cached = this.getFromLocalStorage('unspent') ?? {};
    return cached[address];
  }

  hasUnspent(address: string): boolean {
    const cached = this.getFromLocalStorage('unspent') ?? {};
    return address in cached;
  }

  removeUnspent(address: string): void {
    const cached = this.getFromLocalStorage('unspent') ?? {};
    delete cached[address];
    this.saveToLocalStorage('unspent', cached);
  }

  /**
   * Tokens Balances Cache
   */

  addAllTokens(tokens: Map<string, TokenBalance[]>): void {
    this.addAllUnitToCache('tokens', tokens);
  }

  getAllTokens(): Map<string, TokenBalance[]> {
    return this.getAllCachedUnitAsMap('tokens');
  }

  addTokens(address: string, tokens: TokenBalance[]): void {
    const cached = this.getFromLocalStorage('tokens') ?? {};
    cached[address] = tokens;
    this.saveToLocalStorage('tokens', cached);
  }

  hasTokensForEveryAddress(addresses: string[]): boolean {
    const cached = this.getFromLocalStorage('tokens') ?? {};
    return addresses.every((address) => address in cached);
  }

  getTokensForAddresses(addresses: string[]): Map<string, TokenBalance[]> {
    const cached = this.getFromLocalStorage('tokens') ?? {};
    let cachedTokens: Map<string, TokenBalance[]> = new Map();
    addresses.forEach((address: string) => {
      const tokens = cached[address] ?? [];
      cachedTokens.set(address, tokens);
    });
    return cachedTokens;
  }

  /**
   * Internal Transactions Cache
   */

  addAllInternalTransactions(transactions: Map<string, TransactionListItem[][]>): void {
    this.addAllUnitToCache('internalTransactions', transactions);
  }
  getAllInternalTransactions(): Map<string, TransactionListItem[][]> {
    return this.getAllCachedUnitAsMap('internalTransactions');
  }

  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void {
    const cached = this.getFromLocalStorage('internalTransactions') ?? {};
    cached[address] = transactions;
    this.saveToLocalStorage('internalTransactions', cached);
  }

  getInternalTransactions(address: string): TransactionListItem[][] | undefined {
    const cached = this.getFromLocalStorage('internalTransactions') ?? {};
    return cached[address];
  }

  hasInternalTransactionsForEveryAddress(addresses: string[]): boolean {
    const cached = this.getFromLocalStorage('internalTransactions') ?? {};
    return addresses.every((address) => address in cached);
  }

  getInternalTransactionsForAddresses(addresses: string[]): Map<string, TransactionListItem[][]> {
    const cached = this.getFromLocalStorage('internalTransactions') ?? {};
    let cachedTxns: Map<string, TransactionListItem[][]> = new Map();
    addresses.forEach((address: string) => {
      const txns = cached[address] ?? [];
      cachedTxns.set(address, txns);
    });
    return cachedTxns;
  }

  /**
   * Token Transfers Transactions Cache
   */

  addAllTokenTransfersTransactions(transactions: Map<string, TransactionListItem[][]>): void {
    this.addAllUnitToCache('tokenTransfersTransactions', transactions);
  }
  getAllTokenTransfersTransactions(): Map<string, TransactionListItem[][]> {
    return this.getAllCachedUnitAsMap('tokenTransfersTransactions');
  }

  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void {
    const cached = this.getFromLocalStorage('tokenTransfersTransactions') ?? {};
    cached[address] = transactions;
    this.saveToLocalStorage('tokenTransfersTransactions', cached);
  }

  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined {
    const cached = this.getFromLocalStorage('tokenTransfersTransactions') ?? {};
    return cached[address];
  }

  hasTokenTransfersTransactionsAddress(address: string): boolean {
    const cached = this.getFromLocalStorage('tokenTransfersTransactions') ?? {};
    return address in cached;
  }

  /**
   * FAVOURITE ADDRESSES
   */

  addAllFavoriteAddresses(favoriteAddresses: Set<string>): void {
    const cached: string[] = [];
    favoriteAddresses.forEach((address: string) => {
      cached.push(address.toLowerCase());
    });
    this.saveToLocalStorage('favoriteAddresses', cached);
  }

  getFavoriteAddresses(): Set<string> {
    const cached = this.getFromLocalStorage('favoriteAddresses') ?? [];
    return new Set([...cached]);
  }

  addFavoriteAddress(address: string): void {
    const cached = this.getFromLocalStorage('favoriteAddresses') ?? [];
    const addr = address.toLowerCase();
    if (!addr.length) return;
    if (cached.includes(addr)) {
      return;
    }
    cached.push(addr);
    this.saveToLocalStorage('favoriteAddresses', cached);
  }

  isFavoriteAddress(address: string): boolean {
    const cached = this.getFromLocalStorage('favoriteAddresses') ?? [];
    const addr = address.toLowerCase();
    return cached.includes(addr);
  }

  removeFavoriteAddress(address: string): void {
    const cached = this.getFromLocalStorage('favoriteAddresses') ?? [];
    const addr = address.toLowerCase();
    const updated = cached.filter((item: string) => item !== addr);
    this.saveToLocalStorage('favoriteAddresses', updated);
  }

  /**
   * NFT Cache
   */

  addAllNftLogs(logs: Map<string, NftLog[]>): void {
    this.addAllUnitToCache('nftLogs', logs);
  }

  getAllNftLogs(): Map<string, NftLog[]> {
    return this.getAllCachedUnitAsMap('nftLogs');
  }

  getNftLogs(address: string): NftLog[] {
    const cached = this.getFromLocalStorage('nftLogs') ?? {};
    return cached[address] || [];
  }

  addNftLogs(address: string, logs: NftLog[]): void {
    const cached = this.getFromLocalStorage('nftLogs') ?? {};
    cached[address] = logs;
    this.saveToLocalStorage('nftLogs', cached);
  }

  hasNftLogs(address: string): boolean {
    const cached = this.getFromLocalStorage('nftLogs') ?? {};
    return address in cached;
  }

  clearNftLogsImages(): void {
    const cached = (this.getFromLocalStorage('nftLogs') ?? {}) as Record<string, NftLog[]>;
    Object.values(cached).forEach((logs: NftLog[]) => {
      logs.forEach((log) => {
        delete log.tokenImageResolved;
        delete log.topicsTokenUri;
        delete log.tokenMetadata;
      });
    });
    this.saveToLocalStorage('nftLogs', cached);
  }
}
