import { describe, expect, it } from 'vitest';
import { saudeDaHorta, type Indicadores } from './horta';

const ind = (extra: Partial<Indicadores>): Indicadores => ({
  totalPlantas: 0, saudaveis: 0, atencao: 0, criticas: 0, semDados: 0,
  umidadeMedia: null, umidadeMinima: null, umidadeMaxima: null, plantasComLeitura: 0, ultimaLeituraMs: null,
  temperatura: null, alertasAtivos: 0, alertasCriticos: 0, dispositivos: { online: 0, offline: 0, total: 0 },
  ...extra,
});

describe('saudeDaHorta — índice de saúde', () => {
  it('não afirma saúde sem nenhuma leitura confiável', () => {
    const s = saudeDaHorta(ind({ totalPlantas: 3, semDados: 3 }));
    expect(s.pontuacao).toBeNull();
    expect(s.faixa).toBe('indisponivel');
  });

  it('horta toda saudável e coberta = 100, faixa boa', () => {
    const s = saudeDaHorta(ind({ totalPlantas: 4, saudaveis: 4 }));
    expect(s.pontuacao).toBe(100);
    expect(s.faixa).toBe('boa');
  });

  it('plantas sem leitura reduzem a nota pela cobertura', () => {
    // 2 saudáveis de 4 => média 100, cobertura 50% => 100 - 7,5 = 93 (arredondado)
    expect(saudeDaHorta(ind({ totalPlantas: 4, saudaveis: 2, semDados: 2 })).pontuacao).toBe(93);
  });

  it('qualquer planta crítica coloca a horta na faixa crítica', () => {
    const s = saudeDaHorta(ind({ totalPlantas: 10, saudaveis: 9, criticas: 1 }));
    expect(s.faixa).toBe('critica');
    expect(s.pontuacao).toBeLessThanOrEqual(59);
    expect(s.frase).toMatch(/1 planta precisa de água/);
  });

  it('mistura de saudáveis e atenção fica em "requer atenção"', () => {
    // (1*100 + 2*60) / 3 = 73
    const s = saudeDaHorta(ind({ totalPlantas: 3, saudaveis: 1, atencao: 2 }));
    expect(s.pontuacao).toBe(73);
    expect(s.faixa).toBe('atencao');
  });

  it('a nota fica sempre entre 0 e 100', () => {
    const s = saudeDaHorta(ind({ totalPlantas: 10, criticas: 1, semDados: 9 }));
    expect(s.pontuacao).toBeGreaterThanOrEqual(0);
    expect(s.pontuacao).toBeLessThanOrEqual(100);
  });
});
