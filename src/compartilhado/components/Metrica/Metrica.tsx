import type { ReactNode } from 'react';
import { AlertOctagonIcon, CheckCircleIcon, InfoIcon, WarningIcon, WifiOffIcon } from '../icons';
import '../Card/Card.css';
import './Metrica.css';

export type TomMetrica = 'ok' | 'atencao' | 'critico' | 'offline' | 'info';

const ICONE_TOM: Record<TomMetrica, ReactNode> = {
  ok: <CheckCircleIcon width={13} height={13} aria-hidden="true" />,
  atencao: <WarningIcon width={13} height={13} aria-hidden="true" />,
  critico: <AlertOctagonIcon width={13} height={13} aria-hidden="true" />,
  offline: <WifiOffIcon width={13} height={13} aria-hidden="true" />,
  info: <InfoIcon width={13} height={13} aria-hidden="true" />,
};

interface Props {
  icone: ReactNode;
  rotulo: string;
  valor: string;
  unidade?: string;
  /** Situação do valor, sempre com ícone + texto (ex.: "Abaixo da faixa"). */
  status?: { tom: TomMetrica; texto: string };
  /** Referência que dá sentido ao número (ex.: "Faixa ideal: 45–65%"). */
  contexto?: ReactNode;
  className?: string;
}

/** Cartão de métrica com contexto: rótulo, valor + unidade, status e referência. Evita "número solto". */
export default function Metrica({ icone, rotulo, valor, unidade, status, contexto, className = '' }: Props) {
  return (
    <section className={`card metrica ${status ? `metrica-${status.tom}` : ''} ${className}`} aria-label={rotulo}>
      <span className="metrica-rotulo">
        <span className="metrica-icone" aria-hidden="true">{icone}</span>
        {rotulo}
      </span>
      <strong className="metrica-valor num">
        {valor}
        {unidade && <small>{unidade}</small>}
      </strong>
      {status && (
        <span className="metrica-status">
          {ICONE_TOM[status.tom]}
          {status.texto}
        </span>
      )}
      {contexto && <span className="metrica-contexto">{contexto}</span>}
    </section>
  );
}
