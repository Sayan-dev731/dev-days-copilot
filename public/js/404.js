lucide.createIcons();

function initConfettiExplosion(x, y) {
    const dotCount = gsap.utils.random(10, 20, 1);
    // Updated Confetti to GitHub Brand Colors
    const colors = ["#0FBF3E", "#088728", "#8534F3", "#3094FF", "#ffffff"];
    const container = document.querySelector("[data-minigame-init]");

    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        container.appendChild(dot);

        gsap.set(dot, {
            left: `${x}px`,
            top: `${y}px`,
            scale: 0,
            backgroundColor: gsap.utils.random(colors),
        });

        gsap.timeline({ onComplete: () => dot.remove() })
            .to(dot, {
                scale: gsap.utils.random(0.3, 1),
                duration: 0.3,
                ease: "power3.out",
            })
            .to(
                dot,
                {
                    duration: 2,
                    physics2D: {
                        velocity: gsap.utils.random(500, 1000),
                        angle: gsap.utils.random(0, 360),
                        gravity: 500,
                    },
                    autoAlpha: 0,
                    ease: "none",
                },
                "<",
            );
    }
}

function init404Minigame() {
    const CONFIG = {
        dragToVelocityRatio: 0.01,
        inertiaResistance: 20,
        pullReset: { duration: 0.8, ease: "elastic.out(1,0.5)" },
        rocketFadeOut: { duration: 0.5 },
        maxSpeed: 2000,
        flyMinDuration: 1.5,
        flyMaxDuration: 3,
        flyRotateDuration: 1,
    };

    const container = document.querySelector("[data-minigame-init]");
    const pull = container.querySelector("[data-minigame-pull]");
    const rocket = container.querySelector("[data-minigame-rocket]");
    const line = container.querySelector("[data-minigame-line]");
    const statusEl = container.querySelector("[data-minigame-status]");
    const scoreTimeSpan = container.querySelector("[data-minigame-score-time]");
    const resetButton = container.querySelector("[data-minigame-reset]");
    const flies = Array.from(container.querySelectorAll("[data-minigame-fly]"));

    let dragStart,
        rocketTween,
        isFlying = false;
    let containerRect, origin;
    let startTime = null;

    const rawTargets = [
        ...container.querySelectorAll("[data-minigame-target]"),
        ...flies,
    ];
    const allTargets = rawTargets.filter(
        (el) => el && window.getComputedStyle(el).display !== "none",
    );
    const totalTargets = allTargets.length;
    const hitTargets = new Set();
    const flyTweens = new Map();

    function resetGame() {
        hitTargets.clear();
        allTargets.forEach((el) => {
            el.style.visibility = "";
            el.style.opacity = "";
            el.style.pointerEvents = "";
        });

        gsap.set(allTargets, { scale: 1, clearProps: "transform" });

        startTime = null;
        statusEl.setAttribute("data-minigame-status", "ready");
        scoreTimeSpan.textContent = "0.00";

        gsap.set([pull, rocket, line], {
            clearProps: "all",
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0,
        });

        isFlying = false;
        if (rocketTween) rocketTween.kill();

        containerRect = container.getBoundingClientRect();

        flies.forEach((fly) => {
            if (flyTweens.has(fly)) flyTweens.get(fly).kill();

            const maxX = containerRect.width - fly.offsetWidth;
            const maxY = containerRect.height - fly.offsetHeight;
            const startX = gsap.utils.random(0, maxX);
            const startY = gsap.utils.random(0, maxY);

            gsap.set(fly, { clearProps: "x,y,rotation" });
            fly.style.left = `${startX}px`;
            fly.style.top = `${startY}px`;
            fly.style.transform = "rotate(0deg)";

            moveFly(fly);
        });
    }

    resetButton.addEventListener("click", resetGame);
    resetGame();

    function moveFly(fly) {
        const maxX = containerRect.width - fly.offsetWidth;
        const maxY = containerRect.height - fly.offsetHeight;
        const newX = gsap.utils.random(0, maxX);
        const newY = gsap.utils.random(0, maxY);

        const cur = fly.getBoundingClientRect();
        const curX = cur.left - containerRect.left;
        const curY = cur.top - containerRect.top;
        const dx = newX - curX;
        const dy = newY - curY;
        const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

        gsap.to(fly, {
            rotation: targetAngle,
            duration: CONFIG.flyRotateDuration,
            ease: "elastic.out(1,0.75)",
        });

        const tween = gsap.to(fly, {
            left: `${newX}px`,
            top: `${newY}px`,
            duration: gsap.utils.random(
                CONFIG.flyMinDuration,
                CONFIG.flyMaxDuration,
            ),
            ease: "power1.inOut",
            onComplete: () => moveFly(fly),
        });
        flyTweens.set(fly, tween);
    }

    function rectsOverlap(r1, r2) {
        return !(
            r2.left > r1.right ||
            r2.right < r1.left ||
            r2.top > r1.bottom ||
            r2.bottom < r1.top
        );
    }

    function onRocketUpdate() {
        const rRect = rocket.getBoundingClientRect();
        const cRect = containerRect;
        if (
            rRect.right < cRect.left ||
            rRect.left > cRect.right ||
            rRect.bottom < cRect.top ||
            rRect.top > cRect.bottom
        ) {
            rocketTween.kill();
            isFlying = false;
            gsap.set(rocket, { opacity: 0 });
            return;
        }
        for (let t of allTargets) {
            if (hitTargets.has(t)) continue;
            const tRect = t.getBoundingClientRect();
            if (rectsOverlap(rRect, tRect)) {
                hitTargets.add(t);
                if (flies.includes(t) && flyTweens.has(t))
                    flyTweens.get(t).kill();
                explodeTarget(t, tRect);
                onHit();
                break;
            }
        }
    }

    function onHit() {
        if (hitTargets.size === totalTargets) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            statusEl.setAttribute("data-minigame-status", "finished");
            scoreTimeSpan.textContent = elapsed;
        }
    }

    function explodeTarget(el, tRect) {
        gsap.to(el, {
            scale: 0.95,
            opacity: 0.1,
            duration: 0.2,
            pointerEvents: "none",
        });
        const cx = tRect.left + tRect.width / 2 + window.scrollX;
        const cy = tRect.top + tRect.height / 2 + window.scrollY;
        initConfettiExplosion(cx, cy);
    }

    Draggable.create(pull, {
        type: "x,y",
        bounds: container,

        onPress() {
            if (isFlying) return this.endDrag();
            if (!startTime) {
                startTime = Date.now();
                statusEl.setAttribute("data-minigame-status", "running");
            }
            if (rocketTween) {
                rocketTween.kill();
                isFlying = false;
            }
            gsap.set(rocket, {
                clearProps: "all",
                x: 0,
                y: 0,
                opacity: 0,
                rotation: 0,
            });

            containerRect = container.getBoundingClientRect();
            this.hasDraggedEnough = false;

            const rb = rocket.getBoundingClientRect();
            origin = {
                x: rb.left + rb.width / 2 - containerRect.left,
                y: rb.top + rb.height / 2 - containerRect.top,
            };

            Object.assign(line.style, {
                left: `${origin.x}px`,
                top: `${origin.y}px`,
                width: "0px",
                transform: "rotate(0deg)",
                transformOrigin: "0 50%",
                opacity: "0",
            });

            const pr = pull.getBoundingClientRect();
            dragStart = {
                x: pr.left + pr.width / 2,
                y: pr.top + pr.height / 2,
            };
            pull.classList.add("is--drag");
            pull.style.cursor = "grabbing";
        },

        onDrag() {
            const pr = pull.getBoundingClientRect();
            const px = pr.left + pr.width / 2 - containerRect.left;
            const py = pr.top + pr.height / 2 - containerRect.top;
            const dx = px - origin.x,
                dy = py - origin.y;
            const len = Math.hypot(dx, dy);
            if (len >= 24) this.hasDraggedEnough = true;

            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            line.style.width = `${len}px`;
            line.style.transform = `rotate(${ang}deg)`;
            line.style.opacity = "1";
            gsap.set(pull, { rotation: ang - 90 });
        },

        onRelease() {
            pull.style.cursor = "grab";
            pull.classList.remove("is--drag");

            if (!this.hasDraggedEnough || isFlying) {
                gsap.to(pull, {
                    x: 0,
                    y: 0,
                    rotate: 0,
                    ...CONFIG.pullReset,
                });
                gsap.to(line, { opacity: 0, duration: 0.2 });
                return;
            }

            gsap.to(line, { opacity: 0, duration: 0.2 });

            const pr = pull.getBoundingClientRect();
            const dx0 = dragStart.x - (pr.left + pr.width / 2);
            const dy0 = dragStart.y - (pr.top + pr.height / 2);
            const avg = (containerRect.width + containerRect.height) / 2;
            const scale = CONFIG.dragToVelocityRatio * avg;
            let vx = dx0 * scale,
                vy = dy0 * scale;
            const speed = Math.hypot(vx, vy);
            if (speed > CONFIG.maxSpeed) {
                const f = CONFIG.maxSpeed / speed;
                vx *= f;
                vy *= f;
            }

            const launchAngle = (Math.atan2(vy, vx) * 180) / Math.PI;
            gsap.set(rocket, { rotation: launchAngle + 90 });
            gsap.to(pull, {
                x: 0,
                y: 0,
                rotate: 0,
                ...CONFIG.pullReset,
            });
            gsap.set(rocket, { x: 0, y: 0, opacity: 1 });
            isFlying = true;

            rocketTween = gsap.to(rocket, {
                inertia: {
                    x: { velocity: vx },
                    y: { velocity: vy },
                    resistance: CONFIG.inertiaResistance,
                },
                onUpdate: onRocketUpdate,
                onComplete: () => {
                    isFlying = false;
                    gsap.to(rocket, {
                        opacity: 0,
                        duration: CONFIG.rocketFadeOut.duration,
                    });
                },
            });
        },
    });
}

window.addEventListener("load", () => {
    gsap.registerPlugin(Draggable, InertiaPlugin, Physics2DPlugin);
    setTimeout(init404Minigame, 500);
});
