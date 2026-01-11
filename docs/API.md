# API Reference

## Supabase Edge Functions

### 1. Property Scraper

**Endpoint**: `/functions/v1/property-scraper`

**Method**: POST

**Request Body**:
```json
{
  "city": "São Paulo",
  "type": "apartment",
  "minPrice": 300000,
  "maxPrice": 800000
}
```

**Response**:
```json
{
  "success": true,
  "properties": [...],
  "portalsScanned": 7
}
```

### 2. Calculate Rankings

**Endpoint**: `/functions/v1/calculate-rankings`

**Method**: POST

**Request Body**:
```json
{
  "period": "monthly"
}
```

**Response**:
```json
{
  "success": true,
  "rankings": [
    {
      "agent_id": "uuid",
      "agent_name": "John Doe",
      "rank": 1,
      "score": 150,
      "sales_count": 10,
      "leads_count": 50
    }
  ]
}
```

### 3. Lead Scoring

**Endpoint**: `/functions/v1/lead-scoring`

**Method**: POST

**Request Body**:
```json
{
  "leadId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "leadId": "uuid",
  "score": 85
}
```

### 4. Calculate Commission

**Endpoint**: `/functions/v1/calculate-commission`

**Method**: POST

**Request Body**:
```json
{
  "propertyValue": 500000,
  "agentId": "uuid",
  "commissionRate": 6
}
```

**Response**:
```json
{
  "success": true,
  "propertyValue": 500000,
  "commissionRate": 6,
  "commissionAmount": 30000,
  "netAmount": 470000
}
```

### 5. AI Coaching

**Endpoint**: `/functions/v1/ai-coaching`

**Method**: POST

**Request Body**:
```json
{
  "agentId": "uuid",
  "goals": [...]
}
```

**Response**:
```json
{
  "success": true,
  "agentId": "uuid",
  "recommendations": "..."
}
```

## Client-Side AI Integration

### Using AI Agents

```typescript
import { callAIAgent } from '@/lib/ai/gemini'

// Search Agent
const searchResults = await callAIAgent(
  'search',
  'Find properties in São Paulo under 500k',
  { city: 'São Paulo', maxPrice: 500000 }
)

// Coaching Agent
const coaching = await callAIAgent(
  'coaching',
  'Analyze my goals progress',
  { goals: [...] }
)

// Gamification Agent
const ranking = await callAIAgent(
  'gamification',
  'Calculate my rank',
  { sales: 10, leads: 50 }
)
```

## Database Operations

### Supabase Client Usage

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Fetch properties
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('status', 'available')

// Insert lead
const { data, error } = await supabase
  .from('leads')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+55 11 99999-9999'
  })
```

## Stripe Integration

### Create Checkout Session

```typescript
import { stripe } from '@/lib/stripe/config'

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: 'price_id',
      quantity: 1,
    },
  ],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
})
```

## Utility Functions

### Format Currency

```typescript
import { formatCurrency } from '@/utils/helpers'

const formatted = formatCurrency(500000) // "R$ 500.000,00"
```

### Calculate Commission

```typescript
import { calculateCommission } from '@/utils/helpers'

const commission = calculateCommission(500000, 6) // 30000
```

### Format Phone Number

```typescript
import { formatPhoneNumber } from '@/utils/helpers'

const formatted = formatPhoneNumber('11999999999') // "(11) 99999-9999"
```
