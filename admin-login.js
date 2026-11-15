const loginForm = document.querySelector("#admin-login-form");
const loginError = document.querySelector("#login-error");
const loginButton = document.querySelector("#login-button");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = "Checking details…";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(loginForm))
    });
    const result = await response.json();
    if (!response.ok) {
      loginError.textContent = result.message || "Invalid login details. Please try again.";
      loginError.hidden = false;
      return;
    }
    window.location.assign(result.redirect);
  } catch (error) {
    console.error("Could not contact the H.A.R.M admin sign-in service:", error);
    loginError.textContent = "Sign-in is unavailable right now. Please try again.";
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign in to admin";
  }
});
