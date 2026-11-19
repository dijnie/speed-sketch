import { Buffer } from 'node:buffer';

export const DECISIONS_UPSTREAM_URL =
  'https://generativelanguage.googleapis.com/v1beta/decisions';
export const DECISIONS_MODEL = 'gemini-decision-1';
export const MAX_BODY_BYTES = 512 * 1024;
export const MAX_PNG_BASE64_CHARS = 350_000;
export const CHOICE_OPTION_LIMIT = 255;

export const UNFINISHED_LINES_KEY = 'unfinished_lines';
export const RANDOM_SCRIBBLE_KEY = 'random_scribble';

const BLIND_SNAPSHOT_TEXT = 'Live quick-draw sketchpad snapshot:';
const BLIND_CHOICE_INSTRUCTIONS =
  'Look closely at this black-ink line drawing on a white sketchpad. Which exact item from the 255 options is drawn? Choose unfinished_lines if only one or two unformed starting strokes exist, or random_scribble if it is chaotic scribbling.';
const UNFINISHED_DESCRIPTION =
  'Just one or two starting strokes, bare shapes, or incomplete sketch';
const SCRIBBLE_DESCRIPTION = 'Messy scribble or unrecognizable blob';
const WRITTEN_WORDS_CHEAT_INSTRUCTIONS =
  'Did the player write readable alphabet letters or words spelling out an item instead of drawing a picture?';
const WRITTEN_WORDS_TRUE_DESCRIPTION =
  'Contains readable written alphabet letters or a spelled-out word naming an item';
const WRITTEN_WORDS_FALSE_DESCRIPTION =
  'Pure line drawing with no spelled-out words';

export const MISSING_KEY_MESSAGE =
  'Attach a GEMINI_API_KEY in AI Studio Settings > Secrets to read live sketches.';

