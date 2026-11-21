import type { NivelDashboard } from '../../types';

export interface InfoNivel {
  nivel: NivelDashboard;
  numero: number;
  titulo: string;
  descricao: string;
  /** O que o painel realmente oferece (ver docs/DASHBOARD_*.md e as telas de cada nível). */
  recursos: string[];
}

export const NIVEIS_CADASTRO: InfoNivel[] = [
  {
    nivel: 'basico',
    numero: 1,
    titulo: 'Básico',
    descricao: 'Para quem quer o essencial: como está a horta, o que fazer agora e um botão para regar cada planta.',
    recursos: ['Visão geral do sistema', 'Resumos visuais', 'Alertas diretos'],
  },
  {
    nivel: 'intermediario',
    numero: 2,
    titulo: 'Intermediário',
    descricao: 'Para o acompanhamento diário, com indicadores, gráfico das últimas 24 h e os detalhes de cada planta.',
    recursos: ['Gráficos e métricas', 'Histórico recente', 'Mais detalhes do sistema'],
  },
  {
    nivel: 'avancado',
    numero: 3,
    titulo: 'Avançado',
    descricao: 'Painel completo: monitor em tempo real, relatórios, sensores e irrigação automática ou manual.',
    recursos: ['Telemetria em tempo real', 'Dados detalhados', 'Controle ampliado do sistema'],
  },
];
