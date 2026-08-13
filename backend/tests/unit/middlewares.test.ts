// Unit test middleware auth & error handler (src/middlewares).
// JWT_SECRET di-set sebelum dynamic import — auth.middleware membaca env saat module load.
process.env.JWT_SECRET = 'unit-test-secret';
const { authMiddleware } = await import('../../src/middlewares/auth.middleware.js');
const { errorHandler } = await import('../../src/middlewares/errorHandler.middleware.js');
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { describe, it } from 'node:test';
import { AppError } from '../../src/utils/AppError.js';

function mockRes() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('errorHandler', () => {
  it('AppError → status + shape { error: { code, message } }', () => {
    const res = mockRes();
    errorHandler(new AppError(400, 'BAD_REQUEST', 'pesan'), {} as any, res, (() => {}) as any);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: { code: 'BAD_REQUEST', message: 'pesan' } });
  });

  it('error biasa → 500 INTERNAL_ERROR', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {} as any, res, (() => {}) as any);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: { code: 'INTERNAL_ERROR', message: 'boom' } });
  });

  it('nilai non-Error → 500 dengan pesan default', () => {
    const res = mockRes();
    errorHandler('oops', {} as any, res, (() => {}) as any);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error.message, 'Internal server error');
  });
});

describe('authMiddleware', () => {
  function makeReq(auth?: string) {
    return { headers: auth === undefined ? {} : { authorization: auth } } as any;
  }

  it('token valid → req.user terisi + next dipanggil', () => {
    const token = jwt.sign({ sub: 'u1' }, 'unit-test-secret');
    const req = makeReq(`Bearer ${token}`);
    let nextCalls = 0;
    authMiddleware(req, {} as any, () => {
      nextCalls++;
    });
    assert.equal(req.user.id, 'u1');
    assert.equal(nextCalls, 1);
  });

  it('tanpa header Authorization → AppError 401', () => {
    assert.throws(
      () => authMiddleware(makeReq(), {} as any, () => {}),
      (e: any) => e instanceof AppError && e.status === 401,
    );
  });

  it('token invalid → AppError 401', () => {
    assert.throws(
      () => authMiddleware(makeReq('Bearer bogus'), {} as any, () => {}),
      (e: any) => e instanceof AppError && e.status === 401,
    );
  });

  it('token tanpa sub → AppError 401', () => {
    const token = jwt.sign({ foo: 'bar' }, 'unit-test-secret');
    assert.throws(
      () => authMiddleware(makeReq(`Bearer ${token}`), {} as any, () => {}),
      (e: any) => e instanceof AppError && e.status === 401,
    );
  });
});
