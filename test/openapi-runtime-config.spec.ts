import { envValidationSchema } from '../src/common/validators/env.validator';

describe('runtime OpenAPI configuration', () => {
  const schema = envValidationSchema.extract('OPENAPI_RUNTIME_ENABLED');
  it('is disabled when not configured', () => {
    expect(schema.validate(undefined).value).toBe(false);
  });
  it.each([['true', true], ['false', false]])('parses %s as a boolean', (input, expected) => {
    const result = schema.validate(input);
    expect(result.error).toBeUndefined();
    expect(result.value).toBe(expected);
  });
  it('rejects invalid configuration', () => {
    expect(schema.validate('invalid').error).toBeDefined();
  });
});
