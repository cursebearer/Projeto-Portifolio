import { describe, expect, it } from 'vitest';
import { stepStates, uploadErrorMessage } from './upload-steps';

describe('stepStates', () => {
  it('durante o envio só a primeira etapa está ativa', () => {
    expect(stepStates('uploading', 0)).toEqual(['active', 'pending', 'pending', 'pending', 'pending']);
  });

  it('no processamento avança as etapas do servidor pelo tempo decorrido', () => {
    expect(stepStates('processing', 0)).toEqual(['done', 'active', 'pending', 'pending', 'pending']);
    expect(stepStates('processing', 1000)).toEqual(['done', 'done', 'active', 'pending', 'pending']);
    expect(stepStates('processing', 3000)).toEqual(['done', 'done', 'done', 'active', 'pending']);
    expect(stepStates('processing', 60_000)).toEqual(['done', 'done', 'done', 'done', 'active']);
  });

  it('sucesso marca todas como concluídas', () => {
    expect(stepStates('success', 0)).toEqual(['done', 'done', 'done', 'done', 'done']);
  });

  it('erro marca a etapa que falhou', () => {
    expect(stepStates('error', 0, 3)).toEqual(['done', 'done', 'done', 'error', 'pending']);
    expect(stepStates('error', 0, 0)).toEqual(['error', 'pending', 'pending', 'pending', 'pending']);
  });
});

describe('uploadErrorMessage', () => {
  it('traduz códigos conhecidos', () => {
    expect(uploadErrorMessage(409, 'x')).toMatch(/já foi registrado/);
    expect(uploadErrorMessage(413, 'x')).toMatch(/50 MB/);
    expect(uploadErrorMessage(408, 'x')).toMatch(/demorou/);
    expect(uploadErrorMessage(401, 'x')).toMatch(/Sessão expirada/);
  });

  it('usa a mensagem de fallback para outros casos', () => {
    expect(uploadErrorMessage(500, 'Erro do servidor')).toBe('Erro do servidor');
    expect(uploadErrorMessage(undefined, 'Sem rede')).toBe('Sem rede');
  });
});
