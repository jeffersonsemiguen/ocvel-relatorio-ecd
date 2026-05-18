# n8n Workflows — ECD Painel

## zeramento_v1.json

Webhook que recebe eventos de zeramento do gClick e cria fechamentos no Supabase.

### Importar no n8n

1. No n8n, acesse **Workflows → Import from File**
2. Selecione `zeramento_v1.json`
3. Configure as variáveis de ambiente no n8n:
   - `SUPABASE_FUNCTIONS_URL` = URL base das Edge Functions (ex: `https://xxx.supabase.co/functions/v1`)
   - `SUPABASE_SERVICE_ROLE_KEY` = Service role key do projeto

### Endpoint do webhook

Após ativar o workflow, o gClick deve enviar `POST` para:

```
https://{n8n-url}/webhook/zeramento
```

### Payload esperado

```json
{
  "codigo_empresa": "BASSO",
  "ano": 2025,
  "periodo_codigo": "ANUAL",
  "arquivos_pdf": []
}
```
