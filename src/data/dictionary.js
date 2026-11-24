/**
 * Hece Zinciri PRO - Türkçe Hece Sözlüğü, Kurtarıcı Algoritma ve Akıllı İpucu Motoru
 *
 * Kesin Türkçe Heceleme Kuralları:
 * 1. Her hecede TAM OLARAK 1 ünlü harf (A, E, I, İ, O, Ö, U, Ü) bulunur.
 * 2. Hiçbir Türkçe hece iki ünsüzle başlayamaz (CCV, CCVC yasak -> ÇİZ-Gİ, DÖN-MÜŞ, BAH-ÇE, Kİ-TAP-LIK).
 * 3. Birleşik kelimede iki ünlü arasında tek ünsüz varsa sağdaki heceye, iki ünsüz varsa biri soldaki
 *    biri sağdaki heceye, üç ünsüz varsa ikisi soldaki biri sağdaki heceye ayrılır (otomatik doğrulanır).
 * 4. Oyun akıcılığı için heceler 2 veya 3-4 harfli yüksek frekanslı hecelerden (KA, RA, MA, SA, BA, LA, TA,
 *    PA, LEM, LIK, LİK, LAR, LER vb.) seçilmiş; tek harfli heceler sıfırlanmıştır.
 */

const VOWELS_SET = new Set(['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);
const TR_LETTERS_REGEX = /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/;

import { TDK_RAW_WORDS } from './tdkWords.js';

// 59.328+ Kelimelik Tam TDK Sözlük Kümesi (O(1) Anlık Doğrulama)
export const TDK_WORD_LIST = TDK_RAW_WORDS ? TDK_RAW_WORDS.split(' ') : [];
export const TDK_WORD_SET = new Set(TDK_WORD_LIST);

export function isVowel(ch) {
  return VOWELS_SET.has(ch);
}

/**
 * Bir Türkçe kelimeyi (büyük harf) resmi Türkçe heceleme algoritmasıyla hecelerine ayırır (2..5 hece).
 */
export function syllabifyTurkishWord(wordInput, maxSyllables = 5) {
  const word = String(wordInput || '').trim().toLocaleUpperCase('tr-TR');
  if (!word || !TR_LETTERS_REGEX.test(word)) return null;

  const vowelIndices = [];
  for (let i = 0; i < word.length; i++) {
    if (isVowel(word[i])) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length < 2 || vowelIndices.length > maxSyllables) return null;
  if (vowelIndices[0] > 1) return null;

  const splitPoints = [0];

  for (let v = 0; v < vowelIndices.length - 1; v++) {
    const v1 = vowelIndices[v];
    const v2 = vowelIndices[v + 1];
    const consonantsBetween = v2 - v1 - 1;

    if (consonantsBetween === 0) {
      splitPoints.push(v2);
    } else if (consonantsBetween === 1) {
      splitPoints.push(v1 + 1);
    } else if (consonantsBetween === 2) {
      splitPoints.push(v1 + 2);
    } else if (consonantsBetween === 3) {
      splitPoints.push(v1 + 3);
    } else {
      return null;
    }
  }

  splitPoints.push(word.length);

  const syllables = [];
  for (let i = 0; i < splitPoints.length - 1; i++) {
    syllables.push(word.slice(splitPoints[i], splitPoints[i + 1]));
  }

  return syllables;
}

/**
 * Tek bir hecenin kusursuzluğunu doğrular.
 */
export function isValidTurkishSyllable(syl, allowSingleVowel = false) {
  if (!syl || typeof syl !== 'string') return false;
  if (!TR_LETTERS_REGEX.test(syl)) return false;
  const minLen = allowSingleVowel ? 1 : 2;
  if (syl.length < minLen || syl.length > 4) return false;

  let vowelCount = 0;
  for (let i = 0; i < syl.length; i++) {
    if (isVowel(syl[i])) vowelCount++;
  }
  if (vowelCount !== 1) return false;

  if (!isVowel(syl[0])) {
    if (syl.length < 2 || !isVowel(syl[1])) {
      return false;
    }
  }

  return true;
}

/**
 * Bir hece dizisinin hem her hecesinin geçerli olduğunu hem de birleştiğinde
 * Türkçe heceleme algoritmasıyla %100 birebir aynı sonucu verdiğini doğrular.
 */
export function isValidSyllableEntry(syllables, allowSingleVowel = false) {
  if (!Array.isArray(syllables) || (syllables.length !== 2 && syllables.length !== 3)) {
    return false;
  }
  if (!syllables.every((s) => isValidTurkishSyllable(s, allowSingleVowel))) {
    return false;
  }
  const joined = syllables.join('');
  const expected = syllabifyTurkishWord(joined);
  if (!expected || expected.length !== syllables.length) return false;
  return expected.every((s, idx) => s === syllables[idx]);
}

// Yüksek frekanslı, birbiriyle bolca kesişen, %100 doğru hecelenmiş günlük Türkçe kelimeler
export const RAW_DICTIONARY = [
  // --- KA / RA / MA / SA / BA / LA / TA / PA / YA / DA / NA / CA / HA / ZA (2 Heceli) ---
  ['KA', 'RA'],
  ['PA', 'RA'],
  ['YA', 'RA'],
  ['SA', 'RA'],
  ['MA', 'SA'],
  ['KA', 'SA'],
  ['YA', 'SA'],
  ['TA', 'SA'],
  ['KA', 'PI'],
  ['YA', 'PI'],
  ['TA', 'PI'],
  ['SA', 'PI'],
  ['KA', 'LEM'],
  ['BA', 'BA'],
  ['KA', 'BA'],
  ['SA', 'BA'],
  ['YA', 'BA'],
  ['ÇA', 'BA'],
  ['SO', 'BA'],
  ['RO', 'BA'],
  ['KA', 'BAK'],
  ['TA', 'BAK'],
  ['BA', 'CAK'],
  ['KA', 'CAK'],
  ['SA', 'CAK'],
  ['BU', 'CAK'],
  ['KU', 'CAK'],
  ['SI', 'CAK'],
  ['KA', 'ZAK'],
  ['TU', 'ZAK'],
  ['KI', 'ZAK'],
  ['KA', 'PAK'],
  ['SA', 'PAK'],
  ['ÇA', 'PAK'],
  ['TO', 'PAK'],
  ['KA', 'NAT'],
  ['SA', 'NAT'],
  ['BA', 'YAT'],
  ['HA', 'YAT'],
  ['KA', 'YA'],
  ['MA', 'YA'],
  ['BO', 'YA'],
  ['DO', 'YA'],
  ['KA', 'FA'],
  ['SA', 'FA'],
  ['VE', 'FA'],
  ['CE', 'FA'],
  ['Şİ', 'FA'],
  ['SE', 'FA'],
  ['KA', 'LE'],
  ['LA', 'LE'],
  ['HA', 'LE'],
  ['Çİ', 'LE'],
  ['Hİ', 'LE'],
  ['Bİ', 'LE'],
  ['Fİ', 'LE'],
  ['VA', 'Dİ'],
  ['KA', 'DIN'],
  ['YA', 'KIN'],
  ['SA', 'KIN'],
  ['TA', 'KIN'],
  ['KA', 'LIN'],
  ['YA', 'LIN'],
  ['KA', 'RIN'],
  ['YA', 'RIN'],
  ['SA', 'RIN'],
  ['FI', 'RIN'],
  ['KA', 'ŞIK'],
  ['BE', 'ŞİK'],
  ['KA', 'YIK'],
  ['BI', 'YIK'],
  ['KA', 'YIP'],
  ['KA', 'ZAN'],
  ['YA', 'ZAN'],
  ['SA', 'ZAN'],
  ['BO', 'ZAN'],
  ['KA', 'BUK'],
  ['ÇA', 'BUK'],
  ['PA', 'MUK'],
  ['YA', 'MUK'],
  ['SO', 'ĞUK'],
  ['KO', 'VUK'],
  ['TA', 'VUK'],
  ['KA', 'VUN'],
  ['SA', 'VUN'],
  ['KO', 'YUN'],
  ['BO', 'YUN'],
  ['SO', 'YUN'],
  ['KA', 'VAK'],
  ['SA', 'VAK'],
  ['ŞA', 'FAK'],
  ['KA', 'FES'],
  ['NE', 'FES'],
  ['HE', 'VES'],
  ['KA', 'SET'],
  ['PO', 'ŞET'],
  ['RO', 'KET'],
  ['PA', 'KET'],
  ['CE', 'KET'],
  ['MA', 'KET'],
  ['RA', 'KET'],
  ['BU', 'KET'],
  ['SE', 'PET'],
  ['SA', 'BUN'],
  ['YO', 'SUN'],
  ['KO', 'ŞUN'],
  ['TO', 'RUN'],
  ['SO', 'RUN'],
  ['BU', 'RUN'],

  // --- MA / SA / LA / TA / PA / BA / YA / DA (2 Heceli) ---
  ['MA', 'Vİ'],
  ['CA', 'Mİ'],
  ['GA', 'Zİ'],
  ['TA', 'Zİ'],
  ['RA', 'Zİ'],
  ['MA', 'Zİ'],
  ['MA', 'KAS'],
  ['TA', 'KAS'],
  ['MA', 'SAL'],
  ['ÇA', 'TAL'],
  ['SA', 'KAL'],
  ['ÇA', 'KAL'],
  ['BA', 'KAL'],
  ['KA', 'NAL'],
  ['SA', 'NAL'],
  ['KU', 'RAL'],
  ['MA', 'RAL'],
  ['KA', 'RAR'],
  ['ZA', 'RAR'],
  ['YA', 'RAR'],
  ['SA', 'RAR'],
  ['MA', 'DEN'],
  ['BA', 'DEM'],
  ['KA', 'DEM'],
  ['MA', 'DEM'],
  ['NE', 'DEN'],
  ['BE', 'DEN'],
  ['GE', 'LEN'],
  ['BÖ', 'LEN'],
  ['ŞÖ', 'LEN'],
  ['MA', 'RUL'],
  ['KO', 'ŞUL'],
  ['BA', 'VUL'],
  ['DA', 'VUL'],
  ['MA', 'NA'],
  ['DA', 'NA'],
  ['KA', 'NA'],
  ['SA', 'NA'],
  ['BA', 'NA'],
  ['YA', 'NA'],
  ['TA', 'NE'],
  ['NA', 'NE'],
  ['HA', 'NE'],
  ['ÇE', 'NE'],
  ['SE', 'NE'],
  ['GE', 'NE'],
  ['Yİ', 'NE'],
  ['SAH', 'NE'],
  ['TAH', 'TA'],
  ['SAH', 'TE'],

  // --- DO / BO / KO / SO / TO / YO / RO (2 Heceli) ---
  ['DO', 'LAP'],
  ['ŞA', 'RAP'],
  ['ÇO', 'RAP'],
  ['SA', 'RAP'],
  ['DO', 'ĞA'],
  ['BO', 'ĞA'],
  ['DO', 'ĞU'],
  ['KO', 'KU'],
  ['DO', 'KU'],
  ['UY', 'KU'],
  ['KOR', 'KU'],
  ['DO', 'LU'],
  ['YO', 'LU'],
  ['KO', 'LU'],
  ['SO', 'LU'],
  ['BO', 'LU'],
  ['DO', 'KUN'],
  ['SO', 'KUN'],
  ['YO', 'ĞUN'],
  ['BO', 'YUT'],
  ['SO', 'YUT'],
  ['BU', 'LUT'],
  ['KO', 'NUT'],
  ['KO', 'NUK'],
  ['DO', 'RUK'],
  ['SO', 'LUK'],
  ['BO', 'LUK'],
  ['KOM', 'ŞU'],
  ['KO', 'ŞU'],
  ['TUR', 'ŞU'],
  ['KAR', 'ŞI'],
  ['ÇAR', 'ŞI'],
  ['KO', 'ZA'],
  ['BO', 'ZA'],
  ['CE', 'ZA'],
  ['RI', 'ZA'],
  ['FE', 'ZA'],
  ['KO', 'VA'],
  ['YU', 'VA'],
  ['HA', 'VA'],
  ['TA', 'VA'],
  ['DA', 'VA'],
  ['DE', 'VA'],
  ['KO', 'CA'],
  ['HO', 'CA'],
  ['BO', 'CA'],
  ['LO', 'CA'],
  ['KO', 'YU'],
  ['SO', 'YU'],
  ['BO', 'YU'],
  ['KU', 'YU'],
  ['SU', 'YU'],
  ['HU', 'YU'],

  // --- Kİ / Bİ / Çİ / Dİ / Fİ / Gİ / Lİ / Mİ / Nİ / Pİ / Sİ / Şİ / Tİ / Vİ / Zİ ---
  ['Kİ', 'TAP'],
  ['Hİ', 'TAP'],
  ['Kİ', 'RA'],
  ['SI', 'RA'],
  ['Lİ', 'RA'],
  ['Bİ', 'RA'],
  ['Mİ', 'RA'],
  ['ŞI', 'RA'],
  ['Kİ', 'LİT'],
  ['Bİ', 'LET'],
  ['Sİ', 'MİT'],
  ['Lİ', 'MİT'],
  ['Çİ', 'ÇEK'],
  ['BÖ', 'CEK'],
  ['ÖL', 'ÇEK'],
  ['GER', 'ÇEK'],
  ['MER', 'CEK'],
  ['Çİ', 'LEK'],
  ['Bİ', 'LEK'],
  ['Dİ', 'LEK'],
  ['YÜ', 'REK'],
  ['BÖ', 'REK'],
  ['ÇÖ', 'REK'],
  ['KÜ', 'REK'],
  ['Dİ', 'REK'],
  ['PE', 'TEK'],
  ['KE', 'PEK'],
  ['KÖ', 'PEK'],
  ['GÖ', 'BEK'],
  ['BE', 'BEK'],
  ['KE', 'LEK'],
  ['ME', 'LEK'],
  ['FE', 'LEK'],
  ['YE', 'LEK'],
  ['Çİ', 'MEN'],
  ['DÜ', 'MEN'],
  ['HE', 'MEN'],
  ['SE', 'MEN'],
  ['YE', 'MEN'],
  ['ÇİZ', 'Gİ'],
  ['SEV', 'Gİ'],
  ['BİL', 'Gİ'],
  ['SİL', 'Gİ'],
  ['İL', 'Gİ'],
  ['VER', 'Gİ'],
  ['SER', 'Gİ'],
  ['DER', 'Gİ'],
  ['Çİ', 'Vİ'],
  ['Kİ', 'Vİ'],
  ['Dİ', 'Zİ'],
  ['GE', 'Zİ'],
  ['Sİ', 'Zİ'],
  ['Bİ', 'Zİ'],
  ['Kİ', 'Şİ'],
  ['Dİ', 'Şİ'],
  ['Fİ', 'Şİ'],
  ['Pİ', 'Şİ'],
  ['Kİ', 'LO'],
  ['Fİ', 'LO'],
  ['Sİ', 'LO'],
  ['Dİ', 'Rİ'],
  ['Bİ', 'Rİ'],
  ['PE', 'Rİ'],
  ['DE', 'Rİ'],
  ['GE', 'Rİ'],
  ['VE', 'Rİ'],
  ['SE', 'Rİ'],
  ['YE', 'Rİ'],

  // --- KE / LE / ME / NE / PE / RE / SE / ŞE / TE / VE / YE / ZE ---
  ['KE', 'Dİ'],
  ['YE', 'Dİ'],
  ['DE', 'Dİ'],
  ['KEN', 'Dİ'],
  ['KE', 'MİK'],
  ['DE', 'LİK'],
  ['ÇE', 'LİK'],
  ['BE', 'LİK'],
  ['KE', 'SİK'],
  ['BE', 'SİK'],
  ['KE', 'NAR'],
  ['ÇI', 'NAR'],
  ['PI', 'NAR'],
  ['YA', 'NAR'],
  ['KA', 'NAR'],
  ['SA', 'NAR'],
  ['KE', 'MER'],
  ['SE', 'MER'],
  ['DE', 'ĞER'],
  ['Cİ', 'ĞER'],
  ['Dİ', 'ĞER'],
  ['ŞE', 'KER'],
  ['TE', 'KER'],
  ['ÇE', 'KER'],
  ['SE', 'HER'],
  ['ZE', 'HİR'],
  ['NE', 'HİR'],
  ['ŞE', 'HİR'],
  ['DE', 'MİR'],
  ['KÖ', 'MÜR'],
  ['ÇA', 'MUR'],
  ['HA', 'MUR'],
  ['SA', 'MUR'],
  ['YAĞ', 'MUR'],
  ['DE', 'NİZ'],
  ['SE', 'KİZ'],
  ['TE', 'MİZ'],
  ['SE', 'MİZ'],
  ['ÇE', 'YİZ'],
  ['CE', 'VİZ'],
  ['DE', 'RİN'],
  ['SE', 'RİN'],
  ['GE', 'LİN'],
  ['PE', 'LİN'],
  ['BE', 'YİN'],
  ['KE', 'SİN'],
  ['BE', 'SİN'],
  ['ME', 'TİN'],
  ['ÇE', 'TİN'],
  ['AL', 'TIN'],

  // --- KU / BU / DU / GU / HU / LU / MU / NU / PU / RU / SU / ŞU / TU / YU / ZU ---
  ['KU', 'ZU'],
  ['TU', 'ZU'],
  ['BU', 'ZU'],
  ['KO', 'ZU'],
  ['TO', 'ZU'],
  ['PO', 'ZU'],
  ['KU', 'TU'],
  ['KÖ', 'TÜ'],
  ['KU', 'ŞU'],
  ['KU', 'RU'],
  ['DU', 'RU'],
  ['SU', 'RU'],
  ['BO', 'RU'],
  ['KO', 'RU'],
  ['SO', 'RU'],
  ['DOĞ', 'RU'],
  ['KU', 'LAK'],
  ['SU', 'LAK'],
  ['KU', 'RAK'],
  ['DU', 'RAK'],
  ['BU', 'RAK'],
  ['ÇI', 'RAK'],
  ['TA', 'RAK'],
  ['KUR', 'ŞUN'],
  ['KU', 'MAŞ'],
  ['SA', 'VAŞ'],
  ['YA', 'VAŞ'],
  ['TA', 'LAŞ'],
  ['BU', 'LAŞ'],
  ['DA', 'LAŞ'],
  ['ÇU', 'VAL'],
  ['KU', 'SUR'],
  ['HU', 'ZUR'],
  ['BU', 'HAR'],
  ['BA', 'HAR'],
  ['SA', 'HAR'],

  // --- GÜ / KÜ / BÜ / DÜ / SÜ / TÜ / YÜ / BÖ / ÇÖ / DÖ / GÖ / KÖ / SÖ ---
  ['GÜ', 'NEŞ'],
  ['KAR', 'DEŞ'],
  ['GÜ', 'MÜŞ'],
  ['GÜ', 'LÜŞ'],
  ['DÖ', 'NÜŞ'],
  ['GÖ', 'RÜŞ'],
  ['GÜ', 'ZEL'],
  ['GA', 'ZEL'],
  ['GÜÇ', 'LÜ'],
  ['SÜT', 'LÜ'],
  ['ÜN', 'LÜ'],
  ['GÜN', 'LÜK'],
  ['SÖZ', 'LÜK'],
  ['GÖZ', 'LÜK'],
  ['KÜ', 'ÇÜK'],
  ['BÜ', 'YÜK'],
  ['YÜ', 'ZÜK'],
  ['SÜ', 'ZÜK'],
  ['DÜ', 'DÜK'],
  ['KÜ', 'TÜK'],
  ['ÖR', 'TÜ'],
  ['KÖP', 'RÜ'],
  ['ÖR', 'GÜ'],
  ['SÜR', 'GÜ'],
  ['GÖR', 'GÜ'],
  ['DÜ', 'ĞÜN'],
  ['BÜ', 'TÜN'],
  ['TÜ', 'TÜN'],
  ['SÜ', 'TUN'],
  ['ÜS', 'TÜN'],
  ['GÜN', 'DÜZ'],
  ['YÜ', 'ZÜ'],
  ['GÖ', 'ZÜ'],
  ['SÖ', 'ZÜ'],
  ['KÖ', 'ZÜ'],
  ['ÇÖ', 'ZÜ'],
  ['ÇÖ', 'ZÜM'],
  ['GÖ', 'NÜL'],
  ['BÜL', 'BÜL'],
  ['SÜM', 'BÜL'],
  ['ÖR', 'DEK'],
  ['YE', 'DEK'],
  ['ÖR', 'NEK'],
  ['BÖL', 'GE'],
  ['GÖL', 'GE'],
  ['BİL', 'GE'],
  ['SİM', 'GE'],
  ['İM', 'GE'],
  ['DÖ', 'NEM'],

  // --- EL / AL / OL / BAL / HAL / SAL / PAR / FIR / BAH / KEP / BAR / ÇAR / BAY / YAP / TOP ---
  ['EL', 'MA'],
  ['AL', 'MA'],
  ['OL', 'MA'],
  ['KAL', 'MA'],
  ['SAL', 'MA'],
  ['ÇAL', 'MA'],
  ['BAL', 'TA'],
  ['HAL', 'KA'],
  ['SAL', 'ÇA'],
  ['PAR', 'ÇA'],
  ['FIR', 'ÇA'],
  ['BAH', 'ÇE'],
  ['KEP', 'ÇE'],
  ['AK', 'ÇE'],
  ['BAR', 'DAK'],
  ['ÇAR', 'DAK'],
  ['BAY', 'RAK'],
  ['YAP', 'RAK'],
  ['TOP', 'RAK'],
  ['BA', 'LIK'],
  ['KA', 'LIK'],
  ['SA', 'LIK'],
  ['ÇA', 'LIK'],
  ['YOR', 'GAN'],
  ['OR', 'MAN'],
  ['DER', 'MAN'],
  ['FER', 'MAN'],
  ['HAR', 'MAN'],
  ['KAR', 'GO'],
  ['KAR', 'GA'],
  ['DAL', 'GA'],
  ['KAV', 'GA'],
  ['DAM', 'GA'],
  ['BAN', 'KA'],
  ['MAR', 'KA'],
  ['HAR', 'KA'],
  ['PAR', 'KA'],
  ['ŞAP', 'KA'],

  // --- 3 Heceli Yüksek Frekanslı Türkçe Kelimeler (%100 Doğru Hecelenmiş) ---
  ['KA', 'SA', 'BA'],
  ['AK', 'RA', 'BA'],
  ['MA', 'KAR', 'NA'],
  ['MA', 'KA', 'RA'],
  ['MA', 'ĞA', 'RA'],
  ['SA', 'KAR', 'YA'],
  ['KA', 'ME', 'RA'],
  ['NU', 'MA', 'RA'],
  ['Sİ', 'GA', 'RA'],
  ['MAN', 'ZA', 'RA'],
  ['AN', 'KA', 'RA'],
  ['KA', 'RIN', 'CA'],
  ['SA', 'LIN', 'CAK'],
  ['KA', 'RAN', 'LIK'],
  ['AY', 'DIN', 'LIK'],
  ['Kİ', 'TAP', 'LIK'],
  ['BA', 'ŞA', 'RI'],
  ['DI', 'ŞA', 'RI'],
  ['YU', 'KA', 'RI'],
  ['KA', 'LEM', 'LİK'],
  ['GÖZ', 'LÜK', 'LÜ'],
  ['ŞE', 'KER', 'Lİ'],
  ['Çİ', 'ÇEK', 'Lİ'],
  ['YÜ', 'REK', 'Lİ'],
  ['BÖ', 'REK', 'Çİ'],
  ['ÇÖ', 'REK', 'Çİ'],
  ['Sİ', 'MİT', 'Çİ'],
  ['BA', 'LIK', 'ÇI'],
  ['KA', 'PI', 'CI'],
  ['YA', 'PI', 'CI'],
  ['SA', 'TI', 'CI'],
  ['KA', 'LI', 'CI'],
  ['YA', 'ZI', 'CI'],
  ['Çİ', 'Zİ', 'Cİ'],
  ['GE', 'Zİ', 'Cİ'],
  ['SE', 'VİM', 'Lİ'],
  ['VE', 'RİM', 'Lİ'],
  ['BA', 'KIM', 'LI'],
  ['TA', 'KIM', 'LI'],
  ['YAR', 'DIM', 'CI'],
  ['YA', 'PIM', 'CI'],
  ['KE', 'LE', 'BEK'],
  ['GE', 'LE', 'NEK'],
  ['SE', 'ÇE', 'NEK'],
  ['YE', 'TE', 'NEK'],
  ['GÖ', 'RE', 'NEK'],
  ['DE', 'ĞİR', 'MEN'],
  ['ÖĞ', 'RET', 'MEN'],
  ['YÖ', 'NET', 'MEN'],
  ['BÖ', 'LÜN', 'MÜŞ'],
  ['GÖ', 'RÜN', 'MÜŞ'],
  ['PA', 'TA', 'TES'],
  ['DO', 'MA', 'TES'],
  ['PA', 'PAT', 'YA'],
  ['PA', 'PA', 'ĞAN'],
  ['KA', 'RA', 'CA'],
  ['BA', 'LA', 'CA'],
  ['KA', 'BA', 'CA'],
  ['SA', 'DE', 'CE'],
  ['GE', 'CE', 'LİK'],
  ['Bİ', 'LE', 'ZİK'],
  ['GE', 'LE', 'CEK'],
  ['SE', 'VE', 'CEK'],
  ['Bİ', 'LE', 'CEK'],
  ['GÖ', 'RE', 'CEK'],
  ['VE', 'RE', 'CEK'],
  ['KA', 'LA', 'CAK'],
  ['SA', 'LA', 'CAK'],
  ['BA', 'KA', 'CAK'],
  ['YA', 'KA', 'CAK'],
  ['ÇI', 'KA', 'CAK'],
  ['KA', 'ÇA', 'CAK'],
  ['SA', 'ÇA', 'CAK'],
  ['TA', 'BA', 'KA'],
  ['NA', 'FA', 'KA'],
  ['SA', 'DA', 'KA'],
  ['ŞA', 'KA', 'CI'],
  ['BO', 'YA', 'CI'],
  ['SO', 'BA', 'CI'],
  ['MA', 'SA', 'CI'],
  ['KA', 'SA', 'CI'],
  ['PA', 'RA', 'LI'],
  ['YA', 'RA', 'LI'],
  ['KA', 'RA', 'LI'],
  ['SI', 'RA', 'LI'],
  ['KU', 'RAL', 'LI'],
  ['MA', 'SAL', 'LI'],
  ['SA', 'KAL', 'LI'],
  ['KA', 'PI', 'LI'],
  ['YA', 'PI', 'LI'],
  ['TEH', 'Lİ', 'KE'],
  ['MA', 'Kİ', 'NE'],
  ['HA', 'Zİ', 'NE'],
  ['ŞE', 'LA', 'LE'],
  ['KA', 'Fİ', 'LE'],
  ['NA', 'Fİ', 'LE'],
  ['GA', 'ZE', 'TE'],
  ['RE', 'ÇE', 'TE'],
  ['PE', 'ÇE', 'TE'],
  ['SEB', 'ZE', 'Lİ'],
  ['MEY', 'VE', 'Lİ'],
  ['KAH', 'VE', 'Lİ'],
  ['Pİ', 'DE', 'Cİ'],
  ['Lİ', 'MON', 'LUK'],
  ['KO', 'YUN', 'LUK'],
  ['ÇO', 'CUK', 'LUK'],
  ['ÇO', 'CUK', 'LAR'],
  ['KA', 'DIN', 'LAR'],
  ['İN', 'SAN', 'LAR'],
  ['HAY', 'VAN', 'LAR'],
  ['Çİ', 'ÇEK', 'LER'],
  ['BÖ', 'CEK', 'LER'],
  ['KE', 'Dİ', 'LER'],
  ['KÖ', 'PEK', 'LER'],
  ['KA', 'LEM', 'LER'],
  ['Kİ', 'TAP', 'LAR'],
  ['DO', 'LAP', 'LAR'],
  ['MA', 'SA', 'LAR'],
  ['KA', 'SA', 'LAR'],
  ['KA', 'PI', 'LAR'],
  ['YA', 'PI', 'LAR'],
  ['EL', 'MA', 'LAR'],
  ['BA', 'BA', 'LAR'],
  ['DA', 'NA', 'LAR'],
  ['KO', 'VA', 'LAR'],
  ['YU', 'VA', 'LAR'],
  ['TA', 'VA', 'LAR'],
  ['HA', 'VA', 'LAR'],
  ['KA', 'YA', 'LAR'],
  ['BO', 'YA', 'LAR'],
  ['MA', 'YA', 'LAR'],
  ['MO', 'DA', 'LAR'],
  ['SO', 'BA', 'LAR'],
  ['KA', 'BAK', 'LAR'],
  ['TA', 'BAK', 'LAR'],
  ['KA', 'PAK', 'LAR'],
  ['KA', 'ZAK', 'LAR'],
  ['TU', 'ZAK', 'LAR'],
  ['KU', 'LAK', 'LAR'],
  ['DU', 'RAK', 'LAR'],
  ['TA', 'RAK', 'LAR'],
  ['BU', 'CAK', 'LAR'],
  ['KU', 'CAK', 'LAR'],
  ['BA', 'CAK', 'LAR'],
  ['KA', 'ŞIK', 'LAR'],
  ['BE', 'ŞİK', 'LER'],
  ['KA', 'YIK', 'LAR'],
  ['BA', 'LIK', 'LAR'],
  ['Çİ', 'LEK', 'LER'],
  ['Bİ', 'LEK', 'LER'],
  ['Dİ', 'LEK', 'LER'],
  ['YÜ', 'REK', 'LER'],
  ['BÖ', 'REK', 'LER'],
  ['ÇÖ', 'REK', 'LER'],
  ['KÜ', 'REK', 'LER'],
  ['Dİ', 'REK', 'LER'],
  ['PE', 'TEK', 'LER'],
  ['BE', 'BEK', 'LER'],
  ['ME', 'LEK', 'LER'],
  ['YE', 'LEK', 'LER'],
  ['ŞE', 'KER', 'LER'],
  ['TE', 'KER', 'LER'],
  ['KE', 'MER', 'LER'],
  ['DE', 'ĞER', 'LER'],
  ['ŞE', 'HİR', 'LER'],
  ['NE', 'HİR', 'LER'],
  ['DE', 'MİR', 'LER'],
  ['KÖ', 'MÜR', 'LER'],
  ['DE', 'NİZ', 'LER'],
  ['CE', 'VİZ', 'LER'],
  ['GE', 'LİN', 'LER'],
  ['BE', 'YİN', 'LER'],
  ['BE', 'SİN', 'LER'],
  ['ME', 'TİN', 'LER'],
  ['KU', 'ZU', 'LAR'],
  ['KU', 'TU', 'LAR'],
  ['KO', 'KU', 'LAR'],
  ['DO', 'KU', 'LAR'],
  ['BU', 'LUT', 'LAR'],
  ['KO', 'NUT', 'LAR'],
  ['KO', 'NUK', 'LAR'],
  ['DO', 'RUK', 'LAR'],
  ['SO', 'LUK', 'LAR'],
  ['KOM', 'ŞU', 'LAR'],
  ['TUR', 'ŞU', 'LAR'],
  ['GÜ', 'NEŞ', 'Lİ'],
  ['YAĞ', 'MUR', 'LU'],
  ['BU', 'LUT', 'LU'],
  ['HU', 'ZUR', 'LU'],
  ['KU', 'SUR', 'LU'],
  ['SA', 'BIR', 'LI'],
  ['HA', 'YIR', 'LI'],
  ['GU', 'RUR', 'LU'],

  // --- OYUNDA SIK KARŞILAŞILAN HECE KESİŞİMLERİ (DOLAR, SOLAR, KOLA, MOLA, SALI, HALI vb.) ---
  ['DO', 'LAR'],
  ['SO', 'LAR'],
  ['YO', 'LAR'],
  ['SO', 'LA'],
  ['KO', 'LA'],
  ['MO', 'LA'],
  ['DO', 'LA'],
  ['BO', 'LA'],
  ['PO', 'LA'],
  ['RO', 'LA'],
  ['TO', 'LA'],
  ['KA', 'LA'],
  ['SA', 'LA'],
  ['BA', 'LA'],
  ['HA', 'LA'],
  ['TA', 'LA'],
  ['YA', 'LA'],
  ['PA', 'LA'],
  ['MA', 'LA'],
  ['DA', 'LA'],
  ['NA', 'LA'],
  ['ÇA', 'LA'],
  ['VA', 'LA'],
  ['CA', 'LA'],
  ['KA', 'LI'],
  ['SA', 'LI'],
  ['BA', 'LI'],
  ['HA', 'LI'],
  ['DA', 'LI'],
  ['MA', 'LI'],
  ['ŞA', 'LI'],
  ['YA', 'LI'],
  ['ÇA', 'LI'],
  ['TA', 'LI'],
  ['PA', 'LI'],
  ['NA', 'LI'],
  ['KA', 'LIR'],
  ['SA', 'LIR'],
  ['BA', 'LIR'],
  ['DA', 'LIR'],
  ['ÇA', 'LIR'],
  ['TA', 'LIR'],
  ['YA', 'LIR'],
  ['KA', 'LAR'],
  ['SA', 'LAR'],
  ['BA', 'LAR'],
  ['DA', 'LAR'],
  ['ÇA', 'LAR'],
  ['TA', 'LAR'],
  ['YA', 'LAR'],
  ['PA', 'LAR'],
  ['MA', 'LAR'],
  ['HA', 'LAR'],
  ['NA', 'LAR'],
  ['VA', 'LAR'],
  ['ZA', 'LAR'],

  // --- -LAR / -LER / -LIK / -LİK / -LUK / -LÜK İLE BİTEN YÜKSEK FREKANSLI 2 HECELİLER ---
  ['BAĞ', 'LAR'],
  ['DAĞ', 'LAR'],
  ['SAĞ', 'LAR'],
  ['YAĞ', 'LAR'],
  ['ÇAĞ', 'LAR'],
  ['AĞ', 'LAR'],
  ['BAŞ', 'LAR'],
  ['TAŞ', 'LAR'],
  ['KAŞ', 'LAR'],
  ['YAŞ', 'LAR'],
  ['KUŞ', 'LAR'],
  ['TUŞ', 'LAR'],
  ['DUŞ', 'LAR'],
  ['MUŞ', 'LAR'],
  ['BOŞ', 'LAR'],
  ['KOŞ', 'LAR'],
  ['HOŞ', 'LAR'],
  ['KIŞ', 'LAR'],
  ['DIŞ', 'LAR'],
  ['ŞIŞ', 'LAR'],
  ['DİŞ', 'LER'],
  ['FİŞ', 'LER'],
  ['ŞİŞ', 'LER'],
  ['PİŞ', 'LER'],
  ['İŞ', 'LER'],
  ['GÜÇ', 'LER'],
  ['GÖÇ', 'LER'],
  ['SUÇ', 'LAR'],
  ['UÇ', 'LAR'],
  ['SAÇ', 'LAR'],
  ['TAÇ', 'LAR'],
  ['MAÇ', 'LAR'],
  ['KAÇ', 'LAR'],
  ['AÇ', 'LAR'],
  ['İÇ', 'LER'],
  ['HİÇ', 'LER'],
  ['KOÇ', 'LAR'],
  ['OK', 'LAR'],
  ['ÇOK', 'LAR'],
  ['YOK', 'LAR'],
  ['TOK', 'LAR'],
  ['ŞOK', 'LAR'],
  ['AK', 'LAR'],
  ['BAK', 'LAR'],
  ['HAK', 'LAR'],
  ['PAK', 'LAR'],
  ['SAK', 'LAR'],
  ['TAK', 'LAR'],
  ['YAK', 'LAR'],
  ['ÇAK', 'LAR'],
  ['EK', 'LER'],
  ['TEK', 'LER'],
  ['ÇEK', 'LER'],
  ['PEK', 'LER'],
  ['SEK', 'LER'],
  ['BEK', 'LER'],
  ['DEK', 'LER'],
  ['YÜK', 'LER'],
  ['KÖK', 'LER'],
  ['GÖK', 'LER'],
  ['DÖK', 'LER'],
  ['SÖK', 'LER'],
  ['BÜK', 'LER'],
  ['TÜK', 'LER'],
  ['AT', 'LAR'],
  ['KAT', 'LAR'],
  ['SAT', 'LAR'],
  ['TAT', 'LAR'],
  ['YAT', 'LAR'],
  ['ÇAT', 'LAR'],
  ['PAT', 'LAR'],
  ['MAT', 'LAR'],
  ['HAT', 'LAR'],
  ['ET', 'LER'],
  ['SET', 'LER'],
  ['NET', 'LER'],
  ['ÇET', 'LER'],
  ['SÜT', 'LER'],
  ['KÜT', 'LER'],
  ['OT', 'LAR'],
  ['NOT', 'LAR'],
  ['BOT', 'LAR'],
  ['KOT', 'LAR'],
  ['POT', 'LAR'],
  ['el', 'LER'],
  ['BEL', 'LER'],
  ['DEL', 'LER'],
  ['GEL', 'LER'],
  ['SEL', 'LER'],
  ['TEL', 'LER'],
  ['YEL', 'LER'],
  ['KEL', 'LER'],
  ['AL', 'LAR'],
  ['BAL', 'LAR'],
  ['DAL', 'LAR'],
  ['FAL', 'LAR'],
  ['HAL', 'LAR'],
  ['KAL', 'LAR'],
  ['MAL', 'LAR'],
  ['NAL', 'LAR'],
  ['SAL', 'LAR'],
  ['ŞAL', 'LAR'],
  ['TAL', 'LAR'],
  ['YAL', 'LAR'],
  ['ÇAL', 'LAR'],
  ['OL', 'LAR'],
  ['BOL', 'LAR'],
  ['KOL', 'LAR'],
  ['SOL', 'LAR'],
  ['YOL', 'LAR'],
  ['ROL', 'LAR'],
  ['GOL', 'LER'],
  ['GÖL', 'LER'],
  ['ÇÖL', 'LER'],
  ['BÖL', 'LER'],
  ['KUL', 'LAR'],
  ['PUL', 'LAR'],
  ['DUL', 'LAR'],
  ['ÇUL', 'LAR'],
  ['GÜL', 'LER'],
  ['KÜL', 'LER'],
  ['TÜL', 'LER'],
  ['DİL', 'LER'],
  ['BİL', 'LER'],
  ['FİL', 'LER'],
  ['KİL', 'LER'],
  ['PİL', 'LER'],
  ['SİL', 'LER'],
  ['ZİL', 'LER'],
  ['MİL', 'LER'],
  ['YIL', 'LAR'],
  ['KIL', 'LAR'],
  ['Söz', 'LER'],
  ['GÖZ', 'LER'],
  ['KÖZ', 'LER'],
  ['ÇÖZ', 'LER'],
  ['YÜZ', 'LER'],
  ['DÜZ', 'LER'],
  ['GÜZ', 'LER'],
  ['SÜZ', 'LER'],
  ['BUZ', 'LAR'],
  ['TUZ', 'LAR'],
  ['KOZ', 'LAR'],
  ['TOZ', 'LAR'],
  ['POZ', 'LAR'],
  ['BOZ', 'LAR'],
  ['KIZ', 'LAR'],
  ['HIZ', 'LAR'],
  ['SIZ', 'LAR'],
  ['CIZ', 'LAR'],
  ['BİZ', 'LER'],
  ['DİZ', 'LER'],
  ['SİZ', 'LER'],
  ['ÇİZ', 'LER'],
  ['İZ', 'LER'],
  ['AZ', 'LAR'],
  ['BAZ', 'LAR'],
  ['GAZ', 'LAR'],
  ['KAZ', 'LAR'],
  ['NAZ', 'LAR'],
  ['SAZ', 'LAR'],
  ['TAZ', 'LAR'],
  ['YAZ', 'LAR'],
  ['ÇAZ', 'LAR'],
  ['SES', 'LER'],
  ['PES', 'LER'],
  ['KES', 'LER'],
  ['FES', 'LER'],
  ['PAS', 'LAR'],
  ['KAS', 'LAR'],
  ['MAS', 'LAR'],
  ['TAS', 'LAR'],
  ['YAS', 'LAR'],
  ['BAS', 'LAR'],
  ['HAS', 'LAR'],
  ['KÜS', 'LER'],
  ['SÜS', 'LER'],
  ['PÜS', 'LER'],
  ['SOS', 'LAR'],
  ['TOS', 'LAR'],
  ['POS', 'LAR'],
  ['CAN', 'LAR'],
  ['HAN', 'LAR'],
  ['KAN', 'LAR'],
  ['SAN', 'LAR'],
  ['ŞAN', 'LAR'],
  ['TAN', 'LAR'],
  ['VAN', 'LAR'],
  ['YAN', 'LAR'],
  ['ZAN', 'LAR'],
  ['ÇAN', 'LAR'],
  ['BEN', 'LER'],
  ['DEN', 'LER'],
  ['FEN', 'LER'],
  ['GEN', 'LER'],
  ['MEN', 'LER'],
  ['SEN', 'LER'],
  ['ŞEN', 'LER'],
  ['TEN', 'LER'],
  ['YEN', 'LER'],
  ['GÜN', 'LER'],
  ['DÜN', 'LER'],
  ['YÜN', 'LER'],
  ['ÜN', 'LER'],
  ['SON', 'LAR'],
  ['TON', 'LAR'],
  ['DON', 'LAR'],
  ['FON', 'LAR'],
  ['BON', 'LAR'],
  ['BİN', 'LER'],
  ['CİN', 'LER'],
  ['DİN', 'LER'],
  ['KİN', 'LER'],
  ['PİN', 'LER'],
  ['SİN', 'LER'],
  ['TİN', 'LER'],
  ['ÇİN', 'LER'],
  ['YEM', 'LER'],
  ['DEM', 'LER'],
  ['KEM', 'LER'],
  ['NEM', 'LER'],
  ['SEM', 'LER'],
  ['ŞEM', 'LER'],
  ['ÇEM', 'LER'],
  ['CAM', 'LAR'],
  ['ÇAM', 'LAR'],
  ['DAM', 'LAR'],
  ['GAM', 'LAR'],
  ['HAM', 'LAR'],
  ['KAM', 'LAR'],
  ['LAM', 'LAR'],
  ['NAM', 'LAR'],
  ['SAM', 'LAR'],
  ['ŞAM', 'LAR'],
  ['TAM', 'LAR'],
  ['ZAM', 'LAR'],
  ['KUM', 'LAR'],
  ['MUM', 'LAR'],
  ['RUM', 'LAR'],
  ['TUM', 'LAR'],
  ['YUM', 'LAR'],
  ['KAR', 'LAR'],
  ['DAR', 'LAR'],
  ['GAR', 'LAR'],
  ['HAR', 'LAR'],
  ['NAR', 'LAR'],
  ['SAR', 'LAR'],
  ['TAR', 'LAR'],
  ['VAR', 'LAR'],
  ['YAR', 'LAR'],
  ['ZAR', 'LAR'],
  ['ÇAR', 'LAR'],
  ['BAR', 'LAR'],
  ['PAR', 'LAR'],
  ['YER', 'LER'],
  ['DER', 'LER'],
  ['FER', 'LER'],
  ['GER', 'LER'],
  ['HER', 'LER'],
  ['SER', 'LER'],
  ['ŞER', 'LER'],
  ['TER', 'LER'],
  ['VER', 'LER'],
  ['ZER', 'LER'],
  ['BİR', 'LER'],
  ['KİR', 'LER'],
  ['PİR', 'LER'],
  ['SİR', 'LER'],
  ['ÇİR', 'LER'],
  ['GİR', 'LER'],
  ['SIR', 'LAR'],
  ['KIR', 'LAR'],
  ['PIR', 'LAR'],
  ['HIR', 'LAR'],
  ['TIR', 'LAR'],
  ['ÇIR', 'LAR'],
  ['ZIR', 'LAR'],
  ['KOR', 'LAR'],
  ['MOR', 'LAR'],
  ['SOR', 'LAR'],
  ['TOR', 'LAR'],
  ['ZOR', 'LAR'],
  ['HOR', 'LAR'],
  ['BOR', 'LAR'],
  ['KÖR', 'LER'],
  ['GÖR', 'LER'],
  ['SÖR', 'LER'],
  ['ÖR', 'LER'],
  ['KUR', 'LAR'],
  ['DUR', 'LAR'],
  ['NUR', 'LAR'],
  ['SUR', 'LAR'],
  ['TUR', 'LAR'],
  ['VUR', 'LAR'],
  ['BUR', 'LAR'],
  ['GÜR', 'LER'],
  ['HÜR', 'LER'],
  ['KÜR', 'LER'],
  ['SÜR', 'LER'],
  ['TÜR', 'LER'],
  ['BAŞ', 'LIK'],
  ['TAŞ', 'LIK'],
  ['KAŞ', 'LIK'],
  ['YAŞ', 'LIK'],
  ['KIŞ', 'LIK'],
  ['YAZ', 'LIK'],
  ['GÜZ', 'LÜK'],
  ['GÖZ', 'LÜK'],
  ['SÖZ', 'LÜK'],
  ['YÜZ', 'LÜK'],
  ['DÜZ', 'LÜK'],
  ['TUZ', 'LUK'],
  ['BUZ', 'LUK'],
  ['TOZ', 'LUK'],
  ['KOZ', 'LUK'],
  ['BOŞ', 'LUK'],
  ['HOŞ', 'LUK'],
  ['KUŞ', 'LUK'],
  ['SAĞ', 'LIK'],
  ['DAĞ', 'LIK'],
  ['BAĞ', 'LIK'],
  ['YAĞ', 'LIK'],
  ['ÇAM', 'LIK'],
  ['KUM', 'LUK'],
  ['DAR', 'LIK'],
  ['VAR', 'LIK'],
  ['YOK', 'LUK'],
  ['ÇOK', 'LUK'],
  ['TOK', 'LUK'],
  ['AK', 'LIK'],
  ['PAK', 'LIK'],
  ['TEK', 'LİK'],
  ['BEY', 'LİK'],
  ['KÖY', 'LÜK'],
  ['ŞEN', 'LİK'],
  ['BEN', 'LİK'],
  ['GEN', 'LİK'],
  ['DEM', 'LİK'],
  ['YEM', 'LİK'],
  ['NEM', 'LİK'],
  ['KEM', 'LİK'],
  ['BİR', 'LİK'],
  ['KİR', 'LİK'],
  ['PİR', 'LİK'],
  ['SIR', 'LIK'],
  ['KIR', 'LIK'],
  ['ZOR', 'LUK'],
  ['KOR', 'LUK'],
  ['MOR', 'LUK'],
  ['KÖR', 'LÜK'],
  ['GÜR', 'LÜK'],
  ['HÜR', 'LÜK'],
  ['KÜL', 'LÜK'],
  ['GÜL', 'LÜK'],
  ['ÇÖL', 'LÜK'],
  ['GÖL', 'LÜK'],
  ['YOL', 'LUK'],
  ['KOL', 'LUK'],
  ['BOL', 'LUK'],
  ['KUL', 'LUK'],
  ['PUL', 'LUK'],
  ['DUL', 'LUK'],
  ['KIL', 'LIK'],
  ['YIL', 'LIK'],

  // --- YAYGIN 2 HECELİ FİİL ÇEKİMLERİ & İSİMLER (OYUN AKIŞINDA SIK DENENENLER) ---
  ['KA', 'ÇAR'],
  ['SA', 'ÇAR'],
  ['BA', 'KAR'],
  ['YA', 'KAR'],
  ['TA', 'KAR'],
  ['ÇA', 'KAR'],
  ['SA', 'KAR'],
  ['ÇI', 'KAR'],
  ['SI', 'KAR'],
  ['BI', 'KAR'],
  ['YI', 'KAR'],
  ['KO', 'ŞAR'],
  ['CO', 'ŞAR'],
  ['BO', 'ŞAR'],
  ['YA', 'ŞAR'],
  ['TA', 'ŞAR'],
  ['ŞA', 'ŞAR'],
  ['BA', 'SAR'],
  ['KA', 'SAR'],
  ['A', 'SAR'],
  ['SA', 'TAR'],
  ['KA', 'TAR'],
  ['YA', 'TAR'],
  ['BA', 'TAR'],
  ['ÇA', 'TAR'],
  ['TA', 'TAR'],
  ['PA', 'TAR'],
  ['TU', 'TAR'],
  ['YU', 'TAR'],
  ['KA', 'PAR'],
  ['YA', 'PAR'],
  ['SA', 'PAR'],
  ['TA', 'PAR'],
  ['KO', 'PAR'],
  ['TO', 'PAR'],
  ['KA', 'ZAR'],
  ['YA', 'ZAR'],
  ['PA', 'ZAR'],
  ['NA', 'ZAR'],
  ['SA', 'ZAR'],
  ['BO', 'ZAR'],
  ['TO', 'ZAR'],
  ['KÖ', 'ŞE'],
  ['NE', 'ŞE'],
  ['Şİ', 'ŞE'],
  ['ME', 'ŞE'],
  ['Gİ', 'ŞE'],
  ['PA', 'ŞA'],
  ['MA', 'ŞA'],
  ['YA', 'ŞA'],
  ['BA', 'ŞA'],
  ['TA', 'ŞA'],
  ['KA', 'ŞA'],
  ['KO', 'ŞA'],
  ['BO', 'ŞA'],
  ['HO', 'ŞA'],
  ['SO', 'PA'],
  ['KO', 'PA'],
  ['TO', 'PA'],
  ['KA', 'PA'],
  ['SA', 'PA'],
  ['ÇA', 'PA'],
  ['TA', 'PA'],
  ['YA', 'PA'],
  ['LA', 'PA'],
  ['ŞA', 'KA'],
  ['YA', 'KA'],
  ['TA', 'KA'],
  ['BA', 'KA'],
  ['SA', 'KA'],
  ['VA', 'KA'],
  ['TO', 'KA'],
  ['RO', 'KA'],
  ['SO', 'KA'],
  ['KO', 'KA'],
  ['BO', 'KA'],
  ['MO', 'DA'],
  ['SO', 'DA'],
  ['KO', 'DA'],
  ['BO', 'DA'],
  ['RO', 'DA'],
  ['AD', 'A'],
  ['BO', 'ĞAZ'],
  ['KA', 'ĞIT'],
  ['YA', 'ĞIZ'],
  ['A', 'ĞIZ'],
  ['SA', 'ĞIR'],
  ['BA', 'ĞIR'],
  ['ÇA', 'ĞIR'],
  ['A', 'ĞIR'],
  ['DE', 'ĞİL'],
  ['E', 'ĞİL'],
  ['SÖ', 'ĞÜT'],
  ['Ö', 'ĞÜT'],
  ['GÖ', 'ĞÜS'],
  ['DO', 'ĞAL'],
  ['ÇO', 'ĞAL'],
  ['DO', 'ĞAN'],
  ['SO', 'ĞAN'],
  ['BO', 'ĞAN'],
  ['SA', 'ĞAN'],
  ['YA', 'ĞAN'],
  ['BA', 'ĞAN'],
  ['ÇA', 'ĞAN'],
  ['KO', 'CAK'],
  ['SO', 'CAK'],
  ['TO', 'CAK'],
  ['BO', 'CAK'],
  ['SO', 'KAK'],
  ['KO', 'KAK'],
  ['BO', 'KAK'],
  ['DO', 'KAK'],

  // --- EKSTRA YÜKSEK FREKANSLI GÜNLÜK KELİMELER & FİİL/İSİM KESİŞİMLERİ ---
  ['DO', 'LAŞ'],
  ['U', 'LAŞ'],
  ['BA', 'KIŞ'],
  ['YA', 'KIŞ'],
  ['A', 'KIŞ'],
  ['ÇI', 'KIŞ'],
  ['SA', 'TIŞ'],
  ['KA', 'TIŞ'],
  ['YA', 'TIŞ'],
  ['BA', 'TIŞ'],
  ['A', 'TIŞ'],
  ['KA', 'ÇIŞ'],
  ['SA', 'ÇIŞ'],
  ['A', 'ÇIŞ'],
  ['KO', 'ŞUŞ'],
  ['DO', 'LUŞ'],
  ['BO', 'LUŞ'],
  ['SO', 'LUŞ'],
  ['BU', 'LUŞ'],
  ['O', 'LUŞ'],
  ['DU', 'RUŞ'],
  ['KU', 'RUŞ'],
  ['VU', 'RUŞ'],
  ['DO', 'KUN'],
  ['SO', 'KUN'],
  ['BA', 'KIN'],
  ['TA', 'KIN'],
  ['SA', 'KIN'],
  ['YA', 'KIN'],
  ['KA', 'LIN'],
  ['YA', 'LIN'],
  ['SA', 'LIN'],
  ['A', 'LIN'],
  ['GE', 'LİR'],
  ['Bİ', 'LİR'],
  ['KA', 'LIR'],
  ['A', 'LIR'],
  ['O', 'LUR'],
  ['BU', 'LUR'],
  ['DU', 'RUR'],
  ['KU', 'RUR'],
  ['VU', 'RUR'],
  ['GÖ', 'RÜR'],
  ['Ö', 'RÜR'],
  ['YÜ', 'RÜR'],
  ['SÜ', 'RÜR'],
  ['ÇÜ', 'RÜR'],
  ['VE', 'RİR'],
  ['E', 'RİR'],
  ['SE', 'RİR'],
  ['GE', 'ÇER'],
  ['SE', 'ÇER'],
  ['Bİ', 'ÇER'],
  ['İ', 'ÇER'],
  ['U', 'ÇAR'],
  ['A', 'ÇAR'],
  ['KA', 'ÇAR'],
  ['SA', 'ÇAR'],
  ['KO', 'ŞAR'],
  ['CO', 'ŞAR'],
  ['TA', 'ŞAR'],
  ['YA', 'ŞAR'],
  ['A', 'ŞAR'],
  ['ŞA', 'ŞAR'],
  ['BA', 'ŞAR'],
  ['KA', 'ŞAR'],
  ['ÇÖ', 'ZER'],
  ['GÖ', 'ZER'],
  ['SÜ', 'ZER'],
  ['YÜ', 'ZER'],
  ['DÜ', 'ZER'],
  ['Ü', 'ZER'],
  ['GE', 'ZER'],
  ['SE', 'ZER'],
  ['E', 'ZER'],
  ['BE', 'ZER'],
  ['YA', 'ZAR'],
  ['KA', 'ZAR'],
  ['PA', 'ZAR'],
  ['NA', 'ZAR'],
  ['BO', 'ZAR'],
  ['TO', 'ZAR'],
  ['KI', 'ZAR'],
  ['SI', 'ZAR'],
  ['U', 'ZAR'],
  ['TU', 'ZAR'],
  ['KA', 'pı'.toLocaleUpperCase('tr-TR')],
  ['DO', 'KUZ'],
  ['SE', 'KİZ'],
  ['YE', 'Dİ'],
  ['AL', 'TI'],
  ['BE', 'Şİ'],
  ['DÖR', 'DÜ'],
  ['Ü', 'ÇÜ'],
  ['Bİ', 'Rİ'],
  ['YÜ', 'ZÜ'],
  ['Bİ', 'Nİ'],
  ['KA', 'TI'],
  ['SA', 'TI'],
  ['BA', 'TI'],
  ['ÇА', 'TI'.replace('А', 'A')],
  ['ÇA', 'TI'],
  ['YA', 'TI'],
  ['TA', 'TI'],
  ['KA', 'şı'.toLocaleUpperCase('tr-TR')],
  ['BA', 'ŞI'],
  ['TA', 'ŞI'],
  ['YA', 'ŞI'],
  ['A', 'ŞI'],
  ['KI', 'ŞI'],
  ['DI', 'ŞI'],
  ['KO', 'ŞU'],
  ['KU', 'ŞU'],
  ['TU', 'ŞU'],
  ['DU', 'ŞU'],
  ['BO', 'ŞU'],
  ['HO', 'ŞU'],
  ['DO', 'LU'],
  ['SO', 'LU'],
  ['KO', 'LU'],
  ['BO', 'LU'],
  ['YO', 'LU'],
  ['KU', 'LU'],
  ['PU', 'LU'],
  ['DU', 'LU'],
  ['ÇU', 'LU'],
  ['GÜ', 'LÜ'],
  ['KÜ', 'LÜ'],
  ['TÜ', 'LÜ'],
  ['Dİ', 'Lİ'],
  ['Bİ', 'Lİ'],
  ['Fİ', 'Lİ'],
  ['Kİ', 'Lİ'],
  ['Pİ', 'Lİ'],
  ['Sİ', 'Lİ'],
  ['Zİ', 'Lİ'],
  ['E', 'Lİ'],
  ['BE', 'Lİ'],
  ['DE', 'Lİ'],
  ['GE', 'Lİ'],
  ['SE', 'Lİ'],
  ['TE', 'Lİ'],
  ['YE', 'Lİ'],
  ['KE', 'Lİ'],
  ['KA', 'Lİ'],
  ['HA', 'Lİ'],
  ['MA', 'Lİ'],
  ['VA', 'Lİ'],
  ['A', 'Lİ'],
  ['BA', 'Lİ'],
  ['TA', 'Lİ'],
  ['SA', 'Lİ'],
  ['DA', 'Lİ']
];

function buildValidatedDictionary(rawList) {
  const seen = new Set();
  const clean = [];

  for (const entry of rawList) {
    if (!Array.isArray(entry)) continue;
    const syllables = entry.map((s) => String(s).trim().toLocaleUpperCase('tr-TR'));

    if (!isValidSyllableEntry(syllables, false)) {
      continue;
    }

    const key = syllables.join('-');
    if (!seen.has(key)) {
      seen.add(key);
      clean.push({
        syllables,
        word: syllables.join(''),
        key,
        length: syllables.length
      });
    }
  }
  return clean;
}

export const DICTIONARY = buildValidatedDictionary(RAW_DICTIONARY);

export const WORD_BY_SYLLABLE_KEY = new Map();
export const WORD_BY_JOINED = new Map();
export const STARTER_ENDER_POOL = [];

const twoSyllableByFirst = new Map();
const twoSyllableBySecond = new Map();
const threeSyllableByPair12 = new Map();
const threeSyllableByPair23 = new Map();
const threeSyllableByPair13 = new Map();

function addToMapArray(map, key, val) {
  if (!map.has(key)) map.set(key, []);
  const arr = map.get(key);
  if (!arr.includes(val)) arr.push(val);
}

for (const item of DICTIONARY) {
  indexDictionaryItem(item, true);
}

export const TOTAL_TDK_WORD_COUNT = TDK_WORD_SET.size + DICTIONARY.length;

// Kullanıcının localStorage'a kaydettiği özel Türkçe kelimeleri yükle
const CUSTOM_WORDS_STORAGE_KEY = 'hece_zinciri_custom_words_v1';
try {
  if (typeof localStorage !== 'undefined') {
    const savedCustom = JSON.parse(localStorage.getItem(CUSTOM_WORDS_STORAGE_KEY) || '[]');
    if (Array.isArray(savedCustom)) {
      savedCustom.forEach((w) => registerCustomTurkishWord(w, false));
    }
  }
} catch {
  // ignore
}

function indexDictionaryItem(item, addToStarterPool = false) {
  WORD_BY_SYLLABLE_KEY.set(item.key, item);
  if (!WORD_BY_JOINED.has(item.word)) {
    WORD_BY_JOINED.set(item.word, item);
  }
  TDK_WORD_SET.add(item.word);

  const { syllables } = item;
  if (addToStarterPool) {
    STARTER_ENDER_POOL.push(syllables[0]);
    STARTER_ENDER_POOL.push(syllables[syllables.length - 1]);
  }

  if (syllables.length === 2) {
    const [a, b] = syllables;
    addToMapArray(twoSyllableByFirst, a, b);
    addToMapArray(twoSyllableBySecond, b, a);
  } else if (syllables.length === 3) {
    const [a, b, c] = syllables;
    addToMapArray(threeSyllableByPair12, `${a}-${b}`, c);
    addToMapArray(threeSyllableByPair23, `${b}-${c}`, a);
    addToMapArray(threeSyllableByPair13, `${a}-${c}`, b);
    addToMapArray(twoSyllableByFirst, a, b);
    addToMapArray(twoSyllableBySecond, b, a);
    addToMapArray(twoSyllableByFirst, b, c);
    addToMapArray(twoSyllableBySecond, c, b);
  }
}

/**
 * Oyuncunun girdiği 2..5 heceli Türkçe kelimeyi resmi heceleme kuralıyla ayırıp sözlüğe ekler
 */
export function registerCustomTurkishWord(rawWord, persist = true) {
  const cleanWord = String(rawWord || '').trim().toLocaleUpperCase('tr-TR').replace(/[\s-]+/g, '');
  const syllables = syllabifyTurkishWord(cleanWord, 5);
  if (!syllables || syllables.length < 2 || syllables.length > 5) {
    return { ok: false, error: 'Kelime 2 ile 5 hece arasında geçerli bir Türkçe kelime olmalıdır.' };
  }
  const key = syllables.join('-');
  TDK_WORD_SET.add(cleanWord);
  if (WORD_BY_SYLLABLE_KEY.has(key)) {
    return { ok: true, entry: WORD_BY_SYLLABLE_KEY.get(key), alreadyExists: true };
  }
  const entry = {
    syllables,
    word: syllables.join(''),
    key,
    length: syllables.length,
    isCustom: true
  };
  DICTIONARY.unshift(entry);
  indexDictionaryItem(entry, true);

  if (persist && typeof localStorage !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem(CUSTOM_WORDS_STORAGE_KEY) || '[]');
      if (!existing.includes(entry.word)) {
        existing.push(entry.word);
        localStorage.setItem(CUSTOM_WORDS_STORAGE_KEY, JSON.stringify(existing));
      }
    } catch {
      // ignore
    }
  }
  return { ok: true, entry, alreadyExists: false };
}

