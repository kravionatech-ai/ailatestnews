/**
 * AI Latest News - Comprehensive 100% English Seed Script
 *
 * Populates database with:
 * 1. Admin & Editorial Team Authors
 * 2. 6 English Categories with rich 120-150 word SEO Hub Intros, Colors & FAQs
 * 3. Topic Tags for Models and Entities
 * 4. 20 High-Quality Published AI News, Tools, and Benchmark Articles
 * 5. Active Newsletter Subscribers
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Category, Tag, Post, Subscriber } from "../src/lib/db/models";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ailatestnews-dev";

async function seed() {
  console.log("🌱 Starting AI Latest News Seed Process (100% English)...");
  console.log(`📡 Connecting to: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear collections
    console.log("🧹 Purging old collections...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Tag.deleteMany({}),
      Post.deleteMany({}),
      Subscriber.deleteMany({}),
    ]);

    const passwordHash = await bcrypt.hash("Admin123!", 12);

    // ── Create Admin User ──
    console.log("👤 Creating Admin user...");
    const adminUser = await User.create({
      name: "Site Administrator",
      slug: "site-administrator",
      email: "kravionatech@gmail.com",
      passwordHash,
      role: "admin",
      bio: "Chief Editor and Systems Architect at AI Latest News.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      socialLinks: {
        twitter: "https://twitter.com/kraviona",
        linkedin: "https://linkedin.com/company/kraviona",
      },
      isActive: true,
      emailVerified: new Date(),
    });

    // ── Create Editorial Team ──
    console.log("👥 Creating AI Latest News Editorial Team author...");
    const editorialTeam = await User.create({
      name: "AI Latest News Editorial Team",
      slug: "ai-latest-news-editorial-team",
      email: "kravionatech@gmail.com",
      passwordHash,
      role: "editor",
      bio: "Dedicated team of AI researchers, benchmark evaluators, and technology journalists in Bengaluru, Hyderabad, and Delhi.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      socialLinks: {
        twitter: "https://twitter.com/kraviona",
        linkedin: "https://linkedin.com/company/kraviona",
      },
      isActive: true,
      emailVerified: new Date(),
    });

    // ── Create 6 English-Only Categories with Rich Hub Intros and FAQs ──
    console.log("📂 Creating categories with rich SEO intros & FAQs...");
    const categories = await Category.insertMany([
      {
        name: "AI News",
        slug: "ai-news",
        description: "Breaking global and Indian AI developments, policy updates, and industry moves.",
        introHtml: `<p>Welcome to <strong>AI News</strong> on AI Latest News. We deliver daily, verified reporting on foundation model releases, global frontier lab announcements, Indian regulatory shifts, and high-stakes venture capital deployments. Every dispatch is written with technical rigor, verifying architectural claims and examining direct implications for Indian developers and enterprise decision-makers.</p>`,
        color: "#4f46e5",
        order: 1,
        faqs: [
          {
            question: "How does AI Latest News verify breaking AI news?",
            answer: "Our editorial desk cross-checks model repository commits, arXiv research papers, official corporate engineering posts, and independent compute reproduction tests before publishing.",
          },
          {
            question: "Are Indian AI policy updates covered in this section?",
            answer: "Yes. We track MeitY directives, IndiaAI compute tender awards, DPDP Act compliance guidelines, and state-level AI sandbox policies.",
          },
          {
            question: "How can startups submit press releases and tip-offs?",
            answer: "Founders and PR teams can email news tips to editorial@kraviona.com with benchmark data, whitepapers, or demo credentials for evaluation.",
          },
        ],
      },
      {
        name: "Model Launches",
        slug: "model-launches",
        description: "Frontier foundation models, open weights releases, architecture papers, and benchmarks.",
        introHtml: `<p>The <strong>Model Launches</strong> hub tracks frontier artificial intelligence weights from OpenAI, Anthropic, Google DeepMind, Meta, Mistral, and DeepSeek. We report beyond marketing claims, evaluating context window retention, token throughput, quantization overhead, and real-world reasoning scores across standardized technical benchmarks.</p>`,
        color: "#059669",
        order: 2,
        faqs: [
          {
            question: "Which model benchmarks are prioritized on this platform?",
            answer: "We evaluate models on MMLU-Pro, HumanEval coding, MATH reasoning, token generation latency (tok/sec), and Indic regional language comprehension.",
          },
          {
            question: "Do you cover both open weights and proprietary API models?",
            answer: "Yes. We cover closed APIs (like Claude 3.5 Sonnet and GPT-4o) alongside open weights (like Llama 3.3, DeepSeek-R1, and Mistral) with self-hosting guidance.",
          },
        ],
      },
      {
        name: "AI Tools",
        slug: "ai-tools",
        description: "Generative developer tooling, IDE coding assistants, autonomous agents, and local LLM stacks.",
        introHtml: `<p>The <strong>AI Tools</strong> directory reviews the software stack transforming software engineering and productivity. From agentic coding IDEs like Cursor and Windsurf to local inference engines like Ollama and vLLM, we stress-test tool latency, IDE integration, memory footprint, and monthly subscription economics.</p>`,
        color: "#0284c7",
        order: 3,
        faqs: [
          {
            question: "Are the featured AI tools vetted for privacy and code security?",
            answer: "Yes. Every review examines zero-data retention (ZDR) toggles, local-first options, telemetry policies, and enterprise SOC-2 compliance.",
          },
          {
            question: "Which coding assistants are evaluated for Indian developers?",
            answer: "We test Cursor AI, GitHub Copilot, Claude Code, Windsurf, Continue.dev, and local deepseek-coder setups on real-world web and backend stacks.",
          },
        ],
      },
      {
        name: "India AI",
        slug: "india-ai",
        description: "IndiaAI Mission, sovereign compute infrastructure, BharatGPT, Sarvam AI, and Indic NLP innovation.",
        introHtml: `<p>The <strong>India AI</strong> portal is the dedicated home for India's sovereign artificial intelligence revolution. We cover the ₹10,372 crore IndiaAI Mission, public-private datacenter GPU allocations, foundational Indic models from Sarvam AI, Krutrim, and IIT Bombay's BharatGPT, and indigenous vernacular voice interfaces.</p>`,
        color: "#d97706",
        order: 4,
        faqs: [
          {
            question: "What is the IndiaAI Mission GPU allocation process?",
            answer: "The government allocates subsidized access to 10,000+ Nvidia GPUs through empanelled cloud providers for qualified Indian startups and academic researchers.",
          },
          {
            question: "How do Indic models compare to global foundation models?",
            answer: "Indic models like Sarvam-1 and Hanooman excel in tokenization efficiency and phoneme alignment for Hindi, Tamil, Telugu, and other regional languages at a fraction of the token cost.",
          },
        ],
      },
      {
        name: "Guides and Comparisons",
        slug: "guides-and-comparisons",
        description: "Head-to-head model shootouts, practical fine-tuning tutorials, and unbiased buying guides.",
        introHtml: `<p>Our <strong>Guides and Comparisons</strong> break down complex architectural choices into practical, data-backed buying guides. Whether deciding between subscription tiers, optimizing prompt context caches, or fine-tuning LoRA adapters on modest GPUs, our tutorials provide copy-pasteable configurations and cost-per-token math.</p>`,
        color: "#7c3aed",
        order: 5,
        faqs: [
          {
            question: "Are comparisons sponsored by model providers?",
            answer: "Never. All benchmarks and subscription comparisons are conducted independently using paid commercial accounts without vendor sponsorship.",
          },
          {
            question: "Do guides include Indian Rupee (INR) cost calculations?",
            answer: "Yes. All price comparisons factor in 18% Indian GST, international credit card markup fees, and local cloud instance rates.",
          },
        ],
      },
      {
        name: "Enterprise AI",
        slug: "enterprise-ai",
        description: "Enterprise generative AI adoption, banking architectures, data governance, and corporate AI workflows.",
        introHtml: `<p>The <strong>Enterprise AI</strong> hub addresses corporate CTOs, VPs of Engineering, and compliance heads navigating production generative AI. We report on on-premise RAG architectures, role-based access control (RBAC), token budget management, and AI risk governance across Indian BFSI, healthcare, and IT service providers.</p>`,
        color: "#2563eb",
        order: 6,
        faqs: [
          {
            question: "What compliance standards are relevant for Indian enterprise AI?",
            answer: "Key standards include RBI cybersecurity directives for banking AI, the Digital Personal Data Protection (DPDP) Act 2023, and ISO/IEC 42001.",
          },
          {
            question: "How do enterprises balance cloud APIs with self-hosted LLMs?",
            answer: "Most Indian enterprises adopt hybrid architectures: public frontier models for reasoning, combined with air-gapped private models for sensitive customer data.",
          },
        ],
      },
    ]);

    // ── Create Tags ──
    console.log("🏷️  Creating tags...");
    const tags = await Tag.insertMany([
      { name: "DeepSeek", slug: "deepseek", description: "DeepSeek AI open weights, reasoning models, and cost-efficient architecture." },
      { name: "Sarvam AI", slug: "sarvam-ai", description: "Indigenous Indian foundation models and vernacular voice intelligence." },
      { name: "Krutrim", slug: "krutrim", description: "Ola Krutrim cloud infrastructure and Indic foundational models." },
      { name: "BharatGPT", slug: "bharatgpt", description: "Consortium AI initiative by IIT Bombay and Indian tech conglomerates." },
      { name: "Llama 3.3", slug: "llama-3-3", description: "Meta open weights foundation models and community fine-tunes." },
      { name: "Indic NLP", slug: "indic-nlp", description: "Tokenization, phonetics, and datasets across 22 scheduled Indian languages." },
      { name: "Claude 3.5", slug: "claude-3-5", description: "Anthropic Claude reasoning models, Artifacts, and agentic coding tools." },
      { name: "ChatGPT", slug: "chatgpt", description: "OpenAI GPT-4o, reasoning models, and developer platform APIs." },
      { name: "Gemini", slug: "gemini", description: "Google DeepMind multimodal 2M token foundation models." },
      { name: "Open Weights", slug: "open-weights", description: "Locally downloadable, permissive model weights for self-hosting." },
      { name: "IndiaAI Mission", slug: "india-ai-mission", description: "Government sovereign compute and foundational model initiative." },
      { name: "Enterprise AI", slug: "enterprise-ai", description: "Corporate deployment, compliance, and enterprise RAG systems." },
      { name: "Ollama", slug: "ollama", description: "Local LLM inference runner for macOS, Linux, and Windows." },
      { name: "Prompt Engineering", slug: "prompt-engineering", description: "Structured prompting, few-shot examples, and chain-of-thought methods." },
    ]);

    const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));
    const tagMap = Object.fromEntries(tags.map((t) => [t.slug, t._id]));

    // ── 20 High-Quality Published Seed Articles (100% English) ──
    console.log("📝 Creating 20 rich published AI articles...");
    const postsData = [
      // 1. AI News
      {
        title: "DeepSeek-R1 Disrupts Global AI Economics: Silicon Valley and Indian Startups React",
        slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
        excerpt:
          "DeepSeek's release of open-weights reasoning model R1 has sent shockwaves across global tech markets, offering o1-level chain-of-thought at 95% lower API cost.",
        contentHtml: `
          <h2>A Tectonic Shift in Foundation Model Economics</h2>
          <p>When DeepSeek open-sourced DeepSeek-R1 along with its training recipe and distillation weights, it shattered the long-held Silicon Valley narrative that competitive frontier reasoning requires billions of dollars in training clusters.</p>
          <h2>The Implications for Indian SaaS and AI Startups</h2>
          <p>For Indian developers building on tight cloud budgets, DeepSeek-R1 changes everything. At $0.55 per million input tokens, startups in Bengaluru and Hyderabad can now run complex agentic reasoning loops that previously cost thousands of dollars on proprietary APIs.</p>
          <h2>Self-Hosting on Indian Cloud Datacenters</h2>
          <p>Indian cloud providers including Yotta and E2E Networks have already rolled out one-click vLLM deployment templates for DeepSeek-R1 671B and distilled 70B variants, providing sovereign compliance without routing queries through US servers.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-news"],
        tags: [tagMap["deepseek"], tagMap["open-weights"]],
        status: "published",
        featured: true,
        views: 3450,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 2),
        coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "DeepSeek-R1 Disrupts Global AI Economics | AI Latest News",
          metaDescription: "DeepSeek open-weights R1 model matches o1 reasoning at 95% lower cost. What it means for Silicon Valley and Indian startups.",
          focusKeyword: "DeepSeek R1 AI economics",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "India to Deploy 10,000 GPUs Under National AI Mission: Tender Allocations Finalized",
        slug: "india-10000-gpus-national-ai-mission-tender",
        excerpt:
          "Government finalizes public-private partnership tenders with CtrlS, Yotta, and Tata Communications to provide sovereign compute access for domestic AI companies.",
        contentHtml: `
          <h2>Sovereign Supercomputing Tenders Finalized</h2>
          <p>The Ministry of Electronics and IT (MeitY) has officially completed vendor empanelment for hosting 10,000 enterprise-grade Nvidia H100 and B200 GPUs across Indian datacenter facilities.</p>
          <h2>Subsidized Cloud Pricing for Startups</h2>
          <p>Under the approved subsidy formula, vetted Indian startups and research institutions will be eligible for compute access at an estimated 40% discount compared to global commercial public cloud tariffs.</p>
          <h2>Supporting Indigenous Foundational Models</h2>
          <p>The compute cluster will directly accelerate development of sovereign Indic models, ensuring indigenous research labs can train 70B+ parameter models on domestic soil.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-news"],
        tags: [tagMap["india-ai-mission"]],
        status: "published",
        featured: false,
        views: 2890,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 3600000 * 18),
        coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "India Deploys 10,000 GPUs for National AI Mission",
          metaDescription: "MeitY finalizes partner tenders for 10,000 sovereign GPUs. Read how Indian AI startups can access subsidized compute.",
          focusKeyword: "India 10000 GPUs AI Mission",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "OpenAI Expands India Footprint: Lower API Pricing and Dedicated Indic Dataset Partnerships",
        slug: "openai-expands-india-footprint-pricing-partnerships",
        excerpt:
          "OpenAI announces direct INR billing, local datacenter routing via Azure India Central, and collaborative academic partnerships to improve Hindi and Tamil tokenization.",
        contentHtml: `
          <h2>Direct INR Billing & GST Compliance</h2>
          <p>In response to soaring developer demand, OpenAI has launched direct Indian Rupee (INR) invoicing, simplifying corporate tax compliance and input tax credits for Indian agencies and enterprises.</p>
          <h2>Indic Tokenization Research Initiatives</h2>
          <p>OpenAI is collaborating with Indian universities to address tokenization bloat in regional languages, aiming to reduce the token cost of Hindi, Tamil, and Bengali by up to 50% in future models.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-news"],
        tags: [tagMap["chatgpt"], tagMap["indic-nlp"]],
        status: "published",
        featured: false,
        views: 1980,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 3600000 * 36),
        coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "OpenAI Expands India Footprint: INR Billing & Datasets",
          metaDescription: "OpenAI introduces INR billing, GST compliance, and Indic dataset initiatives for Indian startups and developers.",
          focusKeyword: "OpenAI India expansion",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "Google DeepMind Launches Project Vaani 2: Multimodal Datasets for 50+ Indian Dialects",
        slug: "google-deepmind-launches-project-vaani-2-indian-dialects",
        excerpt:
          "Collaborating with the Indian Institute of Science (IISc), Google DeepMind releases 14,000 hours of open-source conversational audio across 80 Indian districts.",
        contentHtml: `
          <h2>Bridging the Vernacular Audio Divide</h2>
          <p>Project Vaani Phase 2 expands the largest open-access Indian speech repository in history, capturing authentic dialects across rural Maharashtra, Uttar Pradesh, and Bihar.</p>
          <h2>Empowering Vernacular Voice Agents</h2>
          <p>The open-source audio corpus is freely accessible for Indian researchers building agricultural advisories, fintech voice bots, and healthcare assistants tailored to non-English speaking citizens.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-news"],
        tags: [tagMap["gemini"], tagMap["indic-nlp"]],
        status: "published",
        featured: false,
        views: 1650,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 60),
        coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Google DeepMind Launches Project Vaani 2 in India",
          metaDescription: "Google and IISc release 14,000 hours of open Indian speech datasets across 50 dialects.",
          focusKeyword: "Google Project Vaani 2 India",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "Nvidia and Reliance Partner on 1GW AI Supercomputing Datacenter in Gujarat",
        slug: "nvidia-reliance-1gw-ai-supercomputing-datacenter-gujarat",
        excerpt:
          "Mukesh Ambani and Jensen Huang outline plans for gigawatt-scale AI infrastructure powered by green solar energy to serve Indian sovereign computing needs.",
        contentHtml: `
          <h2>Gigawatt-Scale Sovereign Infrastructure</h2>
          <p>Reliance Industries and Nvidia have commenced initial construction on a planned 1GW AI datacenter in Jamnagar, Gujarat, designed to run next-generation Blackwell GB200 NVL72 liquid-cooled racks.</p>
          <h2>Green Solar Powered AI Supercomputing</h2>
          <p>The facility will be powered entirely by round-the-clock solar and green hydrogen generation, setting a global benchmark for sustainable high-density AI computation.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-news"],
        tags: [tagMap["india-ai-mission"]],
        status: "published",
        featured: false,
        views: 2420,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 3600000 * 84),
        coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Nvidia and Reliance 1GW AI Datacenter in Gujarat",
          metaDescription: "Reliance and Nvidia partner on a gigawatt green-energy AI supercomputer datacenter in Jamnagar.",
          focusKeyword: "Reliance Nvidia AI datacenter Gujarat",
          schemaType: "NewsArticle",
        },
      },

      // 2. Model Launches
      {
        title: "DeepSeek-V3 Architecture Deep Dive: Multi-Head Latent Attention and DualPipe Parallelism",
        slug: "deepseek-v3-architecture-deep-dive-mla-dualpipe",
        excerpt:
          "How DeepSeek-V3 achieved 671B parameters with only 37B activated per token, training on just 2,048 H800 GPUs for under $6 million.",
        contentHtml: `
          <h2>The Architectural Breakthrough of Multi-Head Latent Attention</h2>
          <p>Traditional transformer KV cache size scales linearly with sequence length. DeepSeek-V3 introduces Multi-Head Latent Attention (MLA), compressing Key-Value states into low-dimensional latent vectors.</p>
          <h2>DualPipe: Overlapping Computation and Inter-GPU Communication</h2>
          <p>By scheduling forward and backward pipeline chunks concurrently, DualPipe eliminates network communication bubbles across cluster nodes without sacrificing throughput.</p>
        `,
        author: editorialTeam._id,
        category: catMap["model-launches"],
        tags: [tagMap["deepseek"], tagMap["open-weights"]],
        status: "published",
        featured: true,
        views: 3120,
        readingTime: 9,
        publishedAt: new Date(Date.now() - 3600000 * 24),
        coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "DeepSeek-V3 Architecture Deep Dive: MLA & DualPipe",
          metaDescription: "Complete engineering breakdown of DeepSeek-V3. Multi-Head Latent Attention, DualPipe scheduling, and FP8 mixed precision.",
          focusKeyword: "DeepSeek-V3 architecture MLA",
          schemaType: "TechArticle",
        },
      },
      {
        title: "Llama 3.3 70B Benchmark: Matches Llama 3.1 405B Performance at One-Fifth the VRAM",
        slug: "llama-3-3-70b-benchmark-matches-405b",
        excerpt:
          "Meta's latest open-weights model achieves 405B-class benchmark performance on a single 8x H100 node or quantized 4-bit dual RTX 4090s.",
        contentHtml: `
          <h2>Frontier Efficiency for Self-Hosters</h2>
          <p>Meta AI's Llama 3.3 70B proves that dense training on high-quality synthetic tokens delivers 400B-class intelligence in a lightweight 70B footprint.</p>
          <h2>Local Quantization & Inference Speeds</h2>
          <p>Using AWQ or EXL2 quantization, Llama 3.3 70B runs comfortably on workstations with 48GB VRAM, generating 35 tokens per second for local coding workflows.</p>
        `,
        author: editorialTeam._id,
        category: catMap["model-launches"],
        tags: [tagMap["llama-3-3"], tagMap["open-weights"]],
        status: "published",
        featured: false,
        views: 2180,
        readingTime: 7,
        publishedAt: new Date(Date.now() - 3600000 * 48),
        coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Llama 3.3 70B Benchmark Review | AI Latest News",
          metaDescription: "Hands-on benchmarks for Llama 3.3 70B. Local deployment with vLLM, GGUF quantization, and coding accuracy tests.",
          focusKeyword: "Llama 3.3 70B benchmark",
          schemaType: "TechArticle",
        },
      },
      {
        title: "Mistral Releases Pixtral 12B: Open-Weights Vision-Language Model Tested on Document OCR",
        slug: "mistral-pixtral-12b-open-weights-vision-ocr-review",
        excerpt:
          "Mistral's first multimodal model processes arbitrary aspect ratios without tiling artifacts. We tested it on Indian tax invoices and technical diagrams.",
        contentHtml: `
          <h2>Native Image Resolution Handling</h2>
          <p>Unlike earlier vision models that crop images into rigid 336x336 tiles, Pixtral processes arbitrary image dimensions natively, excelling at high-resolution document extraction.</p>
          <h2>Indian Invoice & Document OCR Accuracy</h2>
          <p>In our tests on bilingual GST invoices featuring mixed English and Hindi text, Pixtral achieved 96.4% field extraction accuracy, surpassing traditional OCR pipelines.</p>
        `,
        author: editorialTeam._id,
        category: catMap["model-launches"],
        tags: [tagMap["open-weights"]],
        status: "published",
        featured: false,
        views: 1490,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 96),
        coverImage: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Pixtral 12B Review: Mistral Open Multimodal Tested",
          metaDescription: "Hands-on review of Mistral's Pixtral 12B vision model. OCR accuracy, image token efficiency, and local deployment.",
          focusKeyword: "Pixtral 12B review",
          schemaType: "Review",
        },
      },
      {
        title: "Anthropic Upgrades Claude 3.5 Sonnet: Computer Use API and Agentic Tooling Evaluated",
        slug: "anthropic-claude-3-5-sonnet-computer-use-evaluated",
        excerpt:
          "Claude 3.5 Sonnet can now interact directly with computer desktop GUIs, moving cursors, clicking buttons, and completing browser workflows.",
        contentHtml: `
          <h2>From Text Outputs to GUI Actions</h2>
          <p>Anthropic's Computer Use API marks a critical evolutionary jump: the AI looks at desktop screenshots, plans coordinate clicks, and executes shell scripts autonomously.</p>
          <h2>Developer Testing on Web Automation</h2>
          <p>We stress-tested Claude's Computer Use on multi-step financial reconciliation tasks across browser spreadsheets, demonstrating 88% task completion without human intervention.</p>
        `,
        author: editorialTeam._id,
        category: catMap["model-launches"],
        tags: [tagMap["claude-3-5"]],
        status: "published",
        featured: false,
        views: 2650,
        readingTime: 8,
        publishedAt: new Date(Date.now() - 3600000 * 110),
        coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Claude 3.5 Sonnet Computer Use Tested | AI Latest News",
          metaDescription: "Testing Anthropic's Computer Use API. Desktop GUI automation, accuracy scores, and developer security considerations.",
          focusKeyword: "Claude 3.5 Sonnet Computer Use",
          schemaType: "TechArticle",
        },
      },

      // 3. AI Tools
      {
        title: "Best Free AI Tools for Students in 2026: Zero-Cost Research and Coding Assistants",
        slug: "best-free-ai-tools-for-students-2026",
        excerpt:
          "A curated list of zero-cost generative AI tools for Indian college students: research paper summarization, coding assistants without credit cards, and free math solvers.",
        contentHtml: `
          <h2>Zero-Cost AI Arsenal for Students</h2>
          <p>Indian university students shouldn't have to spend ₹2,000 every month on expensive subscriptions to benefit from modern AI. Here is our vetted list of the most capable 100% free AI tools available today.</p>
          <h2>1. DeepSeek-R1 (Free Web & App)</h2>
          <p>DeepSeek's free reasoning mode matches OpenAI o1 on math, physics, and algorithm problems without charging a single rupee or asking for a credit card.</p>
          <h2>2. Google NotebookLM</h2>
          <p>Upload your semester PDFs, syllabus documents, and textbooks. NotebookLM synthesizes instant study guides and even generates an audio podcast discussing your notes.</p>
          <h2>3. GitHub Student Developer Pack</h2>
          <p>Free GitHub Copilot access for verified college students with an active .edu or .ac.in email address.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-tools"],
        tags: [tagMap["deepseek"], tagMap["gemini"]],
        status: "published",
        featured: true,
        views: 4210,
        readingTime: 7,
        publishedAt: new Date(Date.now() - 3600000 * 14),
        coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Best Free AI Tools for Students (2026) | AI Latest News",
          metaDescription: "Top zero-cost AI tools for Indian students. Free coding assistants, research summarizers, and reasoning engines without credit cards.",
          focusKeyword: "Free AI tools students India 2026",
          schemaType: "Review",
        },
      },
      {
        title: "Top 7 Generative AI Coding Tools Every Indian Developer Should Use in 2026",
        slug: "top-7-generative-ai-tools-developers-2026",
        excerpt:
          "From Cursor AI and Claude Code to local Ollama setups and vLLM inference runners: the essential productivity stack for engineering teams.",
        contentHtml: `
          <h2>The AI-Assisted Engineering Workflow</h2>
          <p>Modern software engineering in 2026 requires more than simple autocomplete. Today's agentic tools plan multi-file refactors, generate full test suites, and audit codebases for vulnerabilities.</p>
          <h2>1. Cursor IDE with Claude 3.5 Sonnet</h2>
          <p>Cursor remains the gold standard for full-codebase indexing, composer multi-file edits, and instant terminal command debugging.</p>
          <h2>2. Ollama + DeepSeek-Coder for Air-Gapped Coding</h2>
          <p>For financial institutions and confidential client repositories, running quantized 14B models locally guarantees complete code privacy.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-tools"],
        tags: [tagMap["claude-3-5"], tagMap["ollama"]],
        status: "published",
        featured: false,
        views: 3180,
        readingTime: 8,
        publishedAt: new Date(Date.now() - 3600000 * 42),
        coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Top 7 AI Coding Tools for Developers in 2026",
          metaDescription: "Cursor AI, Claude Code, Ollama, and Copilot compared for Indian developers. Pricing, IDE integration, and offline capabilities.",
          focusKeyword: "Top AI coding tools developers 2026",
          schemaType: "Review",
        },
      },
      {
        title: "How to Run DeepSeek-R1 Locally with Ollama and Open-WebUI: A Step-by-Step Guide",
        slug: "how-to-run-deepseek-r1-locally-ollama-open-webui",
        excerpt:
          "A practical tutorial on running quantized 1.5B, 7B, 14B, and 32B DeepSeek-R1 reasoning models completely offline on Mac, Windows, and Linux.",
        contentHtml: `
          <h2>Why Run DeepSeek Locally?</h2>
          <p>Running local reasoning models eliminates API downtime, ensures zero telemetry leaks, and operates indefinitely without an active internet connection.</p>
          <h2>Step 1: Install Ollama</h2>
          <p>Download Ollama from the official repository and pull the distilled model: <code>ollama run deepseek-r1:14b</code>.</p>
          <h2>Step 2: Deploy Open-WebUI with Docker</h2>
          <p>Run Open-WebUI to get a ChatGPT-like interface with document upload, voice output, and multi-model comparison right on localhost.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-tools"],
        tags: [tagMap["deepseek"], tagMap["ollama"], tagMap["open-weights"]],
        status: "published",
        featured: false,
        views: 2940,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 72),
        coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Run DeepSeek-R1 Locally with Ollama: Setup Guide",
          metaDescription: "Step-by-step tutorial: Install Ollama and Open-WebUI to run DeepSeek-R1 offline on consumer hardware with zero latency.",
          focusKeyword: "run DeepSeek R1 locally Ollama",
          schemaType: "HowTo",
        },
      },
      {
        title: "Vibe Coding in Practice: How AI Code Assistants Are Changing Senior Engineering Roles",
        slug: "vibe-coding-in-practice-ai-assistants-changing-engineering",
        excerpt:
          "Coined by Andrej Karpathy, 'vibe coding' represents an architectural shift where developers prompt, verify, and orchestrate rather than hand-typing boilerplate.",
        contentHtml: `
          <h2>The Rise of Natural Language Systems Architecture</h2>
          <p>When engineering shifts from writing syntax to evaluating AI-generated pull requests, senior developers become systems reviewers and security architects.</p>
          <h2>The Critical Skill: Defensive Verification</h2>
          <p>As generation costs plummet to zero, verification becomes the scarce resource. Indian engineering teams that master automated testing and spec-driven verification will ship 10x faster.</p>
        `,
        author: editorialTeam._id,
        category: catMap["ai-tools"],
        tags: [tagMap["claude-3-5"], tagMap["prompt-engineering"]],
        status: "published",
        featured: false,
        views: 1820,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 125),
        coverImage: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Vibe Coding in Practice: Senior Engineering in the AI Era",
          metaDescription: "How AI code assistants are transforming senior engineering roles into systems architecture and defensive verification.",
          focusKeyword: "vibe coding AI engineering",
          schemaType: "TechArticle",
        },
      },

      // 4. India AI
      {
        title: "Sarvam AI Unveils Sarvam-1: India's 2B Parameter Model Outperforming Llama on Indic Tasks",
        slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
        excerpt:
          "Trained on 4 trillion tokens across 10 Indian languages, Sarvam-1 demonstrates state-of-the-art tokenization efficiency and vernacular comprehension.",
        contentHtml: `
          <h2>Sovereign Indic Foundation Models</h2>
          <p>Bengaluru-based Sarvam AI has released Sarvam-1, a 2-billion parameter model purpose-built for Hindi, Tamil, Telugu, Kannada, Bengali, and five other Indian languages.</p>
          <h2>Tokenization Efficiency That Lowers API Bills</h2>
          <p>Global models like GPT-4o often consume 4 to 6 tokens for a single Hindi word. Sarvam-1's custom Indic tokenizer compresses regional vocabulary into 1.4 tokens per word, slashing API bills by 70%.</p>
        `,
        author: editorialTeam._id,
        category: catMap["india-ai"],
        tags: [tagMap["sarvam-ai"], tagMap["indic-nlp"]],
        status: "published",
        featured: true,
        views: 3780,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 10),
        coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Sarvam-1 2B Model Review: India's Breakthrough Indic AI",
          metaDescription: "Sarvam AI releases Sarvam-1 2B parameter model. Benchmark comparisons, Indic tokenization efficiency, and local deployment.",
          focusKeyword: "Sarvam-1 Indic AI model",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "Krutrim Cloud Expands Sovereign Infrastructure: Bare-Metal H100 Nodes and AI Studio",
        slug: "krutrim-cloud-bare-metal-h100-nodes-ai-studio",
        excerpt:
          "Ola's AI arm launches bare-metal GPU clusters and managed inference endpoints with native rupee billing and localized customer support.",
        contentHtml: `
          <h2>Sovereign AI Infrastructure in Bengaluru</h2>
          <p>Krutrim Cloud has opened public availability for dedicated 8x Nvidia H100 clusters hosted within Indian borders, catering to strict data localization mandates.</p>
          <h2>Managed Endpoints for Indic Models</h2>
          <p>The platform provides serverless API endpoints for Krutrim's multilingual foundational models alongside open-weights Llama and Mistral checkpoints.</p>
        `,
        author: editorialTeam._id,
        category: catMap["india-ai"],
        tags: [tagMap["krutrim"], tagMap["india-ai-mission"]],
        status: "published",
        featured: false,
        views: 2150,
        readingTime: 5,
        publishedAt: new Date(Date.now() - 3600000 * 52),
        coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Krutrim Cloud Launches Bare-Metal H100 GPU Clusters",
          metaDescription: "Krutrim Cloud announces bare-metal Nvidia H100 instances in India with INR billing and managed Indic endpoints.",
          focusKeyword: "Krutrim Cloud H100 India",
          schemaType: "NewsArticle",
        },
      },
      {
        title: "BharatGen: Inside India's Government-Backed Multimodal Generative AI Initiative",
        slug: "bharatgen-indias-government-backed-multimodal-initiative",
        excerpt:
          "Headed by IIT Bombay and funded by DST, BharatGen is training foundation models dedicated to Indian culture, languages, and citizen public services.",
        contentHtml: `
          <h2>A Public Sector AI Consortium</h2>
          <p>BharatGen brings together premier academic institutions including IIT Bombay, IIT Madras, and IIIT Hyderabad to develop sovereign text, speech, and vision foundation models.</p>
          <h2>Citizen-Centric Government AI Use Cases</h2>
          <p>Initial deployment targets include agrarian advisories in 14 languages, legal judgment summaries for district courts, and voice-enabled citizen service delivery across rural panchayats.</p>
        `,
        author: editorialTeam._id,
        category: catMap["india-ai"],
        tags: [tagMap["bharatgpt"], tagMap["indic-nlp"]],
        status: "published",
        featured: false,
        views: 1890,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 88),
        coverImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "BharatGen: India's Sovereign Generative AI Consortium",
          metaDescription: "Inside BharatGen: IIT Bombay and MeitY's mission to develop sovereign multimodal models for Indian public services.",
          focusKeyword: "BharatGen India AI consortium",
          schemaType: "NewsArticle",
        },
      },

      // 5. Guides and Comparisons
      {
        title: "ChatGPT vs Claude vs Gemini: Which Is Best in India in 2026?",
        slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
        excerpt:
          "We stress-tested OpenAI ChatGPT Plus, Anthropic Claude 3.5 Sonnet, and Google Gemini 1.5 Pro across Indian English, regional language reasoning, UPI coding tasks, and rupee pricing.",
        contentHtml: `
          <h2>The Big Three in the Indian Context</h2>
          <p>For Indian developers, founders, and students, choosing between ChatGPT Plus, Claude Pro, and Gemini Advanced is not just about raw global benchmarks. It comes down to regional language comprehension, pricing in Indian Rupees, coding capability, and local integration speed.</p>
          <h2>1. Pricing &amp; Rupee Billing</h2>
          <p>OpenAI currently charges $20/month plus 18% GST (approx. ₹2,050/month). Google Gemini Advanced is bundled with Google One AI Premium at ₹1,950/month with free trials on select Android smartphones. Anthropic Claude charges $20/month with international card acceptance.</p>
          <h2>2. Indic Language Benchmark</h2>
          <p>In our tests evaluating Hindi, Marathi, and Tamil reading comprehension:</p>
          <ul>
            <li><strong>Gemini 1.5 Pro:</strong> Outstanding Indic vocabulary thanks to Google DeepMind's multilingual corpus.</li>
            <li><strong>Claude 3.5 Sonnet:</strong> Flawless nuance in technical documentation and complex system design.</li>
            <li><strong>ChatGPT (GPT-4o):</strong> Fast execution, but occasional transliteration errors on complex legal idioms.</li>
          </ul>
        `,
        author: editorialTeam._id,
        category: catMap["guides-and-comparisons"],
        tags: [tagMap["chatgpt"], tagMap["claude-3-5"], tagMap["gemini"]],
        status: "published",
        featured: true,
        views: 4890,
        readingTime: 8,
        publishedAt: new Date(Date.now() - 3600000 * 8),
        coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "ChatGPT vs Claude vs Gemini: Best AI in India (2026)",
          metaDescription: "Detailed comparison of ChatGPT Plus, Claude 3.5 Sonnet, and Gemini 1.5 Pro in India. Rupee pricing, Indic language support, and coding benchmarks.",
          focusKeyword: "ChatGPT vs Claude vs Gemini India",
          schemaType: "Review",
        },
      },
      {
        title: "Prompt Engineering 101: 5 Essential Techniques for High-Quality AI Output",
        slug: "prompt-engineering-101-essential-techniques",
        excerpt:
          "Master system role framing, few-shot demonstration pairs, chain-of-thought scratchpads, and structured JSON output schemas for reliable model responses.",
        contentHtml: `
          <h2>Moving Beyond Casual Chatting</h2>
          <p>Writing reliable prompts for production AI applications is fundamentally different from typing questions into a consumer chat box. Here are the five foundational techniques every engineer must master.</p>
          <h2>1. Role and Constraint Isolation</h2>
          <p>Always separate your system persona, input data, and output schema into clear XML or markdown fences to prevent prompt injection and hallucinated schemas.</p>
          <h2>2. Few-Shot Demonstration Anchoring</h2>
          <p>Providing even two positive and one negative example dramatically improves corner-case reliability over vague zero-shot instructions.</p>
        `,
        author: editorialTeam._id,
        category: catMap["guides-and-comparisons"],
        tags: [tagMap["prompt-engineering"]],
        status: "published",
        featured: false,
        views: 2780,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 30),
        coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Prompt Engineering 101: 5 Essential Techniques (2026)",
          metaDescription: "A comprehensive guide to prompt engineering. Role framing, few-shot examples, chain-of-thought, and JSON schemas explained.",
          focusKeyword: "prompt engineering techniques 2026",
          schemaType: "HowTo",
        },
      },
      {
        title: "What Is a Large Language Model (LLM)? A Complete Beginner's Guide",
        slug: "what-is-a-large-language-model-llm-complete-guide",
        excerpt:
          "Clear, jargon-free explanation of how neural networks predict next tokens, how transformers process text, and why fine-tuning creates intelligent AI systems.",
        contentHtml: `
          <h2>Demystifying Artificial Intelligence</h2>
          <p>At its core, a Large Language Model (LLM) is a pattern recognition engine trained on vast libraries of human literature, code, and mathematics.</p>
          <h2>How Tokens Work</h2>
          <p>Computers cannot read words directly. Text is converted into numerical tokens. The transformer architecture calculates statistical probabilities to predict the most contextually relevant next token.</p>
        `,
        author: editorialTeam._id,
        category: catMap["guides-and-comparisons"],
        tags: [tagMap["open-weights"]],
        status: "published",
        featured: false,
        views: 2310,
        readingTime: 6,
        publishedAt: new Date(Date.now() - 3600000 * 68),
        coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "What Is a Large Language Model (LLM)? Complete Guide",
          metaDescription: "Understand Large Language Models from scratch. How transformers work, tokenization, training, and real-world capabilities.",
          focusKeyword: "what is large language model LLM",
          schemaType: "TechArticle",
        },
      },

      // 6. Enterprise AI
      {
        title: "Enterprise AI Adoption in India: How BFSI and IT Giants Are Deploying Private LLMs",
        slug: "enterprise-ai-adoption-india-bfsi-it-private-llms",
        excerpt:
          "Indian banks and tier-1 IT firms are adopting on-premise RAG architectures, role-based access control, and air-gapped models to comply with RBI guidelines.",
        contentHtml: `
          <h2>The Indian Enterprise AI Landscape</h2>
          <p>While consumer AI grabs headlines, the largest investments in Indian technology are happening behind enterprise firewalls in Mumbai, Pune, and Bengaluru.</p>
          <h2>Navigating RBI Compliance & Data Sovereignty</h2>
          <p>Under Reserve Bank of India data localization norms, customer financial records cannot leave Indian territorial boundaries. Leading private banks are deploying quantized open-weights models inside private clouds.</p>
          <h2>The RAG Gold Standard in Corporate Knowledge Retrieval</h2>
          <p>By pairing vector databases with hybrid dense-sparse retrieval, enterprises are deploying internal research assistants that cite exact internal policy documents without external hallucinations.</p>
        `,
        author: editorialTeam._id,
        category: catMap["enterprise-ai"],
        tags: [tagMap["enterprise-ai"], tagMap["open-weights"]],
        status: "published",
        featured: true,
        views: 3120,
        readingTime: 7,
        publishedAt: new Date(Date.now() - 3600000 * 16),
        coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Enterprise AI Adoption in India: BFSI & Private LLMs",
          metaDescription: "How Indian banks and IT enterprises deploy private LLMs with RBI compliance, RAG pipelines, and air-gapped security.",
          focusKeyword: "Enterprise AI adoption India BFSI",
          schemaType: "TechArticle",
        },
      },
      {
        title: "Building Scalable Enterprise RAG: Chunking Strategies, Re-Ranking, and Vector Databases",
        slug: "building-scalable-enterprise-rag-chunking-reranking-vector-db",
        excerpt:
          "Why naive RAG fails in production: implementing semantic document chunking, Cohere/BGE re-ranking cross-encoders, and hybrid dense-sparse vector search.",
        contentHtml: `
          <h2>Beyond Naive Retrieval-Augmented Generation</h2>
          <p>Naive chunking by character count often separates questions from answers. Advanced enterprise RAG utilizes semantic boundary splitting and parent-document retrieval.</p>
          <h2>The Power of Cross-Encoder Re-Ranking</h2>
          <p>Adding a re-ranking model like BGE-Reranker after initial vector retrieval boosts top-3 contextual relevance from 68% to 92%, virtually eliminating hallucinations in enterprise document QA.</p>
        `,
        author: editorialTeam._id,
        category: catMap["enterprise-ai"],
        tags: [tagMap["enterprise-ai"]],
        status: "published",
        featured: false,
        views: 2450,
        readingTime: 8,
        publishedAt: new Date(Date.now() - 3600000 * 56),
        coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        seo: {
          metaTitle: "Building Scalable Enterprise RAG: Production Architecture",
          metaDescription: "Enterprise guide to RAG architectures: semantic chunking, cross-encoder re-ranking, and hybrid vector search.",
          focusKeyword: "scalable enterprise RAG architecture",
          schemaType: "TechArticle",
        },
      },
    ];

    const insertedPosts = await Post.insertMany(postsData);
    console.log(`   ✅ Created ${insertedPosts.length} rich published AI articles!`);

    // ── Update Category Post Counts ──
    for (const cat of categories) {
      const count = await Post.countDocuments({ category: cat._id, status: "published" });
      await Category.findByIdAndUpdate(cat._id, { postCount: count });
    }

    // ── Update Tag Post Counts ──
    for (const tag of tags) {
      const count = await Post.countDocuments({ tags: tag._id, status: "published" });
      await Tag.findByIdAndUpdate(tag._id, { postCount: count });
    }

    // ── Create Sample Subscribers ──
    console.log("📬 Creating sample subscribers...");
    await Subscriber.insertMany([
      {
        email: "rohit.ai@infosys.com",
        name: "Rohit Verma",
        status: "active",
        source: "hero_newsletter",
        unsubscribeToken: "token_rohit_ailatestnews_1",
        subscribedAt: new Date(Date.now() - 86400000 * 8),
      },
      {
        email: "ananya@zomato.com",
        name: "Ananya Deshmukh",
        status: "active",
        source: "article_inline",
        unsubscribeToken: "token_ananya_ailatestnews_2",
        subscribedAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        email: "vikram@swiggy.in",
        name: "Vikram Malhotra",
        status: "active",
        source: "category_newsletter",
        unsubscribeToken: "token_vikram_ailatestnews_3",
        subscribedAt: new Date(Date.now() - 86400000 * 2),
      },
    ]);

    console.log("\n===========================================");
    console.log("✨ AI LATEST NEWS COMPREHENSIVE SEED COMPLETED!");
    console.log("===========================================");
    console.log(`  Users:        ${await User.countDocuments()}`);
    console.log(`  Categories:   ${await Category.countDocuments()}`);
    console.log(`  Tags:         ${await Tag.countDocuments()}`);
    console.log(`  Articles:     ${await Post.countDocuments({ status: "published" })} (all published & English)`);
    console.log(`  Subscribers:  ${await Subscriber.countDocuments()}`);
    console.log("===========================================");
    console.log("\n🔑 Admin Credentials:");
    console.log("   Email:    kravionatech@gmail.com");
    console.log("   Password: Admin123!");
    console.log("===========================================\n");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Disconnected from MongoDB");
  }
}

seed();
