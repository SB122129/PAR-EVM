import { Currency, CurrencyHelpers } from '@/utils/currency';

type PriceCacheEntry = { price: number; ts: number };

const CACHE_TTL_MS = 60_000;

export class CurrencyConversionService {
  private static priceCache: Map<string, PriceCacheEntry> = new Map();

  private static async getBtcPriceForCurrency(currencyCode: string): Promise<number> {
    const code = String(currencyCode || '').toUpperCase();
    const now = Date.now();
    const cached = CurrencyConversionService.priceCache.get(code);

    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return cached.price;
    }

    // CoinGecko simple endpoint is used on web as a lightweight fallback.
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${code.toLowerCase()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch BTC price');
    }

    const body = (await response.json()) as { bitcoin?: Record<string, number> };
    const price = body?.bitcoin?.[code.toLowerCase()];

    if (!Number.isFinite(price) || (price ?? 0) <= 0) {
      throw new Error('Invalid BTC price received');
    }

    const validPrice = Number(price);
    CurrencyConversionService.priceCache.set(code, { price: validPrice, ts: now });
    return validPrice;
  }

  static async convertAmount(amount: number, fromC: string, toC: string): Promise<number> {
    const fromCurrency = fromC.toUpperCase();
    const toCurrency = toC.toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (fromCurrency === toCurrency) return amount;

    if (fromCurrency === Currency.BTC && toCurrency === Currency.SATS) return amount * 100_000_000;
    if (fromCurrency === Currency.BTC && toCurrency === Currency.MSATS)
      return amount * 100_000_000_000;
    if (fromCurrency === Currency.SATS && toCurrency === Currency.BTC) return amount / 100_000_000;
    if (fromCurrency === Currency.SATS && toCurrency === Currency.MSATS) return amount * 1000;
    if (fromCurrency === Currency.MSATS && toCurrency === Currency.BTC)
      return amount / 100_000_000_000;
    if (fromCurrency === Currency.MSATS && toCurrency === Currency.SATS) return amount / 1000;

    if (fromCurrency === Currency.BTC && toCurrency !== Currency.SATS && toCurrency !== Currency.MSATS) {
      const btcPriceTo = await CurrencyConversionService.getBtcPriceForCurrency(toCurrency);
      return amount * btcPriceTo;
    }
    if (fromCurrency === Currency.SATS && toCurrency !== Currency.BTC && toCurrency !== Currency.MSATS) {
      const btcPriceTo = await CurrencyConversionService.getBtcPriceForCurrency(toCurrency);
      return (amount * btcPriceTo) / 100_000_000;
    }
    if (fromCurrency === Currency.MSATS && toCurrency !== Currency.BTC && toCurrency !== Currency.SATS) {
      const btcPriceTo = await CurrencyConversionService.getBtcPriceForCurrency(toCurrency);
      return (amount * btcPriceTo) / 100_000_000_000;
    }

    if (fromCurrency !== Currency.SATS && fromCurrency !== Currency.MSATS && toCurrency === Currency.BTC) {
      const btcPriceFrom = await CurrencyConversionService.getBtcPriceForCurrency(fromCurrency);
      return amount / btcPriceFrom;
    }
    if (fromCurrency !== Currency.BTC && fromCurrency !== Currency.MSATS && toCurrency === Currency.SATS) {
      const btcPriceFrom = await CurrencyConversionService.getBtcPriceForCurrency(fromCurrency);
      return (amount / btcPriceFrom) * 100_000_000;
    }
    if (fromCurrency !== Currency.BTC && fromCurrency !== Currency.SATS && toCurrency === Currency.MSATS) {
      const btcPriceFrom = await CurrencyConversionService.getBtcPriceForCurrency(fromCurrency);
      return (amount / btcPriceFrom) * 100_000_000_000;
    }

    const btcPriceFrom = await CurrencyConversionService.getBtcPriceForCurrency(fromCurrency);
    const btcPriceTo = await CurrencyConversionService.getBtcPriceForCurrency(toCurrency);
    return (amount * btcPriceTo) / btcPriceFrom;
  }

  static formatConvertedAmount(amount: number, currency: Currency): string {
    const symbol = CurrencyHelpers.getSymbol(currency);

    if (currency === Currency.SATS) {
      return `≈ ${Math.round(amount)} ${symbol}`;
    }

    if (currency === Currency.BTC) {
      const fixed = amount.toFixed(8);
      const trimmed = fixed.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
      return `≈ ${symbol}${trimmed}`;
    }

    return `≈ ${symbol}${amount.toFixed(2)}`;
  }

  static formatConvertedAmountWithFallback(
    amount: number | null | undefined,
    currency: Currency
  ): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return 'N/A';
    }
    return CurrencyConversionService.formatConvertedAmount(amount, currency);
  }
}
