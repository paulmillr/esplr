import type {
  ERC20TokenInfo,
  OtsSearchTransaction,
  OtsSearchTransactionExtended,
  TransactionListItem,
  NetTransfer,
} from '@/types';
import { decodeData } from 'micro-eth-signer/abi';
import { formatters, hexToNumber } from 'micro-eth-signer/utils';
import type {
  BlockInfo,
  TokenTransfer,
  TxInfo,
  TxTransfers,
  Unspent,
} from 'node_modules/micro-eth-signer/net/archive';

const SHOW_TXN_VALUE_PRECISION = 18;

export const getChainIdName = (netId: string) => {
  switch (parseInt(netId)) {
    case 1:
      return 'Mainnet';
    case 11155111:
      return 'Sepolia Testnet';
    case 17000:
      return 'Holesky Testnet';
    case 10:
      return 'Optimism Mainnet';
    case 100:
      return 'Gnosis Mainnet';
    case 137:
      return 'Matic/Polygon Mainnet';
    case 56:
      return 'BSC Mainnet';
    case 10200:
      return 'Gnosis Chiado Testnet';
    case 80001:
      return 'Matic/Polygon Mumbai Testnet';
    case 42161:
      return 'Arbitrum One Network';
    default:
      return 'Unknown Network';
  }
};

export const handleClickCopyIcon = (event: Event, text: string) => {
  const target = event.target as HTMLElement;
  target.classList.remove('bi-copy');
  target.classList.add('bi-check2');
  navigator.clipboard.writeText(text);
  setTimeout(() => {
    target.classList.add('bi-copy');
    target.classList.remove('bi-check2');
  }, 2000);
};

export const shortenFavAddr = (address: string | null) => {
  if (!address?.length) {
    return '-';
  }
  if (address.length < 18) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
};

// nine chars is suitable for layout in some cases
export const shortenAddr = (address: string | null) => {
  if (!address?.length) {
    return '-';
  }
  if (address.length < 9) {
    return address;
  }
  return `${address.slice(0, 9)}...`;
};

export const shortenAddr10 = (address: string | null) => {
  if (!address?.length) {
    return '-';
  }
  if (address.length < 10) {
    return address;
  }
  return `${address.slice(0, 10)}...`;
};

export const shortenTx = (txnHash: string) => {
  return `${txnHash.slice(0, 10)}...`;
};

export const shortenTx8 = (txnHash: string) => {
  return `${txnHash.slice(0, 8)}...`;
};

export const passedSecondsFrom = (milliseconds: number) => {
  return Math.floor((Date.now() - milliseconds) / 1000);
};

export const hasMinutesPassed = (pastTimestamp: number, minutes: number) => {
  return Date.now() - pastTimestamp > minutes * 60 * 1000;
};

export const getTransactionMethodName = (
  transaction: OtsSearchTransaction | TxInfo,
  type: string | null = null
) => {
  const t = transaction;
  const data = t.input;
  const value = type === 'ots' ? hexToNumber(t.value as string) : BigInt(t.value);
  if (!data?.length) {
    return '-';
  }
  if (data === '0x') {
    return 'Transfer';
  }
  // if (data.startsWith('0xe21fd0e9')) {
  //   return 'Swap'
  // }
  try {
    const decoded = decodeData(t.to, data, value);
    if (decoded && !Array.isArray(decoded) && decoded.name) {
      return decoded.name;
    }
  } catch (e) {
    console.warn('Decode txn data error: ', e);
    return '-';
  }
  if (data.length > 10) {
    return data.slice(0, 10);
  }
  return data;
};

export const formatUsdPrice = (usdValue: number): string => {
  return new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' }).format(usdValue);
};

export const fromWeiToGwei = (wei: bigint, precision: number): string => {
  const GWEI_PRECISION = 9;
  const GWEI = 10n ** BigInt(GWEI_PRECISION); // base
  const fixed = false;
  return formatters.formatBigint(wei, GWEI, precision, fixed);
};

export const fromWeiToEth = (wei: bigint, precision: number): string => {
  const ETH_PRECISION = 18;
  const ETHER = 10n ** BigInt(ETH_PRECISION); // base
  const fixed = false;
  return formatters.formatBigint(wei, ETHER, precision, fixed);
};

export const formatBigIntUsd = (value: bigint, decimals: number, precision: number): string => {
  const TOKEN = 10n ** BigInt(decimals);
  const fixed = false;
  return formatters.formatBigint(value, TOKEN, precision, fixed);
};

