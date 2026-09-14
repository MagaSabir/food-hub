import { Prisma } from '@prisma/client';
import { getEffectivePrice } from './pricing';

const money = (n: number | string) => new Prisma.Decimal(n);
const NOW = new Date('2026-08-04T12:00:00Z');

describe('getEffectivePrice', () => {
  it('без скидки — обычная цена, зачёркнутой нет', () => {
    const result = getEffectivePrice(
      { price: money(590), discountPrice: null, discountUntil: null },
      NOW,
    );
    expect(result.price.toNumber()).toBe(590);
    expect(result.oldPrice).toBeNull();
  });

  it('бессрочная скидка (discountUntil = null) действует', () => {
    const result = getEffectivePrice(
      { price: money(540), discountPrice: money(449), discountUntil: null },
      NOW,
    );
    expect(result.price.toNumber()).toBe(449);
    expect(result.oldPrice!.toNumber()).toBe(540);
  });

  it('скидка со сроком в будущем действует', () => {
    const result = getEffectivePrice(
      {
        price: money(540),
        discountPrice: money(449),
        discountUntil: new Date('2026-08-05T00:00:00Z'),
      },
      NOW,
    );
    expect(result.price.toNumber()).toBe(449);
  });

  it('истёкшая скидка НЕ применяется', () => {
    const result = getEffectivePrice(
      {
        price: money(540),
        discountPrice: money(449),
        discountUntil: new Date('2026-08-03T23:59:00Z'),
      },
      NOW,
    );
    expect(result.price.toNumber()).toBe(540);
    expect(result.oldPrice).toBeNull();
  });

  it('момент окончания — уже без скидки', () => {
    const result = getEffectivePrice(
      { price: money(540), discountPrice: money(449), discountUntil: NOW },
      NOW,
    );
    expect(result.price.toNumber()).toBe(540);
  });

  it.each([
    ['дороже обычной', 700],
    ['равна обычной', 540],
  ])('«скидка» %s игнорируется', (_case, discount) => {
    const result = getEffectivePrice(
      {
        price: money(540),
        discountPrice: money(discount),
        discountUntil: null,
      },
      NOW,
    );
    expect(result.price.toNumber()).toBe(540);
    expect(result.oldPrice).toBeNull();
  });

  it('копейки не теряются (Decimal, а не float)', () => {
    const result = getEffectivePrice(
      {
        price: money('590.10'),
        discountPrice: money('449.99'),
        discountUntil: null,
      },
      NOW,
    );
    expect(result.price.toFixed(2)).toBe('449.99');
    expect(result.oldPrice!.toFixed(2)).toBe('590.10');
  });
});
