import fs from "fs/promises";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const templatePath = path.join(process.cwd(), "assets", "cert-template.png");
const fontPath = path.join(process.cwd(), "assets", "arial-unicode.ttf");

let templateBytes;
let fontBytes;

async function loadAssets() {
  if (!templateBytes) {
    templateBytes = await fs.readFile(templatePath);
  }
  if (!fontBytes) {
    fontBytes = await fs.readFile(fontPath);
  }
}

function centerTextX(text, font, size, width) {
  const textWidth = font.widthOfTextAtSize(text, size);
  return (width - textWidth) / 2;
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

export async function generateCertificatePdf({
  recipientName,
  qualification,
  trainingCenterName,
  issuedAt,
  certificateNumber,
}) {
  await loadAssets();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const template = await pdfDoc.embedPng(templateBytes);
  const { width, height } = template.scale(1);

  const page = pdfDoc.addPage([width, height]);
  page.drawImage(template, { x: 0, y: 0, width, height });

  const title = "СЕРТИФИКАТ";
  const reason = "За успешное прохождение программы обучения, присуждается:";
  const qualificationLabel = "Квалификация";
  const centerLabel = "Центр";

  const titleSize = Math.round(height * 0.045);
  const nameSize = Math.round(height * 0.05);
  const reasonSize = Math.round(height * 0.024);
  const labelSize = Math.round(height * 0.022);
  const qualificationSize = Math.round(height * 0.028);
  const smallSize = Math.round(height * 0.02);

  const neutral = rgb(0.2, 0.2, 0.2);
  const muted = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.44, 0.29, 0.18);

  const titleY = height - height * 0.18;
  const nameY = height - height * 0.32;
  const reasonY = height - height * 0.4;
  const qualificationLabelY = height - height * 0.48;
  const qualificationY = height - height * 0.53;

  page.drawText(title, {
    x: centerTextX(title, font, titleSize, width),
    y: titleY,
    size: titleSize,
    font,
    color: neutral,
  });

  page.drawText(recipientName, {
    x: centerTextX(recipientName, font, nameSize, width),
    y: nameY,
    size: nameSize,
    font,
    color: neutral,
  });

  const reasonLines = wrapText(reason, font, reasonSize, width * 0.7);
  reasonLines.forEach((line, index) => {
    page.drawText(line, {
      x: centerTextX(line, font, reasonSize, width),
      y: reasonY - index * (reasonSize + 4),
      size: reasonSize,
      font,
      color: muted,
    });
  });

  page.drawText(qualificationLabel, {
    x: centerTextX(qualificationLabel, font, labelSize, width),
    y: qualificationLabelY,
    size: labelSize,
    font,
    color: muted,
  });

  page.drawText(qualification, {
    x: centerTextX(qualification, font, qualificationSize, width),
    y: qualificationY,
    size: qualificationSize,
    font,
    color: accent,
  });

  const dateText = new Date(issuedAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const leftX = width * 0.08;
  const rightMargin = width * 0.08;
  const bottomY = height * 0.12;

  page.drawText(centerLabel, {
    x: leftX,
    y: bottomY + smallSize + 4,
    size: smallSize,
    font,
    color: muted,
  });

  page.drawText(trainingCenterName, {
    x: leftX,
    y: bottomY,
    size: smallSize + 1,
    font,
    color: neutral,
  });

  const dateWidth = font.widthOfTextAtSize(dateText, smallSize + 1);
  page.drawText(dateText, {
    x: width - rightMargin - dateWidth,
    y: bottomY + smallSize + 4,
    size: smallSize + 1,
    font,
    color: neutral,
  });

  const numberText = `№ ${certificateNumber}`;
  const numberWidth = font.widthOfTextAtSize(numberText, smallSize + 1);
  page.drawText(numberText, {
    x: width - rightMargin - numberWidth,
    y: bottomY,
    size: smallSize + 1,
    font,
    color: neutral,
  });

  return pdfDoc.save();
}
