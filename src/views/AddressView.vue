<script setup lang="ts">
import { onMounted, inject, watch, ref, type Ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Web3Provider, Chainlink } from 'micro-eth-signer/net';
import { ENS } from 'micro-eth-signer/net';
import { ETH_DECIMALS } from '@/constants';
import {
  getERC20TokenInfo,
  loadTokenInfoByBalances,
  getPositiveTokenBalances,
} from '@/utils/network';
import {
  transfersToTxnsList,
  usdBalance,
  hasMinutesPassed,
  isUnspent,
  isOtsContractCreator,
} from '@/utils/utils';
import type {
  ERC20TokenInfo,
  TransactionListItem,
  TokenBalance,
  OtsGetContractCreatorResponse,
  FavoriteAddress,
  UnspentWithUsd,
} from '@/types';
import AddressHeader from '@/components/address-view/AddressHeader.vue';
import FavoritesHeader from '@/components/address-view/FavoritesHeader.vue';
import TransactionsList from '@/components/address-view/TransactionsList.vue';
import Sourcify from '@/components/address-view/Sourcify.vue';

import { useSettingsStore } from '@/stores/settings';
import { useAppStore } from '@/stores/app';
import { AddressCache } from '@/cache/address/address';
import { MainPageCache } from '@/cache/main-page/main-page';
import { DetailsPagination } from '@/views/DetailsPagination';
import { FavoritesPagination } from '@/views/FavoritesPagination';

const router = useRouter();
const route = useRoute();

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

const settingsStore = useSettingsStore();
const appStore = useAppStore();

const SHOW_TXNS_LIMIT = 25;

const address = ref('');
const loadingTxns = ref(false);
const transactionsList = ref<TransactionListItem[][]>([]);

/* single address */
const tokenCreator = ref<OtsGetContractCreatorResponse | null>(null);
const tokenInfo = ref<ERC20TokenInfo | null>(null);
const ensName = ref('');
/* single address */

const loadingTokens = ref(false);
const tokens = ref<TokenBalance[]>([]);
const activeTab = ref('internal');
const lastUpdateTimestamp = ref(0);
const warning = ref('');
const loadingPage = ref(false);

const cache = AddressCache.getInstance();
let updateTokenTransfersRequested = false;

const mainDataCache = MainPageCache.getInstance();

const detailsPagination = DetailsPagination.getInstance(prov, SHOW_TXNS_LIMIT);
const favoritesPagination = FavoritesPagination.getInstance(prov, SHOW_TXNS_LIMIT, cache);
const isFirstPage = ref(true);
const isLastPage = ref(false);
const currentPage = ref(1);

const isSourcify = computed(() => route.name === 'sourcify');
const isFavorites = computed(() => route.name === 'favorites');
const isNFT = computed(() => route.name === 'nfts');
const favorites = ref<FavoriteAddress[]>([]);

const sumUnspentTxns = ref(0n);
const sumBalance = ref(0n);
const sumUnspentEthUsd = ref(0);
const loadingUnspent = ref(false);

const showErigonDetailsTxnsWarning = ref(false);

const tokensError = ref(false);
const tokensPricesError = ref(false);
const unspentError = ref(false);
const unspentPriceError = ref(false);

// TODO: temp
const noAddresses = ref(false);

watch(
  () => route.params.address,
  async (newAddress) => {
    const address = newAddress as string;
    const addresses = isFavorites.value
      ? Array.from(cache.getFavoriteAddresses())
      : [address.toLowerCase()];
    setTab('internal');
    await mountOrUpdate(addresses);
  }
);

const clearState = () => {
  appStore.setOtsApiError(false);

  address.value = '';
  transactionsList.value = [];
  tokenCreator.value = null;
  tokenInfo.value = null;
  tokens.value = [];
  warning.value = '';
  sumUnspentTxns.value = 0n;
  sumBalance.value = 0n;
  sumUnspentEthUsd.value = 0;
  favorites.value = [];
  noAddresses.value = false;
  ensName.value = '';
};