export const usdBalance = (
  tokenBalance: bigint,
  decimals: number,
  usdTokenPrice: number
): number => {
  const scaleDegree = 9;
  const scale = 10n ** BigInt(scaleDegree); // to keep precision
  const scaledPrice = BigInt(Math.round(usdTokenPrice * Number(scale)));
  const bigIntUsd = scaledPrice * tokenBalance;
  return parseFloat(formatBigIntUsd(bigIntUsd, decimals + scaleDegree, 2).replace('~', ''));
};

export const fromTokenBalanceToHumanReadable = (
  wei: bigint,
  decimals: number,
  precision: number
): string => {
  const TOKEN = 10n ** BigInt(decimals);
  const fixed = false;
  return formatters.formatBigint(wei, TOKEN, precision, fixed);
};

export const roundToTwo = (num: number) => {
  return Math.round(num * 100) / 100;
};

export const totalSupplyStr = (tokenInfo: ERC20TokenInfo) => {
  // TODO: write type guard to refactor the code
  const { totalSupply, decimals, symbol } = tokenInfo;
  if (!decimals || !symbol) return '-';
  const precision = decimals;
  const base = 10n ** BigInt(decimals);
  const fixed = false;
  const formated = formatters.formatBigint(totalSupply, base, precision, fixed);
  const [whole, fraction] = formated.split('.');
  const readableNum = `${parseInt(whole).toLocaleString()}.${fraction}`;
  const shortNum = readableNum.length > 20 ? `${readableNum.slice(0, 20)}...` : readableNum;
  return `${shortNum} ${symbol}`;
};

function isToday(ts: number) {
  return Date.now() - ts < 86400 * 1000;
}

export const getDateParts = (timestamp: number) => {
  const d = new Date(timestamp);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString();
  return { hours, minutes, day, month, year };
};

export const formatTimestampLocal = (timestamp: number) => {
  const { year, month, day, hours, minutes } = getDateParts(timestamp);
  if (isToday(timestamp)) return `${hours}:${minutes}`;
  return `${year}.${month}.${day} | ${hours}:${minutes}`;
};

export const currentDateLocalWithoutYear = () => {
  const { hours, minutes } = getDateParts(Date.now());
  return `${hours}:${minutes}`;
};

export const formatTimestampLocalWithoutYear = (timestamp: number) => {
  const { month, day, hours, minutes } = getDateParts(timestamp);
  if (isToday(timestamp)) return `${hours}:${minutes}`;
  return `${month}.${day} | ${hours}:${minutes}`;
};

export const isERC20TokenInfo = (info: unknown): info is ERC20TokenInfo => {
  return (
    info !== null &&
    typeof info === 'object' &&
    'abi' in info &&
    info.abi === 'ERC20' &&
    'name' in info &&
    'symbol' in info &&
    info.symbol !== '' &&
    'decimals' in info &&
    typeof info.decimals === 'number' &&
    info.decimals > 0 &&
    'contract' in info &&
    info.contract !== '' &&
    'totalSupply' in info &&
    typeof info.totalSupply === 'bigint' &&
    info.totalSupply > 0n
  );
};

export const isUnspent = (data: unknown): data is Unspent => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'symbol' in data &&
    'decimals' in data &&
    'balance' in data &&
    'nonce' in data &&
    'active' in data &&
    data.symbol === 'ETH' &&
    typeof data.decimals === 'number' &&
    typeof data.balance === 'bigint' &&
    typeof data.nonce === 'bigint' &&
    typeof data.active === 'boolean'
  );
};

export const isOtsContractCreator = (data: unknown): data is Unspent => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'creator' in data &&
    'hash' in data &&
    data.creator !== '' &&
    data.hash !== ''
  );
};

export const transfersToTxnsList = (transfers: TxTransfers[]): TransactionListItem[][] => {
  const transactions = transfers
    .map((i) => {
      const txns = [];
      const tx = i.info.info;
      const mainTxn = {
        hash: i.hash,
        date: i.timestamp ? formatTimestampLocal(i.timestamp) : '-',
        blockNumber: i.block?.toString() ?? '-',
        from: tx.from,
        to: tx.to,
        value: fromWeiToEth(BigInt(tx.value), SHOW_TXN_VALUE_PRECISION),
        method: getTransactionMethodName(tx), //'Transfer',
        symbol: 'ETH',
      };
      txns.push(mainTxn);
      i.tokenTransfers.forEach((transfer) => {
        const value = getTransferValue(transfer);
        const tokenTransfer = {
          hash: i.hash,
          date: i.timestamp ? formatTimestampLocal(i.timestamp) : '-',
          blockNumber: i.block?.toString() ?? '-',
          from: transfer.from,
          to: transfer.to,
          value: value,
          method: 'token', // getTransactionMethodName(tx),
          symbol: 'symbol' in transfer ? transfer.symbol : '',
        };
        txns.push(tokenTransfer);
      });
      return txns;
    })
    .filter((i) => i.length > 0);

  return transactions;
};

