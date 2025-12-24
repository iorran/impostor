# Testes E2E com Playwright

Este diretório contém testes end-to-end (E2E) para simular o fluxo completo do jogo Impostor.

## Instalação

Primeiro, instale as dependências do Playwright:

```bash
npm install
npx playwright install
```

## Configuração

Certifique-se de que as variáveis de ambiente estão configuradas no arquivo `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## Executando os Testes

### Executar todos os testes

```bash
npm run test:e2e
```

### Executar com interface gráfica (UI Mode)

```bash
npm run test:e2e:ui
```

### Executar em modo headed (com navegador visível)

```bash
npm run test:e2e:headed
```

### Executar em modo debug

```bash
npm run test:e2e:debug
```

## Testes Disponíveis

### 1. Fluxo Completo do Jogo (`game-flow.spec.ts`)

Simula um jogo completo com múltiplos players:

- ✅ Host cria uma sala
- ✅ Player 2 entra na sala
- ✅ Player 3 entra na sala
- ✅ Verifica que todos os players aparecem na sala
- ✅ Host inicia o jogo
- ✅ Verifica que todos os players recebem suas palavras
- ✅ Host reinicia a rodada
- ✅ Verifica que todos os players recebem novas palavras
- ✅ Verifica que as palavras não desaparecem após alguns segundos

### 2. Configuração de Impostores

Testa se o host pode configurar o número de impostores usando o slider.

### 3. Validação de Mínimo de Players

Testa se o botão de iniciar está desabilitado quando há menos de 3 players.

## Estrutura dos Testes

Os testes usam múltiplos contextos do navegador para simular diferentes players simultaneamente:

```typescript
const hostContext = await browser.newContext();
const player2Context = await browser.newContext();
const player3Context = await browser.newContext();
```

Isso permite testar interações em tempo real entre múltiplos players.

## Notas

- Os testes esperam que o servidor de desenvolvimento esteja rodando na porta 8081
- Os testes usam timeouts apropriados para aguardar operações assíncronas
- Os testes verificam que as palavras não desaparecem após reiniciar a rodada

