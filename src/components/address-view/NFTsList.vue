<script setup lang="ts">
import { onMounted, ref, inject, type Ref } from 'vue';
import { Web3Provider } from 'micro-eth-signer/net';
import { ERC721, events, createContract } from 'micro-eth-signer/abi';
import { shortenFavAddr, handleClickCopyIcon, runWithConcurrency } from '@/utils/utils';
import { ipfsSettingsResolve } from '@/utils/url';
import { fetchWithTimeout } from '@/utils/network';
import type { NftLog } from '@/types';
import { AddressCache } from '@/cache/address/address';
import { useSettingsStore } from '@/stores/settings';

const ERC721_TRANSFER = events(ERC721).Transfer;

const provider = inject<Ref<Web3Provider>>('provider');
if (!provider) throw new Error('Provider not found!');
const prov = provider.value;

const settingsStore = useSettingsStore();
const cache = AddressCache.getInstance();

const props = defineProps<{
  address: string;
}>();

const loadingNfts = ref(false);
const loadingImages = ref(false);
const nftLogs = ref<NftLog[]>([]);

const loadingNftError = ref('');
const loadingImagesError = ref('');

onMounted(async () => {
  loadingNftError.value = '';

  const address = props.address;
  if (!address.length) return;

  if (cache.hasNftLogs(address)) {
    nftLogs.value = cache.getNftLogs(address);
  } else {
    try {
      nftLogs.value = await loadNftLogs(props.address);
      cache.addNftLogs(address, nftLogs.value);
    } catch (e) {
      console.error('Error loading NFT logs:', e);
      loadingNftError.value =
        'NFTs could not be loaded. Ethereum node has limitations or Erigon error has occurred. Check Erigon or node logs.';
      loadingNfts.value = false;
    }
  }

  if (settingsStore.showImages) {
    await showAndCacheImages(address);
  }
});

const loadAndInjectImages = async () => {
  loadingImages.value = true;

  const processLog = async (log: NftLog) => {
    if ('topicsTokenUri' in log && 'tokenMetadata' in log && 'tokenImageResolved' in log) {
      return { noImage: !log.tokenImageResolved?.length };
    }

    const contractAddress = log.address.toLowerCase();
    let uri = '';
    if (log.tokenInfo?.metadata) {
      try {
        const c = createContract(ERC721, prov, contractAddress);
        const tempBigInt = BigInt(log.topicsDecoded.tokenId);
        uri = await c.tokenURI.call(tempBigInt);
      } catch (e) {}
    }

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

    const topicsTokenUri = { original: uri, resolved: resolvedUri };

    let tokenImageResolved = '';
    if (metadata?.image) {
      tokenImageResolved = ipfsSettingsResolve(
        metadata.image,
        settingsStore.showHttpsImages,
        settingsStore.showIpfsImages,
        settingsStore.ipfsGatewayUrl
      );
    }

    log.topicsTokenUri = topicsTokenUri;
    log.tokenMetadata = metadata;
    log.tokenImageResolved = tokenImageResolved;

    return {
      noImage: !tokenImageResolved.length,
    };
  };

  const WORKERS = 10;
  const results = await runWithConcurrency({
    items: nftLogs.value,
    concurrency: WORKERS,
    worker: processLog,
  });

  let noImageCounter = 0;
  for (const r of results) {
    if (r.noImage) noImageCounter++;
  }

  if (noImageCounter === nftLogs.value.length) {
    loadingImagesError.value =
      'Images could not be loaded. The image URIs may not be presented or inaccessible.';
    setTimeout(() => {
      loadingImagesError.value = '';
    }, 7000);
  }

  loadingImages.value = false;
};

const loadNftLogs = async (address: string): Promise<NftLog[]> => {
  loadingNfts.value = true;

  const ercLogs = await prov.tokenTransfers(address);
  const erc721Logs = [];
  for (const logs of ercLogs) {
    for (const log of logs) {
      try {
        const decoded = ERC721_TRANSFER.decode(log.topics, log.data);
        erc721Logs.push({
          ...log,
          topicsDecoded: decoded,
        });
      } catch (e) {
        // not an ERC-721 transfer log
      }
    }
  }

  const uniqueAddresses = [...new Set(erc721Logs.map((log) => log.address))];
  const tokenInfoPromises = uniqueAddresses.map(async (address) => {
    const info = await prov.tokenInfo(address);
    return { address, info };
  });

  const tokenInfoResults = await Promise.all(tokenInfoPromises);

  // Update cache with results
  const tokenCache: Record<string, any> = {};
  tokenInfoResults.forEach(({ address, info }) => {
    tokenCache[address] = info;
  });
  const logsWithTokenInfo = erc721Logs.map((log) => ({
    ...log,
    tokenInfo: tokenCache[log.address],
  }));

  const erc721 = logsWithTokenInfo.filter(
    (log) => log.tokenInfo?.abi === 'ERC721' && log?.topicsDecoded?.tokenId
  );

  let tokensOwnersFetchErrors = false;
  const contractsCache = new Map<string, any>();
  const tokensOwnersPromises = erc721.map(async (log) => {
    const contractAddress = log.address.toLowerCase();

    if (!contractsCache.has(contractAddress)) {
      const c = createContract(ERC721, prov, contractAddress);
      contractsCache.set(contractAddress, c);
    }
    const c = contractsCache.get(contractAddress);

    try {
      const owner = await c.ownerOf.call(log.topicsDecoded.tokenId);
      return {
        ...log,
        topicsTokenOwner: owner,
      };
    } catch (e) {
      tokensOwnersFetchErrors = true;
      return null;
    }
  });

  const tokensOwnersResults = await Promise.all(tokensOwnersPromises);
  if (tokensOwnersFetchErrors) {
    console.error(`Failed to fetch owners for some tokens.`);
  }

  const tokenOwnersLogs = tokensOwnersResults.filter(
    (log): log is NonNullable<typeof log> =>
      log !== null && log?.topicsTokenOwner.toLowerCase() === address.toLowerCase()
  );

  const seen = new Set();
  const uniqueUserLogs = tokenOwnersLogs.filter((log) => {
    const identifier = `${log.address}-${log.topicsDecoded.tokenId}`;
    if (seen.has(identifier)) {
      return false;
    } else {
      seen.add(identifier);
      return true;
    }
  });

  loadingNfts.value = false;
  return uniqueUserLogs;
};