const showOfflineNotice = () => {
  warning.value = 'No internet connection. Please check your network settings.';
  setTimeout(() => {
    warning.value = '';
  }, 7000);
};

onMounted(async () => {
  const address = route.params.address as string;
  const addresses = isFavorites.value
    ? Array.from(cache.getFavoriteAddresses())
    : [address.toLowerCase()];
  await mountOrUpdate(addresses);
});

const mountOrUpdate = async (addresses: string[]) => {
  const online = window.navigator.onLine;
  if (!online) showOfflineNotice();

  if (cache.hasUpdatedAtTimestampForEveryAddress(addresses) && online) {
    const lastUpdateTimestamp = cache.getLowestUpdatedAtTimestampForAddresses(addresses);
    if (hasMinutesPassed(lastUpdateTimestamp, settingsStore.cacheUpdateInterval)) {
      await updateData(addresses);
      return;
    }
  }

  await mount(addresses);
};

const updateData = async (addresses: string[]) => {
  if (!window.navigator.onLine) {
    showOfflineNotice();
    return;
  }

  if (isNFT.value) {
    router.push({ path: `/address/${addresses[0]}` });
  }

  cache.clearAddressesForUpdate(addresses);
  if (!isFavorites.value) {
    setUpdatingAddressStatus();
  }

  await mount(addresses);
};

const setUpdatingAddressStatus = () => {
  updateTokenTransfersRequested = true;
};

const mount = async (addresses: string[]) => {
  clearState();
  address.value = addresses[0];

  setLoadingUnspent(true);
  setLoadingTxns(true);
  setLoadingTokens(true);

  await loadUnspentWithContractDetails(addresses);

  if (activeTab.value === 'internal') {
    await loadAddressesTransactions(addresses);
  } else if (activeTab.value === 'details') {
    // TODO: make loading transfers for favorites too, not only for single address
    await loadTransfers(addresses[0]);
  }

  await loadAddressesTokens(addresses);

  refreshUpdatedAt(addresses);
};

const refreshUpdatedAt = (addresses: string[]) => {
  if (cache.hasUpdatedAtTimestampForEveryAddress(addresses)) {
    lastUpdateTimestamp.value = cache.getLowestUpdatedAtTimestampForAddresses(addresses);
  } else {
    const timestamp = Date.now();
    lastUpdateTimestamp.value = timestamp;
    cache.setUpdatedAtTimestampForAddresses(addresses, timestamp);
  }
};

const injectUsdToUnspent = async (unspent: UnspentWithUsd) => {
  const link = new Chainlink(prov);
  const usdTokenPrice = await link.coinPrice('ETH');
  if (usdTokenPrice <= 0) {
    throw new Error('Invalid ETH price.');
  }
  unspent.usdBalance = usdBalance(unspent.balance, ETH_DECIMALS, usdTokenPrice);
};

const getAddrUnspent = async (address: string) => {
  if (cache.hasUnspent(address)) {
    const unspent = cache.getUnspent(address) ?? null;
    if (settingsStore.showUsdPrices && unspent && !unspent.usdBalance) {
      try {
        await injectUsdToUnspent(unspent);
        cache.addUnspent(address, unspent);
      } catch (error) {
        unspentPriceError.value = true;
        console.error(error);
      }
    }
    return unspent;
  }

  let unspent: UnspentWithUsd | null = null;
  try {
    const result = (await prov.unspent(address)) as UnspentWithUsd;
    if (!isUnspent(result)) {
      throw new Error('Invalid unspent data.');
    }
    unspent = result;
    cache.addUnspent(address, unspent);
  } catch (error) {
    unspentError.value = true;
    console.error(error);
  }

  if (settingsStore.showUsdPrices && unspent) {
    try {
      await injectUsdToUnspent(unspent);
      cache.addUnspent(address, unspent);
    } catch (error) {
      unspentPriceError.value = true;
      console.error(error);
    }
  }

  return unspent;
};

