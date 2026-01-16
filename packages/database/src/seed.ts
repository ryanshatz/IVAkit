/**
 * IVAkit Database Seed Script
 * 
 * Populates the database with demo data for testing and development.
 */

import { db } from './index';
import { flows, knowledgeBases, documents, tools } from './schema';
import type { FlowDefinition } from '@ivakit/shared';

// Demo Flow: Customer Support IVA
const customerSupportFlow: FlowDefinition = {
    version: '1.0',
    id: 'flow_customer_support',
    name: 'Customer Support',
    description: 'A comprehensive customer support IVA that handles common inquiries, routes by intent, and escalates when needed.',
    entryNode: 'start_1',
    nodes: [
        {
            id: 'start_1',
            type: 'start',
            name: 'Start',
            position: { x: 250, y: 50 },
            config: {
                welcomeMessage: 'Hello! Welcome to Acme Support. How can I help you today?',
                initVariables: { attempts: 0 },
            },
        },
        {
            id: 'collect_1',
            type: 'collect_input',
            name: 'Get Customer Input',
            position: { x: 250, y: 180 },
            config: {
                prompt: '',
                variableName: 'customer_message',
                timeout: { seconds: 60 },
            },
        },
        {
            id: 'router_1',
            type: 'llm_router',
            name: 'Intent Router',
            position: { x: 250, y: 310 },
            config: {
                systemPrompt: `You are a customer support intent classifier. Analyze the customer message and classify it into one of the following intents. Respond with a JSON object containing "intent" and "confidence" fields.`,
                intents: [
                    { name: 'order_status', description: 'Customer wants to check order status', targetNodeId: 'kb_1' },
                    { name: 'refund', description: 'Customer wants a refund or return', targetNodeId: 'msg_refund' },
                    { name: 'technical_support', description: 'Customer has a technical issue', targetNodeId: 'tool_1' },
                    { name: 'billing', description: 'Customer has a billing question', targetNodeId: 'escalate_1' },
                    { name: 'general', description: 'General inquiry or greeting', targetNodeId: 'kb_1' },
                ],
                fallbackIntent: 'general',
                confidenceThreshold: 0.7,
            },
        },
        {
            id: 'kb_1',
            type: 'knowledge_search',
            name: 'Search FAQ',
            position: { x: 50, y: 440 },
            config: {
                knowledgeBaseId: 'kb_faq',
                query: '{{customer_message}}',
                topK: 3,
                minScore: 0.6,
                resultVariable: 'faq_answer',
                groundedOnly: true,
            },
        },
        {
            id: 'condition_1',
            type: 'condition',
            name: 'Check Answer Found',
            position: { x: 50, y: 570 },
            config: {
                conditions: [
                    { id: 'cond_1', variable: 'faq_answer.confidence', operator: 'greater_than', value: 0.7, targetNodeId: 'msg_answer' },
                ],
                defaultNodeId: 'escalate_1',
            },
        },
        {
            id: 'msg_answer',
            type: 'message',
            name: 'Provide Answer',
            position: { x: 50, y: 700 },
            config: {
                message: '{{faq_answer.answer}}\n\nIs there anything else I can help you with?',
            },
        },
        {
            id: 'msg_refund',
            type: 'message',
            name: 'Refund Info',
            position: { x: 250, y: 440 },
            config: {
                message: 'I understand you\'d like to request a refund. Our refund policy allows returns within 30 days of purchase. Could you please provide your order number so I can look up your order?',
            },
        },
        {
            id: 'tool_1',
            type: 'tool_call',
            name: 'Check System Status',
            position: { x: 450, y: 440 },
            config: {
                toolId: 'tool_system_status',
                inputs: { component: 'all' },
                resultVariable: 'system_status',
                timeout: 5,
                onError: { action: 'continue' },
            },
        },
        {
            id: 'msg_tech',
            type: 'message',
            name: 'Tech Support Reply',
            position: { x: 450, y: 570 },
            config: {
                message: 'I see you\'re having a technical issue. Here\'s our current system status:\n\n{{system_status.summary}}\n\nCan you describe the specific problem you\'re experiencing?',
            },
        },
        {
            id: 'escalate_1',
            type: 'escalate',
            name: 'Escalate to Agent',
            position: { x: 650, y: 440 },
            config: {
                reason: 'Customer requires human assistance',
                queue: 'general_support',
                priority: 'normal',
                handoffMessage: 'I\'m transferring you to a human agent who can better assist you. Please hold for a moment.',
                context: { last_intent: '{{router_1.intent}}' },
            },
        },
        {
            id: 'collect_2',
            type: 'collect_input',
            name: 'Continue Conversation',
            position: { x: 250, y: 830 },
            config: {
                prompt: '',
                variableName: 'customer_message',
            },
        },
        {
            id: 'condition_end',
            type: 'condition',
            name: 'Check for Goodbye',
            position: { x: 250, y: 960 },
            config: {
                conditions: [
                    { id: 'cond_bye', variable: 'customer_message', operator: 'contains', value: 'goodbye', targetNodeId: 'end_1' },
                    { id: 'cond_no', variable: 'customer_message', operator: 'contains', value: 'no thanks', targetNodeId: 'end_1' },
                    { id: 'cond_done', variable: 'customer_message', operator: 'contains', value: 'that\'s all', targetNodeId: 'end_1' },
                ],
                defaultNodeId: 'router_1',
            },
        },
        {
            id: 'end_1',
            type: 'end',
            name: 'End Conversation',
            position: { x: 250, y: 1090 },
            config: {
                message: 'Thank you for contacting Acme Support! Have a great day! 👋',
                status: 'completed',
            },
        },
    ],
    edges: [
        { id: 'e1', source: 'start_1', target: 'collect_1' },
        { id: 'e2', source: 'collect_1', target: 'router_1' },
        { id: 'e3', source: 'router_1', target: 'kb_1', label: 'order_status / general' },
        { id: 'e4', source: 'router_1', target: 'msg_refund', label: 'refund' },
        { id: 'e5', source: 'router_1', target: 'tool_1', label: 'technical_support' },
        { id: 'e6', source: 'router_1', target: 'escalate_1', label: 'billing' },
        { id: 'e7', source: 'kb_1', target: 'condition_1' },
        { id: 'e8', source: 'condition_1', target: 'msg_answer', label: 'found' },
        { id: 'e9', source: 'condition_1', target: 'escalate_1', label: 'not found' },
        { id: 'e10', source: 'msg_answer', target: 'collect_2' },
        { id: 'e11', source: 'msg_refund', target: 'collect_2' },
        { id: 'e12', source: 'tool_1', target: 'msg_tech' },
        { id: 'e13', source: 'msg_tech', target: 'collect_2' },
        { id: 'e14', source: 'collect_2', target: 'condition_end' },
        { id: 'e15', source: 'condition_end', target: 'router_1', label: 'continue' },
        { id: 'e16', source: 'condition_end', target: 'end_1', label: 'goodbye' },
    ],
    variables: [
        { name: 'customer_message', type: 'string', description: 'The latest message from the customer' },
        { name: 'faq_answer', type: 'object', description: 'Response from knowledge base search' },
        { name: 'system_status', type: 'object', description: 'Current system status' },
        { name: 'attempts', type: 'number', defaultValue: 0, description: 'Conversation turn counter' },
    ],
    tools: [
        {
            id: 'tool_system_status',
            name: 'System Status Check',
            description: 'Checks the current status of system components',
            type: 'http',
            config: {
                url: 'https://api.example.com/status',
                method: 'GET',
            },
            inputSchema: {
                component: { type: 'string', description: 'Component to check', required: false },
            },
            outputSchema: {
                summary: { type: 'string' },
                status: { type: 'string' },
            },
        },
    ],
    metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['support', 'demo'],
        channel: 'both',
    },
};

