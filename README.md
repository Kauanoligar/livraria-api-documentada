
## Verificação manual dos requisitos

1. `GET /api/v1/livros` sem token → **200**.
2. `GET /api/v1/livros/1` sem token → **200**.
3. `POST /api/v1/auth/register` → **201** e o novo usuário recebe `USER`.
4. `POST /api/v1/auth/login` com senha correta → **200** + JWT.
5. Login com senha incorreta → **401**.
6. Comentário sem token → **401**.
7. Comentário com token USER → **201**.
8. `POST /api/v1/autores` sem token → **401**.
9. `POST /api/v1/autores` com token USER → **403**.
10. `POST /api/v1/autores` com token ADMIN → **201**.
11. `POST /api/v1/livros` sem token → **401**.
12. `POST /api/v1/livros` com token USER → **403**.
13. `POST /api/v1/livros` com token ADMIN → **201**.