const ALLOWED_NOUN_IDS = [
  "abacus",
  "accordion",
  "acorn",
  "aircraft_carrier",
  "airplane",
  "alarm_clock",
  "albatross",
  "aloe_plant",
  "ambulance",
  "anchor",
  "angel",
  "anglerfish",
  "ankylosaurus",
  "ant",
  "anteater",
  "anvil",
  "apple",
  "aquarium",
  "arcade_cabinet",
  "armadillo",
  "artichoke",
  "astronaut",
  "atm_machine",
  "atv_quad",
  "avocado",
  "baby_bottle",
  "baby_stroller",
  "backpack",
  "bagpipes",
  "baguette",
  "balance_scale",
  "bald_eagle",
  "banana",
  "banjo",
  "barbell",
  "baseball_bat",
  "baseball_glove",
  "bat",
  "battle_axe",
  "bear",
  "bear_trap",
  "beaver",
  "bee",
  "beer_stein",
  "belgian_waffle",
  "bento_box",
  "bicycle",
  "bighorn_sheep",
  "binoculars",
  "biplane",
  "bird_nest",
  "birdcage",
  "birdhouse",
  "birthday_cake",
  "bison",
  "blender",
  "blimp",
  "bonsai_tree",
  "boombox",
  "boomerang",
  "bow_and_arrow",
  "bowtie",
  "bread_loaf",
  "briefcase",
  "broad_sword",
  "broccoli",
  "brontosaurus",
  "broom",
  "bulldozer",
  "burrito",
  "butterfly",
  "butterfly_net",
  "c_clamp",
  "cable_car",
  "cactus",
  "calculator",
  "calipers",
  "camel",
  "camera",
  "campfire",
  "camping_tent",
  "candelabra",
  "candlestick",
  "candy_cane",
  "cannon",
  "canoe",
  "canoe_paddle",
  "carousel",
  "carrot",
  "cash_register",
  "cassette_tape",
  "cassowary",
  "cast_iron_radiator",
  "castle",
  "catapult",
  "caterpillar",
  "ceiling_fan",
  "cement_mixer",
  "centaur",
  "centipede",
  "chain_links",
  "chainsaw",
  "chameleon",
  "chandelier",
  "charging_bull",
  "chariot",
  "cheese_wedge",
  "chef_hat",
  "cherries",
  "chili_pepper",
  "chinook_chopper",
  "chocolate_bar",
  "church_steeple",
  "cinnamon_roll",
  "circular_saw",
  "circus_tent",
  "clam_pearl",
  "clarinet",
  "clawfoot_tub",
  "clothespin",
  "clownfish",
  "club_sandwich",
  "coat_hanger",
  "coat_rack",
  "cobra",
  "coconut_drink",
  "coffee_grinder",
  "coffee_mug",
  "coil_spring",
  "compass",
  "computer_keyboard",
  "conch_shell",
  "corkscrew",
  "corn_cob",
  "cowboy_boot",
  "cowboy_hat",
  "crab",
  "cracked_egg",
  "crescent_moon",
  "cricket_bat",
  "crocodile",
  "croissant",
  "crossbow",
  "crowbar",
  "crown",
  "cruise_ship",
  "cuckoo_clock",
  "cupcake",
  "cuttlefish",
  "dachshund",
  "dairy_cow",
  "daisy_flower",
  "dandelion",
  "desk_fan",
  "desk_globe",
  "desktop_monitor",
  "diamond_kite",
  "diving_board",
  "diving_helmet",
  "dna_helix",
  "dodo_bird",
  "dolphin",
  "donkey",
  "donut",
  "door_hinge",
  "dragon",
  "dragonfly",
  "dreamcatcher",
  "drone",
  "drum_kit",
  "drumstick",
  "dumbbell",
  "dumpling",
  "earbuds",
  "earthworm",
  "earwig",
  "egg_whisk",
  "eiffel_tower",
  "elephant",
  "espresso_machine",
  "excavator",
  "exercise_bike",
  "extension_cord",
  "eyeglasses",
  "feather_quill",
  "fencing_foil",
  "ferris_wheel",
  "field_mouse",
  "film_camcorder",
  "film_projector",
  "film_reel",
  "fire_extinguisher",
  "fire_hydrant",
  "firetruck",
  "fireworks",
  "fish_skeleton",
  "fishing_hook",
  "fishing_rod",
  "flamingo",
  "flip_flops",
  "flip_lighter",
  "flute",
  "flying_carpet",
  "flying_fish",
  "flying_saucer",
  "forklift",
  "fortune_cookie",
  "fountain",
  "fox",
  "french_fries",
  "french_horn",
  "fried_egg",
  "frog",
  "frying_pan",
  "garden_hose",
  "garden_shears",
  "garlic_bulb",
  "gas_mask",
  "gas_pump",
  "gazebo",
  "gear_cog",
  "gingerbread_house",
  "gingerbread_man",
  "giraffe",
  "go_kart",
  "goldfish_bowl",
  "golf_cart",
  "golf_club",
  "gondola_boat",
  "gorilla",
  "gramophone",
  "grand_piano",
  "grandfather_clock",
  "grape_bunch",
  "grasshopper",
  "griffin",
  "guillotine",
  "guitar",
  "gumball_machine",
  "hamburger",
  "hammer",
  "hammerhead_shark",
  "hammock",
  "hand_saw",
  "hand_truck",
  "handheld_console",
  "hang_glider",
  "harp",
  "headphones",
  "hedgehog",
  "helicopter",
  "hermit_crab",
  "high_heel",
  "hippopotamus",
  "hockey_stick",
  "honey_jar",
  "horse",
  "horseshoe",
  "horseshoe_crab",
  "horseshoe_magnet",
  "hot_air_balloon",
  "hot_dog",
  "hot_dog_cart",
  "hourglass",
  "house_cat",
  "housefly",
  "howling_wolf",
  "hummingbird",
  "ice_cream_cone",
  "igloo",
  "iguana",
  "jack_o_lantern",
  "jackhammer",
  "jellyfish",
  "jet_fighter",
  "jet_ski",
  "juice_box",
  "jukebox",
  "kangaroo",
  "ketchup_bottle",
  "keytar",
  "kick_scooter",
  "kitchen_stove",
  "kiwi_bird",
  "knight_helmet",
  "koala",
  "koi_fish",
  "lacrosse_stick",
  "ladder",
  "ladybug",
  "lantern",
  "laptop",
  "lasso_rope",
  "lava_lamp",
  "lawnmower",
  "leaf_rake",
  "leafy_seadragon",
  "lemon_half",
  "liberty_bell",
  "lifebuoy",
  "lightbulb",
  "lighthouse",
  "lion",
  "llama",
  "lobster",
  "loch_ness_monster",
  "lollipop",
  "lotus_blossom",
  "luggage_trolley",
  "luna_moth",
  "lyre",
  "magic_wand",
  "magnifying_glass",
  "mailbox",
  "mallard_duck",
  "manatee",
  "martini_glass",
  "matchbox",
  "mermaid",
  "message_in_bottle",
  "metal_detector",
  "metronome",
  "microphone",
  "microscope",
  "microwave",
  "milk_carton",
  "mine_cart",
  "monkey",
  "monster_truck",
  "moose",
  "moray_eel",
  "mosquito",
  "motorbike",
  "mountain_goat",
  "mouse_trap",
  "mushroom",
  "music_stand",
  "narwhal",
  "nautilus_shell",
  "naval_mine",
  "necktie",
  "nut_and_bolt",
  "oak_tree",
  "oarfish",
  "obelisk",
  "ocean_wave",
  "octopus",
  "oil_rig",
  "onion_rings",
  "origami_crane",
  "ostrich",
  "owl",
  "padlock",
  "pagoda",
  "paint_roller",
  "paintbrush",
  "palm_tree",
  "pan_flute",
  "pancake_stack",
  "panda",
  "paper_airplane",
  "paper_clip",
  "parachute",
  "paraglider",
  "park_bench",
  "parking_meter",
  "parrot",
  "peacock",
  "peanut",
  "pear",
  "pegasus",
  "pelican",
  "penguin",
  "penny_farthing",
  "pepper_mill",
  "periscope",
  "phoenix",
  "pickaxe",
  "pickup_truck",
  "pig",
  "pinball_machine",
  "pine_tree",
  "pineapple",
  "ping_pong_paddle",
  "pinwheel",
  "piranha",
  "pirate_ship",
  "pitchfork",
  "pizza_slice",
  "platypus",
  "pliers",
  "plunger",
  "pocket_watch",
  "pogo_stick",
  "polaroid_camera",
  "police_car",
  "poodle",
  "popcorn_bucket",
  "popcorn_cart",
  "popsicle",
  "porcupine",
  "power_drill",
  "praying_mantis",
  "pretzel",
  "prickly_pear",
  "pterodactyl",
  "pufferfish",
  "puffin",
  "pumpkin",
  "pyramid",
  "rabbit",
  "raccoon",
  "radio_tower",
  "rainbow",
  "ramen_bowl",
  "rattlesnake",
  "red_wagon",
  "refrigerator",
  "reindeer",
  "rhinoceros",
  "rickshaw",
  "river_otter",
  "rocket",
  "rocking_chair",
  "rocking_horse",
  "roller_coaster",
  "rollerskates",
  "rolling_pin",
  "rolling_suitcase",
  "rooster",
  "rose_stem",
  "rotary_phone",
  "saber_tooth_cat",
  "safe_vault",
  "safety_pin",
  "sailboat",
  "salamander",
  "salt_shaker",
  "sand_dollar",
  "satellite",
  "saxophone",
  "scarecrow",
  "school_bus",
  "scissors",
  "scorpion",
  "screwdriver",
  "scythe",
  "sea_anemone",
  "sea_lion",
  "sea_turtle",
  "sea_urchin",
  "seagull",
  "seahorse",
  "seaplane",
  "segway",
  "selfie_stick",
  "sewing_machine",
  "sextant",
  "shark",
  "shepherd_crook",
  "ship_wheel",
  "shopping_cart",
  "shovel",
  "shrimp",
  "sink_faucet",
  "sitar",
  "skateboard",
  "skeleton_key",
  "ski_goggles",
  "slot_machine",
  "sloth",
  "snail",
  "sneaker",
  "snorkel_mask",
  "snowflake",
  "snowman",
  "snowmobile",
  "snowplow",
  "soccer_ball",
  "soda_can",
  "sombrero",
  "soup_ladle",
  "space_shuttle",
  "spatula",
  "spear",
  "spider",
  "spiderweb",
  "spiral_staircase",
  "squid",
  "squirrel",
  "stag_beetle",
  "stagecoach",
  "stand_mixer",
  "stapler",
  "starfish",
  "stealth_bomber",
  "steamroller",
  "stegosaurus",
  "step_stool",
  "stethoscope",
  "stingray",
  "stork",
  "strawberry",
  "street_lamp",
  "submarine",
  "sunflower",
  "sunglasses",
  "surfboard",
  "sushi",
  "suspension_bridge",
  "swan",
  "swim_fins",
  "swiss_army_knife",
  "swivel_chair",
  "swordfish",
  "syringe",
  "t_bone_steak",
  "table_lamp",
  "taco",
  "taj_mahal",
  "tandem_bicycle",
  "tape_dispenser",
  "teacup_saucer",
  "teapot",
  "teepee",
  "telescope",
  "television",
  "tennis_racket",
  "thermometer",
  "thermos_flask",
  "thread_spool",
  "tiger",
  "toaster",
  "top_hat",
  "tornado",
  "tortoise",
  "toucan",
  "tractor",
  "traffic_cone",
  "traffic_light",
  "transistor_radio",
  "treasure_chest",
  "treehouse",
  "trex",
  "triceratops",
  "tricycle",
  "trident",
  "trilobite",
  "trojan_horse",
  "trombone",
  "trophy",
  "trumpet",
  "tuba",
  "tuning_fork",
  "turkey",
  "typewriter",
  "umbrella",
  "unicorn",
  "unicycle",
  "vending_machine",
  "venus_flytrap",
  "vespa_scooter",
  "viking_ship",
  "violin",
  "virus_microbe",
  "volcano",
  "vulture",
  "waffle_iron",
  "walkie_talkie",
  "walrus",
  "washing_machine",
  "wasp",
  "water_skis",
  "water_slide",
  "water_tower",
  "watermelon_slice",
  "weather_vane",
  "wedding_cake",
  "weeping_willow",
  "wet_mop",
  "whale",
  "wheelbarrow",
  "wheelchair",
  "whirlpool",
  "wild_boar",
  "wind_chime",
  "windmill",
  "windsock",
  "windsurfer",
  "wine_glass",
  "winter_mitten",
  "wishing_well",
  "wizard_hat",
  "woodpecker",
  "woolly_mammoth",
  "wrapped_candy",
  "wrench",
  "xylophone",
  "zebra",
  "zipper"
];

