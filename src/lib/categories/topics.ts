export interface EditorialTopicMeta {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  introHtml: string;
  /** Database category slugs whose articles belong primarily to this intelligence desk */
  sourceCategorySlugs: string[];
  /** Keywords to prioritize matching articles when querying posts */
  keywords: string[];
  badgeColor?: string;
}

export const EXPLORE_CATEGORIES_LIST: Array<{
  slug: string;
  name: string;
  description: string;
  iconName: string;
  href: string;
}> = [
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    description: "Global frontier breakthroughs, policy shifts, and autonomous systems.",
    iconName: "BrainCircuit",
    href: "/category/artificial-intelligence",
  },
  {
    slug: "model-launches",
    name: "AI Models",
    description: "Open-weights releases, LLM benchmarks, and architecture deep dives.",
    iconName: "Cpu",
    href: "/category/model-launches",
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    description: "Multi-agent orchestration, tool calling, and agentic workflows.",
    iconName: "Bot",
    href: "/category/ai-agents",
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    description: "Training pipelines, fine-tuning mechanics, and inference scaling.",
    iconName: "Network",
    href: "/category/machine-learning",
  },
  {
    slug: "research-and-papers",
    name: "Research & Papers",
    description: "Peer-reviewed breakthroughs, preprints, and lab discoveries.",
    iconName: "BookOpen",
    href: "/category/research-and-papers",
  },
  {
    slug: "ai-tools",
    name: "AI Tools",
    description: "Developer copilots, local runtimes, and production tool evaluations.",
    iconName: "Wrench",
    href: "/category/ai-tools",
  },
  {
    slug: "startups-and-funding",
    name: "Startups & Funding",
    description: "Venture capital, sovereign labs, and emerging AI builders.",
    iconName: "Rocket",
    href: "/category/startups-and-funding",
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description: "Model security, adversarial defenses, privacy, and compliance.",
    iconName: "ShieldAlert",
    href: "/category/cybersecurity",
  },
  {
    slug: "cloud-and-computing",
    name: "Cloud & Computing",
    description: "GPU clusters, datacenter infrastructure, and sovereign compute.",
    iconName: "Server",
    href: "/category/cloud-and-computing",
  },
  {
    slug: "technology",
    name: "Technology",
    description: "Enterprise engineering, semiconductors, and deep-tech transformation.",
    iconName: "Zap",
    href: "/category/technology",
  },
];

