# Sistema de Notificações e Dashboard UI - Módulo IA Busca

## 📋 Visão Geral

Sistema completo de notificações em tempo real e interface de dashboard para o módulo IA Busca do ImoAgent. Implementa alertas de matches de imóveis, mudanças de preço, novas propriedades e gestão avançada de preferências.

## 🎯 Funcionalidades Implementadas

### 1. NotificationService
**Localização**: `src/services/notifications/notification-service.ts`

Serviço central para gestão de notificações com:
- ✅ Criação de notificações (property_match, price_change, new_property)
- ✅ Sistema de subscrição pub/sub
- ✅ Histórico limitado a 100 notificações
- ✅ Marcação de lidas/não lidas
- ✅ Integração com Notificações do Browser
- ✅ Suporte a preferências via Supabase

**Exemplo de uso**:
```typescript
import { notificationService } from '@/services/notifications';

// Criar notificação de match
notificationService.notifyPropertyMatch({
  propertyId: 'abc123',
  matchScore: 85,
  matchReasons: ['Preço adequado', 'Localização premium'],
  property: {
    id: 'abc123',
    title: 'Apartamento T3',
    price: 450000,
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    location: 'Lisboa',
    images: []
  }
});

// Subscrever a notificações
const unsubscribe = notificationService.subscribe('property_match', (notification) => {
  console.log('Nova notificação:', notification);
});
```

### 2. React Hooks

#### useNotifications()
Hook para consumir notificações em componentes React:

```typescript
const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications('all');
```

#### useWebSocketNotifications()
Hook para notificações em tempo real via WebSocket:

```typescript
const { connected, error } = useWebSocketNotifications({ 
  userId: 'user-123', 
  enabled: true 
});
```

#### useNotificationPreferences()
Hook para gestão de preferências do utilizador:

```typescript
const { preferences, loading, error, updatePreferences } = useNotificationPreferences('user-123');
```

### 3. Componentes React

#### PropertyMatchCard
**Props**:
- `match: PropertyMatch` - Dados do imóvel e score
- `onViewDetails?: (id: string) => void`
- `onContact?: (id: string) => void`
- `showActions?: boolean`

**Características**:
- 📱 Design mobile-first responsivo
- 🎨 Badges de score coloridos (verde/azul/amarelo)
- 🏠 Display de AngariaScore e VendaScore
- 🖼️ Suporte a imagens
- 📊 Razões de match detalhadas
- ⚡ Ações rápidas (Ver Detalhes, Contactar)

#### SearchResultsGrid
**Props**:
- `properties: PropertyMatch[]`
- `onViewDetails?: (id: string) => void`
- `onContact?: (id: string) => void`
- `loading?: boolean`

**Filtros Avançados**:
- 💰 Faixa de preço (min/max)
- 📐 Área (min/max)
- 🛏️ Quartos e casas de banho mínimos
- 📍 Localização (texto livre)
- ⭐ Score mínimo de match
- 🔄 Ordenação customizável (score, preço, área, angaria, venda)

#### MatchAlertPanel
Painel lateral de alertas com:
- 🔔 Badge de contagem de não lidos
- 📱 Layout responsivo
- 🖼️ Thumbnails de imóveis
- ⏰ Timestamps relativos
- 🎯 Ações rápidas (Ver, Agendar, Contactar, Email)

#### LeadDashboard
Dashboard completo com:
- 📊 Cards de estatísticas
- 🔄 Navegação por abas (Pesquisa, Alertas, Configurações)
- 🔌 Integração de todos os componentes
- 📱 Layout mobile-first

#### NotificationPreferences
Interface de configurações com:
- 🔔 Toggle de notificações gerais
- 🔊 Som de notificações
- 💻 Notificações desktop (com permissão do browser)
- ✅ Tipos de notificação (matches, preço, novos, disponibilidade)
- 🎯 Filtros (score mínimo, mudança de preço mínima)
- 💰 Faixa de preço de interesse
- 📍 Localizações de interesse

### 4. WebSocket Server
**Localização**: `server.js` (atualizado)

**Eventos Implementados**:
- `subscribe-notifications` - Subscrever a notificações do utilizador
- `unsubscribe-notifications` - Cancelar subscrição
- `send-property-match` - Enviar match de imóvel
- `send-price-change` - Enviar mudança de preço
- `send-new-property` - Enviar novo imóvel

**Padrão de uso**:
```javascript
// Cliente
socket.emit('subscribe-notifications', { userId: 'user-123' });

// Servidor envia notificação
io.to(`notifications:${userId}`).emit('property-match', matchData);
```

## 🧪 Testes

