import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SHOW_PRICES } from '@/config';
import { CACHE_INTERVAL_MINUTES } from '@/config';

export const useSettingsStore = defineStore('settings', () => {
  const showUsdPrices = ref(SHOW_PRICES);
  const forciblyDisabledPrices = ref(false);
  const cacheUpdateInterval = ref(CACHE_INTERVAL_MINUTES);

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

  return {
    showUsdPrices,
    toggleShowUsdPrices,
    setShowUsdPrices,
    setForciblyDisabledPrices,
    forciblyDisabledPrices,
    cacheUpdateInterval,
    setCacheUpdateInterval,
  };
});
