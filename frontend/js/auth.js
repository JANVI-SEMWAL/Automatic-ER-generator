const apiUrl = "http://localhost:5000"; // backend URL

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordPattern = /^(?=.*[@#]).{8,}$/;

function setFieldState(field, state, message = "") {
  if (!field) return;
  field.classList.remove("valid", "invalid");
  if (state === "valid") {
    field.classList.add("valid");
  } else if (state === "invalid") {
    field.classList.add("invalid");
  }
  const feedback = field.querySelector(".input-feedback");
  if (feedback) {
    feedback.textContent = message || "";
  }
}

function attachValidation(input, options) {
  if (!input) return () => true;
  const field = input.closest(".field");
  const defaultMessages = {
    required: "This field is required",
    success: "Looks good",
    error: "Please check this field"
  };
  let touched = false;

  const runValidation = () => {
    const raw = input.value.trim();
    if (!raw) {
      if (touched) {
        setFieldState(field, "invalid", options.requiredMessage || defaultMessages.required);
      } else {
        setFieldState(field, null, "");
      }
      return false;
    }
    const result = options.validator ? options.validator(raw) : { valid: true };
    if (result.valid) {
      setFieldState(field, "valid", result.message || options.successMessage || defaultMessages.success);
      return true;
    }
    setFieldState(field, "invalid", result.message || options.errorMessage || defaultMessages.error);
    return false;
  };

  input.addEventListener("blur", () => {
    touched = true;
    runValidation();
  });

  input.addEventListener("input", () => {
    if (options.sanitizer) {
      const sanitized = options.sanitizer(input.value);
      if (sanitized !== input.value) input.value = sanitized;
    }
    if (touched) {
      runValidation();
    } else if (!input.value.trim()) {
      setFieldState(field, null, "");
    }
  });

  return (force = false) => {
    if (force) touched = true;
    return runValidation();
  };
}

function focusFirstInvalid(form) {
  const invalid = form.querySelector(".field.invalid input, .field.invalid select");
  if (invalid) invalid.focus();
}

// Register User
(function() {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const phoneInput = document.getElementById("phone");
    const countryCodeSelect = document.getElementById("countryCode");

  const validateUsername = attachValidation(usernameInput, {
    requiredMessage: "Username is required",
    validator: (value) => {
      if (value.length < 3) {
        return { valid: false, message: "Use at least 3 characters" };
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
        return { valid: false, message: "Use only letters, numbers, dot, dash or underscore" };
      }
      return { valid: true, message: "Username looks good" };
    }
  });

  const validateEmail = attachValidation(emailInput, {
    requiredMessage: "Email is required",
    validator: (value) => {
      if (!emailPattern.test(value)) {
        return { valid: false, message: "Enter a valid email like name@example.com" };
      }
      return { valid: true, message: "Email looks good" };
    }
  });

  const validatePassword = attachValidation(passwordInput, {
    requiredMessage: "Password is required",
    validator: (value) => {
      if (!passwordPattern.test(value)) {
        return {
          valid: false,
          message: "Minimum 8 characters and must include @ or #"
        };
      }
      return { valid: true, message: "Strong password" };
    }
  });

  const validatePhone = attachValidation(phoneInput, {
    requiredMessage: "Phone number is required",
    sanitizer: (val) => val.replace(/[^0-9]/g, "").slice(0, 10),
    validator: (value) => {
      if (value.length !== 10) {
        return { valid: false, message: "Enter a 10 digit phone number" };
      }
      return { valid: true, message: "Phone number looks good" };
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const checks = [
      validateUsername(true),
      validateEmail(true),
      validatePassword(true),
      validatePhone(true)
    ];
    if (!checks.every(Boolean)) {
      focusFirstInvalid(registerForm);
      return;
    }

    const payload = {
      username: usernameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      countryCode: countryCodeSelect ? countryCodeSelect.value : "",
      phone: phoneInput ? phoneInput.value.trim() : ""
    };

    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Registered successfully");
        window.location.href = "login.html";
      } else {
        // Show detailed error message
        const errorMsg = data.error 
          ? `${data.message}\n\nDetails: ${data.error}` 
          : data.message || "Registration failed";
        alert(errorMsg);
      }
    } catch (error) {
      alert('Network Error: ' + error.message + '\n\nMake sure the backend server is running on port 5000.');
    }
  });
  }
})();

// Login User
(function() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

  const validateEmail = attachValidation(emailInput, {
    requiredMessage: "Email is required",
    validator: (value) => {
      if (!emailPattern.test(value)) {
        return { valid: false, message: "Enter a valid email like name@example.com" };
      }
      return { valid: true, message: "Email looks good" };
    }
  });

  const validatePassword = attachValidation(passwordInput, {
    requiredMessage: "Password is required",
    validator: (value) => {
      if (!passwordPattern.test(value)) {
        return {
          valid: false,
          message: "Minimum 8 characters and must include @ or #"
        };
      }
      return { valid: true, message: "Password format looks good" };
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const checks = [validateEmail(true), validatePassword(true)];
    if (!checks.every(Boolean)) {
      focusFirstInvalid(loginForm);
      return;
    }

    const payload = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      alert('Network Error: ' + error.message + '\n\nMake sure the backend server is running on port 5000.');
    }
  });
  }
})();
