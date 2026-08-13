# Plano de Remediação de Segurança

## Objetivo

Eliminar as brechas identificadas no checkout, pedidos, webhooks, APIs públicas, privacidade, uploads e dependências antes do próximo deploy de produção.

**Tipo:** aplicação web Next.js.  
**Premissas:** checkout continua aceitando convidado; apenas dono, gerente e funcionário operam pedidos; nenhuma resposta pública deve conter PII ou custo de produto.

## Critérios de sucesso

- Nenhum cliente, anônimo ou autenticado, lê ou altera pedidos de terceiros.
- O valor cobrado pelo Asaas é calculado exclusivamente no servidor a partir do catálogo e frete válidos.
- Todas as rotas caras ou mutáveis respondem `429` quando excedem o limite.
- Webhooks não processam eventos sem segredo configurado e assinatura/token válidos.
- `npm audit --omit=dev` não reporta vulnerabilidades alta ou crítica aceitas.

## Decisões de segurança

- **Acompanhamento de convidado:** criar token aleatório de rastreio, armazenar somente seu hash e expirá-lo. A URL usa o token; UUID do pedido nunca é autorização.
- **Confirmação de entrega:** token permite apenas `delivering -> delivered`; pagamentos e demais transições são exclusivos do webhook ou de funcionário autorizado.
- **Rate limit:** usar contador distribuído compatível com Vercel (Upstash Redis é o padrão proposto). A aprovação das credenciais é pré-requisito externo.
- **Frete:** criar uma cotação curta, vinculada ao endereço normalizado e ao carrinho; checkout revalida-a no servidor antes de cobrar.

## Tarefas

- [ ] **SEC-01 — Conter rotas de pedido expostas**  
  **Responsável:** security-auditor + backend-specialist. **Arquivos:** `src/app/api/pedidos/**`, `src/app/(store)/checkout/confirmacao/actions.ts`.  
  **Entrada → saída:** regras atuais de acesso → `GET /api/pedidos` limitado a `view_orders`, remoção do `POST` legado, leitura de pedido limitada a staff ou token de rastreio, e Server Actions com autorização própria.  
  **Verificar:** matriz anônimo/cliente/funcionário/gerente/dono retorna apenas `401`, `403` ou o subconjunto autorizado; cliente não consegue obter nem alterar pedido de terceiro.

- [ ] **SEC-02 — Tornar checkout imune a adulteração**  
  **Responsável:** backend-specialist + database-architect. **Arquivos:** `src/app/api/checkout/route.ts`, `src/app/api/frete/route.ts`, `src/lib/google-maps.ts`, `src/db/schema.ts`, páginas de checkout.  
  **Entrada → saída:** payload livre do navegador → schemas Zod estritos, IDs UUID, limites de texto/quantidade, catálogo e adicionais consultados no banco, preços/subtotal/total recalculados, cotação de frete com TTL e transação atômica.  
  **Verificar:** payload com preço, frete, quantidade, adicional ou status adulterado é rejeitado; o valor enviado ao Asaas é igual ao total calculado no servidor.

- [ ] **SEC-03 — Fechar transições e reembolsos de pedidos**  
  **Responsável:** security-auditor + backend-specialist. **Arquivos:** `src/app/(dashboard)/pedidos/actions.ts`, `src/app/api/pedidos/[id]/route.ts`, nova política em `src/lib/permissions.ts`.  
  **Entrada → saída:** checagem apenas de login → checagem central `can(role, action)`, máquina de estados explícita e autorização de cancelamento/reembolso exclusiva de staff elegível.  
  **Verificar:** cliente não aciona ações de dashboard; status inválido, regressão e reembolso não autorizado falham sem tocar no Asaas.

- [ ] **SEC-04 — Proteger webhooks e abuso de HTTP**  
  **Responsável:** backend-specialist + devops-engineer. **Arquivos:** webhooks Clerk/Asaas, `src/proxy.ts`, biblioteca de rate limit e configuração de deploy.  
  **Entrada → saída:** token opcional e chamadas ilimitadas → validação fail-closed antes do parse, corpo bruto para Svix, comparação segura, idempotência por evento/pagamento, limite de corpo, timeout e rate limit distribuído.  
  **Limites iniciais:** frete 20/15 min/IP; checkout 3/15 min/IP + identidade normalizada; status 30/min/token; cadastro e upload com limites por usuário.  
  **Verificar:** token ausente/inválido não altera banco; webhook repetido é idempotente; excesso recebe `429` sem chamar Google Maps ou Asaas.

