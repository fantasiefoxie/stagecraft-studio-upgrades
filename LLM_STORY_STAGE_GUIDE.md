# Katha Studio — Complete Human & AI Operating Manual

Use this guide with **both Humans and LLMs** (from bare-minimum 7B–9B local models to medium cloud models like Gemini 2.5 Flash / GPT-4o-mini up to frontier Pro/Sonnet models) to design unique characters, direct expressive 60fps episodes, and stay safely monetized on YouTube.

---

## 1. Quickstart: Humans vs. LLMs

### For Humans (5-Step Studio Workflow)
1. **Pick or Generate a Story**: Open the **AI / Script** tab, paste a folklore idea or Gutenberg story, choose your **Language (19 supported)**, **Region Playbook**, and **Beat Length**, then click **Generate & Auto-Direct Episode** (or load any of the 20 preset episodes).
2. **Sculpt Unique Characters (Zero Templates)**: Open the **Look** tab -> click **Workshop** on any cast member (or **+ New Entity**) to launch the Sims-style **Entity DNA Workshop**. Build humans, animals, mythic creatures, or spirits across 6 body chassis, modular parts, morph sliders, and 7-channel palettes, then optionally click **Save to Bible** to lock recurring series heroes.
3. **Direct Stage, Expressions & Props**: In the **Direct** tab, toggle **Stage Move Mode** to drag actors/props directly on the canvas, attach props to a character's moving wrist (`propAnchor`), and run **Auto-Direct Faces** or **AI Direct Emotions** for subtext-aware speaker + listener facial acting.
4. **Voice & Music**: Open the **Voice** tab to generate multi-character TTS (Gemini, OpenAI, ElevenLabs, or Local Kokoro/Piper), upload custom voice tracks (beat durations auto-sync), or drop in a custom music stem with automatic ducking.
5. **Monetization Audit & Export**: Open **Channel Growth -> YPP Shield** and click **1-Click Full YPP Auto-Shield** (checks Ad-Safety, Transformative Commentary, Upload Diversity, and Cast Silhouette Uniqueness with 1-click **Diversify Cast**), then render via **Fast Render** (WebCodecs WebM + Broadcast H.264 MP4 @ -14 LUFS) or **Shorts & Thumbnails**.

### For LLMs (Zero-Friction 1-Shot Workflow)
- Output ONLY the **6-Field Lite Storyboard JSON** below. You do **not** need to compute coordinates, camera cuts, durations, eye-lines, or hex colors — Katha Studio's **Deterministic Auto-Director** compiles, heals malformed JSON, synthesizes unique **Entity DNA**, mutates lookalike silhouettes, and choreographs camera + FACS expressions automatically.

---

## 2. The 6-Field "Lite Storyboard" Format (Recommended for LLMs)

Katha Studio's **Deterministic Auto-Director** automatically computes:
- Eye-line blocking (left actor always faces right, right actor faces left, zero overlaps)
- Shot rhythm (`wide_stage`, `two_shot`, `closeup_left`, `closeup_right`, `split_faceoff`, `prop_spotlight`)
- Spoken duration from word/character count (Latin, Indic, Arabic/Urdu & CJK aware) + auto-splitting of bloated 25+ word monologue beats
- Dialogue sanitization (strips leaked `Speaker:` prefixes and `(parenthetical)` cues while promoting cues into real actor expressions & SFX)
- Bespoke **Entity DNA synthesis & Anti-Twin Silhouette Mutation** against fellow cast members AND recent Publish Ledger exports (while respecting locked Cast Bible heroes)
- Camera moves, transitions, SFX with cooldowns, and semantic fuzzy matching (e.g. `"monkey_king"` -> `"vanara_hero"`, `"olive grove"` -> `"olympus_acropolis"`)

### Copy-Paste Gold Example (Lite JSON with Modular DNA & Phrase-Aligned Acting)
```json
{
  "title": "The Fox and the Crow",
  "subtitle": "Flattery Always Has a Price",
  "series": "Aesop's Fables",
  "region": "western_fables_myth",
  "renderStyle": "greek_amphora",
  "defaultRaag": "greek_lyre",
  "moral": "Never trust a flatterer who praises what they want to steal.",
  "cast": [
    { "id": "fox", "name": "Clever Fox", "archetype": "fox" },
    { "id": "crow", "name": "Proud Crow", "archetype": "crow" }
  ],
  "beats": [
    {
      "title": "Cold Open Hook",
      "stage": "olympus_acropolis",
      "who": ["crow", "fox"],
      "speaker": "narrator",
      "emotion": "sly",
      "prop": "saffron_feast",
      "dialogue": "One single compliment was all it took to steal a feast from the treetops."
    },
    {
      "title": "The Sweet Trap",
      "stage": "olympus_acropolis",
      "who": ["fox", "crow"],
      "speaker": "fox",
      "emotion": "sly",
      "dialogue": "Surely a bird with feathers this radiant must have the sweetest singing voice in Greece!"
    },
    {
      "title": "The Fatal Song",
      "stage": "olympus_acropolis",
      "who": ["fox", "crow"],
      "speaker": "crow",
      "emotion": "joy",
      "prop": "saffron_feast",
      "dialogue": "CAW! Behold my glorious voice—wait, my prize! Stop, you thief!"
    },
    {
      "title": "The Moral",
      "frame": "moral_card",
      "stage": "olympus_acropolis",
      "who": ["fox"],
      "speaker": "narrator",
      "emotion": "calm",
      "dialogue": "Never trust a flatterer who praises what they secretly want to steal."
    }
  ]
}
```

