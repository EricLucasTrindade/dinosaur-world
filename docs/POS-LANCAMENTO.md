# Relatório — melhorias e atualizações pós-lançamento

**Projeto:** Dinosaur World  
**Escopo:** o que fazer **depois** de publicar o repositório no GitHub no estado atual.  
**Princípio:** estabilidade primeiro. Uma fase de cada vez. Sem CMS, sem biblioteca nova, sem reabrir a regra de negócio da árvore.

Este documento não altera o código. É o roteiro do que foi combinado e, em seguida, revertido propositalmente para o lançamento não depender de perfil de produção.

---

## 1. Onde o sistema está hoje

### Já está no código (sobe no GitHub agora)

| Área | O que já existe |
|---|---|
| Árvore | Cladograma circular, dossiê, i18n, fundos, globo/mapas, áudio |
| Filtro | Busca, New/Leaving/Old, dieta, país, continente, contador, limpar |
| Dinossauros | Seed Java (`RosterCatalog` + `OrnithischiaRoster` / `TheropodaRoster` / `SauropodomorphaRoster` / `StemRoster`) |
| Répteis | CSV `backend/src/main/resources/seed/repteis-mesozoico.csv` |
| Ficha | `FichaEnrichment` preenche só campo **nulo** (dieta, país, som) |
| Dieta | `DietaPorClado` (clado + override de gênero) |
| País | `enrichment/genera-paises.csv` |
| Globo | `enrichment/genera-localidades.csv` (coordenada ≠ país) |
| Som | `enrichment/genera-sons.csv` + MP3 em `frontend/public/audio/dinos/` |
| Texto/foto do dossiê | Wikipedia ao vivo (`frontend/src/lib/wiki.ts`) — **não** está no banco |
| API local | `http://localhost:8082`, Vite em `5173` com proxy `/api` |
| CORS | Só `localhost:5173` e `127.0.0.1:5173` |
| Escrita | `POST` / `PUT` / `DELETE` ligados (uso local) |

### Ficou de fora de propósito (não vai no lançamento)

A rodada de “produção / API pública” foi **revertida** porque o `EscritaApiFilter` quebrou a recompilação no Spring Boot **4.1** (Java 25). Isso inclui:

- perfil `prod`
- trava de escrita
- CORS por variável de ambiente
- `GET /api/health`
- `VITE_API_URL`
- README de página pública

A intenção permanece: **primeiro GitHub no estado atual; depois o host da API**.

### Você mesmo (áudio)

Os MP3 que ainda faltam: copiar para `frontend/public/audio/dinos/` e, se o nome do arquivo não for o do perfil de clado, acrescentar linha em `genera-sons.csv`. Não precisa de código.

---

## 2. Ordem das fases (não inverter)

```
Fase 0  Lançar o GitHub como está
   ↓
Fase 1  Site estático (Pages + domínio) — ainda sem API pública
   ↓
Fase 2  API de leitura em host próprio (dois hosts)
   ↓
Fase 3  Centralizar a árvore dos dinossauros em CSV (passo 5)
   ↓
Fase 4  Ajustes pequenos e opcionais
```

Não misture Fase 2 com Fase 3 no mesmo commit. A Fase 2 mexeu na compilação uma vez; a Fase 3 mexe no seed. Isolar reduz o risco.

---

## Fase 0 — Lançar o GitHub como está

Objetivo: o repositório público espelha o que roda no IntelliJ hoje.

### Passos

1. Confirme que o projeto **compila** no IntelliJ (`DinosaurWorldApplication`) com:

   ```
   DB_URL=jdbc:postgresql://localhost:5545/dinosaurworld
   DB_USER=dinosaurworld
   DB_PASSWORD=dinosaurworld
   ```

2. Banco: na pasta `dinosaur-world/`:

   ```bash
   docker compose up -d
   ```

3. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Crie o repositório no GitHub (privado ou público, à sua escolha).  
   **Não** coloque `.env` com senha. O `.gitignore` já ignora `.env`.

5. Não ative ainda GitHub Pages se a API não existir: o site chamaria `/api` no próprio Pages e a árvore falharia.  
   Páginas + domínio **sem** API só fazem sentido se você aceitar a tela de erro de carga — não é o caso. Por isso a Fase 1 e a Fase 2 andam juntas na prática: o domínio só “acende” quando a API estiver no ar.

