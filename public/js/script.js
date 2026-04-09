// Initialize Lucide Icons
lucide.createIcons();
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER LOGIC ---
const bootSequence = [
    "> Initializing GitHub telemetry...",
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
    delay += 400 + Math.random() * 400;
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
            initScrollAnimations();
            startTerminalTypewriter();
            // Recalculate all ScrollTrigger positions now that layout is visible
            setTimeout(() => ScrollTrigger.refresh(), 200);
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

// --- RENDER AGENDA --- (Handbook timeline data)
const agendaData = [
    {
        time: "7:00 AM – 8:00 AM",
        title: "Breakfast & Registration",
        desc: "Arrive, check in, collect your event kit, and fuel up for the day ahead.",
        icon: "coffee",
        detail: "Kick off your GitHub Dev Days & Hack in Dev Days experience! Arrive at Rungta International Skills University, check in at the registration desk, and collect your official event kit — including swag, badges, and session guides. Enjoy breakfast while networking with fellow developers. Our volunteers will help you navigate the venue and form teams if you haven't already.",
        highlights: [
            "Collect your official Dev Days event kit & swag",
            "Enjoy breakfast and meet your fellow hackers",
            "Finalize team formation (2–4 members)",
        ],
    },
    {
        time: "8:00 AM – 8:30 AM",
        title: "Opening Ceremony",
        desc: "Opening session covering GitHub products, live demos, and capabilities.",
        icon: "terminal",
        detail: "The Opening Session sets the stage for the entire event. Learn what GitHub tools are available, how they transform developer workflows, and see them in action through live demonstrations.",
        highlights: [
            "Introduction to GitHub and AI-pair programming",
            "Live demo of features: completion, chat, agent mode",
            "Custom Instructions & MCP integration overview",
        ],
    },
    {
        time: "8:30 AM – 9:15 AM",
        title: "GitHub DevDays — Session 1",
        desc: "Hear from developers and community leaders building real-world projects with GitHub tools.",
        icon: "users",
        detail: "Hear directly from developers and community leaders who have been building real-world projects with GitHub. This session features authentic stories of how AI-assisted development has accelerated workflows, solved complex problems, and transformed how teams write code. Expect practical insights, lessons learned, and tips you can apply immediately.",
        highlights: [
            "Real-world developer experiences",
            "Practical tips and workflow optimizations",
            "Interactive Q&A with community speakers",
        ],
    },
    {
        time: "9:15 AM – 10:00 AM",
        title: "GitHub DevDays — Session 2",
        desc: "Deep dive into advanced GitHub features and tools.",
        icon: "code",
        detail: "Build on the first session with a deep dive into advanced GitHub features. Learn how to leverage the entire platform for your workflow, from advanced features to Actions and more.",
        highlights: [
            "Advanced developer tools",
            "Workflow automations",
            "Further Q&A",
        ],
    },
    {
        time: "10:00 AM – 12:00 PM",
        title: "Hackathon Begins (Hacking Session 1)",
        desc: "First hacking session begins. Start building your project with your team.",
        icon: "code-2",
        detail: "The hackathon begins! Teams start building their projects in this first 2-hour hacking session. Choose your track — Open Innovation or Google Gemini — and start coding. Mentors are available for guidance. Use GitHub, Google Gemini, and any other tools to bring your idea to life.",
        highlights: [
            "Start building your hackathon project",
            "Choose: Open Innovation or Google Gemini track",
            "Mentors available for technical guidance",
        ],
    },
    {
        time: "12:00 PM – 1:00 PM",
        title: "Lunch Break",
        desc: "Refuel with a complimentary lunch. Network and brainstorm with other teams.",
        icon: "utensils",
        detail: "Take a break and enjoy a complimentary lunch! This is a great time to network with other teams, discuss approaches, get feedback from mentors, and recharge before the afternoon hacking sessions. Food and refreshments provided at the venue.",
        highlights: [
            "Complimentary lunch and refreshments",
            "Network with other teams and mentors",
            "Brainstorm and iterate on your project",
        ],
    },
    {
        time: "1:00 PM – 4:00 PM",
        title: "Hacking Continues (Session 2)",
        desc: "Continue building with dedicated mentor support. 1:1 guidance available.",
        icon: "zap",
        detail: "The longest and most intensive hacking session. Continue building your project with dedicated mentor support. Experts are available for 1:1 sessions. This is where most of the heavy lifting happens — push your project towards a working MVP.",
        highlights: [
            "3 hours of focused building time",
            "1:1 mentorship from experts",
            "Push towards a working MVP",
        ],
    },
    {
        time: "4:00 PM – 5:00 PM",
        title: "Mentoring Round",
        desc: "Dedicated time for mentors to review projects and provide specific guidance.",
        icon: "users",
        detail: "Take advantage of this focused mentoring hour. Mentors will circle around to review your progress, help you troubleshoot tricky bugs, and refine your pitch for the final evaluation.",
        highlights: [
            "Focused 1:1 project review",
            "Troubleshoot blockers",
            "Pitch refinement",
        ],
    },
    {
        time: "5:00 PM – 5:30 PM",
        title: "Snack Break",
        desc: "Quick recharge with snacks before the final hacking sprint.",
        icon: "cookie",
        detail: "A quick break to recharge before the final sprint. Grab some snacks, stretch your legs, and prepare for the judging rounds ahead. Use this time to review your project status and plan your final push.",
        highlights: [
            "Snacks and refreshments",
            "Review project status",
            "Plan your final sprint and demo",
        ],
    },
    {
        time: "5:30 PM – 6:30 PM",
        title: "Hacking Continues (Session 3)",
        desc: "Final hacking sprint before evaluations.",
        icon: "zap",
        detail: "The final push before judging begins. Wrap up your code, squash those last bugs, and prepare your presentation. Make every minute count!",
        highlights: [
            "Final code adjustments",
            "Demo preparation",
            "Last minute tweaks",
        ],
    },
    {
        time: "6:30 PM – 8:00 PM",
        title: "Final Evaluation & Judging",
        desc: "Present your project to the judges. Round 1 & Round 2 judging.",
        icon: "trophy",
        detail: "The crucial evaluation session. Judges will review your project in two rounds. Round 1 checks ~50% project completion and GitHub activity. Round 2 is the final evaluation — your MVP must be ready with a final presentation and demo.",
        highlights: [
            "Round 1: Execution phase (~50% complete, GitHub activity checked)",
            "Round 2: Final evaluation (MVP ready + presentation)",
            "Present to judges",
        ],
    },
    {
        time: "8:00 PM – 9:00 PM",
        title: "Dinner",
        desc: "Wind down with dinner while judges deliberate on the final results.",
        icon: "utensils",
        detail: "Enjoy dinner while the judges finalize their evaluations. This is a great time to reflect on what you built, share experiences with other teams, and celebrate the effort — regardless of the outcome. The winners will be announced shortly!",
        highlights: [
            "Complimentary dinner provided",
            "Judges deliberate on final results",
            "Celebrate your hackathon journey",
        ],
    },
    {
        time: "9:00 PM – 9:30 PM",
        title: "Valedictory & Closing Ceremony",
        desc: "Prizes, certificates, vouchers, and swag distribution.",
        icon: "award",
        detail: "The grand finale! Winners are announced: 1st Prize (₹10,000 + Goodies), 2nd Prize (₹6,000 + Goodies), 3rd Prize (₹4,000 + Goodies), and the special Best Use of Google Gemini prize. All participants receive certificates, stickers, and vouchers. What a day!",
        highlights: [
            "🥇 1st Prize: ₹10,000 + Goodies",
            "🥈 2nd Prize: ₹6,000 + Goodies",
            "🥉 3rd Prize: ₹4,000 + Goodies",
            "✨ Special: Best Use of Google Gemini",
            "Certificates & vouchers for all",
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
document
    .getElementById("agenda-modal-bg")
    .addEventListener("click", closeAgendaModal);

// Close modals on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAgendaModal();
        // Close reg modal too
        gsap.to(modalContent, {
            scale: 0.95, opacity: 0, y: 10, duration: 0.3, ease: "power2.in",
        });
        gsap.to(modal, {
            opacity: 0, duration: 0.3, delay: 0.2,
            onComplete: () => {
                modal.classList.add("pointer-events-none");
                document.body.style.overflow = "auto";
            },
        });
    }
});

// --- INTERACTIVE CONTRIBUTION GRAPH (Hackathon Section) ---
const gridContainer = document.getElementById("interactive-grid");
const levels = ["", "lvl-1", "lvl-2", "lvl-3", "lvl-4", "purple"];

for (let i = 0; i < 30; i++) {
    const cell = document.createElement("div");
    if (Math.random() > 0.5) {
        const randomLvl = levels[Math.floor(Math.random() * levels.length)];
        if (randomLvl) cell.classList.add(randomLvl);
    }
    cell.classList.add("contrib-cell");

    cell.addEventListener("click", function () {
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
            if (nextClass === "purple") this.classList.add("animate-pulse");
            else this.classList.remove("animate-pulse");
        } else {
            this.classList.remove("animate-pulse");
        }
    });
    gridContainer.appendChild(cell);
}

