import { getCanonicalGlyph } from "@ars/addon-builder";
import { createAuthClient } from "better-auth/client";
import TomSelect from "tom-select";
import {
  parseCompressedSpell,
  parseJsonSpell,
} from "../../utils/spell-data/spell-parser";
import type { SpellColor, SpellSound } from "../../utils/spell-data/spells";
import {
  createSpellSubmissionFormSchema,
  deriveAddonsFromGlyphs,
} from "../../utils/spell-submissions/schema";

type GlyphOption = {
  value: string;
  text: string;
  namespace: string;
  registryName: string;
  image: string;
};

type CategoryOption = {
  value: string;
  text: string;
  class: string;
};

type VersionOption = {
  value: string;
};

type SessionUser = {
  id?: string;
  name?: string | null;
  username?: string | null;
  displayName?: string | null;
  image?: string | null;
};

type PersistedSpellForm = {
  spell?: string;
  description?: string;
  glyphs?: string[];
  category?: string;
  versions?: string[];
  style?: string;
  spell_color?: string;
  spell_sound?: string;
};

export function initSpellForm() {
  const app = document.getElementById("spellSubmitApp") as HTMLElement;
  const glyphOptions = JSON.parse(
    app.dataset.glyphOptions || "[]",
  ) as GlyphOption[];
  const addonLabels = JSON.parse(app.dataset.addonLabels || "{}") as Record<
    string,
    string
  >;
  const categoryOptions = JSON.parse(
    app.dataset.categoryOptions || "[]",
  ) as CategoryOption[];
  const versionOptions = JSON.parse(
    app.dataset.versionOptions || "[]",
  ) as VersionOption[];
  const spellFormSchema = createSpellSubmissionFormSchema(
    categoryOptions.map((option) => option.value),
    versionOptions.map((option) => option.value),
  );
  const availableGlyphValues = new Set(
    glyphOptions.map((option) => option.value),
  );
  const registryToCanonicalGlyph = new Map(
    glyphOptions.flatMap((option) => [
      [option.value, option.value],
      [option.registryName, option.value],
    ]),
  );

  const authClient = createAuthClient();
  const form = document.getElementById("spellForm") as HTMLFormElement;
  const submitBtn = document.getElementById("submitBtn") as HTMLButtonElement;
  const clearFormBtn = document.getElementById(
    "clearFormBtn",
  ) as HTMLButtonElement;
  const signInBtn = document.getElementById(
    "discordSignInBtn",
  ) as HTMLButtonElement;
  const signOutBtn = document.getElementById(
    "discordSignOutBtn",
  ) as HTMLButtonElement;
  const userLabel = document.getElementById(
    "discordUserLabel",
  ) as HTMLSpanElement;
  const result = document.getElementById("submitResult") as HTMLDivElement;
  const derivedAddons = document.getElementById(
    "derivedAddons",
  ) as HTMLDivElement;

  const storageKey = "ars-guide:spell-submit-form";
  let currentUser: SessionUser | null = null;
  let isRestoringDraft = false;

  const renderGlyphOption = (
    data: GlyphOption,
    escape: (input: string) => string,
  ) => `
        <div class="d-flex align-items-center gap-2">
            <img src="${escape(data.image)}" alt="" width="24" height="24" loading="lazy" />
            <span>${escape(data.text)}</span>
            <small class="text-body-secondary">${escape(data.value)}</small>
        </div>
    `;

  const glyphSelect = new TomSelect("#glyphs", {
    valueField: "value",
    labelField: "text",
    searchField: ["text", "value", "namespace"],
    sortField: "text",
    options: glyphOptions,
    plugins: ["drag_drop", "caret_position", "remove_button"],
    create: false,
    hideSelected: false,
    duplicates: true,
    render: {
      option: renderGlyphOption,
      item: renderGlyphOption,
    },
    onItemAdd: () => {
      glyphSelect.setTextboxValue();
      glyphSelect.refreshOptions();
      updateDerivedAddons();
      persistFormDraft();
    },
    onItemRemove: () => {
      updateDerivedAddons();
      persistFormDraft();
    },
    onClear: () => {
      updateDerivedAddons();
      persistFormDraft();
    },
  });

  const categorySelect = new TomSelect("#category", {
    optgroups: [
      { value: "combat", label: "Combat" },
      { value: "other", label: "Other" },
    ],
    optgroupField: "class",
    labelField: "text",
    searchField: ["text"],
    options: categoryOptions,
    maxItems: 1,
    create: false,
    onChange: persistFormDraft,
  });

  const versionSelect = new TomSelect("#versions", {
    labelField: "value",
    searchField: ["value"],
    options: versionOptions,
    create: false,
    onChange: persistFormDraft,
  });

  function showResult(
    message: string,
    type: "success" | "danger" | "info" = "info",
  ) {
    result.textContent = message;
    result.className = `alert alert-${type} mt-3`;
  }

  function getInputValue(id: string) {
    return (
      (
        document.getElementById(id) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null
      )?.value ?? ""
    );
  }

  function setInputValue(id: string, value?: string) {
    const input = document.getElementById(id) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (input) input.value = value ?? "";
  }

  function persistFormDraft() {
    if (isRestoringDraft) return;

    const draft: PersistedSpellForm = {
      spell: getInputValue("spell"),
      description: getInputValue("description"),
      glyphs: [...glyphSelect.items],
      category: categorySelect.items[0],
      versions: [...versionSelect.items],
      style: getInputValue("style"),
      spell_color: getInputValue("spell_color"),
      spell_sound: getInputValue("spell_sound"),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.warn("Failed to persist spell form draft:", error);
    }
  }

  function restoreFormDraft() {
    let draft: PersistedSpellForm | null = null;

    try {
      const rawDraft = localStorage.getItem(storageKey);
      draft = rawDraft ? (JSON.parse(rawDraft) as PersistedSpellForm) : null;
    } catch (error) {
      console.warn("Failed to restore spell form draft:", error);
    }

    if (!draft) return;

    isRestoringDraft = true;
    setInputValue("spell", draft.spell);
    setInputValue("description", draft.description);
    setInputValue("style", draft.style);
    setInputValue("spell_color", draft.spell_color);
    setInputValue("spell_sound", draft.spell_sound);

    glyphSelect.clear(true);
    draft.glyphs?.forEach((glyph) => {
      if (availableGlyphValues.has(glyph)) glyphSelect.addItem(glyph, true);
    });

    categorySelect.clear(true);
    if (draft.category) categorySelect.addItem(draft.category, true);

    versionSelect.clear(true);
    draft.versions?.forEach((version) => versionSelect.addItem(version, true));

    isRestoringDraft = false;
    updateDerivedAddons();
  }

  function clearFormDraft(showMessage = true) {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear spell form draft:", error);
    }

    isRestoringDraft = true;
    form.reset();
    glyphSelect.clear(true);
    categorySelect.clear(true);
    versionSelect.clear(true);
    isRestoringDraft = false;
    form.classList.remove("was-validated");
    form.querySelectorAll(".is-valid, .is-invalid").forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
    });
    updateDerivedAddons();
    if (showMessage) showResult("Cleared saved spell draft.", "info");
  }

  function canonicalizeClientGlyph(value: string) {
    const direct = registryToCanonicalGlyph.get(value);
    if (direct) return direct;

    const canonical = getCanonicalGlyph(value);
    return canonical && availableGlyphValues.has(canonical)
      ? canonical
      : undefined;
  }

  function updateDerivedAddons() {
    const addons = deriveAddonsFromGlyphs(glyphSelect.items);
    derivedAddons.replaceChildren();

    if (addons.length === 0) {
      const badge = document.createElement("span");
      badge.className = "badge text-bg-secondary";
      badge.textContent = "No addons";
      derivedAddons.appendChild(badge);
      return;
    }

    addons.forEach((addon) => {
      const badge = document.createElement("span");
      badge.className = "badge text-bg-info";
      badge.textContent = addonLabels[addon] || addon;
      derivedAddons.appendChild(badge);
    });
  }

  async function refreshSession() {
    try {
      const session = await authClient.getSession();
      currentUser = (session.data?.user ?? null) as SessionUser | null;
    } catch (error) {
      console.error("Failed to load auth session:", error);
      currentUser = null;
    }

    const displayName =
      currentUser?.displayName ||
      currentUser?.name ||
      currentUser?.username ||
      null;
    const signedIn = Boolean(displayName);

    submitBtn.disabled = !signedIn;
    signInBtn.classList.toggle("d-none", signedIn);
    signOutBtn.classList.toggle("d-none", !signedIn);
    userLabel.textContent = signedIn ? `Signed in as ${displayName}` : "";
  }

  signInBtn.addEventListener("click", async () => {
    await authClient.signIn.social({
      provider: "discord",
      callbackURL: window.location.pathname,
    });
  });

  signOutBtn.addEventListener("click", async () => {
    await authClient.signOut();
    await refreshSession();
  });

  clearFormBtn.addEventListener("click", () => clearFormDraft());

  document
    .getElementById("importClipboardBtn")
    ?.addEventListener("click", async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const spellData = clipboardText.trim().startsWith("{")
          ? parseJsonSpell(clipboardText)
          : parseCompressedSpell(clipboardText);

        if (!spellData) {
          showResult("Failed to parse spell from clipboard.", "danger");
          return;
        }

        const importedColor =
          "color" in spellData
            ? (spellData.color as SpellColor | null | undefined)
            : undefined;
        const importedSound =
          "sound" in spellData
            ? (spellData.sound as SpellSound | null | undefined)
            : undefined;

        fillFormWithSpellData({
          name: spellData.name,
          glyphs: spellData.glyphs,
          spell_color: importedColor ?? undefined,
          spell_sound: importedSound ?? undefined,
          spell_style: spellData.particleTimeline ?? undefined,
        });
      } catch (err) {
        console.error("Clipboard read failed:", err);
        showResult("Could not read from clipboard.", "danger");
      }
    });

  form.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", persistFormDraft);
    input.addEventListener("change", persistFormDraft);
    input.addEventListener(
      "blur",
      () => {
        if ((input as HTMLInputElement | HTMLTextAreaElement).checkValidity()) {
          input.classList.add("is-valid");
          input.classList.remove("is-invalid");
        } else {
          input.classList.remove("is-valid");
          input.classList.add("is-invalid");
        }
      },
      false,
    );
  });

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add("was-validated");

      if (!currentUser) {
        showResult("Please sign in with Discord before submitting.", "danger");
        return;
      }

      if (!form.checkValidity()) return;

      const formData = new FormData(form);
      const parsed = spellFormSchema.safeParse(Object.fromEntries(formData));
      if (!parsed.success) {
        showResult("Please check the form fields and try again.", "danger");
        console.error(parsed.error.issues);
        return;
      }

      submitBtn.disabled = true;
      showResult("Submitting spell and opening a pull request…", "info");

      try {
        const response = await fetch("/api/submit", {
          method: "POST",
          body: formData,
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body.error || "Submission failed.");
        }

        showResult(
          body.pullRequestUrl
            ? `Pull request opened: ${body.pullRequestUrl}`
            : "Pull request opened.",
          "success",
        );
        clearFormDraft(false);
      } catch (error) {
        console.error("Submission failed:", error);
        showResult(
          error instanceof Error ? error.message : "Submission failed.",
          "danger",
        );
      } finally {
        submitBtn.disabled = !currentUser;
      }
    },
    false,
  );

  function fillFormWithSpellData({
    name,
    glyphs,
    spell_color,
    spell_sound,
    spell_style,
  }: {
    name: string;
    glyphs: string[];
    spell_color?: SpellColor | null;
    spell_sound?: SpellSound | null;
    spell_style?: Record<string, any> | null;
  }) {
    const spellInput = document.getElementById("spell") as HTMLInputElement;
    const spellStyle = document.getElementById("style") as HTMLInputElement;
    const spellColor = document.getElementById(
      "spell_color",
    ) as HTMLInputElement;
    const spellSound = document.getElementById(
      "spell_sound",
    ) as HTMLInputElement;
    const unknownGlyphs: string[] = [];

    spellInput.value = name;
    glyphSelect.clear();

    glyphs.forEach((glyph) => {
      const canonical = canonicalizeClientGlyph(glyph);
      if (canonical) {
        glyphSelect.addItem(canonical, true);
      } else {
        unknownGlyphs.push(glyph);
      }
    });

    if (unknownGlyphs.length > 0) {
      showResult(
        `Skipped unknown glyphs: ${unknownGlyphs.join(", ")}`,
        "danger",
      );
    }

    spellInput.dispatchEvent(new Event("blur"));
    spellStyle.value = spell_style ? JSON.stringify(spell_style) : "";
    spellColor.value = spell_color ? JSON.stringify(spell_color) : "";
    spellSound.value = spell_sound ? JSON.stringify(spell_sound) : "";
    updateDerivedAddons();
    persistFormDraft();
  }

  restoreFormDraft();
  void refreshSession();
}