export const ALLOWED_SKETCH_OPTION_KEYS = new Set([
  ...ALLOWED_NOUN_IDS,
  UNFINISHED_LINES_KEY,
  RANDOM_SCRIBBLE_KEY,
]);

const EXACT_SHOWCASE_HOST_RE =
  /^(?:[a-z0-9-]+-853813963450|ais-(?:dev|pre)-[a-z0-9-]+-73428471351)\.[a-z0-9-]+\.run\.app$/;

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 90;
const RATE_MAX_CONCURRENT = 4;
const MAX_RATE_BUCKETS = 4096;
const rateBuckets = new Map();

function isCloudRunRuntime() {
  return (
    typeof process.env.K_SERVICE === 'string' &&
    process.env.K_SERVICE.trim().length > 0
  );
}

export function isAllowedRequestOrigin(req) {
  const rawOrigin = req?.headers?.origin;
  const origin = typeof rawOrigin === 'string' ? rawOrigin.trim() : '';
  const inCloudRun = isCloudRunRuntime();

  if (!origin) {
    const secFetchSite = String(
      req?.headers?.['sec-fetch-site'] || '',
    ).toLowerCase();
    return secFetchSite === 'same-origin';
  }

  if (origin === 'null') {
    return false;
  }

  try {
    const parsed = new URL(origin);
    if (inCloudRun && parsed.protocol !== 'https:') {
      return false;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      !inCloudRun &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.usercontent.goog'))
    ) {
      return true;
    }
    return (
      hostname === 'aistudio.google.com' ||
      hostname === 'ai.studio' ||
      hostname.endsWith('.ai.studio') ||
      EXACT_SHOWCASE_HOST_RE.test(hostname)
    );
  } catch {
    return false;
  }
}

