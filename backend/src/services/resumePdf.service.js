import PDFDocument from "pdfkit";

/**
 * Real (not stubbed) template definitions - each controls accent color and
 * heading font weight so "switching templates" actually changes output.
 * Add more entries here as the frontend's Template Style Chooser grows.
 */
export const RESUME_TEMPLATES = [
  { id: "classic", name: "Classic", accentColor: "#1f2937", headingFont: "Helvetica-Bold" },
  { id: "modern-blue", name: "Modern Blue", accentColor: "#2563eb", headingFont: "Helvetica-Bold" },
  { id: "bold-teal", name: "Bold Teal", accentColor: "#0d9488", headingFont: "Helvetica-Bold" },
];

function getTemplate(templateId) {
  return RESUME_TEMPLATES.find((t) => t.id === templateId) || RESUME_TEMPLATES[0];
}

/**
 * Renders a Profile (+ user name/email) into a PDF buffer using the chosen template.
 * @returns {Promise<Buffer>}
 */
export function generateResumePdf({ profile, name, email, templateId }) {
  const template = getTemplate(templateId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- Header ---
    doc.fillColor(template.accentColor).font(template.headingFont).fontSize(24).text(name || "Your Name");
    doc.fillColor("#374151").font("Helvetica").fontSize(10);
    const contactLine = [email, profile?.phone, profile?.location].filter(Boolean).join("  |  ");
    if (contactLine) doc.text(contactLine);
    if (profile?.headline) {
      doc.moveDown(0.3);
      doc.fillColor(template.accentColor).fontSize(12).text(profile.headline);
    }
    doc.moveDown(0.8);
    doc.strokeColor(template.accentColor).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    const section = (title) => {
      doc.fillColor(template.accentColor).font(template.headingFont).fontSize(13).text(title.toUpperCase());
      doc.moveDown(0.3);
      doc.fillColor("#111827").font("Helvetica").fontSize(10);
    };

    // --- Summary ---
    if (profile?.summary) {
      section("Summary");
      doc.text(profile.summary);
      doc.moveDown(0.8);
    }

    // --- Experience ---
    if (profile?.experience?.length) {
      section("Experience");
      profile.experience.forEach((exp) => {
        doc.font("Helvetica-Bold").text(`${exp.title || ""} ${exp.company ? "— " + exp.company : ""}`.trim());
        doc.font("Helvetica").fontSize(9).fillColor("#6b7280");
        const dates = [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" – ");
        if (dates || exp.location) doc.text([dates, exp.location].filter(Boolean).join("  |  "));
        doc.fillColor("#111827").fontSize(10);
        if (exp.description) doc.text(exp.description);
        doc.moveDown(0.6);
      });
    }

    // --- Education ---
    if (profile?.education?.length) {
      section("Education");
      profile.education.forEach((edu) => {
        doc.font("Helvetica-Bold").text([edu.degree, edu.fieldOfStudy].filter(Boolean).join(", "));
        doc.font("Helvetica").fontSize(9).fillColor("#6b7280");
        const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
        doc.text([edu.institution, dates].filter(Boolean).join("  |  "));
        doc.fillColor("#111827").fontSize(10);
        doc.moveDown(0.5);
      });
    }

    // --- Skills ---
    if (profile?.skills?.length) {
      section("Skills");
      doc.text(profile.skills.join("  •  "));
      doc.moveDown(0.5);
    }

    doc.end();
  });
}
