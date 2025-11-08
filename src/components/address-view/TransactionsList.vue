<script setup lang="ts">
import type { TransactionListItem } from '@/types';
import TransactionsListItem from '@/components/address-view/TransactionsListItem.vue';
import TransactionsPagination from '@/components/address-view/TransactionsPagination.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const emit = defineEmits(['loadTokensTransfers', 'loadInternalTransactions', 'openPage']);

const props = defineProps<{
  address: string;
  transactions: TransactionListItem[][];
  loadingTxns: boolean;
  activeTab?: string;
  isFirstPage: boolean;
  isLastPage: boolean;
  warning: string;
  loadingPage: boolean;
  currentPage: number;
  paginationOn: boolean;
  showErigonDetailsTxnsWarning?: boolean;
  noAddresses?: boolean;
  firstTabText?: string;
}>();

const handleTokenTransfersClick = () => {
  if (props.loadingTxns) return;
  emit('loadTokensTransfers');
};

const handleInternalTransactionsClick = () => {
  if (props.loadingTxns) return;
  emit('loadInternalTransactions');
};

const openPage = async (page: string) => {
  await emit('openPage', page);
};
</script>

<template>
  <div class="transactions">
    <div class="txns-header">
      <div>
        <span
          @click="handleInternalTransactionsClick"
          :class="['btn btn-dark btn-tab', { active: activeTab === 'internal' }]"
        >
          {{ props.firstTabText ? `${props.firstTabText}` : 'Internal transactions' }}
        </span>
        <span
          v-if="paginationOn"
          @click="handleTokenTransfersClick"
          :class="['btn btn-dark btn-tab', { active: activeTab === 'details' }]"
        >
          Details
        </span>
      </div>
      <TransactionsPagination
        @openPage="openPage"
        :isFirstPage
        :isLastPage
        :loadingPage
        :currentPage
        :disabled="appStore.otsApiError || loadingTxns || noAddresses || !transactions.length"
      />
    </div>

    <div class="warning">
      <i v-if="warning.length" class="bi bi-info-circle"></i>
      {{ warning }}
    </div>

    <div v-if="showErigonDetailsTxnsWarning" class="warning">
      Only Erigon RPC is supported for loading token transfers (for addresses under 10K txns)
    </div>

    <div v-if="appStore.otsApiError" class="warning ots-api-warning">
      <i class="bi bi-exclamation-triangle"></i>
      Transactions can not be loaded. Check address value. Erigon OTS namespace is disabled or
      Ethereum node has limitations or Erigon error has occurred. Check Erigon or node logs.
    </div>

    <div v-if="!appStore.otsApiError && !loadingTxns && !noAddresses && transactions.length">
      <div class="latest-transactions">
        <TransactionsListItem
          v-for="t in transactions"
          :address="address"
          :transactions="t"
          :key="t[0].hash"
          :isDetailsTab="activeTab === 'details'"
        />
      </div>
      <TransactionsPagination
        @openPage="openPage"
        :isFirstPage
        :isLastPage
        :loadingPage
        :currentPage
        :disabled="false"
      />
    </div>
  </div>

  <div class="loading-txns" v-if="loadingTxns && !appStore.otsApiError">
    <span>Loading transactions</span> <span class="spinner"></span>
  </div>
</template>

<style scoped>
.transactions {
  margin-top: 20px;
}

.txns-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
}

@media (min-width: 576px) {
  .txns-header {
    align-items: center;
    flex-direction: row;
    gap: 0;
  }
}

.latest-transactions {
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.btn-tab {
  margin-right: 7px;
}

.btn.active {
  background-color: var(--azure-blue);
}

@media (prefers-color-scheme: dark) {
  .btn.active {
    background-color: var(--azure-blue);
  }
}

/* disable hover effect for active tab */
.btn.active:hover {
  opacity: 1;
}

.loading-txns {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.warning {
  font-size: 17px;
  margin-top: 3px;
}

.ots-api-warning {
  margin-top: 10px;
}
</style>
