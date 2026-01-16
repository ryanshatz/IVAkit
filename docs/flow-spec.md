# IVAkit Flow Specification v1.0

> The canonical specification for IVA flow definitions in IVAkit.

## Overview

A **Flow** is the fundamental artifact in IVAkit. It defines the complete conversation logic for an Intelligent Virtual Agent, including:

- **Nodes**: Individual steps in the conversation
- **Edges**: Connections between nodes
- **Variables**: Data passed between nodes
- **Tools**: External integrations

Flows are:
- **Deterministic**: Except for explicit LLM nodes, execution is predictable
- **Inspectable**: Every step can be audited
- **Composable**: Flows can reference other flows (v2)
- **Versioned**: Changes are tracked

## Schema Structure

```json
{
  "version": "1.0",
  "id": "flow_unique_id",
  "name": "Human Readable Name",
  "description": "Optional description",
  "entryNode": "start_node_id",
  "nodes": [...],
  "edges": [...],
  "variables": [...],
  "tools": [...],
  "metadata": {
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "createdBy": "user_id",
    "tags": ["support", "sales"],
    "channel": "both"
  }
}
```

## Node Types

### 1. Start Node (`start`)

Entry point of the flow. Every flow must have exactly one Start node.

```json
{
  "id": "start_1",
  "type": "start",
  "name": "Start",
  "position": { "x": 100, "y": 100 },
  "config": {
    "welcomeMessage": "Hello! How can I help you?",
    "initVariables": {
      "attempts": 0
    }
  }
}
```

**Config Options:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `welcomeMessage` | string | No | Initial message to send |
| `initVariables` | object | No | Variables to initialize |

---

### 2. Message Node (`message`)

Sends a static or templated message to the user.

```json
{
  "id": "msg_1",
  "type": "message",
  "name": "Greeting",
  "position": { "x": 100, "y": 200 },
  "config": {
    "message": "Thanks {{customer_name}}! Your order is {{order_status}}.",
    "delay": 500,
    "attachments": [
      { "type": "button", "content": { "label": "Yes", "value": "yes" } }
    ]
  }
}
```

**Config Options:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message content (supports `{{variable}}` interpolation) |
| `delay` | number | No | Delay before sending (ms) |
| `attachments` | array | No | Rich content attachments |

---

### 3. Collect Input Node (`collect_input`)

Waits for user input with optional validation.

```json
{
  "id": "collect_1",
  "type": "collect_input",
  "name": "Get Email",
  "position": { "x": 100, "y": 300 },
  "config": {
    "prompt": "Please enter your email address:",
    "variableName": "customer_email",
    "validation": {
      "type": "email",
      "errorMessage": "That doesn't look like a valid email."
    },
    "retry": {
      "maxAttempts": 3,
      "retryMessage": "Please try again."
    },
    "timeout": {
      "seconds": 60,
      "timeoutNodeId": "timeout_handler"
    }
  }
}
```

**Validation Types:**
| Type | Description | Additional Options |
|------|-------------|-------------------|
| `text` | Plain text | `minLength`, `maxLength` |
| `number` | Numeric value | `min`, `max` |
| `email` | Email address | - |
| `phone` | Phone number | - |
| `date` | Date value | - |
| `regex` | Custom pattern | `pattern` |
| `custom` | Custom validator | `customValidator` |

---

### 4. LLM Router Node (`llm_router`)

Uses AI for intent classification. Routes to different nodes based on detected intent.

```json
{
  "id": "router_1",
  "type": "llm_router",
  "name": "Intent Router",
  "position": { "x": 100, "y": 400 },
  "config": {
    "systemPrompt": "You are a customer support intent classifier...",
    "intents": [
      {
        "name": "order_status",
        "description": "Customer wants to check order status",
        "examples": ["where is my order", "track my package"],
        "targetNodeId": "handle_order_status"
      },
      {
        "name": "refund",
        "description": "Customer wants a refund",
        "examples": ["I want my money back", "return this item"],
        "targetNodeId": "handle_refund"
      }
    ],
    "model": {
      "provider": "ollama",
      "model": "llama3.2",
      "temperature": 0.3
    },
    "fallbackIntent": "general",
    "confidenceThreshold": 0.7
  }
}
```

**Model Providers:**
- `ollama` - Local models via Ollama (default)
- `openai` - OpenAI API
- `anthropic` - Anthropic API
- `rules` - Keyword-based fallback (no LLM)

---

### 5. Knowledge Search Node (`knowledge_search`)

Performs RAG retrieval from a knowledge base.

```json
{
  "id": "kb_1",
  "type": "knowledge_search",
  "name": "Search FAQ",
  "position": { "x": 100, "y": 500 },
  "config": {
    "knowledgeBaseId": "kb_faq",
    "query": "{{customer_message}}",
    "topK": 3,
    "minScore": 0.6,
    "resultVariable": "faq_result",
    "groundedOnly": true
  }
}
```

**Config Options:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `knowledgeBaseId` | string | Yes | ID of the knowledge base |
| `query` | string | Yes | Search query (supports interpolation) |
| `topK` | number | No | Number of results (default: 3) |
| `minScore` | number | No | Minimum similarity score (0-1) |
| `resultVariable` | string | Yes | Variable to store results |
| `groundedOnly` | boolean | No | Only return if answer is grounded |

**Result Structure:**
```json
{
  "answer": "Generated answer based on sources",
  "sources": [
    { "content": "...", "source": "faq.md", "score": 0.92 }
  ],
  "confidence": 0.85,
  "grounded": true
}
```