const getENSName = async (address: string) => {
  if (cache.hasEns(address)) {
    return cache.getEns(address) ?? '';
  }
  try {
    const ens = new ENS(prov);
    const name = (await ens.addressToName(address)) ?? '';
    cache.addEns(address, name);
    return name;
  } catch (error) {
    console.error(error);
    return '';
  }
};

const loadUnspentWithContractDetails = async (addresses: string[]) => {
  setLoadingUnspent(true);
  unspentPriceError.value = false;
  unspentError.value = false;

  const allUnspent = await Promise.all(
    addresses.map(async (address: string) => {
      const [contractCreator, unspent, ensAddressName] = await Promise.all([
        getContractCreator(address),
        getAddrUnspent(address),
        getENSName(address),
      ]);
      return {
        address,
        contractCreator,
        unspent,
        ensAddressName,
      };
    })
  );

  if (isFavorites.value) {
    favorites.value = allUnspent;
  } else {
    const { contractCreator, address, ensAddressName } = allUnspent[0];
    if (contractCreator || appStore.otsApiError) {
      // anyway info and creator will be null if there are no data
      try {
        tokenInfo.value = await getTokenInfo(address);
      } catch (error) {
        console.error(error);
      }
      tokenCreator.value = contractCreator;
    }
    ensName.value = ensAddressName;
  }

  // TODO: check that worked correctly after adding possibility to add contract addresses to favorites
  const userUnspent = allUnspent.filter((i) => !i.contractCreator);
  sumUnspentTxns.value = userUnspent.reduce((acc, curr: { unspent: UnspentWithUsd | null }) => {
    if (!curr.unspent) return acc;
    return acc + BigInt(curr.unspent.nonce);
  }, 0n);

  sumBalance.value = allUnspent.reduce((acc, curr: { unspent: UnspentWithUsd | null }) => {
    if (!curr.unspent) return acc;
    return acc + BigInt(curr.unspent.balance);
  }, 0n);

  sumUnspentEthUsd.value = allUnspent.reduce((acc, curr: { unspent: UnspentWithUsd | null }) => {
    if (!curr.unspent) return acc;
    return acc + (curr.unspent.usdBalance ?? 0);
  }, 0);

  setLoadingUnspent(false);
};

const getContractCreator = async (address: string) => {
  if (cache.hasTokenCreator(address)) {
    return cache.getTokenCreator(address) ?? null;
  }
  let creator = null;
  try {
    const result = await prov.call('ots_getContractCreator', address);
    if (result !== null && !isOtsContractCreator(result)) {
      throw new Error('Invalid OTS contract creator data.');
    }
    creator = result;
    cache.addTokenCreator(address, creator);
  } catch (error) {
    appStore.setOtsApiError(true);
    console.error(error);
  }
  return creator;
};

const getTokenInfo = async (address: string) => {
  if (cache.hasTokenInfo(address)) {
    return cache.getTokenInfo(address) ?? null;
  }
  const info = await getERC20TokenInfo(prov, address);
  cache.addTokenInfo(address, info);
  return info;
};

const loadAddressesTransactions = async (addresses: string[]) => {
  setTab('internal');
  setLoadingTxns(true);

  let cachedTxns: TransactionListItem[][] = [];
  if (cache.hasInternalTransactionsForEveryAddress(addresses)) {
    const cached = cache.getInternalTransactionsForAddresses(addresses);
    for (const [, txns] of cached) {
      cachedTxns = cachedTxns.concat(txns);
    }
  }

  try {
    transactionsList.value = await favoritesPagination.showFirstPage(addresses, cachedTxns);
    // TODO: make caching for favorites too
    if (!isFavorites.value) {
      cache.addInternalTransactions(
        addresses[0],
        favoritesPagination.currentPageTxns.concat(favoritesPagination.nextPageReminder)
      );
    }
    updatePagesState(favoritesPagination);
  } catch (error) {
    if (!addresses.length) {
      // case when user removed all addresses on favorites page
      noAddresses.value = true;
    } else {
      appStore.setOtsApiError(true);
      console.error(error);
    }
  }

  setLoadingTxns(false);
};

