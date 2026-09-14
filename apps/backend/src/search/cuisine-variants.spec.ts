import { cuisineVariants } from './cuisine-variants';

describe('cuisineVariants', () => {
  it('к набранному добавляет вариант с заглавной', () => {
    expect(cuisineVariants('суши')).toEqual(['суши', 'Суши']);
  });

  it('набранному с заглавной добавляет строчный', () => {
    expect(cuisineVariants('Суши')).toEqual(['Суши', 'суши']);
  });

  it('КАПС приводит к обоим обычным написаниям', () => {
    expect(cuisineVariants('СУШИ')).toEqual(['СУШИ', 'суши', 'Суши']);
  });

  it('не повторяет одно и то же написание дважды', () => {
    expect(cuisineVariants('Пицца')).toEqual(['Пицца', 'пицца']);
  });

  it('пробелы по краям не считаются частью названия', () => {
    expect(cuisineVariants('  суши ')).toEqual(['суши', 'Суши']);
  });
});
