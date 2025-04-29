/**
 * Simple HTTP server for Daisyworld simulation
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif'
};

// Create the server
const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url} received`);
  
  // Default to index.html if root is requested
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'src', 'index.html')
    : path.join(__dirname, req.url);
  
  // Get the file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If file not found in root path, try the src directory
      if (err.code === 'ENOENT' && !filePath.includes('/src/')) {
        const srcFilePath = path.join(__dirname, 'src', req.url);
        fs.readFile(srcFilePath, (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('File not found');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content2, 'utf-8');
        });
        return;
      }
      
      // Handle server errors
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    // Serve the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Daisyworld server running at http://localhost:${PORT}/`);
});