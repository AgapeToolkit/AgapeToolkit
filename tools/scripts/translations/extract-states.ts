#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { 
  loadCLDRSubdivisions, 
  loadLikelySubtags, 
  loadCLDRMetadata, 
  getAvailableLocales,
  groupSubdivisionsByCountry,
  parseSubdivisionCode
} from './utils/cldr.ts';
import type { CLDRLikelySubtag, CLDRMetadata } from './utils/cldr.ts';
import { 
  writeFile, 
  generateConstantExport, 
  generateAliasExport, 
  generateFileHeader,
  generateCountryDirectoryStructure,
  generateCountryLoaderFiles,
  generateCoverageReport as writeCoverageReport
} from './utils/file-writer.ts';

const WORKSPACE_ROOT = process.cwd();
const SOURCES_DIR = path.join(WORKSPACE_ROOT, 'sources');
const CLDR_DIR = path.join(SOURCES_DIR, 'cldr-json', 'cldr-json');
const STANDARDS_DIR = path.join(SOURCES_DIR, 'countries-states-cities-database', 'json');
const TRANSLATIONS_DIR = path.join(WORKSPACE_ROOT, 'libs', 'translations', 'src', 'lib', 'states');
const DEFINITIONS_OUT_DIR = path.join(WORKSPACE_ROOT, 'libs', 'translations', 'src', 'lib', 'definitions', 'states');

interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
}

interface State {
  id: number;
  name: string;
  country_code: string;
  iso2: string;
  iso3166_2: string;
}

interface CountryStateData {
  country: Country;
  states: State[];
}

interface TranslationData {
  country: string;
  locale: string;
  states: Record<string, string>;
}

interface CoverageData {
  totalCountries: number;
  countriesWithTranslations: number;
  countriesWithPartialTranslations: number;
  countriesWithoutTranslations: number;
  totalLocales: number;
  coverageByCountry: Map<string, { locales: string[]; missingLocales: string[] }>;
  missingCountries: string[];
}

/**
 * Loads country and state data from standards database
 */
function loadStandardsData(): CountryStateData[] {
  const countriesPath = path.join(STANDARDS_DIR, 'countries.json');
  const statesPath = path.join(STANDARDS_DIR, 'states.json');
  
  if (!fs.existsSync(countriesPath) || !fs.existsSync(statesPath)) {
    throw new Error('Standards database files not found. Run standards extraction first.');
  }
  
  const countries: Country[] = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
  const states: State[] = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
  
  // Group states by country
  const countryStatesMap = new Map<string, State[]>();
  states.forEach(state => {
    if (!countryStatesMap.has(state.country_code)) {
      countryStatesMap.set(state.country_code, []);
    }
    countryStatesMap.get(state.country_code)!.push(state);
  });
  
  // Create country-state data
  const result: CountryStateData[] = [];
  countries.forEach(country => {
    const countryStates = countryStatesMap.get(country.iso2) || [];
    if (countryStates.length > 0) {
      result.push({
        country,
        states: countryStates
      });
    }
  });
  
  return result;
}

/**
 * Determines native language for each country using likely subtags
 */
