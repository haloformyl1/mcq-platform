/**
 * PIECHEM AI Subject Gate & Semantic Scope Classifier
 * 
 * Strict enforcement layer restricting queries exclusively to:
 * - Physics
 * - Chemistry
 * - Mathematics
 * - Biology
 * (Including multi-STEM queries combining these domains)
 */

export type AllowedSubject = 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'multi_stem';

export interface SubjectGateResult {
  allowed: boolean;
  subject: AllowedSubject | 'out_of_scope' | 'greeting' | 'farewell';
  matchedSubjects: AllowedSubject[];
  reason?: string;
  isGreeting?: boolean;
  isFarewell?: boolean;
  scopeMessageEn: string;
  scopeMessageBn: string;
}

export const SCOPE_MESSAGE_EN = 
  "PIECHEM AI is focused exclusively on Physics, Chemistry, Mathematics, and Biology. Ask me a question from one of these subjects and I'll help you.";

export const SCOPE_MESSAGE_BN = 
  "PIECHEM AI শুধুমাত্র পদার্থবিদ্যা (Physics), রসায়ন (Chemistry), গণিত (Mathematics) এবং জীববিদ্যা (Biology)-র জন্য নিবেদিত। অনুগ্রহ করে এই বিষয়গুলোর যেকোনো একটি থেকে প্রশ্ন করুন, আমি সাহায্য করব।";

// Prompt injection / jailbreak patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?(instructions|rules|restrictions|prompts)/i,
  /forget\s+(all\s+)?(previous\s+)?(instructions|rules|restrictions|subjects)/i,
  /disregard\s+(all\s+)?(instructions|rules|restrictions)/i,
  /you\s+are\s+now\s+(an?\s+)?(unrestricted|general|any|dan|jailbreak)/i,
  /system\s+override/i,
  /act\s+as\s+(a\s+)?(general\s+ai|unrestricted|chatgpt|dan|anything)/i,
  /pretend\s+(you\s+have\s+no\s+rules|you\s+are\s+unrestricted)/i,
  /bypass\s+(scope|filter|restriction|safety)/i
];