*Optional enrichment fields any LLM can include per cast member or beat:*
- On `cast[]`: `"dna": { "chassis": "quadruped", "traits": "sleek golden fox with crescent scarf and amber eyes" }`
- On `beats[]`: `"actorExpressions": { "fox": "sly", "crow": "curious" }`, `"expressionCues": [{ "castId": "crow", "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "feast falls" }]`, `"propAnchor": "actor_0_hand"`

---

## 3. Sims-Style Entity DNA Studio (Humans, Animals, Mythic Creatures & Spirits)

To beat YouTube's anti-template demonetization checks, every cast member supports a modular `CharacterDNA` genome (`cast[].dna`) rendered across all 10 Art Engines with 2-bone IK arms, animated wings/tails, and full FACS lip-sync:

### 6 Anatomical Body Chassis
- `humanoid` — Bipedal humans, royalty, sages, knights, demons, 4-armed deities (`extraArms: 2`)
- `quadruped` — Four-legged mammals & beasts (lions, tigers, foxes, wolves, deer, elephants, bulls, mythological mounts)
- `avian` — Winged birds & mythic raptors (ravens, crows, cranes, owls, Garuda, phoenixes)
- `serpentine` — Coiled serpents, nagas, Asian dragons, hydras, river spirits
- `arachnid` — Eight-legged spiders & trickster weavers (Anansi, Jorogumo)
- `ethereal` — Floating ghosts, lantern wraiths, forest spirits, shadow djinn

### Compact LLM DNA Recipe (Easiest Way for Any AI to Build Custom Entities)
Instead of writing 40 nested properties, an LLM can pass a compact `dna` object on any `cast[]` entry — Katha Studio parses both plain-English `traits` AND exact enum tokens:
```json
{
  "id": "forest_warden",
  "name": "Banyan Warden",
  "archetype": "spirit",
  "dna": {
    "chassis": "ethereal",
    "traits": "tall floating moss spirit with deer antlers, third eye, tattered cloak, and bark grain robe",
    "wings": "butterfly_fey",
    "aura": "petal_orbit",
    "palette": { "primary": "#1f4d3a", "accent": "#f2c85b" }
  }
}
```

### Exact Modular Part Enum Reference
- **Head Shapes (15)**: `oval_classic`, `square_heroic`, `heart_graceful`, `round_youth`, `angular_sharp`, `long_elder`, `feline_muzzle`, `canine_snout`, `curved_beak`, `raptor_beak`, `serpent_fang`, `elephant_trunk`, `primate_brow`, `spider_mandible`, `spirit_skull`
- **Ears (9)**: `human_standard`, `pointed_elf`, `cat_triangular`, `fox_tall`, `round_bear`, `long_hare`, `elephant_fan`, `fin_frill`, `none`
- **Horns / Antlers (7)**: `none`, `curved_ram`, `deer_antlers`, `oni_twin`, `unicorn_spire`, `bull_horns`, `crown_spines`
- **Hair / Mane (11)**: `none`, `short_cropped`, `long_flowing`, `topknot_bun`, `braided_crown`, `wild_spiky`, `lion_mane`, `feather_crest`, `dreadlocks`, `hooded_cowl`, `twin_buns`
- **Facial Hair (7)**: `none`, `royal_mustache`, `sage_long_beard`, `short_trimmed`, `goatee`, `handlebar`, `cat_whiskers`
- **Face Marks (10)**: `none`, `vermilion_tilak`, `ash_tripundra`, `third_eye`, `gold_bindi`, `war_paint`, `cheek_scar`, `freckles`, `tribal_lines`, `royal_kohl`
- **Headwear (12)**: `none`, `golden_mukut`, `royal_turban`, `bandana`, `wizard_hat`, `battle_helm`, `straw_conical`, `floral_tiara`, `laurel_wreath`, `ten_crown`, `jester_cap`, `veil_drape`
- **Surface Patterns (10)**: `solid`, `tiger_stripes`, `leopard_spots`, `serpent_scales`, `feather_layers`, `royal_brocade`, `kente_weave`, `bark_grain`, `starfield_cosmic`, `stone_cracks`
- **Wings (7)**: `none`, `feathered_angel`, `bat_demon`, `butterfly_fey`, `raven_dark`, `celestial_flame`, `bone_wyvern`
- **Tails (8)**: `none`, `monkey_curl`, `fox_fluffy`, `lion_tuft`, `serpent_long`, `peacock_fan`, `dragon_spiked`, `deer_short`
- **Auras (6)**: `none`, `solar_halo`, `lunar_crescent`, `ember_sparks`, `shadow_wisps`, `petal_orbit`
- **Morph Sliders**: `height` (0.72–1.32), `shoulderWidth` (0.72–1.38), `torsoBulk` (0.72–1.38), `headRatio` (0.80–1.28), `limbLength` (0.78–1.28), `posture` (-0.25..+0.25), `extraArms` (`0` or `2`)

---

## 4. The 9 Regional World Playbooks & 10 Art Engines

Each of the **10 Art Engines** applies its own authentic animation grammar (stepped 12fps/24fps cadence, Tholu Bommalata / Wayang Kulit bamboo control rods, Sumi-e ink brush trails, Kente weave highlights, woodblock gouge grain, stained glass leadwork, and atmospheric particles):
- `chiaroscuro`, `shadow_puppetry`, `woodblock_print`, `lineless_vector`, `stained_glass`, `papercraft_diorama`, `sumi_e_wash`, `kente_tapestry`, `greek_amphora`, `illuminated_codex`