export const getTransferValue = (transfer: TokenTransfer) => {
  let value = '-';
  const transferValue = transfer.tokens.has(1n) ? transfer.tokens.get(1n) : undefined;
  const decimals = 'decimals' in transfer ? transfer.decimals : undefined;
  if (transferValue !== undefined && decimals !== undefined) {
    value = fromTokenBalanceToHumanReadable(transferValue, decimals, decimals);
  }
  return value;
};

export const txnsWithBlockDetailsToTxnsList = (
  txns: OtsSearchTransactionExtended[]
): TransactionListItem[][] => {
  return txns.map((i) => {
    const t = parseInt(i.blockData.timestamp);
    const timestamp = Number.isNaN(t) ? '-' : t * 1000;
    return [
      {
        hash: i.txn.hash,
        date: timestamp !== '-' ? formatTimestampLocal(timestamp) : '-',
        blockNumber: hexToNumber(i.txn.blockNumber).toString(),
        from: i.txn.from,
        to: i.txn.to,
        value: fromWeiToEth(BigInt(i.txn.value), SHOW_TXN_VALUE_PRECISION),
        method: getTransactionMethodName(i.txn, 'ots'),
        symbol: 'ETH',
        timestamp: timestamp,
      },
    ];
  });
};

export const removeTxnsListItemsDuplicates = (
  txnsList: TransactionListItem[][]
): TransactionListItem[][] => {
  const uniqueTxnsList: TransactionListItem[][] = [];
  const hashes = new Set<string>();
  for (const txns of txnsList) {
    const txnHash = txns[0].hash;
    if (hashes.has(txnHash)) {
      continue;
    }
    hashes.add(txnHash);
    uniqueTxnsList.push(txns);
  }
  return uniqueTxnsList;
};

export const sortTxnsListItemsByTimestamp = (
  txnsList: TransactionListItem[][]
): TransactionListItem[][] => {
  return txnsList.sort((a, b) => {
    if (a[0].timestamp === '-') return 1;
    if (b[0].timestamp === '-') return -1;
    return Number(b[0].timestamp) - Number(a[0].timestamp);
  });
};

export const stringArraysEqual = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.sort().toString() === arr2.sort().toString();
};

export const concatTransfers = (from: NetTransfer[], to: NetTransfer[]) => {
  const result = structuredClone(from);
  to.forEach((toTransfer) => {
    const inResult = result.some((fromTransafer) =>
      isERC20NetTransfersEqual(fromTransafer, toTransfer)
    );
    if (!inResult) {
      result.push(toTransfer);
    }
  });
  return result;
};

export const isERC20NetTransfersEqual = (a: NetTransfer, b: NetTransfer) => {
  if (a.addr !== b.addr || a.type !== b.type) {
    return false;
  }

  const at = a.transfer;
  const bt = b.transfer;

  const keysToCheck = [
    'abi',
    'contract',
    'decimals',
    'from',
    'name',
    'symbol',
    'to',
    'totalSupply',
  ];

  for (const key of keysToCheck) {
    if (!(key in at) || !(key in bt)) {
      return false;
    }

    // @ts-ignore
    if (at[key] !== bt[key]) {
      return false;
    }
  }

  const aValue = at.tokens.get(1n);
  const bValue = at.tokens.get(1n);
  if (aValue !== bValue) {
    return false;
  }

  return true;
};

// TODO: remove, not used
export const lastTxnsDataFromBlocks = (blocks: BlockInfo[], limit: number) => {
  const txnsData: { hash: string; timestamp: number }[] = [];
  try {
    for (const block of blocks) {
      for (const tx of block.transactions.reverse()) {
        txnsData.push({ hash: tx, timestamp: block.timestamp });
        if (txnsData.length == limit) {
          throw new Error('limit reached');
        }
      }
    }
  } catch {}
  return txnsData;
};

type WorkerFn<T, R> = (item: T, index: number) => Promise<R> | R;

export async function runWithConcurrency<T, R>(opts: {
  items: T[];
  concurrency: number;
  worker: WorkerFn<T, R>;
}): Promise<R[]> {
  const { items, concurrency, worker } = opts;

  if (concurrency < 1) {
    throw new Error('concurrency must be at least 1');
  }

  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) break;
      const { item, index } = next;
      const res = await worker(item, index);
      results[index] = res;
    }
  });

  await Promise.all(workers);
  return results;
}
