import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/public/LegalPage';

export const metadata: Metadata = { title: 'Termos de Uso' };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updatedAt="13 de outubro de 2026">
      <p>
        Ao criar uma conta ou usar o DocChain, você concorda com estes termos. Leia também a{' '}
        <Link href="/privacidade" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>O que é o serviço</h2>
      <p>
        O DocChain registra a impressão digital (hash SHA-256) de documentos em blockchain e permite
        verificar, depois, se um arquivo é idêntico ao registrado. É um projeto open source e
        acadêmico, oferecido <strong>gratuitamente</strong> e operando na <strong>Sepolia</strong>, a
        rede de testes do Ethereum.
      </p>

      <h2>O que a verificação prova — e o que não prova</h2>
      <ul>
        <li>
          Prova que um arquivo é <strong>idêntico, byte a byte</strong>, ao que foi registrado, e
          desde quando o registro existe na blockchain.
        </li>
        <li>
          <strong>Não</strong> prova autoria, veracidade do conteúdo ou validade jurídica do
          documento, e <strong>não</strong> substitui certificado digital ICP-Brasil, assinatura
          eletrônica qualificada ou registro em cartório.
        </li>
      </ul>

      <h2>Suas responsabilidades</h2>
      <ul>
        <li>Enviar apenas documentos que você tem o direito de armazenar e compartilhar.</li>
        <li>Não enviar conteúdo ilegal ou que viole direitos de terceiros.</li>
        <li>Compartilhar documentos por e-mail apenas com destinatários legítimos.</li>
        <li>Manter sua senha em sigilo.</li>
      </ul>

      <h2>Registros permanentes</h2>
      <p>
        Impressões digitais gravadas na blockchain não podem ser removidas — nem por você, nem por
        nós. Excluir um documento ou a conta apaga os arquivos e os dados do nosso banco, mas o
        registro na blockchain continua existindo, sem vínculo com você.
      </p>

      <h2>Disponibilidade e limitações</h2>
      <ul>
        <li>
          O serviço é fornecido &quot;no estado em que se encontra&quot;, sem garantia de
          disponibilidade contínua. Por ser um projeto acadêmico em rede de testes, pode ser
          interrompido ou descontinuado.
        </li>
        <li>
          Mantenha cópias próprias dos seus documentos — o DocChain não é um serviço de backup.
        </li>
        <li>Aplicamos limites de uso (como número de envios e verificações) para evitar abuso.</li>
      </ul>

      <h2>Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em{' '}
        <Link href="/conta" className="text-primary hover:underline">
          Minha conta
        </Link>
        . Contas usadas para violar estes termos podem ser removidas.
      </p>
    </LegalPage>
  );
}
