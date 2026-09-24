import express from "express";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

if (!process.env.HF_TOKEN) {
    console.error("ERROR: HF_TOKEN is not configured.");
    process.exit(1);
}

const hf = new InferenceClient(process.env.HF_TOKEN);

app.use(express.json({ limit: "2mb" }));

app.use(express.static(path.join(__dirname, "public")));


/* ================================
   HEALTH CHECK
================================ */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        status: "online",
        service: "Comic AI Studio"
    });

});


/* ================================
   IMAGE GENERATOR
================================ */

app.post("/api/generate", async (req, res) => {

    try {

        const {
            prompt,
            width = 768,
            height = 768
        } = req.body;


        if (!prompt) {

            return res.status(400).json({
                success: false,
                error: "Prompt is required."
            });

        }


        const finalPrompt = `
Professional comic book illustration.

${prompt}

Requirements:

- detailed comic illustration
- consistent character appearance
- consistent clothing
- consistent hairstyle
- expressive face
- cinematic composition
- detailed environment
- beautiful lighting
- high quality
- sharp details
- no watermark
- no logo
- no random text
`;


        console.log("Generating image...");


        const image = await hf.textToImage({

            model:
                "black-forest-labs/FLUX.1-schnell",

            provider:
                "auto",

            inputs:
                finalPrompt,

            parameters: {

                width:
                    Number(width),

                height:
                    Number(height)

            }

        });


        const buffer = Buffer.from(
            await image.arrayBuffer()
        );


        const base64 =
            buffer.toString("base64");


        res.json({

            success: true,

            image:
                `data:image/png;base64,${base64}`

        });


    } catch (error) {

        console.error(
            "HUGGING FACE ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error?.message ||
                "Image generation failed."

        });

    }

});


/* ================================
   WEBSITE
================================ */

app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* ================================
   START
================================ */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Comic AI running on port ${PORT}`
        );

    }
);