6. Áudios restantes podem entrar em commits seguintes, sem esperar as outras fases.

### O que o seed **não** inclui

A página 5 do PDF (Ceratopsia basal) veio corrompida (`A`, `Aa`). Esses nomes **não** entram. Corrija pelo banco (ou, na Fase 3, pela linha do CSV) quando tiver a fonte íntegra.

---

## Fase 1 + 2 — Dois hosts: site estático + API de leitura

### Arquitetura

```
Visitante
    │
    ├─ https://seudominio.com          GitHub Pages (HTML, JS, CSS, /mapas, /audio, /fundos)
    │         │
    │         └─ fetch https://api.seudominio.com/api/taxons/arvore
    │
    └─ https://api.seudominio.com      Spring Boot 4.1 + PostgreSQL  (GET only)
```

O GitHub Pages **não** executa Java. A API precisa de outra máquina (VPS, Oracle Cloud, Render com Docker, etc.).

**Restrição crítica:** o `pom.xml` pede **Java 25**. A maior parte dos PaaS “Java” ainda oferece 17/21. Em produção, empacote **você** o JDK 25 via Docker. Não dependa da versão Java do provedor.

### 2.1 Backend — Docker com JDK 25

Na pasta `backend/`, um `Dockerfile` (criar na Fase 2, não agora):

```dockerfile
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY target/dinosaur-world-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","app.jar"]
```

Build:

```bash
cd backend
mvn -DskipTests package
docker build -t dinosaur-world-api .
```

O PostgreSQL de produção é **outro** volume/serviço, não a porta 5545 do `docker-compose.yml` local. Guarde senha fora do Git.

### 2.2 Perfil `prod` — arquivos a criar

`backend/src/main/resources/application-prod.yaml`:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: ${JPA_DDL:validate}

app:
  api:
    escrita: ${API_ESCRITA:false}
  cors:
    origins: ${CORS_ORIGINS:}
