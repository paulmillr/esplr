<script setup lang="ts">
import { onMounted, ref, inject, type Ref } from 'vue';
import { Web3Provider } from 'micro-eth-signer/net';
import { useRoute } from 'vue-router';
import { ERC721, createContract } from 'micro-eth-signer/abi';
import { useSettingsStore } from '@/stores/settings';
import { ipfsSettingsResolve } from '@/utils/url';
import { fetchWithTimeout } from '@/utils/network';
import { shortenAddr10 } from '@/utils/utils';

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

const settingsStore = useSettingsStore();

const route = useRoute();
const contract = ref(((route.params.address as string) || '').toLowerCase());
const tokenId = ref(route.params.token as string);

const tokenName = ref('');
const tokenABI = ref('');
const tokenTotalSupply = ref<BigInt | null>(null);
const tokenSymbol = ref('');
const tokenEnumerable = ref(false);
const tokenMetadata = ref(false);
const tokenOwner = ref('');

const description = ref('');
const tokenImage = ref('');

const loading = ref(false);

onMounted(async () => {
  loading.value = true;

  // Info

  const info = await prov.tokenInfo(contract.value);
  tokenName.value = 'name' in info && info.name ? info.name : '';
  tokenABI.value = 'abi' in info && info.abi ? info.abi : '';
  tokenTotalSupply.value = 'totalSupply' in info && info.totalSupply ? info.totalSupply : null;
  tokenSymbol.value = 'symbol' in info && info.symbol ? info.symbol : '';
  tokenEnumerable.value = 'enumerable' in info && info.enumerable ? info.enumerable : false;
  tokenMetadata.value = 'metadata' in info && info.metadata ? info.metadata : false;

  // Image

  let uri = '';
  let owner = '';
  try {
    const c = createContract(ERC721, prov, contract.value);
    uri = await c.tokenURI.call(BigInt(tokenId.value));
    tokenOwner.value = await c.ownerOf.call(BigInt(tokenId.value));
  } catch (e) {}

  const resolvedUri = ipfsSettingsResolve(
    uri,
    settingsStore.showHttpsImages,
    settingsStore.showIpfsImages,
    settingsStore.ipfsGatewayUrl
  );

  const metadata = resolvedUri.length
    ? await fetchWithTimeout(resolvedUri, 5000)
        .then((res: any) => res.json())
        .catch(() => null)
    : null;

  if (metadata?.description) {
    description.value = metadata.description;
  }

  if (metadata?.image) {
    tokenImage.value = ipfsSettingsResolve(
      metadata.image,
      settingsStore.showHttpsImages,
      settingsStore.showIpfsImages,
      settingsStore.ipfsGatewayUrl
    );
  }

  loading.value = false;
});
</script>

<template>
  <div class="header"><b>NFT Contract: </b> {{ contract }}</div>

  <div class="content">
    <div class="img-wrapper">
      <span class="label small img-label">ERC-721</span>
      <div class="img-container">
        <img v-if="tokenImage?.length" :src="tokenImage" :alt="`NFT ${tokenId}`" />
        <span v-else>NFT</span>
      </div>
    </div>
    <div class="info">
      <div class="field">
        <div class="field-title">Name:</div>
        <div>{{ tokenName }}</div>
      </div>
      <div class="field">
        <div class="field-title">Token ID:</div>
        <div>{{ tokenId }}</div>
      </div>
      <div class="field">
        <div class="field-title">Owner:</div>
        <div>
          <RouterLink class="link" :to="`/address/${tokenOwner}`">{{
            shortenAddr10(tokenOwner)
          }}</RouterLink>
        </div>
      </div>
      <div class="field">
        <div class="field-title">ABI:</div>
        <div>{{ tokenABI }}</div>
      </div>
      <div class="field">
        <div class="field-title">Total Supply:</div>
        <div>{{ tokenTotalSupply ?? '-' }}</div>
      </div>
      <div class="field">
        <div class="field-title">Symbol:</div>
        <div>{{ tokenSymbol }}</div>
      </div>
      <div class="field">
        <div class="field-title">Enumerable:</div>
        <div>{{ tokenEnumerable ? 'Yes' : 'No' }}</div>
      </div>
      <div class="field">
        <div class="field-title">Metadata:</div>
        <div>{{ tokenMetadata ? 'Yes' : 'No' }}</div>
      </div>
    </div>
  </div>

  <div v-if="description.length" class="info bottom-info">
    {{ description }}
  </div>
</template>

<style scoped>
.header {
  word-wrap: break-word;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 15px;
  margin-top: 10px;
}

@media (min-width: 700px) {
  .content {
    flex-direction: row;
  }
}

.info {
  flex-grow: 1;
  padding: 0 12px;
  margin-bottom: 0;
}

.img-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 12px;
  width: 305px;
  height: 305px;
  min-width: 305px;
  min-height: 305px;
  margin: 0 auto;
}

.img-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.img-container img {
  max-height: 100%;
  max-width: 100%;
}

.img-label {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 13px;
  padding: 2px 6px;
  color: white;
}

.field-title {
  min-width: 130px;
  font-weight: bold;
}

.field {
  padding: 3px 0;
}

.bottom-info {
  margin-top: 10px;
}
</style>
