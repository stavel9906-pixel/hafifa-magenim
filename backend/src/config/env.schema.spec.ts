import { envSchema } from './env.schema.js';

const validEnv = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'secret',
  DB_NAME: 'drone_simulation',
};

describe('envSchema', () => {
  it('applies defaults and converts numeric strings to numbers', () => {
    const env = envSchema.parse({ ...validEnv, DB_PORT: '5433' });

    expect(env.PORT).toBe(3001);
    expect(env.DB_PORT).toBe(5433);
    expect(env.NODE_ENV).toBe('development');
  });

  it.each(['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'] as const)(
    'rejects a missing %s',
    (key) => {
      const { [key]: _omitted, ...rest } = validEnv;
      expect(envSchema.safeParse(rest).success).toBe(false);
    },
  );

  it('defaults CORS_ORIGINS to the Vite dev server', () => {
    expect(envSchema.parse(validEnv).CORS_ORIGINS).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('splits a comma-separated CORS_ORIGINS list and trims spaces', () => {
    const env = envSchema.parse({
      ...validEnv,
      CORS_ORIGINS: 'http://localhost:5173, https://drones.example.com',
    });

    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'https://drones.example.com',
    ]);
  });

  it.each(['not-a-url', ' , '])('rejects CORS_ORIGINS "%s"', (value) => {
    expect(
      envSchema.safeParse({ ...validEnv, CORS_ORIGINS: value }).success,
    ).toBe(false);
  });

  it('defaults the simulation to enabled, every 5 seconds', () => {
    const env = envSchema.parse(validEnv);

    expect(env.SIMULATION_ENABLED).toBe(true);
    expect(env.SIMULATION_INTERVAL_MS).toBe(5000);
  });

  it.each([
    ['false', false],
    ['true', true],
  ])('parses SIMULATION_ENABLED="%s" as %s', (value, expected) => {
    const env = envSchema.parse({ ...validEnv, SIMULATION_ENABLED: value });

    expect(env.SIMULATION_ENABLED).toBe(expected);
  });

  it.each(['yes-please', ''])(
    'rejects an invalid SIMULATION_ENABLED "%s"',
    (value) => {
      expect(
        envSchema.safeParse({ ...validEnv, SIMULATION_ENABLED: value }).success,
      ).toBe(false);
    },
  );

  it('rejects a simulation interval below 100 ms', () => {
    expect(
      envSchema.safeParse({ ...validEnv, SIMULATION_INTERVAL_MS: '50' })
        .success,
    ).toBe(false);
  });

  it.each(['0', '70000', 'abc'])('rejects an invalid port "%s"', (port) => {
    expect(envSchema.safeParse({ ...validEnv, PORT: port }).success).toBe(
      false,
    );
  });
});
