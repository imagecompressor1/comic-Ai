import express from "express";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const hf = new InferenceClient(process.env.HF_TOKEN);

app.use(express.json({ limit: "5mb" }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Comic AI Studio",
    huggingfaceConfigured: Boolean(process.env.HF_TOKEN)
  });
});

app.post("/api/generate", async (req, res) => {
  const started = Date.now();

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Prompt is required."
      });
    }

    if (!process.env.HF_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "HF_TOKEN is missing in Render Environment Variables."
      });
    }

    console.log("================================");
    console.log("IMAGE GENERATION START");
    console.log("Model: black-forest-labs/FLUX.1-schnell");
    console.log("Provider: nscale");
    console.log("Prompt length:", prompt.length);
    console.log("================================");

    const image = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      provider: "nscale",
      inputs: prompt,
      parameters: {
        num_inference_steps: 4
      }
    });

    if (!image) {
      throw new Error("Hugging Face returned an empty image.");
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    if (!buffer.length) {
      throw new Error("Generated image contains no data.");
    }

    const base64 = buffer.toString("base64");

    console.log(
      "IMAGE SUCCESS:",
      buffer.length,
      "bytes",
      "time:",
      Date.now() - started,
      "ms"
    );

    return res.json({
      ok: true,
      image: `data:image/png;base64,${base64}`,
      provider: "nscale",
      model: "black-forest-labs/FLUX.1-schnell"
    });

  } catch (error) {

    console.error("================================");
    console.error("HUGGING FACE IMAGE ERROR");
    console.error("================================");

    console.error("Name:", error?.name);
    console.error("Message:", error?.message);
    console.error("Status:", error?.status);
    console.error("StatusCode:", error?.statusCode);
    console.error("Cause:", error?.cause);
    console.error("Response:", error?.response);

    let message = error?.message || "Unknown Hugging Face error";

    if (error?.response) {
      try {
        const responseText = await error.response.text();
        console.error("HF RESPONSE:", responseText);

        if (responseText) {
          message = responseText;
        }
      } catch (readError) {
        console.error("Could not read HF response:", readError);
      }
    }

    console.error("================================");

    return res.status(500).json({
      ok: false,
      error: message,
      status: error?.status || error?.statusCode || 500
    });
  }
});

// Express 5 compatible fallback
app.get("/{*splat}", (req, res) => {
  res.sendFile("index.html", {
    root: "public"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("================================");
  console.log("Comic AI Studio is running");
  console.log("Port:", PORT);
  console.log("HF Token:", Boolean(process.env.HF_TOKEN));
  console.log("================================");
});
