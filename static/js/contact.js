document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const statusMessage = document.createElement("p");
  statusMessage.id = "form-status";
  form.appendChild(statusMessage);

  const supabaseUrl = window.SUPABASE_URL; // from base.html
  const supabaseAnonKey = window.SUPABASE_KEY; // from base.html
  const { createClient } = supabase; // assuming supabase-js is loaded in base.html
  const sb = createClient(supabaseUrl, supabaseAnonKey);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !subject || !message) {
      statusMessage.textContent = "Please fill out all fields.";
      statusMessage.style.color = "red";
      return;
    }

    try {
      const { data, error } = await sb.functions.invoke("resend-email", {
        body: { name, email, subject, message },
      });

      if (error) throw error;

      statusMessage.textContent = "✅ Message sent successfully!";
      statusMessage.style.color = "green";
      form.reset();
    } catch (err) {
      statusMessage.textContent = "❌ Error sending message: " + err.message;
      statusMessage.style.color = "red";
    }
  });
});