### 1. Indian Supernatural & Royal Legends (Vikram & Betaal, Singhasan Battisi)
- **Region ID**: `indian_supernatural` | **Shelf**: `Supernatural & Royal Legends`
- **Recommended Art Engine**: `chiaroscuro` *(alternatives: `shadow_puppetry`, `woodblock_print`)*
- **Music Engine**: `bhairavi` | **Default Mood**: `midnight_banyan` | **Weather**: `fireflies`
- **Best Stages**: `banyan_clearing`, `cremation_ground`, `kali_temple`, `throne_mound`, `moonlit_terrace`, `royal_bedchamber`, `royal_durbar`, `river_ghat`
- **Best Cast Archetypes**: `king`, `spirit`, `ascetic`, `queen`, `statue_apsara`, `sage`, `merchant`, `guard`
- **Best Props**: `khanda_sword`, `banyan_bough`, `kali_idol`, `golden_statue`, `seven_mattresses`, `lotus_petal`, `diya_lamp`, `royal_palanquin`, `royal_scroll`
- **Directing Tip**: Use moonlit chiaroscuro framing, Betaal perched overhead or hanging upside down, and finish with a sharp moral riddle.

### 2. Indian Animal Fables (Panchatantra, Hitopadesha, Jataka Tales)
- **Region ID**: `indian_fables` | **Shelf**: `Animal Fables & Strategy`
- **Recommended Art Engine**: `lineless_vector` *(alternatives: `papercraft_diorama`, `chiaroscuro`)*
- **Music Engine**: `bhoopali` | **Default Mood**: `emerald_jungle` | **Weather**: `fireflies`
- **Best Stages**: `bamboo_forest`, `banyan_clearing`, `enchanted_lake`, `river_ghat`, `cave_den`, `courtyard_well`, `village_chowk`
- **Best Cast Archetypes**: `monkey`, `lion`, `tiger`, `jackal`, `hare`, `tortoise`, `crocodile`, `crow`, `crane`, `owl`, `mouse`, `deer`, `elephant`, `bull`, `serpent`, `sage`
- **Best Props**: `stone_well`, `wooden_cage`, `flying_stick`, `gold_bangle`, `lotus_pond`, `earthen_pot`, `treasure_chest`, `banyan_bough`, `royal_scroll`
- **Directing Tip**: Use lively woodland pacing, clear left-vs-right trickster exchanges, and a crisp practical wisdom moral card.

### 3. Indian Royal Court Wit (Tenali Rama, Akbar & Birbal, Gopal Bhar)
- **Region ID**: `indian_court_wit` | **Shelf**: `Royal Court Wit & Satire`
- **Recommended Art Engine**: `papercraft_diorama` *(alternatives: `lineless_vector`, `chiaroscuro`)*
- **Music Engine**: `desh` | **Default Mood**: `golden_durbar` | **Weather**: `none`
- **Best Stages**: `royal_durbar`, `mughal_courtyard`, `palace_garden`, `bazaar_lane`, `village_chowk`, `royal_dungeon`, `courtyard_well`
- **Best Cast Archetypes**: `emperor`, `king`, `courtier`, `merchant`, `guard`, `queen`, `elder_woman`, `child`, `crow`
- **Best Props**: `peacock_throne`, `hanging_khichdi_pot`, `royal_scales`, `measuring_stake`, `earthen_pot`, `treasure_chest`, `royal_scroll`, `diya_lamp`, `hand_mirror`, `saffron_feast`
- **Directing Tip**: Use royal durbar crowds on wide shots, snappy closeup reactions for punchlines, and court_gasp or wooden_gavel on the reveal.

### 4. Indian Sacred Epics & Puranas (Ramayana, Mahabharata, Puranas)
- **Region ID**: `indian_epics` | **Shelf**: `Sacred Epics & Puranas`
- **Recommended Art Engine**: `stained_glass` *(alternatives: `chiaroscuro`, `shadow_puppetry`)*
- **Music Engine**: `darbari` | **Default Mood**: `twilight_temple` | **Weather**: `embers`
- **Best Stages**: `ashoka_vatika`, `golden_lanka`, `kurukshetra_field`, `himalayan_hermitage`, `enchanted_lake`, `ocean_ship`, `cloud_skies`, `royal_durbar`, `kali_temple`
- **Best Cast Archetypes**: `deva`, `goddess`, `warrior`, `vanara_hero`, `demon_king`, `sage`, `yaksha`, `queen`, `king`, `child`, `elder_woman`, `deer`, `dog`
- **Best Props**: `bow_arrow`, `gada_mace`, `sudarshana_chakra`, `trishul`, `sanjevani_mountain`, `signet_ring`, `magic_chariot`, `conch_shell`, `sacred_fire`, `lotus_pond`
- **Directing Tip**: Use grand mythic composition, divine_aura on avatars, army or monks crowds for epic scale, and shankha_conch or temple_bell stings.

