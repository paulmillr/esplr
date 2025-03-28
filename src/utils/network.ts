import type { Web3Provider } from 'micro-eth-signer/net';
import type {
  TokenBalances,
  BlockInfo,
  TxReceipt,
} from 'node_modules/micro-eth-signer/net/archive';
import type { NetTransfer } from '@/types';
import { TOKENS } from 'micro-eth-signer/abi';
import { isERC20TokenInfo } from '@/utils/utils';

import type {
  OtsSearchTransactionsBeforeResponse,
  OtsSearchTransaction,
  OtsGetBlockDetailsResponse,
  ERC20TokenInfo,
  TokenBalance,
  TxInfoExtended,
  OtsSearchTransactionExtended,
} from '@/types';

export const getBlockDetailsByHash = async (
  prov: Web3Provider,
  blockHash: string
): Promise<OtsGetBlockDetailsResponse> => {
  return await prov.call('ots_getBlockDetailsByHash', blockHash);
};

export const getTransactionsBefore = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionsBeforeResponse> => {
  return await prov.call('ots_searchTransactionsBefore', address, blockNumber, pageSize);
};

export const getTransactionsAfter = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionsBeforeResponse> => {
  return await prov.call('ots_searchTransactionsAfter', address, blockNumber, pageSize);
};

