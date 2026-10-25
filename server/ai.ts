import { GoogleGenAI } from '@google/genai';
import { db, GeneratedLesson, AIConfig } from './db.js';

export interface GenerateLessonParams {
  schoolLevel: string;
  grade: string;
  curriculum: string;
  country?: string;
  subject: string;
  topic: string;
  language: string;
  difficulty?: 'easy' | 'medium' | 'advanced';
  lessonLength?: 'short' | 'medium' | 'detailed';
  slidesCount?: number;
  includeExercises?: boolean;
  includeQuiz?: boolean;
  forTeacher?: boolean;
}

export interface AIProviderStatus {
  activeProvider: 'gemini' | 'openrouter';
  activeModel: string;
  geminiConfigured: boolean;
  geminiModel: string;
  openrouterConfigured: boolean;
  openrouterModel: string;
}

export function getAIConfig(): AIConfig {
  const stored = db.get('aiConfig');
  if (stored) return stored;

  const defaultConfig: AIConfig = {
    provider: (process.env.AI_PROVIDER as any) === 'openrouter' ? 'openrouter' : 'gemini',
    geminiModel: 'gemini-flash-lite-latest',
    openrouterModel: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct:free',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    temperature: 0.3,
  };
  return defaultConfig;
}

export function updateAIConfig(updates: Partial<AIConfig>): AIConfig {
  let updatedConfig: AIConfig = getAIConfig();
  db.update(data => {
    data.aiConfig = {
      ...getAIConfig(),
      ...updates,
    };
    updatedConfig = data.aiConfig;
  });
  return updatedConfig;
}

export function getAIProviderStatus(): AIProviderStatus {
  const config = getAIConfig();
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const openrouterApiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY;
  const openrouterConfigured = Boolean(openrouterApiKey);

  const activeProvider = config.provider;
  const activeModel = activeProvider === 'gemini' ? (config.geminiModel || 'gemini-flash-lite-latest') : config.openrouterModel;

  return {
    activeProvider,
    activeModel,
    geminiConfigured,
    geminiModel: config.geminiModel || 'gemini-flash-lite-latest',
    openrouterConfigured,
    openrouterModel: config.openrouterModel || 'qwen/qwen-2.5-72b-instruct:free',
  };
}

export async function testAIProviderConnection(customConfig?: Partial<AIConfig>): Promise<{
  success: boolean;
  provider: string;
  model: string;
  durationMs: number;
  sampleResponse?: string;
}> {
  const current = getAIConfig();
  const config = { ...current, ...customConfig };
  const startTime = Date.now();

  if (config.provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('Clé API GEMINI_API_KEY manquante ou non configurée.');
    }
    const model = config.geminiModel || 'gemini-flash-lite-latest';
    const ai = new GoogleGenAI({
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
    const resp = await ai.models.generateContent({
      model,
      contents: 'Respond with exactly: {"status":"connected","ready":true}',
    });
    const durationMs = Date.now() - startTime;
    return {
      success: true,
      provider: 'Google Gemini',
      model,
      durationMs,
      sampleResponse: resp.text?.slice(0, 100),
    };
  }

  if (config.provider === 'openrouter') {
    const apiKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('Clé API OpenRouter manquante.');
    }
    const model = config.openrouterModel || 'qwen/qwen-2.5-72b-instruct:free';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://educraft.ma',
        'X-Title': 'EduCraft AI Studio',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
        max_tokens: 20,
      }),
    });
    const durationMs = Date.now() - startTime;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }
    return {
      success: true,
      provider: 'OpenRouter',
      model,
      durationMs,
    };
  }

  throw new Error(`Fournisseur non supporté: ${config.provider}`);
}

