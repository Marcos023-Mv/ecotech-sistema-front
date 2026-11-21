import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshIcon, WarningIcon } from '../icons';

/** Esqueleto da página (cabeçalho, linha de indicadores e dois blocos), usado enquanto os dados chegam. */
export function PaginaCarregando() {
  return (
    <div className="skeleton-page" role="status" aria-live="polite" aria-label="Carregando dados da horta">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="skeleton" style={{ width: 44, height: 44 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="skeleton" style={{ width: 180, height: 20 }} />
          <span className="skeleton" style={{ width: 120, height: 12 }} />
        </div>
      </div>
      <div className="skeleton-row">
        {[0, 1, 2, 3].map((i) => <span key={i} className="skeleton" style={{ height: 112, borderRadius: 16 }} />)}
      </div>
      <div className="skeleton-duo">
        <span className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        <span className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

interface ErroProps {
  children: ReactNode;
  /** Muda quando o usuário navega: limpa o erro da tela anterior. */
  chave?: string;
}

/** Captura falhas de renderização de uma tela e oferece nova tentativa, sem derrubar o menu e o restante do app. */
export class LimiteDeErro extends Component<ErroProps, { erro: Error | null; chave?: string }> {
  state: { erro: Error | null; chave?: string } = { erro: null, chave: this.props.chave };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  static getDerivedStateFromProps(props: ErroProps, state: { erro: Error | null; chave?: string }) {
    return props.chave !== state.chave ? { erro: null, chave: props.chave } : null;
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Falha ao exibir a tela', erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="erro-estado" role="alert">
        <WarningIcon width={32} height={32} />
        <strong>Não foi possível exibir esta tela</strong>
        <p>Algo deu errado ao montar as informações. Os dados da horta não foram alterados. Tente novamente; se persistir, recarregue a página.</p>
        <code>{this.state.erro.message}</code>
        <button type="button" className="btn btn-secondary" onClick={() => this.setState({ erro: null })}>
          <RefreshIcon width={16} height={16} /> Tentar novamente
        </button>
      </div>
    );
  }
}
