import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES, SHOW_IMAGES, CACHE_INTERVAL_MINUTES } from '@/config';
import { normalizeIpfsUrl } from '@/utils/url';

let cached = null;
const localStorageSettings = localStorage.getItem('settings');
if (localStorageSettings?.length) {
  cached = JSON.parse(localStorageSettings);
}

const SOURCIFY_URL = import.meta.env.VITE_SOURCIFY_URL || '';
const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL || '';
const localStorageSourcifyUrl = localStorage.getItem('sourcifyUrl') ?? '';
const localStorageIpfsGatewayUrl = localStorage.getItem('ipfsGatewayUrl') ?? '';

if (SOURCIFY_URL.length && localStorageSourcifyUrl.length) {
  localStorage.removeItem('sourcifyUrl');
}
const initialSourcifyUrl = SOURCIFY_URL.length ? SOURCIFY_URL : localStorageSourcifyUrl;

if (IPFS_GATEWAY_URL.length && localStorageIpfsGatewayUrl.length) {
  localStorage.removeItem('ipfsGatewayUrl');
}
const initialIpfsGatewayUrl =
  normalizeIpfsUrl(IPFS_GATEWAY_URL) ||
  IPFS_GATEWAY_URL ||
  localStorageIpfsGatewayUrl;

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(cached?.usdPrices ?? SHOW_PRICES);
  const forciblyDisabledPrices = ref(false);
  const cacheUpdateInterval = ref(cached?.cacheUpdateInterval ?? CACHE_INTERVAL_MINUTES);
  const cacheSettingsLocalStorage = ref(!!localStorageSettings?.length);
  const sourcifyUrl = ref(initialSourcifyUrl);
  const ipfsGatewayUrl = ref(initialIpfsGatewayUrl);
  const showImages = ref(cached?.showImages ?? SHOW_IMAGES);

  function toggleShowUsdPrices() {
    showUsdPrices.value = !showUsdPrices.value;
  }

  function setShowUsdPrices(value: boolean) {
    showUsdPrices.value = value;
  }

  function setForciblyDisabledPrices(value: boolean) {
    forciblyDisabledPrices.value = value;
  }

  function setCacheUpdateInterval(minutes: number) {
    cacheUpdateInterval.value = minutes;
  }

  function setCacheSettingsLocalStorage(value: boolean) {
    cacheSettingsLocalStorage.value = value;
  }

  function setSourcifyUrl(url: string) {
    sourcifyUrl.value = url;
  }

  function setIpfsGatewayUrl(url: string) {
    ipfsGatewayUrl.value = url;
  }

  function toggleShowImages() {
    showImages.value = !showImages.value;
  }

  return {
    showUsdPrices,
    toggleShowUsdPrices,
    setShowUsdPrices,
    setForciblyDisabledPrices,
    forciblyDisabledPrices,
    cacheUpdateInterval,
    setCacheUpdateInterval,
    cacheSettingsLocalStorage,
    setCacheSettingsLocalStorage,
    sourcifyUrl,
    setSourcifyUrl,
    ipfsGatewayUrl,
    setIpfsGatewayUrl,
    showImages,
    toggleShowImages,
  };
});
