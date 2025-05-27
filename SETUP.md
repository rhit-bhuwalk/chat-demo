# Quick Setup Guide

## 1. Get your OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

## 2. Set up Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Copy this line into .env.local and replace with your actual API key
OPENAI_API_KEY=sk-your-api-key-here
```

## 3. Start the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start chatting!

## Troubleshooting
- Make sure your `.env.local` file is in the root directory (same level as `package.json`)
- Restart the development server after adding the environment variable
- Check the console for any error messages 