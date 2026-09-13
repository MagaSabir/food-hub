import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('разные записи одного номера дают ОДИН ключ', () => {
    const expected = '+79280000000';

    expect(normalizePhone('+79280000000')).toBe(expected);
    expect(normalizePhone('89280000000')).toBe(expected);
    expect(normalizePhone('79280000000')).toBe(expected);
    expect(normalizePhone('+7 (928) 000-00-00')).toBe(expected);
    expect(normalizePhone('8 928 000 00 00')).toBe(expected);
  });

  describe('отвергает', () => {
    it('слишком короткий', () => {
      expect(normalizePhone('+7928000')).toBeNull();
    });

    it('слишком длинный', () => {
      expect(normalizePhone('+792800000001')).toBeNull();
    });

    it('нероссийский код страны', () => {
      expect(normalizePhone('+12125550100')).toBeNull();
    });

    it('пустую строку и текст', () => {
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone('телефон')).toBeNull();
    });
  });
});
