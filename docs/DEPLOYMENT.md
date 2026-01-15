# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites

- GitHub account
- Vercel account
- Supabase project
- Gemini API key
- Stripe account

### Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Environment Variables**

   Add these in Vercel project settings:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   CASAFARI_API_KEY=your_casafari_api_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

5. **Set up Stripe Webhooks**
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Select events: `customer.subscription.*`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

6. **Configure Custom Domain (Optional)**
   - Go to Vercel project settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details and create

### 2. Run Migrations

1. Go to SQL Editor
2. Copy content from `supabase/migrations/001_initial_schema.sql`
3. Paste and run

### 3. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy property-scraper
supabase functions deploy calculate-rankings
supabase functions deploy lead-scoring
supabase functions deploy calculate-commission
supabase functions deploy ai-coaching
supabase functions deploy ia-busca
supabase functions deploy ia-orquestradora
```

### 4. Set Function Secrets

```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set CASAFARI_API_KEY=your_casafari_key
```

### 5. Enable Authentication

1. Go to Authentication > Providers
2. Enable Email
3. Configure providers as needed

### 6. Storage Setup

1. Go to Storage
2. Create bucket "documents"
3. Set policies as needed

## Environment-Specific Configuration

### Development

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```env
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

### Production

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Monitoring & Analytics

### Vercel Analytics

1. Enable in Vercel dashboard
2. Add to project settings

### Error Tracking

Consider adding:
- Sentry
- LogRocket
- Datadog

## Performance Optimization

- Enable Edge caching
- Use Image Optimization
- Enable compression
- Monitor Core Web Vitals

## Security Checklist

- [ ] All environment variables set
- [ ] Stripe webhook secret configured
- [ ] Supabase RLS policies enabled
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] SSL/TLS enabled
- [ ] API keys secured

## Troubleshooting

### Build Fails

- Check environment variables
- Verify all dependencies installed
- Check TypeScript errors

### Functions Not Working

- Verify function deployment
- Check function logs in Supabase
- Verify secrets are set

### Database Connection Issues

- Verify Supabase URL
- Check API keys
- Verify RLS policies

## Rollback

If deployment fails:

1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "Promote to Production"

## CI/CD

Consider setting up:
- GitHub Actions
- Automatic tests on PR
- Automatic deployment on merge

## Backup Strategy

- Regular database backups
- Code in version control
- Document storage backup
- Environment variables documented

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Project: GitHub Issues
