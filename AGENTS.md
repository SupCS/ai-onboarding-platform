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

## Brand colors

Use the AI Digital brand palette for generated UI, visual assets, lesson visuals, presentation-style materials, and design suggestions.

Primary colors:
- Yves Klein Blue `#0009DC` is the main hero color and should be treated as the strongest brand anchor.
- Lime `#AEF33E`
- Pink `#FF7CF5`
- Silver Haze `#F9F9F9`
- Midnight Charcoal `#080808`

Secondary colors are for accents, demographics, highlights, charts, and extra energy. Use them sparingly; do not use them as main background floods or primary typography colors.
- Bright Aqua `#8EE7F1`
- Digital Lilac `#DDA7EF`
- Skywave `#A9BEF8`
- Neon Azure `#3AB6FF`
- Violet Pulse `#8263FF`
- Cool Gray `#231F20`

When choosing colors without further direction, start from Yves Klein Blue `#0009DC`, then support it with neutrals and only small accents from Lime, Pink, or the secondary palette.

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