### 5. Western Folklore, Aesop's Fables, Grimm & Greek/Norse Myths
- **Region ID**: `western_fables_myth` | **Shelf**: `Western Folklore & Fables`
- **Recommended Art Engine**: `greek_amphora` *(alternatives: `illuminated_codex`, `woodblock_print`, `stained_glass`)*
- **Music Engine**: `greek_lyre` | **Default Mood**: `sandstone_dusk` | **Weather**: `petals`
- **Best Stages**: `olympus_acropolis`, `enchanted_cottage`, `ocean_ship`, `cave_den`, `cloud_skies`, `kurukshetra_field`, `village_chowk`, `royal_dungeon`
- **Best Cast Archetypes**: `fox`, `wolf`, `crow`, `hare`, `tortoise`, `lion`, `mouse`, `dog`, `knight`, `queen`, `king`, `elder_woman`, `child`, `merchant`, `deva`
- **Best Props**: `golden_fleece`, `golden_egg`, `hand_mirror`, `wooden_cage`, `magic_chariot`, `bow_arrow`, `trishul`, `diya_lamp`, `treasure_chest`, `royal_scales`, `royal_scroll`
- **Directing Tip**: Pair Aesop/Greek tales with greek_amphora + greek_lyre + olympus_acropolis; pair Grimm/Arthurian tales with illuminated_codex + medieval_lute + enchanted_cottage.

### 6. East Asian Tales & Epics (Journey to the West, Japanese Folktales)
- **Region ID**: `east_asian_tales` | **Shelf**: `East Asian Tales & Epics`
- **Recommended Art Engine**: `sumi_e_wash` *(alternatives: `woodblock_print`, `chiaroscuro`)*
- **Music Engine**: `guqin_bamboo` | **Default Mood**: `moonlit_marble` | **Weather**: `petals`
- **Best Stages**: `bamboo_pagoda`, `bamboo_forest`, `cloud_skies`, `himalayan_hermitage`, `enchanted_lake`, `ocean_ship`, `cave_den`, `village_chowk`
- **Best Cast Archetypes**: `samurai`, `vanara_hero`, `monkey`, `fox`, `crane`, `tortoise`, `serpent`, `sage`, `queen`, `elder_woman`, `child`, `demon_king`, `spirit`
- **Best Props**: `magic_staff`, `magic_peach`, `khanda_sword`, `hand_mirror`, `diya_lamp`, `royal_scroll`, `lotus_petal`, `treasure_chest`, `sacred_fire`
- **Directing Tip**: Use sumi_e_wash or woodblock_print with guqin_bamboo music, bamboo_pagoda or cloud_skies stages, and petals/mist atmosphere.

### 7. Southeast Asian Folklore (Sang Kancil, Wayang Kulit, Archipelago Tales)
- **Region ID**: `southeast_asian_folklore` | **Shelf**: `Southeast Asian Folklore`
- **Recommended Art Engine**: `shadow_puppetry` *(alternatives: `woodblock_print`, `papercraft_diorama`)*
- **Music Engine**: `gamelan_wayang` | **Default Mood**: `emerald_jungle` | **Weather**: `fireflies`
- **Best Stages**: `tropical_archipelago`, `river_ghat`, `bamboo_forest`, `ocean_ship`, `enchanted_lake`, `village_chowk`
- **Best Cast Archetypes**: `deer`, `crocodile`, `tiger`, `monkey`, `tortoise`, `king`, `queen`, `warrior`, `merchant`, `elder_woman`
- **Best Props**: `kris_dagger`, `diya_lamp`, `earthen_pot`, `wooden_cage`, `sacred_fire`, `treasure_chest`, `royal_scroll`
- **Directing Tip**: Use shadow_puppetry (Wayang Kulit) with gamelan_wayang music and tropical_archipelago or river_ghat backdrops.

### 8. Americas & Indigenous Legends (Raven, Coyote, Mesoamerican & Folk Tales)
- **Region ID**: `americas_indigenous` | **Shelf**: `Americas & Indigenous Legends`
- **Recommended Art Engine**: `woodblock_print` *(alternatives: `lineless_vector`, `chiaroscuro`)*
- **Music Engine**: `cedar_flute` | **Default Mood**: `sandstone_dusk` | **Weather**: `embers`
- **Best Stages**: `red_canyon_mesa`, `cloud_skies`, `enchanted_cottage`, `river_ghat`, `cave_den`, `enchanted_lake`, `himalayan_hermitage`
- **Best Cast Archetypes**: `raven`, `wolf`, `deer`, `tortoise`, `owl`, `serpent`, `elder_woman`, `child`, `warrior`, `sage`, `fox`
- **Best Props**: `sun_orb`, `sacred_fire`, `bow_arrow`, `story_box`, `earthen_pot`, `magic_staff`, `diya_lamp`
- **Directing Tip**: Use woodblock_print or lineless_vector with cedar_flute music, red_canyon_mesa or cloud_skies, and sun_orb / sacred_fire props.

### 9. African Griot & Trickster Tales (Anansi the Spider, Yoruba & Savanna Fables)
- **Region ID**: `african_griot` | **Shelf**: `African Griot & Trickster Tales`
- **Recommended Art Engine**: `kente_tapestry` *(alternatives: `papercraft_diorama`, `lineless_vector`)*
- **Music Engine**: `kora_griot` | **Default Mood**: `golden_durbar` | **Weather**: `fireflies`
- **Best Stages**: `savanna_baobab`, `village_chowk`, `river_ghat`, `banyan_clearing`, `cave_den`, `cloud_skies`
- **Best Cast Archetypes**: `spider`, `lion`, `elephant`, `hare`, `tortoise`, `serpent`, `monkey`, `king`, `elder_woman`, `child`, `merchant`, `sage`
- **Best Props**: `story_box`, `earthen_pot`, `sacred_fire`, `golden_egg`, `treasure_chest`, `diya_lamp`, `royal_scales`
- **Directing Tip**: Use kente_tapestry with kora_griot music, savanna_baobab backdrop, spider archetype for Anansi, and story_box / earthen_pot props.

