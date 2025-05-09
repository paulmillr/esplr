<script setup lang="ts">
import Breadcrumbs from '@/components/Breadcrumbs.vue';
import { useAppStore } from '@/stores/app';
const appStore = useAppStore();
</script>

<template>
  <div class="header">
    <div class="title-wrapper">
      <h3 class="header-title">
        <RouterLink class="link" to="/">
          {{ appStore.networkName }}
        </RouterLink>
      </h3>
      <div class="desktop-only">
        <Breadcrumbs />
      </div>
    </div>
    <div>
      <RouterLink class="link" to="/favorites"> Favorites </RouterLink>
      <span v-if="$route.name !== 'settings'">|</span>
      <RouterLink v-if="$route.name !== 'settings'" class="link" to="/settings">
        Settings
      </RouterLink>
    </div>
  </div>
  <div class="mobile-only">
    <Breadcrumbs />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.header-title {
  display: inline-block;
  margin-top: 0;
  margin-right: 6px;
  margin-bottom: 0;
  word-break: break-word;
}

.desktop-only {
  display: none;
}

.mobile-only {
  display: inline;
}

@media (min-width: 576px) {
  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: inline;
  }
}
</style>
