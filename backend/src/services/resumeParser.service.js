import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import ApiError from "../utils/apiError.js";

/**
 * ============================================================================
 * RESUME PARSER SERVICE
 * ============================================================================
 * Honest scope note: this is a regex/heuristic-based parser, not an ML/NLP
 * model. It will get email, phone, and skills right almost all the time
 * (those have predictable formats). Name, experience, and education
 * extraction rely on resumes following common formatting conventions
 * (section headers like "EXPERIENCE", "EDUCATION"), so a resume with
 * unconventional layout (e.g. a heavily designed/columnar PDF) may parse
 * incompletely. The frontend's "Manual Verification & Editing" step exists
 * specifically to let the user correct whatever this gets wrong - that's by
 * design, not a workaround.
 *
 * If higher accuracy is needed later, swap extractStructuredFields() for a
 * call to an LLM (pass the raw text, ask for the same JSON shape) - the rest
 * of the pipeline (upload -> extract text -> return JSON) doesn't change.
 * ============================================================================
 */

// ---- Step 1: Extract raw text from the uploaded file ----

async function extractTextFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

async function extractTextFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractText(fileBuffer, mimetype) {
  if (mimetype === "application/pdf") {
    return extractTextFromPdf(fileBuffer);
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    return extractTextFromDocx(fileBuffer);
  }

  throw ApiError.badRequest("Unsupported file type for resume parsing.");
}

// ---- Step 2: Parse structured fields out of the raw text ----

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;

// A reasonably broad dictionary of common tech/professional skills to match
// against. Case-insensitive, whole-word matching against the full text.
const SKILL_DICTIONARY = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
  "React", "React Native", "Next.js", "Vue", "Angular", "Svelte", "Redux", "Zustand",
  "Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Laravel",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQL", "GraphQL", "REST API",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "GitHub Actions",
  "Tailwind CSS", "HTML", "CSS", "Sass", "Figma", "UI/UX Design",
  "Project Management", "Agile", "Scrum", "Communication", "Leadership",
  "Data Analysis", "Machine Learning", "TensorFlow", "PyTorch",
];

const SECTION_HEADERS = {
  experience: /^(work\s+)?experience|employment\s+history|professional\s+experience$/i,
  education: /^education|academic\s+background$/i,
  skills: /^(technical\s+)?skills|core\s+competencies$/i,
  summary: /^(professional\s+)?summary|objective|profile|about\s*(me)?$/i,
};

/**
 * Splits raw resume text into lines and groups them under detected section
 * headers (EXPERIENCE, EDUCATION, SKILLS). Lines before the first detected
 * header go into "header" (usually name/contact info).
 */
function splitIntoSections(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const sections = { header: [], experience: [], education: [], skills: [], summary: [], other: [] };
  let currentSection = "header";

  for (const line of lines) {
    const matchedHeader = Object.entries(SECTION_HEADERS).find(([, regex]) => regex.test(line));

    if (matchedHeader) {
      currentSection = matchedHeader[0];
      continue; // don't include the header line itself as content
    }

    sections[currentSection].push(line);
  }

  return sections;
}

/**
 * The name is typically the very first non-empty line of a resume, and it's
 * usually short (2-4 words) and doesn't contain @ or digits (which would
 * indicate it's actually a contact-info line).
 */
function guessFullName(headerLines) {
  const candidate = headerLines.find((line) => {
    const wordCount = line.split(/\s+/).length;
    return wordCount >= 2 && wordCount <= 4 && !/[@\d]/.test(line);
  });
  return candidate || null;
}

// Resumes typically list location in the contact line at the very top,
// often alongside email/phone separated by "|" or "•", e.g.
// "jane@email.com | (555) 123-4567 | San Francisco, CA". We split each
// header line on those delimiters and test each piece for a "City, ST" /
// "City, Country" shape, skipping any piece that's actually the email or
// phone. Honest limitation: this can misfire on header lines phrased like
// "Senior Engineer, Acme Corp" if that line appears before any detected
// section header - rare, since headers are usually just name + contact info.
const LOCATION_REGEX = /\b[A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+){0,3},\s*(?:[A-Z]{2}\b|[A-Z][a-zA-Z]+)\b/;

