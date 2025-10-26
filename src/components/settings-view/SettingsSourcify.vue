<script setup lang="ts">
import { onMounted, ref, inject } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import Checkbox from '@/components/Checkbox.vue';
import { hasProtocol, hasValidProtocol, addProtocol } from '@/utils/url';

const net = inject<Function>('net');
if (!net) throw new Error('Net not found!');

const settingsStore = useSettingsStore();

const sourcifySuccess = ref('');
const sourcifyWarning = ref('');
const rememberSourcify = ref(false);
const checkingSourcify = ref(false);

const isSourcifyUrlInLocalStorage = () => !!localStorage.getItem('sourcifyUrl')?.length;

onMounted(() => {
  rememberSourcify.value = isSourcifyUrlInLocalStorage();
});

const checkSourcifyConnect = async () => {
  checkingSourcify.value = true;
  sourcifyWarning.value = '';
  sourcifySuccess.value = '';

  if (!settingsStore.sourcifyUrl) {
    showSourcifyWarning('Please provide Sourcify archive URL');
    checkingSourcify.value = false;
    return;
  }

  if (/^https?:?\/?\/?$/.test(settingsStore.sourcifyUrl)) {
    showSourcifyWarning('Please provide a valid URL');
    checkingSourcify.value = false;
    return;
  }

  if (!hasValidProtocol(settingsStore.sourcifyUrl)) {
    showSourcifyWarning('Invalid URL. Only http(s) endpoints are supported.');
    checkingSourcify.value = false;
    return;
  }

  if (!hasProtocol(settingsStore.sourcifyUrl)) {
    settingsStore.setSourcifyUrl(addProtocol(settingsStore.sourcifyUrl));
  }

  if (rememberSourcify.value) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }

  try {
    let json = await net(`${settingsStore.sourcifyUrl}/full_match`);
    if (json && json.ok) {
      showSourcifySuccess('Server responded successfully');
      checkingSourcify.value = false;
      return;
    }

    json = await net(`${settingsStore.sourcifyUrl}/partial_match`);
    if (json && json.ok) {
      showSourcifySuccess('Server responded successfully');
      checkingSourcify.value = false;
      return;
    }
  } catch (e) {
    console.error(e);
  }

  showSourcifyWarning(
    'Failed to connect to Sourcify archive URL or no "partial_match" or "full_match" directories in archive root were found'
  );
  checkingSourcify.value = false;
};

const showSourcifyWarning = (msg: string) => {
  sourcifyWarning.value = msg;
};

const showSourcifySuccess = (msg: string) => {
  sourcifySuccess.value = msg;
  setTimeout(() => {
    sourcifySuccess.value = '';
  }, 7000);
};

const handleSourcifyUrlBlur = () => {
  if (!settingsStore.sourcifyUrl.length) return;
  showSourcifyWarning('');

  if (/^https?:?\/?\/?$/.test(settingsStore.sourcifyUrl)) {
    showSourcifyWarning('Please provide a valid URL');
    return;
  }

  if (!hasValidProtocol(settingsStore.sourcifyUrl)) {
    showSourcifyWarning('Invalid URL. Only http(s) endpoints are supported.');
    return;
  }

  if (!hasProtocol(settingsStore.sourcifyUrl)) {
    settingsStore.setSourcifyUrl(addProtocol(settingsStore.sourcifyUrl));
  }

  if (rememberSourcify.value) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }
};

const handleSourcifyUrlInput = () => {
  if (rememberSourcify.value) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }
  if (!settingsStore.sourcifyUrl.length) {
    localStorage.removeItem('sourcifyUrl');
  }
};

const handleRememberMeSourcify = () => {
  if (rememberSourcify.value) {
    localStorage.removeItem('sourcifyUrl');
  } else if (settingsStore.sourcifyUrl.length) {
    localStorage.setItem('sourcifyUrl', settingsStore.sourcifyUrl);
  }
  rememberSourcify.value = !rememberSourcify.value;
};
</script>

<template>
  <div>
    <h4 class="sourcify-header">
      <img class="sourcify-icon" src="@/assets/sourcify.svg" alt="Sourcify logo" />
      Sourcify
    </h4>
    <div class="description">
      <p>
        Sourcify (<a target="_blank" href="https://sourcify.dev/">homepage</a>) allows to see extra
        information about contracts on ESPLR (name, ABI, methods, language, compiler details, etc.).
      </p>
      <p>
        To enable integration, provide an URL to a Sourcify instance. Check out esplr README for
        setup guidance.
      </p>
    </div>
    <div class="soucify-field">
      <input
        type="text"
        v-model.trim="settingsStore.sourcifyUrl"
        @input="handleSourcifyUrlInput"
        @blur="handleSourcifyUrlBlur"
        placeholder="Sourcify archive URL"
        class="text-input"
      />
      <button @click="checkSourcifyConnect" class="btn btn-dark check-sourcify-btn">
        <span v-if="checkingSourcify" class="spinner"></span>
        <span v-else>Check</span>
      </button>
    </div>
    <div class="warning">
      {{ sourcifyWarning }}
    </div>
    <div class="success">
      {{ sourcifySuccess }}
    </div>
    <div class="remember-me">
      <Checkbox
        @onChange="handleRememberMeSourcify"
        :checked="rememberSourcify"
        label="Remember URL"
      />
    </div>
  </div>
</template>

<style scoped>
.sourcify-icon {
  width: 20px;
  height: 20px;
}

.soucify-field {
  display: flex;
  align-items: normal;
  gap: 7px;
}

.description {
  word-wrap: break-word;
}

.sourcify-header {
  display: flex;
  align-items: center;
  gap: 5px;
}

.warning,
.success {
  font-size: 17px;
}

.remember-me {
  margin-top: 7px;
}

.check-sourcify-btn {
  min-width: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
