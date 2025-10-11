import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = process.cwd();
const STATES_DIR = path.join(WORKSPACE_ROOT, 'libs', 'standards', 'src', 'lib', 'codes', 'states');
const DEFINITIONS_FILE = path.join(STATES_DIR, 'definitions.ts');

console.log('Generating individual country test files...');

// Read the definitions file to get all countries
const definitionsContent = fs.readFileSync(DEFINITIONS_FILE, 'utf8');

// Extract country codes from the definitions file
const countryMatches = definitionsContent.match(/export const ([A-Z]{2}) = \[/g);
if (!countryMatches) {
  throw new Error('Could not find country definitions in definitions.ts');
}

const countries = countryMatches.map(match => {
  const countryCode = match.match(/export const ([A-Z]{2}) = \[/)?.[1];
  return countryCode;
}).filter(Boolean) as string[];

console.log(`Found ${countries.length} countries with state codes`);

// Generate test file for each country
countries.forEach(countryCode => {
  const fileName = `${countryCode.toLowerCase()}.spec.ts`;
  const filePath = path.join(STATES_DIR, fileName);
  
  // Skip if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${fileName} (already exists)`);
    return;
  }

  const testContent = `import { StateCodes } from '../state-codes';

describe('${countryCode} State Codes', () => {
  beforeAll(async () => {
    // Import the ${countryCode} state codes module to register them
    await import('./${countryCode.toLowerCase()}');
  });

  beforeEach(() => {
    // Clear instances cache to ensure fresh instances
    (StateCodes as any).instances.clear();
  });

  describe('registration', () => {
    it('should register ${countryCode} state codes', () => {
      const instance = StateCodes.for({ country: '${countryCode}' });
      expect(instance.countryCode).toBe('${countryCode}');
      expect(instance.all.length).toBeGreaterThan(0);
    });

    it('should have state codes for ${countryCode}', () => {
      const instance = StateCodes.for({ country: '${countryCode}' });
      const states = instance.all;
      
      // Verify we have some state codes
      expect(states.length).toBeGreaterThan(0);
      expect(Array.isArray(states)).toBe(true);
    });
  });

  describe('validation', () => {
    let instance: StateCodes;

    beforeEach(() => {
      instance = StateCodes.for({ country: '${countryCode}' });
    });

    it('should validate ${countryCode} state codes', () => {
      const states = instance.all;
      
      // Test first few state codes
      if (states.length > 0) {
        expect(instance.isValid(states[0])).toBe(true);
      }
      if (states.length > 1) {
        expect(instance.isValid(states[1])).toBe(true);
      }
      if (states.length > 2) {
        expect(instance.isValid(states[2])).toBe(true);
      }
    });

    it('should handle case sensitivity', () => {
      const states = instance.all;
      
      if (states.length > 0) {
        const firstState = states[0];
        expect(instance.isValid(firstState.toLowerCase())).toBe(true);
        expect(instance.isValid(firstState.toUpperCase())).toBe(true);
        expect(instance.isValid(firstState)).toBe(true);
      }
    });

    it('should reject invalid state codes', () => {
      expect(instance.isValid('XX')).toBe(false);
      expect(instance.isValid('ZZ')).toBe(false);
      expect(instance.isValid('INVALID')).toBe(false);
      expect(instance.isValid('')).toBe(false);
    });

    it('should reject state codes from other countries', () => {
      // Test some common state codes from other countries
      const otherCountryCodes = ['CA', 'NY', 'TX', 'ON', 'QC', 'NSW', 'VIC', 'BY', 'NW', 'IDF', 'ARA'];
      
      otherCountryCodes.forEach(code => {
        // Only test if this code is not actually valid for this country
        if (!instance.all.includes(code)) {
          expect(instance.isValid(code)).toBe(false);
        }
      });
    });
  });

  describe('data integrity', () => {
    it('should have unique state codes', () => {
      const instance = StateCodes.for({ country: '${countryCode}' });
      const states = instance.all;
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(states.length);
    });

    it('should have proper state code format', () => {
      const instance = StateCodes.for({ country: '${countryCode}' });
      const states = instance.all;
      
      states.forEach(state => {
        expect(typeof state).toBe('string');
        expect(state.length).toBeGreaterThan(0);
        expect(state.length).toBeLessThanOrEqual(10); // Reasonable upper limit
        // State codes can be letters, numbers, or combinations
        expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });

    it('should have frozen state codes array', () => {
      const instance = StateCodes.for({ country: '${countryCode}' });
      expect(Object.isFrozen(instance.all)).toBe(true);
    });
  });

  describe('performance', () => {
    it('should access state codes efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const instance = StateCodes.for({ country: '${countryCode}' });
        const states = instance.all;
        if (states.length > 0) {
          instance.isValid(states[0]);
        }
      }
      
      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should be reasonably fast
    });
  });
});
`;

  fs.writeFileSync(filePath, testContent);
  console.log(`Generated ${fileName}`);
});

console.log(`Generated test files for ${countries.length} countries`);
console.log('Individual country test files generation completed!');
