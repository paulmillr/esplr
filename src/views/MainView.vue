<script setup lang="ts">
import { onMounted, ref, inject, type Ref, watch } from 'vue';
import { Web3Provider, Chainlink } from 'micro-eth-signer/net';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';

import { APP_DESC } from '@/config';
import { useSettingsStore } from '@/stores/settings';
import { AddressCache } from '@/cache/address/address';
import { MainPageCache } from '@/cache/main-page/main-page';
import type { TxInfoExtended, TransactionListItem } from '@/types';
import {
  fromWeiToGwei,
  roundToTwo,
  hasMinutesPassed,
  formatTimestampLocalWithoutYear,
  stringArraysEqual,
  removeTxnsListItemsDuplicates,
  sortTxnsListItemsByTimestamp,
  txnsWithBlockDetailsToTxnsList,
} from '@/utils/utils';
import {
  getGasPriceWei,
  getLastBlocksBefore,
  getLastTransactions,
  getLastTxnsByAddresses,
} from '@/utils/network';
import BasicInfo from '@/components/main-view/BasicInfo.vue';
import LastBlocks from '@/components/main-view/LastBlocks.vue';
import LastTxns from '@/components/main-view/LastTxns.vue';
import Favorites from '@/components/main-view/Favorites.vue';

const settingsStore = useSettingsStore();

const gasPriceGwei = ref('');
const maxPriorityFeeGwei = ref('');
const lastBlocks = ref<BlockInfo[]>([]);
const lastTxns = ref<TxInfoExtended[]>([]);
const updatedTimestamp = ref(Date.now());
const ethPrice = ref(0);
const priceError = ref(false);
const maxPriorityFeeError = ref(false);

const LAST_BLOCKS_COUNT = 5;
const LAST_TXNS_COUNT = 5;
const GAS_PRICE_PRECISION = 9;

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = ref<Web3Provider>(provider.value);

const favoriteTxns = ref<TransactionListItem[][]>([]);
const favoriteAddresses = ref<string[]>([]);
const addressCache = AddressCache.getInstance();
const favoriteAddressesError = ref(false);

const loadingData = ref(false);
const mainDataCache = MainPageCache.getInstance();
let updateRequested = false;

watch(provider, (newProvider) => {
  remount(newProvider);
});

onMounted(async () => {
  mount();
});

const mount = async () => {
  const showPrices = settingsStore.showUsdPrices;
  const lastUpdateTimestamp = mainDataCache.getLastUpdateTimestamp();
  const timeToUpdate = hasMinutesPassed(lastUpdateTimestamp, settingsStore.cacheUpdateInterval);
  const hasCache = showPrices ? mainDataCache.hasDataWithPrice() : mainDataCache.hasData();

  if (hasCache && !timeToUpdate && !updateRequested) {
    await laodDataFromCache();
    return;
  }

  setLoadingData(true);

  const newLastBlockNum = await prov.value.height();
  const gasPriceWei = await getGasPriceWei(prov.value as Web3Provider);
  const newGasPriceGwei = fromWeiToGwei(gasPriceWei, GAS_PRICE_PRECISION);

  let newMaxPriorityFeeGwei = '-';
  try {
    const maxPriorityFeeHex = await prov.value.call('eth_maxPriorityFeePerGas');
    newMaxPriorityFeeGwei = fromWeiToGwei(BigInt(maxPriorityFeeHex), GAS_PRICE_PRECISION);
    maxPriorityFeeError.value = false;
  } catch (error) {
    maxPriorityFeeError.value = true;
    console.error('Error loading max priority fee:', error);
  }

  if (showPrices) {
    try {
      const link = new Chainlink(prov.value);
      ethPrice.value = roundToTwo(await link.coinPrice('ETH'));
      priceError.value = false;
    } catch (error) {
      priceError.value = true;
      console.error('Error loading ETH price:', error);
    }
  }

  const newFavoriteAddresses = Array.from(addressCache.getFavoriteAddresses());
  const newFavoriteTxns = await getNewFavoriteTxns(newFavoriteAddresses);

  const newLastBlocks = await getLastBlocksBefore(
    prov.value as Web3Provider,
    newLastBlockNum,
    LAST_BLOCKS_COUNT
  );
  const newLastTxns = await getLastTransactions(
    prov.value as Web3Provider,
    newLastBlocks,
    LAST_TXNS_COUNT
  );

  // apply all new values at once to avoid flickering
  gasPriceGwei.value = newGasPriceGwei;
  favoriteAddresses.value = newFavoriteAddresses;
  favoriteTxns.value = newFavoriteTxns;
  lastBlocks.value = newLastBlocks;
  lastTxns.value = newLastTxns;
  maxPriorityFeeGwei.value = newMaxPriorityFeeGwei;
  updatedTimestamp.value = Date.now();

  mainDataCache.setGasPriceGwei(newGasPriceGwei);
  mainDataCache.setFavoriteAddresses(newFavoriteAddresses);
  mainDataCache.setFavoriteTxns(newFavoriteTxns);
  mainDataCache.setLastBlocks(newLastBlocks);
  mainDataCache.setLastTxns(newLastTxns);
  mainDataCache.setMaxPriorityFeeGwei(newMaxPriorityFeeGwei);
  mainDataCache.setEthPrice(ethPrice.value);
  mainDataCache.setLastUpdateTimestamp(updatedTimestamp.value);

  updateRequested = false;
  setLoadingData(false);
};

