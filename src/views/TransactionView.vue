<script setup lang="ts">
import { onMounted, inject, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { Web3Provider } from 'micro-eth-signer/net';
// import { decodeEvent } from 'micro-eth-signer/abi';
import type { TokenTransfer, TxInfo, TxReceipt } from 'node_modules/micro-eth-signer/net/archive';
import {
  formatTimestampLocal,
  getTransactionMethodName,
  shortenAddr,
  getTransferValue,
  fromWeiToEth,
  concatTransfers,
  roundToTwo,
} from '@/utils/utils';
import { getTokenTransfersForTxn } from '@/utils/network';

const route = useRoute();
const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

// taken from micro-eth-signer/net/archive
type TxnType = '' | 'legacy' | 'eip2930' | 'eip1559' | 'eip4844' | 'eip7702';
type TxnInfo = {
  type: TxnType;
  info: TxInfo;
  receipt: TxReceipt;
  raw?: string;
};

type NetTransfer = {
  addr: string;
  type: string;
  transfer: TokenTransfer;
};

const txnInfo = ref<TxnInfo | null>(null);
const txnReceipt = ref<TxReceipt | null>(null);
const isLoadingTxnBaseInfo = ref(false);
const isLoadingTxnTokenTransfers = ref(false);
const isLoadingBlockConfirmations = ref(false);

const transactionHash = ref('');
const blockConfirmations = ref(0);
const timestamp = ref('');
const action = ref('');
const success = ref(false);
const netTransfers = ref<NetTransfer[]>([]);
const value = ref(0);
const type = ref('');
const nonce = ref(0);
const transactionIndex = ref(0);
const gasUsed = ref(0n);
const gasLimit = ref(0n);
const input = ref('');

const transactionError = ref(false);
const transfersError = ref(false);
const blockError = ref(false);
const blockConfirmationsError = ref(false);

onMounted(async () => {
  await mount(route.params.tx as string);
});

watch(
  () => route.params.tx,
  async (newTx) => {
    await mount(newTx as string);
  }
);

const mount = async (tx: string) => {
  isLoadingTxnBaseInfo.value = true;
  isLoadingBlockConfirmations.value = true;
  transactionHash.value = tx;

  let txn: TxnInfo;
  try {
    transactionError.value = false;
    txn = await prov.txInfo(tx);
  } catch (error) {
    transactionError.value = true;
    isLoadingTxnBaseInfo.value = false;
    console.error(error);
    return;
  }
  txnInfo.value = txn;
  txnReceipt.value = txn.receipt ?? null;

  // console.log('Transaction:', txn);
  // const address = txn.receipt.logs[3]?.address;
  // const topics = txn.receipt.logs[3]?.topics;
  // const data = txn.receipt.logs[3]?.data;
  // if (topics) {
  //   const test = decodeEvent(address, topics, data);
  //   console.log('Decoded event:', test);
  // }

  const { hash, from, to, blockNumber } = txn.info;
  try {
    blockError.value = false;
    const blockDetails = await prov.blockInfo(blockNumber);
    timestamp.value = formatTimestampLocal(blockDetails.timestamp);
  } catch (error) {
    blockError.value = true;
    console.error('Error loading block details:', error);
  }

  // TODO: fix ts ignores below

  action.value = getTransactionMethodName(txn.info);
  // @ts-ignore
  success.value = txn.receipt.status === 1;
  // @ts-ignore
  value.value = txn.info.value;
  type.value = txn.type;
  // @ts-ignore
  nonce.value = txn.info.nonce;
  transactionIndex.value = txn.info.transactionIndex;
  gasUsed.value = txn.receipt.gasUsed;
  gasLimit.value = txn.info.gas;
  input.value = txn.info.input;
  isLoadingTxnBaseInfo.value = false;

  try {
    blockConfirmationsError.value = false;
    blockConfirmations.value = (await prov.height()) - blockNumber + 1;
  } catch (error) {
    blockConfirmationsError.value = true;
    console.error(error);
  }
  isLoadingBlockConfirmations.value = false;

  try {
    transfersError.value = false;
    isLoadingTxnTokenTransfers.value = true;
    const [fromAddrTransfers, toAddrTransfers] = await Promise.all([
      getTokenTransfersForTxn(prov, hash, from, blockNumber),
      to ? getTokenTransfersForTxn(prov, hash, to, blockNumber) : Promise.resolve([]),
    ]);
    netTransfers.value = concatTransfers(fromAddrTransfers, toAddrTransfers);
  } catch (error) {
    transfersError.value = true;
    console.error(error);
  }
  isLoadingTxnTokenTransfers.value = false;
};
</script>

<template>
  <div class="header">
    <div><b>Transaction hash:</b></div>
    <div class="tx-hash">{{ transactionHash }}</div>
  </div>

  <div class="details-header">
    <b>Details:</b>
    <span v-if="isLoadingTxnBaseInfo" class="spinner"></span>
  </div>
  <div v-if="transactionError" class="warning">
    <i class="bi bi-exclamation-triangle"></i>
    Transaction could not be loaded. Probably because of the Ethereum node limitations or wrong
    transaction hash.
  </div>

  <div v-if="!transactionError" class="info">
    <div class="field">
      <div class="field-title">Status:</div>
      <div v-if="!isLoadingTxnBaseInfo">
        <span v-if="success" class="label success"
          ><i class="icon bi bi-check-circle-fill"></i> Success</span
        >
        <span class="label failure" v-else><i class="icon bi bi-x-circle-fill"></i> Failure</span>
      </div>
    </div>

    <div class="field block">
      <div class="field-title">Block:</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="block-info">
        <RouterLink class="link" :to="`/block/${txnInfo.info.blockNumber}`">
          {{ txnInfo.info.blockNumber }}
        </RouterLink>
        <div class="block-confirmations" v-if="!isLoadingBlockConfirmations">
          <span v-if="blockConfirmationsError" class="warning" style="margin-left: 5px">
            <i class="bi bi-exclamation-triangle"></i>
            Block confirmations could not be loaded. Probably because of the Ethereum node
            limitations.
          </span>
          <span v-else class="label small">{{ blockConfirmations }} Block Confirmations</span>
        </div>
        <div class="block-confirmations" v-else>
          <div class="label small">
            <span class="spinner"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Time:</div>
      <div v-if="!blockError && !isLoadingTxnBaseInfo">
        {{ timestamp }}
      </div>
      <div v-if="blockError && !isLoadingTxnBaseInfo">
        <span class="warning">
          <i class="bi bi-exclamation-triangle"></i>
          Block time could not be loaded. Probably because of the Ethereum node limitations.
        </span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">From:</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="tx-hash">
        <RouterLink
          v-if="txnInfo.info.from?.length"
          class="link txn-hash-link"
          :to="`/address/${txnInfo.info.from}`"
        >
          {{ txnInfo.info.from }}
        </RouterLink>
        <span v-else>-</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Interacted With (To):</div>
      <div v-if="!isLoadingTxnBaseInfo && txnInfo" class="tx-hash">
        <RouterLink
          v-if="txnInfo.info.to?.length"
          class="link txn-hash-link"
          :to="`/address/${txnInfo.info.to}`"
        >
          {{ txnInfo.info.to }}
        </RouterLink>
        <span v-else>-</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Transaction Action:</div>
      <div v-if="!isLoadingTxnBaseInfo" :class="[{ label: action.length > 1 }]">{{ action }}</div>
    </div>

    <div class="field transfers-block">
      <div class="field-title">Tokens Transfers:</div>
      <div
        v-if="netTransfers.length && !isLoadingTxnTokenTransfers && !transfersError"
        class="net-transfers"
      >
        <div class="token-transfer" v-for="t in netTransfers" :key="t.addr">
          <span class="tx-hash shortenAddr">
            <RouterLink v-if="t.addr?.length" class="link txn-hash-link" :to="`/address/${t.addr}`">
              {{ shortenAddr(t.addr) }}
            </RouterLink>
            <span v-else>-</span>
          </span>
          <span class="tx-type">{{ t.type }}</span>
          <span class="tx-value">
            {{ getTransferValue(t.transfer) }}
            {{ 'symbol' in t.transfer ? t.transfer.symbol : '' }}
          </span>
        </div>
      </div>
      <div v-if="isLoadingTxnTokenTransfers && !isLoadingTxnBaseInfo">
        <span class="spinner"></span>
      </div>
      <div
        v-if="
          !transfersError &&
          !netTransfers.length &&
          !isLoadingTxnTokenTransfers &&
          !isLoadingTxnBaseInfo
        "
      >
        -
      </div>
      <div v-if="transfersError && !isLoadingTxnTokenTransfers && !isLoadingTxnBaseInfo">
        <span class="warning">
          <i class="bi bi-exclamation-triangle"></i>
          Token transfers could not be loaded. Probably because of the Ethereum node limitations.
        </span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Value:</div>
      <div class="eth-value" v-if="!isLoadingTxnBaseInfo">
        {{ fromWeiToEth(BigInt(value), 18) }} ETH
      </div>
    </div>

    <div class="field">
      <div class="field-title">Gas Used & Limit:</div>
      <div class="eth-value" v-if="!isLoadingTxnBaseInfo">
        {{ gasUsed > 0 ? gasUsed : '-' }} / {{ gasLimit > 0 ? gasLimit : '-' }}
        <span v-if="gasUsed > 0 && gasLimit > 0">
          ({{ roundToTwo((Number(gasUsed) / Number(gasLimit)) * 100) }}%)
        </span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Other attributes:</div>
      <div v-if="!isLoadingTxnBaseInfo" class="other-attributes">
        <span class="label small">Txn type: {{ type.toUpperCase() }}</span>
        <span class="label small">Nonce: {{ nonce }}</span>
        <span class="label small">Position in block: {{ transactionIndex }}</span>
      </div>
    </div>

    <div class="field">
      <div class="field-title">Input:</div>
      <div v-if="!isLoadingTxnBaseInfo" class="field-value">
        <div v-if="input.length > 0" class="input-data">
          {{ input }}
        </div>
        <div v-else>-</div>
      </div>
    </div>
  </div>

  <div class="details-header">
    <div style="display: flex; justify-content: space-between; width: 100%; align-items: baseline">
      <span style="display: flex; align-items: center; gap: 7px">
        <b>Logs:</b>
        <span v-if="isLoadingTxnBaseInfo" class="spinner"></span>
      </span>
      <span class="label"># log index</span>
    </div>
  </div>

  <div v-if="!transactionError" class="info">
    <div class="horizontal-field">
      <div v-if="txnReceipt && txnReceipt.logs.length">
        <div class="log-field" v-for="(log, logIndex) in txnReceipt.logs" :key="logIndex">
          <div>
            <div class="field-title">Address:</div>
            <span class="label small" style="float: right; margin-top: 3px">{{
              log.logIndex
            }}</span>
            <div>
              <RouterLink class="link" :to="`/address/${log.address}`">
                {{ log.address }}
              </RouterLink>
            </div>
          </div>
          <div>
            <div class="field-title">Topics:</div>
            <div v-for="(topic, logTopicIndex) in log.topics" :key="logTopicIndex">
              <span class="font-600">{{ logTopicIndex }}. </span><br />
              <span class="topic">{{ topic }}</span>
            </div>
            <div v-if="!log.topics.length">-</div>
          </div>
          <div>
            <div class="field-title">Data:</div>
            <div class="log-data">
              <span class="topic">
                {{ log.data }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else>-</div>
    </div>
  </div>
</template>

<style scoped>
.topic {
  font-size: 16px;
}

.log-field {
  display: flex;
  flex-direction: column;
  padding: 7px 0px;
  border-bottom: 1px solid var(--ash-grey);
}

.font-600 {
  font-weight: 600;
}

.log-data {
  overflow-y: scroll;
  max-height: 103px;
}

.input-data {
  overflow-y: scroll;
  max-height: 130px;
}

.header {
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: normal;
}

.details-header {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.tx-hash {
  font-size: 18px;
  word-break: break-word;
}

.field-value {
  font-size: 18px;
  word-break: break-word;
}

.info {
  justify-content: space-between;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 0 12px;
  margin-bottom: 15px;
}

.label.small {
  font-size: 13px;
  padding: 2px 6px;
  margin-bottom: 7px;
}

.label.small:last-child {
  margin-bottom: 0px;
}

@media (min-width: 650px) {
  .label.small {
    margin-left: 7px;
    margin-bottom: 0px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 7px 0px;
  border-bottom: 1px solid var(--ash-grey);
}

@media (min-width: 425px) {
  .field {
    flex-direction: row;
  }
}

.horizontal-field {
  padding: 7px 0px;
  font-size: 18px;
  word-break: break-word;
}

.transfers-block {
  flex-direction: column;
}

@media (min-width: 685px) {
  .transfers-block {
    flex-direction: row;
  }
}

.tx-value {
  word-break: break-word;
}

.field:last-child,
.log-field:last-child {
  border-bottom: none;
}

.field-title {
  display: inline-block;
  font-weight: 600;
  font-size: 18px;
  min-width: 180px;
}

.label.success {
  color: var(--success);
}

.label.failure {
  color: var(--error);
}

.shortenAddr {
  display: inline-block;
  min-width: 115px;
}

.tx-type {
  display: inline-block;
  min-width: 80px;
}

.net-transfers {
  max-height: 263px;
  overflow-y: scroll;
  width: 100%;
}

.other-attributes {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  word-break: break-word;
}

@media (min-width: 650px) {
  .other-attributes {
    flex-direction: row;
    align-items: center;
  }
}

.other-attributes .label.small:first-child {
  margin-left: 0px;
}

.block-info {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  word-break: break-word;
}

@media (min-width: 650px) {
  .block-info {
    flex-direction: row;
    align-items: center;
  }
}

.block-confirmations {
  display: flex;
}

.token-transfer {
  display: flex;
  flex-direction: column;
  padding: 6px;
  margin-top: 5px;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
}

@media (min-width: 480px) {
  .token-transfer {
    flex-direction: row;
    border: none;
    padding: 0;
    margin-top: 0;
  }
}

.eth-value {
  word-break: break-word;
}

.warning {
  font-size: 17px;
}
</style>
