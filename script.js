var defaultLocation = "";
var foundCurrent = false;

function titleCase(str) {
  return str
    ?.toLowerCase()
    ?.split(" ")
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
}

function dashCase(str) {
  return str
    ?.trim()
    ?.toLowerCase()
    ?.split(" ")
    ?.map((word) => word.charAt(0).toLowerCase() + word.slice(1))
    ?.join("-");
}

function sanitizeTag(str) {
  let result = str.split(/[,&]/);
  if (str.match(/nyt:.*=/g)) {
    return "";
  }
  return result;
}

const newEl = (tag, prop) => Object.assign(document.createElement(tag), prop);

function openPlayer(link) {
  const player = document.querySelector(".player");
  player.src = link;

  const playerWrapper = document.querySelector(".wrapper.hidden");
  playerWrapper?.classList.remove("hidden");
}

function hidePlayer() {
  const playerWrapper = document.querySelector(".wrapper");
  playerWrapper?.classList.add("hidden");
}

function createEventHeader(event) {
  var otherClass = "";
  const today = new Date();
  const eventDateTime = new Date(event.details.date);

  if (
    (today.getFullYear() <= eventDateTime.getFullYear() &&
      today.getMonth() == eventDateTime.getMonth() &&
      today.getDate() <= eventDateTime.getDate()) ||
    (today.getFullYear() <= eventDateTime.getFullYear() &&
      today.getMonth() < eventDateTime.getMonth() &&
      !foundCurrent)
  ) {
    otherClass = "current";
    foundCurrent = true;
  } else if (
    today.getFullYear() > eventDateTime.getFullYear() ||
    today.getMonth() > eventDateTime.getMonth() ||
    (today.getMonth() == eventDateTime.getMonth() &&
      today.getDate() > eventDateTime.getDate())
  ) {
    otherClass = "past";
  }

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

  return `<div class="event-card${
    otherClass ? " " + otherClass : ""
  }" json="${encodeURIComponent(JSON.stringify(event))}">
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
            }" target="_blank"><img class="storygraph-logo" src="/images/story-graph-logo.png"></a>
            
            <a class="link audiobookshelf" href="${audiobookshelfLink}" target="_blank"><img class="audiobookshelf-logo" src="/images/audiobookshelf-logo.svg"></a>
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

function createBookElement(event) {
  const book = event?.book;
  if (book?.isbn) {
    const coverLink = `https://covers.openlibrary.org/b/isbn/${book?.isbn}-L.jpg`;
    const el = newEl("link", {
      rel: "preload",
      href: coverLink,
      as: "image",
    });
    document.head.appendChild(el);

    const audiobookshelfLink = `https://audiobooks.milot.family/library/7ccd944b-d1d4-406d-8859-5e3db53e621e/search?q=${encodeURIComponent(
      event.book.title
    )}`;

    return getOpenLibraryData(book.isbn).then((data) => {
      // Construct book elements
      const bookCover = newEl("img", {
        className: "book-cover",
        src: coverLink,
      });
      const bookCoverWrapper = newEl("div", {
        className: "book-cover-wrapper",
      });
      const playButton = newEl("button", {
        classList: "play-button",
      });
      playButton.setAttribute(
        "onclick",
        `openPlayer('${
          event?.details?.links?.audiobookshelf ?? audiobookshelfLink
        }')`
      );
      bookCover.onload = function () {
        covers = Array.from(document.querySelectorAll(".book-cover"));
        covers.forEach((cover) => {
          if (cover.src == coverLink) {
            cover.previousElementSibling.classList.remove("hidden");
          }
        });
      };
      const playIcon = newEl("i", { className: "fas fa-circle-play" });
      playButton.appendChild(playIcon);
      bookCoverWrapper.appendChild(playButton);
      bookCoverWrapper.appendChild(bookCover);
      const bookEl = newEl("div", {
        className: "event-card__book",
      });
      bookEl.setAttribute("isbn", book.isbn);
      const bookItems = newEl("div", { className: "event-card__book-items" });
      const bookDetails = newEl("div", { className: "book-details" });
      const bookTags = newEl("div", { className: "book-tags" });
      const bookAuthor = newEl("a", {
        className: "book-item author",
        href: `${
          data?.authors[0]?.author?.key
            ? `https://openlibrary.org${data.authors[0].author.key}`
            : `https://www.google.com/search?q=${book?.author}`
        }`,
        target: "_blank",
        innerText: titleCase(book?.author),
      });

      const desc = data?.description?.value;
      var converter = new showdown.Converter();
      var markHtml = converter.makeHtml(desc);

      const bookDesc = newEl("div", {
        className: "book-item",
        innerHTML: markHtml,
      });

      data?.subjects &&
        Object.entries(data?.subjects)?.forEach((val) => {
          const sanitized = Array.from(sanitizeTag(val[1]));
          sanitized.forEach((tag) => {
            bookTags.appendChild(
              newEl("div", {
                className: "book-item",
                innerText: `#${dashCase(tag)}`,
              })
            );
          });
        });

      // Build book element structure
      book?.author.length > 0 && bookDetails.appendChild(bookAuthor);
      if (desc?.length > 0) bookDetails.appendChild(bookDesc);
      bookDetails.appendChild(bookTags);

      bookItems.appendChild(bookCoverWrapper);
      bookItems.appendChild(bookDetails);

      bookEl.appendChild(bookItems);
      return bookEl;
    });
  }
  return `<div class="event-card__book">
    <div class="event-card__book-items">
      ${
        book?.title?.length > 0
          ? `<span class="book-details">${
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

async function createEventCard(event) {
  const eventHeader = createEventHeader(event);
  const bookElement = await createBookElement(event);
  return `${eventHeader}${bookElement?.outerHTML || bookElement}`;
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

const setToggleButton = () => {
  const icon = document.getElementById("toggle-icon");
  if (document.body.classList.contains("light-mode")) {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  } else {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }
};

// Function to toggle the mode
const toggleMode = () => {
  document.body.classList.toggle("light-mode");
  setToggleButton();
};

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    toggleMode();
  });

