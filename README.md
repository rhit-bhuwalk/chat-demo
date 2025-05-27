# AI Chat Demo

A simple Next.js chatbot application using OpenAI's API.

## Features

- Clean, minimal chat interface similar to OpenAI's UI
- Real-time messaging with OpenAI GPT-3.5-turbo
- Responsive design with Tailwind CSS
- TypeScript for type safety
- No database or persistence - messages reset on refresh

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Usage

Simply type your message in the input field and press Send or hit Enter. The AI will respond using the configured system prompt.

## System Prompt

The AI assistant is configured with a helpful, concise, and friendly personality. You can modify the system prompt in `src/app/api/chat/route.ts`.

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- OpenAI API
- React Hooks
