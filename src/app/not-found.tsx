import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="conteudo" className="error-page">
      <span className="eyebrow">PÁGINA NÃO ENCONTRADA</span>
      <h1>Vamos voltar ao caminho.</h1>
      <p>Este endereço não está disponível ou você não tem acesso a ele.</p>
      <Link className="button" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}
