import "server-only";

import { readFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

type FontName = "regular" | "bold";
type PdfImage = {
  width: number;
  height: number;
  rgb: Buffer;
  alpha?: Buffer;
};

type PdfPage = {
  ops: string[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function safeText(value: unknown) {
  return String(value ?? "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function textWidth(value: string, size: number) {
  return value.length * size * 0.52;
}

function wrapText(value: string, width: number, size: number) {
  const words = safeText(value).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size) <= width || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function unfilterPngScanlines(data: Buffer, width: number, height: number, bytesPerPixel: number) {
  const stride = width * bytesPerPixel;
  const output = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = data[sourceOffset];
    sourceOffset += 1;
    const rowOffset = row * stride;

    for (let column = 0; column < stride; column += 1) {
      const raw = data[sourceOffset + column];
      const left = column >= bytesPerPixel ? output[rowOffset + column - bytesPerPixel] : 0;
      const up = row > 0 ? output[rowOffset + column - stride] : 0;
      const upLeft = row > 0 && column >= bytesPerPixel ? output[rowOffset + column - stride - bytesPerPixel] : 0;
      let value = raw;

      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        value = raw + predictor;
      }

      output[rowOffset + column] = value & 0xff;
    }

    sourceOffset += stride;
  }

  return output;
}

function readPng(path: string): PdfImage | null {
  const buffer = readFileSync(path);
  if (buffer.toString("ascii", 1, 4) !== "PNG") return null;

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
    } else if (type === "IDAT") {
      idat.push(chunk);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || ![2, 6].includes(colorType) || !width || !height) return null;

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const raw = unfilterPngScanlines(inflateSync(Buffer.concat(idat)), width, height, bytesPerPixel);
  const rgb = Buffer.alloc(width * height * 3);
  const alpha = colorType === 6 ? Buffer.alloc(width * height) : undefined;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * bytesPerPixel;
    const target = pixel * 3;
    rgb[target] = raw[source];
    rgb[target + 1] = raw[source + 1];
    rgb[target + 2] = raw[source + 2];
    if (alpha) alpha[pixel] = raw[source + 3];
  }

  return { width, height, rgb, alpha };
}

export type PdfRow = Array<string | number>;

export class SimplePdf {
  readonly width = PAGE_WIDTH;
  readonly height = PAGE_HEIGHT;
  readonly margin = MARGIN;
  readonly contentWidth = CONTENT_WIDTH;
  private pages: PdfPage[] = [];
  private page: PdfPage;
  private y = MARGIN;
  private logo: PdfImage | null = null;
  private footerLines: string[] = [];

  constructor({ title, logoPath, footerLines = [] }: { title: string; logoPath?: string; footerLines?: string[] }) {
    this.logo = logoPath ? readPng(logoPath) : null;
    this.footerLines = footerLines.map((line) => safeText(line)).filter(Boolean);
    this.page = this.addPage();
    this.header(title);
  }

  private addPage() {
    const page = { ops: [] };
    this.pages.push(page);
    this.page = page;
    this.y = MARGIN;
    return page;
  }

  private font(font: FontName) {
    return font === "bold" ? "F2" : "F1";
  }

