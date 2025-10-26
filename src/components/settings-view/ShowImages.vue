<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import Checkbox from '@/components/Checkbox.vue';
import { isSettingsInLocalStorage } from '@/utils/localstorage';

const settingsStore = useSettingsStore();
const emit = defineEmits(['updateSettingsInLocalStorage']);

const handleShowImagesChange = () => {
  settingsStore.toggleShowImages();
  if (isSettingsInLocalStorage()) {
    emit('updateSettingsInLocalStorage');
  }
};
</script>

<template>
  <div>
    <h4 id="show-images">Images</h4>
    <Checkbox
      label="Show images"
      :checked="settingsStore.showImages"
      class="cache-checkbox"
      @onChange="() => handleShowImagesChange()"
    />
  </div>
  <div class="description">
    <p>
      <i>Show images</i> feature will leak your ip+browser to random people on the internet. 
      NFT tokens often store image URLs pointing to decentralized or user-controlled hosts (such as IPFS gateways or custom web servers). 
      Meaning, the hosting server can log your request.
    </p>
  </div>
</template>

<style scoped>
.description {
  word-wrap: break-word;
}
</style>