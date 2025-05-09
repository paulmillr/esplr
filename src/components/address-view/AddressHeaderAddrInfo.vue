<script setup lang="ts">
import { onBeforeUpdate, onMounted, ref } from 'vue';
import { formatTimestampLocalWithoutYear } from '@/utils/utils';
import { AddressCache } from '@/cache/address/address';
import { MainPageCache } from '@/cache/main-page/main-page';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const emit = defineEmits(['updateData']);
const cache = AddressCache.getInstance();
const mainDataCache = MainPageCache.getInstance();
const isFavorite = ref(false);

const props = defineProps<{
  address: string;
  ensName: string;
  sumUnspentTxns: bigint;
  lastUpdateTimestamp: number;
  loadingUnspent: boolean;
  isContract: boolean;
  unspentError: boolean;
}>();

onMounted(() => {
  isFavorite.value = cache.isFavoriteAddress(props.address);
});

onBeforeUpdate(() => {
  isFavorite.value = cache.isFavoriteAddress(props.address);
});

const handleUpdateData = () => {
  emit('updateData', [props.address]);
};

const toggleFavorite = () => {
  if (cache.isFavoriteAddress(props.address)) {
    cache.removeFavoriteAddress(props.address);
  } else {
    cache.addFavoriteAddress(props.address);
  }
  mainDataCache.clearFavorites();
  isFavorite.value = cache.isFavoriteAddress(props.address);
};
</script>

<template>
  <div class="address-info">
    <div>
      <div class="address">
        <b>Address:</b>
        {{ address }}
      </div>
      <div v-if="isContract" class="warning">
        <i class="bi bi-info-circle"></i> Contract address
      </div>

      <div class="ens-name" v-if="ensName.length || loadingUnspent">
        <b>ENS: </b>
        <span v-if="loadingUnspent" class="spinner"></span>
        <span>
          {{ ensName }}
        </span>
      </div>

      <div class="txns-sent" v-if="!isContract">
        <b>Transactions Sent:</b>
        <span v-if="loadingUnspent" class="spinner"></span>
        <span v-else>
          {{ unspentError ? 0 : sumUnspentTxns }}
        </span>
      </div>
      <div
        v-if="(appStore.otsApiError && !isContract) || unspentError"
        class="warning txns-sent-warning"
      >
        <i class="bi bi-exclamation-triangle"></i>
        Value may not be accurate. Erigon OTS namespace is disabled or Ethereum node has limitations
        or Erigon error has occurred. Check Erigon or node logs.
      </div>

      <div class="actions">
        <button @click="toggleFavorite" class="btn btn-dark">
          <i v-if="isFavorite" class="bi bi-star-fill"></i>
          <i v-else class="bi bi-star"></i>
          {{ isFavorite ? 'Unfavorite' : 'Add to favorite' }}
        </button>
        <div class="update-btn-wrapper only-mobile">
          <button @click="handleUpdateData" class="btn btn-dark update-btn">
            <i class="bi bi-arrow-clockwise"></i> Update
          </button>
          <div class="last-update">
            {{
              lastUpdateTimestamp > 0 ? formatTimestampLocalWithoutYear(lastUpdateTimestamp) : ''
            }}
          </div>
        </div>
      </div>
    </div>
    <div class="update-btn-wrapper only-desktop">
      <button @click="handleUpdateData" class="btn btn-dark update-btn">
        <i class="bi bi-arrow-clockwise"></i> Update
      </button>
      <div class="last-update">
        {{ lastUpdateTimestamp > 0 ? formatTimestampLocalWithoutYear(lastUpdateTimestamp) : '' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.only-desktop {
  display: none;
}

@media (min-width: 685px) {
  .only-desktop {
    display: block;
  }
}

@media (min-width: 685px) {
  .only-mobile {
    display: none;
  }
}

.actions {
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.address-info {
  margin-bottom: 15px;
  gap: 5px;
}

@media (min-width: 685px) {
  .address-info {
    display: flex;
    flex-direction: row;
    display: flex;
    justify-content: space-between;
    gap: 5px;
  }
}

.address {
  word-break: break-word;
}

.last-update {
  text-align: right;
  font-size: 17px;
  margin-bottom: 15px;
  margin-top: 2px;
}

.update-btn-wrapper {
  width: 105px;
  min-width: 105px;
  text-align: right;
}

.update-btn {
  width: 100%;
}

.txns-sent {
  display: flex;
  align-items: center;
  gap: 5px;
  word-break: break-word;
}

.txns-sent-warning {
  margin-top: -5px;
  font-size: 17px;
}

.ens-name {
  word-break: break-word;
}
</style>
