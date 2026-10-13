import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/public/LegalPage';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata: Metadata = { title: 'Política de Privacidade' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="13 de outubro de 2026">
      <p>
        O DocChain é um projeto acadêmico (Trabalho de Conclusão de Curso de Engenharia
        de Software — Católica SC) que registra a impressão digital de documentos em blockchain. Esta
        política explica quais dados pessoais tratamos, por quê e como você exerce seus direitos pela
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> e-mail, nome e senha. A senha é guardada apenas como hash bcrypt
          — nunca em texto.
        </li>
        <li>
          <strong>Documentos que você envia:</strong> o arquivo, armazenado cifrado com AES-256-GCM, e
          seus metadados (nome, tipo, tamanho, datas e impressão digital SHA-256).
        </li>
        <li>
          <strong>Registros de atividade:</strong> endereço IP e navegador (user agent) em ações como
          login, upload, download, exclusão e verificação, para segurança e prevenção de abuso.
        </li>
        <li>
          <strong>Compartilhamentos:</strong> o e-mail do destinatário e a mensagem opcional que você
          informar ao compartilhar um documento.
        </li>
      </ul>
      <p>Não coletamos CPF, telefone, endereço, dados financeiros ou biometria.</p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Autenticar sua conta e exibir seus documentos (execução do serviço — art. 7º, V).</li>
        <li>
          Manter trilha de auditoria e prevenir abuso, como excesso de verificações (legítimo
          interesse — art. 7º, IX).
        </li>
      </ul>
      <p>Não vendemos dados, não exibimos anúncios e não usamos ferramentas de analytics de terceiros.</p>

      <h2>O que vai para a blockchain</h2>
      <p>
        Apenas a <strong>impressão digital (hash SHA-256)</strong> do documento e uma referência
        interna de armazenamento, gravadas pela carteira do servidor DocChain na rede de testes
        Sepolia. Seu nome, seu e-mail e o conteúdo do arquivo <strong>nunca</strong> vão para a
        blockchain. A impressão digital não permite reconstruir o documento.
      </p>
      <p>
        Registros em blockchain são <strong>permanentes</strong>: não podem ser apagados por ninguém,
        nem por nós. Ao excluir sua conta, o vínculo entre você e essas impressões digitais é
        removido do nosso banco, e elas passam a ser registros anônimos.
      </p>

      <h2>Com quem compartilhamos</h2>
      <ul>
        <li>
          <strong>Provedor de e-mail:</strong> ao usar &quot;Compartilhar por e-mail&quot;, o arquivo
          original, o comprovante em PDF e o e-mail do destinatário passam pelo nosso provedor de
          envio (SMTP) para chegar ao destinatário que você escolheu.
        </li>
        <li>
          <strong>Rede Ethereum Sepolia:</strong> recebe apenas a impressão digital descrita acima.
        </li>
      </ul>

      <h2>Seus direitos</h2>
      <p>
        Na página <Link href="/conta" className="text-primary hover:underline">Minha conta</Link> você
        pode, a qualquer momento:
      </p>
      <ul>
        <li>
          <strong>Acessar e levar seus dados:</strong> exportar um arquivo JSON com cadastro,
          documentos e compartilhamentos.
        </li>
        <li>
          <strong>Corrigir:</strong> alterar seu nome.
        </li>
        <li>
          <strong>Eliminar:</strong> excluir a conta. Apagamos seus documentos e arquivos cifrados e
          tornamos anônimos os registros de atividade (o IP e o navegador são mantidos sem vínculo
          com você, para segurança).
        </li>
      </ul>

      <h2>Segurança</h2>
      <p>
        Arquivos cifrados em repouso, senhas com bcrypt, sessão em cookie httpOnly e limites de
        requisições contra abuso.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre esta política ou sobre seus dados podem ser enviadas para{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}
