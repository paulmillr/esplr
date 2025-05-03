import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router';
import MainView from '@/views/MainView.vue';
import AddressView from '@/views/AddressView.vue';
import TransactionView from '@/views/TransactionView.vue';
import BlockView from '@/views/BlockView.vue';
import SettingsView from '@/views/SettingsView.vue';
import BlockTransactions from '@/views/BlockTransactions.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainView,
    },
    {
      path: '/address/:address',
      name: 'address',
      component: AddressView,
    },
    {
      path: '/tx/:tx',
      name: 'transaction',
      component: TransactionView,
    },
    {
      path: '/block/:block',
      name: 'block',
      component: BlockView,
    },
    {
      path: '/block/:block/txs',
      name: 'transactions',
      component: BlockTransactions,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: AddressView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
});

export default router;
