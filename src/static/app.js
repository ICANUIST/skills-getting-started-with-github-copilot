document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      const placeholderOption = activitySelect.querySelector('option[value=""]');
      activitySelect.replaceChildren();
      if (placeholderOption) {
        activitySelect.appendChild(placeholderOption);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
        `;
        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        const availabilityText = document.createTextNode("");
        availability.append(availabilityLabel, availabilityText);

        function updateAvailability() {
          availabilityText.textContent =
            `${details.max_participants - details.participants.length} spots left`;
        }

        updateAvailability();
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        function renderParticipants() {
          participantsSection.replaceChildren();
          const participantsHeading = document.createElement("h5");
          participantsHeading.textContent = `Participants (${details.participants.length})`;
          participantsSection.appendChild(participantsHeading);

          if (details.participants.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-participants";
            emptyMessage.textContent = "No participants yet.";
            participantsSection.appendChild(emptyMessage);
            return;
          }

          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;
            listItem.appendChild(participantEmail);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant-button";
            removeButton.setAttribute(
              "aria-label",
              `Unregister ${participant} from ${name}`
            );
            removeButton.title = `Unregister ${participant}`;

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("width", "18");
            deleteIcon.setAttribute("height", "18");
            deleteIcon.setAttribute("aria-hidden", "true");
            deleteIcon.setAttribute("fill", "none");
            deleteIcon.setAttribute("stroke", "currentColor");
            deleteIcon.setAttribute("stroke-width", "2");
            deleteIcon.setAttribute("stroke-linecap", "round");
            deleteIcon.setAttribute("stroke-linejoin", "round");
            const deleteIconPath = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path"
            );
            deleteIconPath.setAttribute(
              "d",
              "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14m-7 4v6m4-6v6"
            );
            deleteIcon.appendChild(deleteIconPath);
            removeButton.appendChild(deleteIcon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to unregister participant.");
                }

                const participantIndex = details.participants.indexOf(participant);
                if (participantIndex !== -1) {
                  details.participants.splice(participantIndex, 1);
                }
                updateAvailability();
                renderParticipants();
                showMessage(result.message, "success");
              } catch (error) {
                showMessage(error.message, "error");
                console.error("Error unregistering participant:", error);
                removeButton.disabled = false;
              }
            });

            listItem.appendChild(removeButton);
            participantsList.appendChild(listItem);
          });

          participantsSection.appendChild(participantsList);
        }

        renderParticipants();
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
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