// Demo Flow: Order Tracking
const orderTrackingFlow: FlowDefinition = {
    version: '1.0',
    id: 'flow_order_tracking',
    name: 'Order Tracking',
    description: 'Simple flow for checking order status with validation.',
    entryNode: 'start_1',
    nodes: [
        {
            id: 'start_1',
            type: 'start',
            name: 'Start',
            position: { x: 250, y: 50 },
            config: {
                welcomeMessage: '📦 Welcome to Order Tracking! Please enter your order number to get started.',
            },
        },
        {
            id: 'collect_order',
            type: 'collect_input',
            name: 'Get Order Number',
            position: { x: 250, y: 180 },
            config: {
                prompt: 'Please enter your order number (e.g., ORD-123456):',
                variableName: 'order_number',
                validation: {
                    type: 'regex',
                    pattern: '^ORD-\\d{6}$',
                    errorMessage: 'Please enter a valid order number in the format ORD-123456',
                },
                retry: {
                    maxAttempts: 3,
                    retryMessage: 'That doesn\'t look like a valid order number. Please try again.',
                },
            },
        },
        {
            id: 'tool_lookup',
            type: 'tool_call',
            name: 'Lookup Order',
            position: { x: 250, y: 310 },
            config: {
                toolId: 'tool_order_lookup',
                inputs: { orderId: '{{order_number}}' },
                resultVariable: 'order_details',
                timeout: 10,
                onError: { action: 'goto', targetNodeId: 'msg_error' },
            },
        },
        {
            id: 'condition_found',
            type: 'condition',
            name: 'Order Found?',
            position: { x: 250, y: 440 },
            config: {
                conditions: [
                    { id: 'c1', variable: 'order_details.found', operator: 'equals', value: true, targetNodeId: 'msg_status' },
                ],
                defaultNodeId: 'msg_not_found',
            },
        },
        {
            id: 'msg_status',
            type: 'message',
            name: 'Show Order Status',
            position: { x: 50, y: 570 },
            config: {
                message: '📋 **Order: {{order_number}}**\n\n📍 Status: {{order_details.status}}\n📅 Estimated Delivery: {{order_details.eta}}\n📦 Carrier: {{order_details.carrier}}\n\nWould you like to track another order?',
            },
        },
        {
            id: 'msg_not_found',
            type: 'message',
            name: 'Order Not Found',
            position: { x: 450, y: 570 },
            config: {
                message: '❌ Sorry, I couldn\'t find order **{{order_number}}**. Please check the order number and try again, or contact support for help.',
            },
        },
        {
            id: 'msg_error',
            type: 'message',
            name: 'System Error',
            position: { x: 650, y: 440 },
            config: {
                message: '⚠️ I\'m having trouble looking up your order right now. Please try again in a few minutes or contact our support team.',
            },
        },
        {
            id: 'collect_continue',
            type: 'collect_input',
            name: 'Continue?',
            position: { x: 250, y: 700 },
            config: {
                prompt: '',
                variableName: 'continue_choice',
            },
        },
        {
            id: 'condition_continue',
            type: 'condition',
            name: 'Check Continue',
            position: { x: 250, y: 830 },
            config: {
                conditions: [
                    { id: 'c_yes', variable: 'continue_choice', operator: 'contains', value: 'yes', targetNodeId: 'collect_order' },
                    { id: 'c_another', variable: 'continue_choice', operator: 'contains', value: 'another', targetNodeId: 'collect_order' },
                ],
                defaultNodeId: 'end_1',
            },
        },
        {
            id: 'end_1',
            type: 'end',
            name: 'End',
            position: { x: 250, y: 960 },
            config: {
                message: 'Thank you for using Order Tracking! Goodbye! 👋',
                status: 'completed',
            },
        },
    ],
    edges: [
        { id: 'e1', source: 'start_1', target: 'collect_order' },
        { id: 'e2', source: 'collect_order', target: 'tool_lookup' },
        { id: 'e3', source: 'tool_lookup', target: 'condition_found' },
        { id: 'e4', source: 'condition_found', target: 'msg_status', label: 'found' },
        { id: 'e5', source: 'condition_found', target: 'msg_not_found', label: 'not found' },
        { id: 'e6', source: 'msg_status', target: 'collect_continue' },
        { id: 'e7', source: 'msg_not_found', target: 'collect_continue' },
        { id: 'e8', source: 'msg_error', target: 'collect_continue' },
        { id: 'e9', source: 'collect_continue', target: 'condition_continue' },
        { id: 'e10', source: 'condition_continue', target: 'collect_order', label: 'yes' },
        { id: 'e11', source: 'condition_continue', target: 'end_1', label: 'no' },
    ],
    variables: [
        { name: 'order_number', type: 'string' },
        { name: 'order_details', type: 'object' },
        { name: 'continue_choice', type: 'string' },
    ],
    tools: [
        {
            id: 'tool_order_lookup',
            name: 'Order Lookup',
            description: 'Looks up order status by order ID',
            type: 'http',
            config: {
                url: 'https://api.example.com/orders/{{orderId}}',
                method: 'GET',
            },
            inputSchema: {
                orderId: { type: 'string', required: true },
            },
        },
    ],
    metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['orders', 'demo'],
        channel: 'chat',
    },
};

