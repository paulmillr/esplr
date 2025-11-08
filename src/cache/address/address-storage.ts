import type {
  ERC20TokenInfo,
  OtsGetContractCreatorResponse,
  TokenBalance,
  TransactionListItem,
  UnspentWithUsd,
  NftLog,
} from '@/types';

export interface AddressStorage {
  clear(): void;
  clearAll(): void;
  clearAddressesForUpdate(addresses: string[]): void;
  clearFavorites(): void;

  allCachedAddresses(): string[];

  getType(): string;

  addAllUpdatedAtTimestamp(updatedAtTimestamp: Map<string, number>): void;
  getAllUpdatedAtTimestamp(): Map<string, number>;
  hasUpdatedAtTimestampForEveryAddress(addresses: string[]): boolean;
  getUpdatedAtTimestampForAddresses(addresses: string[]): Map<string, number>;
  getLowestUpdatedAtTimestampForAddresses(addresses: string[]): number;
  setUpdatedAtTimestampForAddresses(addresses: string[], timestamp: number): void;

  addAllTokenCreator(tokenCreators: Map<string, OtsGetContractCreatorResponse>): void;
  getAllTokenCreator(): Map<string, OtsGetContractCreatorResponse>;
  addTokenCreator(address: string, tokenCreator: OtsGetContractCreatorResponse): void;
  getTokenCreator(address: string): OtsGetContractCreatorResponse | undefined;
  hasTokenCreator(address: string): boolean;
  removeTokenCreator(address: string): void;

  addAllTokenInfo(tokenInfo: Map<string, ERC20TokenInfo | null>): void;
  getAllTokenInfo(): Map<string, ERC20TokenInfo | null>;
  addTokenInfo(address: string, tokenInfo: ERC20TokenInfo | null): void;
  getTokenInfo(address: string): ERC20TokenInfo | undefined | null;
  hasTokenInfo(address: string): boolean;

  addAllEns(ens: Map<string, string>): void;
  getAllEns(): Map<string, string>;
  addEns(address: string, ens: string): void;
  getEns(address: string): string | undefined;
  hasEns(address: string): boolean;

  addAllUnspent(unspents: Map<string, UnspentWithUsd>): void;
  getAllUnspent(): Map<string, UnspentWithUsd>;
  addUnspent(address: string, unspent: UnspentWithUsd): void;
  getUnspent(address: string): UnspentWithUsd | undefined;
  hasUnspent(address: string): boolean;
  removeUnspent(address: string): void;

  getAllTokens(): Map<string, TokenBalance[]>;
  addAllTokens(tokens: Map<string, TokenBalance[]>): void;
  addTokens(address: string, tokens: TokenBalance[]): void;
  hasTokensForEveryAddress(addresses: string[]): boolean;
  getTokensForAddresses(addresses: string[]): Map<string, TokenBalance[]>;

  addAllInternalTransactions(transactions: Map<string, TransactionListItem[][]>): void;
  getAllInternalTransactions(): Map<string, TransactionListItem[][]>;
  addInternalTransactions(address: string, transactions: TransactionListItem[][]): void;
  getInternalTransactions(address: string): TransactionListItem[][] | undefined;
  hasInternalTransactionsForEveryAddress(addresses: string[]): boolean;
  getInternalTransactionsForAddresses(addresses: string[]): Map<string, TransactionListItem[][]>;

  addAllTokenTransfersTransactions(transactions: Map<string, TransactionListItem[][]>): void;
  getAllTokenTransfersTransactions(): Map<string, TransactionListItem[][]>;
  addTokenTransfersTransactions(address: string, transactions: TransactionListItem[][]): void;
  getTokenTransfersTransactions(address: string): TransactionListItem[][] | undefined;
  hasTokenTransfersTransactionsAddress(address: string): boolean;

  addAllFavoriteAddresses(favoriteAddresses: Set<string>): void;
  getFavoriteAddresses(): Set<string>;
  addFavoriteAddress(address: string): void;
  isFavoriteAddress(address: string): boolean;
  removeFavoriteAddress(address: string): void;

  addAllNftLogs(logs: Map<string, NftLog[]>): void;
  getAllNftLogs(): Map<string, NftLog[]>;
  getNftLogs(address: string): NftLog[];
  addNftLogs(address: string, logs: NftLog[]): void;
  hasNftLogs(address: string): boolean;
  clearNftLogsImages(): void;
}
