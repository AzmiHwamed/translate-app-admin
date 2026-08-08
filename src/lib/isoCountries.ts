import countriesLib from 'i18n-iso-countries';

// Converts the numeric ISO-3166-1 country codes used by the topojson world atlas
// (e.g. "840") into alpha-2 codes (e.g. "US") so we can match against the
// backend's `alpha2Code` field.
export function numericIsoToAlpha2(numericId: string): string | undefined {
  return countriesLib.numericToAlpha2(numericId) ?? undefined;
}
