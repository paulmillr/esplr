<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import Checkbox from '@/components/Checkbox.vue';
import { isSettingsInLocalStorage } from '@/utils/localstorage';
import SettingsIPFS from '@/components/settings-view/SettingsIPFS.vue';
import { AddressCache } from '@/cache/address/address';

const settingsStore = useSettingsStore();
const emit = defineEmits(['updateSettingsInLocalStorage']);
const cache = AddressCache.getInstance();

const showIpfsInput = ref(false);

const isUrlInLocalStorage = () => !!localStorage.getItem('ipfsGatewayUrl')?.length;

onMounted(() => {
  showIpfsInput.value = settingsStore.showIpfsImages;
});

const handleShowHttpsImagesChange = () => {
  settingsStore.toggleShowHttpsImages();
  if (isSettingsInLocalStorage()) {
    emit('updateSettingsInLocalStorage');
  }

  cache.clearNftLogsImages();
};

const handleShowIpfsImagesChange = () => {
  settingsStore.toggleShowIpfsImages();
  if (isSettingsInLocalStorage()) {
    emit('updateSettingsInLocalStorage');
  }
  showIpfsInput.value = settingsStore.showIpfsImages;

  if (!settingsStore.showIpfsImages && !isUrlInLocalStorage()) {
    settingsStore.setIpfsGatewayUrl('');
  }

  cache.clearNftLogsImages();
};
</script>

<template>
  <div>
    <h4 id="show-images">Images</h4>
    <Checkbox
      label="Allow HTTPS images"
      :checked="settingsStore.showHttpsImages"
      class="cache-checkbox"
      @onChange="() => handleShowHttpsImagesChange()"
    />
    <br />
    <Checkbox
      label="Allow IPFS images"
      :checked="settingsStore.showIpfsImages"
      class="cache-checkbox"
      @onChange="() => handleShowIpfsImagesChange()"
    />
  </div>

  <SettingsIPFS v-if="showIpfsInput" />

  <div class="description">
    <p>⚠️ Images loading can leak your IP + browser to remote hosts.</p>
    <p>
      Images are loaded from third-party servers because some NFTs provide own links to it's data
      and images. If custom IPFS gateway is not provided and HTTPS images are allowed, the public
      gateway <code>ipfs.io/ipfs/</code> will be used by default for IPFS links.
    </p>
  </div>
</template>

<style scoped>
.description {
  word-wrap: break-word;
}
</style>
