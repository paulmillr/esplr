<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fromWeiToEth, fromTokenBalanceToHumanReadable, formatUsdPrice } from '@/utils/utils';
import type { TokenBalance } from '@/types';

import { useSettingsStore } from '@/stores/settings';
const settingsStore = useSettingsStore();

const props = defineProps<{
  tokens: TokenBalance[];
  loadingTokens: boolean;
  loadingUnspent: boolean;
  unspentEth: bigint;
  unspentEthUsd: number;
  tokensError: boolean;
  tokensPricesError: boolean;
  unspentPriceError: boolean;
  unspentError: boolean;
}>();

const showPrices = ref(false);

const someError = computed(() => {
  return (
    props.unspentError || props.tokensError || props.tokensPricesError || props.unspentPriceError
  );
});

const totalUsd = computed(() => {
  if (!props.tokens.length || !settingsStore.showUsdPrices) return 0;

  const totalEthUsd = props.unspentEthUsd;
  const totalTokensUsd = props.tokens.reduce((acc, token) => {
    return acc + (token?.usd?.balance ?? 0);
  }, 0);

  return totalEthUsd + totalTokensUsd;
});

onMounted(() => {
  showPrices.value = settingsStore.showUsdPrices;
});

const readableTokenBalance = (token: TokenBalance) => {
  if (token.info === null || token.balance === null) return 'Unknown balance';
  return fromTokenBalanceToHumanReadable(token.balance, token.info.decimals, token.info.decimals);
};
</script>

<template>
  <div class="tokens">
    <div class="tokens-holdings-header">
      <b>Balances</b>
      <span v-if="loadingTokens" class="spinner"></span>
    </div>
    <div class="total-usd" v-if="!loadingTokens && !someError && totalUsd > 0">
      Total: {{ formatUsdPrice(totalUsd) }}
    </div>
    <div :class="['tokens-holdings']">
      <div v-if="!unspentError">
        <div v-if="!loadingUnspent">
          {{ fromWeiToEth(unspentEth, 18) }} ETH
          <span v-if="showPrices && !unspentPriceError">
            ({{ formatUsdPrice(unspentEthUsd) }}) Ethereum</span
          >
          <span v-else> (Ethereum) </span>
        </div>
        <div v-if="showPrices && unspentPriceError" class="warning eth-price-warning">
          Ethereum USD balance was not loaded. Probably because of the Ethereum node limitations.
        </div>
      </div>

      <div
        v-if="unspentError || tokensError || tokensPricesError"
        class="warning tokens-holdings-warning"
      >
        <span v-if="unspentError">Ethereum balance was not loaded. </span>
        <span v-if="tokensError">Tokens were not loaded. </span>
        <span v-if="tokensPricesError">Tokens USD prices were not loaded. </span>
        <br />
        Probably because of the Ethereum node limitations. Check the node request limits, erigon and
        node logs.
      </div>

      <div v-if="!tokensError">
        <div v-if="loadingTokens">Loading tokens may take time...</div>
        <div v-if="!loadingTokens && !tokens?.length">No tokens found</div>

        <div v-if="tokens.length" class="token-container">
          <div class="token-item" v-for="(t, i) in tokens" :key="i">
            <div v-if="t.info && t.info.symbol">
              {{ readableTokenBalance(t) }}

              <span :class="[{ 'padded-token-symbol': !showPrices }]" v-if="t.info.name.length">
                {{ t.info.symbol }}
              </span>
              <RouterLink
                v-else
                :class="['link', { 'padded-token-symbol': !showPrices }]"
                :to="`/address/${t.token}`"
              >
                {{ t.info.symbol }}
              </RouterLink>

              <span v-if="showPrices && t.usd && !tokensPricesError">
                ({{ formatUsdPrice(t.usd.balance) }})
              </span>

              <span v-if="t.info.name.length" class="token-name">
                {{ showPrices && t.usd && !tokensPricesError ? '' : '('
                }}<RouterLink class="link" :to="`/address/${t.token}`">{{ t.info.name }}</RouterLink
                >{{ showPrices && t.usd && !tokensPricesError ? '' : ')' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tokens-holdings-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.tokens-holdings {
  height: auto;
  min-height: 170px;
  max-height: 170px;
  overflow-y: scroll;
  word-break: break-word;
}

.token-name {
  display: inline-block;
}

.tokens-holdings-warning {
  font-size: 17px;
}

.eth-price-warning {
  font-size: 17px;
}

.total-usd {
  word-break: break-word;
}

.padded-token-symbol {
  margin-right: 5px;
}
</style>
