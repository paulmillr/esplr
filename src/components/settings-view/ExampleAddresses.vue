<template>
  <div class="example-addresses">
    <h4>Test addresses</h4>
    <p>Addresses to test various features of the app (txns, balances, NFTs):</p>
    <ul>
      <li>
        <RouterLink class="link" :to="`/address/0x9529746295eaffc60937636e32f234f06bd16af3`"
          >0x9529746295eaffc60937636e32f234f06bd16af3</RouterLink
        >
      </li>
      <li>
        <RouterLink class="link" :to="`/address/0x28b6d64e064a44e1907f89375c7924ae21c6278c`"
          >0x28b6d64e064a44e1907f89375c7924ae21c6278c</RouterLink
        >
      </li>
      <li>
        <RouterLink class="link" :to="`/address/0xb65b4fd4dcb639b400fbd3d0ee5d272b5e49c2a8`"
          >0xb65b4fd4dcb639b400fbd3d0ee5d272b5e49c2a8</RouterLink
        >
      </li>
    </ul>
  </div>
</template>

<style scoped>
ul {
  padding: 0 18px;
}
li {
  padding: 5px 0;
  font-size: 18px;
  line-height: 1.2;
  word-break: break-all;
}

li code {
  margin-left: 5px;
}

txn-hash-copy-icon {
  cursor: pointer;
  text-decoration: none;
}

i.bi-copy {
  font-style: normal !important;
  cursor: pointer;
}
</style>
