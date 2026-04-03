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
    },
    {
        time: "10:15 AM",
        title: "Opening Session",
        desc: "Core introductory session covering what GitHub Copilot is, and live demos.",
        icon: "terminal",
    },
    {
        time: "11:00 AM",
        title: "Community Session",
        desc: "A developer or community leader shares their hands-on experience building.",
        icon: "github",
    },
    {
        time: "11:45 AM",
        title: "Technical Deep Dive",
        desc: "Deep dive into advanced capabilities: custom instructions, MCP integration.",
        icon: "cpu",
    },
    {
        time: "01:00 PM",
        title: "Lunch Break",
        desc: "Networking over lunch. A great opportunity to connect with fellow developers.",
        icon: "coffee",
    },
    {
        time: "02:00 PM",
        title: "Hands-On Workshop",
        desc: "Guided coding workshop where attendees build a real project. Choose your stack.",
        icon: "code-2",
    },
    {
        time: "03:30 PM",
        title: "Open Lab / Q&A",
        desc: "Attendees continue experimenting with workshops of their choice. 1:1 support.",
        icon: "zap",
    },
    {
        time: "04:15 PM",
        title: "Closing",
        desc: "Wrap-up, key takeaways, community shoutouts, swag distribution.",
        icon: "arrow-right",
    },
];

const agendaGrid = document.getElementById("agenda-grid");
agendaData.forEach((item, index) => {
    const html = `
        <div class="group bg-[#121613]/80 backdrop-blur-md p-6 border-subtle border-t-[4px] border-t-transparent hover:border-t-ghGreen4 transition-colors duration-300 flex flex-col h-full gs-agenda-card cursor-pointer">
          <div class="flex items-center justify-between mb-6">
            <span class="font-mono text-[10px] text-ghGray4 tracking-widest">${item.time}</span>
            <i data-lucide="${item.icon}" class="w-4 h-4 text-ghGray4 icon-bounce"></i>
          </div>
          <h3 class="text-body-xl text-white mb-3 group-hover:text-ghGreen4 transition-colors">${item.title}</h3>
          <p class="text-xs md:text-sm text-ghGray4 leading-relaxed mt-auto">${item.desc}</p>
        </div>
      `;
    agendaGrid.insertAdjacentHTML("beforeend", html);
});
lucide.createIcons();

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
