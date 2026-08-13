import { Bot, MessageCircle, Plug, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface GuiaConexaoProps {
  baseUrl: string;
  caminhoMcp: string;
}

const BLOCO_CLASS = 'overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 font-mono-num text-xs text-ink';

export function GuiaConexao({ baseUrl, caminhoMcp }: GuiaConexaoProps) {
  const configMcp = JSON.stringify(
    {
      mcpServers: {
        'portal-financeiro': {
          command: 'node',
          args: [caminhoMcp],
          env: { PORTAL_API_URL: baseUrl, PORTAL_API_TOKEN: 'cole-sua-chave-aqui' },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={15} className="text-brass" />
            Claude (Desktop ou Code) — via MCP
          </CardTitle>
          <Badge tone="favorable">Funciona já, local</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            O MCP roda na sua máquina e conversa com o portal em <code className="text-ink">{baseUrl}</code>. Não
            precisa expor nada na internet. Adicione ao arquivo de configuração do Claude:
          </p>
          <pre className={BLOCO_CLASS}>{configMcp}</pre>
          <p className="text-xs">
            No Claude Desktop o arquivo é <code className="text-ink">%APPDATA%\Claude\claude_desktop_config.json</code>;
            no Claude Code, use <code className="text-ink">claude mcp add</code>. Reinicie o Claude depois de salvar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot size={15} className="text-brass" />
            ChatGPT — via GPT Actions
          </CardTitle>
          <Badge tone="brass">Exige portal publicado</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            Em <span className="text-ink">Criar um GPT → Configure → Actions → Import from URL</span>, informe a
            especificação abaixo e escolha autenticação <span className="text-ink">API Key (Bearer)</span>:
          </p>
          <pre className={BLOCO_CLASS}>{baseUrl}/api/v1/openapi.json</pre>
          <p className="text-xs">
            O ChatGPT chama o portal a partir dos servidores da OpenAI, então este endereço precisa ser acessível pela
            internet — <code className="text-ink">localhost</code> não serve. Ver &ldquo;Publicar o portal&rdquo;
            abaixo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={15} className="text-brass" />
            Telegram e WhatsApp
          </CardTitle>
          <Badge tone="neutral">Precisa de um bot intermediário</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>
            Telegram e WhatsApp não consomem uma API diretamente: eles entregam mensagens a um bot, e é o bot que
            chama o portal. Com a API já pronta, o bot só precisa repassar a pergunta e devolver a resposta:
          </p>
          <pre className={BLOCO_CLASS}>{`curl -H "Authorization: Bearer <sua-chave>" \\
  "${baseUrl}/api/v1/kpis"`}</pre>
          <p className="text-xs">
            Para WhatsApp é necessária uma conta na API oficial da Meta (ou provedor como Twilio); para Telegram basta
            criar um bot com o @BotFather. Em ambos os casos o bot precisa estar hospedado, não na sua máquina.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug size={15} className="text-brass" />
            Publicar o portal (para ChatGPT, Telegram e WhatsApp)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>
            Hoje o portal roda apenas nesta máquina. O MCP do Claude funciona assim mesmo, mas os demais canais exigem
            um endereço público com HTTPS. Dois caminhos:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>
              <span className="text-ink">Túnel</span> (rápido, para testar): <code className="text-ink">cloudflared tunnel --url http://localhost:3000</code>.
            </li>
            <li>
              <span className="text-ink">Hospedagem</span> (definitivo): subir a aplicação e um Postgres gerenciado,
              apontando <code className="text-ink">PORTAL_PUBLIC_URL</code> para o domínio final.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
