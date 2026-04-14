<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules

## Project overview

This project is an AI Onboarding & Training platform built as a hackathon MVP.

Main goals:
- move fast
- keep the code simple
- avoid overengineering

## Tech stack

- Next.js
- JavaScript only
- MUI
- PostgreSQL
- OpenAI API
- Railway

## Strict rules

- Use JavaScript only
- Do not introduce TypeScript
- Do not use Tailwind CSS
- Keep things simple and practical
- Avoid unnecessary libraries

## UI rules

- Use MUI as primary UI system
- Prefer `sx` for styling
- Keep UI clean and minimal

## Code style

- Simple and readable code
- No overengineering
- Clear file structure

## Backend rules

- Use simple server-side logic in Next.js
- No complex backend frameworks
- Keep database usage simple

## Environment variables

Use `.env.local` for:
- OPENAI_API_KEY
- DATABASE_URL

Never hardcode secrets.

## Deployment

Must be easy to deploy on Railway