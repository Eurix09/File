const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(express.json());

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public", "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/mpeg",
    "application/vnd.android.package-archive",
    "text/x-lua",
    "audio/mpeg" // Added MIME type for MP3
  ];

  const allowedExtensions = [".apk", ".lua", ".mp3"]; // Added .mp3 extension
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, videos, APK, LUA, and MP3 files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Path for storing metadata
const metadataFilePath = path.join(__dirname, "file.json");

// Load metadata from file.json if it exists
let fileMetadata = [];
if (fs.existsSync(metadataFilePath)) {
  try {
    const data = fs.readFileSync(metadataFilePath, "utf8");
    fileMetadata = JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse file.json:", err);
    fileMetadata = [];
  }
}

// Save metadata to file.json
const saveMetadataToFile = () => {
  fs.writeFileSync(metadataFilePath, JSON.stringify(fileMetadata, null, 2), "utf8");
};

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.body.user) {
    return res.status(400).send("File and user are required.");
  }

  // Add new metadata
  const newFile = {
    name: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    user: req.body.user,
    uploadedAt: new Date().toISOString(),
  };

  fileMetadata.push(newFile);

  saveMetadataToFile();

  res.status(200).send("File uploaded successfully.");
});

// Delete file endpoint
app.get("/file/delete", (req, res) => {
  const { filename } = req.query;
const apikey = "Eurixontop09";
  const { apikey: queryApiKey } = req.query;

  // Check if API key is valid
  if (queryApiKey !== apikey) {
    return res.status(403).send("Invalid API key.");
  }

  if (!filename) {
    return res.status(400).send("Filename is required.");
  }

  // Find file metadata
  const fileIndex = fileMetadata.findIndex((file) => file.name === filename);
  if (fileIndex === -1) {
    return res.status(404).send("File not found.");
  }

  // Construct file path
  const filePath = path.join(__dirname, "public", "uploads", filename);

  // Check if file exists and delete it
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);

    // Remove metadata
    fileMetadata.splice(fileIndex, 1);
    saveMetadataToFile();

    res.status(200).send("File deleted successfully.");
  } else {
    res.status(404).send("File not found on server.");
  }
});


app.get("/file/list", (req, res) => {
  res.status(200).json(fileMetadata);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});