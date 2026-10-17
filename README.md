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
| `GET` | `/api/taxons/arvore` | Árvore aninhada (`?catalogo=`) |
| `GET` | `/api/taxons` | Lista plana (`?status=NEW` ou `LEAVING` ou `OLD`) |
| `GET` | `/api/taxons/{id}` | Detalhe |
| `GET` | `/api/taxons/{id}/localidade` | Sítio / globo |
| `POST` | `/api/taxons` | Incluir nó |
| `PUT` | `/api/taxons/{id}` | Corrigir nome, tipo, status |
| `PUT` | `/api/taxons/{id}/mover` | Troca o pai (não duplica) |
| `DELETE` | `/api/taxons/{id}` | Só se não tiver filhos |

Um gênero tem um único pai. Mover não duplica o registro.

## O que o seed não inclui

A página 5 do PDF (Ceratopsia basal) veio corrompida (`A`, `Aa`). Esses nomes não entram. Corrija pelo banco quando tiver a fonte íntegra.