function determineNativeLanguages(
  countries: CountryStateData[], 
  likelySubtags: Map<string, CLDRLikelySubtag>,
  availableLocales: string[]
): Map<string, string> {
  const nativeLanguages = new Map<string, string>();
  
  // Common country to language mappings for major countries
  const commonMappings: Record<string, string> = {
    'US': 'en',
    'CA': 'en', 
    'MX': 'es',
    'GB': 'en',
    'DE': 'de',
    'FR': 'fr',
    'ES': 'es',
    'IT': 'it',
    'JP': 'ja',
    'CN': 'zh',
    'KR': 'ko',
    'BR': 'pt',
    'RU': 'ru',
    'IN': 'hi',
    'AU': 'en',
    'NL': 'nl',
    'SE': 'sv',
    'NO': 'no',
    'DK': 'da',
    'FI': 'fi',
    'PL': 'pl',
    'CZ': 'cs',
    'HU': 'hu',
    'RO': 'ro',
    'BG': 'bg',
    'HR': 'hr',
    'SK': 'sk',
    'SI': 'sl',
    'LT': 'lt',
    'LV': 'lv',
    'EE': 'et',
    'GR': 'el',
    'TR': 'tr',
    'AR': 'es',
    'CL': 'es',
    'CO': 'es',
    'PE': 'es',
    'VE': 'es',
    'UY': 'es',
    'PY': 'es',
    'BO': 'es',
    'EC': 'es',
    'CR': 'es',
    'PA': 'es',
    'GT': 'es',
    'HN': 'es',
    'SV': 'es',
    'NI': 'es',
    'CU': 'es',
    'DO': 'es',
    'PR': 'es',
    'EG': 'ar',
    'SA': 'ar',
    'AE': 'ar',
    'JO': 'ar',
    'LB': 'ar',
    'SY': 'ar',
    'IQ': 'ar',
    'KW': 'ar',
    'QA': 'ar',
    'BH': 'ar',
    'OM': 'ar',
    'YE': 'ar',
    'MA': 'ar',
    'TN': 'ar',
    'DZ': 'ar',
    'LY': 'ar',
    'SD': 'ar',
    'ZA': 'af',
    'NG': 'en',
    'KE': 'en',
    'GH': 'en',
    'UG': 'en',
    'TZ': 'en',
    'ZW': 'en',
    'BW': 'en',
    'ZM': 'en',
    'MW': 'en',
    'SZ': 'en',
    'LS': 'en',
    'MG': 'mg',
    'MU': 'en',
    'SC': 'en',
    'MV': 'dv',
    'LK': 'si',
    'BD': 'bn',
    'PK': 'ur',
    'AF': 'fa',
    'IR': 'fa',
    'TH': 'th',
    'VN': 'vi',
    'KH': 'km',
    'LA': 'lo',
    'MM': 'my',
    'MY': 'ms',
    'SG': 'en',
    'ID': 'id',
    'PH': 'en',
    'TW': 'zh',
    'MN': 'mn',
    'KZ': 'kk',
    'UZ': 'uz',
    'KG': 'ky',
    'TJ': 'tg',
    'TM': 'tk',
    'AZ': 'az',
    'GE': 'ka',
    'AM': 'hy',
    'IL': 'he',
    'CY': 'el',
    'MT': 'mt',
    'IS': 'is',
    'IE': 'en',
    'PT': 'pt',
    'LU': 'lb',
    'BE': 'nl',
    'CH': 'de',
    'AT': 'de',
    'LI': 'de',
    'MC': 'fr',
    'AD': 'ca',
    'SM': 'it',
    'VA': 'it',
    'AL': 'sq',
    'MK': 'mk',
    'RS': 'sr',
    'ME': 'sr',
    'BA': 'bs',
    'XK': 'sq',
    'UA': 'uk',
    'BY': 'be',
    'MD': 'ro',
    'FJ': 'en',
    'PG': 'en',
    'SB': 'en',
    'VU': 'en',
    'NC': 'fr',
    'PF': 'fr',
    'WF': 'fr',
    'KI': 'en',
    'TV': 'en',
    'NR': 'en',
    'TO': 'to',
    'WS': 'sm',
    'AS': 'en',
    'GU': 'en',
    'MP': 'en',
    'VI': 'en',
    'HT': 'ht',
    'JM': 'en',
    'BB': 'en',
    'AG': 'en',
    'DM': 'en',
    'GD': 'en',
    'KN': 'en',
    'LC': 'en',
    'VC': 'en',
    'TT': 'en',
    'GY': 'en',
    'SR': 'nl',
    'BZ': 'en',
    'BS': 'en'
  };
  
  countries.forEach(({ country }) => {
    const countryCode = country.iso2;
    
    // First try common mappings
    if (commonMappings[countryCode]) {
      const language = commonMappings[countryCode];
      if (availableLocales.includes(language)) {
        nativeLanguages.set(countryCode, language);
        return;
      }
    }
    
    // Fallback to likely subtags, but map to available locales
    for (const [key, subtag] of likelySubtags) {
      if (subtag.region === countryCode) {
        // Try to find a matching locale for this language
        const baseLanguage = subtag.language.split('-')[0]; // Get base language code
        if (availableLocales.includes(baseLanguage)) {
          nativeLanguages.set(countryCode, baseLanguage);
          return;
        }
      }
    }
    
    // Final fallback to English if available
    if (availableLocales.includes('en')) {
      nativeLanguages.set(countryCode, 'en');
    }
  });
  
  return nativeLanguages;
}

