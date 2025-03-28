# esprl

Explore Ethereum-like blockchain privately with your RPC URL.

- 🔒 No 3rd party services: only private RPC requests
- 💹 ETH and token balances, transaction history
- 💵 On-chain USD price conversion from oracles

## Motivation

> How is this better than [Etherscan](https://etherscan.io)?

Etherscan and other other 3rd party block explorers collect and track user data. They create logs every time someone opens an address. Private explorers allow viewing information without logging.

> How is this better than [Otterscan](https://github.com/otterscan/otterscan)?

Otterscan is local, but it does not support token balances or transfer history, which makes it limited in usefulness. ERC20 / ERC721 / ERC1155 tokens & NFTs are one of the most popular features of EVM-like blockchains.

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

Almost. They will be shown in UI in one of the next updates.

> Which frontend libraries are used?

[micro-eth-signer](https://github.com/paulmillr/micro-eth-signer) and
[micro-ftch](https://github.com/paulmillr/micro-ftch) empower data retrieval.
Vue.js is used as UI framework.

## Setup

To build the app, execute:

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

## RPC requirements

Esprl currently only supports user-ran [Erigon](https://github.com/erigontech/erigon) RPC nodes and may support [Reth](https://github.com/paradigmxyz/reth) soon. See [Hardware reqs](#hardware-requirements).

Download [Erigon 3 binary](https://github.com/erigontech/erigon/releases) / source code and start it:

```sh
erigon --datadir=/data/erigon --prune.mode='archive' --torrent.download.rate="100mb" --http --http.api=eth,erigon,web3,net,debug,trace,txpool,ots --ws --http.corsdomain='*'
```

Initial sync will take 8 hours for ETH mainnet on 100Mbps connection (slower ones can still be used). After that RPC will be ready.
By default, RPC runs on port 8545. If computer which runs it is not the same one
where RPC is accessed from, you will need to expose the port.

### Making app available on the internet

There are two ways to make app available:

1. Install NGINX, do `proxy_pass http://127.0.0.1:8545`. You will probably need domain and SSL certificate. For example, if domain is `ethnode.com`, you will be able to specify its RPC.
  It is suggested to use basic auth (user:password@ethnode.com).
2. SSH tunneling: use SSH connection to forward port 8545 to your local machine:
   `ssh -L 5678:127.0.0.1:8545 root@192.168.1.50` where 5678 is port on your local machine,
   `root@192.168.1.50` is user + hostname of Erigon3 server.

### Geth, Reth, Infura

Why aren't other RPCs supported? The app uses archive node API / `trace_filter` extensively:

- Erigon 3 works properly with `prune.mode=archive`
- Geth, Nethermind do not have proper archive mode, so they are not supported
- Reth is not supported, because it doesn't have token indexes like Erigon. They indicated
  willingness to fix the issue: see [#4799](https://github.com/paradigmxyz/reth/issues/4799)
- 3rd party nodes (infura / alchemy / quicknode) are not supported: they limit
  trace_filter API massively even if Erigon backend is selected.

### Speed

Most requests are instant. Some requests, like seeing token transfer history, rely on
scanning whole blockchain from scratch. This can take 10-60 seconds.

To improve this, in the future, archive node developers can add
additional indexes into their software. They can also provide a new RPC method
to query history. Best thing one can do is to ask for this in their bug trackers:
[1](https://github.com/erigontech/erigon/issues), [2](https://github.com/paradigmxyz/reth/issues/4799).

Addons, like [Trueblocks](https://trueblocks.io), can also speed things up.
While the goal of esplr is to use "pure" archive node, we would welcome support for
an easy trueblocks integration.

### Hardware requirements

An archive node will need 32GB ram, 2.5TB NVME SSD, 4-core CPU and 30Mbps connection.
A similar new PC can be cost ~$500.

Such server can be rented from providers like [Hetzner](https://www.hetzner.com) for ~$40 per month.
Make sure to [prohibit private IPs in firewall](https://ethereum.stackexchange.com/questions/6386/how-to-prevent-being-blacklisted-for-running-an-ethereum-client/13068).

Macs are also supported.
Fully validating non-archive node has much smaller storage requirements (<1TB).

## License

MIT License
