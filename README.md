# Dinosaur World — roster setembro 2026

Backend Spring Boot + frontend React (cladograma circular).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. O Vite encaminha `/api` para o backend em `8082`.

- Árvore radial no estilo do cladograma de referência (setores, anéis, pontas em triângulo).
- Clique no animal abre um dossiê (ficha + ilustração da Wikipedia + anterior/próximo, no espírito do [roster em vídeo](https://www.youtube.com/watch?v=lDJQtyBq_VU)).
- Busca, filtro New/Leaving/Old, zoom (scroll) e pan (arrastar).

Espelha a estrutura do `viagem-legal`: JPA + PostgreSQL + variáveis de ambiente.

## Subir o banco

Na pasta `dinosaur-world`:

```bash
docker compose up -d
```

Porta do host: **5545** (não usa 5432 nem a 5544 do `viagem-legal`).

## IntelliJ

1. `File` → `Open` → pasta `dinosaur-world/backend` (ou a raiz, marcando o `pom.xml`).
2. `Run` → `Edit Configurations` → `Spring Boot` → `DinosaurWorldApplication`.
3. Aba **Environment variables**:

```
DB_URL=jdbc:postgresql://localhost:5545/dinosaurworld
DB_USER=dinosaurworld
DB_PASSWORD=dinosaurworld
```

A aplicação sobe em `http://localhost:8082`.

Na primeira subida, se a tabela `taxon` estiver vazia, o seed do PDF (saneado) é gravado. Recarregar o seed: `docker compose down -v` e subir de novo.

## API

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/api/health` | Sonda (`{"status":"UP"}`) |
| `GET` | `/api/taxons/arvore` | Árvore aninhada (`?catalogo=`) |
| `GET` | `/api/taxons` | Lista plana (`?status=NEW` ou `LEAVING` ou `OLD`) |
| `GET` | `/api/taxons/{id}` | Detalhe |
| `GET` | `/api/taxons/{id}/localidade` | Sítio / globo |
| `POST` | `/api/taxons` | Incluir nó (só com `API_ESCRITA=true`) |
| `PUT` | `/api/taxons/{id}` | Corrigir nome, tipo, status |
| `PUT` | `/api/taxons/{id}/mover` | Troca o pai (não duplica) |
| `DELETE` | `/api/taxons/{id}` | Só se não tiver filhos |

Um gênero tem um único pai. Mover não duplica o registro.

## O que o seed não inclui

A página 5 do PDF (Ceratopsia basal) veio corrompida (`A`, `Aa`). Esses nomes não entram. Corrija pelo banco quando tiver a fonte íntegra.

## Página pública

O GitHub Pages serve só o site estático (HTML, JS, CSS, mapas, áudio). A API Spring Boot precisa de outro host, com Java 25 via Docker. Sem a API no ar, não ligue o Pages: a árvore pediria `/api` no próprio Pages e falharia.

Arquitetura: visitante abre o domínio → o JavaScript chama `https://api.seudominio.com/api/taxons/arvore`.

### API no host

```bash
cd backend
mvn -DskipTests package
docker build -t dinosaur-world-api .
```

O `Dockerfile` empacota Temurin 25. Não dependa da versão Java do provedor. O PostgreSQL de produção é outro serviço, não a porta 5545 local. Senha fica fora do Git.

Variáveis no host:

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

Primeira subida do schema: `JPA_DDL=update` (tabela vazia → seed). Confira o log. Depois tire `JPA_DDL` — o perfil volta a `validate`.

`API_ESCRITA=false` é obrigatório na internet. POST/PUT/DELETE voltam 403. A trava é um interceptor MVC, não um filtro servlet.

CORS vazio em prod não libera ninguém. Não use `*`.

### Build do frontend

O Vite grava a URL da API na hora do build. Local: `VITE_API_URL` vazio continua no proxy `/api`.

```bash
cd frontend
VITE_API_URL=https://api.seudominio.com npm run build
```

Publique o `frontend/dist` no Pages. Com domínio próprio, `base` fica `/`. Sem domínio, a URL é `https://USUARIO.github.io/dinosaur-world/` e o `base` precisa ser `/dinosaur-world/`.

A API precisa de HTTPS próprio. Página HTTPS falando com HTTP é bloqueada pelo navegador.

Mapas, áudio e fundos ficam no site estático. A API não serve esses arquivos.