/**
 * Extracts translation data for all countries and locales
 */
function extractTranslationData(
  countries: CountryStateData[],
  locales: string[],
  nativeLanguages: Map<string, string>
): TranslationData[] {
  const translations: TranslationData[] = [];
  
  console.log(`Processing ${countries.length} countries across ${locales.length} locales...`);
  
  for (const { country, states } of countries) {
    const countryCode = country.iso2;
    const stateCodes = new Set(states.map(s => s.iso2));
    
    console.log(`Processing ${countryCode} (${country.name}) with ${states.length} states...`);
    
    for (const locale of locales) {
      const cldrData = loadCLDRSubdivisions(locale, CLDR_DIR);
      if (!cldrData) {
        continue;
      }
      
      const countryStates = new Map<string, string>();
      
      // Extract states for this country from CLDR
      for (const subdivision of cldrData.subdivisions) {
        const parsed = parseSubdivisionCode(subdivision.code);
        if (parsed && parsed.country === countryCode && stateCodes.has(parsed.state)) {
          countryStates.set(parsed.state, subdivision.name);
        }
      }
      
      if (countryStates.size > 0) {
        translations.push({
          country: countryCode,
          locale,
          states: Object.fromEntries(countryStates)
        });
      }
    }
  }
  
  return translations;
}

/**
 * Generates the main index file with all translations
 */
