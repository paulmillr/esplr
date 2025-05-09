<script setup lang="ts">
import { ref, watch, useTemplateRef, warn } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const search = ref('');
let usedUnput = false;

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const TX_RE = /^0x[0-9a-fA-F]{64}$/;
const BLOCK_RE = /^[1-9][0-9]*$/;

const searchTypeBtn = useTemplateRef('search-type-btn');
const searchBtn = useTemplateRef('search-btn');
const downBtn = useTemplateRef('down-btn');
const searchByAddress = ref(true);
const warning = ref('');
const warningBlock = useTemplateRef('warning-block');

watch(
  () => [route.params.block, route.params.tx, route.params.address],
  ([block, tx, address]) => {
    if (!usedUnput) {
      search.value = '';
      return;
    }
    if (!block?.length && !tx?.length && !address?.length) return;
    search.value = (block as string) || (tx as string) || (address as string);
    usedUnput = false;
  }
);

const handleSearch = () => {
  clearWarning();
  usedUnput = true;
  const query = search.value.toLowerCase();
  const isAddress = searchByAddress.value;

  if (isAddress) {
    if (ADDR_RE.test(query)) return router.push({ path: `/address/${query}` });
    showWarning('Invalid address. Try to search by transaction or block.');
  } else {
    if (TX_RE.test(query)) return router.push({ path: `/tx/${query}` });
    if (BLOCK_RE.test(query)) return router.push({ path: `/block/${query}` });
    showWarning('Invalid transaction hash or block number. Try to search by address.');
  }

  usedUnput = false;
};

const toggleDropdown = () => {
  searchTypeBtn.value?.classList.toggle('d-none');
  searchBtn.value?.classList.toggle('search-btn-active');
  downBtn.value?.classList.toggle('down-btn-active');
};

const toggleAddressSearch = () => {
  searchByAddress.value = !searchByAddress.value;
  searchTypeBtn.value?.classList.add('d-none');
  searchBtn.value?.classList.remove('search-btn-active');
  downBtn.value?.classList.remove('down-btn-active');
};

const showWarning = (msg: string) => {
  warning.value = msg;
  warningBlock.value?.classList.remove('d-none');
  setTimeout(clearWarning, 5000);
};

const clearWarning = () => {
  warning.value = '';
  warningBlock.value?.classList.add('d-none');
};
</script>

<template>
  <div class="search">
    <input
      class="text-input"
      type="text"
      v-model.trim="search"
      placeholder="Search addresses, transactions, blocks"
    />
    <div class="dropdown">
      <button ref="search-btn" @click="handleSearch" class="btn btn-dark btn-search">
        🔎 {{ searchByAddress ? 'Address' : 'Txn / block' }}
      </button>
      <button ref="down-btn" @click="toggleDropdown" class="btn btn-dark btn-down">🔽</button>
      <button
        ref="search-type-btn"
        class="btn btn-dark btn-dropdown d-none"
        @click="toggleAddressSearch"
      >
        {{ searchByAddress ? 'Txn / block' : 'Address' }}
      </button>
    </div>
  </div>
  <div ref="warning-block" class="warning d-none">{{ warning }}</div>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  text-align: right;
  position: relative;
  gap: 7px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.text-input {
  width: 100%;
}

@media (min-width: 500px) {
  .search {
    flex-direction: row;
  }
}

.btn-search {
  width: 100%;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: 1px solid var(--ash-grey-lighter);
}

@media (min-width: 500px) {
  .btn-search {
    width: 135px;
  }
}

.btn-down {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.dropdown {
  position: relative;
  display: flex;
}

.btn-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  height: 100%;
  width: 100%;
  z-index: 1;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: 1px solid var(--ash-grey-lighter);
}

.btn-dropdown:hover {
  opacity: 1;
}

.d-none {
  display: none;
}

.warning {
  margin-top: -10px;
  font-size: 17px;
}

.search-btn-active {
  border-bottom-left-radius: 0;
}

.down-btn-active {
  border-bottom-right-radius: 0;
}
</style>
