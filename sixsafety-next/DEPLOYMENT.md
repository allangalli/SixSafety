# SixSafety Deployment Guide

Complete guide for deploying SixSafety to production on Vercel.

---

## Prerequisites

- ✅ Node.js 20.x or later
- ✅ npm or yarn package manager
- ✅ Vercel account ([sign up free](https://vercel.com/signup))
- ✅ OpenAI API key
- ✅ Pinecone account with populated index
- ✅ LangSmith API key (optional but recommended)

---

## Environment Variables

### Required Variables

```env
# OpenAI (Required)
OPENAI_API_KEY=sk-...

# Pinecone (Required)
PINECONE_API_KEY=...
PINECONE_INDEX=...
```

### Optional Variables

```env
# LangSmith (Recommended for debugging)
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=sixsafety-production
LANGCHAIN_TRACING_V2=true

# Node Environment
NODE_ENV=production
```

---

## Deployment to Vercel

### Option 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd sixsafety-next
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add PINECONE_API_KEY
   vercel env add PINECONE_INDEX
   vercel env add LANGSMITH_API_KEY
   vercel env add LANGSMITH_PROJECT
   vercel env add LANGCHAIN_TRACING_V2
   ```

5. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import from GitHub/GitLab/Bitbucket

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `sixsafety-next`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables (see above)
   - Select "Production" environment

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

---

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Visit production URL
- [ ] Select a neighbourhood
- [ ] Complete survey (3 exchanges)
- [ ] Generate safety plan
- [ ] Verify plan displays correctly
- [ ] Test print functionality
- [ ] Test copy/share buttons

### 2. Check Security
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers present (check DevTools → Network)
- [ ] CSP not blocking resources
- [ ] No API keys exposed in client-side code

### 3. Monitor Performance
- [ ] Check Vercel Analytics dashboard
- [ ] Verify cold start time < 3 seconds
- [ ] Verify plan generation < 15 seconds
- [ ] Check function logs for errors

### 4. Test Rate Limiting
- [ ] Make 11 requests in 15 minutes
- [ ] Verify 11th request returns 429 status
- [ ] Verify `Retry-After` header present

### 5. Verify Caching
- [ ] Generate plan for same neighbourhood twice
- [ ] Check logs for "Returning cached plan"
- [ ] Verify second request faster

---

## Environment-Specific Configuration

### Development
```bash
# .env.local
NODE_ENV=development
LANGCHAIN_TRACING_V2=true
```

### Production
```bash
# Vercel Environment Variables
NODE_ENV=production
LANGCHAIN_TRACING_V2=true  # Keep enabled for debugging
```

---

## Monitoring & Logging

### Vercel Functions Logs
- Go to Project → Deployments → [Latest] → Function Logs
- Monitor for errors in real-time
- Check execution duration

### LangSmith Traces
- Go to https://smith.langchain.com
- Select project: `sixsafety-production`
- View RAG workflow traces
- Debug LLM calls and retrieval

### Cache Statistics
```typescript
// Add to API route for monitoring
import { getCacheStats } from "@/lib/cache";

// GET /api/cache-stats
export async function GET() {
  return Response.json(getCacheStats());
}
```

---

## Performance Optimization

### Edge Functions (Optional)
For better global performance, consider Edge Runtime:

```typescript
// app/api/generate-plan/route.ts
export const runtime = "edge"; // Change from "nodejs"
```

**Note:** Edge runtime has limitations:
- No Node.js APIs (crypto, fs, etc.)
- May not work with all LangChain features
- Test thoroughly before enabling

### ISR (Incremental Static Regeneration)
Not applicable - app is fully dynamic.

### Image Optimization
No images in current version. If adding images:
```tsx
import Image from "next/image";

<Image
  src="/logo.png"
  alt="SixSafety Logo"
  width={200}
  height={50}
  priority
/>
```

---

## Troubleshooting

### Build Failures

**Error: "Module not found"**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: "Environment variable not set"**
- Check Vercel dashboard Environment Variables
- Verify variable names match exactly
- Redeploy after adding variables

### Runtime Errors

**Error: "OpenAI API key not configured"**
- Verify `OPENAI_API_KEY` in Vercel Environment Variables
- Check for typos in variable name
- Ensure API key starts with `sk-`

**Error: "Failed to connect to Pinecone"**
- Verify Pinecone API key and index name
- Check Pinecone dashboard for index status
- Ensure index has documents

**Error: "Rate limit exceeded"**
- User making too many requests
- This is expected behavior (10 requests/15 min)
- User should wait before retrying

### Performance Issues

**Plan generation taking > 30 seconds**
- Check OpenAI API status
- Verify Pinecone query performance
- Review LangSmith traces for bottlenecks

**High cold start times**
- Normal for serverless (2-5 seconds)
- Consider Pro plan for faster cold starts
- Use Edge runtime if compatible

---

## Scaling Considerations

### Current Limits
- **Concurrent users:** ~1,000 (Vercel Pro plan)
- **API requests:** 10 per IP per 15 minutes
- **Cache size:** 100 plans (in-memory)
- **Function timeout:** 60 seconds (Vercel)

### Scaling Up

**To handle more traffic:**
1. Upgrade to Vercel Pro/Enterprise
2. Implement Redis for distributed caching
3. Use database for persistent storage
4. Add CDN for static assets

**To reduce costs:**
1. Increase cache TTL (currently 60 min)
2. Implement user authentication
3. Use cheaper embedding models
4. Batch similar requests

---

## Security Best Practices

### API Keys
- ✅ Never commit `.env.local` to git
- ✅ Rotate API keys every 90 days
- ✅ Use separate keys for dev/prod
- ✅ Monitor API usage for anomalies

### Rate Limiting
- ✅ Current: 10 requests/15 min per IP
- ✅ Increase if legitimate traffic blocked
- ✅ Decrease if abuse detected

### Content Security Policy
- ✅ Already configured in middleware
- ✅ Allows only necessary domains
- ✅ Blocks inline scripts (except Next.js)

### CORS
- ✅ Not needed (same-origin only)
- ✅ Add if building mobile app later

---

## Backup & Disaster Recovery

### Pinecone Index Backup
```bash
# Export Pinecone data (via their CLI)
pinecone index export --name your-index --destination backup.json
```

### Code Backup
- ✅ Push to GitHub regularly
- ✅ Tag releases with version numbers
- ✅ Keep `.env.local.example` updated

### Rollback Procedure
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → Promote to Production

---

## Cost Estimation

### Vercel (Free Tier)
- **Hobby:** Free
  - 100 GB bandwidth/month
  - 100 hours function execution/month
  - Should be sufficient for MVP

### OpenAI API
- **GPT-4-turbo:** ~$0.01 per request
- **Embeddings:** ~$0.0001 per request
- **Estimated:** $10-50/month for 1,000-5,000 users

### Pinecone
- **Serverless:** Pay per usage
- **Estimated:** $20-100/month depending on queries

### Total Estimated Cost
- **MVP (100-500 users):** $30-150/month
- **Production (1,000-5,000 users):** $100-500/month

---

## Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- LangChain: https://js.langchain.com/docs
- Pinecone: https://docs.pinecone.io

### Community
- Next.js Discord: https://nextjs.org/discord
- LangChain Discord: https://discord.gg/langchain

### Issues
- Report bugs: https://github.com/your-org/sixsafety/issues
- Request features: https://github.com/your-org/sixsafety/discussions

---

## Next Steps

After successful deployment:

1. **Set up monitoring**
   - Configure Vercel Analytics
   - Add error tracking (optional: Sentry)

2. **Enable analytics**
   - Track page views
   - Monitor conversion funnel
   - Measure generation success rate

3. **Gather feedback**
   - Add feedback form
   - Monitor support requests
   - Iterate on UX

4. **Optimize costs**
   - Review cache hit rate
   - Adjust rate limits if needed
   - Consider cheaper models for dev

---

## Maintenance Schedule

### Daily
- ✅ Check Vercel function logs
- ✅ Monitor LangSmith traces
- ✅ Review error alerts

### Weekly
- ✅ Review cache statistics
- ✅ Check API usage and costs
- ✅ Update dependencies (if needed)

### Monthly
- ✅ Rotate API keys
- ✅ Review security headers
- ✅ Analyze performance metrics
- ✅ Plan optimizations

---

**Deployment complete!** 🚀

Your SixSafety application is now live and ready to help users create personalized safety plans.
