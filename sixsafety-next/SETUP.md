# SixSafety Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key
- Pinecone account with existing vector store

## Quick Start

### 1. Install Dependencies
```bash
cd sixsafety-next
npm install
```

### 2. Configure Environment
```bash
# Copy the .env.local file
cp .env.local.example .env.local

# Edit .env.local and add your API keys:
# - OPENAI_API_KEY
# - PINECONE_API_KEY
# - PINECONE_INDEX (name of your existing index)
```

### 3. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

### 4. Build for Production
```bash
npm run build
npm start
```

## API Keys Required

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env.local` as `OPENAI_API_KEY`

### Pinecone
1. Go to https://app.pinecone.io/
2. Get your API key from project settings
3. Note your index name (should be existing index with Toronto safety data)
4. Add both to `.env.local`

### LangSmith (Optional)
1. Go to https://smith.langchain.com/
2. Create API key
3. Add to `.env.local` as `LANGSMITH_API_KEY`

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Railway
```bash
# Connect repo to Railway
railway init
railway up

# Add environment variables in Railway dashboard
```

## Troubleshooting

**"Module not found" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Pinecone connection issues:**
- Verify your index name is correct
- Check API key has proper permissions
- Ensure embeddings model matches (text-embedding-3-small or text-embedding-3-large)

**OpenAI rate limits:**
- Check your API usage at platform.openai.com
- Consider adding rate limiting (Story 6)

## Project Structure
```
sixsafety-next/
├── app/                  # Next.js app router pages
├── components/           # React components
├── lib/                  # Utilities and business logic
│   ├── actions.ts       # Server Actions
│   ├── rag/             # RAG workflow
│   ├── schemas/         # Zod schemas
│   └── utils/           # Helper functions
├── public/              # Static assets
└── types/               # TypeScript types
```
