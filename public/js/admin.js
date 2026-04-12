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

// Cleanup URL after page load to prevent credential exposure
function cleanupURLHistory() {
    if (window.history && window.history.replaceState) {
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
        );
    }
}

// Initialize Lucide Icons
if (typeof lucide !== "undefined") {
    lucide.createIcons();
}

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
if (signupToggle) {
    signupToggle.addEventListener("click", (e) => {
        e.preventDefault();
        if (loginForm) loginForm.classList.add("hidden");
        if (signupForm) signupForm.classList.remove("hidden");
        if (typeof lucide !== "undefined") lucide.createIcons();
    });
}

if (loginToggle) {
    loginToggle.addEventListener("click", (e) => {
        e.preventDefault();
        if (signupForm) signupForm.classList.add("hidden");
        if (loginForm) loginForm.classList.remove("hidden");
        if (typeof lucide !== "undefined") lucide.createIcons();
    });
}

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

        // Clean up URL to prevent credential exposure
        cleanupURLHistory();

        // Check if must change password
        if (response.data.isUsingTempPassword) {
            // Hide login, show modal
            if (loginContainer) loginContainer.classList.add("hidden");
            showPasswordChangeModal(password);
        } else {
            // Load and show dashboard directly
            showDashboard(response.data.user);
        }

        // Clear form - IMPORTANT: Do this AFTER saving tokens
        if (loginForm) loginForm.reset();
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

        // Clean up URL to prevent credential exposure
        cleanupURLHistory();

        // Load and show dashboard (no password change needed for signup)
        showDashboard(response.data.user);

        // Clear form - IMPORTANT: Do this AFTER saving tokens
        if (signupForm) signupForm.reset();
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
if (changePasswordForm) {
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
        const submitBtn = changePasswordForm.querySelector(
            'button[type="submit"]',
        );

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
}

// Logout Handler
if (logoutBtn) {
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
}

// ============================================================================
// DASHBOARD FUNCTIONS
// ============================================================================

function showDashboard(user) {
    // Update username display
    const usernameEl = document.getElementById("admin-username");
    if (usernameEl && user && user.username) {
        usernameEl.textContent = user.username;
    }

    // Hide login, show dashboard
    if (loginContainer) loginContainer.classList.add("hidden");
    if (dashboardContainer) dashboardContainer.classList.remove("hidden");

    // Initialize dashboard
    loadDashboardData();

    // Recreate icons
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function hideDashboard() {
    // Show login, hide dashboard
    if (loginContainer) loginContainer.classList.remove("hidden");
    if (dashboardContainer) dashboardContainer.classList.add("hidden");

    // Reset forms
    if (loginForm) {
        loginForm.classList.remove("hidden");
        loginForm.reset();
    }
    if (signupForm) {
        signupForm.classList.add("hidden");
        signupForm.reset();
    }
    if (changePasswordForm) changePasswordForm.reset();

    // Recreate icons
    if (typeof lucide !== "undefined") lucide.createIcons();
}

async function loadDashboardData() {
    try {
        // Fetch health check
        const healthResponse = await fetch("/api/v1/check/health");
        const healthData = await healthResponse.json();

        // Fetch user count using aggregation pipeline
        try {
            const token = localStorage.getItem("accessToken");
            const userCountResponse = await fetch(`${API_BASE}/users/count`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (userCountResponse.ok) {
                const userData = await userCountResponse.json();
                document.getElementById("stat-participants").textContent =
                    userData.data?.totalUsers || 0;
            } else {
                document.getElementById("stat-participants").textContent = "—";
            }
        } catch (error) {
            console.warn("Failed to fetch user count:", error);
            document.getElementById("stat-participants").textContent = "—";
        }

        // Update other stats
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

// ============================================================================
// CSV UPLOAD FUNCTIONALITY WITH FIELD MAPPING & DATA PREVIEW
// ============================================================================

const csvUploadForm = document.getElementById("csv-upload-form");
const eventbriteDropZone = document.getElementById("eventbrite-drop-zone");
const mlhDropZone = document.getElementById("mlh-drop-zone");
const eventbriteFileInput = document.getElementById("eventbrite-csv");
const mlhFileInput = document.getElementById("mlh-csv");

// State management for CSV workflow
let csvState = {
    eventbriteFile: null,
    mlhFile: null,
    previewData: null,
    selectedRecords: [],
    fieldMappings: {},
};

// Setup drag and drop for Eventbrite
if (eventbriteDropZone && eventbriteFileInput) {
    eventbriteDropZone.addEventListener("click", () => {
        eventbriteFileInput.click();
    });

    eventbriteDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        eventbriteDropZone.classList.add("border-ghGreen4", "bg-ghGray8/20");
    });

    eventbriteDropZone.addEventListener("dragleave", () => {
        eventbriteDropZone.classList.remove("border-ghGreen4", "bg-ghGray8/20");
    });

    eventbriteDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        eventbriteDropZone.classList.remove("border-ghGreen4", "bg-ghGray8/20");

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            eventbriteFileInput.files = files;
            updateFileLabel("eventbrite-filename", files[0].name);
        }
    });

    eventbriteFileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            updateFileLabel("eventbrite-filename", e.target.files[0].name);
        }
    });
}

