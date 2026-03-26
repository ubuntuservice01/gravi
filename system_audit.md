# Auditoria de Integridade: MotoGest v2

Realizei uma análise profunda ("look well") comparando o código frontend com a estrutura atual da base de dados e os requisitos do Phase 4. Identifiquei as seguintes lacunas que precisam de ser corrigidas para o sistema ser 100% operacional.

## 1. Divergência de Nomenclatura (O Problema Principal)
Existem componentes a usar nomes de colunas antigos (Geralmente em português ou versões iniciais) que não coincidem com o novo Schema V3 (Inglês).

| Componente | Variável no Código | Coluna Necessária (Schema) | Estado |
| :--- | :--- | :--- | :--- |
| **OwnerSearch** | `identity_document` | `bi_number` | ❌ Incompatível |
| **MotorcycleForm** | `registration_number`| `plate` | ❌ Incompatível |
| **MotorcycleForm** | `chassis_number` | `chassis` | ❌ Incompatível |
| **MotorcycleForm** | `manufacture_year` | `year` | ❌ Incompatível |
| **MotorcycleForm** | `engine_cc` | `cc` | ❌ Incompatível |
| **MotorcycleForm** | `vehicle_status` | `status` | ❌ Incompatível |
| **MotorcycleForm** | `operational_status`| `operational_situation` | ❌ Incompatível |
| **MotorcycleForm** | `mototaxist_name` | `taxi_driver_name` | ❌ Incompatível |
| **MotorcycleForm** | `vest_number` | `taxi_vest_number` | ❌ Incompatível |
| **MotorcycleForm** | `notes` | `observations` | ❌ Incompatível |

## 2. Tabelas em Falta ou Incompletas na BD
Se a tua base de dados foi criada antes da migração SaaS, as seguintes tabelas/colunas podem não existir:

1.  **`municipalities`**: Faltam colunas de branding (`primary_color`, `logo_url`) e contactos (`contact_email`).
2.  **`municipal_settings`**: Tabela crucial para o cálculo automático de taxas e multas. Provavelmente está vazia ou inexistente.
3.  **`licenses`**: Pode faltar a coluna `historical_id` para permitir renovações.

## 3. Automações Necessárias (Triggers)
Para que o fluxo de "Criar Município" funcione como discutido:
- É necessário um trigger que crie o perfil no Auth -> Profiles automaticamente.
- É necessário um trigger que crie as definições padrão do município assim que ele é inserido.

---

# Plano de Acção: "Alinhamento Total"

Vou proceder com as seguintes correções:

1.  **SQL Master**: Um único script que corrige TODAS as tabelas, adicionando colunas em falta e renomeando as antigas se necessário.
2.  **Refatoração do Frontend**: Vou atualizar o `MotorcycleForm.jsx`, `OwnerSearch.jsx` e `MotorcyclesList.jsx` para usarem os nomes de colunas padrão definidos no Schema.
3.  **Ativação de Triggers**: Garantir que a automação de perfis e definições municipais está ativa.

**Isto transformará o sistema numa plataforma SaaS robusta onde tudo "comunica" na mesma língua.**
