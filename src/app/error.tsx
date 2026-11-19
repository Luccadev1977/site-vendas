'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="error-page">
      <span className="eyebrow">ALGO PRECISA DE UM NOVO COMEÇO</span>
      <h1>Não foi possível carregar.</h1>
      <p>Tente novamente em instantes. Se o problema continuar, entre em contato com o estúdio.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