- [ ] **SEC-05 — Reduzir exposição de dados e XSS**  
  **Responsável:** frontend-specialist + backend-specialist. **Arquivos:** store público, rotas de produtos, `next.config.ts`, logs de Maps/Asaas.  
  **Entrada → saída:** entidades completas e logs com PII → DTOs públicos sem `costPrice`, PII, URLs de pagamento ou dados internos; CSP inicialmente em Report-Only e depois em modo de bloqueio; logs estruturados e redigidos.  
  **Verificar:** resposta/RSC pública não contém `costPrice`; CSP não possui `unsafe-inline` amplo; testes de conteúdo malicioso continuam renderizando texto, nunca código.

- [ ] **SEC-06 — Privacidade, segredos e uploads**  
  **Responsável:** security-auditor + frontend-specialist. **Arquivos:** `src/stores/cart-store.ts`, checkout de endereço, UploadThing, `.env` e configuração operacional.  
  **Entrada → saída:** CPF/endereço persistidos no navegador, `.env` grupo-legível e `image/*` amplo → persistir somente carrinho não sensível, limpar dados de checkout, exigir `chmod 600 .env`, redigir logs e aceitar apenas JPEG/PNG/WebP de host permitido, sem SVG; avaliar antivírus no pipeline de upload.  
  **Verificar:** `localStorage` não contém CPF, telefone, e-mail ou endereço; upload SVG/arquivo disfarçado é recusado; nenhum segredo aparece em logs ou Git.

- [ ] **SEC-07 — Atualizar cadeia de dependências e controles do Clerk**  
  **Responsável:** devops-engineer + security-auditor. **Arquivos:** `package.json`, `package-lock.json`, CI e dashboard Clerk.  
  **Entrada → saída:** 17 vulnerabilidades altas → Next.js ao menos `16.3.0`, atualização compatível de Clerk/UploadThing/Sharp, lockfile revisado, `npm audit` e verificação de assinatura no CI; ativar no Clerk verificação de e-mail, bot protection/rate limit e MFA para equipe.  
  **Verificar:** audit sem alta/crítica aceita, build aprovado e testes de login continuam funcionais em homologação.

- [ ] **SEC-08 — Testes de regressão, deploy gradual e verificação final**  
  **Responsável:** test-engineer + security-auditor. **Dependências:** SEC-01 a SEC-07.  
  **Entrada → saída:** correções isoladas → testes unitários, integração e E2E para RBAC, BOLA/IDOR, preço adulterado, webhook, rate limit, upload e privacidade; deploy em homologação e produção com rollback definido.  
  **Verificar:** `npm run lint`, `npx tsc --noEmit`, `npm run build`, testes E2E, `npm audit --omit=dev`, `npm audit signatures` e security scan passam; monitoramento confirma ausência de 5xx, tentativas bloqueadas e custos anormais.

## Ordem e dependências

`SEC-01` e `SEC-02` bloqueiam o deploy. `SEC-03` depende de SEC-01; `SEC-04`, SEC-05, SEC-06 e SEC-07 podem seguir em paralelo; SEC-08 é sempre a última etapa.

## Rollout

1. Criar ambiente de homologação, credenciais de rate limit e cópia mascarada de dados.
2. Aplicar migrações aditivas (token de rastreio/cotação/evento) sem remover colunas.
3. Publicar controles de autorização, precificação e webhook antes de ativar os novos links de checkout.
4. Monitorar 24 horas; só então remover a rota legada e código de compatibilidade.

## Pronto quando

- [ ] Todos os oito itens acima estiverem verificados.
- [ ] Nenhuma vulnerabilidade crítica/alta do relatório permanecer aceita sem exceção documentada.
- [ ] O dono aprovar as configurações externas: rate limit, Clerk, Asaas, Maps e política de retenção de dados.
