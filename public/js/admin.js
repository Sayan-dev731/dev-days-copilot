// Admin Dashboard Frontend Logic

const API_BASE = "/api/v1/auth/admin";

// DOM Elements
const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("dashboard-container");
const passwordChangeModal = document.getElementById("password-change-modal");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const firstPasswordChangeForm = document.getElementById(
    "first-password-change-form",
);
const loginToggle = document.getElementById("login-toggle");
const signupToggle = document.getElementById("signup-toggle");
const logoutBtn = document.getElementById("logout-btn");
const changePasswordForm = document.getElementById("change-password-form");

// Initialize Lucide Icons
lucide.createIcons();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function apiCall(endpoint, method = "POST", data = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    // Add auth token to request if available
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

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => {
            errorEl.classList.add("hidden");
        }, 5000);
    }
}

function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove("hidden");
        setTimeout(() => {
            successEl.classList.add("hidden");
        }, 5000);
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

function getStoredToken() {
    return localStorage.getItem("accessToken");
}

function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("tempPassword");
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

function showPasswordChangeModal(tempPassword) {
    // Store temp password for use in modal form
    localStorage.setItem("tempPassword", tempPassword);
    passwordChangeModal.classList.remove("hidden");
    document.getElementById("first-old-password").value = tempPassword;
}

function hidePasswordChangeModal() {
    passwordChangeModal.classList.add("hidden");
    firstPasswordChangeForm.reset();
    document.getElementById("modal-password-error").classList.add("hidden");
}

// ============================================================================
// AUTHENTICATION FLOWS
// ============================================================================

// Form Toggle Functions
signupToggle.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    lucide.createIcons();
});

loginToggle.addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    lucide.createIcons();
});

// Login Form Handler
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");
    const btnText = document.getElementById("login-btn-text");
    const btnSpinner = document.getElementById("login-btn-spinner");
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    // Reset error
    errorEl.classList.add("hidden");

    // Validate inputs
    if (!username || !password) {
        showError("login-error", "Please enter both username and password");
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = "Signing in...";
    btnSpinner.classList.remove("hidden");

    try {
        const response = await apiCall("/login", "POST", {
            username,
            password,
        });

        // Save tokens
        saveTokens(response.data);
        localStorage.setItem("adminUsername", response.data.user.username);

        // Check if must change password
        if (response.data.isUsingTempPassword) {
            // Hide login, show modal
            loginContainer.classList.add("hidden");
            showPasswordChangeModal(password);
        } else {
            // Load and show dashboard directly
            showDashboard(response.data.user);
        }

        // Clear form
        loginForm.reset();
    } catch (error) {
        showError("login-error", error.message || "Authentication failed");
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Sign In";
        btnSpinner.classList.add("hidden");
    }
});

// Signup Form Handler
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;
    const errorEl = document.getElementById("signup-error");
    const btnText = document.getElementById("signup-btn-text");
    const btnSpinner = document.getElementById("signup-btn-spinner");
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    // Reset error
    errorEl.classList.add("hidden");

    // Validate inputs
    if (!username || !password) {
        showError("signup-error", "Please enter both username and password");
        return;
    }

    if (password.length < 8) {
        showError("signup-error", "Password must be at least 8 characters");
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = "Creating account...";
    btnSpinner.classList.remove("hidden");

    try {
        const response = await apiCall("/signup", "POST", {
            username,
            password,
            confirmPassword: password,
        });

        // Save tokens
        saveTokens(response.data);
        localStorage.setItem("adminUsername", response.data.user.username);

        // Load and show dashboard (no password change needed for signup)
        showDashboard(response.data.user);

        // Clear form
        signupForm.reset();
    } catch (error) {
        showError("signup-error", error.message || "Signup failed");
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Create Account";
        btnSpinner.classList.add("hidden");
    }
});

// First Password Change Handler (Modal - Required on First Login)
firstPasswordChangeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = localStorage.getItem("tempPassword");
    const newPassword = document.getElementById("first-new-password").value;
    const confirmPassword = document.getElementById(
        "first-confirm-password",
    ).value;
    const errorEl = document.getElementById("modal-password-error");
    const btnText = document.getElementById("modal-pwd-btn-text");
    const btnSpinner = document.getElementById("modal-pwd-btn-spinner");
    const submitBtn = firstPasswordChangeForm.querySelector(
        'button[type="submit"]',
    );

    // Reset error
    errorEl.classList.add("hidden");

    // Validate inputs
    if (!newPassword || !confirmPassword) {
        showError("modal-password-error", "Please enter both passwords");
        return;
    }

    if (newPassword !== confirmPassword) {
        showError("modal-password-error", "Passwords do not match");
        return;
    }

    if (newPassword.length < 8) {
        showError(
            "modal-password-error",
            "Password must be at least 8 characters",
        );
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = "Setting password...";
    btnSpinner.classList.remove("hidden");

    try {
        const response = await apiCall("/change-password", "POST", {
            oldPassword,
            newPassword,
            confirmPassword,
        });

        // Update stored tokens if backend returns new ones
        if (response.data.accessToken) {
            saveTokens(response.data);
        }

        // Hide modal and show dashboard
        hidePasswordChangeModal();
        const username = localStorage.getItem("adminUsername");
        showDashboard({ username });
    } catch (error) {
        showError(
            "modal-password-error",
            error.message || "Failed to change password",
        );
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Set Password";
        btnSpinner.classList.add("hidden");
    }
});

