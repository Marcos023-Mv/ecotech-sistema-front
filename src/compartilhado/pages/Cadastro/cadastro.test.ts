import { beforeEach, describe, expect, it } from 'vitest';
import type { CadastroForm } from '../../types';
import { mockEcotechApi } from '../../api/ecotechApi.mock';
import { ApiError } from '../../api/client';
import { CAMPOS_DADOS, CAMPOS_NIVEL, temErros, validarCadastro } from './cadastroValidation';
import { NIVEIS_CADASTRO } from './niveisCadastro';

/** Ambiente de teste é Node (sem localStorage). */
const memoria = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
};

const valido: CadastroForm = {
  nome: 'Maria Souza',
  email: 'maria@exemplo.com',
  usuario: 'maria.souza',
  senha: 'segredo1',
  confirmarSenha: 'segredo1',
  nivel: 'intermediario',
};

describe('validação do cadastro', () => {
  it('aceita um formulário válido', () => {
    expect(temErros(validarCadastro(valido))).toBe(false);
  });

  it('valida cada etapa só com os próprios campos', () => {
    const semNivel = { ...valido, nivel: '' as const };
    expect(temErros(validarCadastro(semNivel, CAMPOS_DADOS))).toBe(false);
    expect(validarCadastro(semNivel, CAMPOS_NIVEL).nivel).toBeTruthy();
  });

  it('aponta campos vazios e inválidos', () => {
    const erros = validarCadastro({ ...valido, nome: '', email: 'maria@', usuario: 'ma ria', senha: '123', confirmarSenha: '321' });
    expect(Object.keys(erros).sort()).toEqual(['confirmarSenha', 'email', 'nome', 'senha', 'usuario']);
  });

  it('os três níveis existem, na ordem Básico → Intermediário → Avançado', () => {
    expect(NIVEIS_CADASTRO.map((n) => n.nivel)).toEqual(['basico', 'intermediario', 'avancado']);
    NIVEIS_CADASTRO.forEach((n) => expect(n.recursos).toHaveLength(3));
  });
});

describe('cadastro na API simulada', () => {
  beforeEach(() => memoria.clear());

  it('cria a conta com o nível escolhido e nunca guarda a senha', async () => {
    const conta = await mockEcotechApi.cadastrarUsuario({ ...valido, nivel: 'basico' });
    expect(conta).toEqual({ nome: 'Maria Souza', email: 'maria@exemplo.com', usuario: 'maria.souza', nivel: 'basico' });
    expect(memoria.get('ecotech-usuarios')).not.toContain('segredo1');
  });

  it('recusa usuário ou e-mail já cadastrados (409, com o campo)', async () => {
    await mockEcotechApi.cadastrarUsuario({ ...valido, nivel: 'basico' });
    const repetido = mockEcotechApi.cadastrarUsuario({ ...valido, email: 'outro@exemplo.com', usuario: 'MARIA.SOUZA', nivel: 'avancado' });
    await expect(repetido).rejects.toMatchObject({ status: 409, detalhe: { campo: 'usuario' } });
    const emailRepetido = mockEcotechApi.cadastrarUsuario({ ...valido, usuario: 'outra', nivel: 'avancado' });
    await expect(emailRepetido).rejects.toBeInstanceOf(ApiError);
    await expect(emailRepetido).rejects.toMatchObject({ detalhe: { campo: 'email' } });
  });
});
