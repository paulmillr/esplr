import type {
  TxInfo,
  Unspent,
  TokenTransfer,
  Log,
} from 'node_modules/micro-eth-signer/net/archive';

export type TxInfoExtended = TxInfo & {
  blockData: {
    timestamp: number;
  };
};

export type OtsSearchTransaction = {
  accessList: Array<{ address: string; storageKeys: string[] }>;
  blockHash: string;
  blockNumber: string;
  chainId: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  nonce: string;
  r: string;
  s: string;
  to: string;
  transactionIndex: string;
  type: string;
  v: string;
  value: string;
  yParity: string;
};

export type OtsSearchTransactionExtended = {
  txn: OtsSearchTransaction;
  blockData: {
    timestamp: string;
  };
};

export type OtsSearchReceipt = {
  blockHash: string;
  blockNumber: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: Array<{
    address: string;
    data: string;
    topics: string[];
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
  }>;
  logsBloom: string;
  status: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
  type: string;
  timestamp?: string;
};

export type OtsSearchTransactionsBeforeResponse = {
  txs: OtsSearchTransaction[];
  receipts: OtsSearchReceipt[];
  firstPage: boolean;
  lastPage: boolean;
};

export type OtsGetBlockDetailsResponse = {
  block: {
    baseFeePerGas: string;
    blobGasUsed: string;
    difficulty: string;
    excessBlobGas: string;
    extraData: string;
    gasLimit: string;
    gasUsed: string;
    hash: string;
    logsBloom: string;
    miner: string;
    mixHash: string;
    nonce: string;
    number: string;
    parentBeaconBlockRoot: string;
    parentHash: string;
    receiptsRoot: string;
    sha3Uncles: string;
    size: string;
    stateRoot: string;
    timestamp: string;
    transactionCount: string;
    transactionsRoot: string;
    uncles: string[];
    withdrawals: Array<{
      index: string;
      validatorIndex: string;
      address: string;
      amount: string;
    }>;
    withdrawalsRoot: string;
  };
  issuance: Array<{
    blockReward: string;
    uncleReward: string;
    issuance: string;
  }>;
  totalFees: string;
};

export type OtsGetContractCreatorResponse = {
  creator: string;
  hash: string;
};

export type ERC20TokenInfo = {
  abi: 'ERC20';
  name: string;
  symbol: string;
  decimals: number;
  contract: string;
  totalSupply: bigint;
};

export type TransactionListItem = {
  hash: string;
  date: string;
  blockNumber: string;
  from: string;
  to: string;
  method: string;
  value: string;
  symbol: string;
  timestamp?: number | string;
};

export type TokenBalance = {
  token: string;
  balance: bigint;
  info: ERC20TokenInfo;
  usd?: {
    price: number;
    balance: number;
  };
};

export type FavoriteAddress = {
  address: string;
  contractCreator: string;
  unspent: Unspent | null;
};

export type UnspentWithUsd = Unspent & {
  usdBalance: number | null;
};

export type NetTransfer = {
  addr: string;
  type: string;
  transfer: TokenTransfer;
};

export type NftLog = Log & {
  topicsDecoded: {
    from: string;
    to: string;
    tokenId: bigint;
  };
  tokenInfo: any;
  topicsTokenOwner: string | null | undefined;
  topicsTokenUri?: {
    original?: string;
    resolved?: string;
  };
  tokenMetadata?: {
    symbol?: string;
    image?: string;
  };
  tokenImageResolved?: string;
};