### Testes Unitários - NotificationService
**Localização**: `__tests__/services/notification-service.test.ts`

✅ 11 testes implementados:
- ✓ Criação de notificações
- ✓ Emissão para subscritores
- ✓ Formatação de preços
- ✓ Marcação de lidas
- ✓ Gestão de histórico (limite 100)
- ✓ Sistema de subscrição/unsubscribe

**Executar**:
```bash
npm test -- __tests__/services/
```

### Testes de Componente - PropertyMatchCard
**Localização**: `__tests__/components/PropertyMatchCard.test.tsx`

✅ 10 testes implementados:
- ✓ Renderização de detalhes
- ✓ Display de scores
- ✓ Ações de callback
- ✓ Props condicionais
- ✓ Classes CSS dinâmicas

**Executar**:
```bash
npm test -- __tests__/components/
```

## 🚀 Como Usar

### 1. Acessar Demo Interativa
```
http://localhost:3000/ia-busca-demo
```

### 2. Integrar no Código

```typescript
// Em qualquer página ou componente
import { LeadDashboard } from '@/components/ia-busca';

export default function MyPage() {
  return <LeadDashboard userId="user-123" />;
}
```

### 3. Usar Notificações Customizadas

```typescript
import { notificationService, useNotifications } from '@/services/notifications';

function MyComponent() {
  const { notifications, unreadCount } = useNotifications('property_match');
  
  return (
    <div>
      <span>Alertas não lidos: {unreadCount}</span>
      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

## 📱 Design Mobile-First

Todos os componentes seguem princípios mobile-first:
- 📐 Grid responsivo (1 coluna mobile → 2 tablet → 3 desktop)
- 👆 Touch-friendly (botões mínimo 44x44px)
- 🎨 iOS-style com Tailwind CSS 4
- 🌗 Dark mode nativo
- ⚡ Animações suaves (transitions 200-300ms)

## 🔧 Dependências

```json
{
  "socket.io": "^4.8.3",
  "socket.io-client": "^4.8.3",
  "lucide-react": "^0.460.0",
  "zustand": "^4.4.7" (opcional para state global)
}
```

## 📝 Tipos TypeScript

Todos os tipos estão definidos em `src/services/notifications/notification-types.ts`:
- `Notification`
- `PropertyMatch`
- `PriceChange`
- `NotificationPreferences`
- `NotificationType`
- `NotificationPriority`

## 🎨 Cores e Scores

### Match Score
- 🟢 80-100: Emerald (texto-emerald-400)
- 🔵 60-79: Blue (texto-blue-400)
- 🟡 40-59: Yellow (texto-yellow-400)
- ⚪ 0-39: Gray (texto-slate-400)

### AI Scores
- 🔴 AngariaScore: Red badge (bg-red-500/90)
- 🟢 VendaScore: Green badge (bg-green-500/90)

## 📦 Estrutura de Arquivos

```
src/
├── services/notifications/
│   ├── index.ts
│   ├── notification-types.ts
│   ├── notification-service.ts
│   ├── notification-hooks.ts
│   └── websocket-hooks.ts
├── components/ia-busca/
│   ├── index.ts
│   ├── PropertyMatchCard.tsx
│   ├── SearchResultsGrid.tsx
│   ├── MatchAlertPanel.tsx
│   ├── LeadDashboard.tsx
│   └── NotificationPreferences.tsx
└── app/ia-busca-demo/
    └── page.tsx

__tests__/
├── services/
│   └── notification-service.test.ts
└── components/
    └── PropertyMatchCard.test.tsx
```

## 🔐 Segurança

- ✅ Supabase Row Level Security (RLS) para preferences
- ✅ User-specific WebSocket rooms (`notifications:${userId}`)
- ✅ Validação de permissões browser para notificações desktop
- ✅ Sanitização de inputs em filtros

## 🚦 Status

- ✅ **Completo**: NotificationService, Hooks, Componentes
- ✅ **Testado**: 21 testes passing (100%)
- ✅ **Documentado**: README, TSDoc comments
- ⚠️ **Pendente**: Integração com Supabase real (mock data atualmente)

## 📚 Próximos Passos

1. Conectar a dados reais via Supabase Edge Functions
2. Implementar persistência de notificações no banco
3. Adicionar push notifications (PWA)
4. Implementar rate limiting no WebSocket
5. Adicionar analytics de engagement

## 🤝 Contribuição

Para modificar ou estender:
1. Tipos: Editar `notification-types.ts`
2. Lógica: Editar `notification-service.ts`
3. UI: Editar componentes em `components/ia-busca/`
4. Testes: Adicionar em `__tests__/`

---

**Desenvolvido para ImoAgent** | Janeiro 2026
