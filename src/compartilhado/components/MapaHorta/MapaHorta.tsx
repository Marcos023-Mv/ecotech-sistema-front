import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useHorta } from '../../hooks/useHorta';
import type { LeituraColetada } from '../../types';
import { formatarDataHora, formatarRelativo } from '../../utils/format';
import { ROTULO_ESTADO, type EstadoPlanta, type PlantaMonitorada } from '../../utils/horta';
import EstadoBadge from '../EstadoBadge';
import EmptyState from '../EmptyState';
import { AlertOctagonIcon, ArrowRightIcon, CheckCircleIcon, LeafIcon, WarningIcon, WifiOffIcon } from '../icons';
import './MapaHorta.css';

const ICONE: Record<EstadoPlanta, (p: { width: number; height: number }) => ReactNode> = {
  saudavel: (p) => <CheckCircleIcon {...p} aria-hidden="true" />,
  atencao: (p) => <WarningIcon {...p} aria-hidden="true" />,
  critico: (p) => <AlertOctagonIcon {...p} aria-hidden="true" />,
  sem_dados: (p) => <WifiOffIcon {...p} aria-hidden="true" />,
};
const ORDEM_LEGENDA: EstadoPlanta[] = ['saudavel', 'atencao', 'critico', 'sem_dados'];
const JANELA_SPARK_MS = 24 * 3_600_000;

/** Mini-histórico (24 h) da umidade com a faixa ideal ao fundo. SVG simples: leve e sem dependência. */
function Sparkline({ pontos, faixa }: { pontos: LeituraColetada[]; faixa: [number, number] }) {
  if (pontos.length < 2) return <p className="mapa-spark-vazio">Poucas leituras nas últimas 24 h para mostrar o histórico.</p>;
  const W = 280;
  const H = 64;
  const t0 = pontos[0].ts;
  const t1 = pontos[pontos.length - 1].ts || t0 + 1;
  const x = (ts: number) => ((ts - t0) / Math.max(1, t1 - t0)) * W;
  const y = (v: number) => H - (Math.max(0, Math.min(100, v)) / 100) * H;
  const linha = pontos.map((p) => `${x(p.ts).toFixed(1)},${y(p.umidade).toFixed(1)}`).join(' ');
  const ultimo = pontos[pontos.length - 1];
  return (
    <svg className="mapa-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Umidade nas últimas 24 horas: de ${pontos[0].umidade}% a ${ultimo.umidade}%. Faixa ideal ${faixa[0]}–${faixa[1]}%.`}>
      <rect x="0" y={y(faixa[1])} width={W} height={y(faixa[0]) - y(faixa[1])} className="mapa-spark-faixa" />
      <polyline points={linha} className="mapa-spark-linha" vectorEffect="non-scaling-stroke" />
      <circle cx={x(ultimo.ts)} cy={y(ultimo.umidade)} r="3" className="mapa-spark-ponto" />
    </svg>
  );
}

/** Barra 0–100% com a faixa ideal destacada e o valor atual marcado. */
function BarraFaixa({ valor, min, max }: { valor: number | null; min: number; max: number }) {
  return (
    <div className="mapa-barra" aria-hidden="true">
      <div className="mapa-barra-faixa" style={{ left: `${min}%`, width: `${max - min}%` }} />
      {valor !== null && <div className="mapa-barra-marca" style={{ left: `${Math.max(0, Math.min(100, valor))}%` }} />}
    </div>
  );
}

interface Props {
  /** simples: leitura rápida (intermediária). tecnico: inclui sensor, leitura bruta e parâmetros (avançada). */
  modo?: 'simples' | 'tecnico';
  /** Ação principal do painel da planta (ex.: abrir o detalhe ou o Monitor). */
  onAbrir?: (plantaId: string) => void;
  rotuloAbrir?: string;
}