function isInternalOrLoopbackIp(ip) {
  const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean.startsWith('127.') ||
    clean.startsWith('10.') ||
    clean.startsWith('169.254.') ||
    clean.startsWith('192.168.') ||
    clean.startsWith('fe80:') ||
    clean.startsWith('fc') ||
    clean.startsWith('fd')
  ) {
    return true;
  }
  const m172 = clean.match(/^172\.(\d{1,3})\./);
  if (m172) {
    const second = Number(m172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function normalizeIpKey(rawIp) {
  const ip = String(rawIp || '').trim().toLowerCase();
  if (!ip) return 'unknown';
  const v4Mapped = ip.startsWith('::ffff:') && ip.includes('.') ? ip.slice(7) : ip;
  if (!v4Mapped.includes(':')) {
    return v4Mapped;
  }
  const noZone = v4Mapped.split('%')[0];
  const parts = noZone.split('::');
  if (parts.length > 2) return noZone;
  const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(':').filter(Boolean) : [];
  const fill = Math.max(0, 8 - (left.length + right.length));
  const full = [...left, ...Array(fill).fill('0000'), ...right].slice(0, 8);
  return `${full.slice(0, 4).map((h) => h.padStart(4, '0')).join(':')}::/64`;
}

export function extractClientIpKey(req) {
  const xff = req?.headers?.['x-forwarded-for'];
  const rawXff = Array.isArray(xff) ? xff.join(',') : typeof xff === 'string' ? xff : '';
  if (rawXff) {
    const hops = rawXff
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    while (hops.length > 1 && isInternalOrLoopbackIp(hops[hops.length - 1])) {
      hops.pop();
    }
    if (hops.length > 0) {
      return normalizeIpKey(hops[hops.length - 1]);
    }
  }
  return normalizeIpKey(req?.socket?.remoteAddress || 'unknown');
}

export function acquireRateLimitSlot(ipKey, now = Date.now()) {
  let bucket = rateBuckets.get(ipKey);
  if (!bucket) {
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      const oldestKey = rateBuckets.keys().next().value;
      if (oldestKey !== undefined) rateBuckets.delete(oldestKey);
    }
    bucket = { timestamps: [], active: 0 };
    rateBuckets.set(ipKey, bucket);
  }

  const cutoff = now - RATE_WINDOW_MS;
  while (bucket.timestamps.length > 0 && bucket.timestamps[0] <= cutoff) {
    bucket.timestamps.shift();
  }

  if (
    bucket.active >= RATE_MAX_CONCURRENT ||
    bucket.timestamps.length >= RATE_MAX_REQUESTS
  ) {
    return null;
  }

  bucket.timestamps.push(now);
  bucket.active += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    bucket.active = Math.max(0, bucket.active - 1);
  };
}

