// Users Management Frontend Logic

const API_BASE = "/api/v1";

// DOM Elements
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Users List Elements
const searchUsersInput = document.getElementById("search-users");
const usersTableBody = document.getElementById("users-table-body");
const usersMobileList = document.getElementById("users-mobile-list");
const usersLoading = document.getElementById("users-loading");

// Add User Elements
const addUserForm = document.getElementById("add-user-form");
const addUserError = document.getElementById("add-user-error");
const addUserSuccess = document.getElementById("add-user-success");

// QR Scanner Elements
const qrVideo = document.getElementById("qr-video");
const startCameraBtn = document.getElementById("start-camera-btn");
const stopCameraBtn = document.getElementById("stop-camera-btn");
const scannerUserSection = document.getElementById("scanner-user-section");
const scannerNoUser = document.getElementById("scanner-no-user");
const scannerUserName = document.getElementById("scanner-user-name");
const scannerUserEmail = document.getElementById("scanner-user-email");
const scannerMealsLeft = document.getElementById("scanner-meals-left");
const scannerMealOptions = document.getElementById("scanner-meal-options");
const confirmRemoveBtn = document.getElementById("confirm-remove-btn");
const viewQRCodeBtn = document.getElementById("view-qr-code-btn");
const scannerError = document.getElementById("scanner-error");
const scannerSuccess = document.getElementById("scanner-success");
const scanningIndicator = document.getElementById("scanning-indicator");

// Statistics Elements
const statTotalUsers = document.getElementById("stat-total-users");
const statWithMeals = document.getElementById("stat-with-meals");
const statMealsUsed = document.getElementById("stat-meals-used");
const refreshStatsBtn = document.getElementById("refresh-stats-btn");

// QR Modal Elements
const qrModal = document.getElementById("qr-modal");
const closeQRModal = document.getElementById("close-qr-modal");
const qrCodeContainer = document.getElementById("qr-code-container");
const downloadQRBtn = document.getElementById("download-qr-btn");
const qrModalTitle = document.getElementById("qr-modal-title");
const qrModalInfo = document.getElementById("qr-modal-info");

// Other Elements
const logoutBtn = document.getElementById("logout-users-btn");

// Global Variables
let allUsers = [];
let filteredUsers = [];
let currentScannedUser = null;
let selectedMealType = null;
let scanner = null;
let cameraActive = false;

// Initialize Lucide Icons
if (typeof lucide !== "undefined") {
    lucide.createIcons();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function apiCall(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    // Add auth token
    const token = localStorage.getItem("accessToken");
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "API request failed");
        }

        return result;
    } catch (error) {
        throw error;
    }
}

function showError(elementId, message, duration = 5000) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        errorEl.classList.add("animate-slide-in-down");
        setTimeout(() => {
            errorEl.classList.remove("animate-slide-in-down");
            errorEl.classList.add("animate-fade-out");
            setTimeout(() => {
                errorEl.classList.remove("animate-fade-out");
                errorEl.classList.add("hidden");
            }, 300);
        }, duration);
    }
}

function showSuccess(elementId, message, duration = 5000) {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove("hidden");
        successEl.classList.add("animate-slide-in-down");
        setTimeout(() => {
            successEl.classList.remove("animate-slide-in-down");
            successEl.classList.add("animate-fade-out");
            setTimeout(() => {
                successEl.classList.remove("animate-fade-out");
                successEl.classList.add("hidden");
            }, 300);
        }, duration);
    }
}

function saveTokens(data) {
    if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
    }
    if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
    }
}

