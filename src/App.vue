<script setup lang="ts">
import { ref, provide } from 'vue';
import { RouterView } from 'vue-router';
import { ftch, jsonrpc } from 'micro-ftch';
import { Web3Provider, Chainlink } from 'micro-eth-signer/net';
import RpcField from '@/components/RpcField.vue';
import Search from '@/components/Search.vue';
import Header from '@/components/Header.vue';
import { getChainIdName } from '@/utils/utils';
import { APP_DESC } from '@/config';

import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
const appStore = useAppStore();
const settingsStore = useSettingsStore();

const connectionError = ref(false);
const connected = ref(false);

// All network requests from the app are done from this file
// ---------------------------------------------------------

// used for blockchain RPC requests
const provider = ref<Web3Provider>();

// used for Sourcify and other regular non RPC requests
const microFtch = ftch(fetch, {
  isValidRequest: (reqUrl) => {
    // This disables all requests which
    // are not headed to Sourcify URL or IPFS gateway URL.
    if (!reqUrl || !reqUrl.length) return false;

    const { sourcifyUrl, ipfsGatewayUrl } = settingsStore;
    if (!sourcifyUrl.length && !ipfsGatewayUrl.length) return false;

    if (sourcifyUrl.length && reqUrl.startsWith(sourcifyUrl)) return true;
    if (ipfsGatewayUrl.length && reqUrl.startsWith(ipfsGatewayUrl)) return true;

    return false;
  },
});
const net = (url: string) => microFtch(url);

provide('provider', provider);
provide('net', net);

const handleConnect = async (url: string) => {
  connectionError.value = false;
  const j = jsonrpc(
    ftch(fetch, {
      isValidRequest: (reqUrl) => {
        // This disables all requests which
        // are not headed to RPC URL.
        return url === reqUrl;
      },
    }),
    url,
    { batchSize: 25 }
  );
  provider.value = new Web3Provider(j);
  try {
    const netVersion = await provider.value.call('net_version');
    appStore.setNetworkName(getChainIdName(netVersion));
    appStore.setChainId(netVersion);
  } catch (e) {
    console.error('connection error:', e);
    connectionError.value = true;
    return;
  }
  appStore.setRpcUrl(url);

  const client = await provider.value.call('web3_clientVersion');
  const isErigon = client.toLowerCase().includes('erigon');
  appStore.setIsErigon(isErigon);

  if (settingsStore.showUsdPrices) {
    try {
      await new Chainlink(provider.value).coinPrice('ETH');
    } catch {
      console.warn('Chainlink error, disabling USD prices');
      settingsStore.setShowUsdPrices(false);
      settingsStore.setForciblyDisabledPrices(true);
    }
  }

  connected.value = true;
};
</script>

<template>
  <h1><RouterLink class="title-link" to="/">ESPLR</RouterLink></h1>
  <p v-if="!connected">{{ APP_DESC }}</p>
  <RpcField v-if="!connected" :connectionError="connectionError" @connect="handleConnect" />

  <div v-if="!connected">
    The app needs an archive node as a backend because of specific API calls.<br />
    Non-archive nodes from the list below can still be used, but the functionality would become
    limited:<br />
    <ul style="margin-top: 5px">
      <li>
        <a target="_blank" href="https://chainlist.org/chain/1">chainlist.org</a>
      </li>
      <li>
        <a target="_blank" href="https://evmchain.info/chain/1">evmchain.info</a>
      </li>
      <li>
        <a target="_blank" href="https://chainid.network/chain/1/">chainid.network</a>
      </li>
    </ul>
  </div>

  <div v-if="connected">
    <Header />
    <Search />
    <RouterView />
  </div>
</template>

<style scoped>
.title-link {
  text-decoration: none;
  color: inherit;
}
</style>