---

## 5. Character, Prop, Hand-Anchor & Custom Asset Cheat Sheet

| Story Concept | Recommended Archetype / DNA | Staging Tip |
|---|---|---|
| Odysseus / King Arthur / Viking / Spartan | `knight` or `warrior` + custom `dna` | Pair with `headwear: "battle_helm"` & `ocean_ship` / `kurukshetra_field` |
| Zeus / Odin / Nyame / Sky God | `deva` + `aura: "solar_halo"` | Add `extraArms: 2` for multi-armed deities & `fx: "divine_aura"` |
| Athena / Fairy Godmother / Devi | `goddess` + `wings: "feathered_angel"` | Add `headwear: "golden_mukut"` or `"floral_tiara"` |
| Sun Wukong / Hanuman | `vanara_hero` + `tail: "monkey_curl"` | Set `prop: "magic_staff"` with `propAnchor: "actor_0_hand"` |
| Anansi the Spider | `spider` (`chassis: "arachnid"`) | Pair with `stage: "savanna_baobab"`, `surfacePattern: "kente_weave"` & `prop: "story_box"` |
| Sang Kancil (Mouse Deer) | `deer` (`chassis: "quadruped"`) | Pair with `renderStyle: "shadow_puppetry"` & `stage: "tropical_archipelago"` |
| Dragon / Hydra / Quetzalcoatl | `serpent` (`chassis: "serpentine"`) | Add `horns: "oni_twin"`, `wings: "bat_demon"` or `"feathered_angel"` & `weather: "embers"` |
| Forest Ghost / Lantern Wraith / Djinn | `spirit` (`chassis: "ethereal"`) | Add `aura: "shadow_wisps"` or `"ember_sparks"` & `headShape: "spirit_skull"` |
| Held Weapon, Lamp or Relic | `propAnchor` on beat | Use `"actor_0_hand"` or `"actor_1_hand"` so the prop tracks the actor's moving wrist! |
| Any Unique Custom Prop or Painted Stage | `customPropDataUrl` / `customBackdropDataUrl` | Upload PNG/JPG/WebP directly in **Assets -> Props** or **Assets -> Stages** |

---

## 6. Two-Step Workflow for Bare-Minimum / Local 7B–9B Models
1. **Step 1 (Blueprint · temp 0.12)**: Ask the LLM for only `title`, `region`, 2–4 `cast` entries (with compact `dna` traits), and 1–3 `stages`.
2. **Step 2 (Beats · temp 0.35 + Story Arc Skeleton)**: Pass ONLY those locked IDs back and fill the beat-by-beat Story Arc Skeleton with 10–18 word lines.
3. **Step 3 (Optional 1-Click Script Doctor)**: Run **Polish Dialogue (Lock Visuals)** to sharpen the Cold Open hook and character wit without altering a single cast member, stage, or camera angle.

---

## 7. Facial Expressions (10 FACS States), Subtext & Phrase-Aligned Per-Frame Acting (60fps)
All 40 archetypes AND all 6 Entity DNA chassis render through a unified FACS Facial Expression Engine that keeps resting faces approachable and non-angry by default:
- **10 Supported Expressions**: `calm`, `warm`, `joy`, `curious`, `awe`, `sly`, `shocked`, `grief`, `stern`, and `angry` (reserve `angry` strictly for genuine fury).
- **System-Wide Toggle**: The toolbar **Expressions / Neutral** button (and `visualStyle.expressionsEnabled`) toggles facial expressions globally across playback, WebM capture, and Fast Offline rendering while keeping natural blinking and lip-sync.
- **Phrase-Aligned Sets of Frames (Never Drifts After TTS Retiming!)**: Anchor mid-beat shifts to spoken words via `triggerPhrase` + `reason`:
  - `actorExpressions: { "fox": "sly", "crow": "curious" }`
  - `expressionCues: [{ "castId": "crow", "frame": 0, "expression": "joy", "reason": "boasting proudly" }, { "castId": "crow", "triggerPhrase": "wait, my prize", "expression": "shocked", "reason": "prize drops from beak" }]`
- **Dedicated Pass-2 "AI Direct Emotions" & Zero-Key Auto-Choreographer**: Click **AI Direct Emotions** in the AI Director panel for a whole-script subtext pass (directing BOTH speakers and silent listeners while locking visuals & dialogue), or click **Auto-Direct Faces** for instant offline choreography with 36-frame anti-flicker protection.

---

