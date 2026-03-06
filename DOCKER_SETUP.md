# TikTok Leads Merger - Docker Setup Guide

This guide will help you run the TikTok Leads Merger tool locally on your laptop using Docker.

## Prerequisites

Before you start, make sure you have:

1. **Git** - Download from https://git-scm.com/
2. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
   - Available for Windows, Mac, and Linux
   - Installation takes ~5 minutes

## Quick Start (3 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Tikverify/tiktok-leads-merger.git
cd tiktok-leads-merger
```

### Step 2: Start Docker

Make sure Docker Desktop is running, then:

```bash
docker-compose up
```

This will:
- Download the Node.js image
- Install all dependencies
- Build the application
- Start the server

**First time?** This takes 2-3 minutes. Subsequent runs are much faster.

### Step 3: Open in Browser

Once you see this message:
```
Server running on http://localhost:3000/
```

Open your browser and go to: **http://localhost:3000**

## How to Use

1. **Upload Files** - Drag and drop your TikTok lead XLSX files
2. **Enable Filtering** - Check "Remove African Numbers (+2xx)" if needed
3. **Merge & Download** - Click the button to download your merged file

## Making Changes to the Code

### Edit the Code

1. Open the project folder in your code editor (VS Code recommended)
2. Make changes to files in `client/src/` or `server/`
3. Save the file

### Restart Docker to See Changes

```bash
# Stop the current container
docker-compose down

# Start again
docker-compose up
```

The changes will be reflected in your browser.

## Stopping the Tool

Press `Ctrl+C` in your terminal to stop the server.

To completely remove Docker containers:

```bash
docker-compose down
```

## Troubleshooting

### Port 3000 Already in Use

If you get an error that port 3000 is already in use:

```bash
docker-compose down
```

Then try again.

### Docker Not Starting

1. Make sure Docker Desktop is running
2. Try: `docker ps` to test Docker
3. Restart Docker Desktop

### Need to Update Code from GitHub

```bash
git pull origin main
docker-compose down
docker-compose up
```

## Modifying the Tool

The main files you might want to edit:

- **Frontend UI**: `client/src/pages/Home.tsx`
- **Styling**: `client/src/index.css`
- **Phone Filtering Logic**: `client/src/lib/phoneFilter.ts`
- **Dependencies**: `package.json`

After editing, restart Docker to see changes.

## Sharing with Team

To share this with team members:

1. They clone the repository
2. They run `docker-compose up`
3. Done! No installation needed beyond Docker

## Need Help?

Check the main README.md for more information about the application features.

---

**Enjoy using TikTok Leads Merger locally!** 🚀