export function resetRateLimitsForTest() {
  rateBuckets.clear();
}

function safeProxyHttpStatus(status) {
  if (status === 403) return 401;
  if (status === 502 || status === 503 || status === 504) return 500;
  return status >= 400 && status < 600 ? status : 500;
}

export function sendJsonResponse(res, statusCode, payload, extraHeaders = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.end(body);
}

export function sendDecisionsError(res, status, code, message, extraHeaders = {}) {
  const wireStatus = safeProxyHttpStatus(status);
  sendJsonResponse(
    res,
    wireStatus,
    {
      error: { status, code, message },
      __decisionsProxyError: { status, code, message },
    },
    extraHeaders,
  );
}

export function readBoundedBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const rawLen = Number(req?.headers?.['content-length'] || 0);
    if (Number.isFinite(rawLen) && rawLen > maxBytes) {
      req.pause?.();
      reject(new Error('PAYLOAD_TOO_LARGE'));
      return;
    }

    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) return;
      const buf =
        typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
      totalBytes += buf.length;
      if (totalBytes > maxBytes) {
        settled = true;
        req.pause?.();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString('utf8'));
      }
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

function validateSketchPngBase64(rawData) {
  if (typeof rawData !== 'string') {
    return { ok: false, message: 'Sketch snapshot image data is required.' };
  }
  const stripped = rawData
    .replace(/^data:image\/png;base64,/i, '')
    .replace(/\s+/g, '');
  if (stripped.length < 64) {
    return { ok: false, message: 'Sketch snapshot PNG is empty or truncated.' };
  }
  if (stripped.length > MAX_PNG_BASE64_CHARS) {
    return { ok: false, message: 'Sketch snapshot PNG exceeds size limit.' };
  }
  if (stripped.length % 4 !== 0 || !BASE64_RE.test(stripped)) {
    return { ok: false, message: 'Sketch snapshot must be valid base64.' };
  }

  const header = Buffer.from(stripped.slice(0, 32), 'base64');
  if (header.length < 24) {
    return { ok: false, message: 'Sketch snapshot PNG header is truncated.' };
  }
  for (let i = 0; i < PNG_SIGNATURE.length; i += 1) {
    if (header[i] !== PNG_SIGNATURE[i]) {
      return { ok: false, message: 'Sketch snapshot must be a valid PNG image.' };
    }
  }
  if (header.toString('ascii', 12, 16) !== 'IHDR') {
    return { ok: false, message: 'Sketch snapshot PNG is missing IHDR chunk.' };
  }
  const width = header.readUInt32BE(16);
  const height = header.readUInt32BE(20);
  if (width < 64 || width > 1024 || height < 64 || height > 1024) {
    return {
      ok: false,
      message: 'Sketch snapshot PNG dimensions are out of bounds.',
    };
  }

  return { ok: true, base64: stripped };
}