function generateMainIndexFile(
  translations: TranslationData[],
  nativeLanguages: Map<string, string>,
  metadata: CLDRMetadata
): void {
  const indexPath = path.join(TRANSLATIONS_DIR, 'index.ts');
  
  // Group translations by country
  const translationsByCountry = new Map<string, Map<string, Record<string, string>>>();
  
  translations.forEach(t => {
    if (!translationsByCountry.has(t.country)) {
      translationsByCountry.set(t.country, new Map());
    }
    translationsByCountry.get(t.country)!.set(t.locale, t.states);
  });
  
  let content = generateFileHeader({
    ...metadata,
    description: 'All subdivision (state/province) translations from Unicode CLDR'
  });
  
  // Sort countries for consistent output
  const sortedCountries = Array.from(translationsByCountry.entries())
    .sort(([a], [b]) => a.localeCompare(b));
  
  for (const [countryCode, localeTranslations] of sortedCountries) {
    const countryName = getCountryName(countryCode);
    const flag = getCountryFlag(countryCode);
    
    content += `\n// ${flag} ${countryName}\n`;
    
    // Generate locale constants
    const sortedLocales = Array.from(localeTranslations.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    for (const [locale, states] of sortedLocales) {
      const constantName = `STATES_${countryCode}_${locale.toUpperCase()}`;
      content += generateConstantExport(constantName, states) + '\n';
    }
    
    // Generate ROOT alias
    const nativeLanguage = nativeLanguages.get(countryCode);
    if (nativeLanguage && localeTranslations.has(nativeLanguage)) {
      const rootConstantName = `STATES_${countryCode}_ROOT`;
      const targetConstantName = `STATES_${countryCode}_${nativeLanguage.toUpperCase()}`;
      content += generateAliasExport(rootConstantName, targetConstantName) + '\n';
    }
  }
  
  writeFile(indexPath, content);
  console.log(`✅ Generated main index file: ${indexPath}`);
}

/**
 * Generates auto-loader files for each country/locale combination
 */
function generateAutoLoaderFiles(
  translations: TranslationData[],
  nativeLanguages: Map<string, string>
): void {
  // Group by country
  const translationsByCountry = new Map<string, TranslationData[]>();
  translations.forEach(t => {
    if (!translationsByCountry.has(t.country)) {
      translationsByCountry.set(t.country, []);
    }
    translationsByCountry.get(t.country)!.push(t);
  });
  
  console.log(`Generating auto-loader files for ${translationsByCountry.size} countries...`);
  
  for (const [countryCode, countryTranslations] of translationsByCountry) {
    const locales = countryTranslations.map(t => t.locale);
    const nativeLanguage = nativeLanguages.get(countryCode);
    
    console.log(`Processing ${countryCode}: ${locales.length} locales, native: ${nativeLanguage}`);
    
    // Generate auto-loader files for all available locales
    // Only generate index.ts if we have a ROOT constant
    const hasRootConstant = nativeLanguage && countryTranslations.some(t => t.locale === nativeLanguage);
    generateCountryDirectoryStructure(
      TRANSLATIONS_DIR,
      countryCode,
      locales,
      hasRootConstant ? nativeLanguage : null
    );
    console.log(`✅ Generated auto-loader files for ${countryCode}`);
  }
  
  console.log(`✅ Generated auto-loader files for ${translationsByCountry.size} countries`);
}

/**
 * Generates per-country definitions.ts files (one per country)
 */
function generateCountryDefinitionFiles(
  translations: TranslationData[],
  nativeLanguages: Map<string, string>,
  metadata: CLDRMetadata
): void {
  const byCountry = new Map<string, Map<string, Record<string, string>>>();
  for (const t of translations) {
    if (!byCountry.has(t.country)) byCountry.set(t.country, new Map());
    byCountry.get(t.country)!.set(t.locale, t.states);
  }

  // Ensure output directory exists
  if (!fs.existsSync(DEFINITIONS_OUT_DIR)) {
    fs.mkdirSync(DEFINITIONS_OUT_DIR, { recursive: true });
  }

  for (const [countryCode, localeMap] of byCountry) {

    const countryName = getCountryName(countryCode);
    const flag = getCountryFlag(countryCode);

    let content = `/**\n` +
      ` * ${flag} ${countryCode} - All subdivision translations from Unicode CLDR\n` +
      ` * CLDR Version: ${metadata.cldrVersion}\n` +
      ` * Unicode Version: ${metadata.unicodeVersion}\n` +
      ` */\n\n`;

    const sortedLocales = Array.from(localeMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [locale, states] of sortedLocales) {
      const constantName = `STATES_${countryCode}_${locale.toUpperCase()}`;
      content += generateConstantExport(constantName, states) + '\n';
    }

    const native = nativeLanguages.get(countryCode);
    if (native && localeMap.has(native)) {
      const rootName = `STATES_${countryCode}_ROOT`;
      const target = `STATES_${countryCode}_${native.toUpperCase()}`;
      content += generateAliasExport(rootName, target) + '\n';
    }

    const definitionsPath = path.join(DEFINITIONS_OUT_DIR, `${countryCode.toLowerCase()}.ts`);
    writeFile(definitionsPath, content);
    console.log(`✅ Generated definitions: ${definitionsPath}`);
  }
}

/**
 * Generates loader files for each country
 */
function generateLoaderFiles(
  translations: TranslationData[],
  nativeLanguages: Map<string, string>
): void {
  // Group by country
  const translationsByCountry = new Map<string, TranslationData[]>();
  translations.forEach(t => {
    if (!translationsByCountry.has(t.country)) {
      translationsByCountry.set(t.country, []);
    }
    translationsByCountry.get(t.country)!.push(t);
  });

  console.log(`Generating loader files for ${translationsByCountry.size} countries...`);

  for (const [countryCode, countryTranslations] of translationsByCountry) {
    const locales = countryTranslations.map(t => t.locale);
    const nativeLanguage = nativeLanguages.get(countryCode);
    
    console.log(`Processing ${countryCode}: ${locales.length} locales, native: ${nativeLanguage}`);
    
    // Determine root constant name (use native language or fallback to EN)
    const rootConstantName = nativeLanguage && countryTranslations.some(t => t.locale === nativeLanguage)
      ? `STATES_${countryCode}_ROOT`
      : `STATES_${countryCode}_EN`;
    
    // Generate loader files
    generateCountryLoaderFiles(
      TRANSLATIONS_DIR,
      countryCode,
      locales,
      rootConstantName
    );
    
    console.log(`✅ Generated loader files for ${countryCode}`);
  }
  
  console.log(`✅ Generated loader files for ${translationsByCountry.size} countries`);
}


/**
 * Generates coverage report
 */
function generateCoverageReport(
  countries: CountryStateData[],
  translations: TranslationData[],
  locales: string[],
  nativeLanguages: Map<string, string>
): CoverageData {
  const translationsByCountry = new Map<string, Set<string>>();
  
  translations.forEach(t => {
    if (!translationsByCountry.has(t.country)) {
      translationsByCountry.set(t.country, new Set());
    }
    translationsByCountry.get(t.country)!.add(t.locale);
  });
  
  const coverageByCountry = new Map<string, { locales: string[]; missingLocales: string[] }>();
  const missingCountries: string[] = [];
  
  countries.forEach(({ country }) => {
    const countryCode = country.iso2;
    const availableLocales = Array.from(translationsByCountry.get(countryCode) || []);
    const missingLocales = locales.filter(locale => !availableLocales.includes(locale));
    
    coverageByCountry.set(countryCode, {
      locales: availableLocales,
      missingLocales
    });
    
    if (availableLocales.length === 0) {
      missingCountries.push(countryCode);
    }
  });
  
  const countriesWithTranslations = Array.from(coverageByCountry.values())
    .filter(data => data.missingLocales.length === 0).length;
  
  const countriesWithPartialTranslations = Array.from(coverageByCountry.values())
    .filter(data => data.missingLocales.length > 0 && data.locales.length > 0).length;
  
  const coverageData: CoverageData = {
    totalCountries: countries.length,
    countriesWithTranslations,
    countriesWithPartialTranslations,
    countriesWithoutTranslations: missingCountries.length,
    totalLocales: locales.length,
    coverageByCountry,
    missingCountries
  };
  
  const reportPath = path.join(WORKSPACE_ROOT, 'libs', 'translations', 'COVERAGE.md');
  writeCoverageReport(reportPath, coverageData);
  
  return coverageData;
}

/**
 * Helper function to get country name (simplified)
 */
function getCountryName(countryCode: string): string {
  // This is a simplified mapping - in a real implementation you'd load from standards
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'MX': 'Mexico',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'AU': 'Australia',
    'BR': 'Brazil',
    'IN': 'India',
    'CN': 'China',
    'RU': 'Russia'
  };
  
  return countryNames[countryCode] || countryCode;
}