function guessLocation(headerLines) {
  for (const line of headerLines) {
    const segments = line.split(/[|•]/).map((s) => s.trim()).filter(Boolean);
    for (const segment of segments) {
      if (EMAIL_REGEX.test(segment) || PHONE_REGEX.test(segment)) continue;
      const match = segment.match(LOCATION_REGEX);
      if (match) return match[0];
    }
  }
  return null;
}

// Joins whatever lines fell under a "Summary"/"Objective"/"Profile" header
// into a single paragraph. Capped at 600 chars so a mis-detected section
// boundary (e.g. the parser missing the next header) can't dump an entire
// resume into the summary field.
function extractSummaryText(summaryLines) {
  if (!summaryLines.length) return null;
  const joined = summaryLines.join(" ").replace(/\s+/g, " ").trim();
  return joined ? joined.slice(0, 600) : null;
}

export function extractSkills(text) {
  const found = SKILL_DICTIONARY.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "i");
    return pattern.test(text);
  });
  return [...new Set(found)];
}

/**
 * Groups experience section lines into entries. Heuristic: a new entry
 * starts at a line that looks like "Title at Company" / "Title - Company" /
 * "Title, Company", or a line immediately followed by a date range.
 */
function parseExperienceEntries(lines) {
  const dateRangeRegex = /\b(19|20)\d{2}\b.{0,15}(present|current|\b(19|20)\d{2}\b)/i;
  const entries = [];
  let current = null;

  for (const line of lines) {
    const isDateLine = dateRangeRegex.test(line);
    // A new role line: starts with a capital letter and contains a
    // title/company separator ("at", " - ", or ", "), and isn't itself a date range.
    const looksLikeNewRole =
      !isDateLine &&
      /^[A-Z]/.test(line) &&
      (/\bat\b/.test(line) || / - /.test(line) || /, /.test(line));

    if (looksLikeNewRole) {
      if (current) entries.push(current);
      const [title, company] = line.split(/\bat\b| - |, /i);
      current = { title: title?.trim() || line, company: company?.trim() || "", description: "" };
    } else if (isDateLine && current) {
      current.dates = line.match(dateRangeRegex)[0];
    } else if (current) {
      current.description = current.description ? `${current.description} ${line}` : line;
    }
  }
  if (current) entries.push(current);

  return entries.slice(0, 10); // sanity cap
}

function parseEducationEntries(lines) {
  const entries = [];
  let current = null;

  for (const line of lines) {
    const looksLikeInstitution = /university|college|institute|school/i.test(line);

    if (looksLikeInstitution) {
      if (current) entries.push(current);
      current = { institution: line, degree: "" };
    } else if (current) {
      // Likely the degree/field-of-study line right after the institution
      current.degree = current.degree ? current.degree : line;
    }
  }
  if (current) entries.push(current);

  return entries.slice(0, 6);
}

/**
 * Main entry point: takes raw resume text and returns the structured shape
 * defined in the spec:
 * { fullName, email, phone, skills: [], experience: [], education: [] }
 */
export function extractStructuredFields(rawText) {
  const sections = splitIntoSections(rawText);
  const fullText = rawText;

  const emailMatch = fullText.match(EMAIL_REGEX);
  const phoneMatch = fullText.match(PHONE_REGEX);

 return {
    fullName: guessFullName(sections.header),
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    location: guessLocation(sections.header),
    summary: extractSummaryText(sections.summary),
    skills: extractSkills(fullText),
    experience: parseExperienceEntries(sections.experience),
    education: parseEducationEntries(sections.education),
    rawTextLength: rawText.length,
  };
}

/**
 * Full pipeline: buffer -> text -> structured fields.
 */
export async function parseResume(fileBuffer, mimetype) {
  const rawText = await extractText(fileBuffer, mimetype);

  if (!rawText || rawText.trim().length < 20) {
    throw ApiError.badRequest(
      "Could not extract readable text from this file. It may be a scanned/image-based document."
    );
  }

  return extractStructuredFields(rawText);
}
