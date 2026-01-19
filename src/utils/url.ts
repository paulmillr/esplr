import { DEFAULT_IPFS_GATEWAY_URL } from '@/config';

export function addProtocol(url: string) {
  if (url.startsWith('127.0.0.1') || url.startsWith('localhost')) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

export function hasValidProtocol(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'localhost:'
    );
  } catch {
    return true;
  }
}

export function hasProtocol(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'localhost:') {
      return false;
    }
    return parsedUrl.protocol.length > 0;
  } catch {
    return false; // Invalid URL
  }
}

export function ipfsResolveWithFallback(url: string, resolveUrl = '') {
  if (url.startsWith('ipfs://')) {
    const resolve = resolveUrl.length ? resolveUrl : DEFAULT_IPFS_GATEWAY_URL;
    return url.replace('ipfs://', resolve);
  }
  return url;
}

export function ipfsResolve(url: string, resolveUrl: string) {
  if (url.startsWith('ipfs://') && resolveUrl) {
    return url.replace('ipfs://', resolveUrl);
  }
  return '';
}

export function ipfsSettingsResolve(
  url: string,
  showHttps: boolean,
  showIpfs: boolean,
  gatewayUrl: string
) {
  if (showHttps && !showIpfs) {
    return ipfsResolveWithFallback(url);
  } else if (showHttps && showIpfs) {
    return ipfsResolveWithFallback(url, gatewayUrl);
  } else if (!showHttps && showIpfs) {
    return ipfsResolve(url, gatewayUrl);
  }
  return '';
}

export function normalizeIpfsUrl(url: string) {
  let u = url.trim();
  if (!u.length) return '';
  if (!hasValidProtocol(u)) return '';
  if (!hasProtocol(u)) u = addProtocol(u);
  u = u.replace(/\/+$/, '');
  if (!/\/ipfs\/?$/.test(u)) u = `${u}/ipfs/`;
  if (!/\/$/.test(u)) u = `${u}/`;
  return u;
}
