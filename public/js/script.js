// Initialize Lucide Icons
lucide.createIcons();
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER LOGIC ---
const bootSequence = [
    "> Initializing GitHub Copilot telemetry...",
    "> Establishing semantic index parameters...",
    "> Verifying MLH secure payloads...",
    "> Authenticating data pathways...",
    "> Connection verified. Environment ready.",
];

const preloader = document.getElementById("preloader");
const preloaderContent = document.getElementById("preloader-content");

let delay = 0;
bootSequence.forEach((text) => {
    setTimeout(() => {
        const el = document.createElement("div");
        el.className = "preloader-log";
        if (text.includes("verified")) {
            el.innerHTML = `<span class="text-ghGreen4 drop-shadow-[0_0_8px_rgba(15,191,62,0.8)]">${text}</span>`;
        } else {
            el.innerText = text;
        }
        preloaderContent.appendChild(el);
        gsap.to(el, { opacity: 1, y: 0, duration: 0.3 });
    }, delay);
    delay += 400 + Math.random() * 400; // Randomize typing delays
});

// End preloader and start hero animation
setTimeout(() => {
    gsap.to(preloader, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
            preloader.style.display = "none";
            document.getElementById("body").classList.remove("overflow-hidden");
            initHeroAnimations();
            startTerminalTypewriter();
        },
    });
}, delay + 500);

function initHeroAnimations() {
    const tl = gsap.timeline();
    tl.to("#hero-main", {
        y: -30,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
    })
        .to(
            "#hero-card",
            { x: -30, opacity: 1, duration: 1, ease: "power3.out" },
            "-=0.6",
        )
        .to(
            "#hero-sponsors",
            {
                y: -20,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
            },
            "-=0.5",
        );
}

// --- MODAL LOGIC (GSAP Animations) ---
const modal = document.getElementById("reg-modal");
const modalContent = document.getElementById("modal-content");
const getStartedBtn = document.getElementById("get-started-btn");
const hackathonBtn = document.getElementById("hackathon-register-btn");
const closeModalBtn = document.getElementById("close-modal");

function openModal() {
    modal.classList.remove("pointer-events-none");
    gsap.to(modal, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
    });
    gsap.fromTo(
        modalContent,
        { scale: 0.9, opacity: 0, y: 20 },
        {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "back.out(1.5)",
            delay: 0.1,
        },
    );
    document.body.style.overflow = "hidden";
}

getStartedBtn.addEventListener("click", openModal);
hackathonBtn.addEventListener("click", openModal);

closeModalBtn.addEventListener("click", () => {
    gsap.to(modalContent, {
        scale: 0.95,
        opacity: 0,
        y: 10,
        duration: 0.3,
        ease: "power2.in",
    });
    gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        delay: 0.2,
        onComplete: () => {
            modal.classList.add("pointer-events-none");
            document.body.style.overflow = "auto";
        },
    });
});