/**
 * Helper function to get country flag emoji
 */
function getCountryFlag(countryCode: string): string {
  // Convert country code to flag emoji
  const codePoints = countryCode.toUpperCase().split('').map(char => 
    127397 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

/**
 * Main function
 */
function main(): void {
  try {
    console.log('🚀 Starting translation extraction...');
    
    // Verify CLDR data exists
    if (!fs.existsSync(CLDR_DIR)) {
      console.error('❌ CLDR data not found. Run fetch-cldr.ts first.');
      process.exit(1);
    }
    
    // Load data
    console.log('📊 Loading standards data...');
    const countries = loadStandardsData();
    console.log(`Found ${countries.length} countries with states`);
    
    console.log('📊 Loading CLDR data...');
    const locales = getAvailableLocales(CLDR_DIR);
    const likelySubtags = loadLikelySubtags(CLDR_DIR);
    const metadata = loadCLDRMetadata(CLDR_DIR);
    
    console.log(`Found ${locales.length} locales in CLDR`);
    console.log(`CLDR Version: ${metadata.cldrVersion}`);
    
    // Determine native languages
    console.log('🌍 Determining native languages...');
    const nativeLanguages = determineNativeLanguages(countries, likelySubtags, locales);
    console.log(`Determined native languages for ${nativeLanguages.size} countries`);
    
    // Extract translations
    console.log('🔄 Extracting translations...');
    const translations = extractTranslationData(countries, locales, nativeLanguages);
    console.log(`Extracted ${translations.length} translation sets`);
    
    // Generate files
    console.log('📝 Generating files...');
    generateMainIndexFile(translations, nativeLanguages, metadata);
    generateAutoLoaderFiles(translations, nativeLanguages);
    generateCountryDefinitionFiles(translations, nativeLanguages, metadata);
    generateLoaderFiles(translations, nativeLanguages);
    
    // Generate coverage report
    console.log('📊 Generating coverage report...');
    const coverage = generateCoverageReport(countries, translations, locales, nativeLanguages);
    
    console.log('✅ Translation extraction completed successfully!');
    console.log(`📈 Coverage: ${coverage.countriesWithTranslations}/${coverage.totalCountries} countries have complete translations`);
    
  } catch (error) {
    console.error('❌ Error during extraction:', error);
    process.exit(1);
  }
}

// Invoke main in ESM context
main();
