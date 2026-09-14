import { getOpenState, parseWorkingHours } from './working-hours';

const TZ = 'Europe/Moscow';

const moscow = (isoUtc: string) => new Date(isoUtc);

const TUESDAY = '2026-08-04';
const WEDNESDAY = '2026-08-05';

const dayAndNight = {
  tue: [{ from: '10:00', to: '22:00' }],
  wed: [{ from: '10:00', to: '22:00' }],
};

describe('getOpenState', () => {
  it('внутри интервала — открыто, closesAt = конец интервала', () => {
    expect(
      getOpenState(dayAndNight, moscow(`${TUESDAY}T09:00:00Z`), TZ),
    ).toEqual({
      isOpen: true,
      closesAt: '22:00',
    });
  });

  it('до открытия — закрыто', () => {
    expect(
      getOpenState(dayAndNight, moscow(`${TUESDAY}T06:59:00Z`), TZ),
    ).toEqual({
      isOpen: false,
      closesAt: null,
    });
  });

  it('момент открытия — уже открыто, момент закрытия — уже закрыто', () => {
    expect(
      getOpenState(dayAndNight, moscow(`${TUESDAY}T07:00:00Z`), TZ).isOpen,
    ).toBe(true);
    expect(
      getOpenState(dayAndNight, moscow(`${TUESDAY}T19:00:00Z`), TZ).isOpen,
    ).toBe(false);
  });

  it('часовой пояс: 23:00 UTC — это уже 02:00 среды по Москве', () => {
    expect(
      getOpenState(dayAndNight, moscow(`${TUESDAY}T23:00:00Z`), TZ).isOpen,
    ).toBe(false);
  });

  it('несколько интервалов за день (обеденный перерыв)', () => {
    const withBreak = {
      tue: [
        { from: '08:00', to: '12:00' },
        { from: '16:00', to: '23:00' },
      ],
    };
    expect(
      getOpenState(withBreak, moscow(`${TUESDAY}T10:00:00Z`), TZ).isOpen,
    ).toBe(false);
    expect(getOpenState(withBreak, moscow(`${TUESDAY}T14:00:00Z`), TZ)).toEqual(
      {
        isOpen: true,
        closesAt: '23:00',
      },
    );
  });

  describe('ночной интервал 22:00–02:00', () => {
    const night = { tue: [{ from: '22:00', to: '02:00' }] };

    it('после полуночи открыто по ВЧЕРАШНЕМУ интервалу', () => {
      expect(getOpenState(night, moscow(`${TUESDAY}T22:00:00Z`), TZ)).toEqual({
        isOpen: true,
        closesAt: '02:00',
      });
    });

    it('в 02:00 вчерашний хвост закончился', () => {
      expect(
        getOpenState(night, moscow(`${TUESDAY}T23:00:00Z`), TZ).isOpen,
      ).toBe(false);
    });

    it('вечером того же дня после 22:00 — открыто', () => {
      expect(getOpenState(night, moscow(`${TUESDAY}T20:00:00Z`), TZ)).toEqual({
        isOpen: true,
        closesAt: '02:00',
      });
    });

    it('днём среды закрыто (у среды своего интервала нет)', () => {
      expect(
        getOpenState(night, moscow(`${WEDNESDAY}T12:00:00Z`), TZ).isOpen,
      ).toBe(false);
    });
  });

  it('выходной (дня нет в графике) — закрыто', () => {
    expect(
      getOpenState(
        { mon: [{ from: '10:00', to: '22:00' }] },
        moscow(`${TUESDAY}T09:00:00Z`),
        TZ,
      ),
    ).toEqual({ isOpen: false, closesAt: null });
  });

  it.each([
    ['null', null],
    ['строка', 'круглосуточно'],
    ['массив', [{ from: '10:00', to: '22:00' }]],
    ['мусор в интервале', { tue: [{ from: '25:00', to: 'вечер' }] }],
    ['нулевой интервал from=to', { tue: [{ from: '10:00', to: '10:00' }] }],
  ])('битый график (%s) — считаем ЗАКРЫТО', (_case, raw) => {
    expect(getOpenState(raw, moscow(`${TUESDAY}T09:00:00Z`), TZ).isOpen).toBe(
      false,
    );
  });

  it('битый интервал не роняет соседний валидный', () => {
    const mixed = {
      tue: [
        { from: 'ерунда', to: '12:00' },
        { from: '10:00', to: '22:00' },
      ],
    };
    expect(getOpenState(mixed, moscow(`${TUESDAY}T09:00:00Z`), TZ).isOpen).toBe(
      true,
    );
  });
});

describe('parseWorkingHours', () => {
  it('оставляет только валидные дни и интервалы', () => {
    expect(
      parseWorkingHours({
        mon: [{ from: '10:00', to: '22:00' }],
        tue: 'открыто',
        wed: [{ from: '10:00' }],
        холодец: [{ from: '10:00', to: '22:00' }],
      }),
    ).toEqual({ mon: [{ from: '10:00', to: '22:00' }] });
  });
});