// --- RENDER AGENDA ---
const agendaData = [
    {
        time: "09:15 AM",
        title: "Welcome & Registration",
        desc: "Attendees check in, grab their kits, and settle in. Quick housekeeping.",
        icon: "users",
        detail: "Kick off your GitHub Copilot Dev Days experience! Arrive at Rungta International Skills University, check in at the registration desk, and collect your official event kit — including swag, badges, and session guides. Our volunteers will help you navigate the venue and get settled before the opening session begins. This is a great time to network with fellow developers, grab a coffee, and prepare for a day packed with cutting-edge AI-first development learning.",
        highlights: [
            "Collect your official Dev Days event kit & swag",
            "Network with fellow developers and community members",
            "Get familiar with the venue and session layout",
        ],
    },
    {
        time: "10:15 AM",
        title: "Opening Session",
        desc: "Core introductory session covering what GitHub Copilot is, and live demos.",
        icon: "terminal",
        detail: "The Opening Session sets the stage for the entire event. Learn what GitHub Copilot is, how it transforms developer workflows, and see it in action through live demonstrations. This session covers the fundamentals of AI-assisted development — from code completions and chat-based workflows to the latest Agent Mode capabilities. Whether you're new to Copilot or an experienced user, this session ensures everyone starts on the same page with a solid understanding of the platform's power.",
        highlights: [
            "Introduction to GitHub Copilot and AI-pair programming",
            "Live demo of Copilot features: code completion, chat, and agent mode",
            "Overview of the day's learning roadmap and objectives",
        ],
    },
    {
        time: "11:00 AM",
        title: "Community Session",
        desc: "A developer or community leader shares their hands-on experience building.",
        icon: "github",
        detail: "Hear directly from a developer or community leader who has been building real-world projects with GitHub Copilot. This session features authentic stories of how AI-assisted development has accelerated their workflows, solved complex problems, and transformed the way they write code. Expect practical insights, lessons learned, tips and tricks — all from someone who has been in the trenches shipping production code with Copilot by their side.",
        highlights: [
            "Real-world experience from an active Copilot developer",
            "Practical tips and workflow optimizations",
            "Interactive Q&A with the community speaker",
        ],
    },
    {
        time: "11:45 AM",
        title: "Technical Deep Dive",
        desc: "Deep dive into advanced capabilities: custom instructions, MCP integration.",
        icon: "cpu",
        detail: "Go beyond the basics in this advanced technical session. Explore GitHub Copilot's most powerful features including custom instructions for personalized AI behavior, Model Context Protocol (MCP) integration for connecting external tools and services, and multi-file editing with Agent Mode. This session is designed for developers who want to push the boundaries of what's possible with AI-assisted development and leverage Copilot as a true development partner — not just an autocomplete tool.",
        highlights: [
            "Custom instructions for tailored Copilot behavior",
            "MCP (Model Context Protocol) integration deep dive",
            "Agent Mode: multi-file editing and autonomous workflows",
        ],
    },
    {
        time: "01:00 PM",
        title: "Lunch Break",
        desc: "Networking over lunch. A great opportunity to connect with fellow developers.",
        icon: "coffee",
        detail: "Take a well-deserved break! Enjoy lunch while connecting with fellow developers, speakers, and Copilot Champions. This is an excellent opportunity for organic networking — discuss what you've learned so far, share project ideas for the upcoming hackathon, or simply enjoy conversations with like-minded tech enthusiasts. Food and refreshments will be provided at the venue.",
        highlights: [
            "Complimentary lunch and refreshments provided",
            "Network with speakers, mentors, and fellow developers",
            "Form teams and brainstorm ideas for the hackathon",
        ],
    },
    {
        time: "02:00 PM",
        title: "Hands-On Workshop",
        desc: "Guided coding workshop where attendees build a real project. Choose your stack.",
        icon: "code-2",
        detail: "This is where theory meets practice. In this guided hands-on workshop, you'll build a real project from scratch using GitHub Copilot as your AI pair programmer. Choose your preferred tech stack — whether it's web development with React/Next.js, backend with Python/Node.js, or full-stack applications. Expert mentors will be available to guide you through each step, helping you leverage Copilot's code generation, debugging, and refactoring capabilities in a real development workflow.",
        highlights: [
            "Build a real project from scratch with Copilot assistance",
            "Choose your preferred tech stack and framework",
            "1:1 mentorship from Copilot Champions and GitHub experts",
        ],
    },
    {
        time: "03:30 PM",
        title: "Open Lab / Q&A",
        desc: "Attendees continue experimenting with workshops of their choice. 1:1 support.",
        icon: "zap",
        detail: "Continue your learning journey in this open-format lab session. Work on your workshop projects, experiment with different Copilot features, or start prototyping your hackathon idea. Copilot Champions and mentors are available for 1:1 support — bring your toughest coding challenges and watch how AI-assisted development can help solve them. This session is intentionally unstructured to give you the freedom to explore what interests you most.",
        highlights: [
            "Open format — explore at your own pace",
            "1:1 support from Copilot Champions and mentors",
            "Start prototyping your MLH hackathon project",
        ],
    },
    {
        time: "04:15 PM",
        title: "Closing",
        desc: "Wrap-up, key takeaways, community shoutouts, swag distribution.",
        icon: "arrow-right",
        detail: "We wrap up an incredible day of learning and building! The closing ceremony includes a recap of key takeaways, recognition of standout participants, community shoutouts, and distribution of exclusive GitHub swag and prizes. We'll also share how to get involved with the post-event MLH Hackathon starting April 13th — so you can put your newly acquired Copilot skills to the ultimate test on a global stage.",
        highlights: [
            "Recap of the day's key learnings and takeaways",
            "Exclusive GitHub swag and prize distribution",
            "Information about the MLH Hackathon (April 13th)",
        ],
    },
];