export async function generateLessonWithAI(params: GenerateLessonParams): Promise<{
  lesson: Omit<GeneratedLesson, 'id' | 'createdAt' | 'createdBy'>;
  providerUsed: string;
  modelUsed: string;
  isRealAI: boolean;
  generationDurationMs: number;
}> {
  // Validate topic strictly
  if (!params.topic || !params.topic.trim()) {
    throw new Error('Le sujet (topic) est obligatoire pour générer un cours.');
  }

  const cleanTopic = params.topic.trim();
  const config = getAIConfig();
  const startTime = Date.now();

  console.log(`[AI-DIAGNOSTIC] >>> New Generation Request`);
  console.log(`[AI-DIAGNOSTIC] Topic: "${cleanTopic}" | Subject: "${params.subject}" | Grade: "${params.grade}" | Curriculum: "${params.curriculum}" | Lang: "${params.language}"`);
  console.log(`[AI-DIAGNOSTIC] Selected Provider: ${config.provider}`);

  // 1. Google Gemini Provider
  if (config.provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      const errMsg = 'La clé API Google Gemini (GEMINI_API_KEY) n\'est pas configurée sur le serveur.';
      console.error(`[AI-DIAGNOSTIC] Error: ${errMsg}`);
      throw new Error(errMsg);
    }

    const modelName = config.geminiModel || 'gemini-flash-lite-latest';
    console.log(`[AI-DIAGNOSTIC] Sending real request to Google Gemini with model: "${modelName}"`);

    const ai = new GoogleGenAI({
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = buildPrompt({ ...params, topic: cleanTopic });
    console.log(`[AI-DIAGNOSTIC] Verified prompt topic: "${cleanTopic}" included in Gemini prompt.`);

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: config.temperature ?? 0.3,
          maxOutputTokens: 8192,
        },
      });

      const durationMs = Date.now() - startTime;
      console.log(`[AI-DIAGNOSTIC] Gemini response received successfully in ${durationMs}ms`);

      const text = response.text || '';
      if (!text.trim()) {
        throw new Error('Réponse vide reçue du modèle Gemini.');
      }

      const parsed = JSON.parse(text);
      const validatedLesson = validateAndSanitizeLesson(parsed, { ...params, topic: cleanTopic });

      console.log(`[AI-DIAGNOSTIC] Validated generated lesson: "${validatedLesson.title}" (${validatedLesson.paragraphs.length} chapters, level: ${validatedLesson.grade})`);

      return {
        lesson: validatedLesson,
        providerUsed: 'Google Gemini',
        modelUsed: modelName,
        isRealAI: true,
        generationDurationMs: durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      console.error(`[AI-DIAGNOSTIC] Gemini request failed after ${durationMs}ms:`, err.message || err);
      // Do NOT silently swallow the error or return mock default text!
      throw new Error(`Échec de la génération Gemini (${modelName}): ${err.message || 'Erreur inconnue'}`);
    }
  }

  // 2. OpenRouter Provider
  if (config.provider === 'openrouter') {
    const openrouterKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      const errMsg = 'La clé API OpenRouter (OPENROUTER_API_KEY) n\'est pas configurée.';
      console.error(`[AI-DIAGNOSTIC] Error: ${errMsg}`);
      throw new Error(errMsg);
    }

    const modelName = config.openrouterModel || 'qwen/qwen-2.5-72b-instruct:free';
    console.log(`[AI-DIAGNOSTIC] Sending real request to OpenRouter with model: "${modelName}"`);

    const prompt = buildPrompt({ ...params, topic: cleanTopic });

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://educraft.ma',
          'X-Title': 'EduCraft AI Studio',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are EduCraft AI, an expert school teacher and curriculum specialist for Moroccan and international school systems. You always return valid raw JSON strictly adhering to the requested schema. Never return generic text.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: config.temperature ?? 0.3,
        }),
      });

      const durationMs = Date.now() - startTime;
      console.log(`[AI-DIAGNOSTIC] OpenRouter HTTP status: ${res.status} (${durationMs}ms)`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[AI-DIAGNOSTIC] OpenRouter HTTP ${res.status} Error:`, errorText);
        throw new Error(`Erreur OpenRouter (Status ${res.status}): ${errorText.slice(0, 200)}`);
      }

      const json = await res.json();
      const contentStr = json.choices?.[0]?.message?.content;
      if (!contentStr) {
        throw new Error('Réponse OpenRouter invalide ou sans contenu.');
      }

      const parsed = JSON.parse(contentStr);
      const validatedLesson = validateAndSanitizeLesson(parsed, { ...params, topic: cleanTopic });

      return {
        lesson: validatedLesson,
        providerUsed: 'OpenRouter',
        modelUsed: modelName,
        isRealAI: true,
        generationDurationMs: durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      console.error(`[AI-DIAGNOSTIC] OpenRouter request failed after ${durationMs}ms:`, err.message || err);
      throw new Error(`Échec de la génération OpenRouter (${modelName}): ${err.message || 'Erreur réseau'}`);
    }
  }

  throw new Error(`Fournisseur d'IA inconnu: ${config.provider}`);
}