/**
 * Bir hecenin sözlükte kaç farklı kelimede yer aldığını ve örnek kelimelerini döndürür
 */
export function getWordsContainingSyllable(syl) {
  if (!syl) return [];
  return DICTIONARY.filter((d) => d.syllables.includes(syl));
}

/**
 * Tahtadaki bir taşa dokunulduğunda yanına gelebilecek "Tamamlayıcı Heceleri" döndürür
 * (Oyuncunun taktiksel tuzak kurabilmesi için: Örn: KA -> [LEM, BAK, SA, PI, RA...])
 */
export function getTacticalCompletionHints(syllable) {
  if (!syllable) return { rightOrDown: [], leftOrUp: [] };
  const rightOrDown = (twoSyllableByFirst.get(syllable) || []).slice(0, 7);
  const leftOrUp = (twoSyllableBySecond.get(syllable) || []).slice(0, 7);
  return { rightOrDown, leftOrUp };
}

/**
 * Gökkuşağı Joker Taşı ('*') tahtada (r, c) hücresine bırakıldığında,
 * o hücrede en çok kelime patlatacak veya en yüksek puanı getirecek gerçek Türkçe heceyi bulur!
 */
export function resolveWildcardSyllableForCell(grid, r, c) {
  const SIZE = 5;
  const candidateSyllables = new Set();

  // Komşu hücrelerdeki hecelerden olası tüm tamamlayıcı adayları topla
  const neighbors = [
    grid[r]?.[c - 1],
    grid[r]?.[c + 1],
    grid[r - 1]?.[c],
    grid[r + 1]?.[c]
  ].filter(Boolean);

  for (const n of neighbors) {
    (twoSyllableByFirst.get(n) || []).forEach((s) => candidateSyllables.add(s));
    (twoSyllableBySecond.get(n) || []).forEach((s) => candidateSyllables.add(s));
  }

  // Ayrıca genel kurtarıcı adayları da ekle
  findSaviorSyllables(grid).forEach((s) => candidateSyllables.add(s.syllable));

  // Hiç komşu yoksa yüksek frekanslı joker heceler
  ['KA', 'LA', 'RA', 'MA', 'SA', 'BA', 'TA', 'LAR', 'LER', 'LIK'].forEach((s) =>
    candidateSyllables.add(s)
  );

  let bestSyllable = 'KA';
  let bestScore = -1;

  for (const cand of candidateSyllables) {
    let score = 0;
    // Yatay kontrol
    for (let start = 0; start <= SIZE - 2; start++) {
      const s1 = start === c ? cand : grid[r][start];
      const s2 = start + 1 === c ? cand : grid[r][start + 1];
      if (s1 && s2 && matchSyllableSequence([s1, s2])) score += 100;
    }
    for (let start = 0; start <= SIZE - 3; start++) {
      const s1 = start === c ? cand : grid[r][start];
      const s2 = start + 1 === c ? cand : grid[r][start + 1];
      const s3 = start + 2 === c ? cand : grid[r][start + 2];
      if (s1 && s2 && s3 && matchSyllableSequence([s1, s2, s3])) score += 180;
    }
    // Dikey kontrol
    for (let start = 0; start <= SIZE - 2; start++) {
      const s1 = start === r ? cand : grid[start][c];
      const s2 = start + 1 === r ? cand : grid[start + 1][c];
      if (s1 && s2 && matchSyllableSequence([s1, s2])) score += 100;
    }
    for (let start = 0; start <= SIZE - 3; start++) {
      const s1 = start === r ? cand : grid[start][c];
      const s2 = start + 1 === r ? cand : grid[start + 1][c];
      const s3 = start + 2 === r ? cand : grid[start + 2][c];
      if (s1 && s2 && s3 && matchSyllableSequence([s1, s2, s3])) score += 180;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSyllable = cand;
    }
  }

  return bestSyllable;
}

