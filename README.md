# esprl

Explore Ethereum-like blockchain privately with your RPC URL.

- 🔒 No 3rd party services: only private RPC requests
- 💹 ETH and token balances, transaction history
- 💵 On-chain USD price conversion from oracles
- 📜 Integration with Sourcify for smart contract source code verification
- 🪶 100KB gzipped. 3 files: 1 html, 1 css, 1 js

![](https://github.com/user-attachments/assets/61bbfb4c-858c-4fee-8a25-ebb3871b8f70)

## Motivation

> How is this better than [Etherscan](https://etherscan.io)?

Etherscan and other other 3rd party block explorers collect and track user data. They create logs every time someone opens an address. Private explorers allow viewing information without logging.

> How is this better than [Otterscan](https://github.com/otterscan/otterscan)?

Otterscan does not support token balances or transfer history, which makes it limited in usefulness. ERC20 / ERC721 / ERC1155 tokens & NFTs are one of the most popular features of EVM-like blockchains. Besides that, Otterscan can only be used with one client while esplr strives to support all node types.

> Can I verify all network requests?

The explorer only makes requests to specified RPC URL. To audit this, check `src/App.vue`,
`handleConnect`. It uses [micro-ftch](https://github.com/paulmillr/micro-ftch) to
ensure no requests are done outside of the URL. You can add custom logging there.

> How are USD prices calculated?

Chainlink EVM contract provides onchain prices. No external services are used.

> Are ERC-20 tokens fully supported?

Yes. To view full token transfer history for an account, open tx Details tab.
First call can take up to 50 seconds because of [limitations of ETH nodes](#speed).
Second call would be cached and instant.

> Are ERC-721 NFTs fully supported?

Work in progress. They will be shown in UI in one of the next updates.

> Do you support local or remote Sourcify integration?

Both! Check out instructions below to set up your own Sourcify instance.

> Which frontend libraries are used?

[micro-eth-signer](https://github.com/paulmillr/micro-eth-signer) and
[micro-ftch](https://github.com/paulmillr/micro-ftch) empower data retrieval.
Vue.js is used as UI framework.

## Setup

To build the app and launch dev server, execute:

```sh
npm install && npm run dev
```

To build for production:

```sh
npm install && npm run build

# Output is now in `dist/`
# Example: serve `dist/` directory using built-in Python module
cd dist && python3 -m http.server --bind 127.0.0.1
```

The output is 3 files in `dist`: 1 html, 1 js, 1 css.

### Docker image

Continuously re-generated via GitHub Actions and published to Docker registry.

See [relevant Docker image URL](https://github.com/paulmillr/esplr/actions/workflows/docker.yml).

### Optional: RPC and Sourcify configuration

You can have the app automatically point to an RPC URL, SOURCIFY URL or IPFS GATEWAY URL provided via env variables: `VITE_RPC_URL`, `VITE_SOURCIFY_URL`, `VITE_IPFS_GATEWAY_URL`.

For example:
```sh
npm install && VITE_RPC_URL=<RPC_URL> VITE_SOURCIFY_URL=<SOURCIFY_URL> VITE_IPFS_GATEWAY_URL=<IPFS_GATEWAY_URL> npm run dev
```

## Running RPC backend

Esplr supports all node types.
User-ran [Erigon](https://github.com/erigontech/erigon) RPC node is adviced to get 100% of functionality.
[Reth](https://github.com/paradigmxyz/reth) may achieve feature parity soon. See [details](#reth-geth-nethermind-infura).

1. Download [Erigon](https://github.com/erigontech/erigon/releases) and start it:

```sh
erigon --datadir=/data/erigon --prune.mode='archive' --torrent.download.rate="100mb" --http --http.api=eth,erigon,web3,net,debug,trace,txpool,ots --ws --http.corsdomain='*'
```

2. Initial sync will take 8 hours for ETH mainnet on 100Mbps connection (slower ones can still be used). After that RPC will be running on port 8545.

The RPC will be running locally at 127.0.0.1:8545. There are two ways to make it available to outside internet:

* Redirect e.g. `ethnode.com` to `127.0.0.1:8545`
    - Can be achieved with NGINX: `proxy_pass http://127.0.0.1:8545`
    - You will probably need domain and SSL certificate. For example, if domain is `ethnode.com`, you will be able to specify its RPC.
    - It is suggested to use basic auth (`user:password@ethnode.com`).
* Or, use SSH tunneling to forward port 8545 to your local machine:
   `ssh -L 5678:127.0.0.1:8545 root@192.168.1.50` where 5678 is port on your local machine,
   `root@192.168.1.50` is user + hostname of Erigon3 server.

### Reth, Geth, Nethermind, Infura

Some features are not present outside of Erigon. The app uses archive node API / `trace_filter` extensively.

- Self-hosted Erigon 3 works with `prune.mode=archive` for 100% of features
- 3rd-party (infura / alchemy / quicknode) Erigon nodes have strict rate limits: tx history is not available
- Reth nodes do not have tx history because of lack of indexes. They indicated
  willingness to [fix the issue](https://github.com/paradigmxyz/reth/issues/4799)
- Geth, Nethermind do not have proper low-resource archive mode, so they are not supported for querying tx history

### Sourcify

esplr supports Sourcify [(sourcify.dev)](https://sourcify.dev) integration.
Sourcify allows to verify smart contract source code for eth. To set it up:

1. Download `manifest.json`
    - `curl -L -O https://repo-backup.sourcify.dev/manifest.json`
2. Download all files from `manifest.json`
    - To fetch chain-specific archives for eth mainnet (chain id 1):
    - `CHAIN_ID=1; jq -r '.files[].path' manifest.json | grep -E "(full|partial)_match\.${CHAIN_ID}\." | xargs -I {} curl -L -O https://repo-backup.sourcify.dev/{}`
    - Alternatively, there is 260GB+ archive for all chains:
    - `jq -r '.files[].path' manifest.json | xargs -I {} curl -L -O https://repo-backup.sourcify.dev/{}`
3. Extract files from archives:
    - `for file in *.tar.gz; do echo "Extracting $file..."; tar -xf "$file"; done`
4. Normalize names of addresses directories:
    - Copy script
    - `cp scripts/normalize_addresses.sh /path/to/repository`
    - Chain-specific normalization (takes 2+ hours):
    - `./normalize_addresses.sh --chains 1`
    - Normalization of all chains (takes 24+ hours):
    - `./normalize_addresses.sh`
5. Run any static file server with CORS enabled on the repository dir:
    - `npm install -g http-server@14.1.1`
    - `http-server /path/to/repository --cors -p 2015`
6. In esplr settings, specify address and port of the static file server

### Speed

Most requests are instant. Some requests, like seeing token transfer history, rely on
scanning whole blockchain from scratch. This can take 10-50 seconds.

To improve this, in the future, archive node developers can add
additional indexes into their software. They can also provide a new RPC method
to query history. Best thing one can do is to ask for this in their bug trackers:
[reth](https://github.com/paradigmxyz/reth/issues/4799), [erigon](https://github.com/erigontech/erigon/issues).

Addons, like [Trueblocks](https://trueblocks.io), can also speed things up.
While the goal of esplr is to use "pure" archive node, we would welcome support for
an easy trueblocks integration.

### Hardware requirements

An archive node will need 30Mbps connection & 2.5TB NVME SSD (TLC, not QLC).
Such new PC [can cost $570](https://pcpartpicker.com/list/PbHHrM) for 32GB RAM & 4-core CPU.
Here is another [$650 build](https://pcpartpicker.com/list/zKthBq) with 64GB RAM & 8-core CPU.

Similar server can be rented from providers like [Hetzner](https://www.hetzner.com) for $60/mo.
Make sure to [prohibit private IPs in firewall](https://ethereum.stackexchange.com/questions/6386/how-to-prevent-being-blacklisted-for-running-an-ethereum-client/13068).

Fully validating non-archive node can have <1TB storage requirements. Check out [Ress](https://www.paradigm.xyz/2025/03/stateless-reth-nodes) and [EIP-7870](https://eips.ethereum.org/EIPS/eip-7870).

## License

MIT License