// Setup drag and drop for MLH
if (mlhDropZone && mlhFileInput) {
    mlhDropZone.addEventListener("click", () => {
        mlhFileInput.click();
    });

    mlhDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        mlhDropZone.classList.add("border-ghGreen4", "bg-ghGray8/20");
    });

    mlhDropZone.addEventListener("dragleave", () => {
        mlhDropZone.classList.remove("border-ghGreen4", "bg-ghGray8/20");
    });

    mlhDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        mlhDropZone.classList.remove("border-ghGreen4", "bg-ghGray8/20");

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            mlhFileInput.files = files;
            updateFileLabel("mlh-filename", files[0].name);
        }
    });

    mlhFileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            updateFileLabel("mlh-filename", e.target.files[0].name);
        }
    });
}

// Helper function to update file label
function updateFileLabel(elementId, filename) {
    const label = document.getElementById(elementId);
    if (label) {
        label.textContent = filename;
    }
}

// CSV Upload Form Handler - Step 1: Upload and Preview
if (csvUploadForm) {
    csvUploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventbriteFile = eventbriteFileInput.files[0];
        const mlhFile = mlhFileInput.files[0];
        const errorEl = document.getElementById("csv-error");
        const submitBtn = csvUploadForm.querySelector('button[type="submit"]');
        const btnText = document.getElementById("csv-btn-text");
        const btnSpinner = document.getElementById("csv-btn-spinner");

        // Reset messages
        if (errorEl) errorEl.classList.add("hidden");

        // Validate files
        if (!eventbriteFile) {
            showError("csv-error", "Please select Eventbrite CSV file");
            return;
        }

        if (!mlhFile) {
            showError("csv-error", "Please select MLH CSV file");
            return;
        }

        // Loading state
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = "Analyzing...";
        if (btnSpinner) btnSpinner.classList.remove("hidden");

        try {
            // Store files in state
            csvState.eventbriteFile = eventbriteFile;
            csvState.mlhFile = mlhFile;

            // Call preview endpoint
            const formData = new FormData();
            formData.append("eventbriteCSV", eventbriteFile);
            formData.append("mlhCSV", mlhFile);

            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${API_BASE}/preview-csv`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to analyze CSV files",
                );
            }

            // Store preview data
            csvState.previewData = result.data;

            // Show field mapping UI
            showFieldMappingUI(result.data);
            document.getElementById("csv-results").classList.add("hidden");
            document
                .getElementById("data-preview-section")
                .classList.add("hidden");

            showSuccess("csv-success", "CSV files analyzed successfully!");
        } catch (error) {
            showError("csv-error", error.message || "CSV analysis failed");
        } finally {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = "Upload & Process";
            if (btnSpinner) btnSpinner.classList.add("hidden");
        }
    });
}

// Function to populate field mapping dropdowns
function showFieldMappingUI(previewData) {
    const eventbriteColumns = previewData.eventbrite.columns || [];
    const mlhColumns = previewData.mlh.columns || [];

    // Populate Eventbrite selects
    populateSelect("eventbrite-email-column", eventbriteColumns);
    populateSelect("eventbrite-firstname-column", eventbriteColumns);
    populateSelect("eventbrite-githubid-column", eventbriteColumns);

    // Populate MLH selects
    populateSelect("mlh-email-column", mlhColumns);
    populateSelect("mlh-firstname-column", mlhColumns, true);
    populateSelect("mlh-githubid-column", mlhColumns, true);

    // Show field mapping section
    document.getElementById("field-mapping-section").classList.remove("hidden");
    document.getElementById("csv-upload-form").classList.add("hidden");
}

function populateSelect(selectId, columns, optional = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = optional
        ? '<option value="">-- Not Used --</option>'
        : '<option value="">-- Select Column --</option>';

    columns.forEach((column) => {
        const option = document.createElement("option");
        option.value = column;
        option.textContent = column;

        // Auto-select based on common naming patterns
        const lowerColumn = column.toLowerCase();
        if (
            !optional &&
            lowerColumn.includes(
                selectId.split("-").slice(-2, -1)[0].toLowerCase(),
            )
        ) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

// Continue to Data Review button
document
    .getElementById("continue-mapping-btn")
    ?.addEventListener("click", async () => {
        const eventbriteEmailCol = document.getElementById(
            "eventbrite-email-column",
        ).value;
        const eventbriteFirstNameCol = document.getElementById(
            "eventbrite-firstname-column",
        ).value;
        const eventbriteGithubIdCol = document.getElementById(
            "eventbrite-githubid-column",
        ).value;
        const mlhEmailCol = document.getElementById("mlh-email-column").value;

        // Validate mappings
        if (
            !eventbriteEmailCol ||
            !eventbriteFirstNameCol ||
            !eventbriteGithubIdCol ||
            !mlhEmailCol
        ) {
            showError(
                "csv-error",
                "Please select all required fields for field mapping",
            );
            return;
        }

        // Store field mappings
        csvState.fieldMappings = {
            eventbriteFieldMapping: {
                email: eventbriteEmailCol,
                firstName: eventbriteFirstNameCol,
                githubId: eventbriteGithubIdCol,
            },
            mlhFieldMapping: {
                email: mlhEmailCol,
                firstName:
                    document.getElementById("mlh-firstname-column").value ||
                    undefined,
                githubId:
                    document.getElementById("mlh-githubid-column").value ||
                    undefined,
            },
        };

        // Show data preview
        showDataPreview();
    });

// Function to show data preview with matched records
function showDataPreview() {
    const previewData = csvState.previewData;
    const eventbriteColumns = previewData.eventbrite.columns || [];
    const mlhColumns = previewData.mlh.columns || [];
    // Use ALL common emails, not just the sample
    const commonEmails =
        previewData.commonEmails.all || previewData.commonEmails.sample || [];

    // Parse preview data to get matching records
    const mappings = csvState.fieldMappings;
    const eventbriteEmailCol = mappings.eventbriteFieldMapping.email;
    const eventbriteFirstNameCol = mappings.eventbriteFieldMapping.firstName;
    const eventbriteGithubIdCol = mappings.eventbriteFieldMapping.githubId;

    // Build records from ALL preview data (not just sample)
    const recordsToShow = [];
    // Use all eventbrite data if available, otherwise use sample
    const dataToProcess =
        previewData.eventbrite.allData || previewData.eventbrite.sample;

    if (dataToProcess && Array.isArray(dataToProcess)) {
        dataToProcess.forEach((row) => {
            const email = row[eventbriteEmailCol]?.toLowerCase().trim();
            if (email && commonEmails.includes(email)) {
                recordsToShow.push({
                    email,
                    firstName: row[eventbriteFirstNameCol] || "N/A",
                    githubId: row[eventbriteGithubIdCol] || "N/A",
                    selected: true,
                });
            }
        });
    }

    // Display preview table
    const tableBody = document.getElementById("data-preview-table");
    tableBody.innerHTML = "";

    // Show count of records
    console.log(
        `Displaying ${recordsToShow.length} matched records from ${commonEmails.length} common emails`,
    );

    recordsToShow.forEach((record, index) => {
        const row = document.createElement("tr");
        row.className = index % 2 === 0 ? "bg-ghGray8/10" : "";
        row.innerHTML = `
            <td class="px-4 py-3 text-ghGray4">${record.email}</td>
            <td class="px-4 py-3 text-ghGray4">${record.firstName}</td>
            <td class="px-4 py-3 text-ghGray4 font-mono text-sm">${record.githubId}</td>
            <td class="px-4 py-3"><span class="px-2 py-1 bg-ghGreen4/20 text-ghGreen4 text-xs rounded">new</span></td>
            <td class="px-4 py-3 text-center">
                <input type="checkbox" class="record-checkbox" value="${record.email}" checked />
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Store all records internally
    csvState.selectedRecords = recordsToShow.map((r) => r.email);

    // Update the preview record count
    const previewCountEl = document.getElementById("preview-record-count");
    if (previewCountEl) {
        previewCountEl.textContent = recordsToShow.length;
    }

    // Show data preview section
    document.getElementById("field-mapping-section").classList.add("hidden");
    document.getElementById("data-preview-section").classList.remove("hidden");

    if (typeof lucide !== "undefined") lucide.createIcons();
}

// Back to Field Mapping button
document.getElementById("back-mapping-btn")?.addEventListener("click", () => {
    document.getElementById("data-preview-section").classList.add("hidden");
    document.getElementById("field-mapping-section").classList.remove("hidden");
});

// Process and Insert to Database button
document
    .getElementById("process-data-btn")
    ?.addEventListener("click", async () => {
        const btn = document.getElementById("process-data-btn");
        const btnText = document.getElementById("process-data-text");
        const btnSpinner = document.getElementById("process-data-spinner");

        // Get selected records from checkboxes
        const checkboxes = document.querySelectorAll(
            ".record-checkbox:checked",
        );
        const selectedEmails = Array.from(checkboxes).map((cb) => cb.value);

        if (selectedEmails.length === 0) {
            showError(
                "csv-error",
                "Please select at least one record to process",
            );
            return;
        }

        // Show progress modal and initialize
        showProgressModal(selectedEmails.length);

        // Loading state
        btn.disabled = true;
        if (btnText) btnText.textContent = "Processing...";
        if (btnSpinner) btnSpinner.classList.remove("hidden");

        try {
            // Prepare form data for processing with files
            const formData = new FormData();
            formData.append("eventbriteCSV", csvState.eventbriteFile);
            formData.append("mlhCSV", csvState.mlhFile);
            formData.append(
                "eventbriteFieldMapping",
                JSON.stringify(csvState.fieldMappings.eventbriteFieldMapping),
            );
            formData.append(
                "mlhFieldMapping",
                JSON.stringify(csvState.fieldMappings.mlhFieldMapping),
            );
            formData.append("selectedEmails", JSON.stringify(selectedEmails));

            console.log("Sending data:", {
                selectedEmails,
                eventbriteFieldMapping:
                    csvState.fieldMappings.eventbriteFieldMapping,
                mlhFieldMapping: csvState.fieldMappings.mlhFieldMapping,
                totalSelected: selectedEmails.length,
            });

            const token = localStorage.getItem("accessToken");

            // Use Server-Sent Events for real-time streaming
            const response = await fetch(`${API_BASE}/process-csv-stream`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to start stream");
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalData = {
                summary: { created: 0, updated: 0, errors: 0, total: 0 },
            };

            // Process stream
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.type === "start") {
                                console.log(
                                    "Stream started for",
                                    data.total,
                                    "records",
                                );
                                addLogEntry(
                                    `Starting to process ${data.total} records...`,
                                );
                            } else if (data.type === "progress") {
                                // Update progress in real-time
                                updateProgressBar(
                                    data.percentage,
                                    data.index,
                                    data.total,
                                );
                                updateProgressStats(
                                    data.created,
                                    data.updated,
                                    data.errors,
                                );

                                if (data.status === "created") {
                                    addLogEntry(`✓ Created: ${data.email}`);
                                } else if (data.status === "updated") {
                                    addLogEntry(`✓ Updated: ${data.email}`);
                                } else if (data.status === "error") {
                                    addLogEntry(
                                        `✗ Error: ${data.email} - ${data.error}`,
                                    );
                                }

                                finalData.summary = {
                                    created: data.created,
                                    updated: data.updated,
                                    errors: data.errors,
                                    total: data.total,
                                };
                            } else if (data.type === "complete") {
                                console.log("Stream completed:", data);
                                addLogEntry(
                                    `✓ Processing complete: ${data.created} created, ${data.updated} updated`,
                                );
                                if (data.errors > 0) {
                                    addLogEntry(
                                        `✗ ${data.errors} errors encountered`,
                                    );
                                }
                                finalData.summary = {
                                    created: data.created,
                                    updated: data.updated,
                                    errors: data.errors,
                                    total: data.total,
                                };
                            } else if (data.type === "error") {
                                console.error("Stream error:", data);
                                addLogEntry(`✗ Error: ${data.message}`);
                            }
                        } catch (e) {
                            console.log("Could not parse line:", line);
                        }
                    }
                }
            }

            // Close the stream and show results after a moment
            setTimeout(() => {
                hideProgressModal();
                displayProcessingResults({
                    summary: finalData.summary,
                    createdUsers: [],
                    errors: [],
                });

                showSuccess(
                    "csv-success",
                    `Successfully inserted ${finalData.summary.created || 0} users and updated ${finalData.summary.updated || 0} users!`,
                );

                // Reset form and state
                csvUploadForm.reset();
                updateFileLabel("eventbrite-filename", "No file selected");
                updateFileLabel("mlh-filename", "No file selected");
                csvState = {
                    eventbriteFile: null,
                    mlhFile: null,
                    previewData: null,
                    selectedRecords: [],
                    fieldMappings: {},
                };

                // Hide sections and show form again
                document
                    .getElementById("data-preview-section")
                    .classList.add("hidden");
                document
                    .getElementById("csv-upload-form")
                    .classList.remove("hidden");
            }, 500);
        } catch (error) {
            console.error("Error during CSV processing:", error);
            hideProgressModal();
            showError(
                "csv-error",
                error.message ||
                    "Processing failed. Check console for details.",
            );
        } finally {
            btn.disabled = false;
            if (btnText) btnText.textContent = "Process & Insert to Database";
            if (btnSpinner) btnSpinner.classList.add("hidden");
        }
    });