// FAQ Content for Knowledge Base
const faqContent = `
# Acme Support FAQ

## Shipping

### How long does shipping take?
Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Same-day delivery is available in select metro areas.

### Do you ship internationally?
Yes, we ship to over 50 countries worldwide. International shipping typically takes 10-14 business days.

### How can I track my order?
You can track your order using the tracking number sent to your email, or by logging into your account and viewing your order history.

## Returns & Refunds

### What is your return policy?
We accept returns within 30 days of purchase. Items must be unused and in original packaging.

### How long does a refund take?
Refunds are processed within 5-7 business days after we receive your return. The refund will appear on your original payment method.

### Can I exchange an item?
Yes, exchanges are free within 30 days. Simply initiate a return and place a new order for the item you want.

## Account

### How do I reset my password?
Click "Forgot Password" on the login page and enter your email. You'll receive a password reset link within minutes.

### How do I update my shipping address?
Go to Account Settings > Addresses to add, edit, or remove shipping addresses.

### How do I cancel my subscription?
Go to Account Settings > Subscriptions and click "Cancel Subscription". You'll have access until the end of your billing period.

## Products

### Are your products eco-friendly?
Yes! We use sustainable materials and carbon-neutral shipping for all orders.

### Do you offer gift wrapping?
Yes, gift wrapping is available for $5 per item. Select this option at checkout.

### What is your warranty policy?
All products come with a 1-year limited warranty covering manufacturing defects.
`;