## 8. YouTube Monetization, YPP Policy Shield & Anti-Template Guardrails
Katha Studio's **YPP Policy Shield** (**Channel Growth -> YPP Shield** + **Fast Render Pre-Flight Gate**) enforces 6 monetization safeguards:
1. **Beat Template / Twin-Character Crackdowns**: Tracks every exported episode's Art Engine, primary stage, opening hook, AND **cast silhouette DNA fingerprints** in the **Channel Upload Diversity Ledger**. Flags twin characters (distance < 34%) both inside an episode and across recent uploads, with a 1-click **Diversify Cast** fix (while protecting locked Cast Bible heroes).
2. **Add Original Transformative Value**: Public-domain tales stay YPP-safe with original dramatization, expressive multi-character acting (45%+ character dialogue), and brief cultural/historical reflection before the Moral Card.
3. **Keep Titles & First 30 Seconds Ad-Safe**: Automatically softens folklore yellow-icon triggers (`corpse`, `cremation ground`, `blood`, `behead`, `kill`, `poison`, `suicide`, `torture`) into mythic equivalents.
4. **Avoid the Accidental "Made for Kids" RPM Cliff**: Warns against `"for kids"` / `"kids cartoon"` wording unless intentionally targeting COPPA.
5. **Honest Studio Disclosures**: Includes an auto-generated **Public-Domain Transformative Attribution** & Studio Disclosure checklist.
6. **Channel Identity & Portability**: Save custom brand watermark logos in **Look -> Channel Brand Kit**, lock recurring characters in the **Cast Bible**, and export full self-contained projects as portable `.katha` archives.

---

## 9. Multi-Language Production (19 Global & Indian Languages · CJK & RTL · YouTube MLA)
Katha Studio builds, voices, renders, and packages episodes natively in **19 languages**: English (`en`), Hindi (`hi`), Tamil (`ta`), Telugu (`te`), Bengali (`bn`), Marathi (`mr`), Gujarati (`gu`), Kannada (`kn`), Malayalam (`ml`), Urdu (`ur` · RTL), Spanish (`es`), Portuguese (`pt`), French (`fr`), German (`de`), Indonesian (`id`), Japanese (`ja`), Korean (`ko`), Chinese (`zh`), and Arabic (`ar` · RTL).
- **Schema Lock**: Set root `"language": "hi"` (or any of the 19 ISO codes). Write all human-readable story text in the target language while keeping **all JSON keys and engine enum IDs** in exact lowercase ASCII English tokens.
- **Kinetic Karaoke Captions & Script Typography**: Automatically loads script-appropriate Noto fonts, switches `ctx.direction = 'rtl'` for Arabic/Urdu, highlights spoken words in sync, and handles space-free CJK timing.
- **YouTube Multi-Language Audio (MLA) Packager**: In **Channel Growth -> Dub & MLA**, batch-translate an episode into multiple languages and export a single CRC-32 `.zip` with per-language offline WAV tracks, localized `.srt` captions, and localized YouTube launch packs.

---

## 10. Short-Form (<60s) vs. Long-Form (8–20+ Minute) Production Playbook

### YouTube Shorts (30–55 seconds · 9:16 Vertical)
- Set **Beat Target = 6–10 beats**, aspect **9:16**, and use **Shorts & Thumbnails** or **Fast Render** directly. Fits comfortably inside a single LLM prompt, browser RAM, and the 150 MB direct MP4 converter.

### Standard Episodes (1.5–4 minutes · 16:9 Landscape)
- Set **Beat Target = 12–20 beats** (or stitch 2–3 short acts). Renders in one pass via **Fast Render** (WebCodecs 1080p60/30).

### Long-Form Videos (8–25+ minutes · Mid-Roll Monetization Tier)
Katha Studio includes a **Native Long-Form Production Engine** engineered end-to-end for 8–25+ minute videos:
1. **Multi-Act Long-Form AI Director + Act Sculptor**: In **AI / Script**, choose **Long 8m (5 Acts · ~100 scenes)**, **Long 12m (7 Acts · ~147 scenes)**, or **Long 20m (10 Acts · ~220 scenes)**. The Director runs **Pass 1 (Master Story Outline + Locked Cast DNA)** followed by **Pass 2..N (Act-by-Act Lite Storyboard generation with rolling continuity)**. Afterward, use the **Act Sculptor** to **Regenerate Act N** (rewriting a single chapter with neighboring-act continuity & locked cast) or **+ Append Next Act** to extend any episode by +2–3 minutes.
2. **Auto-Chunked Long-Form Polish, Emotion Directing & Multi-Language Dubbing**: When an episode exceeds 26 scenes, **Polish Dialogue**, **AI Direct Emotions**, **Translate Episode Now**, and **Batch YouTube MLA** automatically chunk by chapter (~140s / <=24 beats per LLM call) so 100–250 beat scripts never hit the 48 KB prompt limit or suffer output truncation.
3. **Act-Grouped Timeline Navigation & Lazy LRU Voice RAM Cap**: Episodes with 2+ chapters or >24 scenes display an **Act/Chapter Jump Bar** above the storyboard strip with an `MM:SS` runtime clock. The audio engine maintains a **36-clip LRU decoded PCM cache** with automatic 4-beat prefetch and chapter-scoped offline decoding so 200+ voiced scenes stay smooth without exhausting browser RAM.
4. **Resumable, Rate-Limit-Safe Voiceover + Anthology Voice Carry-Over**: In **Voice Studio**, **Skip already-voiced scenes** is ON by default with HTTP 429 `Retry-After` backoff and **Voice Chapter N Only**. In **Channel Growth -> Anthology**, chaining your **Saved Vault Projects** or the **Current Stage** automatically remaps and carries over all saved voiceover audio clips onto the stitched anthology's new beat IDs!
5. **Long-Form Retention & YouTube Mid-Roll Ad-Break Planner**: In **Channel Growth -> Retention** and **Launch & MP4**, episodes ≥ 7.5–8 minutes automatically run stage/mood monotony checks and compute exact **Cliffhanger-Safe Mid-Roll Ad-Break Timestamps** placed cleanly at Act boundaries and dramatic pauses (included in the downloadable Launch Pack `.txt`).
6. **1-Click Server-Side Chapter Auto-Stitch (`-14 LUFS` Unified `.MP4`)**: In **Fast Render**, long-form episodes (>3.5 min) automatically enable **30 fps · Long-Form Cinema (5 Mbps)** and **Chaptered Long-Form Mode**. When server FFmpeg is ready, leave **1-Click Auto-Stitch into 1 Unified YouTube .MP4** checked to upload each finished chapter via `/api/render-session/*` and download one seamless 8–25 minute H.264/AAC `-14 LUFS` master directly from the browser (or use the downloadable FFmpeg stitch script / CLI `node scripts/render-batch.mjs ch01.mp4 ch02.mp4 --concat full.mp4`).

