<script setup lang="ts">
import { computed, onMounted, ref, inject, type Ref } from 'vue';
import { Chainlink, Web3Provider } from 'micro-eth-signer/net';
import { AddressCache } from '@/cache/address/address';
import { MainPageCache } from '@/cache/main-page/main-page';
import Checkbox from '@/components/Checkbox.vue';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import LocalStorage from '@/components/settings-view/LocalStorage.vue';

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = ref<Web3Provider>(provider.value);

const cashedAddresses = ref<string[]>([]);
const favoriteAddresses = ref<string[]>([]);
const cache = AddressCache.getInstance();
const mainDataCache = MainPageCache.getInstance();
const hasMainPageCache = ref(mainDataCache.hasAnyData());

const settingsStore = useSettingsStore();
const appStore = useAppStore();
const priceError = ref(false);
const cacheUpdateIntervals = [1, 5, 15, 60];
const urlRouting = ref(sessionStorage.getItem('urlRouting') === 'false' ? false : true);

const networkName = computed(() =>
  appStore.networkName === 'Mainnet' ? 'Ethereum Mainnet' : appStore.networkName
);

onMounted(() => {
  cashedAddresses.value = cache.allCachedAddresses();
  favoriteAddresses.value = [...cache.getFavoriteAddresses()];
  hasMainPageCache.value = mainDataCache.hasAnyData();
});

const handleDisconnect = async () => {
  cache.clearAll();
  mainDataCache.clear();
  location.reload();
};

const handleClearCache = () => {
  cache.clear();
  mainDataCache.clear();
  cashedAddresses.value = cache.allCachedAddresses();
  favoriteAddresses.value = [...cache.getFavoriteAddresses()];
  hasMainPageCache.value = mainDataCache.hasAnyData();
};

const handleDeleteFavorites = () => {
  cache.clearFavorites();
  mainDataCache.clearFavorites();
  cashedAddresses.value = cache.allCachedAddresses();
  favoriteAddresses.value = [...cache.getFavoriteAddresses()];
};

const priceTryError = () => {
  settingsStore.setShowUsdPrices(false);
  settingsStore.setForciblyDisabledPrices(true);

  priceError.value = true;
  setTimeout(() => {
    priceError.value = false;
  }, 5000);

  console.warn('Chainlink error, disabling USD prices');
};

const tryPrice = async () => {
  await new Chainlink(prov.value).coinPrice('ETH');
  settingsStore.setForciblyDisabledPrices(false);
};

const handleShowUsdPrices = async () => {
  if (!settingsStore.showUsdPrices) {
    try {
      await tryPrice();
    } catch {
      return priceTryError();
    }
  }
  settingsStore.toggleShowUsdPrices();
};

const handleCacheUpdateInterval = (minutes: number) => {
  settingsStore.setCacheUpdateInterval(minutes);
};

const toggleUrlRouting = () => {
  urlRouting.value = !urlRouting.value;
  if (sessionStorage.getItem('urlRouting') === 'false') {
    sessionStorage.removeItem('urlRouting');
  } else {
    sessionStorage.setItem('urlRouting', 'false');
  }
  location.replace('/');
};
</script>

<template>
  <div class="header">
    <h3>Settings</h3>
  </div>
  <div class="connected-to">
    Connected to
    <b>{{ networkName }}</b
    >:
    <br />
    {{ appStore.rpcUrl }}
  </div>
  <div class="logout">
    <button class="btn btn-dark logout-button" @click="handleDisconnect">
      Disconnect <i class="bi bi-door-closed"></i>
    </button>
  </div>

  <div>
    <h4>URL routing</h4>
    <div class="description">
      <p>
        When enabled, app routes are reflected in the URL. For example,
        <code>/address/0x1234567890abcdef1234567890abcdef12345678</code>.
      </p>
      <p>⚠️ Change reloads the page, causing loss of cached data if local storage is off.</p>
      <Checkbox @onChange="toggleUrlRouting" label="URL routing" :checked="urlRouting" />
    </div>
  </div>

  <LocalStorage />

  <div>
    <h4>Tokens Prices:</h4>
    <Checkbox
      @onChange="handleShowUsdPrices"
      label="Show prices in USD"
      :checked="settingsStore.showUsdPrices"
    />
    <div class="warning">
      <div v-if="priceError">
        <i class="bi bi-exclamation-triangle"></i>
        Try to enable USD prices failed.
      </div>
      <div v-if="settingsStore.forciblyDisabledPrices">
        <i class="bi bi-exclamation-triangle"></i>
        USD prices were disabled because of the Ethereum node limitations.
      </div>
    </div>
  </div>

  <div>
    <h4>Cache update interval in minutes:</h4>
    <Checkbox
      v-for="interval in cacheUpdateIntervals"
      :key="interval"
      :label="String(interval)"
      :checked="settingsStore.cacheUpdateInterval === interval"
      class="cache-checkbox"
      @onChange="() => handleCacheUpdateInterval(interval)"
    />
  </div>

  <div>
    <h4>Cached data:</h4>
    <div v-if="cashedAddresses.length">Cached addresses:</div>
    <ul v-if="cashedAddresses.length" class="cached-list">
      <li v-for="address in cashedAddresses" :key="address">
        <RouterLink :to="`/address/${address}`">{{ address }}</RouterLink>
      </li>
    </ul>
    <div v-if="hasMainPageCache">Main page is cached.</div>
    <div v-if="favoriteAddresses.length">Favorites addresses list is cached.</div>
    <div class="clear-cache-btn-wrapper">
      <button
        v-if="cashedAddresses.length || hasMainPageCache"
        class="btn btn-dark"
        @click="handleClearCache"
      >
        Clear all cache
      </button>
      <button v-if="favoriteAddresses.length" class="btn btn-dark" @click="handleDeleteFavorites">
        Delete all favorites
      </button>
    </div>
    <div v-if="!hasMainPageCache && !favoriteAddresses.length && !cashedAddresses.length">
      No cached data.
    </div>
  </div>
</template>

<style scoped>
.checkbox {
  display: flex;
  align-items: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout {
  margin-top: 20px;
}

.logout-button {
  color: var(--btn-red);
}

@media (prefers-color-scheme: dark) {
  .logout-button {
    color: var(--btn-red-darker);
  }
}

h4 {
  margin-bottom: 12px;
}

.cached-list {
  margin-top: 0px;
  margin-bottom: 20px;
  overflow-y: scroll;
  max-height: 325px;
}

.warning {
  font-size: 17px;
}

.connected-to {
  word-break: break-word;
}

.cache-checkbox {
  margin-right: 10px;
}

.clear-cache-btn-wrapper {
  margin-top: 10px;
}

.clear-cache-btn-wrapper {
  display: flex;
  gap: 7px;
}
</style>
