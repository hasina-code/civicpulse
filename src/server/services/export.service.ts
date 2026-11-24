import type { PermissionUser } from "../permissions/issue.permissions";
import { AppError } from "../utils/errors";
import { getIssueById } from "./issue.service";

function printableAscii(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?");
}

function escapePdfText(value: string): string {
  return printableAscii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(value: string, width: number): string[] {
  const words = printableAscii(value).split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) {
      continue;
    }
    if (current && `${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function createPdf(lines: string[]): Buffer {
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    "15 TL",
    ...lines.flatMap((line, index) => [
      index === 0 ? "" : "T*",
      `(${escapePdfText(line)}) Tj`,
    ]).filter(Boolean),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`,
  ];

  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(document, "ascii");
}

export async function exportIssuePdf(
  actor: PermissionUser,
  issueId: string,
): Promise<Buffer> {
  const issue = await getIssueById(actor, issueId);
  const lines = [
    "CivicPulse Issue Report",
    `Issue ID: ${issue.id}`,
    `Title: ${issue.title}`,
    `Category: ${issue.category}`,
    `Priority: ${issue.priority}`,
    `Status: ${issue.status}`,
    `Address: ${issue.address}`,
    `Coordinates: ${issue.latitude}, ${issue.longitude}`,
    `Created: ${issue.createdAt.toISOString()}`,
    "Description:",
    ...wrapLine(issue.description, 85),
  ].slice(0, 45);

  if (lines.length === 0) {
    throw new AppError("Issue report contains no printable content", 500, "EMPTY_REPORT");
  }
  return createPdf(lines);
}