const COMMON_TR_SUFFIXES = [
  'LAR', 'LER', 'LIK', 'LİK', 'LUK', 'LÜK',
  'SIZ', 'SİZ', 'SUZ', 'SÜZ',
  'DAN', 'DEN', 'TAN', 'TEN',
  'LI', 'Lİ', 'LU', 'LÜ',
  'DA', 'DE', 'TA', 'TE',
  'CI', 'Cİ', 'CU', 'CÜ', 'ÇI', 'Çİ', 'ÇU', 'ÇÜ'
];

/**
 * Verilen 2, 3, 4 veya 5 heceli dizilimin 59.328+ kelimelik TDK sözlüğünde
 * (veya çekimli Türkçe kelime olarak) geçerli olup olmadığını O(1) hızında kontrol eder.
 */
export function matchSyllableSequence(seq) {
  if (!seq || seq.length < 2 || seq.length > 5) return null;
  if (seq.some((s) => !s)) return null;

  const exactKey = seq.join('-');
  if (WORD_BY_SYLLABLE_KEY.has(exactKey)) {
    return WORD_BY_SYLLABLE_KEY.get(exactKey);
  }

  const joined = seq.join('');
  if (WORD_BY_JOINED.has(joined)) {
    return WORD_BY_JOINED.get(joined);
  }

  // 59.328+ TDK Kelime Kümesinde doğrudan kontrol
  if (TDK_WORD_SET.has(joined)) {
    const entry = { syllables: [...seq], word: joined, key: exactKey, length: seq.length };
    WORD_BY_SYLLABLE_KEY.set(exactKey, entry);
    return entry;
  }

  // Türkçe sondan eklemeli (çekimli) kelime kontrolü:
  // Eğer son hece yaygın bir Türkçe ek ise ve kök TDK sözlüğünde en az 3 harfli geçerli bir kelimeyse kabul et!
  for (const suffix of COMMON_TR_SUFFIXES) {
    if (joined.length >= suffix.length + 3 && joined.endsWith(suffix)) {
      const root = joined.slice(0, -suffix.length);
      if (TDK_WORD_SET.has(root)) {
        const entry = { syllables: [...seq], word: joined, key: exactKey, length: seq.length };
        WORD_BY_SYLLABLE_KEY.set(exactKey, entry);
        return entry;
      }
    }
  }

  return null;
}