---

### 6. Tool Call Node (`tool_call`)

Executes external HTTP/webhook calls.

```json
{
  "id": "tool_1",
  "type": "tool_call",
  "name": "Lookup Order",
  "position": { "x": 100, "y": 600 },
  "config": {
    "toolId": "order_api",
    "inputs": {
      "orderId": "{{order_number}}"
    },
    "resultVariable": "order_details",
    "timeout": 10,
    "retry": {
      "maxAttempts": 2,
      "backoffMs": 1000
    },
    "onError": {
      "action": "goto",
      "targetNodeId": "error_handler"
    }
  }
}
```

**Error Actions:**
| Action | Description |
|--------|-------------|
| `continue` | Continue execution, store error in result |
| `retry` | Retry the call |
| `escalate` | Escalate to human agent |
| `goto` | Go to specific node |

---

### 7. Condition Node (`condition`)

Branching logic based on variable values.

```json
{
  "id": "cond_1",
  "type": "condition",
  "name": "Check Order Status",
  "position": { "x": 100, "y": 700 },
  "config": {
    "conditions": [
      {
        "id": "cond_shipped",
        "variable": "order_details.status",
        "operator": "equals",
        "value": "shipped",
        "targetNodeId": "msg_shipped"
      },
      {
        "id": "cond_pending",
        "variable": "order_details.status",
        "operator": "equals",
        "value": "pending",
        "targetNodeId": "msg_pending"
      }
    ],
    "defaultNodeId": "msg_unknown"
  }
}
```

**Operators:**
| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `contains` | String contains |
| `not_contains` | String does not contain |
| `starts_with` | String starts with |
| `ends_with` | String ends with |
| `greater_than` | Numeric greater than |
| `less_than` | Numeric less than |
| `greater_or_equal` | Numeric >= |
| `less_or_equal` | Numeric <= |
| `is_empty` | Value is null/empty |
| `is_not_empty` | Value exists |
| `matches_regex` | Regex match |

---

### 8. Escalate Node (`escalate`)

Hands off the conversation to a human agent.

```json
{
  "id": "escalate_1",
  "type": "escalate",
  "name": "Transfer to Agent",
  "position": { "x": 100, "y": 800 },
  "config": {
    "reason": "Customer requested human assistance",
    "queue": "billing_support",
    "priority": "high",
    "context": {
      "customer_id": "{{customer_id}}",
      "issue_type": "{{last_intent}}"
    },
    "handoffMessage": "I'm connecting you with a specialist. Please hold."
  }
}
```

**Priority Levels:** `low`, `normal`, `high`, `urgent`

---

### 9. End Node (`end`)

Terminates the conversation.

```json
{
  "id": "end_1",
  "type": "end",
  "name": "End Conversation",
  "position": { "x": 100, "y": 900 },
  "config": {
    "message": "Thanks for contacting us! Have a great day!",
    "status": "completed",
    "summary": {
      "resolution": "{{resolution_type}}",
      "duration": "{{session_duration}}"
    }
  }
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `completed` | Successfully completed |
| `escalated` | Handed off to agent |
| `abandoned` | User abandoned |
| `error` | Error occurred |

---

## Edges

Edges connect nodes and define the flow path.

```json
{
  "id": "edge_1",
  "source": "node_a",
  "target": "node_b",
  "sourceHandle": "right",
  "targetHandle": "top",
  "label": "success",
  "condition": "{{result.success}} === true"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique edge ID |
| `source` | string | Yes | Source node ID |
| `target` | string | Yes | Target node ID |
| `sourceHandle` | string | No | Output handle (for multi-output nodes) |
| `targetHandle` | string | No | Input handle |
| `label` | string | No | Display label |
| `condition` | string | No | Condition for conditional edges |

---

## Variables

Define variables used throughout the flow.

```json
{
  "name": "customer_email",
  "type": "string",
  "defaultValue": "",
  "description": "Customer's email address",
  "persistent": true
}
```

**Variable Types:**
- `string`
- `number`
- `boolean`
- `object`
- `array`

---

## Tools

Define external integrations.

```json
{
  "id": "order_api",
  "name": "Order Lookup API",
  "description": "Retrieves order details by order ID",
  "type": "http",
  "config": {
    "url": "https://api.example.com/orders/{{orderId}}",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer {{api_key}}"
    },
    "auth": {
      "type": "bearer",
      "value": "{{API_SECRET}}"
    }
  },
  "inputSchema": {
    "orderId": {
      "type": "string",
      "required": true,
      "description": "The order ID to look up"
    }
  },
  "outputSchema": {
    "status": { "type": "string" },
    "items": { "type": "array" }
  }
}
```

---

## Execution Model

1. **Session Creation**: A new session is created when a conversation starts
2. **Node Execution**: Nodes are executed sequentially based on edges
3. **Variable Scope**: Variables persist for the session duration
4. **Input Waiting**: `collect_input` nodes pause execution until input received
5. **LLM Calls**: Only `llm_router` nodes invoke AI services
6. **Determinism**: Given the same inputs, execution follows the same path

---

## Best Practices

1. **Always have error handling**: Use `onError` in tool nodes
2. **Set reasonable timeouts**: Prevent hung sessions
3. **Use validation**: Validate user input early
4. **Limit LLM calls**: They add latency and cost
5. **Version your flows**: Track changes over time
6. **Test thoroughly**: Use the simulator before publishing

---

## Changelog

### v1.0 (Current)
- Initial specification
- 9 node types
- Variable interpolation
- Tool integrations
- Knowledge base integration