// ============================================================================
// PROGRESS MODAL FUNCTIONS
// ============================================================================

function showProgressModal(totalRecords) {
    const modal = document.getElementById("progress-modal");
    modal.classList.remove("hidden");

    // Initialize stats
    document.getElementById("stat-created").textContent = "0";
    document.getElementById("stat-updated").textContent = "0";
    document.getElementById("stat-errors").textContent = "0";
    document.getElementById("progress-count").textContent =
        `0 / ${totalRecords} processed`;
    document.getElementById("progress-percentage").textContent = "0%";
    document.getElementById("progress-status").textContent = "Starting...";

    // Clear log
    document.getElementById("log-content").innerHTML = "";
    addLogEntry("Starting CSV processing...");
}

function hideProgressModal() {
    const modal = document.getElementById("progress-modal");
    modal.classList.add("hidden");
}

function addLogEntry(message) {
    const logContent = document.getElementById("log-content");
    const entry = document.createElement("div");
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    entry.className = "mb-1";

    // Add color based on message content
    if (message.includes("✓") || message.includes("Created")) {
        entry.className += " text-ghGreen4";
    } else if (message.includes("Updated")) {
        entry.className += " text-ghSecurityBlue";
    } else if (
        message.includes("✗") ||
        message.includes("Error") ||
        message.includes("error")
    ) {
        entry.className += " text-red-500";
    }

    logContent.appendChild(entry);

    // Auto-scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;
}

