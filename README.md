# Impostor Game

A multiplayer impostor game where players try to discover who has a different word.

## Project info

This is a multiplayer game built with React, Vite, TypeScript, and Supabase.

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Navigate to the project directory.
cd impostor

# Step 2: Install the necessary dependencies.
npm install

# Step 3: Set up environment variables
# Create a .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

# Step 4: Run Supabase migrations
# Make sure you have Supabase CLI installed and configured

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Game Rules

1. The host creates a room and gets a 4-character room code
2. Players join the room using the code
3. When the host starts the game:
   - Everyone receives the same word (crewmates)
   - One random player receives a different word (impostor)
4. Players discuss and try to find the impostor
5. The host can restart the game for a new round

# impostor