const agendaGrid = document.getElementById("agenda-grid");
agendaData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className =
        "group bg-[#121613]/80 backdrop-blur-md p-6 border-subtle border-t-[4px] border-t-transparent hover:border-t-ghGreen4 transition-colors duration-300 flex flex-col h-full gs-agenda-card cursor-pointer";
    card.innerHTML = `
          <div class="flex items-center justify-between mb-6">
            <span class="font-mono text-[10px] text-ghGray4 tracking-widest">${item.time}</span>
            <i data-lucide="${item.icon}" class="w-4 h-4 text-ghGray4 icon-bounce"></i>
          </div>
          <h3 class="text-body-xl text-white mb-3 group-hover:text-ghGreen4 transition-colors">${item.title}</h3>
          <p class="text-xs md:text-sm text-ghGray4 leading-relaxed mt-auto">${item.desc}</p>
        `;
    card.addEventListener("click", () => openAgendaModal(item));
    agendaGrid.appendChild(card);
});
lucide.createIcons();

// --- AGENDA DETAIL MODAL LOGIC ---
const agendaModal = document.getElementById("agenda-modal");
const agendaModalContent = document.getElementById("agenda-modal-content");
const closeAgendaModalBtn = document.getElementById("close-agenda-modal");

function openAgendaModal(item) {
    // Populate modal content
    document.getElementById("agenda-modal-title").textContent = item.title;
    document.getElementById("agenda-modal-time").textContent = item.time;
    document.getElementById("agenda-modal-desc").textContent = item.detail;

    // Update icon
    const iconEl = document.getElementById("agenda-modal-icon-el");
    iconEl.setAttribute("data-lucide", item.icon);
    lucide.createIcons();

    // Populate highlights
    const highlightsEl = document.getElementById("agenda-modal-highlights");
    highlightsEl.innerHTML = item.highlights
        .map(
            (h) => `
        <div class="flex items-start gap-3 font-mono text-xs md:text-sm text-ghGray4">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-ghGreen4 mt-0.5 flex-shrink-0"></i>
            <span>${h}</span>
        </div>
    `,
        )
        .join("");
    lucide.createIcons();

    // Animate open
    agendaModal.classList.remove("pointer-events-none");
    gsap.to(agendaModal, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.fromTo(
        agendaModalContent,
        { scale: 0.9, opacity: 0, y: 20 },
        {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "back.out(1.5)",
            delay: 0.1,
        },
    );
    document.body.style.overflow = "hidden";
}

function closeAgendaModal() {
    gsap.to(agendaModalContent, {
        scale: 0.95,
        opacity: 0,
        y: 10,
        duration: 0.3,
        ease: "power2.in",
    });
    gsap.to(agendaModal, {
        opacity: 0,
        duration: 0.3,
        delay: 0.2,
        onComplete: () => {
            agendaModal.classList.add("pointer-events-none");
            document.body.style.overflow = "auto";
        },
    });
}

closeAgendaModalBtn.addEventListener("click", closeAgendaModal);
// Close on backdrop click
document.getElementById("agenda-modal-bg").addEventListener("click", closeAgendaModal);

// --- INTERACTIVE CONTRIBUTION GRAPH (Hackathon Section) ---
const gridContainer = document.getElementById("interactive-grid");
const levels = ["", "lvl-1", "lvl-2", "lvl-3", "lvl-4", "purple"];

// Generate 30 cells
for (let i = 0; i < 30; i++) {
    const cell = document.createElement("div");
    // Assign random initial levels to some cells
    if (Math.random() > 0.5) {
        const randomLvl = levels[Math.floor(Math.random() * levels.length)];
        if (randomLvl) cell.classList.add(randomLvl);
    }
    cell.classList.add("contrib-cell");

    // Interaction
    cell.addEventListener("click", function () {
        // Cycle through levels on click
        let currentClass = "";
        levels.forEach((lvl) => {
            if (lvl && this.classList.contains(lvl)) currentClass = lvl;
        });

        if (currentClass) this.classList.remove(currentClass);

        let nextIndex = levels.indexOf(currentClass) + 1;
        if (nextIndex >= levels.length) nextIndex = 0;

        const nextClass = levels[nextIndex];
        if (nextClass) {
            this.classList.add(nextClass);
            // Add pulse effect for purple (copilot)
            if (nextClass === "purple") this.classList.add("animate-pulse");
            else this.classList.remove("animate-pulse");
        } else {
            this.classList.remove("animate-pulse");
        }
    });
    gridContainer.appendChild(cell);
}

// --- TERMINAL TYPEWRITER EFFECT (Hackathon Section) ---
function startTerminalTypewriter() {
    const terminalEl = document.getElementById("terminal-typewriter");
    const lines = [
        `> Loading dependencies... <span class="text-ghGreen4">[OK]</span>`,
        `> Injecting semantic logic... <span class="text-ghGreen4">[OK]</span>`,
        `> Ready to build.`,
    ];

    let lineIndex = 0;
    terminalEl.innerHTML = ""; // clear

    function typeLine() {
        if (lineIndex < lines.length) {
            const div = document.createElement("div");
            div.innerHTML = lines[lineIndex];
            div.style.opacity = 0;
            terminalEl.appendChild(div);

            gsap.to(div, {
                opacity: 1,
                duration: 0.2,
                onComplete: () => {
                    lineIndex++;
                    setTimeout(typeLine, 800);
                },
            });
        }
    }
    typeLine();
}

// --- SCROLL ANIMATIONS (GSAP) ---
let lastScroll = 0;
window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50 && currentScroll > lastScroll) {
        nav.style.transform = "translateY(-100%)";
    } else {
        nav.style.transform = "translateY(0)";
    }
    lastScroll = currentScroll;
});