---

## 11. Headless Compiler CLI & API (For External LLM Agents & Batch Automation)
External AI agents, CI jobs, and power users can compile, heal, YPP-audit, retention-optimize, and generate `.SRT` captions from Lite or Full episode JSON programmatically without opening the browser UI:
- **CLI (File Mode)**:
  ```bash
  npm run compile-episode -- story.json --out compiled.json --srt story.srt --audit --fix-ypp --fix-retention
  ```
- **CLI (Stdin JSON Mode)**:
  ```bash
  cat story.json | npx tsx scripts/compile-episode.ts --stdin --fix-ypp --fix-retention
  ```
- **HTTP API (Dev / Full-Stack Server)**:
  `POST /api/episodes/compile` with JSON body `{ "input": <liteOrFullEpisodeOrRawLlmText>, "fixYpp": true, "fixRetention": true }` returns `{ ok, episode, summary, yppAudit, retentionAudit, chapters, youtubeChaptersText, midRollTimestampsText, srt }`.

---

## 11. Supported LLM Tiers, Minimum Requirements & Output Variance

### Determinism Breakdown
- **Rendering a finalized script + voice file**: **0% variance (100% deterministic)**. No LLM runs during canvas rendering, physics, music synthesis, or export.
- **Generating a new script from a story prompt**: Visual/technical variance is compressed to **~10–20%** by Katha Studio's Regional Playbooks, Lite Auto-Director, Cast Bible, and Story Arc Skeletons. Remaining variance lives primarily in **hook sharpness, dialogue wit, and plot twist subtlety**.

### LLM Comparison Matrix (Bare Minimum → Medium → Higher/Frontier)

| Tier | Recommended Models | Visual Consistency | Writing & Hook Quality | Recommended Mode | Max Reliable Beats | Temperature (Blueprint / Scenes / Polish) |
|---|---|---|---|---|---|---|
| **Tier 0: Tiny Local (1B–3B)** *(Not Recommended)* | Llama-3.2-3B, Qwen-2.5-3B, Phi-3-mini | ~75% | Poor — drops plot twists & repeats lines | 2-Step (6 beats max) | 6 | 0.1 / 0.3 / 0.3 |
| **Tier 1: Bare Minimum Local (7B–9B)** *(Free / Offline)* | **Qwen 2.5 7B Instruct**, **Gemma 2 9B**, **Llama 3.1 8B**, Mistral 7B | ~90% | Decent — clean fables & bedtime tales | **2-Step Blueprint → Scenes** (`Lite`) | **6–12** | **0.12 / 0.35 / 0.30** |
| **Tier 2: Medium / Fast Cloud & Heavy Local (24B–70B)** *(Best ROI)* | **Gemini 2.5 Flash**, **GPT-4o-mini**, **Claude Haiku**, **DeepSeek-V3**, **Qwen 2.5 32B**, **Llama 3.3 70B** | ~96–97% | Very Good–Great — sharp cold opens, reliable twists, crisp banter | **Lite Auto-Direct** (1-Click) | **12–20** | **0.15 / 0.45 / 0.40** |
| **Tier 3: Higher / Frontier Cloud** *(Broadcast Flagship)* | **Gemini 2.5 Pro**, **Claude Sonnet / Opus**, **GPT-4.1 / GPT-5** | ~99% | Broadcast-Grade — subtle courtroom wit, nested flashbacks, clever prop callbacks | **Lite** or **Full Pro JSON** | **20+** | **0.20 / 0.55 / 0.45** |

### Bare Minimum Requirements for Publishable YouTube Output
1. **Minimum Local LLM ($0 via Ollama)**: **Qwen 2.5 7B Instruct** (best structured JSON) or **Gemma 2 9B Instruct** (best prose) using **2-Step Blueprint → Scenes** + **Story Arc Skeleton** + **Seed Lock**, followed by **1-Click Polish Dialogue**.
2. **Minimum Cloud LLM (Best Scale-to-Cost)**: **Gemini 2.5 Flash** or **GPT-4o-mini** with **Lite Auto-Direct**.
3. **Minimum Voice TTS**: **Kokoro-82M** (free local OpenAI-compatible TTS) or **Gemini TTS / OpenAI TTS** (cloud); add **ElevenLabs** for signature lead characters.

---

## 12. How Katha Studio Maximizes Script Determinism Without Losing Storytelling Quality

