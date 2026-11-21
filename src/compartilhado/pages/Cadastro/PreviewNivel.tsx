import type { ReactNode } from 'react';
import type { NivelDashboard } from '../../types';
import { ChartLineIcon, DropletIcon, LeafIcon, ThermometerIcon, WarningIcon, WifiIcon } from '../../components/icons';

/* Miniaturas ilustrativas de cada painel: só formas, sem números inventados. */

function PreviewBasico() {
  return (
    <div className="nv-prev nv-prev-basico">
      <div className="nv-prev-tile nv-prev-gauge">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
          <circle cx="32" cy="32" r="25" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
          <circle cx="32" cy="32" r="25" fill="none" stroke="var(--accent-green)" strokeWidth="6" strokeLinecap="round" strokeDasharray="120 157" transform="rotate(-90 32 32)" />
        </svg>
        <LeafIcon width={18} height={18} />
      </div>
      <div className="nv-prev-tile nv-prev-alerta">
        <WarningIcon width={18} height={18} />
        <span className="nv-sk nv-sk-w80" />
        <span className="nv-sk nv-sk-w60" />
        <span className="nv-prev-pill">
          <DropletIcon width={10} height={10} /> Regar
        </span>
      </div>
    </div>
  );
}

function PreviewIntermediario() {
  return (
    <div className="nv-prev nv-prev-inter">
      <div className="nv-prev-tile nv-prev-graficos">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,30 15,26 28,29 42,20 56,23 70,15 84,18 98,9 120,12" fill="none" stroke="var(--accent-green)" strokeWidth="2" />
        </svg>
        <div className="nv-prev-barras" aria-hidden="true">
          {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="nv-prev-tile nv-prev-lista">
        <span className="nv-prev-rotulo">24 h</span>
        {[0, 1, 2].map((i) => (
          <span key={i} className="nv-prev-linha">
            <i />
            <span className="nv-sk nv-sk-w70" />
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewAvancado() {
  const linhas: ReactNode[] = [
    <ThermometerIcon key="t" width={11} height={11} />,
    <DropletIcon key="d" width={11} height={11} />,
    <WifiIcon key="w" width={11} height={11} />,
    <ChartLineIcon key="c" width={11} height={11} />,
  ];
  return (
    <div className="nv-prev nv-prev-avancado">
      <div className="nv-prev-tile nv-prev-area">
        <span className="nv-prev-aovivo">
          <i /> Ao vivo
        </span>
        <svg viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="nv-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent-green)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--accent-green)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,30 C12,18 20,34 32,24 S52,10 64,22 S86,30 98,14 S112,16 120,10 V44 H0 Z" fill="url(#nv-area-grad)" />
          <path d="M0,30 C12,18 20,34 32,24 S52,10 64,22 S86,30 98,14 S112,16 120,10" fill="none" stroke="var(--accent-green)" strokeWidth="2" />
        </svg>
      </div>
      <div className="nv-prev-tile nv-prev-tabela">
        {linhas.map((icone, i) => (
          <span key={i} className="nv-prev-linha">
            {icone}
            <span className="nv-sk nv-sk-w50" />
            <span className="nv-sk nv-sk-w20" />
          </span>
        ))}
      </div>
    </div>
  );
}

const PREVIEWS: Record<NivelDashboard, () => ReactNode> = {
  basico: PreviewBasico,
  intermediario: PreviewIntermediario,
  avancado: PreviewAvancado,
};

export default function PreviewNivel({ nivel }: { nivel: NivelDashboard }) {
  const Preview = PREVIEWS[nivel];
  return <Preview />;
}