/**
 * Mapa da horta: plantas agrupadas por canteiro, cada uma com o estado (ícone + texto + cor).
 * Ao selecionar uma planta, o painel mostra umidade na faixa ideal, temperatura, última irrigação e o histórico de 24 h.
 */
export default function MapaHorta({ modo = 'simples', onAbrir, rotuloAbrir = 'Ver detalhes' }: Props) {
  const { monitoradas, leituras, historicoIrrigacao, sessaoDa, agora } = useHorta();
  const tecnico = modo === 'tecnico';
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const painelRef = useRef<HTMLElement>(null);
  const selecionar = (id: string) => {
    setSelecionadaId(id);
    // Em telas estreitas o painel fica abaixo do mapa: leva o usuário até ele.
    if (window.matchMedia('(max-width: 1100px)').matches) {
      requestAnimationFrame(() => painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    }
  };

  const canteiros = useMemo(() => {
    const grupos = new Map<string, PlantaMonitorada[]>();
    for (const m of monitoradas) {
      const chave = m.planta.canteiro || 'Sem canteiro';
      grupos.set(chave, [...(grupos.get(chave) ?? []), m]);
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [monitoradas]);

  const contagem = useMemo(() => {
    const c: Record<EstadoPlanta, number> = { saudavel: 0, atencao: 0, critico: 0, sem_dados: 0 };
    for (const m of monitoradas) c[m.estado]++;
    return c;
  }, [monitoradas]);

  if (monitoradas.length === 0) {
    return <EmptyState icone={<LeafIcon width={30} height={30} />} titulo="Nenhuma planta cadastrada" texto="Cadastre plantas para ver o mapa da horta." />;
  }

  const sel = monitoradas.find((m) => m.planta.id === selecionadaId) ?? monitoradas[0];
  const p = sel.planta;
  const semDados = sel.estado === 'sem_dados';
  const spark = leituras.filter((l) => l.plantaId === p.id && l.ts >= agora - JANELA_SPARK_MS).sort((a, b) => a.ts - b.ts);
  const ultimaIrrig = historicoIrrigacao.filter((r) => r.plantaId === p.id).sort((a, b) => b.timestamp - a.timestamp)[0];
  const sessao = sessaoDa(p.id);
  const irrigando = sessao.estado === 'ligada';

  const linhas: [string, ReactNode][] = [
    ['Umidade do solo', semDados ? 'Sem leitura confiável' : `${p.umidadeAtual}%`],
    ['Faixa ideal', `${p.faixaMin}–${p.faixaMax}%`],
    ['Temperatura', `${p.temperatura.toFixed(1).replace('.', ',')} °C`],
    ['Última leitura', sel.ultimaLeituraMs ? formatarRelativo(sel.ultimaLeituraMs, agora) : 'Sem registro'],
    ['Última irrigação', irrigando ? 'Irrigando agora' : ultimaIrrig ? `${formatarDataHora(ultimaIrrig.timestamp)} · ${ultimaIrrig.litros} L` : 'Sem registro'],
  ];
  if (tecnico) {
    linhas.push(
      ['Limites (crít./mín./máx.)', <span key="t1" className="mono">{p.umidadeCritica} / {p.umidadeMinima} / {p.umidadeMaxima}%</span>],
      ['Taxa de secagem', <span key="t2" className="mono">{p.taxaSecagemHora.toFixed(1).replace('.', ',')} p.p./h</span>],
      ['Sensor', sel.sensor ? <span key="t3" className="mono">{sel.sensor.nome.replace('Sensor de Umidade ', '')} · {sel.sensor.status}</span> : 'Não associado'],
    );
    if (sel.sensor?.bruto !== undefined) linhas.push(['Leitura bruta (ADC)', <span key="t4" className="mono">{sel.sensor.bruto}</span>]);
    if (sel.sensor?.profundidadeCm !== undefined) linhas.push(['Instalação', <span key="t5" className="mono">{sel.sensor.profundidadeCm} cm{sel.sensor.posicao ? ` · ${sel.sensor.posicao}` : ''}</span>]);
    if (sel.sensor?.estavelHoras) linhas.push(['Leitura sem variação', <span key="t6" className="mono">{sel.sensor.estavelHoras} h</span>]);
    linhas.push(['Modo de irrigação', sessao.modo === 'automatico' ? 'Automático' : 'Manual']);
  }

  return (
    <div className={`mapa ${tecnico ? 'mapa-tecnico' : ''}`}>
      <div className="mapa-area">
        <ul className="mapa-legenda" aria-label="Legenda e contagem por estado">
          {ORDEM_LEGENDA.map((e) => (
            <li key={e} className={`mapa-legenda-item mapa-e-${e}`}>
              {ICONE[e]({ width: 13, height: 13 })}
              <strong>{contagem[e]}</strong> {ROTULO_ESTADO[e] === 'Sem dados suficientes' ? 'Sem dados' : ROTULO_ESTADO[e]}
            </li>
          ))}
        </ul>

        <div className="mapa-canteiros" role="group" aria-label="Canteiros da horta">
          {canteiros.map(([nome, itens]) => (
            <section key={nome} className="mapa-canteiro" aria-label={nome}>
              <header>
                <span>{nome}</span>
                <small>{itens.length} {itens.length === 1 ? 'planta' : 'plantas'}</small>
              </header>
              <div className="mapa-plantas">
                {itens.map((m) => {
                  const ativa = m.planta.id === sel.planta.id;
                  return (
                    <button
                      key={m.planta.id}
                      type="button"
                      className={`mapa-planta mapa-e-${m.estado} ${ativa ? 'mapa-planta-ativa' : ''}`}
                      aria-pressed={ativa}
                      aria-label={`${m.planta.nome}, ${ROTULO_ESTADO[m.estado]}${m.estado === 'sem_dados' ? '' : `, umidade ${m.planta.umidadeAtual}%`}`}
                      onClick={() => selecionar(m.planta.id)}
                    >
                      <span className="mapa-planta-estado">{ICONE[m.estado]({ width: 14, height: 14 })}</span>
                      <span className="mapa-planta-nome">
                        <span className="mapa-planta-emoji" aria-hidden="true">{m.planta.emoji}</span>
                        {m.planta.nome}
                      </span>
                      <strong className="num">{m.estado === 'sem_dados' ? '—' : `${m.planta.umidadeAtual}%`}</strong>
                      {tecnico && <small className="mono">{m.sensor ? `#${m.sensor.codigo}` : 'sem sensor'}</small>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <aside ref={painelRef} key={p.id} className="mapa-painel" aria-live="polite" aria-label={`Detalhes de ${p.nome}`}>
        <header className="mapa-painel-topo">
          <span className="mapa-painel-emoji" aria-hidden="true">{p.emoji}</span>
          <div>
            <h3>{p.nome}</h3>
            <small>{p.canteiro} · {p.local}</small>
          </div>
          <EstadoBadge estado={sel.estado} />
        </header>

        {!semDados && <BarraFaixa valor={p.umidadeAtual} min={p.faixaMin} max={p.faixaMax} />}
        <p className="mapa-painel-motivo">{sel.motivo}</p>

        <dl className="mapa-dados">
          {linhas.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mapa-historico">
          <span>Histórico de 24 h</span>
          <Sparkline pontos={spark} faixa={[p.faixaMin, p.faixaMax]} />
        </div>

        <p className="mapa-painel-acao"><strong>O que fazer:</strong> {sel.recomendacao}</p>
        {onAbrir && (
          <button type="button" className="btn btn-secondary mapa-painel-btn" onClick={() => onAbrir(p.id)}>
            {rotuloAbrir} <ArrowRightIcon width={16} height={16} />
          </button>
        )}
      </aside>
    </div>
  );
}
