document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        // mark with activity name for later DOM updates
        activityCard.setAttribute("data-activity-name", name);

        const spotsLeft = (details.max_participants || 0) - (details.participants?.length || 0);

        // Crear elementos de la tarjeta (seguro)
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

  const availability = document.createElement("p");
  availability.className = "availability";
  availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

  // Sección de participantes (lista sin viñetas + botón eliminar por participante)
  const participantsSection = document.createElement("div");
  participantsSection.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        // create participants list (we'll populate it and reuse it later)
        const ul = document.createElement("ul");
        ul.className = "participants-list";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = createParticipantElement(name, p);
            ul.appendChild(li);
          });
        } else {
          const empty = document.createElement("p");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet";
          participantsSection.appendChild(empty);
        }
        participantsSection.appendChild(ul);

  activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper: create a participant <li> with delete button wired to backend
  function createParticipantElement(activityName, participantEmail) {
    const li = document.createElement("li");
    li.className = "participant-item";

    const span = document.createElement("span");
    span.className = "participant-email";
    span.textContent = participantEmail;

    const delBtn = document.createElement("button");
    delBtn.className = "participant-delete";
    delBtn.type = "button";
    delBtn.title = "Unregister";
    delBtn.setAttribute("aria-label", `Unregister ${participantEmail}`);
    delBtn.textContent = "\u00D7";

    delBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      delBtn.disabled = true;
      try {
        const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`, {
          method: "DELETE",
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          alert(data.detail || `Could not unregister ${participantEmail}`);
          delBtn.disabled = false;
          return;
        }
        // remove item and update availability
        const card = document.querySelector(`[data-activity-name="${CSS.escape(activityName)}"]`);
        if (card) {
          // decrement spots left
          updateAvailabilityInCard(card, -1);
        }
        li.remove();
      } catch (err) {
        console.error(err);
        alert(`Network error while unregistering ${participantEmail}`);
        delBtn.disabled = false;
      }
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    return li;
  }

  // Update availability in the given activity card by delta (negative to decrement, positive to increment)
  function updateAvailabilityInCard(card, delta) {
    const availability = card.querySelector('.availability');
    if (!availability) return;
    // extract number from text like "Availability: X spots left"
    const text = availability.textContent || availability.innerText;
    const match = text.match(/(\d+)\s+spots/);
    if (!match) return;
    let spots = parseInt(match[1], 10);
    spots = Math.max(0, spots + delta);
    availability.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // Update UI: find the activity card and append new participant
        const card = document.querySelector(`[data-activity-name="${CSS.escape(activity)}"]`);
        if (card) {
          const ul = card.querySelector('.participants-list');
          if (ul) {
            const existingEmpty = card.querySelector('.participants-empty');
            if (existingEmpty) existingEmpty.remove();
            const li = createParticipantElement(activity, email);
            ul.appendChild(li);
          }
          // decrement available spots
          updateAvailabilityInCard(card, -1);
        }
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