const loadAddressesTokens = async (addresses: string[]) => {
  setLoadingTokens(true);

  tokensError.value = false;
  tokensPricesError.value = false;

  if (cache.hasTokensForEveryAddress(addresses)) {
    const cached = cache.getTokensForAddresses(addresses);

    // load tokens prices, if price for some of them is missing
    if (settingsStore.showUsdPrices) {
      let allHasPrice = true;
      for (const [, tokens] of cached) {
        allHasPrice = tokens.every((t) => t.usd);
        if (!allHasPrice) break;
      }

      if (!allHasPrice) {
        try {
          const cachedWithUsd = await injectUsdPricesToTokenBalances(cached);
          for (const [addr, tokens] of cachedWithUsd) {
            cache.addTokens(addr, tokens);
          }
        } catch (error) {
          console.error(error);
          tokensPricesError.value = true;
        }
      }
    }

    const updatedCache = cache.getTokensForAddresses(addresses);
    tokens.value = caclculateTokensSumBalances(updatedCache);
    setLoadingTokens(false);
    return;
  }

  let results: [string, TokenBalance[]][] = [];
  try {
    results = await Promise.all(
      addresses.map(async (addr) => {
        const positiveBalances = await getPositiveTokenBalances(prov, addr);
        const tokens = await loadTokenInfoByBalances(prov, positiveBalances);
        return [addr, tokens];
      })
    );
  } catch (error) {
    console.error(error);
    tokensError.value = true;
    setLoadingTokens(false);
    return;
  }

  let resultsMap = new Map<string, TokenBalance[]>();
  for (const [addr, tokens] of results) {
    resultsMap.set(addr as string, tokens as TokenBalance[]);
  }

  if (settingsStore.showUsdPrices) {
    try {
      resultsMap = await injectUsdPricesToTokenBalances(resultsMap);
    } catch (error) {
      console.error(error);
      tokensPricesError.value = true;
    }
  }

  for (const [addr, tokens] of resultsMap) {
    cache.addTokens(addr, tokens);
  }

  tokens.value = caclculateTokensSumBalances(resultsMap);
  setLoadingTokens(false);
};

const injectUsdPricesToTokenBalances = async (
  tokensMap: Map<string, TokenBalance[]>
): Promise<Map<string, TokenBalance[]>> => {
  const resultsMap = new Map<string, TokenBalance[]>();
  const cachedTokensPrices = new Map<string, number>();
  for (const [addr, tokens] of tokensMap) {
    const tokensUsd = await injectUsdPriceToTokenBalances(
      tokens as TokenBalance[],
      cachedTokensPrices
    );
    tokensUsd.forEach((t) => {
      if (t.usd && t.usd.price) {
        cachedTokensPrices.set(t.info.symbol, t.usd.price);
      }
    });
    resultsMap.set(addr, tokensUsd);
  }
  return resultsMap;
};

const caclculateTokensSumBalances = (tokensMap: Map<string, TokenBalance[]>): TokenBalance[] => {
  let allAddressesTokens: TokenBalance[] = [];
  for (const [, tokens] of tokensMap) {
    allAddressesTokens = allAddressesTokens.concat(tokens as TokenBalance[]);
  }

  let allTokensHasPrice = false;
  if (settingsStore.showUsdPrices) {
    for (const [, tokens] of tokensMap) {
      allTokensHasPrice = tokens.every((t) => t.usd);
      if (!allTokensHasPrice) break;
    }
  }

  const allTokensSumBalances = new Map<string, TokenBalance>();
  allAddressesTokens.forEach((t) => {
    const existingBalance = allTokensSumBalances.get(t.token)?.balance ?? 0n;
    const newBalance = existingBalance + t.balance;

    if (settingsStore.showUsdPrices && allTokensHasPrice && t.usd) {
      const existingUsdBalance = allTokensSumBalances.get(t.token)?.usd?.balance ?? 0;
      const newUsdBalance = existingUsdBalance + t.usd.balance;
      const newUsd = { balance: newUsdBalance, price: t.usd.price };
      allTokensSumBalances.set(t.token, { ...t, balance: newBalance, usd: newUsd });
    } else {
      allTokensSumBalances.set(t.token, { ...t, balance: newBalance });
    }
  });

  return Array.from(allTokensSumBalances.values());
};

