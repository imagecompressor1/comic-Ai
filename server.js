import express from "express";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const hf = new InferenceClient(process.env.HF_TOKEN);

app.use(express.json({ limit: "5mb" }));

// Serve website
app.use(express.static("public"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Comic AI Studio",
    huggingface: Boolean(process.env.HF_TOKEN)
  });
});

// Generate image
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Prompt is required."
      });
    }

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "HF_TOKEN is not configured."
      });
    }

    console.log("Generating image...");
    console.log("Prompt:", prompt);

    const image = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt
    });

    const buffer = Buffer.from(await image.arrayBuffer());

    const base64 = buffer.toString("base64");

    res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`
    });

  } catch (error) {

    console.error("IMAGE GENERATION ERROR:");
    console.error(error);

    res.status(500).json({
      ok: false,
      error: error?.message || "Image generation failed."
    });
  }
});

// Express 5 compatible fallback
app.get("/{*splat}", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Comic AI Studio running on port ${PORT}`);
  console.log(`HF token configured: ${Boolean(process.env.HF_TOKEN)}`);
});
