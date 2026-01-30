# Magic Link Demo Landing Page

A Next.js application that provides personalized AI-powered demo experiences for leads via magic links.

## Features

- 🔗 **Token-based Access**: Unique demo pages for each lead via URL tokens
- 💬 **AI Chat Integration**: Interactive AI assistant powered by n8n webhook
- 🎨 **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- 🔒 **Secure**: API keys kept server-side via n8n webhook
- 📊 **Supabase Integration**: Lead data management and tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI Integration**: n8n webhook → OpenAI Assistants API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- n8n instance with OpenAI integration

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TAEMZ/chatbot.git
cd chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Accessing a Demo

Navigate to `/demo/[token]` where `[token]` is the `demo_token` from your Supabase database.

Example: `http://localhost:3000/demo/abc123`

### Database Schema

Your Supabase `magic_link_leads` table should have:

```sql
CREATE TABLE magic_link_leads (
  id UUID PRIMARY KEY,
  name TEXT,
  website_url TEXT,
  assistant_id TEXT,
  demo_token TEXT UNIQUE,
  demo_opened_at TIMESTAMP,
  business_data JSONB
);
```

The `business_data` field should contain:
```json
{
  "business_name": "Company Name",
  "services": ["Service 1", "Service 2"],
  "value_proposition": "What makes this business unique"
}
```

### n8n Webhook Configuration

Your n8n webhook at `https://n8n.thebrownmine.com/webhook/magic-link-chat` should:

**Accept:**
```json
{
  "message": "User's message",
  "threadId": "thread_xxx or null",
  "assistantId": "asst_xxx"
}
```

**Return:**
```json
{
  "threadId": "thread_xxx",
  "response": "AI assistant's response"
}
```

## Project Structure

```
├── app/
│   ├── demo/
│   │   └── [token]/
│   │       └── page.tsx      # Dynamic demo page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── .env.local                # Environment variables
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── package.json              # Dependencies
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

This is a standard Next.js app and can be deployed to any platform that supports Next.js.

## License

MIT
