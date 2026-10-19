import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let host: ArgumentsHost;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/x', method: 'POST' }),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('HttpException: preserva status e message original', () => {
    const exc = new BadRequestException(['campo inválido']);
    filter.catch(exc, host);

    expect(statusMock).toHaveBeenCalledWith(400);
    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual(['campo inválido']);
    expect(body.path).toBe('/x');
  });

  it('exceção não-Http vira 500 com mensagem genérica', () => {
    const exc = new Error('db explodiu');
    filter.catch(exc, host);

    expect(statusMock).toHaveBeenCalledWith(500);
    const body = jsonMock.mock.calls[0][0];
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Erro interno do servidor');
  });

  it('dev: inclui stack trace no body', () => {
    process.env.NODE_ENV = 'development';
    const exc = new InternalServerErrorException('boom');
    filter.catch(exc, host);

    const body = jsonMock.mock.calls[0][0];
    expect(body.stack).toBeDefined();
  });

  it('production: omite stack trace', () => {
    process.env.NODE_ENV = 'production';
    const exc = new InternalServerErrorException('boom');
    filter.catch(exc, host);

    const body = jsonMock.mock.calls[0][0];
    expect(body.stack).toBeUndefined();
  });

  it('exceção não-Error (string/number) retorna 500', () => {
    filter.catch('string errada', host);
    expect(statusMock).toHaveBeenCalledWith(500);
  });
});