function updateProgressModal(data) {
    const summary = data.summary || {};
    const total = summary.total || 0;
    const created = summary.created || 0;
    const updated = summary.updated || 0;
    const errors = summary.errors || 0;

    // Update stats
    document.getElementById("stat-created").textContent = created;
    document.getElementById("stat-updated").textContent = updated;
    document.getElementById("stat-errors").textContent = errors;

    // Update progress
    const processed = created + updated + errors;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    document.getElementById("progress-bar").style.width = percentage + "%";
    document.getElementById("progress-percentage").textContent =
        percentage + "%";
    document.getElementById("progress-count").textContent =
        `${processed} / ${total} processed`;
    document.getElementById("progress-status").textContent = "Completed!";

    // Add summary to log
    addLogEntry(
        `✓ Processing complete: ${created} created, ${updated} updated`,
    );
    if (errors > 0) {
        addLogEntry(`✗ ${errors} errors encountered`);
    }
}

// Update progress bar in real-time
function updateProgressBar(percentage, current, total) {
    document.getElementById("progress-bar").style.width = percentage + "%";
    document.getElementById("progress-percentage").textContent =
        percentage + "%";
    document.getElementById("progress-count").textContent =
        `${current} / ${total} processed`;
    document.getElementById("progress-status").textContent =
        `Processing... ${percentage}%`;
}