/**
 * 59.328+ Kelimelik TDK Sözlüğünde canlı arama ve filtreleme yapar
 */
export function searchTdkDictionary(query, filter = 'all', discoveredWords = [], limit = 240) {
  const q = String(query || '').trim().toLocaleUpperCase('tr-TR').replace(/-/g, '');
  const results = [];
  const seenWords = new Set();

  // 1. Önce çekirdek ve özel eklenen kelimelerde ara
  for (const item of DICTIONARY) {
    if (filter === 'discovered' && !discoveredWords.includes(item.word)) continue;
    if (filter === '2' && item.length !== 2) continue;
    if (filter === '3' && item.length !== 3) continue;
    if (filter === '4+' && item.length < 4) continue;
    if (q && !item.word.includes(q) && !item.key.includes(q)) continue;

    seenWords.add(item.word);
    results.push(item);
    if (results.length >= limit) return results;
  }

  // 2. Ardından 59.328 kelimelik tam TDK listesinde ara
  for (let i = 0; i < TDK_WORD_LIST.length; i++) {
    const w = TDK_WORD_LIST[i];
    if (seenWords.has(w)) continue;
    if (filter === 'discovered' && !discoveredWords.includes(w)) continue;
    if (q && !w.includes(q)) continue;

    const syls = syllabifyTurkishWord(w, 5);
    if (!syls) continue;
    if (filter === '2' && syls.length !== 2) continue;
    if (filter === '3' && syls.length !== 3) continue;
    if (filter === '4+' && syls.length < 4) continue;

    seenWords.add(w);
    results.push({
      syllables: syls,
      word: w,
      key: syls.join('-'),
      length: syls.length
    });
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Tahtadaki mevcut heceleri tarayarak etrafında boş hücre bulunan ve doğrudan
 * kelime patlatabilecek (veya 3 heceli kelimeyi tamamlayabilecek) "Kurtarıcı Heceleri" bulur.
 */
export function findSaviorSyllables(grid) {
  const SIZE = 5;
  const candidateMap = new Map();

  const registerCandidate = (syllable, weightBoost, r, c) => {
    if (!syllable) return;
    if (!candidateMap.has(syllable)) {
      candidateMap.set(syllable, {
        syllable,
        weight: 0,
        targetCell: { r, c }
      });
    }
    const entry = candidateMap.get(syllable);
    entry.weight += weightBoost;
  };

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const current = grid[r][c];

      if (current) {
        if (c + 1 < SIZE && !grid[r][c + 1]) {
          const rightMatches = twoSyllableByFirst.get(current) || [];
          for (const s of rightMatches) {
            const isImmediateWord = WORD_BY_SYLLABLE_KEY.has(`${current}-${s}`);
            registerCandidate(s, isImmediateWord ? 4 : 1, r, c + 1);
          }
        }
        if (c - 1 >= 0 && !grid[r][c - 1]) {
          const leftMatches = twoSyllableBySecond.get(current) || [];
          for (const s of leftMatches) {
            const isImmediateWord = WORD_BY_SYLLABLE_KEY.has(`${s}-${current}`);
            registerCandidate(s, isImmediateWord ? 4 : 1, r, c - 1);
          }
        }
        if (r + 1 < SIZE && !grid[r + 1][c]) {
          const downMatches = twoSyllableByFirst.get(current) || [];
          for (const s of downMatches) {
            const isImmediateWord = WORD_BY_SYLLABLE_KEY.has(`${current}-${s}`);
            registerCandidate(s, isImmediateWord ? 4 : 1, r + 1, c);
          }
        }
        if (r - 1 >= 0 && !grid[r - 1][c]) {
          const upMatches = twoSyllableBySecond.get(current) || [];
          for (const s of upMatches) {
            const isImmediateWord = WORD_BY_SYLLABLE_KEY.has(`${s}-${current}`);
            registerCandidate(s, isImmediateWord ? 4 : 1, r - 1, c);
          }
        }
      }

      if (c + 2 < SIZE) {
        const s1 = grid[r][c];
        const s2 = grid[r][c + 1];
        const s3 = grid[r][c + 2];

        if (s1 && s2 && !s3) {
          const matches = threeSyllableByPair12.get(`${s1}-${s2}`) || [];
          matches.forEach((m) => registerCandidate(m, 6, r, c + 2));
        } else if (!s1 && s2 && s3) {
          const matches = threeSyllableByPair23.get(`${s2}-${s3}`) || [];
          matches.forEach((m) => registerCandidate(m, 6, r, c));
        } else if (s1 && !s2 && s3) {
          const matches = threeSyllableByPair13.get(`${s1}-${s3}`) || [];
          matches.forEach((m) => registerCandidate(m, 7, r, c + 1));
        }
      }

      if (r + 2 < SIZE) {
        const s1 = grid[r][c];
        const s2 = grid[r + 1][c];
        const s3 = grid[r + 2][c];

        if (s1 && s2 && !s3) {
          const matches = threeSyllableByPair12.get(`${s1}-${s2}`) || [];
          matches.forEach((m) => registerCandidate(m, 6, r + 2, c));
        } else if (!s1 && s2 && s3) {
          const matches = threeSyllableByPair23.get(`${s2}-${s3}`) || [];
          matches.forEach((m) => registerCandidate(m, 6, r, c));
        } else if (s1 && !s2 && s3) {
          const matches = threeSyllableByPair13.get(`${s1}-${s3}`) || [];
          matches.forEach((m) => registerCandidate(m, 7, r + 1, c));
        }
      }
    }
  }

  return Array.from(candidateMap.values()).sort((a, b) => b.weight - a.weight);
}

