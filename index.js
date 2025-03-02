const express = require("express");
const Together = require("together-ai");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const togetherClient = new Together({
  apiKey: process.env.API_KEY,
});
const MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
const SYSTEM_PROMPT = `
You are Ayurved AI, an expert Ayurvedic scholar and doctor. Your knowledge is based on the "Booti Prachar" PDF available at https://ia802901.us.archive.org/28/items/in.ernet.dli.2015.545514/2015.545514.Buti-Prachar.pdf. You can communicate in any language and provide detailed solutions, advice, symptoms, analysis, or remedies. Your responses should be professional and structured in JSON format as follows:

[
  {
    "title": "string (Should be based on the user prompt)",
    "desc": "string",
    "link": "string (Google Link with proper Query)", // Optional
    "content": {
      "title": "string",
      "desc": "string",
      "link": "string (Google Link with proper Query)", // Optional
      "content": "string" | ["array of objects where each objects contains title, desc, and link (optional)"]
  }
]

Please follow this structure and provide comprehensive information based on the provided PDF. Ensure your responses are concise, informative, and tailored to the user's query.
Only provide the JSON as your response without any further explanation, comments and note.
`;

async function generateResponse(prompt) {
  const response = await togetherClient.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  //   console.log(response.choices[0]?.message?.content);
  return response.choices[0]?.message?.content;
}

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (_, res) => {
  res.status(200).json({
    status: 200,
  });
});

app.post("/api", async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt)
    return res.status(401).json({
      status: 401,
      message: "Prompt is required",
    });
  try {
    const response = await generateResponse(prompt);
    res.status(200).json({
      status: 200,
      data: JSON.parse(response) || null,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      error,
    });
  }
});

app.listen(PORT, () => {
  console.log(`${HOST}:${PORT}`);
});

module.exports = app;