// Update stats counters in real-time
function updateProgressStats(created, updated, errors) {
    document.getElementById("stat-created").textContent = created;
    document.getElementById("stat-updated").textContent = updated;
    document.getElementById("stat-errors").textContent = errors;
}

// Display Processing Results with Table
function displayProcessingResults(data) {
    if (!data || typeof data !== "object") {
        console.error("Invalid data passed to displayProcessingResults");
        return;
    }

    const resultsContainer = document.getElementById("csv-results");
    const summary = data.summary || {};

    // Update summary stats
    document.getElementById("result-common").textContent = summary.total || 0;
    document.getElementById("result-created").textContent =
        summary.created || 0;
    document.getElementById("result-updated").textContent =
        summary.updated || 0;
    document.getElementById("result-errors").textContent = summary.errors || 0;

    // Display results table
    const processedRecords = Array.isArray(data.processedRecords)
        ? data.processedRecords
        : [];

    if (processedRecords.length > 0) {
        const resultsTableBody = document.getElementById("results-table-body");
        const resultsTableSection = document.getElementById(
            "results-table-section",
        );

        resultsTableBody.innerHTML = "";

        processedRecords.forEach((record, index) => {
            const row = document.createElement("tr");
            row.className = index % 2 === 0 ? "bg-ghGray8/10" : "";

            let statusBadge = "";
            let statusColor = "";

            if (record.status === "created") {
                statusBadge = "Created";
                statusColor = "bg-ghGreen4/20 text-ghGreen4";
            } else if (record.status === "updated") {
                statusBadge = "Updated";
                statusColor = "bg-ghPurple/20 text-ghPurple";
            } else if (record.status === "error") {
                statusBadge = "Error";
                statusColor = "bg-red-500/20 text-red-400";
            }

            row.innerHTML = `
                <td class="px-4 py-3 text-ghGray4">${record.email}</td>
                <td class="px-4 py-3 text-ghGray4">${record.firstName || "N/A"}</td>
                <td class="px-4 py-3 text-ghGray4 font-mono text-sm">${record.githubId || "N/A"}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded ${statusColor}">
                        ${statusBadge}
                    </span>
                </td>
            `;
            resultsTableBody.appendChild(row);
        });

        resultsTableSection.classList.remove("hidden");
    }

    resultsContainer.classList.remove("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Clean up URL history immediately on page load
    cleanupURLHistory();

    initializeApp();
    if (typeof lucide !== "undefined") lucide.createIcons();

    // Refresh token every 14 minutes (token expires in 15)
    setInterval(refreshAccessToken, 14 * 60 * 1000);
});

// Also clean up when page becomes visible (tab comes to focus)
if (document.hidden !== undefined) {
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            cleanupURLHistory();
        }
    });
}
