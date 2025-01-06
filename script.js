var defaultLocation = "";

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function createEventHeader(event) {
  const eventDateTime = new Date(event.details.date);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(eventDateTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "America/New_York",
  }).format(eventDateTime);

  const audiobookshelfLink = `https://audiobooks.milot.family/library/7ccd944b-d1d4-406d-8859-5e3db53e621e/search?q=${encodeURIComponent(
    event.book.title
  )}`;

  return `<div class="event-card">
      <div class="event-card__header">
        <div>  
          <h2 class="event-card__title">${
            event?.book?.title?.length > 0
              ? `<a href="${audiobookshelfLink}" target="_blank" >${event.book.title}</a>`
              : "TBD"
          }</h2>
          <div class="event-card__host">Hosted by ${event.details.host}</div>
          <div class="event-card__links">
            <a class="link discord" href="${
              event.details.links.discord
            }" target="_blank"><i class="fa-brands fa-discord"></i></a>
            
            <a class="link storygraph" href="${
              event.details.links.storygraph
            }" target="_blank"><img class="storygraph-logo" src="https://www.thestorygraph.com/assets/logo-white-15cb57f7a4673cdf300bdcb013bb5330457e5551ce7b0021b5bd5b1aa4f87d58.png"></a>
            
            <a class="link audiobookshelf" href="${audiobookshelfLink}" target="_blank"><img class="audiobookshelf-logo" src="https://raw.githubusercontent.com/advplyr/audiobookshelf/refs/heads/master/client/static/icon.svg"></a>
         </div>
        </div>
        <div class="event-card__date">
          <i class="fas fa-calendar-days"></i>
          <div>
            <div class="event-card__accent">${formattedDate}</div>
            <div class="event-card__accent">${formattedTime}</div> 
          </div>
          </div>
          </div>
      `;
}

function createBookElement(book) {
  var bookCover = "";
  if (book?.isbn) {
    const coverLink = `https://covers.openlibrary.org/b/isbn/${book?.isbn}-M.jpg`;
    const el = document.createElement("link");
    el.setAttribute("rel", "preload");
    el.setAttribute("href", coverLink);
    el.setAttribute("as", "image");
    document.head.appendChild(el);

    bookCover = `<img class="book-cover" src="${coverLink}"/>`;
  }
  return `<div class="event-card__book">
    <div class="event-card__book-items">
      ${
        book?.title?.length > 0
          ? `${bookCover}<span class="book-details">${
              book?.author?.length > 0
                ? `<a href="https://www.google.com/search?q=${
                    book.author
                  }" target="_blank" class="book-item">${titleCase(
                    book.author
                  )}</a>`
                : ``
            }${
              book?.description?.length > 0
                ? `<span  class="book-item">${titleCase(
                    book.description
                  )}</span></span>`
                : ``
            }`
          : `<span class="book-item">TBD</span>`
      } 
      
    </div >
  </div >
</div >`;
}

function createEventCard(event) {
  const eventHeader = createEventHeader(event);
  const bookElement = createBookElement(event?.book);

  return `${eventHeader}${bookElement}`;
}

const systemPrefersDark = () =>
  window?.matchMedia?.("(prefers-color-scheme:dark)")?.matches ?? false;

// Set initial theme based on system preference
const icon = document.getElementById("toggle-icon");
if (systemPrefersDark()) {
  document.body.classList.remove("light-mode");
  icon.classList.add("fa-sun");
} else {
  document.body.classList.add("light-mode");
  icon.classList.add("fa-moon");
}

// Function to toggle the mode
const toggleMode = () => {
  const body = document.body;
  body.classList.toggle("light-mode");
  body.class;

  // Toggle between sun and moon icons
  const icon = document.getElementById("toggle-icon");
  if (body.classList.contains("light-mode")) {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  } else {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }
};

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    toggleMode();
  });

// Path to the dynamically created secrets file
const secretsPath = "./secrets.json";

fetch("./data/events.json")
  .then((response) => response.json())
  .then((data) => {
    const eventsList = document.getElementById("events-list");

    data.events.forEach((event) => {
      const li = document.createElement("li");
      li.classList.add("raised");
      li.innerHTML = createEventCard(event);
      eventsList.appendChild(li);
    });
  })
  .catch((error) => console.error("Error loading JSON:", error));
