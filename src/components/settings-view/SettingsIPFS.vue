<script setup lang="ts">
import { onMounted, ref, inject } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import Checkbox from '@/components/Checkbox.vue';
import { hasValidProtocol, normalizeIpfsUrl } from '@/utils/url';

const net = inject<Function>('net');
if (!net) throw new Error('Net not found!');

const settingsStore = useSettingsStore();

const success = ref('');
const warning = ref('');
const remember = ref(false);
const checking = ref(false);

const isUrlInLocalStorage = () => !!localStorage.getItem('ipfsGatewayUrl')?.length;

onMounted(() => {
  remember.value = isUrlInLocalStorage();
});

const checkGatewayConnect = async () => {
  checking.value = true;
  warning.value = '';
  success.value = '';

  if (!settingsStore.ipfsGatewayUrl) {
    showWarning('Please provide IPFS gateway base URL');
    checking.value = false;
    return;
  }

  if (/^https?:?\/?\/?$/.test(settingsStore.ipfsGatewayUrl)) {
    showWarning('Please provide a valid URL');
    checking.value = false;
    return;
  }

  if (!hasValidProtocol(settingsStore.ipfsGatewayUrl)) {
    showWarning('Invalid URL. Only http(s) endpoints are supported.');
    checking.value = false;
    return;
  }

  settingsStore.setIpfsGatewayUrl(normalizeIpfsUrl(settingsStore.ipfsGatewayUrl));

  if (remember.value) {
    localStorage.setItem('ipfsGatewayUrl', settingsStore.ipfsGatewayUrl);
  }
  
  try {
    const CID_GATEWAY_CHECKER = 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m';
    const testUrl = `${settingsStore.ipfsGatewayUrl}${CID_GATEWAY_CHECKER}`;
    const res = await fetch(testUrl, { method: 'HEAD' });
    if (res.ok) {
      showSuccess('Gateway responded successfully');
      checking.value = false;
      return;
    }
  } catch (e) {
    console.error(e);
  }

  showWarning('Failed to connect to IPFS gateway base URL');
  checking.value = false;
};

const showWarning = (msg: string) => {
  warning.value = msg;
};

const showSuccess = (msg: string) => {
  success.value = msg;
  setTimeout(() => {
    success.value = '';
  }, 7000);
};

const handleUrlBlur = () => {
  if (!settingsStore.ipfsGatewayUrl.length) return;
  showWarning('');

  if (/^https?:?\/?\/?$/.test(settingsStore.ipfsGatewayUrl)) {
    showWarning('Please provide a valid URL');
    return;
  }

  if (!hasValidProtocol(settingsStore.ipfsGatewayUrl)) {
    showWarning('Invalid URL. Only http(s) endpoints are supported.');
    return;
  }

  settingsStore.setIpfsGatewayUrl(normalizeIpfsUrl(settingsStore.ipfsGatewayUrl));

  if (remember.value) {
    localStorage.setItem('ipfsGatewayUrl', settingsStore.ipfsGatewayUrl);
  }
};

const handleUrlInput = () => {
  if (remember.value) {
    localStorage.setItem('ipfsGatewayUrl', settingsStore.ipfsGatewayUrl);
  }
  if (!settingsStore.ipfsGatewayUrl.length) {
    localStorage.removeItem('ipfsGatewayUrl');
  }
};

const handleRememberMe = () => {
  if (remember.value) {
    localStorage.removeItem('ipfsGatewayUrl');
  } else if (settingsStore.ipfsGatewayUrl.length) {
    localStorage.setItem('ipfsGatewayUrl', settingsStore.ipfsGatewayUrl);
  }
  remember.value = !remember.value;
};
</script>

<template>
  <div>
    <h4 class="ipfs-header">
      <img class="ipfs-icon" src="@/assets/ipfs.svg" alt="IPFS logo" />
      IPFS
    </h4>
    <div class="description">
      <p>
        To resolve <code>ipfs://</code> links for NFTs, provide your IPFS gateway URL.
        If empty, the default public gateway <code>ipfs.io/ipfs/</code> will be used.
        Check out README for more options and info.
      </p>
      <p>
        ⚠️ Provided URL used only when "<a href="#show-images">Show images</a>" option is enabled. Some NFTs provide own IPFS gateways, which will <a href="#show-images">leak your ip+browser</a>.
      </p>
    </div>
    <div class="ipfs-field">
      <input
        type="text"
        v-model.trim="settingsStore.ipfsGatewayUrl"
        @input="handleUrlInput"
        @blur="handleUrlBlur"
        placeholder="IPFS gateway base URL (e.g. http://127.0.0.1:8080/ipfs)"
        class="text-input"
      />
      <button @click="checkGatewayConnect" class="btn btn-dark check-ipfs-btn">
        <span v-if="checking" class="spinner"></span>
        <span v-else>Check</span>
      </button>
    </div>
    <div class="warning">{{ warning }}</div>
    <div class="success">{{ success }}</div>
    <div class="remember-me">
      <Checkbox @onChange="handleRememberMe" :checked="remember" label="Remember URL" />
    </div>
  </div>
</template>

<style scoped>
.ipfs-icon {
  width: 20px;
  height: 20px;
}

.ipfs-field {
  display: flex;
  align-items: normal;
  gap: 7px;
}

.description {
  word-wrap: break-word;
}

.warning,
.success {
  font-size: 17px;
}

.remember-me {
  margin-top: 7px;
}

.check-ipfs-btn {
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ipfs-header {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