// Explicit non-STEM topics that must be rejected immediately
const EXPLICIT_OUT_OF_SCOPE_PATTERNS = [
  // Creative / personal writing
  /write\s+(me\s+)?(a\s+)?(poem|birthday\s+message|love\s+letter|wedding\s+toast|story|song|rap|script|novel|dating\s+bio)/i,
  // Entertainment & media
  /(who\s+won|score\s+of|ipl|fifa|world\s+cup|cricket\s+match|football\s+match|nba|messi|ronaldo|virat\s+kohli)/i,
  /(movie|film|tv\s+show|actor|actress|bollywood|hollywood|netflix|anime|celebrity\s+gossip)/i,
  // Cooking & recipes
  /(recipe|how\s+to\s+cook|bake\s+a\s+cake|make\s+pizza|cocktail|ingredients\s+for\s+(curry|pasta|soup))/i,
  // Financial & investment
  /(stock\s+market|investment\s+advice|crypto|bitcoin|trading\s+strategy|mutual\s+fund|real\s+estate\s+investing)/i,
  // Weather & travel
  /(what('s|\s+is)\s+the\s+weather|forecast\s+for|plan\s+(a\s+)?(vacation|trip|itinerary)|best\s+hotels\s+in)/i,
  // Non-STEM programming / web dev
  /(build\s+a\s+website|react\s+component\s+for|css\s+animation\s+for\s+button|javascript\s+express\s+app|django\s+rest|html\s+landing\s+page)/i,
  // Politics, horoscope, casual advice
  /(political\s+party|who\s+should\s+i\s+vote\s+for|prime\s+minister\s+election|president\s+of|horoscope|zodiac|tarot)/i,
  /(tell\s+me\s+a\s+joke|make\s+me\s+laugh|riddle\s+me\s+this)/i
];

// High-confidence STEM domain vocabularies
const STEM_KEYWORDS = {
  physics: [
    'physics', 'newton', 'force', 'acceleration', 'velocity', 'momentum', 'friction', 'gravity',
    'gravitation', 'projectile', 'kinematics', 'dynamics', 'torque', 'angular', 'inertia',
    'work', 'energy', 'power', 'conservation', 'collision', 'fluid', 'viscosity', 'surface tension',
    'bernoulli', 'thermodynamics', 'carnot', 'entropy', 'enthalpy', 'isothermal', 'adiabatic',
    'oscillation', 'shm', 'pendulum', 'wave', 'doppler', 'frequency', 'wavelength', 'sound',
    'electrostatics', 'coulomb', 'electric field', 'potential', 'capacitance', 'capacitor',
    'current', 'ohm', 'kirchhoff', 'resistor', 'circuit', 'potentiometer', 'wheatstone',
    'magnetic', 'biot savart', 'ampere', 'lorentz', 'solenoid', 'galvanometer',
    'induction', 'faraday', 'lenz', 'eddy', 'alternating current', 'impedance', 'transformer',
    'electromagnetic', 'maxwell', 'optics', 'reflection', 'refraction', 'snell', 'lens', 'mirror',
    'prism', 'dispersion', 'interference', 'diffraction', 'polarization', 'young double slit',
    'photoelectric', 'photon', 'de broglie', 'bohr model', 'atomic spectra', 'nucleus', 'radioactivity',
    'half life', 'fission', 'fusion', 'semiconductor', 'diode', 'transistor', 'logic gate',
    'vector', 'dimension', 'kinematic', 'free body', 'centripetal', 'lens formula', 'mirror formula'
  ],
  chemistry: [
    'chemistry', 'chemical', 'molecule', 'atom', 'element', 'compound', 'reaction', 'reactant',
    'product', 'mechanism', 'sn1', 'sn2', 'e1', 'e2', 'electrophile', 'nucleophile',
    'chirality', 'stereochemistry', 'enantiomer', 'diastereomer', 'isomer', 'isomerism',
    'hybridization', 'vsepr', 'orbital', 'quantum number', 'pauli', 'hund', 'aufbau',
    'periodic table', 'ionization energy', 'electronegativity', 'electron affinity', 'atomic radius',
    'chemical bond', 'covalent', 'ionic', 'hydrogen bond', 'lattice energy', 'resonance',
    'thermodynamics', 'enthalpy', 'entropy', 'gibbs', 'spontaneous', 'equilibrium',
    'le chatelier', 'ph', 'poh', 'buffer', 'henderson', 'solubility product', 'ksp',
    'acid', 'base', 'titration', 'redox', 'oxidation', 'reduction', 'electrochemistry',
    'nernst', 'galvanic', 'electrolytic', 'faraday law', 'conductance', 'kinetics',
    'rate law', 'arrhenius', 'activation energy', 'catalyst', 'order of reaction',
    'organic chemistry', 'alkane', 'alkene', 'alkyne', 'aromatic', 'benzene', 'haloalkane',
    'alcohol', 'phenol', 'ether', 'aldehyde', 'ketone', 'carboxylic', 'ester', 'amine',
    'polymer', 'carbohydrate', 'glucose', 'coordination', 'ligand', 'crystal field',
    'metallurgy', 's-block', 'p-block', 'd-block', 'f-block', 'colligative', 'raoult'
  ],
  mathematics: [
    'mathematics', 'math', 'maths', 'algebra', 'calculus', 'geometry', 'trigonometry',
    'integral', 'integration', 'integrate', 'derivative', 'differentiation', 'differentiate',
    'limit', 'continuity', 'differentiable', 'function', 'equation', 'quadratic', 'polynomial',
    'inequality', 'matrix', 'matrices', 'determinant', 'vector', 'dot product', 'cross product',
    'probability', 'bayes', 'permutation', 'combination', 'binomial', 'sequence', 'series',
    'arithmetic progression', 'geometric progression', 'ap', 'gp', 'complex number', 'argand',
    'sine', 'cosine', 'tangent', 'trig', 'straight line', 'circle', 'parabola', 'ellipse',
    'hyperbola', 'conic section', 'differential equation', 'area under curve', 'maxima', 'minima',
    'tangent and normal', 'integration by parts', 'partial fraction', 'substitution',
    'definite integral', 'indefinite integral', 'statistics', 'mean', 'median', 'variance',
    'standard deviation', 'logarithm', 'exponential', 'theorem', 'proof', 'solve for x',
    'dx', 'dy/dx', 'formula', 'evaluate', 'derive'
  ],
  biology: [
    'biology', 'cell', 'organelle', 'mitochondria', 'chloroplast', 'nucleus', 'ribosome',
    'mitosis', 'meiosis', 'cell division', 'cell cycle', 'dna', 'rna', 'replication',
    'transcription', 'translation', 'genetic code', 'mutation', 'genetics', 'mendel',
    'inheritance', 'chromosome', 'allele', 'genotype', 'phenotype', 'dominant', 'recessive',
    'photosynthesis', 'calvin cycle', 'chlorophyll', 'cellular respiration', 'glycolysis',
    'krebs cycle', 'atp', 'electron transport', 'enzyme', 'substrate', 'protein', 'lipid',
    'carbohydrate', 'metabolism', 'physiology', 'digestion', 'enzyme', 'circulatory', 'heart',
    'blood', 'hemoglobin', 'respiration', 'lungs', 'excretion', 'kidney', 'nephron', 'neuron',
    'nervous system', 'synapse', 'endocrine', 'hormone', 'insulin', 'reproduction', 'gamete',
    'fertilization', 'embryo', 'plant physiology', 'transpiration', 'xylem', 'phloem',
    'ecology', 'ecosystem', 'food web', 'biodiversity', 'evolution', 'natural selection',
    'darwin', 'microbiology', 'bacteria', 'virus', 'immunity', 'antibody', 'antigen', 'vaccine'
  ]
};

// Common Bengali STEM terms
const BENGALI_STEM_TERMS = {
  physics: ['পদার্থবিদ্যা', 'গতিবিদ্যা', 'নিউটনের গতিসূত্র', 'ত্বরণ', 'বেগ', 'ভরবেগ', 'মহাকর্ষ', 'বল', 'শক্তি', 'কার্য', 'তড়িৎ', 'তড়িৎচুম্বকীয়', 'আলো', 'প্রতিসরণ', 'প্রতিফলন', 'লেন্স', 'শব্দ', 'তরঙ্গ', 'তাপগতিবিদ্যা'],
  chemistry: ['রসায়ন', 'পরমাণু', 'অণু', 'যৌগ', 'বিক্রিয়া', 'জারণ', 'বিজারণ', 'অম্ল', 'ক্ষার', 'এসিড', 'ক্ষারক', 'কাইরালিটি', 'আইসোমারিজম', 'হাইব্রিডাইজেশন', 'তড়িৎরসায়ন', 'দ্রবণ', 'রাসায়নিক গতিবিদ্যা', 'জৈব রসায়ন'],
  mathematics: ['গণিত', 'বীজগণিত', 'পাটিগণিত', 'ক্যালকুলাস', 'সমাকলন', 'অন্তরকলন', 'অবকলন', 'সমীকরণ', 'দ্বিঘাত সমীকরণ', 'ত্রিকোণমিতি', 'জ্যামিতি', 'ম্যাট্রিক্স', 'নির্ণায়ক', 'সম্ভাবনা', 'বিন্যাস', 'সমাবেশ'],
  biology: ['জীববিদ্যা', 'কোষ', 'মাইটোকনড্রিয়া', 'ডিএনএ', 'আরএনএ', 'মাইটোসিস', 'মিয়োসিস', 'জিনতত্ত্ব', 'বংশগতি', 'সালোকসংশ্লেষ', 'শ্বসন', 'হরমোন', 'উৎসেচক', 'স্নায়ুতন্ত্র', 'বাস্তুতন্ত্র', 'বিবর্তন']
};

/**
 * Classifies a student's prompt into Physics, Chemistry, Mathematics, Biology,
 * or marks it as out_of_scope.
 */
export function classifySubjectScope(prompt: string): SubjectGateResult {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Check prompt injection / jailbreak attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        allowed: false,
        subject: 'out_of_scope',
        matchedSubjects: [],
        reason: 'Prompt injection detected. Scope is locked to Physics, Chemistry, Mathematics, and Biology.',
        scopeMessageEn: SCOPE_MESSAGE_EN,
        scopeMessageBn: SCOPE_MESSAGE_BN
      };
    }
  }

  // 2. Greetings and farewells (allowed for polite human-like tutoring)
  const greetingRegex = /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|who\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+your\s+name|help(\s+me)?)[!.]*$/i;
  if (greetingRegex.test(lower) || lower === 'hi there' || lower === 'hello there') {
    return {
      allowed: true,
      subject: 'greeting',
      matchedSubjects: [],
      isGreeting: true,
      scopeMessageEn: SCOPE_MESSAGE_EN,
      scopeMessageBn: SCOPE_MESSAGE_BN
    };
  }

  const farewellRegex = /^(goodbye|bye|see\s+you|farewell|take\s+care|thanks|thank\s+you)[!.]*$/i;
  if (farewellRegex.test(lower)) {
    return {
      allowed: true,
      subject: 'farewell',
      matchedSubjects: [],
      isFarewell: true,
      scopeMessageEn: SCOPE_MESSAGE_EN,
      scopeMessageBn: SCOPE_MESSAGE_BN
    };
  }

  // 3. Explicit non-STEM requests -> Immediate rejection without Gemini
  for (const pattern of EXPLICIT_OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        allowed: false,
        subject: 'out_of_scope',
        matchedSubjects: [],
        reason: 'Query is outside the four STEM domains.',
        scopeMessageEn: SCOPE_MESSAGE_EN,
        scopeMessageBn: SCOPE_MESSAGE_BN
      };
    }
  }

  // 4. Mathematical formula / equation patterns ($...$, f(x), dy/dx, integral signs, balanced chemistry reactions)
  const isMathFormula = 
    /(\d+x|\b[xyz]\s*[\+\-\*\/=]|\bdy\/dx\b|\b\d+\s*[\+\-\*\/]\s*\d+|\bsin\b|\bcos\b|\btan\b|\blog\b|\bln\b|\b[a-z]\^2|\b\^|[\u222B\u2211\u221A\u03C0\u03B8\u03BB\u03B1\u03B2\u0394\u2192\u21CC])/.test(lower) ||
    /(\b[A-Z][a-z]?\d*\s*(\+|\->|\-\-\>|\=)\s*[A-Z][a-z]?\d*)/.test(p);

  // 5. Calculate keyword matches across each subject
  const matches: Record<AllowedSubject, number> = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    biology: 0,
    multi_stem: 0
  };

  for (const kw of STEM_KEYWORDS.physics) {
    if (lower.includes(kw)) matches.physics += 1;
  }
  for (const kw of STEM_KEYWORDS.chemistry) {
    if (lower.includes(kw)) matches.chemistry += 1;
  }
  for (const kw of STEM_KEYWORDS.mathematics) {
    if (lower.includes(kw)) matches.mathematics += 1;
  }
  for (const kw of STEM_KEYWORDS.biology) {
    if (lower.includes(kw)) matches.biology += 1;
  }

  // Check Bengali STEM keywords
  for (const kw of BENGALI_STEM_TERMS.physics) {
    if (p.includes(kw)) matches.physics += 2;
  }
  for (const kw of BENGALI_STEM_TERMS.chemistry) {
    if (p.includes(kw)) matches.chemistry += 2;
  }
  for (const kw of BENGALI_STEM_TERMS.mathematics) {
    if (p.includes(kw)) matches.mathematics += 2;
  }
  for (const kw of BENGALI_STEM_TERMS.biology) {
    if (p.includes(kw)) matches.biology += 2;
  }

  if (isMathFormula) {
    matches.mathematics += 2;
  }

  const detectedSubjects = (['physics', 'chemistry', 'mathematics', 'biology'] as AllowedSubject[])
    .filter(s => matches[s] > 0);

  // If matches detected in 2 or more subjects, it is a multi-STEM query
  if (detectedSubjects.length >= 2) {
    return {
      allowed: true,
      subject: 'multi_stem',
      matchedSubjects: detectedSubjects,
      scopeMessageEn: SCOPE_MESSAGE_EN,
      scopeMessageBn: SCOPE_MESSAGE_BN
    };
  }

  // If single subject has clear matches
  if (detectedSubjects.length === 1) {
    return {
      allowed: true,
      subject: detectedSubjects[0],
      matchedSubjects: detectedSubjects,
      scopeMessageEn: SCOPE_MESSAGE_EN,
      scopeMessageBn: SCOPE_MESSAGE_BN
    };
  }

  // 6. Generic academic inquiry check (e.g. "What is an experiment?", "Define hypothesis", "Explain error analysis")
  const genericStemTerms = [
    'hypothesis', 'experiment', 'observation', 'variable', 'scientific method',
    'measurement', 'si unit', 'dimension', 'error analysis', 'constant', 'derivation',
    'formula', 'numerical', 'diagram', 'graph', 'slope', 'practice question', 'quiz me',
    'study plan', 'revision'
  ];
  if (genericStemTerms.some(term => lower.includes(term))) {
    return {
      allowed: true,
      subject: 'multi_stem',
      matchedSubjects: ['physics', 'chemistry', 'mathematics', 'biology'],
      scopeMessageEn: SCOPE_MESSAGE_EN,
      scopeMessageBn: SCOPE_MESSAGE_BN
    };
  }

  // 7. If prompt is too brief or ambiguous (e.g. "what is a model?", "explain this")
  const academicQueryStarters = /^(what\s+is|explain|how\s+does|solve|derive|calculate|define|compare|differentiate|prove|find\s+the|why\s+does)\b/i;
  if (academicQueryStarters.test(lower) && p.length < 80) {
    const words = lower.replace(/[?!.]/g, '').split(/\s+/);
    const nonStemTokens = ['weather', 'president', 'movie', 'song', 'joke', 'girlfriend', 'boyfriend', 'dinner', 'cake', 'vacation', 'flight'];
    if (!words.some(w => nonStemTokens.includes(w))) {
      return {
        allowed: true,
        subject: 'multi_stem',
        matchedSubjects: ['physics', 'chemistry', 'mathematics', 'biology'],
        scopeMessageEn: SCOPE_MESSAGE_EN,
        scopeMessageBn: SCOPE_MESSAGE_BN
      };
    }
  }

  // Query has no STEM matches and is out of scope
  return {
    allowed: false,
    subject: 'out_of_scope',
    matchedSubjects: [],
    reason: 'Query is not academically related to Physics, Chemistry, Mathematics, or Biology.',
    scopeMessageEn: SCOPE_MESSAGE_EN,
    scopeMessageBn: SCOPE_MESSAGE_BN
  };
}
