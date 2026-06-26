# AI Marketing Studio

AI Marketing Studio is a full-stack marketing automation workspace for generating, analyzing, and optimizing paid social campaigns with AI-assisted workflows.

The app combines chat-based campaign planning, creative generation, Meta/Facebook campaign tooling, usage tracking, subscriptions, and campaign-performance analysis in a production-style Next.js codebase.

## Highlights

- AI campaign assistant built with the Vercel AI SDK and OpenAI
- Chat-first workflow for prompt generation, campaign planning, ad copy, image, and video ideas
- Meta/Facebook campaign and adset connection flows
- Campaign metrics formatting, AI analysis, and recommendation UI
- Persona, profile, and onboarding management
- Subscription and billing flows with Paddle
- S3/media integrations, analytics, feature flags, and admin utilities
- Rich component system using Radix UI, Tailwind CSS, Recharts, and Markdown rendering
- Vitest test setup, linting, formatting, and type-check scripts

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Vercel AI SDK
- OpenAI
- NextAuth
- Vercel KV
- Paddle
- AWS S3
- Recharts
- Vitest

## Architecture

```text
app/
  actions/          AI generation, formatting, browser research, campaign helpers
  api/              API routes and proxy endpoints
  admin/            internal admin and support tooling
  login/            auth flows
  subscription/     billing and plan management

components/
  chat/             chat UI, messages, history, prompt forms
  stocks/           campaign and ad creative workflow components
  subscription/     pricing and billing components
  ui/               shared design-system primitives

lib/
  auth, analytics, storage, model, and integration helpers
```

## Local Development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

Create a local `.env.local` file from `.env.example` and provide the required API keys for OpenAI, auth, storage, analytics, and billing.

## Security

Do not commit real `.env` files, access tokens, customer data, or production credentials. This repository intentionally keeps environment-specific values out of source control.