export function buildVerifiedSketchPayload(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: 'Request body must be a JSON object.' };
  }

  for (const key of Object.keys(parsed)) {
    if (key !== 'model' && key !== 'input' && key !== 'questions' && key !== 'imageBase64') {
      return { ok: false, message: `Unsupported request field: ${key}.` };
    }
  }

  let rawImageData = null;
  if (typeof parsed.imageBase64 === 'string') {
    rawImageData = parsed.imageBase64;
  } else if (Array.isArray(parsed.input)) {
    if (parsed.input.length === 0 || parsed.input.length > 2) {
      return {
        ok: false,
        message: 'Sketch input must contain at most one prompt and one PNG snapshot.',
      };
    }
    let imageBlocks = 0;
    for (const block of parsed.input) {
      if (!block || typeof block !== 'object' || Array.isArray(block)) {
        return { ok: false, message: 'Invalid content block in input.' };
      }
      if (
        'uri' in block ||
        'fileData' in block ||
        'file_data' in block ||
        'fileUri' in block ||
        'file_uri' in block
      ) {
        return { ok: false, message: 'External media URIs are not permitted.' };
      }
      if (block.type === 'text') {
        if (typeof block.text !== 'string' || block.text !== BLIND_SNAPSHOT_TEXT) {
          return {
            ok: false,
            message: 'Custom text prompts are not permitted on the Speed Sketch endpoint.',
          };
        }
      } else if (block.type === 'image') {
        if (block.mime_type !== 'image/png') {
          return { ok: false, message: 'Only image/png sketch snapshots are accepted.' };
        }
        imageBlocks += 1;
        rawImageData = block.data;
      } else {
        return {
          ok: false,
          message: `Unsupported input modality: ${String(block.type)}.`,
        };
      }
    }
    if (imageBlocks !== 1) {
      return { ok: false, message: 'Exactly one image/png snapshot is required.' };
    }
  } else {
    return { ok: false, message: 'Sketch snapshot input is required.' };
  }

  const pngCheck = validateSketchPngBase64(rawImageData);
  if (!pngCheck.ok) {
    return pngCheck;
  }

  const questions = parsed.questions;
  if (!questions || typeof questions !== 'object' || Array.isArray(questions)) {
    return { ok: false, message: 'Sketch question pool is required.' };
  }
  const qKeys = Object.keys(questions);
  if (
    qKeys.length === 0 ||
    qKeys.some((k) => k !== 'sketch_guess' && k !== 'written_words_cheat') ||
    !questions.sketch_guess
  ) {
    return {
      ok: false,
      message: 'Only Speed Sketch classification questions are permitted.',
    };
  }

  const guessQ = questions.sketch_guess;
  if (
    !guessQ ||
    typeof guessQ !== 'object' ||
    Array.isArray(guessQ) ||
    guessQ.type !== 'choice' ||
    !guessQ.criteria ||
    typeof guessQ.criteria !== 'object' ||
    Array.isArray(guessQ.criteria)
  ) {
    return { ok: false, message: 'Invalid sketch_guess choice criteria.' };
  }

  const optionKeys = Object.keys(guessQ.criteria);
  if (optionKeys.length < 2 || optionKeys.length > CHOICE_OPTION_LIMIT) {
    return {
      ok: false,
      message: `sketch_guess must contain between 2 and ${CHOICE_OPTION_LIMIT} options.`,
    };
  }

  const reconstructedCriteria = {};
  for (const optKey of optionKeys) {
    if (!ALLOWED_SKETCH_OPTION_KEYS.has(optKey)) {
      return {
        ok: false,
        message: `Unrecognized sketch word option: ${optKey}.`,
      };
    }
    if (optKey === UNFINISHED_LINES_KEY) {
      reconstructedCriteria[optKey] = UNFINISHED_DESCRIPTION;
    } else if (optKey === RANDOM_SCRIBBLE_KEY) {
      reconstructedCriteria[optKey] = SCRIBBLE_DESCRIPTION;
    } else {
      reconstructedCriteria[optKey] = null;
    }
  }

  return {
    ok: true,
    upstreamBody: JSON.stringify({
      model: DECISIONS_MODEL,
      input: [
        { type: 'text', text: BLIND_SNAPSHOT_TEXT },
        {
          type: 'image',
          mime_type: 'image/png',
          data: pngCheck.base64,
          resolution: 'low',
        },
      ],
      questions: {
        sketch_guess: {
          type: 'choice',
          instructions: BLIND_CHOICE_INSTRUCTIONS,
          criteria: reconstructedCriteria,
        },
        written_words_cheat: {
          type: 'noul',
          instructions: WRITTEN_WORDS_CHEAT_INSTRUCTIONS,
          criteria: {
            true_description: WRITTEN_WORDS_TRUE_DESCRIPTION,
            false_description: WRITTEN_WORDS_FALSE_DESCRIPTION,
          },
        },
      },
    }),
  };
}