gsap.from(".gs-agenda-card", {
    scrollTrigger: { trigger: "#agenda", start: "top 80%" },
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
});

gsap.from(".gs-hackathon > div", {
    scrollTrigger: { trigger: "#hackathon", start: "top 80%" },
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
});

gsap.from(".gs-ideation > div", {
    scrollTrigger: { trigger: "#ideation", start: "top 80%" },
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
});

// --- GEMINI API INTEGRATION ---
const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
};

document.getElementById("btn-generate").addEventListener("click", async () => {
    const stack = document.getElementById("input-stack").value;
    const theme = document.getElementById("input-theme").value;

    const elErr = document.getElementById("output-error");
    const elIdle = document.getElementById("output-idle");
    const elRes = document.getElementById("output-result");
    const elCur = document.getElementById("output-cursor");
    const iconIdle = document.getElementById("icon-idle");
    const iconLoad = document.getElementById("icon-loading");
    const btnText = document.getElementById("btn-text");
    const btnGroup = document.getElementById("btn-generate");

    elErr.classList.add("hidden");
    elIdle.classList.add("hidden");
    elRes.classList.add("hidden");
    elCur.classList.add("hidden");

    if (!stack.trim() || !theme.trim()) {
        elErr.textContent =
            "> SYS_ERR: Missing required parameters [stack, theme].";
        elErr.classList.remove("hidden");
        return;
    }

    btnGroup.style.pointerEvents = "none";
    iconIdle.classList.add("hidden");
    iconLoad.classList.remove("hidden");
    btnText.textContent = "COMPILING SCHEMATIC...";

    elRes.textContent =
        "> Transmitting payload to cognitive core...\n> Awaiting architecture schematic...\n";
    elRes.classList.remove("hidden");
    elCur.classList.remove("hidden");

    const apiKey = "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const prompt = `Act as an AI system architect and MLH hackathon mentor. Generate a highly technical, feasible hackathon project idea.
      Tech Stack: '${stack}'
      Domain/Theme: '${theme}'
      
      Output format must be plain text mimicking a raw terminal output. Do NOT use markdown formatting.
      Structure strictly as follows:
      
      [CODENAME] <creative, tech-sounding name>
      [PITCH] <1-2 sentences explaining the core value>
      [ARCHITECTURE]
      > <Technical feature 1>
      > <Technical feature 2>
      > <Technical feature 3>
      
      Keep it under 150 words. Be highly specific to the provided tech stack.`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    try {
        const data = await fetchWithRetry(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            elRes.textContent = `> CONNECTION ESTABLISHED\n> RECEIVING SCHEMATIC...\n\n${text}`;
        } else {
            throw new Error("Invalid response format");
        }
    } catch (err) {
        elErr.textContent = `> SYS_ERR: Connection to cognitive core severed. Retry sequence recommended.`;
        elErr.classList.remove("hidden");
        elRes.classList.add("hidden");
    } finally {
        btnGroup.style.pointerEvents = "auto";
        iconLoad.classList.add("hidden");
        iconIdle.classList.remove("hidden");
        btnText.textContent = "GENERATE ARCHITECTURE";
        elCur.classList.remove("hidden");
    }
});