const updateFavoritesFromCache = async () => {
  const newFavoriteAddresses = Array.from(addressCache.getFavoriteAddresses());
  let newFavoriteTxns: TransactionListItem[][] = [];

  const hasFullCache = addressCache.hasInternalTransactionsForEveryAddress(newFavoriteAddresses);
  if (hasFullCache) {
    let cachedTxns: TransactionListItem[][] = [];
    newFavoriteAddresses.forEach((address) => {
      const txns = addressCache.getInternalTransactions(address) ?? [];
      cachedTxns = cachedTxns.concat(txns);
    });
    const uniqueCachedTxns = removeTxnsListItemsDuplicates(cachedTxns);
    newFavoriteTxns = sortTxnsListItemsByTimestamp(uniqueCachedTxns).slice(0, LAST_TXNS_COUNT);
  } else {
    newFavoriteTxns = await getNewFavoriteTxns(newFavoriteAddresses);
  }

  favoriteAddresses.value = newFavoriteAddresses;
  favoriteTxns.value = newFavoriteTxns;
  mainDataCache.setFavoriteAddresses(newFavoriteAddresses);
  mainDataCache.setFavoriteTxns(newFavoriteTxns);
};

const getNewFavoriteTxns = async (addresses: string[]) => {
  favoriteAddressesError.value = false;
  if (!addresses.length) {
    return [];
  }
  try {
    const latestTxns = await getLastTxnsByAddresses(
      prov.value as Web3Provider,
      addresses,
      LAST_TXNS_COUNT
    );
    return txnsWithBlockDetailsToTxnsList(latestTxns);
  } catch (error) {
    favoriteAddressesError.value = true;
    console.error(error);
    return [];
  }
};

const setLoadingData = (loading: boolean) => {
  loadingData.value = loading;
};

const remount = async (provider: Web3Provider) => {
  prov.value = provider;
  updateRequested = true;
  await mount();
};

const handleUpdateData = async () => {
  updateRequested = true;
  await mount();
};

const laodDataFromCache = async () => {
  gasPriceGwei.value = mainDataCache.getGasPriceGwei();
  lastBlocks.value = mainDataCache.getLastBlocks();
  lastTxns.value = mainDataCache.getLastTxns();
  maxPriorityFeeGwei.value = mainDataCache.getMaxPriorityFeeGwei();
  ethPrice.value = mainDataCache.getEthPrice();
  updatedTimestamp.value = mainDataCache.getLastUpdateTimestamp();

  const cachedMainPagefavorites = mainDataCache.getFavoriteAddresses();
  const actualFavorites = Array.from(addressCache.getFavoriteAddresses());
  const favoritesChanged = !stringArraysEqual(cachedMainPagefavorites, actualFavorites);
  if (favoritesChanged) {
    await updateFavoritesFromCache();
  } else {
    favoriteTxns.value = mainDataCache.getFavoriteTxns();
    favoriteAddresses.value = mainDataCache.getFavoriteAddresses();
  }
};
</script>

<template>
  <div class="header">
    <div>
      <div>
        {{ APP_DESC }}
      </div>
      <div class="update-data-loader" v-if="loadingData">
        <span>Updating data</span> <span class="spinner"></span>
      </div>
    </div>
    <div class="update-btn-wrapper">
      <button @click="handleUpdateData" class="btn btn-dark update-btn">
        <i class="bi bi-arrow-clockwise"></i> Update
      </button>
      <div class="last-update">
        {{ formatTimestampLocalWithoutYear(updatedTimestamp) }}
      </div>
    </div>
  </div>

  <BasicInfo
    :maxPriorityFeeGwei="maxPriorityFeeGwei"
    :ethPrice="ethPrice"
    :gasPriceGwei="gasPriceGwei"
    :block="lastBlocks[0]"
  />

  <div v-if="maxPriorityFeeError" class="warning">
    <i class="bi bi-exclamation-triangle"></i>
    Max priority fee could not be loaded. Probably because of the Ethereum node limitations.
  </div>
  <div v-if="priceError" class="warning">
    <i class="bi bi-exclamation-triangle"></i>
    USD prices could not be loaded. Probably because of the Ethereum node limitations.
  </div>
  <div v-if="favoriteAddressesError" class="warning">
    <i class="bi bi-exclamation-triangle"></i>
    Favorite transactions can not be loaded. Erigon OTS namespace is disabled or Ethereum node has
    limitations or Erigon error has occurred. Check Erigon or node logs.
  </div>
  <Favorites
    v-if="favoriteTxns.length"
    :favoriteTxns="favoriteTxns"
    :favoriteAddresses="favoriteAddresses"
  />

  <div class="chain-info">
    <LastBlocks class="chain-info-col" :blocks="lastBlocks" />
    <LastTxns class="chain-info-col" :txns="lastTxns" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 768px) {
  .header {
    flex-direction: row;
    gap: 0;
  }
}

.update-data-loader {
  display: flex;
  align-items: center;
  gap: 7px;
}

.last-update {
  font-size: 17px;
  width: 105px;
  min-width: 105px;
}

@media (min-width: 768px) {
  .last-update {
    margin-bottom: 7px;
    margin-top: 2px;
  }
}

.update-btn-wrapper {
  width: 200px;
  min-width: 200px;
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 7px;
}

@media (min-width: 768px) {
  .update-btn-wrapper {
    display: block;
    width: 105px;
    min-width: 105px;
    text-align: right;
    margin-bottom: 0;
  }
}

.update-btn {
  width: 105px;
  min-width: 105px;
}

@media (min-width: 768px) {
  .update-btn {
    width: 100%;
  }
}

.chain-info {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 1%;
}

@media (min-width: 768px) {
  .chain-info {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .chain-info-col {
    width: 49%;
  }
}

.warning {
  font-size: 17px;
}
</style>
