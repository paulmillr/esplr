<script setup lang="ts">
import { onBeforeUpdate, onMounted, ref } from 'vue';
import { formatTimestampLocalWithoutYear } from '@/utils/utils';
import { AddressCache } from '@/cache/address/address';
import { MainPageCache } from '@/cache/main-page/main-page';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import '@/assets/sourcify.svg';

const appStore = useAppStore();
const settingsStore = useSettingsStore();

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
  isSourcify: boolean;
  isNFT: boolean;
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
      <div v-if="isContract" class="contract-info">
        <div class="warning"><i class="bi bi-info-circle"></i> Contract address</div>
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
        Check the address value. Or Erigon OTS namespace is disabled or Ethereum node has
        limitations or Erigon error has occurred. Check Erigon or node logs.
      </div>

      <div class="actions">
        <div class="actions-btns">
          <button @click="toggleFavorite" class="btn btn-dark">
            <i v-if="isFavorite" class="bi bi-star-fill"></i>
            <i v-else class="bi bi-star"></i>
            {{ isFavorite ? 'Unfavorite' : 'Add to favorite' }}
          </button>
          <div class="nfts-btn-wrapper">
            <RouterLink
              v-if="!isNFT"
              :to="`/address/${address}/nft`"
              class="btn btn-dark nfts-link"
              title="NFTs"
            >
              NFTs
            </RouterLink>
            <RouterLink
              v-if="isNFT"
              :to="`/address/${address}`"
              class="btn btn-dark nfts-link"
              title="Balances"
            >
              Balances
            </RouterLink>
          </div>
          <div v-if="settingsStore.sourcifyUrl.length">
            <RouterLink
              v-if="!isSourcify"
              :class="['btn', 'btn-dark', 'sourcify-btn']"
              :to="`/address/${address}/sourcify`"
              title="Only available for contract addresses"
            >
              <img class="sourcify-icon" src="@/assets/sourcify.svg" alt="Sourcify logo" />
              Sourcify
            </RouterLink>
            <RouterLink
              v-if="isSourcify"
              class="btn btn-dark sourcify-btn"
              :to="`/address/${address}`"
            >
              📃 Txs & Balances
            </RouterLink>
          </div>
        </div>
        <div class="update-btn-wrapper update-btn-wrapper-mobile only-mobile">
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
.actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 7px;
  margin-top: 5px;
}

@media (min-width: 414px) {
  .actions {
    align-items: flex-start;
  }
}

@media (min-width: 485px) {
  .actions {
    flex-direction: row;
  }
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
  margin-left: 7px;
}

@media (min-width: 485px) {
  .last-update {
    margin-top: 2px;
    margin-left: 0px;
  }
}

.update-btn-wrapper {
  min-width: 105px;
  text-align: right;
  margin-top: -1px;
}

.update-btn-wrapper-mobile {
  display: flex;
  align-items: center;
}

@media (min-width: 485px) {
  .update-btn-wrapper-mobile {
    display: block;
  }
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

.contract-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}

.sourcify-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  line-height: 1.15;
  color: white;
}

.sourcify-icon {
  width: 18px;
  height: 18px;
}

.actions-btns {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 162px;
}

@media (min-width: 414px) {
  .actions-btns {
    flex-direction: row;
    align-items: center;
  }
}

.only-desktop {
  display: none !important;
}

@media (min-width: 685px) {
  .only-desktop {
    display: block !important;
  }
}

@media (min-width: 685px) {
  .only-mobile {
    display: none !important;
  }
}

.nfts-link {
  display: block;
  text-align: center;
  color: white;
  line-height: 1.15;
}
</style>
