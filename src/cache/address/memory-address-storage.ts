import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
  UnspentWithUsd,
} from '@/types';
import { type AddressStorage } from '@/cache/address/address-storage';

export class MemoryAddressStorage implements AddressStorage {
  private static instance: MemoryAddressStorage;

  private tokens: Map<string, TokenBalance[]> = new Map();
  private internalTransactions: Map<string, TransactionListItem[][]> = new Map();
  private tokenTransfersTransactions: Map<string, TransactionListItem[][]> = new Map();
  private unspent: Map<string, UnspentWithUsd> = new Map();
  private updatedAtTimestamp: Map<string, number> = new Map();

  private tokenInfo: Map<string, ERC20TokenInfo | null> = new Map();
  private tokenCreator: Map<string, OtsGetContractCreatorResponse> = new Map();
  private ens: Map<string, string> = new Map();

  private favoriteAddresses = new Set<string>();

  private constructor() {}

  static getInstance(): MemoryAddressStorage {
    if (!MemoryAddressStorage.instance) {
      MemoryAddressStorage.instance = new MemoryAddressStorage();
    }
    return MemoryAddressStorage.instance;
  }

  getType(): string {
    return 'memory';
  }

  clearAll(): void {
    this.clear();
    this.favoriteAddresses.clear();
  }

  clear(): void {
    this.tokens.clear();
    this.internalTransactions.clear();
    this.tokenTransfersTransactions.clear();
    this.unspent.clear();
    this.updatedAtTimestamp.clear();
    this.tokenInfo.clear();
    this.tokenCreator.clear();
    this.ens.clear();
  }

  // tokenTransfersTransactions is not cleared here (because we are not loading them from scratch later for optimization)
  private clearAddressForUpdate(address: string): void {
    this.tokens.delete(address);
    this.internalTransactions.delete(address);
    this.unspent.delete(address);
    this.updatedAtTimestamp.delete(address);
    this.tokenInfo.delete(address);
    this.tokenCreator.delete(address);
    this.ens.delete(address);
  }

  clearFavorites(): void {
    this.favoriteAddresses.forEach((address) => {
      this.tokens.delete(address);
      this.internalTransactions.delete(address);
      this.tokenTransfersTransactions.delete(address);
      this.unspent.delete(address);
      this.updatedAtTimestamp.delete(address);
      this.tokenInfo.delete(address);
      this.tokenCreator.delete(address);
      this.ens.delete(address);
    });
    this.favoriteAddresses.clear();
  }

  clearAddressesForUpdate(addresses: string[]): void {
    addresses.forEach((address) => {
      this.clearAddressForUpdate(address);
    });
  }

  allCachedAddresses(): string[] {
    return Array.from(
      new Set([
        ...this.tokens.keys(),
        ...this.internalTransactions.keys(),
        ...this.tokenTransfersTransactions.keys(),
        ...this.unspent.keys(),
        ...this.updatedAtTimestamp.keys(),
        ...this.tokenInfo.keys(),
        ...this.tokenCreator.keys(),
        ...this.ens.keys(),
      ])
    );
  }

  /**
   * Update date timestamp cache
   */

  addAllUpdatedAtTimestamp(updatedAtTimestamp: Map<string, number>): void {
    this.updatedAtTimestamp = updatedAtTimestamp;
  }

  getAllUpdatedAtTimestamp(): Map<string, number> {
    return this.updatedAtTimestamp;
  }

  hasUpdatedAtTimestampForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.updatedAtTimestamp.has(address));
  }

  getUpdatedAtTimestampForAddresses(addresses: string[]): Map<string, number> {
    let cachedTimestamps: Map<string, number> = new Map();
    addresses.forEach((address: string) => {
      const timestamp = this.updatedAtTimestamp.get(address) ?? 0;
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
    addresses.forEach((address: string) => {
      this.updatedAtTimestamp.set(address, timestamp);
    });
  }

  /**
   * Token Creator Cache
   */

  addAllTokenCreator(tokenCreators: Map<string, OtsGetContractCreatorResponse>): void {
    this.tokenCreator = tokenCreators;
  }

  getAllTokenCreator(): Map<string, OtsGetContractCreatorResponse> {
    return this.tokenCreator;
  }

  addTokenCreator(address: string, tokenCreator: OtsGetContractCreatorResponse): void {
    this.tokenCreator.set(address, tokenCreator);
  }

  getTokenCreator(address: string): OtsGetContractCreatorResponse | undefined {
    return this.tokenCreator.get(address);
  }

  hasTokenCreator(address: string): boolean {
    return this.tokenCreator.has(address);
  }

  removeTokenCreator(address: string): void {
    this.tokenCreator.delete(address);
  }

  /**
   * Token Info Cache
   */

  addAllTokenInfo(tokenInfo: Map<string, ERC20TokenInfo | null>): void {
    this.tokenInfo = tokenInfo;
  }

  getAllTokenInfo(): Map<string, ERC20TokenInfo | null> {
    return this.tokenInfo;
  }

  addTokenInfo(address: string, tokenInfo: ERC20TokenInfo | null): void {
    this.tokenInfo.set(address, tokenInfo);
  }

  getTokenInfo(address: string): ERC20TokenInfo | undefined | null {
    return this.tokenInfo.get(address);
  }

  hasTokenInfo(address: string): boolean {
    return this.tokenInfo.has(address);
  }

  /**
   * ENS Cache
   */

  addAllEns(ens: Map<string, string>): void {
    this.ens = ens;
  }

  getAllEns(): Map<string, string> {
    return this.ens;
  }

  addEns(address: string, ens: string): void {
    this.ens.set(address, ens);
  }
  getEns(address: string): string | undefined {
    return this.ens.get(address);
  }
  hasEns(address: string): boolean {
    return this.ens.has(address);
  }

  /**
   * Unspent Cache
   */

  addAllUnspent(unspents: Map<string, UnspentWithUsd>): void {
    this.unspent = unspents;
  }

  getAllUnspent(): Map<string, UnspentWithUsd> {
    return this.unspent;
  }

  addUnspent(address: string, unspent: UnspentWithUsd): void {
    this.unspent.set(address, unspent);
  }

  getUnspent(address: string): UnspentWithUsd | undefined {
    return this.unspent.get(address);
  }

  hasUnspent(address: string): boolean {
    return this.unspent.has(address);
  }

  removeUnspent(address: string): void {
    this.unspent.delete(address);
  }

  /**
   * Tokens Balances Cache
   */

  addAllTokens(tokens: Map<string, TokenBalance[]>): void {
    this.tokens = tokens;
  }

  getAllTokens(): Map<string, TokenBalance[]> {
    return this.tokens;
  }

  addTokens(address: string, tokens: TokenBalance[]): void {
    this.tokens.set(address, tokens);
  }

  hasTokensForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.tokens.has(address));
  }

  getTokensForAddresses(addresses: string[]): Map<string, TokenBalance[]> {
    let cachedTokens: Map<string, TokenBalance[]> = new Map();
    addresses.forEach((address: string) => {
      const tokens = this.tokens.get(address) ?? [];
      cachedTokens.set(address, tokens);
    });
    return cachedTokens;
  }

  /**
   * Internal Transactions Cache
   */

  addAllInternalTransactions(transactions: Map<string, TransactionListItem[][]>): void {
    this.internalTransactions = transactions;
  }

  getAllInternalTransactions(): Map<string, TransactionListItem[][]> {
    return this.internalTransactions;
  }

  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.internalTransactions.set(address, transactions);
  }

  getInternalTransactions(address: string): TransactionListItem[][] | undefined {
    return this.internalTransactions.get(address);
  }

  hasInternalTransactionsForEveryAddress(addresses: string[]): boolean {
    return addresses.every((address) => this.internalTransactions.has(address));
  }

  getInternalTransactionsForAddresses(addresses: string[]): Map<string, TransactionListItem[][]> {
    let cachedTxns: Map<string, TransactionListItem[][]> = new Map();
    addresses.forEach((address: string) => {
      const txns = this.getInternalTransactions(address) || [];
      cachedTxns.set(address, txns);
    });
    return cachedTxns;
  }

  /**
   * Token Transfers Transactions Cache
   */

  addAllTokenTransfersTransactions(transactions: Map<string, TransactionListItem[][]>): void {
    this.tokenTransfersTransactions = transactions;
  }

  getAllTokenTransfersTransactions(): Map<string, TransactionListItem[][]> {
    return this.tokenTransfersTransactions;
  }

  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void {
    this.tokenTransfersTransactions.set(address, transactions);
  }

  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined {
    return this.tokenTransfersTransactions.get(address);
  }

  hasTokenTransfersTransactionsAddress(address: string): boolean {
    return this.tokenTransfersTransactions.has(address);
  }

  /**
   * FAVOURITE ADDRESSES
   */

  addAllFavoriteAddresses(favoriteAddresses: Set<string>): void {
    this.favoriteAddresses = new Set([...favoriteAddresses].map((s) => s.toLowerCase()));
  }

  getFavoriteAddresses(): Set<string> {
    return this.favoriteAddresses;
  }

  addFavoriteAddress(address: string): void {
    const addr = address.toLowerCase();
    this.favoriteAddresses.add(addr);
  }

  isFavoriteAddress(address: string): boolean {
    const addr = address.toLowerCase();
    return this.favoriteAddresses.has(addr);
  }

  removeFavoriteAddress(address: string): void {
    const addr = address.toLowerCase();
    this.favoriteAddresses.delete(addr);
  }
}
