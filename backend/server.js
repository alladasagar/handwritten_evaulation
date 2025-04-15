const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const corsOptions = {
  origin: 'https://handwritten-evaulation.vercel.app',  // Your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // If you're using cookies or sessions, this is necessary
};

app.use(cors(corsOptions));



app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send('Welcome to the Handwritten Answer Evaluation API!');
});

app.post('/evaluate', upload.single('image'), (req, res) => {
  const imagePath = req.file.path;
  const predefinedAnswer = req.body.answer;
  const gcpCreds = process.env.GOOGLE_CREDENTIALS_PATH;

  const python = spawn('python3', [
    'evaluate.py',
    imagePath,
    process.env.GOOGLE_CREDENTIALS_PATH.replace(/\\/g, '/'), // safer cross-platform path
    predefinedAnswer
  ]);
  

  let result = '';
  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  python.on('close', (code) => {
    fs.unlinkSync(imagePath); // Clean up uploaded image
    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse Python output.' });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