export function resolveServerGeminiKey(req, extraEnv = {}) {
  const candidates = [
    extraEnv.DECISIONS_API_KEY,
    process.env.DECISIONS_API_KEY,
    extraEnv.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
  ];
  if (!isCloudRunRuntime()) {
    const headerVal = req?.headers?.['x-goog-api-key'];
    const headerKey =
      typeof headerVal === 'string'
        ? headerVal
        : Array.isArray(headerVal)
          ? headerVal[0] || ''
          : '';
    candidates.push(headerKey);
  }
  for (const candidate of candidates) {
    const trimmed = (candidate || '').trim();
    if (
      trimmed &&
      trimmed !== 'MY_GEMINI_API_KEY' &&
      trimmed !== 'MY_DECISIONS_API_KEY' &&
      trimmed !== 'GEMINI_API_KEY' &&
      trimmed !== 'YOUR_API_KEY'
    ) {
      return trimmed;
    }
  }
  return '';
}

function scrubSecrets(text, secret) {
  let out = String(text || '');
  if (secret && secret.length >= 8) {
    out = out.split(secret).join('[REDACTED]');
  }
  return out
    .replace(/AIza[0-9A-Za-z_-]{16,}/g, '[REDACTED_KEY]')
    .replace(/\bAQ\.[0-9A-Za-z._-]{16,}/g, '[REDACTED_KEY]');
}

