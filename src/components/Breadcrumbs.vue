<script setup lang="ts">
import { computed, onBeforeUpdate, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { shortenAddr10, shortenAddr, shortenTx, sliceTo } from '@/utils/utils';
import { AddressCache } from '@/cache/address/address';

const route = useRoute();
const pageHasParams = computed(() => Object.keys(route.params).length > 0);
const cache = AddressCache.getInstance();

type PrevRouteValue = {
  link: string;
  text: string;
  type: string;
};

const prevRouteValue = ref<PrevRouteValue | null>(null);
const newRouteValue = ref<PrevRouteValue | null>(null);

const isEmptyNewRouteValue = computed(() => {
  return (
    !newRouteValue.value ||
    !newRouteValue.value.link.length ||
    !newRouteValue.value.text.length ||
    !newRouteValue.value.type.length
  );
});

onBeforeUpdate(() => {
  if (isEmptyNewRouteValue.value) {
    return updateNewRouteValue();
  }

  prevRouteValue.value = newRouteValue.value;
  updateNewRouteValue();
});

onMounted(() => {
  if (isEmptyNewRouteValue.value) {
    return updateNewRouteValue();
  }
});

const updateNewRouteValue = () => {
  if (route.name === 'transaction') {
    newRouteValue.value = {
      link: `/tx/${route.params.tx}`,
      text: shortenTx(route.params.tx as string),
      type: 'transaction',
    };
  } else if (route.name === 'block') {
    newRouteValue.value = {
      link: `/block/${route.params.block}`,
      text: route.params.block as string,
      type: 'block',
    };
  } else if (route.name === 'address') {
    newRouteValue.value = {
      link: `/address/${route.params.address}`,
      text: `${shortenAddr10(route.params.address as string)}`,
      type: 'address',
    };
  }
};

const addressBreadcrumb = (address: string) => {
  const shortAddr = shortenAddr10(address);
  const section = cache.isFavoriteAddress(address) ? 'favorites' : 'address';
  return ` / ${section} / ${shortAddr}`;
};
</script>

<template>
  <div v-if="$route.name !== 'main'" class="breadcrumbs">
    <span
      v-if="
        $route.name !== 'settings' &&
        $route.name !== 'address' &&
        $route.name !== 'sourcify' &&
        $route.name !== 'nfts'
      "
    >
      / {{ $route.name }} {{ pageHasParams && $route.name !== 'nft' ? '/' : '' }}
      {{ $route.params.tx?.length ? shortenTx($route.params.tx as string) : '' }}
      {{ $route.params.block?.length ? $route.params.block : '' }}
    </span>

    <span v-if="$route.name === 'address' || $route.name === 'sourcify' || $route.name === 'nfts'">
      {{ $route.params.address?.length ? addressBreadcrumb($route.params.address as string) : '' }}
    </span>

    <span v-if="$route.name === 'settings'"> / Settings </span>

    <span v-if="$route.name === 'nft'">
      /
      {{ $route.params.address?.length ? shortenAddr($route.params.address as string) : '' }}
      /
      {{ $route.params.token?.length ? sliceTo($route.params.token as string, 10) : '' }}
    </span>
  </div>
  <div class="back-to" v-if="prevRouteValue">
    Back to {{ prevRouteValue.type }}
    <RouterLink class="link" :to="prevRouteValue.link">
      {{ prevRouteValue.text }}
    </RouterLink>
  </div>
</template>

<style scoped>
.breadcrumbs {
  display: inline-block;
  word-break: break-word;
}

.back-to {
  word-break: break-word;
}
</style>