const showAndCacheImages = async (address: string): Promise<boolean> => {
  loadingImagesError.value = '';
  if (loadingImages.value) {
    return false;
  }

  try {
    await loadAndInjectImages();
    cache.addNftLogs(address, nftLogs.value);
  } catch (e) {
    console.error('Error showing images:', e);
    loadingImagesError.value =
      'Images could not be loaded. Ethereum node has limitations or Erigon error has occurred or problem with IPFS server. Check Erigon or node logs or IPFS server.';
    setTimeout(() => {
      loadingImagesError.value = '';
    }, 10000);
    loadingImages.value = false;
    return false;
  }

  return true;
};
</script>

<template>
  <div class="nfts">
    <div class="nfts-list-header">
      <div class="nfts-title">
        <b>NFTs</b>
        <span v-if="loadingNfts || loadingImages" class="spinner"></span>
        <span v-else>({{ nftLogs.length }} tokens)</span>
      </div>
      <div class="warning" v-if="!settingsStore.showImages && !loadingNfts">
        Images hidden, check settings.
      </div>
    </div>

    <div v-if="!loadingNfts && !nftLogs.length && !loadingNftError.length" class="no-nfts">
      No NFTs found for this address.
    </div>

    <div v-if="loadingNfts" class="loading-nfts">
      ℹ️ It may take a while for addresses with long history...
    </div>

    <div v-if="loadingNftError.length" class="warning">
      {{ loadingNftError }}
    </div>

    <div v-if="loadingImagesError.length" class="warning">
      {{ loadingImagesError }}
    </div>

    <div class="nft-details">
      <div v-for="nft in nftLogs" class="nft-item">
        <div class="img-wrapper">
          <span class="label small img-label">ERC-721</span>
          <div class="img-container">
            <img
              v-if="nft?.tokenImageResolved?.length"
              :src="nft.tokenImageResolved"
              :alt="`NFT ${nft.topicsDecoded.tokenId}`"
            />
            <span v-else>NFT</span>
          </div>
        </div>
        <div>
          <div><b>Token</b>: {{ nft.tokenInfo?.name || '' }}</div>
          <div>
            <b>Token ID</b>:
            <RouterLink class="link" :to="`/nft/${nft.address}/${nft.topicsDecoded.tokenId}`">
              {{
                nft.topicsDecoded.tokenId.toString().length > 35
                  ? nft.topicsDecoded.tokenId.toString().slice(0, 35) + '...'
                  : nft.topicsDecoded.tokenId
              }}
            </RouterLink>
          </div>
          <div>
            <b>Token Symbol</b>:
            {{ nft?.tokenMetadata?.symbol?.length ? nft.tokenMetadata.symbol : '-' }}
          </div>
          <div>
            <b>NFT Contract Address</b>:
            <span>
              <RouterLink class="link" :to="`/address/${nft.address}`">
                {{ shortenFavAddr(nft.address) }}
              </RouterLink>
            </span>
            <i
              @click="(e: Event) => handleClickCopyIcon(e, nft.address)"
              class="hash-copy-icon bi bi-copy"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nft-details {
  max-height: 420px;
  overflow: hidden;
  overflow-y: auto;
}

.nfts-list-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 7px;
}

@media (min-width: 425px) {
  .nfts-list-header {
    flex-direction: row;
    align-items: center;
  }
}

.nfts-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

.nft-item {
  padding: 10px 0px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--ash-grey);
  word-break: break-word;
  flex-direction: column;
}

@media (min-width: 425px) {
  .nft-item {
    align-items: center;
    flex-direction: row;
  }
}

.nft-item:last-child {
  border-bottom: none;
}

.img-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid var(--ash-grey);
  border-radius: var(--std-radius);
  padding: 12px;
  width: 135px;
  height: 135px;
}

.img-container {
  width: 110px;
  height: 110px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.img-container img {
  max-height: 110px;
}

.img-label {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 13px;
  padding: 2px 6px;
  color: white;
}

.hash-copy-icon {
  cursor: pointer;
  font-style: normal;
  margin-left: 5px;
}

.show-images {
  display: flex;
  align-items: center;
  flex-direction: column;
}

@media (min-width: 485px) {
  .show-images {
    flex-direction: row;
  }
}

.warning {
  font-size: 17px;
}
</style>
