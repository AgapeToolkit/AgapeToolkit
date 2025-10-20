import * as fs from 'fs';
import * as path from 'path';

export interface CLDRSubdivision {
  code: string;
  name: string;
}

export interface CLDRSubdivisionData {
  locale: string;
  subdivisions: CLDRSubdivision[];
}

export interface CLDRLikelySubtag {
  language: string;
  region: string;
  script: string;
}

export interface CLDRMetadata {
  cldrVersion: string;
  unicodeVersion: string;
  generationTime: string;
}

/**
 * Loads CLDR subdivision data for a specific locale
 */
export function loadCLDRSubdivisions(locale: string, cldrPath: string): CLDRSubdivisionData | null {
  const subdivisionPath = path.join(cldrPath, 'cldr-subdivisions-full', 'subdivisions', locale, `${locale}.json`);
  
  if (!fs.existsSync(subdivisionPath)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(subdivisionPath, 'utf8'));
    const subdivisions: CLDRSubdivision[] = [];

    if (data.subdivisions?.localeDisplayNames?.subdivisions) {
      for (const [code, name] of Object.entries(data.subdivisions.localeDisplayNames.subdivisions)) {
        if (typeof name === 'string') {
          subdivisions.push({ code, name });
        }
      }
    }

    return {
      locale,
      subdivisions
    };
  } catch (error) {
    console.warn(`Failed to load CLDR subdivisions for locale ${locale}:`, error);
    return null;
  }
}

/**
 * Loads likely subtags data from CLDR
 */
export function loadLikelySubtags(cldrPath: string): Map<string, CLDRLikelySubtag> {
  const likelySubtagsPath = path.join(cldrPath, 'cldr-core', 'supplemental', 'likelySubtags.json');
  
  if (!fs.existsSync(likelySubtagsPath)) {
    throw new Error(`Likely subtags file not found: ${likelySubtagsPath}`);
  }

  const data = JSON.parse(fs.readFileSync(likelySubtagsPath, 'utf8'));
  const likelySubtags = new Map<string, CLDRLikelySubtag>();

  if (data.supplemental?.likelySubtags) {
    for (const [key, value] of Object.entries(data.supplemental.likelySubtags)) {
      if (typeof value === 'string') {
        // Parse format like "en-Latn-US" into components
        const parts = value.split('-');
        if (parts.length >= 3) {
          likelySubtags.set(key, {
            language: parts[0],
            region: parts[2],
            script: parts[1]
          });
        }
      }
    }
  }

  return likelySubtags;
}

/**
 * Extracts CLDR metadata (version info)
 */
export function loadCLDRMetadata(cldrPath: string): CLDRMetadata {
  const likelySubtagsPath = path.join(cldrPath, 'cldr-core', 'supplemental', 'likelySubtags.json');
  
  if (!fs.existsSync(likelySubtagsPath)) {
    throw new Error(`CLDR metadata file not found: ${likelySubtagsPath}`);
  }

  const data = JSON.parse(fs.readFileSync(likelySubtagsPath, 'utf8'));
  
  return {
    cldrVersion: data.supplemental?.version?._cldrVersion || 'unknown',
    unicodeVersion: data.supplemental?.version?._unicodeVersion || 'unknown',
    generationTime: new Date().toISOString()
  };
}

/**
 * Gets all available locales from CLDR subdivisions directory
 */
export function getAvailableLocales(cldrPath: string): string[] {
  const subdivisionsDir = path.join(cldrPath, 'cldr-subdivisions-full', 'subdivisions');
  
  if (!fs.existsSync(subdivisionsDir)) {
    return [];
  }

  return fs.readdirSync(subdivisionsDir)
    .filter(item => {
      const itemPath = path.join(subdivisionsDir, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort();
}

/**
 * Parses subdivision code to extract country and state codes
 * Example: "usnc" -> { country: "US", state: "NC" }
 */
export function parseSubdivisionCode(code: string): { country: string; state: string } | null {
  // CLDR subdivision codes are lowercase country code + state code
  // We need to identify where the country code ends and state code begins
  
  // Common country code lengths: 2 chars (most common), 3 chars (rare)
  // Try 2-char country first, then 3-char
  for (let countryLength = 2; countryLength <= 3; countryLength++) {
    if (code.length > countryLength) {
      const country = code.substring(0, countryLength).toUpperCase();
      const state = code.substring(countryLength).toUpperCase();
      
      // Basic validation: country should be 2-3 chars, state should be 1-4 chars
      if (country.length >= 2 && state.length >= 1 && state.length <= 4) {
        return { country, state };
      }
    }
  }
  
  return null;
}

/**
 * Groups subdivisions by country
 */
export function groupSubdivisionsByCountry(subdivisions: CLDRSubdivision[]): Map<string, Map<string, string>> {
  const grouped = new Map<string, Map<string, string>>();
  
  for (const subdivision of subdivisions) {
    const parsed = parseSubdivisionCode(subdivision.code);
    if (parsed) {
      if (!grouped.has(parsed.country)) {
        grouped.set(parsed.country, new Map());
      }
      grouped.get(parsed.country)!.set(parsed.state, subdivision.name);
    }
  }
  
  return grouped;
}