1. **6 Mandatory Story Arc Skeletons**: Instead of open-ended rambling, every prompt injects a beat-by-beat dramatic spine (`Trickster & Wit`, `Mystery & Riddle`, `Heroic Epic`, `Cautionary Greed`, `Cozy Bedtime`, or `6-Beat Viral Short`).
2. **Split-Temperature + Deterministic Seed Lock**: Structural steps (Blueprint, Repair, Translation) run at ultra-low temperature (`0.12–0.20`) with a story-hashed integer `seed`; dialogue generation runs at balanced temperature (`0.35–0.55`) so writing stays lively without drifting off-schema.
3. **Zero-Cost Dialogue Sanitizer & Long-Beat Auto-Splitter**: Automatically strips leaked `Speaker:` labels and `(parenthetical)` / `*asterisk*` cues (converting them into real actor `expression` and `sfx`), and splits any bloated 25+ word wall-of-text beat into two snappy alternating shots.
4. **Script Craft Auditor (0–100) + 1-Click Dialogue Script Doctor**: Audits opening hook strength, words-per-beat cadence, character banter vs. narrator ratio, prop payoff, and moral ending—then lets you punch up **only** the dialogue while keeping 100% of visual blocking, cast, and camera shots locked.

---

## 13. Multi-Genre World Catalogs & Wave 4 Visual Craft Features

Stagecraft Studio expands beyond folklore into **any genre** (Sci-Fi, Noir, Fantasy RPG, Modern Explainer, Historical Drama & Creatures) through one unified 2D Canvas pipeline across **all 20 Art Engines**:

- **Live Catalog Totals**: **60 Cast Archetypes**, **50 Stage Backdrops**, **64 Story Props (+ `none`)**, **16 Lighting Moods**, **12 Weather Systems**, **12 Living Crowds**, **14 Kinetic FX**, **20 Art Engines**, **24 Procedural Backdrop Themes**, **24 Procedural Prop Cutouts**, **9 Act Visual Arcs**, **12 Acting Macros**, and **32 Curated CharacterDNA Sprite Presets**.
- **Deterministic Hit Stop & Attack-Hold-Decay VFX (`visualStyle.hitstopEnabled`)**: Automatically inserts a crisp 2–4 frame impact freeze with micro-shake, shockwave ring, and chromatic edge kick on peak strikes (`pose: "attack"`, `cameraPunch >= 0.5`, `sword_clash` / `thunder_crack`, or `crimson_impact` / `shock_burst` / `shatter_glass` / `comic_pow`).
- **In-Browser Sprite Prep Studio & Frame-Locked Sprite Sheet Slicer (`beat.customPropSheet`)**: Strip flat solid backgrounds via corner flood-fill, add pixel-snapped or ink silhouettes, quantize sprites to the active Mood Palette, or slice multi-frame PNG/WebP sprite sheets (`{ cols, rows, frameCount, fps, loop }`) locked to `STUDIO_FPS` and active `motionCadence`.
- **Directional Ground Shadows & Surface Reflections**: Automatically renders directional light-aligned ground shadows plus animated water/wet-street/polished-marble reflections across all 50 stages (with outdoor rain/storm wet-street reflection upgrades).
- **Foreground Framing Parallax Silhouettes (`visualStyle.foregroundFraming`)**: Adds soft near-camera framing silhouettes (`banyan_foliage`, `temple_pillars`, `bamboo_stalks`, `cyber_cables`, `noir_blinds`, `gothic_arch`, `ship_rigging`, `alpine_pines`, `sakura_branch`, `starship_struts`) moving at `1.28×` camera parallax without obstructing faces or captions.
- **Calibrated 0–3 Visual Craft Scorecard & Manifest Audit CLI**: Evaluates 6 visual-craft dimensions (`0 = Placeholder` .. `3 = Showcase`) in **Storyboard QA** and in `scripts/determinism-audit.mjs` (`--manifest <file.json>`, `--max-frame-ms <ms>`, console/`pageerror` capture).
- **Live Exportable Director `SKILL.md`**: Click **Copy Director SKILL.md** or **Download SKILL.md** in the **AI / Script** tab to export a live, always-current coding-agent skill file reflecting every catalog ID and JSON schema contract.

---

<!-- STAGECRAFT_AUTO_SYNC_START -->
## 14. Live Studio Catalog Sync Snapshot (Auto-Generated)

> **Catalog Fingerprint**: `eec2ee463dfa4c76` — Generated deterministically by `npm run sync-docs` from live runtime catalogs. Do not hand-edit this block.

- **Core World Catalogs**: **20** Art Engines · **160** Cast Archetypes · **150** Stage Backdrops · **185** Props · **40** Moods · **30** Weathers · **30** Crowds · **36** Beat FX · **6** Transitions · **10** SFX · **13** Music Engines · **9** Shots · **12** Acting Macros
- **Procedural Generators & Presets**: **192** Curated CharacterDNA Sprite Presets (12 genres) · **84** Backdrop Themes · **84** Custom Prop Presets · **25** 4-Act Visual Arcs
- **Wave 7 Sims-Grade CharacterDNA Parts**: **10** Eyebrows · **8** Pupils · **5** Eyelashes · **8** Mouths · **21** Hair/Manes · **13** Beards/Mustaches · **22** Face Marks (primary + secondary + blush) · **16** Body Marks (up to 3 combinable) · **14** Outerwear · **7** Sleeves · **10** Waist/Belts · **9** Gloves · **12** Footwear · **12** Eyewear · **9** Ear/Face Jewelry · **10** Neckwear · **7** Wristwear · **12** Back Gear · **12** Face Sculpt Morphs · **10-Channel** Color Palette
- **Full Master Reference**: See `STAGECRAFT_LLM_INSTRUCTIONS.md` (Section 5.7 for Sims-Grade CharacterDNA JSON authoring).
<!-- STAGECRAFT_AUTO_SYNC_END -->
