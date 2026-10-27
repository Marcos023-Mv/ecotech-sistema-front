import type { NivelConhecimentoTecnologia, NivelDashboard } from '../types';
import { ROTAS, ROTAS_INTER } from '../../routes/paths';

/** Quem ainda não tem nível definido continua vendo a dashboard completa (comportamento anterior do sistema). */
export const NIVEL_PADRAO: NivelDashboard = 'avancado';

export const ROTULO_NIVEL: Record<NivelDashboard, string> = { intermediario: 'Intermediário', avancado: 'Avançado' };

/** Porta de entrada de cada nível. */
export const ROTA_INICIAL: Record<NivelDashboard, string> = { intermediario: ROTAS_INTER.inicio, avancado: ROTAS.visaoGeral };

/**
 * Resposta do cadastro -> dashboard. Quem tem muita familiaridade com tecnologia usa a avançada;
 * quem tem média ou pouca usa a intermediária. Sem resposta, vale o padrão.
 */
export function nivelDoConhecimento(conhecimento: NivelConhecimentoTecnologia | ''): NivelDashboard {
  if (conhecimento === 'medio' || conhecimento === 'pouco') return 'intermediario';
  return NIVEL_PADRAO;
}

export const ehNivel = (v: unknown): v is NivelDashboard => v === 'intermediario' || v === 'avancado';

/* ------------------------------------------------------------------ persistência (simulada, no navegador) */

/** usuário (minúsculas) -> nível. Guarda só o nível, nunca senha. Será substituído pelo perfil vindo do backend. */
const CHAVE_NIVEIS = 'ecotech-niveis';

function lerNiveis(): Record<string, NivelDashboard> {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_NIVEIS) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(bruto).filter((e): e is [string, NivelDashboard] => ehNivel(e[1])));
  } catch {
    return {};
  }
}

const chaveDoUsuario = (usuario: string) => usuario.trim().toLowerCase();

export function nivelSalvo(usuario: string): NivelDashboard {
  return lerNiveis()[chaveDoUsuario(usuario)] ?? NIVEL_PADRAO;
}

export function salvarNivel(usuario: string, nivel: NivelDashboard): void {
  if (!chaveDoUsuario(usuario)) return;
  try {
    localStorage.setItem(CHAVE_NIVEIS, JSON.stringify({ ...lerNiveis(), [chaveDoUsuario(usuario)]: nivel }));
  } catch {
    /* armazenamento indisponível: o nível vale só nesta sessão */
  }
}

/* ------------------------------------------------------------------ redirecionamento entre níveis */

/** Onde cada tela do outro nível "mora" no nível do usuário (quando existe equivalente); o resto vai para o início. */
const EQUIVALENTE_NO_INTERMEDIARIO: Record<string, string> = {
  [ROTAS.plantas]: ROTAS_INTER.plantas,
  [ROTAS.monitor]: ROTAS_INTER.irrigacao,
  [ROTAS.configuracoes]: ROTAS_INTER.configuracoes,
};
const EQUIVALENTE_NO_AVANCADO: Record<string, string> = {
  [ROTAS_INTER.plantas]: ROTAS.plantas,
  [ROTAS_INTER.irrigacao]: ROTAS.monitor,
  [ROTAS_INTER.configuracoes]: ROTAS.configuracoes,
};

export function destinoNoNivel(caminho: string, nivel: NivelDashboard): string {
  const tabela = nivel === 'intermediario' ? EQUIVALENTE_NO_INTERMEDIARIO : EQUIVALENTE_NO_AVANCADO;
  return tabela[caminho] ?? ROTA_INICIAL[nivel];
}
