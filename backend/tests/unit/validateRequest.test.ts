// Unit test validateRequest middleware (tests/unit). Zod validation + AppError output.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validateRequest.middleware.js';
import { AppError } from '../../src/utils/AppError.js';

function makeReq(overrides: Record<string, unknown> = {}) {
  return { body: {}, query: {}, params: {}, ...overrides } as any;
}

function makeRes() {
  return {} as any;
}

describe('validateRequest middleware', () => {
  it('valid body → parses and calls next()', () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate({ body: schema });
    const req = makeReq({ body: { name: 'test' } });
    const res = makeRes();
    let called = false;
    middleware(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.body.name, 'test');
  });

  it('invalid body → throws AppError 400 with Zod issues', () => {
    const schema = z.object({ name: z.string().min(1, 'name is required') });
    const middleware = validate({ body: schema });
    const req = makeReq({ body: { name: '' } });
    const res = makeRes();
    assert.throws(
      () => middleware(req, res, () => {}),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'INVALID_REQUEST');
        assert.ok(err.message.includes('name'));
        return true;
      },
    );
  });

  it('valid query → parses and calls next()', () => {
    const schema = z.object({ page: z.coerce.number().int().min(1).default(1) });
    const middleware = validate({ query: schema });
    const req = makeReq({ query: { page: '5' } });
    const res = makeRes();
    let called = false;
    middleware(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.query.page, 5);
  });

  it('invalid query → throws AppError 400', () => {
    const schema = z.object({ status: z.enum(['pending', 'done']) });
    const middleware = validate({ query: schema });
    const req = makeReq({ query: { status: 'invalid' } });
    const res = makeRes();
    assert.throws(
      () => middleware(req, res, () => {}),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'INVALID_REQUEST');
        return true;
      },
    );
  });

  it('valid params → parses and calls next()', () => {
    const schema = z.object({ id: z.string().min(1) });
    const middleware = validate({ params: schema });
    const req = makeReq({ params: { id: 'proj-1' } });
    const res = makeRes();
    let called = false;
    middleware(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.params.id, 'proj-1');
  });

  it('multiple schemas → validates all', () => {
    const bodySchema = z.object({ name: z.string().min(1) });
    const querySchema = z.object({ page: z.coerce.number().int().min(1) });
    const middleware = validate({ body: bodySchema, query: querySchema });
    const req = makeReq({ body: { name: 'test' }, query: { page: '1' } });
    const res = makeRes();
    let called = false;
    middleware(req, res, () => { called = true; });
    assert.equal(called, true);
  });

  it('non-ZodError exception → rethrows as-is', () => {
    const middleware = validate({
      body: z.object({ name: z.string().min(1) }),
    });
    const req = makeReq({ body: null });
    const res = makeRes();
    assert.throws(
      () => middleware(req, res, () => {}),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        return true;
      },
    );
  });
});
