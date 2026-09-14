import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CatalogSort } from '@foodhubme/shared';
import { CatalogQueryInputDto } from './catalog-query.input-dto';

const parse = (query: Record<string, string>) => {
  const dto = plainToInstance(CatalogQueryInputDto, query, {
    enableImplicitConversion: true,
  });
  return {
    dto,
    errors: validateSync(dto, { whitelist: true, stopAtFirstError: true }),
  };
};

describe('CatalogQueryInputDto', () => {
  it('пустой query — все фильтры не заданы, ошибок нет', () => {
    const { dto, errors } = parse({});
    expect(errors).toHaveLength(0);
    expect(dto).toEqual({});
  });

  it('open=true → true', () => {
    const { dto, errors } = parse({ open: 'true' });
    expect(errors).toHaveLength(0);
    expect(dto.open).toBe(true);
  });

  it('open=false → false, а НЕ true', () => {
    const { dto, errors } = parse({ open: 'false' });
    expect(errors).toHaveLength(0);
    expect(dto.open).toBe(false);
  });

  it('open=мусор — ошибка валидации, а не «как-нибудь»', () => {
    const { errors } = parse({ open: 'да' });
    expect(errors[0].constraints).toEqual({
      isBoolean: 'open: true или false',
    });
  });

  it('sort принимает только известные значения', () => {
    expect(parse({ sort: 'rating' }).dto.sort).toBe(CatalogSort.RATING);
    expect(parse({ sort: 'xxx' }).errors[0].constraints).toEqual({
      isEnum: 'sort: name, rating, reviews или delivery',
    });
  });

  it('cuisine и city — строки с ограничением длины', () => {
    expect(parse({ cuisine: 'Суши', city: 'grozny' }).errors).toHaveLength(0);
    expect(
      parse({ cuisine: 'я'.repeat(51) }).errors[0].constraints,
    ).toHaveProperty('maxLength');
  });
});