function resolveCountry(params: GenerateLessonParams): string {
  if (params.country && params.country.trim()) return params.country.trim();
  const curr = (params.curriculum || '').toLowerCase();
  if (curr.includes('french') || curr.includes('aefe') || curr.includes('france')) {
    return 'France';
  }
  return 'Morocco';
}

function buildPrompt(params: GenerateLessonParams): string {
  const country = resolveCountry(params);
  return `You are EduCraft AI, a distinguished pedagogical inspector and master educator specializing in ${country} and international educational standards.
Your mission is to generate an extensive, highly comprehensive, age-adapted, and academically complete educational course.

CORE METADATA:
- Subject: ${params.subject}
- Topic: "${params.topic}" (The entire lesson must focus directly and deeply on this topic)
- Exact School Level: "${params.grade}" (Cycle: ${params.schoolLevel})
- Country: ${country}
- Curriculum: ${params.curriculum}
- Language: ${params.language}
- Difficulty Level: ${params.difficulty || 'medium'}
- Requested Length: Comprehensive Detailed Course (Minimum 6 substantial chapters)
- Audience: ${params.forTeacher ? 'Teacher Instructional Guide & Lesson Plan' : 'Complete Student Textbook Course'}

STRICT LEVEL ADAPTATION RULES:
1. Adapt all vocabulary, explanations, examples, exercise difficulty, and pedagogical depth precisely to "${params.grade}":
   - If Primary (e.g. 6ème primaire / CM1 / CM2): Use accessible, encouraging, concrete language with intuitive visual analogies, real-world objects, and straightforward arithmetic. Do NOT use abstract university formalism or obscure notation.
   - If Middle School / Collège (e.g. 1AC, 2AC, 3AC / 6ème, 3ème Brevet): Use clear technical terminology, rigorous geometric definitions, algebraic reasoning, and structured multi-step problems suitable for 12-15 year olds.
   - If High School / Lycée (e.g. Tronc Commun, 1ère Bac, 2ème Bac): Use rigorous scientific and mathematical notation, formal proofs, analytical depth, and exam-level problem solving.

STRICT LENGTH & QUALITY RULES:
1. MINIMUM 6 SUBSTANTIAL CHAPTERS: In "paragraphs", provide at least 6 distinct, structured chapters with descriptive headings.
2. SUBSTANTIAL CONTENT: Each chapter MUST contain approximately 4 to 8 meaningful, instructive explanatory sentences.
3. NO FILLER OR SHORTCUTS: Never use placeholder phrases such as "explain the concept here", "apply the rule", or repetition. Provide the complete pedagogical teaching text with definitions and concrete step-by-step worked examples.
4. EXERCISES OF INCREASING DIFFICULTY: Provide at least 3 distinct exercises (Level 1: Basic application, Level 2: Intermediate problem, Level 3: Advanced challenge) with pedagogical hints and full step-by-step solutions.
5. FORMATIVE QUIZ: Provide multiple-choice questions with plausible distractors, correct answer index, and clear explanations.
6. COMMON MISTAKES & APPLICATIONS: Detail at least 2-3 frequent student pitfalls and at least 2 practical real-world applications.

REQUIRED RAW JSON SCHEMA (Output valid JSON only):
{
  "title": "Clear and specific title on ${params.topic}",
  "schoolLevel": "${params.grade}",
  "country": "${country}",
  "curriculum": "${params.curriculum}",
  "subject": "${params.subject}",
  "language": "${params.language}",
  "objective": "Detailed learning objectives explaining exactly what the student will understand and be capable of doing",
  "prerequisites": [
    "Prerequisite skill 1 required before this lesson",
    "Prerequisite skill 2"
  ],
  "introduction": "Thorough, engaging introduction (4-6 sentences) explaining the importance of ${params.topic}, its historical or scientific origins, and why it matters in real life.",
  "paragraphs": [
    {
      "title": "Chapitre 1: [Descriptive Section Title on ${params.topic}]",
      "body": "Comprehensive teaching explanation (4-8 full explanatory sentences) tailored to ${params.grade}."
    },
    {
      "title": "Chapitre 2: [Descriptive Section Title on ${params.topic}]",
      "body": "Detailed rules, definitions, and step-by-step worked example (4-8 full explanatory sentences)."
    },
    {
      "title": "Chapitre 3: [Descriptive Section Title on ${params.topic}]",
      "body": "In-depth properties, analytical steps, or anatomical/scientific mechanisms (4-8 full explanatory sentences)."
    },
    {
      "title": "Chapitre 4: [Descriptive Section Title on ${params.topic}]",
      "body": "Methodology, practical resolution techniques, and nuances (4-8 full explanatory sentences)."
    },
    {
      "title": "Chapitre 5: [Descriptive Section Title on ${params.topic}]",
      "body": "Problem-solving strategies and comparative analysis (4-8 full explanatory sentences)."
    },
    {
      "title": "Chapitre 6: [Descriptive Section Title on ${params.topic}]",
      "body": "Synthesis of techniques, consolidation of rules, and transition to application (4-8 full explanatory sentences)."
    }
  ],
  "commonMistakes": [
    {
      "mistake": "Typical error made by students on ${params.topic}",
      "correction": "The correct method or rule",
      "why": "Explanation of why students stumble on this and how to avoid it"
    },
    {
      "mistake": "Second common mistake",
      "correction": "Correct approach",
      "why": "Explanation"
    }
  ],
  "practicalApplications": [
    {
      "field": "Practical domain (e.g. Architecture, Daily Life, Medicine, Astronomy)",
      "description": "Concrete explanation of how ${params.topic} is directly utilized in this domain."
    },
    {
      "field": "Second practical domain",
      "description": "Concrete application details."
    }
  ],
  "vocab": [
    {
      "term": "Key technical term 1",
      "definition": "Clear, age-adapted definition",
      "example": "Illustrative sentence in context of ${params.topic}"
    },
    {
      "term": "Key technical term 2",
      "definition": "Clear, age-adapted definition",
      "example": "Illustrative sentence in context of ${params.topic}"
    },
    {
      "term": "Key technical term 3",
      "definition": "Clear, age-adapted definition",
      "example": "Illustrative sentence in context of ${params.topic}"
    }
  ],
  "slides": [
    {
      "slideNumber": 1,
      "title": "${params.topic} - Fondations",
      "category": "Introduction & Contexte",
      "bulletPoints": [
        "Point clé 1",
        "Point clé 2",
        "Point clé 3"
      ]
    },
    {
      "slideNumber": 2,
      "title": "Règles & Propriétés Majeures",
      "category": "Concepts Clés",
      "bulletPoints": [
        "Point clé 1",
        "Point clé 2",
        "Point clé 3"
      ]
    },
    {
      "slideNumber": 3,
      "title": "Méthode de Résolution & Exemples",
      "category": "Application Pratique",
      "bulletPoints": [
        "Point clé 1",
        "Point clé 2",
        "Point clé 3"
      ]
    },
    {
      "slideNumber": 4,
      "title": "Erreurs Fréquentes & Synthèse",
      "category": "Récapitulatif",
      "bulletPoints": [
        "Point clé 1",
        "Point clé 2",
        "Point clé 3"
      ]
    }
  ],
  "exercises": [
    {
      "question": "Level 1 (Application directe / Facile) problem on ${params.topic}",
      "difficulty": "easy",
      "hint": "Pedagogical hint guiding the student",
      "solution": "Step-by-step complete solution with all intermediate calculations or reasoning"
    },
    {
      "question": "Level 2 (Problème intermédiaire / Moyen) problem on ${params.topic}",
      "difficulty": "medium",
      "hint": "Pedagogical hint guiding the student",
      "solution": "Step-by-step complete solution"
    },
    {
      "question": "Level 3 (Défi / Approfondissement / Avancé) problem on ${params.topic}",
      "difficulty": "hard",
      "hint": "Pedagogical hint guiding the student",
      "solution": "Step-by-step complete solution"
    }
  ],
  "quiz": [
    {
      "question": "Question 1 testing fundamental definition of ${params.topic}",
      "options": ["Plausible option A", "Plausible option B", "Plausible option C", "Plausible option D"],
      "answerIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct and why other choices are incorrect"
    },
    {
      "question": "Question 2 testing core property or formula of ${params.topic}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 1,
      "explanation": "Detailed explanation"
    },
    {
      "question": "Question 3 testing application or trap on ${params.topic}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 2,
      "explanation": "Detailed explanation"
    }
  ],
  "answerKey": "Summary of answers and scoring guidelines for teacher reference",
  "summary": "Comprehensive lesson summary (4-6 sentences) synthesizing all essential knowledge, rules, formulas, and definitions that the student must remember.",
  "finalAssessment": [
    {
      "question": "Comprehensive final mastery problem or synthesis question on ${params.topic}",
      "criteria": "Assessment criteria and points distribution (out of 20)",
      "solution": "Complete model solution and marking guide"
    }
  ],
  "teacherNotes": "Didactic advice, recommended teaching sequence, pacing guidance, and blackboard presentation tips for ${params.topic}.",
  "references": [
    "Programme Officiel ${params.curriculum} (${country})",
    "Cadre de référence pédagogique homologué"
  ]
}`;
}