const injectUsdPriceToTokenBalances = async (
  tokens: TokenBalance[],
  cache: Map<string, number> | null = null
): Promise<TokenBalance[]> => {
  const link = new Chainlink(prov);
  return await Promise.all(
    tokens.map(async (token) => {
      let usdTokenPrice = null;
      if (cache && cache.has(token.info.symbol)) {
        usdTokenPrice = cache.get(token.info.symbol);
      }
      if (usdTokenPrice === null || usdTokenPrice === undefined) {
        usdTokenPrice = await link.tokenPrice(token.info.symbol);
      }

      if (usdTokenPrice <= 0) {
        throw new Error('Invalid token price.');
      }

      const balance = token.balance;
      const decimals = token.info.decimals;
      const usd = usdBalance(balance, decimals, usdTokenPrice);

      return { ...token, usd: { balance: usd, price: usdTokenPrice } };
    })
  );
};

const loadTransfers = async (address: string) => {
  if (!appStore.isErigon) {
    updateTokenTransfersRequested = false;
    showErigonDetailsTxnsWarning.value = true;
    setTimeout(() => {
      showErigonDetailsTxnsWarning.value = false;
    }, 7000);
    return;
  }

  setTab('details');
  setLoadingTxns(true);

  const hasCache = cache.hasTokenTransfersTransactionsAddress(address);

  // load from cache by default
  let allTxns: TransactionListItem[][] = [];

  try {
    if (!updateTokenTransfersRequested && hasCache) {
      allTxns = cache.getTokenTransfersTransactions(address) ?? [];
    } else if (updateTokenTransfersRequested && hasCache) {
      const cached = cache.getTokenTransfersTransactions(address) ?? [];
      const block = cached.length ? parseInt(cached[0][0].blockNumber) : 0;
      const fromBlock = block > 0 ? block + 1 : 0;
      const transfers = await prov.transfers(address, { fromBlock });
      const newTxns = transfersToTxnsList(transfers.reverse());
      if (fromBlock === 0) {
        allTxns = newTxns;
      } else {
        allTxns = newTxns.concat(cached);
      }
    } else {
      const transfers = await prov.transfers(address); // { fromBlock: 21431407 }
      allTxns = transfersToTxnsList(transfers.reverse());
    }
  } catch (error) {
    setTab('internal');
    setLoadingTxns(false);
    updateTokenTransfersRequested = false;
    showErigonDetailsTxnsWarning.value = true;
    setTimeout(() => {
      showErigonDetailsTxnsWarning.value = false;
    }, 7000);
    return;
  }
  showErigonDetailsTxnsWarning.value = false;

  cache.addTokenTransfersTransactions(address, allTxns);
  detailsPagination.updateTransactions(allTxns);

  transactionsList.value = detailsPagination.showFirstPage();
  updatePagesState(detailsPagination);
  updateTokenTransfersRequested = false;
  setLoadingTxns(false);
};

const loadTokensTransfers = async () => {
  if (sumUnspentTxns.value > 12000n) {
    warning.value = 'Details are available for addresses with less than 12K sent transactions.';
    setTimeout(() => {
      warning.value = '';
    }, 7000);
    return;
  }
  if (!window.navigator.onLine && !cache.hasTokenTransfersTransactionsAddress(address.value)) {
    showOfflineNotice();
    return;
  }
  await loadTransfers(address.value);
};

const loadInternalTransactions = async () => {
  await loadAddressesTransactions(
    isFavorites.value ? Array.from(cache.getFavoriteAddresses()) : [address.value]
  );
};

const setLoadingTxns = (loading: boolean) => {
  loadingTxns.value = loading;
};