export const getTransactionsBeforeWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionExtended[]> => {
  const transactions = await getTransactionsBefore(prov, address, blockNumber, pageSize);
  return transactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = transactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getTransactionsAfterWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  blockNumber: number,
  pageSize: number
): Promise<OtsSearchTransactionExtended[]> => {
  const transactions = await getTransactionsAfter(prov, address, blockNumber, pageSize);
  return transactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = transactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getLatestTxnsWithBlockDetails = async (
  prov: Web3Provider,
  address: string,
  limit: number
): Promise<OtsSearchTransactionExtended[]> => {
  const blockNumber = 0; // A value of 0 means the search is to be done from the most recent block
  const latestTransactions = await getTransactionsBefore(prov, address, blockNumber, limit);
  return latestTransactions.txs.map((txn: OtsSearchTransaction) => {
    const receipt = latestTransactions.receipts.find((r) => r.transactionHash === txn.hash);
    const blockData = {
      timestamp: receipt?.timestamp ?? '-',
    };
    return { txn, blockData };
  });
};

export const getGasPriceWei = async (prov: Web3Provider) => {
  const gasPriceHex = await prov.call('eth_gasPrice');
  return BigInt(gasPriceHex);
};

export const getERC20TokenInfo = async (
  prov: Web3Provider,
  contractAddress: string
): Promise<ERC20TokenInfo | null> => {
  const info = await prov.tokenInfo(contractAddress as string);
  return isERC20TokenInfo(info) ? info : null;
};

export const loadTokenInfoByBalances = async (
  prov: Web3Provider,
  balances: TokenBalances
): Promise<TokenBalance[]> => {
  return await Promise.all(
    Object.entries(balances).map(async ([token, erc20Balance]) => {
      const result = {
        token,
        balance: null as bigint | null,
        info: null as ERC20TokenInfo | null,
      };
      // accrording to micro-eth-signer format ERC20 balances are stored as Map([[1n, balance]])
      if ('get' in erc20Balance) {
        result.balance = erc20Balance.get(1n) ?? null;
      } else {
        console.warn(`Error fetching token balance for token ${token}:`);
        result.balance = null;
      }

      try {
        result.info = await getERC20TokenInfo(prov, token);
      } catch (e) {
        console.warn(`Error fetching token info for token ${token}:`, e);
        result.info = null;
      }

      return result;
    })
  );
};

export const getLastBlocksBefore = async (
  prov: Web3Provider,
  fromBlock: number,
  count: number
): Promise<BlockInfo[]> => {
  if (count == 0 || fromBlock == 0) return [];
  const blockPromises = Array.from({ length: count }, (_, i) => prov.blockInfo(fromBlock - i));
  return await Promise.all(blockPromises);
};

export const getLastTransactions = async (
  prov: Web3Provider,
  lastBlocks: BlockInfo[],
  limit: number
): Promise<TxInfoExtended[]> => {
  const txnsHashes = new Map<string, number>();
  for (const block of lastBlocks) {
    for (const txn of block.transactions.reverse()) {
      if (txnsHashes.size === limit) {
        break;
      }
      txnsHashes.set(txn, block.timestamp);
    }
    if (txnsHashes.size === limit) {
      break;
    }
  }

  const txns = await Promise.all(
    [...txnsHashes].map(async ([hash, timestamp]) => {
      const txn = await prov.call('eth_getTransactionByHash', hash);
      txn.blockData = { timestamp };
      return txn;
    })
  );
  return txns;
};

export const getLastTxnsByAddresses = async (
  prov: Web3Provider,
  addresses: string[],
  limit: number
): Promise<OtsSearchTransactionExtended[]> => {
  const results = await Promise.all(
    addresses.map(async (addr) => {
      return await prov.call('ots_searchTransactionsBefore', addr, 0, limit);
    })
  );

  const txnsByAddr = results.map((res) => {
    return res.txs.map((txn: OtsSearchTransaction) => {
      const receipt = res.receipts.find((r: TxReceipt) => r.transactionHash === txn.hash);
      const blockData = {
        timestamp: receipt?.timestamp ?? '-',
      };
      return { txn, blockData };
    });
  });

  const allTxnsList = txnsByAddr.flat();
  const uniqueTxnsList: OtsSearchTransactionExtended[] = [];

  const hashes = new Set<string>();
  for (const txn of allTxnsList) {
    const txnHash = txn.txn.hash;
    if (hashes.has(txnHash)) {
      continue;
    }
    hashes.add(txnHash);
    uniqueTxnsList.push(txn);
  }

  const sortedTxns = uniqueTxnsList.sort((a, b) => {
    if (a.blockData.timestamp === '-') return 1;
    if (b.blockData.timestamp === '-') return -1;
    return parseInt(b.blockData.timestamp) - parseInt(a.blockData.timestamp);
  });

  return sortedTxns.slice(0, limit);
};

export const getPositiveTokenBalances = async (prov: Web3Provider, address: string) => {
  const balances = await prov.tokenBalances(address, Object.keys(TOKENS));
  const positiveBalances = Object.fromEntries(
    Object.entries(balances).filter(([, balance]) => {
      // @ts-expect-error: balance might not be a Map if there is TokenError instead
      return balance instanceof Map && balance?.get(1n) > 0n;
    })
  );
  return positiveBalances;
};

export const getTokenTransfersForTxn = async (
  prov: Web3Provider,
  hash: string,
  address: string,
  block: number
): Promise<NetTransfer[]> => {
  const txnTransfers = (
    await prov.transfers(address, {
      fromBlock: block,
      toBlock: block,
    })
  ).filter((t) => t.hash === hash);

  console.log('txnTransfers', txnTransfers);

  const tokenTransfers = txnTransfers.length ? txnTransfers[0].tokenTransfers : [];
  if (!tokenTransfers.length) {
    return [];
  }

  const addresses = new Set<string>();
  const hasAddress = tokenTransfers.some((t) => t.from === address || t.to === address);
  if (hasAddress) {
    addresses.add(address);
  }
  tokenTransfers.forEach((t) => {
    addresses.add(t.from);
    addresses.add(t.to);
  });

  const erc20NetTransfers: NetTransfer[] = [];
  addresses.forEach((addr) => {
    tokenTransfers.forEach((t) => {
      if (t.from === addr) erc20NetTransfers.push({ addr, type: 'sent', transfer: t });
    });
    tokenTransfers.forEach((t) => {
      if (t.to === addr) erc20NetTransfers.push({ addr, type: 'received', transfer: t });
    });
  });

  return erc20NetTransfers;
};