export const VIRTUAL_TOPIC_DESKS: Record<string, EditorialTopicMeta> = {
  "artificial-intelligence": {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    shortName: "AI",
    description:
      "Comprehensive coverage of frontier artificial intelligence breakthroughs, foundation labs, policy governance, and global industry adoption.",
    introHtml:
      "<p><strong>Artificial Intelligence</strong> at Kraviona AI News tracks the foundational shifts redefining software, science, and economic infrastructure. From multimodal reasoning architectures to national compute strategies, our correspondents verify claims with technical rigor.</p>",
    sourceCategorySlugs: ["ai-news", "model-launches"],
    keywords: ["AI", "Artificial Intelligence", "DeepSeek", "OpenAI", "Claude", "LLM"],
  },
  "ai-models": {
    slug: "ai-models",
    name: "AI Models",
    shortName: "Models",
    description:
      "Hands-on evaluations, architectural breakdowns, and benchmark comparisons across frontier proprietary and open-weight AI models.",
    introHtml:
      "<p>The <strong>AI Models</strong> desk benchmarks every consequential checkpoint—from multi-head latent attention architectures to distilled edge reasoning models—measuring latency, token economics, and real-world coding fidelity.</p>",
    sourceCategorySlugs: ["model-launches", "guides-and-comparisons"],
    keywords: ["DeepSeek", "Llama", "Claude", "Mistral", "Sarvam", "model", "benchmark"],
  },
  "ai-research": {
    slug: "ai-research",
    name: "AI Research",
    shortName: "Research",
    description:
      "Deep technical analysis of arXiv papers, mechanistic interpretability, multi-dialect multimodal datasets, and reinforcement reasoning.",
    introHtml:
      "<p>Kraviona's <strong>AI Research</strong> desk translates dense academic breakthroughs—from DualPipe parallelism and Indic speech corpora to mixture-of-experts scaling laws—into clear, verifiable engineering intelligence.</p>",
    sourceCategorySlugs: ["model-launches", "guides-and-comparisons", "ai-news"],
    keywords: ["architecture", "DeepMind", "Vaani", "research", "DualPipe", "reasoning", "LLM"],
  },
  "research-and-papers": {
    slug: "research-and-papers",
    name: "Research & Papers",
    shortName: "Research & Papers",
    description:
      "Curated breakthroughs from leading AI laboratories, open-science benchmarks, and foundational research papers.",
    introHtml:
      "<p><strong>Research &amp; Papers</strong> examines pivotal preprints and lab publications, highlighting reproducibility, training efficiency, and architectural innovations shaping the next wave of AI systems.</p>",
    sourceCategorySlugs: ["model-launches", "guides-and-comparisons"],
    keywords: ["architecture", "benchmark", "DeepMind", "Vaani", "BharatGen", "LLM"],
  },
  "ai-agents": {
    slug: "ai-agents",
    name: "AI Agents",
    shortName: "Agents",
    description:
      "Autonomous tool use, computer-use APIs, coding agents, and multi-step enterprise orchestration frameworks.",
    introHtml:
      "<p><strong>AI Agents</strong> covers the transition from single-turn chatbots to autonomous execution—analyzing computer-use APIs, coding assistants, tool-calling reliability, and production guardrails.</p>",
    sourceCategorySlugs: ["ai-tools", "model-launches", "enterprise-ai"],
    keywords: ["agent", "Computer Use", "coding", "Vibe Coding", "tools", "Claude"],
  },
  "machine-learning": {
    slug: "machine-learning",
    name: "Machine Learning",
    shortName: "ML",
    description:
      "Core machine learning engineering: quantization, local inference, retrieval-augmented generation, and distributed training.",
    introHtml:
      "<p><strong>Machine Learning</strong> focuses on applied ML systems engineering: retrieval chunking, vector databases, open-weight fine-tuning, and running frontier models locally on consumer and cluster hardware.</p>",
    sourceCategorySlugs: ["guides-and-comparisons", "model-launches", "ai-tools"],
    keywords: ["RAG", "Ollama", "LLM", "Prompt", "VRAM", "chunking", "70B"],
  },
  "startups": {
    slug: "startups",
    name: "Startups",
    shortName: "Startups",
    description:
      "Emerging AI labs, venture funding rounds, sovereign startups, and developer-first companies reshaping global markets.",
    introHtml:
      "<p><strong>Startups</strong> follows founders building sovereign AI infrastructure, foundational regional models, and vertical intelligence products across India and international venture hubs.</p>",
    sourceCategorySlugs: ["india-ai", "ai-news", "enterprise-ai"],
    keywords: ["Sarvam", "Krutrim", "startups", "India", "OpenAI", "Reliance"],
  },
  "startups-and-funding": {
    slug: "startups-and-funding",
    name: "Startups & Funding",
    shortName: "Startups & Funding",
    description:
      "Capital flows, sovereign compute tenders, strategic partnerships, and high-growth AI startups.",
    introHtml:
      "<p><strong>Startups &amp; Funding</strong> tracks venture investment, compute infrastructure partnerships, and founder ecosystems driving the commercialization of artificial intelligence.</p>",
    sourceCategorySlugs: ["india-ai", "ai-news", "enterprise-ai"],
    keywords: ["startups", "Sarvam", "Krutrim", "tender", "partner", "adoption"],
  },
  "cybersecurity": {
    slug: "cybersecurity",
    name: "Cybersecurity",
    shortName: "Cybersecurity",
    description:
      "Private LLM deployments, enterprise data governance, banking AI compliance, and resilient digital infrastructure.",
    introHtml:
      "<p><strong>Cybersecurity</strong> investigates enterprise AI governance, air-gapped private deployments in BFSI and regulated industries, prompt injection defenses, and sovereign data protection.</p>",
    sourceCategorySlugs: ["enterprise-ai", "ai-news"],
    keywords: ["Enterprise", "private", "BFSI", "sovereign", "RAG", "security", "India"],
  },
  "cloud-and-computing": {
    slug: "cloud-and-computing",
    name: "Cloud & Computing",
    shortName: "Cloud & Computing",
    description:
      "Hyperscale GPU deployments, gigawatt datacenters, bare-metal H100 clusters, and national compute infrastructure.",
    introHtml:
      "<p><strong>Cloud &amp; Computing</strong> covers the physical layer of AI: semiconductor roadmaps, bare-metal H100 cloud availability, gigawatt datacenter builds, and national GPU clusters.</p>",
    sourceCategorySlugs: ["india-ai", "ai-news", "enterprise-ai"],
    keywords: ["GPU", "Nvidia", "H100", "datacenter", "Cloud", "supercomputing", "Krutrim"],
  },
  "technology": {
    slug: "technology",
    name: "Technology",
    shortName: "Technology",
    description:
      "Strategic technology reporting across enterprise software, semiconductors, developer ecosystems, and digital infrastructure.",
    introHtml:
      "<p><strong>Technology</strong> connects frontier artificial intelligence with the broader transformation across enterprise IT, cloud architecture, developer tooling, and global hardware supply chains.</p>",
    sourceCategorySlugs: ["enterprise-ai", "ai-tools", "ai-news"],
    keywords: ["technology", "engineering", "enterprise", "developers", "datacenter", "IT"],
  },
};