// Path to the dynamically created secrets file
const secretsPath = "./secrets.json";

async function getOpenLibraryData(isbn) {
  const url = `https://openlibrary.org/search.json?q=isbn:${isbn}&limit=1.json`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const workId = data?.docs[0]?.key;
      if (workId) {
        return fetch(`https://openlibrary.org${workId}.json`)
          .then((response) => response.json())
          .then((data) => {
            return data;
          })
          .catch((error) => console.error("Failed to get book data:", error));
      } else {
        console.error(`Failed to find open library works for isbn ${isbn}`);
      }
    })
    .catch((error) => {
      console.error("Failed to look up book information:", error);
    });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(() => {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "CACHE_UPDATED") {
        refreshEvents();
      }
    });
  });
}

function eventCardToJson(eventCard) {
  if (!eventCard) return null;
  return JSON.parse(decodeURIComponent(eventCard.getAttribute("json")));
}

function refreshEvents() {
  setToggleButton();
  fetch("./data/events.json")
    .then((response) => response.json())
    .then(async (data) => {
      const eventsList = document.getElementById("events-list");
      const existingEventCards = Array.from(
        document.querySelectorAll(".event-card")
      );

      for (const event of data.events) {
        let foundCard = false;
        const newCard = await createEventCard(event);

        for (const oldCard of existingEventCards) {
          const oldEvent = eventCardToJson(oldCard);
          if (
            (oldEvent?.book?.title ?? "TBD") ===
              (event?.book?.title ?? "TBD") &&
            ((oldEvent?.details?.date == event?.details?.date &&
              oldEvent?.details?.host == event?.details?.host) ||
              oldEvent?.details?.links?.storygraph ==
                event?.details?.links?.storygraph)
          ) {
            foundCard = true;

            // Compare JSON objects for changes
            if (JSON.stringify(oldEvent) !== JSON.stringify(event)) {
              const parentLi = oldCard.closest("li");
              if (parentLi) {
                newCard.className = oldCard.className;
                parentLi.innerHTML = newCard;
              }
            }
            break;
          }
        }

        if (!foundCard) {
          // Add new card
          const li = newEl("li", { className: "raised" });
          li.innerHTML = newCard;
          eventsList.appendChild(li);
        }
      }
    })
    .catch((error) => console.error("Error loading JSON:", error));
}

// Load events initially
// refreshEvents();

function createEventList(events) {
  const eventsList = document.getElementById("events-list");
  const loadingSpinner = document.getElementById("loading-spinner");

  // Show the spinner
  loadingSpinner.classList.remove("hidden");

  const promises = events.map(async (event, index) => {
    const li = newEl("li", { className: "raised hidden" }); // Start as hidden
    li.innerHTML = await createEventCard(event);

    // Wait for all images in the <li> to load
    const images = li.querySelectorAll("img");
    const imageLoadPromises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve(); // Image already loaded
          } else {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve);
          }
        })
    );

    // Wait for all image load promises to resolve
    await Promise.all(imageLoadPromises);

    return { li, index };
  });

  // Wait for all promises to resolve
  Promise.all(promises)
    .then((resolvedItems) => {
      // Sort resolved items based on the original index
      resolvedItems.sort((a, b) => a.index - b.index);

      // Append each `li` to the event list
      resolvedItems.forEach(({ li }) => {
        eventsList.appendChild(li);
        li.classList.remove("hidden"); // Show each <li> after its content is ready
      });

      // Remove the hidden class from the entire list
      eventsList.classList.remove("hidden");

      // Hide the spinner after everything is loaded
      loadingSpinner.classList.add("hidden");
    })
    .catch((error) => {
      console.error("Error creating event list:", error);
      // Hide spinner in case of an error
      loadingSpinner.classList.add("hidden");
    });
}

async function setup() {
  try {
    const response = await fetch("./data/events.json");
    const data = await response.json();

    if (data?.events?.length) {
      createEventList(data.events);
    } else {
      console.warn("No events found in the JSON data.");
      document.getElementById("events-list").classList.remove("hidden");
    }
  } catch (error) {
    console.error("Failed to initialize events list:", error);
    document.getElementById("events-list").classList.remove("hidden");
  }
}

setup();