// Change Password Handler
changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById(
        "confirm-new-password",
    ).value;
    const errorEl = document.getElementById("password-error");
    const successEl = document.getElementById("password-success");
    const btnText = document.getElementById("pwd-btn-text");
    const btnSpinner = document.getElementById("pwd-btn-spinner");
    const submitBtn = changePasswordForm.querySelector('button[type="submit"]');

    // Reset messages
    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
        showError("password-error", "Please enter all password fields");
        return;
    }

    if (newPassword !== confirmPassword) {
        showError("password-error", "New passwords do not match");
        return;
    }

    if (newPassword.length < 8) {
        showError(
            "password-error",
            "New password must be at least 8 characters",
        );
        return;
    }

    // Loading state
    submitBtn.disabled = true;
    btnText.textContent = "Updating...";
    btnSpinner.classList.remove("hidden");

    try {
        const response = await apiCall("/change-password", "POST", {
            oldPassword,
            newPassword,
            confirmPassword,
        });

        // Update stored tokens if backend returns new ones
        if (response.data && response.data.accessToken) {
            saveTokens(response.data);
        }

        showSuccess("password-success", "Password updated successfully!");
        changePasswordForm.reset();
    } catch (error) {
        showError(
            "password-error",
            error.message || "Failed to update password",
        );
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Update Password";
        btnSpinner.classList.add("hidden");
    }
});

// Logout Handler
logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        await apiCall("/logout", "POST");
    } catch (error) {
        console.warn("Logout API call failed:", error);
    }

    // Clear tokens and show login
    clearTokens();
    hideDashboard();
});

// ============================================================================
// DASHBOARD FUNCTIONS
// ============================================================================

function showDashboard(user) {
    // Update username display
    document.getElementById("admin-username").textContent = user.username;

    // Hide login, show dashboard
    loginContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");

    // Initialize dashboard
    loadDashboardData();

    // Recreate icons
    lucide.createIcons();
}

function hideDashboard() {
    // Show login, hide dashboard
    loginContainer.classList.remove("hidden");
    dashboardContainer.classList.add("hidden");

    // Reset forms
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    loginForm.reset();
    signupForm.reset();
    changePasswordForm.reset();

    // Recreate icons
    lucide.createIcons();
}

async function loadDashboardData() {
    try {
        // Fetch health check
        const healthResponse = await fetch("/api/v1/check/health");
        const healthData = await healthResponse.json();

        // Update stats (example data - customize as needed)
        document.getElementById("stat-participants").textContent = "234";
        document.getElementById("stat-teams").textContent = "45";
        document.getElementById("stat-events").textContent = "12";
        document.getElementById("stat-health").textContent = healthData.success
            ? "✓"
            : "✗";
    } catch (error) {
        console.warn("Failed to load dashboard data:", error);
        // Set default values
        document.getElementById("stat-participants").textContent = "—";
        document.getElementById("stat-teams").textContent = "—";
        document.getElementById("stat-events").textContent = "—";
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeApp() {
    const token = getStoredToken();

    if (token) {
        // Verify token is still valid by attempting an API call
        apiCall("/change-password", "POST", {
            oldPassword: "",
            newPassword: "",
        })
            .then(() => {
                // Token is valid but we didn't actually change password
                // This was just a validation check - the API should reject it
            })
            .catch((error) => {
                // Token is likely invalid
                if (
                    error.message.includes("401") ||
                    error.message.includes("Unauthorized")
                ) {
                    clearTokens();
                } else {
                    // Try to refresh token
                    refreshAccessToken();
                }
            });

        // For now, let's trust the token and show dashboard
        // In production, you'd want better token validation
        const storedUsername = localStorage.getItem("adminUsername");
        if (storedUsername) {
            showDashboard({ username: storedUsername });
        }
    } else {
        // No token, show login
        hideDashboard();
    }
}

async function refreshAccessToken() {
    try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await fetch(`${API_BASE}/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();

        if (response.ok) {
            saveTokens(data.data);
        } else {
            throw new Error(data.message || "Token refresh failed");
        }
    } catch (error) {
        console.warn("Token refresh failed:", error);
        clearTokens();
        hideDashboard();
    }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
    lucide.createIcons();

    // Refresh token every 14 minutes (token expires in 15)
    setInterval(refreshAccessToken, 14 * 60 * 1000);
});