const setLoadingTokens = (loading: boolean) => {
  loadingTokens.value = loading;
};

const setLoadingUnspent = (loading: boolean) => {
  loadingUnspent.value = loading;
};

const setTab = (tab: string) => {
  activeTab.value = tab;
};

const openPage = async (page: string) => {
  if (loadingPage.value) return;
  loadingPage.value = true;

  let newList: TransactionListItem[][] = [];
  let paginate: DetailsPagination | FavoritesPagination;
  let addressSource: string | string[];

  if (activeTab.value === 'internal') {
    paginate = favoritesPagination;
    addressSource = isFavorites.value ? Array.from(cache.getFavoriteAddresses()) : [address.value];
  } else {
    paginate = detailsPagination;
    addressSource = address.value;
  }

  if (page === 'next') {
    newList = await paginate.showNextPage(addressSource as string & string[]);
  }
  if (page === 'prev') {
    newList = await paginate.showPrevPage(addressSource as string & string[]);
  }
  if (page === 'first') {
    newList = await paginate.showFirstPage(addressSource as string & string[]);
  }
  if (page === 'last') {
    newList = await paginate.showLastPage(addressSource as string & string[]);
  }

  transactionsList.value = newList;
  updatePagesState(paginate);
  loadingPage.value = false;
};

const updatePagesState = (pagination: DetailsPagination | FavoritesPagination) => {
  isFirstPage.value = pagination.firstPage;
  isLastPage.value = pagination.lastPage;
  currentPage.value = pagination.page;
};

const deleteFavorite = async (address: string) => {
  cache.removeFavoriteAddress(address);
  mainDataCache.clearFavorites();
  const newAddressList = Array.from(cache.getFavoriteAddresses());
  await mount(newAddressList);
};
</script>

<template>
  <AddressHeader
    v-if="!isFavorites"
    :address="address"
    :sumUnspentTxns="sumUnspentTxns"
    :sumBalance="sumBalance"
    :unspentEthUsd="sumUnspentEthUsd"
    :tokens="tokens"
    :loadingTokens="loadingTokens"
    :lastUpdateTimestamp="lastUpdateTimestamp"
    :tokenCreator="tokenCreator"
    :tokenInfo="tokenInfo"
    :ensName="ensName"
    :loadingUnspent="loadingUnspent"
    :tokensError="tokensError"
    :tokensPricesError="tokensPricesError"
    :unspentPriceError="unspentPriceError"
    :unspentError="unspentError"
    :isSourcify="isSourcify"
    :isNFT="isNFT"
    @updateData="updateData"
  />
  <FavoritesHeader
    v-if="isFavorites"
    :sumUnspentTxns="sumUnspentTxns"
    :sumBalance="sumBalance"
    :favorites="favorites"
    :loadingTokens="loadingTokens"
    :tokens="tokens"
    :lastUpdateTimestamp="lastUpdateTimestamp"
    :sumUnspentEthUsd="sumUnspentEthUsd"
    :loadingUnspent="loadingUnspent"
    :tokensError="tokensError"
    :tokensPricesError="tokensPricesError"
    :unspentPriceError="unspentPriceError"
    :unspentError="unspentError"
    :noAddresses="noAddresses"
    @updateData="updateData"
    @deleteFavorite="deleteFavorite"
  />

  <TransactionsList
    v-if="!isSourcify"
    :loadingTxns="loadingTxns"
    :address="address"
    :activeTab="activeTab"
    :transactions="transactionsList"
    :isFirstPage="isFirstPage"
    :isLastPage="isLastPage"
    :currentPage="currentPage"
    :warning="warning"
    :loadingPage="loadingPage"
    :paginationOn="!isFavorites"
    :showErigonDetailsTxnsWarning="showErigonDetailsTxnsWarning"
    :noAddresses="noAddresses"
    @loadTokensTransfers="loadTokensTransfers"
    @loadInternalTransactions="loadInternalTransactions"
    @openPage="openPage"
  />

  <Sourcify v-if="isSourcify && address.length" :address="address" />
</template>
