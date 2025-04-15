const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const allowedOrigins = [
  "https://handwritten-evaulation.vercel.app", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(" Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], 
  })
)



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
