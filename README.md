# USMLE Prep Web App

A lightweight, production-ready USMLE preparation web application built with Next.js, TypeScript, TailwindCSS, and Gemini AI for dynamic question generation.

## Features

- 🎯 **Dynamic Question Generation**: Uses Gemini 1.5 Flash API to generate USMLE-style MCQs
- 📱 **Mobile-First Design**: Responsive UI built with TailwindCSS
- 🗄️ **MongoDB Database**: Cloud database with Prisma ORM
- 🔧 **Admin Panel**: Upload static questions or generate new ones via prompts
- 📊 **Score Tracking**: Track quiz performance
- 🚀 **AWS Deployable**: Ready for EC2, Lightsail, or Amplify deployment
- 🔓 **No Authentication**: Open access for testing

## Tech Stack

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: TailwindCSS
- **Database**: MongoDB with Prisma ORM
- **API**: Next.js API Routes
- **AI**: Gemini 1.5 Flash API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Gemini API key from Google AI Studio
- MongoDB Atlas account (or local MongoDB instance)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd usmle-prep-app
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   Add your API keys to `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL="mongodb+srv://username:<password>@cluster0.ldngw.mongodb.net/usmle_prep?retryWrites=true&w=majority&appName=Cluster0"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## MongoDB Setup

### Using MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster

2. **Configure Database Access**
   - Create a database user with read/write permissions
   - Whitelist your IP address (or use 0.0.0.0/0 for development)

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Database URL Format**
   ```
   mongodb+srv://username:<password>@cluster0.ldngw.mongodb.net/usmle_prep?retryWrites=true&w=majority&appName=Cluster0
   ```

## AWS Deployment Options

### Option 1: AWS EC2 (Ubuntu)

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.micro (free tier eligible)
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Server Setup**
   ```bash
   # SSH into your instance
   ssh -i your-key.pem ubuntu@your-ec2-ip

   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx -y
   ```

3. **Deploy Application**
   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd usmle-prep-app

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local
   nano .env.local  # Add your GEMINI_API_KEY and DATABASE_URL

   # Set up database
   npx prisma generate
   npx prisma db push

   # Build the application
   npm run build

   # Start with PM2
   pm2 start npm --name "usmle-app" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/usmle-app
   ```
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/usmle-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 2: AWS Lightsail

1. **Create Lightsail Instance**
   - Platform: Linux/Unix
   - Blueprint: Node.js
   - Instance Plan: $5/month minimum

2. **Deploy via SSH**
   - Follow similar steps as EC2 but skip Node.js installation
   - Lightsail provides a simpler interface for managing instances

### Option 3: AWS Amplify

1. **Prepare for Amplify**
   ```bash
   # Add to package.json build script if using static export
   "build": "next build"
   ```

2. **Deploy to Amplify**
   - Connect your Git repository to AWS Amplify
   - Set environment variables in Amplify console:
     - `GEMINI_API_KEY`
     - `DATABASE_URL`
   - Amplify will automatically build and deploy

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL="mongodb+srv://username:<password>@cluster0.ldngw.mongodb.net/usmle_prep?retryWrites=true&w=majority&appName=Cluster0"
```

## API Endpoints

- `GET /api/questions` - Fetch all questions
- `POST /api/questions` - Create new question
- `POST /api/generate` - Generate questions using Gemini AI

## Database Schema

```prisma
model Question {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  question    String
  options     String
  correct     Int
  explanation String?
  subject     String?
  difficulty  String   @default("Medium")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Score {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  score     Int
  total     Int
  percentage Float
  duration  Int?
  createdAt DateTime @default(now())
}
```

## Folder Structure

```
├── pages/
│   ├── index.tsx          # Homepage
│   ├── quiz.tsx           # Quiz page
│   ├── admin.tsx          # Admin panel
│   └── api/
│       ├── generate.ts    # Gemini API integration
│       └── questions.ts   # Question CRUD operations
├── components/
│   ├── QuestionCard.tsx   # Question display component
│   ├── Navbar.tsx         # Navigation component
│   └── GenerateButton.tsx # AI generation button
├── lib/
│   ├── gemini.ts          # Gemini API client
│   └── db.ts              # Database client
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## Performance Optimizations

- Next.js automatic code splitting
- MongoDB for scalable cloud database
- TailwindCSS for minimal CSS bundle
- Gemini 1.5 Flash for fast AI responses

## MongoDB Best Practices

1. **Indexing**: Consider adding indexes for frequently queried fields
2. **Connection Pooling**: Prisma handles this automatically
3. **Data Validation**: Use Prisma schema validation
4. **Backup**: MongoDB Atlas provides automatic backups

## Monitoring and Logs

For production deployment, consider:
- CloudWatch for AWS monitoring
- MongoDB Atlas monitoring and alerts
- PM2 logs: `pm2 logs usmle-app`
- Nginx access logs: `/var/log/nginx/access.log`

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **MongoDB Connection Issues**
   - Check if IP is whitelisted in MongoDB Atlas
   - Verify username/password in connection string
   - Ensure network access is configured

3. **Build Errors**
   ```bash
   rm -rf .next
   npm run build
   ```

4. **API Key Issues**
   - Ensure GEMINI_API_KEY is correctly set
   - Check API key permissions in Google AI Studio

## License

MIT License - feel free to use for educational purposes. 