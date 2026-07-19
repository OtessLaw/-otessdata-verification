/**
 * Normalizes phone numbers to standard 10-digit format (e.g., 0241234567).
 * Supports inputs like +233241234567, 233241234567, 0241234567, 241234567.
 * 
 * @param {string} input - The phone number to normalize
 * @returns {object} - { isValid: boolean, normalized: string | null, original: string }
 */
const normalizePhoneNumber = (input) => {
  if (typeof input !== 'string') {
    input = String(input || '');
  }

  const original = input.trim();
  
  // 1. Strip all non-digit characters
  let digits = original.replace(/\D/g, '');

  // 2. If it starts with 233, replace it with 0
  if (digits.startsWith('233')) {
    digits = '0' + digits.slice(3);
  }

  // 3. If it starts with 2 or 5 and is 9 digits, prepend 0
  if ((digits.startsWith('2') || digits.startsWith('5')) && digits.length === 9) {
    digits = '0' + digits;
  }

  // 4. Verify validity: 10 digits, starting with 0, and has a valid carrier prefix
  // Ghana carrier prefixes: 024, 054, 055, 059 (MTN), 020, 050 (Vodafone/Telecel), 027, 057, 026, 056 (AirtelTigo), 028 (Expresso)
  const isValidLength = digits.length === 10;
  const startsWithZero = digits.startsWith('0');
  
  // Checking typical prefixes 02X and 05X
  const validPrefix = /^(023|024|025|026|027|028|020|050|053|054|055|056|057|059)/.test(digits);
  
  const isValid = isValidLength && startsWithZero && validPrefix;

  return {
    isValid,
    normalized: isValid ? digits : null,
    original
  };
};

module.exports = {
  normalizePhoneNumber
};
