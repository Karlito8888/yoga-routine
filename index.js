const main = document.querySelector("main");
const basicArray = Array.from({ length: 10 }, (_, i) => ({ pic: i, min: 1 }));
let exerciceArray = [];
let isRoutineRunning = false;
let dashboardModified = false;

// Fonction pour récupérer ou initialiser les exercices
function initializeExercises() {
  exerciceArray = localStorage.exercices
    ? JSON.parse(localStorage.exercices)
    : [...basicArray];
}
initializeExercises();

class Exercice {
  constructor() {
    this.index = 0;
    this.minutes = exerciceArray[this.index].min;
    this.seconds = 0;
    this.music = new Audio("music.mp3");
    this.music.loop = true;
    this.musicTimeout = null;
    this.fadeDuration = 5;
  }

  startFadeOut() {
    const fadeOutInterval = 200;
    const volumeStep =
      this.music.volume / ((this.fadeDuration * 1000) / fadeOutInterval);
    const fadeAudio = setInterval(() => {
      if (this.music.volume - volumeStep > 0) {
        this.music.volume -= volumeStep;
      } else {
        this.music.pause();
        this.music.currentTime = 0;
        this.music.volume = 1;
        clearInterval(fadeAudio);
      }
    }, fadeOutInterval);
  }

  updateCountdown() {
    if (this.seconds === 0 && this.minutes === exerciceArray[this.index].min) {
      setTimeout(() => {
        this.music.play();
        const totalDuration = this.minutes * 60 + parseInt(this.seconds) - 1;
        this.musicTimeout = setTimeout(() => {
          this.startFadeOut();
        }, (totalDuration - this.fadeDuration) * 1000);
      }, 1000);
    }

    this.seconds = this.seconds < 10 ? `0${this.seconds}` : this.seconds;
    setTimeout(() => {
      if (this.minutes === 0 && this.seconds === "00") {
        this.ring();
        clearTimeout(this.musicTimeout);
        this.music.pause();
        this.music.currentTime = 0;
        if (++this.index < exerciceArray.length) {
          const { min } = exerciceArray[this.index];
          Object.assign(this, { minutes: min, seconds: 0 });
          this.updateCountdown();
        } else {
          page.finish();
          isRoutineRunning = false;
        }
      } else {
        this.seconds = this.seconds === "00" ? 59 : this.seconds - 1;
        this.minutes = this.seconds === 59 ? this.minutes - 1 : this.minutes;
        this.updateCountdown();
      }
    }, 1000);

    main.innerHTML = `
      <div class="exercice-container">
        <p>${this.minutes}:${this.seconds}</p>
        <img src="./img/${
          exerciceArray[this.index].pic
        }.png" alt="Exercice Image"/>
        <div>${this.index + 1}/${exerciceArray.length}</div>
      </div>`;
  }

  ring() {
    const audio = new Audio("ring.mp3");
    audio.play();
  }
}

const utils = {
  pageContent(title, content, btn) {
    document.querySelector("h2").innerHTML = title;
    main.innerHTML = content;
    const btnContainer = document.querySelector(".btn-container");
    if (btnContainer) btnContainer.innerHTML = btn;
  },

  handleEventListeners() {
    document
      .querySelectorAll(".fa-chevron-up, .fa-chevron-down")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const { pic, action } = e.target.dataset;
          const exo = exerciceArray.find((exo) => exo.pic.toString() === pic);
          if (exo) {
            if (action === "increment" && exo.min < 10) {
              exo.min++;
            } else if (action === "decrement" && exo.min > 1) {
              exo.min--;
            }
            document.getElementById(`min-${pic}`).textContent = exo.min;
            utils.store(); // Sauvegarde le nouvel état dans le localStorage
          }
        });
      });

    document.querySelectorAll(".arrow, .deleteBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const { pic } = e.target.dataset;
        if (e.target.classList.contains("arrow")) {
          utils.moveItem(pic);
        } else if (e.target.classList.contains("deleteBtn")) {
          utils.deleteItem(pic);
        }
        page.lobby();
        utils.store();
      });
    });

    document
      .getElementById("reboot")
      ?.addEventListener("click", () => utils.reboot());
    document.getElementById("start")?.addEventListener("click", function () {
      if (!isRoutineRunning) {
        isRoutineRunning = true;
        page.routine();
      }
    });
  },

  moveItem(pic) {
    const index = exerciceArray.findIndex((exo) => exo.pic.toString() === pic);
    if (index > 0) {
      [exerciceArray[index], exerciceArray[index - 1]] = [
        exerciceArray[index - 1],
        exerciceArray[index],
      ];
    }
  },

  deleteItem(pic) {
    exerciceArray = exerciceArray.filter((exo) => exo.pic.toString() !== pic);
    dashboardModified = true; // Indique que le tableau de bord a été modifié
    this.store();
    page.lobby();
  },

  reboot() {
    exerciceArray = [...basicArray];
    dashboardModified = false;
    this.store();
    page.lobby();
  },

  store() {
    localStorage.exercices = JSON.stringify(exerciceArray);
  },
};

const page = {
  lobby() {
    const mapArray = exerciceArray
      .map(
        (exo) => `
      <li>
       <div class="card-header">
       <div class="chevrons">
        <i class="fa-solid fa-chevron-up" aria-hidden="true" data-pic="${exo.pic}" data-action="increment"></i>
         <i class="fa-solid fa-chevron-down" aria-hidden="true" data-pic="${exo.pic}" data-action="decrement"></i>
         </div>
        <span id="min-${exo.pic}">${exo.min}</span><span>&nbsp;min</span>
      </div>
        <img src="./img/${exo.pic}.png" alt="Exercice Image"/>
        <i class="fa-solid fa-circle-arrow-left arrow" data-pic="${exo.pic}"></i>
        <i class="fa-solid fa-circle-xmark deleteBtn" data-pic="${exo.pic}"></i>
      </li>`
      )
      .join("");

    const title = dashboardModified
      ? "Tous les exercices...<i id='reboot' class='fa-solid fa-rotate-left'></i>"
      : "Sélectionnez vos exercices";

    utils.pageContent(
      title,
      `<ul>${mapArray}</ul>`,
      "<button id='start'>On y va ! 💪<i class='fa-regular fa-circle-play'></i></button>"
    );

    document
      .getElementById("reboot")
      ?.addEventListener("click", () => utils.reboot());
    document.getElementById("start").addEventListener("click", function () {
      if (!isRoutineRunning) {
        isRoutineRunning = true;
        const audio = new Audio("go.mp3"); // Joue le son au début de la routine
        audio.play();
        page.routine();
      }
    });
    utils.handleEventListeners();
  },

  routine() {
    const exercice = new Exercice();
    exercice.updateCountdown();
    utils.pageContent(
      "C'est parti ! 💪",
      "<div class='exercice-container'></div>",
      ""
    );
  },

  finish() {
    utils.pageContent(
      "C'est terminé ! ⏰ <br><br> 👏 Félicitations 👏",
      "<button id='start'>On recommence ?</button>",
      "<button id='reboot' class='btn-reboot'>...ou on arrête ? <i class='fa-solid fa-circle-xmark'></i></button>"
    );
    document.getElementById("start").addEventListener("click", function () {
      isRoutineRunning = false; // Permet de recommencer la routine
      page.routine();
    });
    document.getElementById("reboot")?.addEventListener("click", () => {
      isRoutineRunning = false; // Réinitialise l'état avant de redémarrer
      utils.reboot();
    });
  },
};

page.lobby();
