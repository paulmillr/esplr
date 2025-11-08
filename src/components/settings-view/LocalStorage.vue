<script setup lang="ts">
import { ref, computed } from 'vue';
import Checkbox from '@/components/Checkbox.vue';
import { useSettingsStore } from '@/stores/settings';
import MainPageAndAddressCacheManager from '@/cache/main-page-and-address-cache-manager';

const emit = defineEmits(['updateSettingsInLocalStorage']);

const settingsStore = useSettingsStore();
const warning = ref(false);

const cacheType = ref('memory');
try {
  cacheType.value = MainPageAndAddressCacheManager.getStrategyType();
} catch (error) {
  showWarning();
  settingsStore.setCacheSettingsLocalStorage(false);
  console.error('Error initializing cache type.', error);
}

const cacheInLocalStorage = computed(() => cacheType.value === 'localstorage');

function showWarning() {
  warning.value = true;
  setTimeout(() => {
    warning.value = false;
  }, 7000);
}

const isSettingsInLocalStorage = () => !!localStorage.getItem('settings')?.length;

const switchCache = () => {
  try {
    switchLocalStorageCache();
    if (isSettingsInLocalStorage()) {
      emit('updateSettingsInLocalStorage');
    }
  } catch (error) {
    localStorage.clear();
    showWarning();
    console.error('Error switching cache:', error);
    settingsStore.setCacheSettingsLocalStorage(false);
    MainPageAndAddressCacheManager.useMemoryStorage();
  }
};

const switchLocalStorageCache = () => {
  warning.value = false;
  const currentType = MainPageAndAddressCacheManager.getStrategyType();

  if (currentType === 'memory') {
    MainPageAndAddressCacheManager.useLocalStorage();
  } else {
    MainPageAndAddressCacheManager.useMemoryStorage();
  }

  cacheType.value = MainPageAndAddressCacheManager.getStrategyType();
};

const switchLocalStorageSettings = () => {
  if (isSettingsInLocalStorage()) {
    localStorage.removeItem('settings');
  } else {
    emit('updateSettingsInLocalStorage');
  }

  settingsStore.setCacheSettingsLocalStorage(isSettingsInLocalStorage());
};
</script>

<template>
  <div>
    <h4>Local storage</h4>
    <div class="description">
      <p>
        Cached data and app settings may be available after page reload and stored in the
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
          target="_blank"
          >browser's local storage</a
        >
        on disk.
      </p>
      <div>Use local storage for:</div>
      <Checkbox @onChange="switchCache" label="Cache" :checked="cacheInLocalStorage" />
      <br />
      <Checkbox
        @onChange="switchLocalStorageSettings"
        label="Settings"
        :checked="settingsStore.cacheSettingsLocalStorage"
      />
    </div>
    <p v-if="warning" class="warning">
      <i class="bi bi-exclamation-triangle"></i>
      Something went wrong. Local storage was cleared, and cache settings were returned to default.
      Please try again or reload the page.
    </p>
  </div>
</template>
