<script setup lang="ts">
import { onMounted, inject, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { Web3Provider } from 'micro-eth-signer/net';
import { formatTimestampLocal, fromWeiToGwei, fromWeiToEth } from '@/utils/utils';
import type { BlockInfo } from 'node_modules/micro-eth-signer/net/archive';
import { hexToNumber } from 'micro-eth-signer/utils';

// Block #1 in eth will not show full list of txs: they are present in
// genesis_block.json which we don't include

const route = useRoute();
const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

const blockNumber = ref('');
const hash = ref('');
const parentHash = ref('');
const timestamp = ref('');
const size = ref(0);
const transactionsCount = ref(0);
const withdrawalsCount = ref(0);
const gasUsed = ref(0n);
const gasLimit = ref(0n);
const blobGasUsed = ref(0n);
const baseFeePerGas = ref('');
const burntFees = ref(0n);

const loadingBlock = ref(true);

type extendedBlockInfo = BlockInfo & { blobGasUsed: string; withdrawals: unknown[] };

onMounted(async () => {
  await mount(route.params.block as string);
});

watch(
  () => route.params.block,
  async (newBlock) => {
    await mount(newBlock as string);
  }
);

const mount = async (block: string) => {
  blockNumber.value = block;

  loadingBlock.value = true;
  const details = (await prov.blockInfo(parseInt(block))) as extendedBlockInfo;
  loadingBlock.value = false;

  hash.value = details.hash;
  parentHash.value = details.parentHash;
  timestamp.value = formatTimestampLocal(details.timestamp);
  size.value = details.size;
  transactionsCount.value = details.transactions.length;
  withdrawalsCount.value = details?.withdrawals ? details.withdrawals.length : 0;
  gasUsed.value = details.gasUsed;
  gasLimit.value = details.gasLimit;
  baseFeePerGas.value = details.baseFeePerGas
    ? `${fromWeiToGwei(details.baseFeePerGas, 9)} Gwei`
    : '-';

  try {
    blobGasUsed.value = details?.blobGasUsed.length ? hexToNumber(details.blobGasUsed) : 0n;
  } catch (error) {
    console.error('Error parsing block gas used:', error);
  }

  if (details.gasUsed && details.baseFeePerGas) {
    burntFees.value = details.gasUsed * details.baseFeePerGas;
  }
};
</script>

<template>
  <div class="header"><b>Block:</b> {{ blockNumber }}</div>

  <div class="details-header">
    <b>Details:</b> <span v-if="loadingBlock" class="spinner"></span>
  </div>

  <div class="info">
    <div class="field">
      <div class="field-title">Time:</div>
      <div class="hash">{{ timestamp }}</div>
    </div>
    <div class="field">
      <div class="field-title">Transactions:</div>
      <div class="hash">
        <span v-if="transactionsCount > 0">
          <RouterLink class="link" :to="`/block/${blockNumber}/txs`">
            {{ transactionsCount }} txs
          </RouterLink>
        </span>
        <span v-else>0</span>
      </div>
    </div>
    <div class="field">
      <div class="field-title">Withdrawals:</div>
      <div class="hash">{{ withdrawalsCount > 0 ? withdrawalsCount : '-' }}</div>
    </div>
    <div class="field">
      <div class="field-title">Size:</div>
      <div class="hash">{{ size > 0 ? `${size} bytes` : '' }}</div>
    </div>
    <div class="field">
      <div class="field-title">Block Hash:</div>
      <div class="hash">{{ hash }}</div>
    </div>
    <div class="field">
      <div class="field-title">Parent Hash:</div>
      <div class="hash">{{ parentHash }}</div>
    </div>
    <div class="field">
      <div class="field-title">Gas Used:</div>
      <div class="hash">{{ gasUsed }}</div>
    </div>
    <div class="field">
      <div class="field-title">Gas Limit:</div>
      <div class="hash">{{ gasLimit > 0 ? gasLimit : '' }}</div>
    </div>
    <div class="field">
      <div class="field-title">Base Fee Per Gas:</div>
      <div class="hash">{{ baseFeePerGas }}</div>
    </div>
    <div class="field">
      <div class="field-title">Blob Gas Used:</div>
      <div class="hash">{{ blobGasUsed > 0 ? blobGasUsed : '-' }}</div>
    </div>
    <div class="field">
      <div class="field-title">Burnt Fees:</div>
      <div class="hash">{{ burntFees > 0 ? `🔥 ${fromWeiToEth(burntFees, 18)} ETH` : '-' }}</div>
    </div>
  </div>
</template>

<style scoped>
.header {
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: normal;
  word-break: break-word;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
}

.hash {
  font-size: 18px;
}

.info {
  justify-content: space-between;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 0 12px;
  margin-bottom: 15px;
  word-break: break-all;
}

.field {
  display: flex;
  flex-direction: column;
  padding: 7px 0px;
  border-bottom: 1px solid var(--ash-grey);
}

@media (min-width: 425px) {
  .field {
    flex-direction: row;
  }
}

.field:last-child {
  border-bottom: none;
}

.field-title {
  display: inline-block;
  font-weight: 600;
  font-size: 18px;
  min-width: 160px;
}
</style>
