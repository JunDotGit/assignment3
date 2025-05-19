let selectedDifficulty = null;
let matchedPairs = 0;
let clickCount = 0;

async function generateCards(difficulty) {
  const cardContainer = $("#game_grid");
  cardContainer.removeClass("easy medium hard").addClass(difficulty).empty();

  let pairCount;
  if (difficulty === "easy") pairCount = 3;
  else if (difficulty === "medium") pairCount = 6;
  else if (difficulty === "hard") pairCount = 12;

  const usedIDs = new Set();
  const pokemons = [];

  // Retrieve unique random Pokémon IDs
  while (pokemons.length < pairCount) {
    const randomID = Math.floor(Math.random() * 898) + 1;
    if (!usedIDs.has(randomID)) {
      usedIDs.add(randomID);
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomID}`);
      const data = await res.json();
      const imgUrl = data.sprites.other["official-artwork"].front_default;
      if (imgUrl) {
        pokemons.push({ id: randomID, img: imgUrl });
      }
    }
  }

  // Create and shuffle card pairs
  const cards = [...pokemons, ...pokemons].sort(() => 0.5 - Math.random());

  for (let i = 0; i < cards.length; i++) {
    const poke = cards[i];
    const frontImg = `<img class="front_face" id="img${i}" src="${poke.img}" data-id="${poke.id}" alt="">`;
    const backImg = `<img class="back_face" src="back.webp" alt="">`;
    const card = `<div class="card">${frontImg}${backImg}</div>`;
    cardContainer.append(card);
  }
}

function setup() {
  $("#game_grid").hide();

  let firstCard = undefined;
  let secondCard = undefined;
  let lockBoard = false;
  let matchedPairs = 0;

  // Start button: generate cards and begin game
  $("#start-btn").on("click", async function () {
    if (!selectedDifficulty) {
      alert("Please select a difficulty first.");
      return;
    }

    await generateCards(selectedDifficulty);
    $("#game_grid").fadeIn();
    resetGame();
    shuffleCards();
    startTimer();
  });

  // Reset button: regenerate and restart game
  $("#reset-btn").on("click", async function () {
    if (!selectedDifficulty) {
      alert("Please select a difficulty first.");
      return;
    }

    await generateCards(selectedDifficulty);
    resetGame();
    shuffleCards();
    startTimer();
  });

  // Card click handling
  function initCardClicks() {
    $(".card").on("click", function () {
      if (lockBoard || $(this).hasClass("flip")) return;

      $(this).addClass("flip");
      clickCount++;
      $("#clicks").text(clickCount);

      if (!firstCard) {
        firstCard = $(this).find(".front_face")[0];
      } else {
        secondCard = $(this).find(".front_face")[0];
        lockBoard = true;

        if (firstCard.dataset.id === secondCard.dataset.id) {
          $(`#${firstCard.id}`).parent().addClass("matched").off("click");
          $(`#${secondCard.id}`).parent().addClass("matched").off("click");
          matchedPairs++;
          matchedSinceStart++;
          updateMatchedCount();
          resetTurn();
        } else {
          // If no match, flip both back after 1 second
          setTimeout(() => {
            $(`#${firstCard.id}`).parent().removeClass("flip");
            $(`#${secondCard.id}`).parent().removeClass("flip");
            resetTurn();
          }, 1000);
        }
      }
    });
  }

  let startTime;
  let timeLimit = 100;
  let timerInterval;
  let matchedSinceStart = 0;
  let powerUpTriggered = false;

  // Timer and Power-Up trigger logic
  function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      $("#time-info").text(`You got ${timeLimit} seconds. ${elapsed} seconds passed!`);

      // Game over condition
      if (elapsed >= timeLimit) {
        clearInterval(timerInterval);
        $("#time-info").append(" Game Over!");
        $(".card").off("click");
      }
    }, 1000);
  }

  // Power-Up: flip all cards briefly
  $("#power-up").on("click", function () {
    alert("Power-Up activated! All cards will be shown for 1 second.");

    $(".card").addClass("flip");
    setTimeout(() => {
      $(".card").not(".matched").removeClass("flip");
    }, 1000);
  });

  // Difficulty selection and timer update
  $(".diff-btn").on("click", function () {
    selectedDifficulty = $(this).data("diff");

    if (selectedDifficulty === "easy") timeLimit = 100;
    else if (selectedDifficulty === "medium") timeLimit = 200;
    else if (selectedDifficulty === "hard") timeLimit = 300;

    $(".diff-btn").removeClass("active");
    $(this).addClass("active");
  });

  // Shuffle cards and rebind click events
  function shuffleCards() {
    const cards = $("#game_grid .card").toArray();
    const shuffled = cards.sort(() => 0.5 - Math.random());
    $("#game_grid").empty().append(shuffled);
    initCardClicks();
  }

  // Update match count and check for win
  function updateMatchedCount() {
    $("#matched-count").text(matchedPairs);

    const totalPairs = $(".card").length / 2;
    const remaining = totalPairs - matchedPairs;
    $("#pairs-left").text(remaining);

    if (matchedPairs === totalPairs) {
      clearInterval(timerInterval);
      setTimeout(() => {
        alert("You win!");
      }, 1000);
      $(".card").off("click");
    }
  }

  // Reset card state
  function resetTurn() {
    firstCard = undefined;
    secondCard = undefined;
    lockBoard = false;
  }

  // Reset game stats and state
  function resetGame() {
    matchedPairs = 0;
    clickCount = 0;

    $("#matched-count").text("0");
    $("#clicks").text("0");

    const totalPairs = $(".card").length / 2;
    $("#total-pairs").text(totalPairs);
    $("#pairs-left").text(totalPairs);

    $(".card").removeClass("flip");
    $(".card").off("click");
  }

  // Toggle dark/light theme
  $("#theme-toggle").on("click", function () {
    $("body").toggleClass("dark");
  });
}

$(document).ready(setup);
