<script lang="ts">
import { createTimeline, engine, type Timeline } from "animejs";
import { Tooltip } from "bootstrap";
import { onMount } from "svelte";

const StateTypes = {
  FORWARDS: "FORWARDS",
  BACKWARDS: "BACKWARDS",
  WAITING: "WAITING",
} as const;

type StateType = (typeof StateTypes)[keyof typeof StateTypes];

type Starbuncle = {
  name: string;
  adopter: string;
  bio: string;
  color: string;
};

function getType(newState: StateType) {
  switch (newState) {
    case "FORWARDS":
    case "BACKWARDS":
      return "run";
    default:
      return "sitting";
  }
}

function setState(newState: StateType) {
  state = newState;
  const type = getType(newState);
  const color = starbuncle.color == "rainbow" ? "white" : starbuncle.color;
  src = `/starbuncles/starbuncle_${type}_${color}.${type == "run" ? "gif" : "png"}`;
}

engine.pauseOnDocumentHidden = false;

let wrapper: Element;
let tooltip: Tooltip | null = null;
let state = "none";
let src = "";
let starbuncles: Starbuncle[] = [
  {
    name: "Bailey",
    adopter: "Ars Nouveau Team",
    bio: "Ars Nouveau is a passion project brought to life by hundreds of contributions from the community. We hope you enjoy this Rainbow-buncle as much as we enjoy making this mod! Thanks for playing!",
    color: "rainbow",
  },
];

let starbuncle = starbuncles[0];

setState(StateTypes.FORWARDS);

function getRandomStarbuncleIndex() {
  return Math.floor(Math.random() * starbuncles.length);
}

function updateTooltip() {
  if (wrapper == null) return;
  if (tooltip != null) tooltip.dispose();
  tooltip = new Tooltip(wrapper, {
    title: starbuncle.bio,
  });
}

onMount(() => {
  let timeline: Timeline | null = null;

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timeline = createTimeline({
      loop: true,
      ease: "linear",
    })
      .add(".buncle-box", {
        translateX: "80%",
        duration: 3500,
        onBegin() {
          setState(StateTypes.FORWARDS);
        },
      })
      .add({
        duration: 5000,
        onBegin() {
          setState(StateTypes.WAITING);
        },
      })
      .add(".buncle-box", {
        translateX: "-25%",
        duration: 3500,
        onBegin() {
          setState(StateTypes.BACKWARDS);
        },
        onComplete() {
          starbuncle = starbuncles[getRandomStarbuncleIndex()];
          updateTooltip();
        },
      })
      .add({
        duration: 1000,
      });
  }

  fetch(
    "https://cdn.jsdelivr.net/gh/baileyholl/Ars-Nouveau@refs/heads/main/supporters.json",
  )
    .then((response) => response.json())
    .then((data) => {
      starbuncles.push(...data.starbuncleAdoptions);
    })
    .catch(() => {});

  updateTooltip();

  return () => {
    timeline?.revert();
    tooltip?.dispose();
  };
});
</script>

<style>
    .no-pointer {
        pointer-events: none
    }

    .pointer {
        pointer-events: auto;
    }

    .buncle-container {
        overflow: hidden;
        height: 50px;
        max-width: 500px;
        margin: auto;
        margin-top: 10px;
    }

    .buncle-box {
        height: 50px;
        width: 100%;
        background-color: white;
        position: relative;
        top: -100%;
    }

    :global(html[data-bs-theme="dark"]) .buncle-box {
        background-color: rgb(23, 24, 28);
    }

    .buncle {
        height: 100%;
        margin-left: -3px;
        image-rendering: crisp-edges;
    }

    .buncle-name {
        position: relative;
        height: 50px;
    }

    .mirrored {
        transform: scaleX(-1);
        margin-left: -7px;
    }

    .rainbow {
        animation-name: rainbow;
        animation-duration: 15s;
        animation-iteration-count: infinite;
        animation-direction: alternate;
    }

    @keyframes rainbow {
        0% {
            filter: sepia() saturate(2.25) hue-rotate(0deg);
        }
        100% {
            filter: sepia() saturate(2.25) hue-rotate(360deg);
        }
    }
</style>

<div class="container-lg fixed-top no-pointer d-none d-xxl-block">
    <div bind:this={wrapper} class="buncle-container pointer" data-bs-toggle="tooltip" data-bs-placement="bottom">
        <div class="buncle-name d-flex flex-column align-items-center">
            <p class="mb-0 text-body-emphasis">{starbuncle.name}</p>
            <p class="fs-6 lh-1">{starbuncle.adopter}</p>
        </div>
        <div class="buncle-box" style="transform: translateX(-25%)">
            <img src={src} alt="animated running Starbuncle" class="buncle" class:mirrored={state === "BACKWARDS"} class:rainbow={starbuncle.color === "rainbow"} />
        </div>
    </div>
</div>