function validateAndSanitizeLesson(
  raw: any,
  params: GenerateLessonParams
): Omit<GeneratedLesson, 'id' | 'createdAt' | 'createdBy'> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Le format de la réponse de l\'IA est invalide (objet JSON attendu).');
  }

  // Ensure paragraphs are valid and non-empty
  let paragraphs = Array.isArray(raw.paragraphs) ? raw.paragraphs : [];
  paragraphs = paragraphs.filter((p: any) => p && typeof p.title === 'string' && typeof p.body === 'string' && p.body.trim().length > 30);

  if (paragraphs.length < 3) {
    throw new Error(`La leçon générée est trop courte (${paragraphs.length} chapitres reçus, minimum 4 requis). Veuillez relancer la génération.`);
  }

  const country = resolveCountry(params);

  // Validate prerequisites
  const prerequisites = Array.isArray(raw.prerequisites) && raw.prerequisites.length > 0
    ? raw.prerequisites.filter((p: any) => typeof p === 'string' && p.trim())
    : [`Notions fondamentales de ${params.subject} du niveau précédent`];

  // Validate introduction
  const introduction = typeof raw.introduction === 'string' && raw.introduction.trim().length > 30
    ? raw.introduction.trim()
    : `Ce cours complet sur ${params.topic} est spécialement conçu pour les élèves de ${params.grade} dans le cadre du programme officiel (${params.curriculum}).`;

  // Validate common mistakes
  const commonMistakes = Array.isArray(raw.commonMistakes) && raw.commonMistakes.length > 0
    ? raw.commonMistakes.filter((m: any) => m && typeof m.mistake === 'string' && typeof m.correction === 'string')
    : [];

  // Validate practical applications
  const practicalApplications = Array.isArray(raw.practicalApplications) && raw.practicalApplications.length > 0
    ? raw.practicalApplications.filter((a: any) => a && typeof a.field === 'string' && typeof a.description === 'string')
    : [];

  // Validate summary
  const summary = typeof raw.summary === 'string' && raw.summary.trim().length > 30
    ? raw.summary.trim()
    : `En résumé, la maîtrise de ${params.topic} au niveau ${params.grade} repose sur la compréhension des définitions clés, l'application rigoureuse des règles et l'évitement des erreurs fréquentes.`;

  // Validate final assessment
  const finalAssessment = Array.isArray(raw.finalAssessment) && raw.finalAssessment.length > 0
    ? raw.finalAssessment.filter((f: any) => f && typeof f.question === 'string')
    : [];

  return {
    title: raw.title || `${params.subject}: ${params.topic}`,
    objective: raw.objective || `Maîtriser les compétences clés relatives à ${params.topic} pour le niveau ${params.grade}.`,
    schoolLevel: params.grade, // Requirement 2: The exact school level must come from user's actual selection
    grade: params.grade,
    country,
    curriculum: params.curriculum,
    subject: params.subject,
    language: params.language,
    difficulty: params.difficulty || 'medium',
    prerequisites,
    introduction,
    paragraphs,
    commonMistakes,
    practicalApplications,
    vocab: Array.isArray(raw.vocab) ? raw.vocab : [],
    slides: Array.isArray(raw.slides) ? raw.slides : [],
    exercises: Array.isArray(raw.exercises) ? raw.exercises : [],
    quiz: Array.isArray(raw.quiz) ? raw.quiz : [],
    answerKey: raw.answerKey || 'Voir les explications détaillées dans chaque question.',
    summary,
    finalAssessment,
    teacherNotes: raw.teacherNotes || `Conseil didactique : insister sur la rigueur conceptuelle de ${params.topic} au niveau ${params.grade}.`,
    references: Array.isArray(raw.references) && raw.references.length > 0
      ? raw.references
      : [`Programme officiel ${params.curriculum} (${country})`],
  };
}