```

Em `application.yaml` (dev continua como está), acrescentar **somente**:

```yaml
app:
  seed:
    enabled: ${SEED_ENABLED:true}
  api:
    escrita: ${API_ESCRITA:true}
  cors:
    origins: ${CORS_ORIGINS:http://localhost:5173,http://127.0.0.1:5173}
```

Variáveis no host da API:

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8082
DB_URL=jdbc:postgresql://HOST:5432/dinosaurworld
DB_USER=...
DB_PASSWORD=...
CORS_ORIGINS=https://seudominio.com,https://www.seudominio.com
API_ESCRITA=false
SEED_ENABLED=true
```

**Primeira subida do schema**

1. Suba uma vez com `JPA_DDL=update` (tabela vazia → seed + enrichment).
2. Confira no log: seed gravado, enrichment sem erro.
3. **Tire** `JPA_DDL`. O perfil volta a `validate`.  
   Em produção permanente, `update`/`create` não ficam ligados.

O seed já é inerte quando `taxon` tem linhas (`DataLoader` só grava se `count() == 0`). Pode deixar `SEED_ENABLED=true`.

### 2.3 CORS a partir do ambiente

Substituir origens fixas em `CorsConfig.java`:

- Ler `app.cors.origins` (lista separada por vírgula).
- Métodos: se `app.api.escrita=false`, só `GET` e `OPTIONS`.
- Se `escrita=true` (local), manter `GET, POST, PUT, DELETE, OPTIONS`.
- Origem vazia em `prod` = não liberar ninguém (falha explícita, melhor do que `*`).

Não adicione Spring Security. O comentário atual do `CorsConfig` continua válido.

### 2.4 Trava de escrita — **não** use `OncePerRequestFilter`

A tentativa anterior (`EscritaApiFilter extends OncePerRequestFilter`) **não compilou** neste Spring Boot 4.1 / `spring-boot-starter-webmvc`. Não reabra essa classe.

Caminho seguro, alinhado ao que já existe (`CorsConfig implements WebMvcConfigurer`):

1. Propriedade `app.api.escrita` (record pequeno, mesmo estilo de `SeedProperties`).
2. `HandlerInterceptor` no pacote `config`:
   - Se `escrita == true`, deixa passar.
   - Se método é `GET`, `HEAD` ou `OPTIONS`, deixa passar.
   - Senão: HTTP **403** e corpo JSON simples (`{"detail":"API somente leitura"}`).
3. Registrar o interceptor em `CorsConfig.addInterceptors` (ou numa classe `WebMvcConfigurer` irmã). **Não** criar filtro servlet.

Não use Actuator (seria dependência nova). Sonda:

```java
@RestController
@RequestMapping("/api/health")
public class HealthController {
    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
```

Confirme no IntelliJ **antes** de qualquer deploy: `mvn test` / Build Project. Se o interceptor não compilar, pare. Não invente Filter servlet para “contornar”.

### 2.5 Mover e catálogo (correção pequena, junto da Fase 2)

Hoje `TaxonService.mover` atualiza o catálogo **só do nó movido**. Os filhos ficam no catálogo antigo e somem da árvore do ramo novo.

Inclusão isolada:

- `TaxonRepository.findByParent_Id(Long parentId)`
- Método privado `alinharCatalogoDaSubarvore` (fila, teto 10_000)
- Teste `mover_propagaCatalogoAosFilhos`

Em `prod` isso fica atrás da trava de escrita (o público não chama `PUT /mover`). O teste local continua necessário.

### 2.6 Frontend — URL da API no build

O Vite **não** lê variável em runtime no Pages. A URL entra na hora do `npm run build`.

1. `frontend/src/vite-env.d.ts`:

   ```ts
   interface ImportMetaEnv {
     readonly VITE_API_URL: string;
   }
   ```

2. Em `frontend/src/lib/api.ts` e `localidade.ts`, prefixar os `fetch`:

   ```ts
   const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
   export function apiUrl(caminho: string) {
     return `${API_BASE}${caminho}`;
   }
   ```

   Local: `VITE_API_URL` vazio → continua `/api` → proxy do Vite.  
   Produção: `VITE_API_URL=https://api.seudominio.com`.

3. `frontend/.env.example` (commitado):

   ```
   # Vazio = proxy local. Produção: URL absoluta da API, sem barra no fim.
   VITE_API_URL=
   ```

4. Build de publicação:

   ```bash
   cd frontend
   VITE_API_URL=https://api.seudominio.com npm run build
   ```

5. `vite.config.ts`: com **domínio próprio** na raiz, `base: '/'`.  
   Só use `base: '/nome-do-repo/'` se o site for `usuario.github.io/nome-do-repo/` **sem** domínio.

Mapas (`/mapas/*.geojson`), áudio e fundos **permanecem no site estático**. A API não serve esses arquivos.

### 2.7 GitHub Pages + domínio

1. Settings → Pages → Deploy from branch (ou Action que publica `frontend/dist`).
2. DNS do domínio:
   - Apex (`seudominio.com`): registros A do GitHub Pages, ou ALIAS se o DNS permitir.
   - `www`: CNAME para `usuario.github.io`.
3. Arquivo `frontend/public/CNAME` com uma linha: `seudominio.com` (o build copia para `dist/`).
4. HTTPS no Pages (Let’s Encrypt do GitHub). Espere o certificado antes de apontar `CORS_ORIGINS` para `https://`.
5. A API precisa de HTTPS próprio (`api.seudominio.com` → reverse proxy nginx/Caddy na frente do container 8082). Sem HTTPS, o browser bloqueia o `fetch` (página HTTPS falando com HTTP).

O app é **uma única rota** (`App.tsx` só renderiza `ArvorePage`). Não precisa de `404.html` de SPA, mas não atrapalha copiar `index.html` → `404.html` no `dist` se o Pages reclamar de caminho.

### 2.8 Checklist de fumaça (Fase 2)

No navegador, origem = domínio público:

1. `GET https://api.seudominio.com/api/health` → `{"status":"UP"}`.
2. Árvore carrega (Sauropsida).
3. Abrir um gênero: ficha, dieta ou “sem registro”, globo.
4. `POST https://api.seudominio.com/api/taxons` → **403**.
5. Origem `http://localhost:5173` contra a API de prod → CORS recusa (esperado).
6. Dev local: escrita ainda funciona, proxy `/api` ainda funciona.

---

## Fase 3 — Centralizar a ficha / árvore sem hardcode (passo 5)

### O problema

| Fonte | Formato hoje |
|---|---|
| Dinossauros (árvore) | Classes Java (`*Roster.java`) |
| Répteis (árvore) | CSV |
| Dieta fallback | Mapa Java `DietaPorClado` |
| País / globo / som | CSV de enrichment |
| Texto e ilustração | Wikipedia no browser |

O passo 5 **não** é um CMS. É deixar a árvore dos dinossauros no mesmo modelo dos répteis: **arquivo de dados + loader**, Java só interpreta.

### 3.1 O que NÃO fazer

- Não criar painel admin, Markdown por animal, nem banco “CMS”.
- Não gravar o extrato da Wikipedia no Git (desatualiza, licença, i18n já resolve no cliente).
- Não apagar `DietaPorClado`: ele continua fallback quando a coluna `dieta` do CSV vier vazia.
- Não mudar a tabela `taxon` nem o contrato JSON da árvore.
- Não unificar globo e país num único CSV (são fatos diferentes: ISO vs lat/lng).

### 3.2 Formato do CSV dos dinossauros

Novo arquivo, espelhando o dos répteis:

`backend/src/main/resources/seed/dinosauromorpha.csv`

Cabeçalho (o mesmo espírito de `repteis-mesozoico.csv`):

```
catalogo;nome;tipo;pai;dieta;pais_codigo;pais_nome;inicio_ma;fim_ma;status;idade;localidade;fonte
```

Regras:

- `catalogo` = `DINOSAUROMORPHA`.
- `tipo` = `CLADE` / `FAMILY` / `GENUS` / `SPECIES` (os enums atuais).
- `pai` vazio só na raiz `Dinosauromorpha`.
- `status` do roster: vazio, `NEW`, `LEAVING`, `OLD` (não usar o filtro de sinônimo dos répteis).
- `LEAVING`: preencher origem do clado (hoje `origemClado` no Java; pode ser coluna extra `origem_clado` no fim, sem quebrar as 13 primeiras).
- Dieta/país **podem** ficar vazios: o `FichaEnrichment` completa depois.
- Um gênero **não** pode aparecer duas vezes (a mesma garantia de `RosterCatalog.garantirGenerosUnicos`).

### 3.3 Como gerar o CSV (export, não reescrita manual)

1. Subir o backend local **uma vez** com o seed Java atual (fonte íntegra do PDF).
2. Script **interno** (classe `main` de teste ou `ApplicationRunner` de uso único, depois apagar) que percorre `taxon` com `catalogo = DINOSAUROMORPHA` e escreve o CSV.
3. Conferir: mesma quantidade de gêneros, mesmos `NEW`/`LEAVING`/`OLD`, Ceratopsia basal continua sem `A`/`Aa`.
4. Só então o loader passa a ler o CSV.

Não edite à mão milhares de linhas a partir das classes. Exporte do banco que o seed Java já populou.

### 3.4 Loader

Espelhar `ReptileRosterLoader` (`@Order(10)`):

- Se já existir raiz `Dinosauromorpha` naquele catálogo, **não** recarrega (igual aos répteis).
- `DataLoader` atual **sai** ou fica atrás de flag `app.seed.java=false` (default no CSV). Preferência: um único loader CSV para dinossauros, classes `*Roster` permanecem no Git **só** como referência histórica até você apagar num commit posterior, quando o CSV estiver estável.

Ordem dos runners (já usada):

| Order | Classe | Papel |
|---|---|---|
| 10 | seed dinossauros | árvore |
| 15 | `ReptileRosterLoader` | répteis |
| 20 | `FichaEnrichment` | nulos |

### 3.5 O que continua fora do CSV da árvore

| Dado | Onde fica |
|---|---|
| Coordenada / paleocoordenada | `genera-localidades.csv` |
| País se o CSV da árvore vier vazio | `genera-paises.csv` + `DietaPorClado` / herança |
| MP3 | `genera-sons.csv` + pasta `public/audio` |
| Costa do globo | `frontend/public/mapas/costa-*.geojson` |
| Texto da ficha | Wikipedia |

Se no futuro quiser texto próprio (sem Wikipedia), aí sim um `enrichment/genera-textos.csv` (`nome;idioma;resumo`) lido **só** se existir linha. Não misturar com a árvore. Não implementar agora.

### 3.6 Testes mínimos da Fase 3

- Contagem de gêneros CSV = contagem atual do seed Java.
- Gênero duplicado → recusa na leitura (mesmo critério de `garantirGenerosUnicos`).
- `Hypsilophodon` NEW, um `LEAVING` com `origem_clado`, um `OLD`.
- Enrichment ainda não sobrescreve dieta já preenchida no CSV.
- Restart com tabela cheia: zero insert.

---

## Fase 4 — Opcionais, um de cada vez

Só depois que a API pública e o CSV estiverem estáveis.

### 4.1 Áudio restante

Você. Pasta `frontend/public/audio/dinos/` + linha opcional em `genera-sons.csv`. Reinício do backend só se mudar o CSV (enrichment). MP3 novo no `public/` não exige Java.

### 4.2 Ceratopsia basal (`A`, `Aa`)

Quando houver o PDF íntegro: **uma** linha (ou duas) no CSV da Fase 3, ou um `POST` local se a Fase 3 ainda não tiver sido feita. Sem parser de PDF novo.

### 4.3 Filtro por período geológico

Foi citado na análise do filtro e **não** foi pedido. Os CSVs de répteis já têm `inicio_ma` / `fim_ma`, mas o loader **não** grava isso em `taxon` (a entidade não tem coluna de idade).

Para filtrar por período de verdade:

1. Colunas em `taxon` (`inicio_ma`, `fim_ma`) **ou** CSV só no frontend — preferir colunas no banco, iguais ao restante da ficha.
2. Preencher no loader CSV + enrichment.
3. Chip na toolbar, critério em `filtroArvore.ts`.

Isso é mudança de schema. Fazer num commit só, com teste de filtro, sem misturar com host.

### 4.4 Inventário de ficha incompleta

O log do `FichaEnrichment` já lista gênero sem dieta/país. Depois do lançamento: olhar o log de uma subida limpa e completar `genera-paises.csv` / `genera-localidades.csv` pontualmente. PBDB: usar `loc` (não `show=cc`); código de país `GB` (não `UK`).

---

## 5. Mapa de arquivos (quando for implementar)

### Fase 2 (host)

| Ação | Arquivo |
|---|---|
| Criar | `application-prod.yaml` |
| Criar | `Dockerfile` (backend) |
| Criar | `HealthController.java` |
| Criar | `ApiProperties.java`, `CorsProperties.java` |
| Criar | interceptor de escrita (não Filter) |
| Criar | `frontend/.env.example`, `vite-env.d.ts` |
| Alterar | `CorsConfig.java`, `application.yaml` |
| Alterar | `api.ts`, `localidade.ts` |
| Alterar | `TaxonService` / `TaxonRepository` (catálogo dos filhos) |
| Alterar | `README.md` (seção Página pública) |
| Não criar | `EscritaApiFilter.java` |

### Fase 3 (CSV dinossauros)

| Ação | Arquivo |
|---|---|
| Criar | `seed/dinosauromorpha.csv` |
| Criar | loader no estilo de `ReptileRosterLoader` |
| Alterar ou aposentar | `DataLoader.java` + `*Roster.java` |
| Não mexer | contrato de `TaxonArvoreResponse` / `TaxonResponse` |

---

## 6. Riscos (ler antes de cada fase)

1. **Java 25** — host sem Temurin 25 não sobe o JAR. Docker resolve.
2. **`ddl-auto=update` em prod** — só a primeira vez, depois `validate`.
3. **CORS `*`** — não usar. Lista fechada do domínio.
4. **API com escrita na internet** — a árvore pública seria vandalizável. `API_ESCRITA=false` é obrigatório no host público.
5. **`VITE_API_URL` errada no build** — o site aponta para localhost ou para Pages. Rebuild obrigatório se a URL da API mudar.
6. **Seed CSV mal exportado** — gêneros a menos, `LEAVING` sem origem, duplicata. Comparar contagens antes de aposentar o Java.
7. **Filtro servlet (`OncePerRequestFilter`)** — já quebrou a compilação. Interceptor MVC.

---

## 7. Resumo executivo

1. Agora: GitHub no estado atual; áudios quando quiser.  
2. Depois: dois hosts (Pages + API Docker Java 25), CORS por env, escrita desligada por **interceptor**, `VITE_API_URL` no build.  
3. Em seguida: árvore dos dinossauros em CSV, igual aos répteis; `DietaPorClado` e CSVs de enrichment continuam.  
4. Por último, e só se precisar: período geológico, Ceratopsia basal, textos próprios.

Nenhuma dessas fases é necessária para o primeiro `git push`.
