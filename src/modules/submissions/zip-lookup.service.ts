import { Injectable } from '@nestjs/common';

/** Response from api.zippopotam.us for a country's postal codes */
interface ZippopotamPlace {
  'place name': string;
  'state abbreviation'?: string;
  state?: string;
}

interface ZippopotamResponse {
  'post code': string;
  country: string;
  places: ZippopotamPlace[];
}

/** Country codes supported by Zippopotam (subset; add more as needed) */
const ZIPPO_COUNTRIES = [
  'us',
  'ca',
  'gb',
  'de',
  'fr',
  'in',
  'au',
  'mx',
  'br',
  'nl',
  'es',
  'it',
  'jp',
];

/** Nominatim (OSM) search result address parts */
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  county?: string;
  country?: string;
  postcode?: string;
}

interface NominatimResult {
  address?: NominatimAddress;
  display_name?: string;
}

@Injectable()
export class ZipLookupService {
  private readonly zippoBase = 'https://api.zippopotam.us';
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  /**
   * Resolve postal/zip code (any country) to city and state.
   * Tries Zippopotam for known countries first, then OSM Nominatim for global fallback.
   * Returns null if zip is empty or lookup fails.
   */
  async getCityState(
    zip: string,
  ): Promise<{ city: string; state: string } | null> {
    const trimmed = (zip || '').trim();
    if (!trimmed) return null;

    const fromZippo = await this.tryZippopotam(trimmed);
    if (fromZippo) return fromZippo;

    const fromNominatim = await this.tryNominatim(trimmed);
    if (fromNominatim) return fromNominatim;

    return null;
  }

  private async tryZippopotam(
    zip: string,
  ): Promise<{ city: string; state: string } | null> {
    for (const cc of ZIPPO_COUNTRIES) {
      try {
        const res = await fetch(
          `${this.zippoBase}/${cc}/${encodeURIComponent(zip)}`,
          { signal: AbortSignal.timeout(3000) },
        );
        if (!res.ok) continue;
        const data = (await res.json()) as ZippopotamResponse;
        const place = data?.places?.[0];
        if (!place) continue;
        const city = place['place name'] || 'N/A';
        const state = place['state abbreviation'] || place.state || 'N/A';
        return { city, state };
      } catch {
        continue;
      }
    }
    return null;
  }

  private async tryNominatim(
    postalCode: string,
  ): Promise<{ city: string; state: string } | null> {
    try {
      const params = new URLSearchParams({
        q: postalCode,
        format: 'json',
        addressdetails: '1',
        limit: '1',
      });
      const res = await fetch(`${this.nominatimUrl}?${params}`, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'TomerBlackburnEstimator/1.0 (contact form zip lookup)',
        },
      });
      if (!res.ok) return null;
      const results = (await res.json()) as NominatimResult[];
      const first = results?.[0];
      const addr = first?.address;
      if (!addr) return null;
      const city =
        addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? 'N/A';
      const state = addr.state ?? addr.county ?? 'N/A';
      return { city, state };
    } catch {
      return null;
    }
  }
}
