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
    ?.toLowerCase()
    ?.split(" ")
    ?.map((word) => word.charAt(0).toLowerCase() + word.slice(1))
    ?.join("-");
}

const newEl = (tag, prop) => Object.assign(document.createElement(tag), prop);

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

  return `<div class="event-card${otherClass ? " " + otherClass : ""}">
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
  if (book?.isbn) {
    const coverLink = `https://covers.openlibrary.org/b/isbn/${book?.isbn}-L.jpg`;
    const el = newEl("link", {
      rel: "preload",
      href: coverLink,
      as: "image",
    });
    document.head.appendChild(el);

    return getOpenLibraryData(book.isbn).then((data) => {
      // Construct book elements
      const bookCover = newEl("img", {
        className: "book-cover",
        src: coverLink,
      });
      const bookEl = newEl("div", {
        className: "event-card__book",
      });
      const bookItems = newEl("div", { className: "event-card__book-items" });
      const bookDetails = newEl("div", { className: "book-details" });
      const bookTags = newEl("div", { className: "book-tags" });
      const bookAuthor = newEl("a", {
        className: "book-item",
        href: `${
          data?.authors[0]?.author?.key
            ? `https://openlibrary.org${data.authors[0].author.key}`
            : `https://www.google.com/search?q=${book?.author}`
        }`,
        target: "_blank",
        innerText: titleCase(book?.author),
      });
      // console.log(data);
      const desc = data.description.value;
      var converter = new showdown.Converter();
      var markHtml = converter.makeHtml(desc);

      const bookDesc = newEl("div", {
        className: "book-item",
        innerHTML: markHtml,
      });

      data?.subjects &&
        Object.entries(data?.subjects)?.forEach((val) => {
          bookTags.appendChild(
            newEl("div", {
              className: "book-item",
              innerText: `#${dashCase(val[1])}`,
            })
          );
        });

      // Build book element structure
      book?.author.length > 0 && bookDetails.appendChild(bookAuthor);
      bookDetails.appendChild(bookDesc);
      bookDetails.appendChild(bookTags);

      bookItems.appendChild(bookCover);
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
  const bookElement = await createBookElement(event?.book);
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
      const li = newEl("li", { className: "raised" });
      (async () => {
        li.innerHTML = await createEventCard(event);
      })();
      eventsList.appendChild(li);
    });
  })
  .catch((error) => console.error("Error loading JSON:", error));

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
