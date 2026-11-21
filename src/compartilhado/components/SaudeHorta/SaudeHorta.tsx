import { useMemo, type ReactNode } from 'react';
import { useHorta } from '../../hooks/useHorta';
import { formatarLitros, formatarRelativo } from '../../utils/format';
import { faixaIdealMedia, saudeDaHorta, type FaixaSaude } from '../../utils/horta';
import { AlertOctagonIcon, CheckCircleIcon, DropletIcon, LeafIcon, ThermometerIcon, WarningIcon, WifiIcon } from '../icons';
import './SaudeHorta.css';

const DIAS_CONSUMO = 7;

const ICONE_FAIXA: Record<FaixaSaude, ReactNode> = {
  boa: <CheckCircleIcon width={15} height={15} aria-hidden="true" />,
  atencao: <WarningIcon width={15} height={15} aria-hidden="true" />,
  critica: <AlertOctagonIcon width={15} height={15} aria-hidden="true" />,
  indisponivel: <WifiIcon width={15} height={15} aria-hidden="true" />,
};

interface Indicador {
  id: string;
  icone: ReactNode;
  rotulo: string;
  valor: string;
  contexto: string;
  tom?: 'ok' | 'atencao' | 'critico';
}

function Medidor({ pontuacao, faixa }: { pontuacao: number | null; faixa: FaixaSaude }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const fracao = pontuacao === null ? 0 : pontuacao / 100;
  return (
    <div className={`saude-medidor saude-${faixa}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r={r} className="saude-medidor-trilho" />
        <circle cx="60" cy="60" r={r} className="saude-medidor-valor" strokeDasharray={c} strokeDashoffset={c * (1 - fracao)} />
      </svg>
      <div className="saude-medidor-texto">
        <strong className="num">{pontuacao ?? '—'}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

interface Props {
  /** Aviso que relativiza a nota (ex.: dados desatualizados). */
  aviso?: string;
  /** Total de ocorrências ativas mostrado no nível (ex.: Central de atenção), para o número bater com o menu. */
  ocorrencias?: number;
}

/**
 * Centro de saúde da horta: transforma os indicadores técnicos em uma nota (0–100), uma frase simples
 * e seis indicadores com contexto (valor + referência). Usado na dashboard intermediária.
 */
export default function SaudeHorta({ aviso, ocorrencias }: Props) {
  const { indicadores: ind, monitoradas, consumo, agora } = useHorta();
  const saude = saudeDaHorta(ind);
  const faixa = faixaIdealMedia(monitoradas);

  const agua = useMemo(() => {
    const dias = consumo.slice(-DIAS_CONSUMO);
    const usada = dias.reduce((s, d) => s + d.utilizada, 0);
    const conv = dias.reduce((s, d) => s + d.convencional, 0);
    return { usada, economia: conv > 0 ? Math.round((1 - usada / conv) * 100) : null, dias: dias.length };
  }, [consumo]);

  const precisam = ind.atencao + ind.criticas;
  const nAlertas = ocorrencias ?? ind.alertasAtivos;
  const u = ind.umidadeMedia;
  const posicaoUmidade = u === null || !faixa ? null : u < faixa.min ? 'abaixo da faixa' : u > faixa.max ? 'acima da faixa' : 'na faixa ideal';

  const indicadores: Indicador[] = [
    {
      id: 'plantas',
      icone: <LeafIcon width={16} height={16} />,
      rotulo: 'Plantas monitoradas',
      valor: `${ind.plantasComLeitura} de ${ind.totalPlantas}`,
      contexto: ind.semDados > 0 ? `${ind.semDados} sem leitura confiável` : 'todas com leitura',
      tom: ind.semDados > 0 ? 'atencao' : 'ok',
    },
    {
      id: 'atencao',
      icone: <WarningIcon width={16} height={16} />,
      rotulo: 'Precisam de atenção',
      valor: String(precisam),
      contexto: `${ind.criticas} crítica${ind.criticas === 1 ? '' : 's'} · ${nAlertas} ocorrência${nAlertas === 1 ? '' : 's'}`,
      tom: ind.criticas > 0 ? 'critico' : precisam > 0 ? 'atencao' : 'ok',
    },
    {
      id: 'umidade',
      icone: <DropletIcon width={16} height={16} />,
      rotulo: 'Umidade média do solo',
      valor: u === null ? '—' : `${u}%`,
      contexto: faixa ? `Ideal ${faixa.min}–${faixa.max}%${posicaoUmidade ? ` · ${posicaoUmidade}` : ''}` : 'sem faixa configurada',
      tom: posicaoUmidade === 'na faixa ideal' ? 'ok' : posicaoUmidade ? 'atencao' : undefined,
    },
    {
      id: 'temperatura',
      icone: <ThermometerIcon width={16} height={16} />,
      rotulo: 'Temperatura média',
      valor: ind.temperatura ? `${ind.temperatura.media.toFixed(1).replace('.', ',')} °C` : '—',
      contexto: ind.temperatura ? `${ind.temperatura.sensores} sensor${ind.temperatura.sensores === 1 ? '' : 'es'} · ${ind.temperatura.min.toFixed(0)}–${ind.temperatura.max.toFixed(0)} °C` : 'nenhum sensor online',
    },
    {
      id: 'sensores',
      icone: <WifiIcon width={16} height={16} />,
      rotulo: 'Sensores ativos',
      valor: `${ind.dispositivos.online} de ${ind.dispositivos.total}`,
      contexto: ind.dispositivos.offline === 0 ? 'todos conectados' : `${ind.dispositivos.offline} offline`,
      tom: ind.dispositivos.offline === 0 ? 'ok' : 'atencao',
    },
    {
      id: 'agua',
      icone: <DropletIcon width={16} height={16} />,
      rotulo: `Água · ${agua.dias} dias`,
      valor: formatarLitros(agua.usada),
      contexto: agua.economia === null ? 'sem histórico de consumo' : agua.economia >= 0 ? `${agua.economia}% abaixo da irrigação fixa` : `${-agua.economia}% acima da irrigação fixa`,
      tom: agua.economia !== null && agua.economia < 0 ? 'atencao' : undefined,
    },
  ];

  return (
    <section className={`saude card saude-borda-${saude.faixa}`} aria-labelledby="saude-titulo">
      <div className="saude-resumo">
        <Medidor pontuacao={saude.pontuacao} faixa={saude.faixa} />
        <div className="saude-texto">
          <span className="saude-eyebrow">Saúde da horta</span>
          <h2 id="saude-titulo">
            <span className={`saude-faixa saude-${saude.faixa}`}>
              {ICONE_FAIXA[saude.faixa]}
              {saude.rotulo}
            </span>
          </h2>
          <p className="saude-frase">{saude.frase}</p>
          {aviso && (
            <p className="saude-aviso">
              <WarningIcon width={14} height={14} aria-hidden="true" /> {aviso}
            </p>
          )}
          <small className="saude-nota">
            {saude.pontuacao !== null && <span className="sr-only">Nota {saude.pontuacao} de 100. </span>}
            {ind.ultimaLeituraMs ? `Atualizado ${formatarRelativo(ind.ultimaLeituraMs, agora)}` : 'Sem leitura recente'} · nota baseada no estado de cada planta
          </small>
        </div>
      </div>

      <ul className="saude-indicadores" aria-label="Indicadores da horta">
        {indicadores.map((i) => (
          <li key={i.id} className={`saude-ind ${i.tom ? `saude-ind-${i.tom}` : ''}`}>
            <span className="saude-ind-rotulo">{i.icone}{i.rotulo}</span>
            <strong className="num">{i.valor}</strong>
            <span className="saude-ind-contexto">{i.contexto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