async function seed() {
    console.log('🌱 Seeding IVAkit database...');

    // Clear existing data
    console.log('  Clearing existing data...');

    // Insert demo flows
    console.log('  Creating demo flows...');
    await db.insert(flows).values([
        {
            id: customerSupportFlow.id,
            name: customerSupportFlow.name,
            description: customerSupportFlow.description,
            definition: JSON.stringify(customerSupportFlow),
            status: 'published',
            publishedAt: new Date().toISOString(),
        },
        {
            id: orderTrackingFlow.id,
            name: orderTrackingFlow.name,
            description: orderTrackingFlow.description,
            definition: JSON.stringify(orderTrackingFlow),
            status: 'published',
            publishedAt: new Date().toISOString(),
        },
    ]).onConflictDoNothing();

    // Insert knowledge base
    console.log('  Creating knowledge base...');
    await db.insert(knowledgeBases).values({
        id: 'kb_faq',
        name: 'Acme Support FAQ',
        description: 'Frequently asked questions for customer support',
    }).onConflictDoNothing();

    await db.insert(documents).values({
        id: 'doc_faq',
        knowledgeBaseId: 'kb_faq',
        name: 'FAQ.md',
        type: 'md',
        content: faqContent,
        size: faqContent.length,
    }).onConflictDoNothing();

    // Insert demo tools
    console.log('  Creating demo tools...');
    await db.insert(tools).values([
        {
            id: 'tool_system_status',
            name: 'System Status Check',
            description: 'Checks the current status of system components',
            type: 'http',
            config: JSON.stringify({
                url: 'https://api.example.com/status',
                method: 'GET',
            }),
            inputSchema: JSON.stringify({
                component: { type: 'string', description: 'Component to check' },
            }),
        },
        {
            id: 'tool_order_lookup',
            name: 'Order Lookup',
            description: 'Looks up order status by order ID',
            type: 'http',
            config: JSON.stringify({
                url: 'https://api.example.com/orders',
                method: 'GET',
            }),
            inputSchema: JSON.stringify({
                orderId: { type: 'string', required: true },
            }),
        },
    ]).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
}

seed().catch(console.error);
