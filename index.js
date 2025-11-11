 
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { createCanvas, loadImage } = require("canvas");
const QuoteGenerate = require("./quote-generate.js"); 

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

// 🟢 Create instance of quote generator
const quote = new QuoteGenerate(process.env.TOKEN);

const BUBBLE_COLOR = "#303030"; // solid chat bubble
const BACKGROUND_IMAGE =
  "https://i.pinimg.com/564x/d3/6b/cc/d36bcceceaa1d390489ec70d93154311.jpg";

// 🧠 Utility: Wrap text nicely by character length (avoids overflow)
function wrapTextByLength(text, maxLength = 45) {
  if (!text || typeof text !== "string") return "";
  const words = text.split(" ");
  let line = "";
  let result = "";

  for (const word of words) {
    if ((line + word).length > maxLength) {
      result += line.trim() + "\n";
      line = word + " ";
    } else {
      line += word + " ";
    }
  }

  result += line.trim();
  return result;
}

// 🧩 POST /quote/generate
app.post("/quote/generate", async (req, res) => {
  try {
    const message = req.body;

    // 🧾 Validate request
    if (!message || !message.from || !message.text) {
      return res.status(400).json({ error: "Invalid message payload" });
    }

    // 📝 Wrap text for better bubble fitting
    message.text = wrapTextByLength(message.text, 45);

    // ✨ Step 1: Generate the quote bubble
    const quoteCanvas = await quote.generate(
      BUBBLE_COLOR,
      BUBBLE_COLOR, // both same for solid color
      message,
      512,
      512,
      2,
      "apple"
    );

    // 🖼️ Step 2: Load background image
    const bgImage = await loadImage(BACKGROUND_IMAGE);

    // 🧮 Step 3: Dynamically size canvas based on bubble
    const padding = Math.max(quoteCanvas.width, quoteCanvas.height) * 0.2;
    const canvasWidth = quoteCanvas.width + padding;
    const canvasHeight = quoteCanvas.height + padding;

    // 🎨 Step 4: Create base canvas
    const baseCanvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = baseCanvas.getContext("2d");

    // 🪄 Step 5: Draw background image (cover style)
    const aspect = bgImage.width / bgImage.height;
    const canvasAspect = canvasWidth / canvasHeight;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (aspect > canvasAspect) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * aspect;
      offsetX = -(drawWidth - canvasWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / aspect;
      offsetX = 0;
      offsetY = -(drawHeight - canvasHeight) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // 🧭 Step 6: Center bubble
    const x = (canvasWidth - quoteCanvas.width) / 2;
    const y = (canvasHeight - quoteCanvas.height) / 2;
    ctx.drawImage(quoteCanvas, x, y);

    // 💾 Step 7: Convert to PNG
    const buffer = baseCanvas.toBuffer("image/png");

    // 🧠 Step 8: Send as response
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

    console.log(
      `✅ Quote generated dynamically (${canvasWidth}x${canvasHeight}) | Bubble centered`
    );
  } catch (err) {
    console.error("❌ Error generating quote:", err);
    res
      .status(500)
      .json({ error: "Failed to generate quote", details: err.message });
  }
});

app.use("/", express.static(path.join(__dirname, "/working.html")));

// 🟢 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(
    `🚀 Quote generator API running on http://localhost:${PORT}/quote/generate`
  );
});

     module.exports = app;
