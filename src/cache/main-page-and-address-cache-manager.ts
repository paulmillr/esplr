import { MainPageCache } from '@/cache/main-page/main-page';
import { AddressCache } from '@/cache/address/address';

export default class MainPageAndAddressCacheManager {
  private static instance: MainPageAndAddressCacheManager;

  private constructor() {}

  static getInstance(): MainPageAndAddressCacheManager {
    if (!MainPageAndAddressCacheManager.instance) {
      MainPageAndAddressCacheManager.instance = new MainPageAndAddressCacheManager();
    }
    return MainPageAndAddressCacheManager.instance;
  }

  public static getStrategyType(): string {
    const mainPageType = MainPageCache.getStrategyType();
    const addressType = AddressCache.getStrategyType();

    if (mainPageType !== addressType) {
      this.useMemoryStorage();
      localStorage.clear();
      throw new Error(
        'Address cache and main page cache have different storage types. This may cause issues.'
      );
    }

    return mainPageType;
  }

  public static useLocalStorage(): void {
    MainPageCache.useLocalStorage();
    AddressCache.useLocalStorage();
  }

  public static useMemoryStorage(): void {
    MainPageCache.useMemoryStorage();
    AddressCache.useMemoryStorage();
  }
}
