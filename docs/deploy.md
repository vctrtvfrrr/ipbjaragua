# Deploy

## Primeiro Usuário do painel

Depois de aplicar as migrações em produção, crie manualmente o primeiro **Usuário** ativo pelo banco. Ajuste o e-mail e o nome antes de executar:

```sql
INSERT INTO users (email, name, status)
VALUES ('email@gmail.com', 'Nome', 'active');

INSERT INTO user_permissions (user_id, entity, action)
SELECT u.id, e.entity, a.action
FROM users u
CROSS JOIN unnest(enum_range(NULL::entity)) AS e(entity)
CROSS JOIN unnest(enum_range(NULL::action)) AS a(action)
WHERE u.email = 'email@gmail.com';
```