export async function handleDecisionsPost(req, res, options = {}) {
  if (!isAllowedRequestOrigin(req)) {
    sendDecisionsError(
      res,
      401,
      'FORBIDDEN_ORIGIN',
      'Cross-origin or untrusted request rejected.',
    );
    return;
  }

  const contentType = String(req?.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    sendDecisionsError(
      res,
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Expected Content-Type: application/json.',
    );
    return;
  }

  const ipKey = extractClientIpKey(req);
  const releaseSlot = acquireRateLimitSlot(ipKey);
  if (!releaseSlot) {
    sendDecisionsError(
      res,
      429,
      'RATE_LIMITED',
      'Too many sketch evaluation requests. Please wait a few seconds and try again.',
      { 'Retry-After': '10' },
    );
    return;
  }

  try {
    const key = resolveServerGeminiKey(req, options.env || {});
    if (!key) {
      sendDecisionsError(res, 503, 'NO_API_KEY', MISSING_KEY_MESSAGE);
      return;
    }

    let rawBody = '';
    try {
      rawBody = await readBoundedBody(req, MAX_BODY_BYTES);
    } catch (err) {
      const isTooLarge =
        err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE';
      if (isTooLarge) {
        res.once?.('finish', () => req.destroy?.());
      }
      sendDecisionsError(
        res,
        isTooLarge ? 413 : 400,
        isTooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
        isTooLarge
          ? 'Request payload exceeds 512 KB limit.'
          : 'Failed to read request body.',
        isTooLarge ? { Connection: 'close' } : {},
      );
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      console.error('Decisions proxy invalid JSON body:', err);
      sendDecisionsError(res, 400, 'BAD_REQUEST', 'Malformed JSON request body.');
      return;
    }

    const validated = buildVerifiedSketchPayload(parsed);
    if (!validated.ok) {
      sendDecisionsError(res, 400, 'BAD_REQUEST', validated.message);
      return;
    }

    const fetchFn = options.fetchImpl || fetch;
    try {
      const upstream = await fetchFn(DECISIONS_UPSTREAM_URL, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
          'User-Agent': 'aistudio-build',
        },
        body: validated.upstreamBody,
        signal: AbortSignal.timeout(10_000),
      });
      const upstreamText = await upstream.text();
      if (!upstream.ok) {
        sendDecisionsError(
          res,
          upstream.status,
          'UPSTREAM_ERROR',
          scrubSecrets(upstreamText, key),
        );
        return;
      }
      sendJsonResponse(res, 200, upstreamText);
    } catch (err) {
      console.error('Decisions proxy upstream error:', err);
      const detail =
        err instanceof Error
          ? scrubSecrets(err.message, key)
          : 'Upstream request failed.';
      sendDecisionsError(
        res,
        502,
        'UPSTREAM_ERROR',
        `Decisions proxy upstream error: ${detail}`,
      );
    }
  } finally {
    releaseSlot();
  }
}