// ============================================================================
// TAB SWITCHING
// ============================================================================

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const tabName = button.getAttribute("data-tab");

        // Hide all tabs
        tabContents.forEach((tab) => {
            tab.classList.add("hidden");
        });

        // Remove active state from all buttons
        tabButtons.forEach((btn) => {
            btn.classList.remove("border-b-2", "border-ghGreen4", "text-white");
            btn.classList.add(
                "border-b-2",
                "border-transparent",
                "text-ghGray4",
            );
        });

        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-content`);
        if (selectedTab) {
            selectedTab.classList.remove("hidden");
        }

        // Set active button
        button.classList.remove("border-transparent", "text-ghGray4");
        button.classList.add("border-ghGreen4", "text-white");

        // Load data when tab is opened
        if (tabName === "users-list") {
            loadAllUsers();
        } else if (tabName === "statistics") {
            loadStatistics();
        }
    });
});

// ============================================================================
// USERS LIST
// ============================================================================

async function loadAllUsers() {
    usersLoading.textContent = "Loading users...";
    usersTableBody.innerHTML = "";
    usersMobileList.innerHTML = "";

    try {
        const response = await apiCall("/users");

        // Extract users from response.data
        allUsers = response.data || [];

        if (allUsers.length > 0) {
        }

        filteredUsers = [...allUsers];
        renderUsers();
    } catch (error) {
        usersLoading.textContent = "Error loading users. Please try again.";
    }
}

function renderUsers() {
    usersLoading.classList.add("hidden");

    if (!filteredUsers || filteredUsers.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-ghGray4">
                    No users found
                </td>
            </tr>
        `;
        usersMobileList.innerHTML = `
            <div class="text-center py-8 text-ghGray4">
                No users found
            </div>
        `;
        return;
    }

    // Desktop Table
    usersTableBody.innerHTML = filteredUsers
        .map((user) => {
            // console.log("Rendering user:", user);
            return `
        <tr class="animate-fade-in">
            <td class="px-4 py-3 text-white font-semibold">${user?.firstName || "N/A"}</td>
            <td class="px-4 py-3 text-ghGray4 text-sm">${user?.email || "N/A"}</td>
            <td class="px-4 py-3 text-ghGray4 text-sm">${user?.githubId || "N/A"}</td>
            <td class="px-4 py-3">
                <span class="badge badge-success">${user?.messAllowancesLeft && Array.isArray(user.messAllowancesLeft) ? user.messAllowancesLeft.length : 0} left</span>
            </td>
            <td class="px-4 py-3 space-x-2">
                <button onClick="showUserQRCode('${user?._id || ""}', '${user?.firstName || "User"}')" class="px-3 py-1 bg-ghPurple hover:bg-purple-600 text-white text-sm rounded transition-colors">
                    QR
                </button>
                <button onClick="editUser('${user?._id || ""}')" class="px-3 py-1 bg-ghGreen4 hover:bg-ghGreen5 text-white text-sm rounded transition-colors">
                    Edit
                </button>
                <button onClick="deleteUserConfirm('${user?._id || ""}', '${user?.firstName || "User"}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                    Delete
                </button>
            </td>
        </tr>
    `;
        })
        .join("");

    // Mobile Cards
    usersMobileList.innerHTML = filteredUsers
        .map(
            (user) => `
        <div class="bg-ghGray8 border-2 border-ghGray8 rounded-lg p-4 user-mobile-card animate-fade-in">
            <div class="mb-2">
                <h3 class="text-white font-semibold">${user?.firstName || "N/A"}</h3>
                <p class="text-ghGray4 text-sm">${user?.email || "N/A"}</p>
                <p class="text-ghGray4 text-sm">@${user?.githubId || "N/A"}</p>
            </div>
            <div class="mb-4">
                <span class="badge badge-success">${user?.messAllowancesLeft && Array.isArray(user.messAllowancesLeft) ? user.messAllowancesLeft.length : 0} meals left</span>
            </div>
            <div class="space-y-2">
                <button onClick="showUserQRCode('${user?._id || ""}', '${user?.firstName || "User"}')" class="w-full px-3 py-2 bg-ghPurple hover:bg-purple-600 text-white text-sm rounded transition-colors font-semibold">
                    Show QR Code
                </button>
                <div class="flex gap-2">
                    <button onClick="editUser('${user?._id || ""}')" class="flex-1 px-3 py-2 bg-ghGreen4 hover:bg-ghGreen5 text-white text-sm rounded transition-colors font-semibold">
                        Edit
                    </button>
                    <button onClick="deleteUserConfirm('${user?._id || ""}', '${user?.firstName || "User"}')" class="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors font-semibold">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `,
        )
        .join("");

    // Re-initialize lucide icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

// Search Users
searchUsersInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    filteredUsers = allUsers.filter(
        (user) =>
            (user.firstName?.toLowerCase() || "").includes(query) ||
            (user.email?.toLowerCase() || "").includes(query) ||
            (user.githubId?.toLowerCase() || "").includes(query),
    );
    renderUsers();
});

// ============================================================================
// ADD USER
// ============================================================================

addUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const email = document.getElementById("email").value;
    const githubId = document.getElementById("githubId").value;
    const phone = document.getElementById("phone").value;
    const messPlan = document.getElementById("messPlan").value;

    try {
        const response = await apiCall("/users/add", "POST", {
            firstName,
            email,
            githubId,
            phone,
            messPlan,
        });

        showSuccess(
            "add-user-success",
            `User "${firstName}" created successfully!`,
        );
        addUserForm.reset();
        await loadAllUsers();

        // Switch to users list tab
        document.getElementById("tab-users-list").click();
    } catch (error) {
        showError("add-user-error", error.message || "Failed to create user");
    }
});

// ============================================================================
// EDIT & DELETE USER
// ============================================================================

function editUser(userId) {
    const user = allUsers.find((u) => u._id === userId);

    if (user) {
        document.getElementById("firstName").value = user.firstName || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("githubId").value = user.githubId || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("messPlan").value = user.messPlan || "Standard";
        document.getElementById("tab-add-user").click();
        window.scrollTo(0, 0);
    } else {
        alert("User not found in list. Please refresh and try again.");
    }
}

function deleteUserConfirm(userId, userName) {
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
        deleteUser(userId);
    }
}

async function deleteUser(userId) {
    try {
        await apiCall(`/users/${userId}`, "DELETE");
        showSuccess("add-user-success", "User deleted successfully!");
        await loadAllUsers();
    } catch (error) {
        showError("add-user-error", error.message || "Failed to delete user");
    }
}

// ============================================================================
// QR CODE DISPLAY
// ============================================================================

function showUserQRCode(userId, userName) {
    const user = allUsers.find((u) => u._id === userId);

    if (!user) {
        alert("User not found. Please refresh the page and try again.");
        return;
    }

    qrModalTitle.textContent = `${userName || user.firstName} - QR Code`;
    qrModalInfo.textContent = `User ID: ${user._id}`;

    // Clear previous QR code
    qrCodeContainer.innerHTML = "";

    // Generate new QR code
    new QRCode(qrCodeContainer, {
        text: user.qrCode || user._id,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
    });

    qrModal.classList.remove("hidden");

    // Store current user for download
    window.currentQRUser = {
        id: user._id,
        name: userName,
        qrCode: user.qrCode || user._id,
    };
}

closeQRModal.addEventListener("click", () => {
    qrModal.classList.add("hidden");
    qrCodeContainer.innerHTML = "";
});

qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) {
        qrModal.classList.add("hidden");
        qrCodeContainer.innerHTML = "";
    }
});

