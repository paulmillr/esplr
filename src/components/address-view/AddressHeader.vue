<script setup lang="ts">
import { shortenTx } from '@/utils/utils';
import type { TokenBalance, OtsGetContractCreatorResponse, ERC20TokenInfo } from '@/types';
import TokensList from '@/components/address-view/TokensList.vue';
import AddressHeaderAddrInfo from '@/components/address-view/AddressHeaderAddrInfo.vue';

const emit = defineEmits(['updateData']);

const props = defineProps<{
  address: string;
  sumUnspentTxns: bigint;
  sumBalance: bigint;
  unspentEthUsd: number;
  tokens: TokenBalance[];
  loadingTokens: boolean;
  lastUpdateTimestamp: number;
  tokenCreator: OtsGetContractCreatorResponse | null;
  tokenInfo: ERC20TokenInfo | null;
  ensName: string;
  loadingUnspent: boolean;
  tokensError: boolean;
  tokensPricesError: boolean;
  unspentPriceError: boolean;
  unspentError: boolean;
}>();

const handleUpdateData = (addresses: string[]) => {
  emit('updateData', addresses);
};
</script>

<template>
  <div class="header">
    <AddressHeaderAddrInfo
      :address="address"
      :ensName="ensName"
      :sumUnspentTxns="sumUnspentTxns"
      :lastUpdateTimestamp="lastUpdateTimestamp"
      :isContract="!!props.tokenCreator"
      :loadingUnspent="loadingUnspent"
      :unspentError="unspentError"
      @updateData="handleUpdateData"
    />
  </div>

  <div>
    <div v-if="tokenInfo">
      <b>Token:</b> {{ tokenInfo.name }} ({{ tokenInfo.symbol }})
      <span class="label" style="margin: 0 5px">{{ tokenInfo.abi }}</span>
      <span class="label">{{ tokenInfo.decimals }} decimals</span>
    </div>

    <div v-if="tokenCreator">
      <b>Contract creator: </b>
      <RouterLink class="link" :to="`/address/${tokenCreator.creator}`">
        {{ shortenTx(tokenCreator.creator) }}
      </RouterLink>
      <b> at txn </b>
      <RouterLink class="link" :to="`/tx/${tokenCreator.hash}`">
        {{ shortenTx(tokenCreator.hash) }}
      </RouterLink>
    </div>

    <TokensList
      :unspentEth="sumBalance"
      :unspentEthUsd="unspentEthUsd"
      :tokens="tokens"
      :loadingUnspent="loadingUnspent"
      :loadingTokens="loadingTokens"
      :tokensError="tokensError"
      :tokensPricesError="tokensPricesError"
      :unspentPriceError="unspentPriceError"
      :unspentError="unspentError"
    />
  </div>
</template>

<style scoped>
.header {
  margin-top: 20px;
  margin-bottom: 2px;
}
</style>