// --- TERMINAL TYPEWRITER EFFECT ---
function startTerminalTypewriter() {
    const terminalEl = document.getElementById("terminal-typewriter");
    const lines = [
        `> Loading dependencies... <span class="text-ghGreen4">[OK]</span>`,
        `> Injecting semantic logic... <span class="text-ghGreen4">[OK]</span>`,
        `> Ready to build.`,
    ];

    let lineIndex = 0;
    terminalEl.innerHTML = "";

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

function initScrollAnimations() {
    // About section
    gsap.from(".gs-about-card", {
        scrollTrigger: { trigger: "#about", start: "top 80%" },
        y: 40,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
    });

// Registration section
gsap.from(".gs-reg-step", {
    scrollTrigger: { trigger: "#registration", start: "top 80%" },
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
});

gsap.from(".gs-reg-info", {
    scrollTrigger: { trigger: "#registration", start: "top 60%" },
    y: 30,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
});

// Agenda section
gsap.from(".gs-agenda-card", {
    scrollTrigger: { trigger: "#agenda", start: "top 80%" },
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
});

// Hackathon section
gsap.from(".gs-hackathon > div", {
    scrollTrigger: { trigger: "#hackathon", start: "top 80%" },
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
});

// Prizes section
gsap.from(".gs-prize-card", {
    scrollTrigger: { trigger: "#prizes", start: "top 80%" },
    y: 60,
    scale: 0.9,
    duration: 0.8,
    stagger: 0.12,
    ease: "back.out(1.2)",
});

gsap.from(".gs-perk-card", {
    scrollTrigger: { trigger: "#prizes", start: "top 60%" },
    y: 30,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
});

// Judging section
gsap.from(".gs-judging-card", {
    scrollTrigger: { trigger: "#judging", start: "top 80%" },
    y: 40,
    scale: 0.95,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out",
});

gsap.from(".gs-judging-info", {
    scrollTrigger: { trigger: "#judging", start: "top 60%" },
    y: 30,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
});

// Ideation section
gsap.from(".gs-ideation > div", {
    scrollTrigger: { trigger: "#ideation", start: "top 80%" },
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
});

// Contact section
gsap.from(".gs-contact-card", {
    scrollTrigger: { trigger: "#contact", start: "top 80%" },
    y: 30,
    scale: 0.95,
    duration: 0.6,
    stagger: 0.1,
    ease: "power3.out",
});
}

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

    try {
        const result = await fetchWithRetry("api/v1/chatbot/response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                varStack: stack,
                varTheme: theme,
            }),
        });

        if (!result.success) {
            throw new Error(
                result.message || "API returned unsuccessful response",
            );
        }

        const text = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            elRes.textContent = `> CONNECTION ESTABLISHED\n> RECEIVING SCHEMATIC...\n\n${text}`;
        } else {
            throw new Error("Invalid response format");
        }
    } catch (err) {
        elErr.textContent = `> SYS_ERR: ${err.message || "Connection to cognitive core severed. Retry sequence recommended."}`;
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

// --- SMOOTH SCROLL ---
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#") return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});