downloadQRBtn.addEventListener("click", () => {
    if (!window.currentQRUser) return;

    const canvas = qrCodeContainer.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${window.currentQRUser.name}-qr-code.png`;
    link.click();
});

// ============================================================================
// CAMERA PERMISSIONS HELPER
// ============================================================================

/**
 * Check if camera access is available on this device/browser
 */
async function checkCameraPermissions() {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return {
                available: false,
                reason: "Browser does not support camera access",
            };
        }

        // Try to enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
            (device) => device.kind === "videoinput",
        );

        if (videoDevices.length === 0) {
            return {
                available: false,
                reason: "No camera device found",
            };
        }

        // Check permission status if available
        if (navigator.permissions?.query) {
            const permissionStatus = await navigator.permissions.query({
                name: "camera",
            });

            return {
                available: permissionStatus.state !== "denied",
                reason:
                    permissionStatus.state === "denied"
                        ? "Camera permission denied in browser settings"
                        : null,
                status: permissionStatus.state,
            };
        }

        return {
            available: true,
            reason: null,
            foundDevices: videoDevices.length,
        };
    } catch (error) {
        return {
            available: false,
            reason: error.message,
        };
    }
}

// ============================================================================
// QR SCANNER
// ============================================================================

startCameraBtn.addEventListener("click", async () => {
    if (cameraActive) return;

    try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError(
                "scanner-error",
                "Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge.",
            );
            return;
        }

        // Try to access camera with fallback options
        let stream;
        try {
            // First try: environment camera (rear camera on mobile)
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
        } catch {
            // Fallback: any camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
        }

        qrVideo.srcObject = stream;
        cameraActive = true;

        startCameraBtn.classList.add("hidden");
        stopCameraBtn.classList.remove("hidden");

        // Start QR scanning after a small delay to ensure video is ready
        setTimeout(() => {
            startQRScanning();
        }, 500);
    } catch (error) {
        // Provide specific error messages
        let errorMessage = "Camera access denied or unavailable";

        if (error.name === "NotAllowedError") {
            errorMessage =
                "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (error.name === "NotFoundError") {
            errorMessage =
                "No camera device found. Please check your device has a camera.";
        } else if (error.name === "NotReadableError") {
            errorMessage = "Camera is already in use by another application.";
        } else if (error.name === "SecurityError") {
            errorMessage =
                "Camera access is not allowed due to security restrictions. Use HTTPS or localhost.";
        } else if (error.name === "PermissionDeniedError") {
            errorMessage =
                "Camera permission denied. Check browser permissions for this site.";
        }

        showError("scanner-error", errorMessage);
    }
});

stopCameraBtn.addEventListener("click", () => {
    // Stop QR scanning first
    stopQRScanning();

    // Stop video stream
    if (qrVideo.srcObject) {
        const tracks = qrVideo.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        qrVideo.srcObject = null;
    }

    cameraActive = false;
    startCameraBtn.classList.remove("hidden");
    stopCameraBtn.classList.add("hidden");
});

// QR Scan debounce to prevent duplicate scans
let lastScannedQR = null;
let lastScanTime = 0;
const SCAN_DEBOUNCE_MS = 2000; // Prevent scanning the same QR within 2 seconds

// Overlay elements for scanning
const scanOverlay = document.getElementById("qr-scan-overlay");
let scanAnimationId = null;
let scanLinePosition = 0;

function drawScanFrame() {
    if (!qrVideo || qrVideo.videoWidth === 0) {
        // Video not ready yet, retry
        if (cameraActive) {
            setTimeout(drawScanFrame, 100);
        }
        return;
    }

    const canvas = scanOverlay;
    if (!canvas) return;

    canvas.width = qrVideo.videoWidth;
    canvas.height = qrVideo.videoHeight;
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d");
    const frameWidth = Math.min(canvas.width * 0.8, 300);
    const frameHeight = frameWidth;
    const frameX = (canvas.width - frameWidth) / 2;
    const frameY = (canvas.height - frameHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear scanning frame area
    ctx.clearRect(frameX, frameY, frameWidth, frameHeight);

    // Draw red frame border
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);

    // Draw corner brackets
    const cornerSize = 20;
    const corners = [
        // Top-left
        [
            [frameX, frameY + cornerSize],
            [frameX, frameY],
            [frameX + cornerSize, frameY],
        ],
        // Top-right
        [
            [frameX + frameWidth - cornerSize, frameY],
            [frameX + frameWidth, frameY],
            [frameX + frameWidth, frameY + cornerSize],
        ],
        // Bottom-left
        [
            [frameX + frameWidth, frameY + frameHeight - cornerSize],
            [frameX + frameWidth, frameY + frameHeight],
            [frameX + frameWidth - cornerSize, frameY + frameHeight],
        ],
        // Bottom-right
        [
            [frameX, frameY + frameHeight - cornerSize],
            [frameX, frameY + frameHeight],
            [frameX + cornerSize, frameY + frameHeight],
        ],
    ];

    corners.forEach((corner) => {
        ctx.beginPath();
        ctx.moveTo(corner[0][0], corner[0][1]);
        ctx.lineTo(corner[1][0], corner[1][1]);
        ctx.lineTo(corner[2][0], corner[2][1]);
        ctx.stroke();
    });

    // Draw animated red scanning line
    scanLinePosition = (scanLinePosition + 2) % frameHeight;
    const lineY = frameY + scanLinePosition;

    // Glow effect for line
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw scanning line
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frameX, lineY);
    ctx.lineTo(frameX + frameWidth, lineY);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";

    // Continue animation
    if (cameraActive) {
        scanAnimationId = requestAnimationFrame(drawScanFrame);
    }
}

function startQRScanning() {
    // Load jsQR library
    if (typeof jsQR === "undefined") {
        const jsQRScript = document.createElement("script");
        jsQRScript.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
        jsQRScript.onload = () => {
            initializeQRScanner();
        };
        jsQRScript.onerror = () => {
            // Fallback to html5-qrcode
            loadHtml5Qrcode();
        };
        document.head.appendChild(jsQRScript);
    } else {
        initializeQRScanner();
    }
}

function loadHtml5Qrcode() {
    const html5Script = document.createElement("script");
    html5Script.src =
        "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.4/dist/html5-qrcode.min.js";
    html5Script.onload = () => {
        initializeHtml5QrcodeScanner();
    };
    html5Script.onerror = () => {
        showError(
            "scanner-error",
            "Failed to load QR scanner. Please refresh and try again.",
        );
    };
    document.head.appendChild(html5Script);
}

function initializeQRScanner() {
    try {
        // Start drawing the scan frame
        drawScanFrame();

        // Start continuous scanning from video
        let isScanning = true;

        function scanFrame() {
            if (!isScanning || !cameraActive) return;

            const canvas = document.createElement("canvas");
            canvas.width = qrVideo.videoWidth;
            canvas.height = qrVideo.videoHeight;

            if (canvas.width === 0 || canvas.height === 0) {
                // Video not ready yet
                requestAnimationFrame(scanFrame);
                return;
            }

            const ctx = canvas.getContext("2d");
            ctx.drawImage(qrVideo, 0, 0);

            try {
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    handleQRDecode(code.data);
                }
            } catch (error) {
                // Continue scanning on error
            }

            requestAnimationFrame(scanFrame);
        }

        scanFrame();

        if (scanningIndicator) {
            scanningIndicator.classList.remove("hidden");
        }
    } catch (error) {
        showError("scanner-error", "QR Scanner error: " + error.message);
    }
}

function initializeHtml5QrcodeScanner() {
    try {
        scanner = new Html5Qrcode("qr-video", {
            formFactor: "portrait",
        });

        if (scanOverlay) {
            scanOverlay.style.display = "none";
        }

        const config = {
            fps: 30,
            qrbox: { width: 250, height: 250 },
        };

        scanner
            .start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    handleQRDecode(decodedText);
                },
                (error) => {
                    // Silently continue
                },
            )
            .then(() => {
                if (scanningIndicator) {
                    scanningIndicator.classList.remove("hidden");
                }
            })
            .catch((error) => {
                showError(
                    "scanner-error",
                    "Failed to start scanner. Try stopping and restarting.",
                );
            });
    } catch (error) {
        showError("scanner-error", "Scanner error: " + error.message);
    }
}

// Stop QR scanning
function stopQRScanning() {
    // Stop canvas animation
    if (scanAnimationId) {
        cancelAnimationFrame(scanAnimationId);
        scanAnimationId = null;
    }

    // Hide overlay
    if (scanOverlay) {
        scanOverlay.style.display = "none";
    }

    // Stop html5-qrcode scanner if running
    if (scanner) {
        scanner
            .stop()
            .then(() => {
                scanner = null;
            })
            .catch((error) => {
                scanner = null;
            });
    }

    // Hide scanning indicator
    if (scanningIndicator) {
        scanningIndicator.classList.add("hidden");
    }
}

// Fallback: Manual QR detection using canvas
async function handleQRDecode(qrData) {
    // Debounce: Skip if same QR scanned recently
    const now = Date.now();
    if (lastScannedQR === qrData && now - lastScanTime < SCAN_DEBOUNCE_MS) {
        return;
    }

    lastScannedQR = qrData;
    lastScanTime = now;

    try {
        // Try to find user by QR code
        const response = await apiCall("/users/qr-scan", "POST", {
            qrCode: qrData,
        });

        currentScannedUser = response.data;

        // STOP CAMERA IMMEDIATELY after successful scan
        stopQRScanning();
        if (qrVideo.srcObject) {
            const tracks = qrVideo.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            qrVideo.srcObject = null;
        }
        cameraActive = false;
        startCameraBtn.classList.remove("hidden");
        stopCameraBtn.classList.add("hidden");

        displayScannedUserInfo();
        showSuccess(
            "scanner-success",
            `✅ User found: ${currentScannedUser.firstName}!`,
            2000,
        );
    } catch (error) {
        showError(
            "scanner-error",
            `Error: ${error.message || "User not found. Please try again."}`,
            3000,
        );
        currentScannedUser = null;
        displayScannedUserInfo();
    }
}

function displayScannedUserInfo() {
    if (currentScannedUser) {
        scannerUserName.textContent = currentScannedUser.firstName;
        scannerUserEmail.textContent = currentScannedUser.email;

        // Display meals left with animations
        const mealsLeft = currentScannedUser.messAllowancesLeft || [];
        if (Array.isArray(mealsLeft) && mealsLeft.length > 0) {
            scannerMealsLeft.innerHTML = mealsLeft
                .map(
                    (meal) =>
                        `<span class="px-3 py-1 bg-ghGreen4/20 border border-ghGreen4 text-ghGreen4 rounded-lg text-sm font-semibold animate-pulse">
                            ✓ ${meal}
                        </span>`,
                )
                .join("");
        } else {
            scannerMealsLeft.innerHTML =
                '<span class="text-red-500 font-bold">❌ No meals left - All used!</span>';
            console.log("⚠️  No meals available for this user");
        }

        // Reset meal selection
        selectedMealType = null;
        updateMealSelection();

        scannerUserSection.classList.remove("hidden");
        scannerNoUser.classList.add("hidden");
    } else {
        scannerUserSection.classList.add("hidden");
        scannerNoUser.classList.remove("hidden");
        selectedMealType = null;
    }
}

// Meal Selection
document.querySelectorAll(".meal-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        selectedMealType = btn.getAttribute("data-meal");

        // Check if meal is available
        const mealsAvailable = currentScannedUser?.messAllowancesLeft || [];
        if (!mealsAvailable.includes(selectedMealType)) {
            showError(
                "scanner-error",
                `${selectedMealType} not available`,
                3000,
            );
            selectedMealType = null;
            updateMealSelection();
            return;
        }

        updateMealSelection();
    });
});

function updateMealSelection() {
    document.querySelectorAll(".meal-option-btn").forEach((btn) => {
        const meal = btn.getAttribute("data-meal");
        if (selectedMealType === meal) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }

        // Disable if not available
        const mealsAvailable = currentScannedUser?.messAllowancesLeft || [];
        if (!mealsAvailable.includes(meal)) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });

    confirmRemoveBtn.disabled = !selectedMealType;
}

confirmRemoveBtn.addEventListener("click", async () => {
    if (!currentScannedUser || !selectedMealType) return;

    // Store the meal name before it gets cleared
    const removedMealType = selectedMealType;

    try {
        const response = await apiCall("/users/meal/remove", "POST", {
            userId: currentScannedUser._id,
            mealType: removedMealType,
        });

        currentScannedUser = response.data;
        displayScannedUserInfo();
        showSuccess(
            "scanner-success",
            `✓ ${removedMealType} removed successfully!`,
            4000,
        );
    } catch (error) {
        showError("scanner-error", error.message || "Failed to update meal");
    }
});

viewQRCodeBtn.addEventListener("click", () => {
    if (currentScannedUser) {
        showUserQRCode(currentScannedUser._id, currentScannedUser.firstName);
    }
});

// ============================================================================
// STATISTICS
// ============================================================================

async function loadStatistics() {
    try {
        const response = await apiCall("/users/stats");
        const stats = response.data;

        statTotalUsers.textContent = stats.totalUsers || 0;
        statWithMeals.textContent = stats.usersWithMeals || 0;

        // Calculate meals used
        const mealsUsedData = stats.mealsUsedToday || [];
        const mealsUsed =
            mealsUsedData.length > 0 ? mealsUsedData[0].totalMealsUsed || 0 : 0;
        statMealsUsed.textContent = mealsUsed;
    } catch (error) {}
}

refreshStatsBtn.addEventListener("click", () => {
    loadStatistics();
});

// ============================================================================
// LOGOUT
// ============================================================================

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "admin.html";
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Make functions globally accessible for onclick handlers
window.editUser = editUser;
window.deleteUserConfirm = deleteUserConfirm;
window.showUserQRCode = showUserQRCode;
window.deleteUser = deleteUser;
window.loadAllUsers = loadAllUsers;
window.checkCameraPermissions = checkCameraPermissions;

// Check authentication
function checkAuth() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "admin.html";
    }
}

// Initial load
checkAuth();
loadAllUsers();

// Auto-refresh users every 30 seconds
setInterval(() => {
    if (
        !document
            .getElementById("add-user-content")
            .classList.contains("hidden")
    ) {
        // Only refresh if on users list tab
    }
}, 30000);
