const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'new', 'index.html');
const content = fs.readFileSync(src, 'utf-8');

// 1. Write to client/dist for Vercel
const clientDist = path.join(__dirname, 'client', 'dist');
fs.mkdirSync(clientDist, { recursive: true });
fs.writeFileSync(path.join(clientDist, 'index.html'), content, 'utf-8');

// 2. Write to public/ for Hostinger / local Express static serving
const pubDir = path.join(__dirname, 'public');
fs.mkdirSync(pubDir, { recursive: true });
fs.writeFileSync(path.join(pubDir, 'index.html'), content, 'utf-8');

// 3. Write to root index.html
fs.writeFileSync(path.join(__dirname, 'index.html'), content, 'utf-8');

console.log('Build completed! Original design synchronized across client/dist, public, and root.');