  private color(hex: string) {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`;
  }

  private textAt(text: string, x: number, yFromTop: number, size: number, font: FontName, color = "#0f2438") {
    const y = PAGE_HEIGHT - yFromTop;
    this.page.ops.push(`BT /${this.font(font)} ${size} Tf ${this.color(color)} ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(safeText(text))}) Tj ET`);
  }

  private imageAt(width: number, height: number, x: number, yFromTop: number) {
    if (!this.logo) return;
    const y = PAGE_HEIGHT - yFromTop - height;
    this.page.ops.push(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /ImLogo Do Q`);
  }

  private line(x1: number, y1: number, x2: number, y2: number, color = "#d8dee8", width = 0.8) {
    this.page.ops.push(`${this.color(color).replace(" rg", " RG")} ${width} w ${x1.toFixed(2)} ${(PAGE_HEIGHT - y1).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_HEIGHT - y2).toFixed(2)} l S`);
  }

  private ensure(height: number) {
    const footerSpace = 58;
    if (this.y + height <= PAGE_HEIGHT - MARGIN - footerSpace) return;
    this.footer(this.pages.length);
    this.addPage();
    this.header("");
  }

  private header(title: string) {
    if (this.logo) this.imageAt(46, 46, MARGIN, MARGIN - 4);
    this.textAt("VIAJE TRAVEL AND TOURS", MARGIN + 58, MARGIN + 8, 13, "bold", "#0f2438");
    if (title) this.textAt(title.toUpperCase(), MARGIN + 58, MARGIN + 28, 18, "bold", "#890000");
    this.line(MARGIN, MARGIN + 58, PAGE_WIDTH - MARGIN, MARGIN + 58, "#890000", 1.2);
    this.y = MARGIN + 78;
  }

  private footer(pageNumber: number) {
    const top = PAGE_HEIGHT - MARGIN - 38;
    this.line(MARGIN, top, PAGE_WIDTH - MARGIN, top, "#d8dee8", 0.8);
    const footer = this.footerLines.join(" | ");
    if (footer) this.textAt(footer, MARGIN, top + 17, 7.5, "regular", "#64748b");
    this.textAt(`Page ${pageNumber}`, PAGE_WIDTH - MARGIN - 36, top + 17, 7.5, "regular", "#64748b");
  }

  section(title: string) {
    this.ensure(32);
    this.textAt(title, MARGIN, this.y, 11, "bold", "#890000");
    this.y += 18;
  }

  keyValues(values: Array<[string, string | number | undefined]>, columns = 2) {
    const gap = 18;
    const columnWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
    const rows = Math.ceil(values.length / columns);
    this.ensure(rows * 32 + 8);

    values.forEach(([label, value], index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = MARGIN + column * (columnWidth + gap);
      const y = this.y + row * 32;
      this.textAt(label, x, y, 7.5, "bold", "#64748b");
      wrapText(String(value || "N/A"), columnWidth, 9.5).slice(0, 2).forEach((line, lineIndex) => {
        this.textAt(line, x, y + 12 + lineIndex * 11, 9.5, "regular", "#0f2438");
      });
    });

    this.y += rows * 32 + 8;
  }

  paragraph(text: string, size = 9.5) {
    const lines = wrapText(text, CONTENT_WIDTH, size);
    this.ensure(lines.length * (size + 3) + 6);
    lines.forEach((line) => {
      this.textAt(line, MARGIN, this.y, size, "regular", "#0f2438");
      this.y += size + 3;
    });
    this.y += 4;
  }

  table(headers: string[], rows: PdfRow[], widths: number[]) {
    const total = widths.reduce((sum, width) => sum + width, 0);
    const scaled = widths.map((width) => (width / total) * CONTENT_WIDTH);
    const padding = 5;
    const rowGap = 12;

    this.ensure(28);
    let x = MARGIN;
    headers.forEach((header, index) => {
      this.textAt(header, x + padding, this.y, 8, "bold", "#64748b");
      x += scaled[index];
    });
    this.y += 14;
    this.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 8;

    rows.forEach((row) => {
      const cells = row.map((cell, index) => wrapText(String(cell || ""), scaled[index] - padding * 2, 8.5));
      const rowHeight = Math.max(...cells.map((cell) => cell.length)) * rowGap + 8;
      this.ensure(rowHeight + 4);
      x = MARGIN;
      cells.forEach((cell, index) => {
        cell.forEach((line, lineIndex) => {
          this.textAt(line, x + padding, this.y + lineIndex * rowGap, 8.5, index === row.length - 1 ? "bold" : "regular", "#0f2438");
        });
        x += scaled[index];
      });
      this.y += rowHeight;
      this.line(MARGIN, this.y - 4, PAGE_WIDTH - MARGIN, this.y - 4, "#edf0f5", 0.6);
    });

    this.y += 8;
  }

  signatureBlock() {
    this.ensure(86);
    this.y += 10;
    this.line(MARGIN, this.y + 30, MARGIN + 220, this.y + 30, "#0f2438", 0.8);
    this.textAt("Authorized Staff Signature", MARGIN, this.y + 44, 9, "bold", "#0f2438");
    this.textAt("Name: ______________________________", MARGIN, this.y + 62, 9, "regular", "#0f2438");
    this.textAt("Date: ______________________________", MARGIN + 260, this.y + 62, 9, "regular", "#0f2438");
    this.y += 84;
  }

  toBuffer() {
    this.footer(this.pages.length);

    const objects: Buffer[] = [];
    const addObject = (body: string | Buffer) => {
      const id = objects.length + 1;
      const content = Buffer.isBuffer(body) ? body : Buffer.from(body, "binary");
      objects.push(Buffer.concat([Buffer.from(`${id} 0 obj\n`, "binary"), content, Buffer.from("\nendobj\n", "binary")]));
      return id;
    };

    const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    let logoId = 0;
    let alphaId = 0;

    if (this.logo) {
      if (this.logo.alpha) {
        const alpha = deflateSync(this.logo.alpha);
        alphaId = addObject(Buffer.concat([
          Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${this.logo.width} /Height ${this.logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${alpha.length} >>\nstream\n`, "binary"),
          alpha,
          Buffer.from("\nendstream", "binary"),
        ]));
      }
      const rgb = deflateSync(this.logo.rgb);
      logoId = addObject(Buffer.concat([
        Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${this.logo.width} /Height ${this.logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode ${alphaId ? `/SMask ${alphaId} 0 R ` : ""}/Length ${rgb.length} >>\nstream\n`, "binary"),
        rgb,
        Buffer.from("\nendstream", "binary"),
      ]));
    }

    const pageIds: number[] = [];
    this.pages.forEach((page) => {
      const stream = Buffer.from(page.ops.join("\n"), "binary");
      const contentId = addObject(Buffer.concat([
        Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "binary"),
        stream,
        Buffer.from("\nendstream", "binary"),
      ]));
      const resources = `<< /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> ${logoId ? `/XObject << /ImLogo ${logoId} 0 R >>` : ""} >>`;
      pageIds.push(addObject(`<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources ${resources} /Contents ${contentId} 0 R >>`));
    });

    const pagesId = objects.length + 1;
    for (let index = 0; index < objects.length; index += 1) {
      objects[index] = Buffer.from(objects[index].toString("binary").replace("PAGES_REF", `${pagesId} 0 R`), "binary");
    }
    addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

    const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
    const offsets: number[] = [0];
    let position = header.length;
    objects.forEach((object) => {
      offsets.push(position);
      position += object.length;
    });

    const xrefStart = position;
    const xref = [
      `xref\n0 ${objects.length + 1}`,
      "0000000000 65535 f ",
      ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>`,
      `startxref\n${xrefStart}`,
      "%%EOF\n",
    ].join("\n");

    return Buffer.concat([header, ...objects, Buffer.from(xref, "binary")]);
  }
}