function pickWeightedCandidate(candidates, excludeSet) {
  const pool = candidates.filter((c) => !excludeSet.has(c.syllable));
  if (pool.length === 0) return null;

  const topPool = pool.slice(0, 18);
  const totalWeight = topPool.reduce((acc, item) => acc + item.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const item of topPool) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return topPool[0];
}

/**
 * Yüksek Dopaminli Kurtarıcı Akıllı Hece Üretici:
 * Oyuncunun hiç sıkılmadan arka arkaya kombo ve patlama yapabilmesi için:
 * 1. Tahtada taş varsa, hemen kelime patlatabilecek 2 kurtarıcı heceyi öncelikle seçer.
 * 2. Eğer tahtada sadece 1 kurtarıcı varsa (veya tahta boşsa), kalan 2 taşı kendi aralarında
 *    doğrudan kelime oluşturacak bir çift (Örn: KA + LEM, DO + LAR, Çİ + ÇEK) olarak verir!
 * 3. Ayrıca her elde yüksek olasılıkla Özel Güç Taşı (🌈 Joker *, 💣 3x3 Bomba, 💎 2x Elmas) üretir.
 */
export function generateSmartTray(grid) {
  const saviors = findSaviorSyllables(grid);
  const chosen = [];
  const chosenSet = new Set();

  if (saviors.length > 0) {
    // 1. slot: En güçlü kurtarıcı hece
    const firstSavior = pickWeightedCandidate(saviors, chosenSet);
    if (firstSavior) {
      chosen.push({ syllable: firstSavior.syllable, isSavior: true });
      chosenSet.add(firstSavior.syllable);
    }

    // 2. slot: İkinci bir kurtarıcı hece (%92 olasılıkla!)
    if (saviors.length > 1 && Math.random() < 0.92) {
      const secondSavior = pickWeightedCandidate(saviors, chosenSet);
      if (secondSavior) {
        chosen.push({ syllable: secondSavior.syllable, isSavior: true });
        chosenSet.add(secondSavior.syllable);
      }
    }
  }

  // Eğer hala 1 veya 0 taş seçildiyse, kalan 2 slotu kendi aralarında hemen patlayacak
  // 2 heceli bir kelimenin parçaları olarak doldur!
  if (chosen.length <= 1) {
    const twoSylWords = DICTIONARY.filter((d) => d.length === 2);
    const randomWord = twoSylWords[Math.floor(Math.random() * twoSylWords.length)];
    if (randomWord) {
      for (const syl of randomWord.syllables) {
        if (chosen.length < 3 && !chosenSet.has(syl)) {
          chosen.push({ syllable: syl, isSavior: true });
          chosenSet.add(syl);
        }
      }
    }
  }

  // 3. slot: Eğer 3. slot boşsa ve 3. bir kurtarıcı aday varsa %65 ihtimalle onu koy, yoksa yüksek frekanslı hece koy
  if (chosen.length < 3 && saviors.length > 2 && Math.random() < 0.65) {
    const thirdSavior = pickWeightedCandidate(saviors, chosenSet);
    if (thirdSavior) {
      chosen.push({ syllable: thirdSavior.syllable, isSavior: true });
      chosenSet.add(thirdSavior.syllable);
    }
  }

  let safety = 0;
  while (chosen.length < 3 && safety < 50) {
    safety++;
    const randomSyl = STARTER_ENDER_POOL[Math.floor(Math.random() * STARTER_ENDER_POOL.length)];
    if (randomSyl && !chosenSet.has(randomSyl)) {
      chosen.push({ syllable: randomSyl, isSavior: false });
      chosenSet.add(randomSyl);
    }
  }

  const FALLBACKS = ['KA', 'RA', 'MA', 'SA', 'LA', 'TA', 'BA', 'LEM', 'LIK', 'LAR'];
  for (const fb of FALLBACKS) {
    if (chosen.length >= 3) break;
    if (!chosenSet.has(fb)) {
      chosen.push({ syllable: fb, isSavior: false });
      chosenSet.add(fb);
    }
  }

  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  let filledCount = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r]?.[c]) filledCount++;
    }
  }

  const stamp = Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const powerSlotIndex = Math.floor(Math.random() * chosen.length);
  const roll = Math.random();
  // Yüksek aksiyon için özel güç taşları daha sık gelir!
  const wildcardChance = filledCount >= 8 ? 0.28 : 0.16;
  const bombChance = wildcardChance + (filledCount >= 6 ? 0.26 : 0.20);
  const diamondChance = bombChance + 0.28;

  return chosen.map((item, idx) => {
    let powerType = null;
    let syllable = item.syllable;

    if (idx === powerSlotIndex) {
      if (roll < wildcardChance) {
        powerType = 'wildcard';
        syllable = '*';
      } else if (roll < bombChance) {
        powerType = 'bomb';
      } else if (roll < diamondChance) {
        powerType = 'diamond';
      }
    }

    return {
      id: `tile-${stamp}-${idx}`,
      syllable,
      isSavior: item.isSavior || powerType === 'wildcard',
      powerType,
      placed: false
    };
  });
}
