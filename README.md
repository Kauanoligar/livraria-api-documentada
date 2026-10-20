# API de Livraria — Segurança e Documentação OpenAPI

**Aluno:** Kauan Oliveira Garcia

**Matrícula:** 2421438

**Disciplina:** Desenvolvimento de API Back-End

Evolução da API da aula anterior em Node.js/Express, mantendo BCrypt, JWT stateless e controle de acesso por perfis (USER e ADMIN). O contrato utiliza **OpenAPI 3.0.3** e **Swagger UI**.

## Executar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm ci
cp .env.example .env
# Edite JWT_SECRET no .env com uma chave longa e aleatória.
npm start
```

No Windows, pode copiar `.env.example` para `.env` pelo explorador de arquivos. O servidor inicia na porta 3000, ou na porta definida em `PORT`.

- Interface interativa: http://localhost:3000/docs/
- Especificação JSON: http://localhost:3000/api-docs.json

A documentação é pública. O Swagger UI é servido pela dependência local, sem exigir CDN. Os testes interativos usam o mesmo servidor da interface.

## Testar autenticação no Swagger

1. Abra `/docs/` e expanda `POST /api/v1/auth/login`.
2. Clique em **Try it out**, informe uma das contas de demonstração e clique em **Execute**.
3. Copie apenas o valor de `token` retornado.
4. Clique em **Authorize**, cole somente o token (sem escrever `Bearer`) e confirme.
5. Teste os endpoints protegidos. A interface envia `Authorization: Bearer <token>` automaticamente.
6. Para trocar de perfil, use **Logout** no painel Authorize e autorize com o novo token.

Contas criadas automaticamente no primeiro uso do banco de demonstração:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| ADMIN | admin@livraria.com | Admin@123 |
| USER | leitor@gmail.com | Usuario@123 |

Estas contas são exclusivas para demonstração acadêmica. Troque as credenciais antes de disponibilizar a aplicação fora desse contexto. Cadastros públicos sempre recebem USER, mesmo que enviem um campo `role`.

## Matriz de endpoints

| Método | Rota | Acesso | Sucesso | Falhas documentadas |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/livros` | Público | 200 | 500 |
| GET | `/api/v1/livros/{id}` | Público | 200 | 404, 500 |
| GET | `/api/v1/autores` | Público | 200 | 500 |
| POST | `/api/v1/auth/register` | Público | 201 | 400, 409, 500 |
| POST | `/api/v1/auth/login` | Público | 200 | 400, 401, 500 |
| POST | `/api/v1/livros/{id}/comentarios` | USER ou ADMIN | 201 | 400, 401, 403, 404, 500 |
| POST | `/api/v1/autores` | ADMIN | 201 | 400, 401, 403, 500 |
| POST | `/api/v1/livros` | ADMIN | 201 | 400, 401, 403, 404, 500 |

**400**: corpo ausente/malformado ou campos inválidos. **401**: credenciais incorretas, token ausente, expirado ou inválido. **403**: perfil sem permissão. **404**: livro/autor inexistente. **409**: e-mail já cadastrado. As respostas de erro seguem `{ "erro": "mensagem" }`.

## Contratos

`docs/openapi.json` contém sumários, descrições, parâmetros de rota, esquemas de entrada e saída, campos obrigatórios, tipos, exemplos, respostas de erro e o esquema HTTP Bearer/JWT. A validação dos corpos de entrada reutiliza os schemas desse arquivo em `middlewares/validateBody.js`, reduzindo divergências entre a documentação e a execução.

Exemplos de corpos:

```json
{ "nome": "Maria Silva", "email": "maria@example.com", "senha": "Leitura@123" }
```

```json
{ "nome": "Clarice Lispector", "nacionalidade": "Brasileira" }
```

```json
{ "titulo": "A Hora da Estrela", "ano": 1977, "autor_id": 1 }
```

```json
{ "texto": "Uma leitura marcante!" }
```

O `autor_id` precisa existir. O nome do autor do comentário vem do JWT. Senhas e hashes não são retornados. O campo `ano` é opcional e assume o ano atual; `nacionalidade` é opcional e assume `Não informada`.

## Verificação automatizada

```bash
npm test
```

Os testes sobem um servidor em porta aleatória e usam banco temporário isolado. Verificam acesso à interface e ao JSON, as oito operações documentadas, cadastro e conflito de e-mail, login, respostas 200/201/400/401/403/404/409, autorização dos perfis, tokens inválidos/expirados e validação de tipos/JSON. O banco de desenvolvimento não é alterado.

## Organização

- `routes/`: rotas e guardas de acesso.
- `controllers/`: entrada HTTP e respostas.
- `services/`: regras de negócio e autenticação.
- `repositories/`: persistência local em `database.txt`.
- `middlewares/`: autenticação, autorização, validação e erros.
- `docs/openapi.json`: contrato formal.
- `test/api.test.js`: testes de integração.

A persistência em arquivo é a implementação didática da aula anterior; não foi substituída por outro banco nesta atividade.
