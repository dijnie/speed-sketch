export type VisualClusterId =
  | 'twin_wheels_and_loops'
  | 'arthropod_and_radial'
  | 'necked_instruments_and_long_tools'
  | 'domed_canopy_and_tall_spires'
  | 'birds_beaks_and_winged_fliers'
  | 'appliances_boxes_and_gadgets'
  | 'quadrupeds_dinosaurs_and_beasts'
  | 'aquatic_serpentine_and_coiled'
  | 'tableware_food_and_produce'
  | 'workshop_apparel_and_props';

export type ShapeTag =
  | 'looped'
  | 'spoked'
  | 'shafted'
  | 'domed'
  | 'spired'
  | 'winged'
  | 'boxed'
  | 'legged'
  | 'coiled'
  | 'hinged'
  | 'vessel'
  | 'layered';

export type PromptTier = 'none' | 'easy' | 'medium' | 'hard';
export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface SketchWord {
  readonly id: string;
  readonly label: string;
  readonly cluster: VisualClusterId;
  readonly shapeTags: readonly ShapeTag[];
  readonly promptTier: PromptTier;
}

export interface DifficultySpec {
  readonly id: DifficultyId;
  readonly label: string;
  readonly durationSec: number;
  readonly winThreshold: number;
  readonly verySimilarCount: number;
  readonly similarCount: number;
  readonly genericCount: number;
}

export interface PoolComposition {
  readonly target: SketchWord;
  readonly difficulty: DifficultyId;
  readonly verySimilarIds: readonly string[];
  readonly similarIds: readonly string[];
  readonly genericIds: readonly string[];
  readonly nounIds: readonly string[];
  readonly optionKeys: readonly string[];
}

export const UNFINISHED_LINES_KEY = 'unfinished_lines';
export const RANDOM_SCRIBBLE_KEY = 'random_scribble';
export const CHOICE_OPTION_LIMIT = 255;
export const DEFAULT_DIFFICULTY: DifficultyId = 'medium';

export const DIFFICULTY_ORDER: readonly DifficultyId[] = [
  'easy',
  'medium',
  'hard',
];

export const DIFFICULTY_SPECS: Readonly<Record<DifficultyId, DifficultySpec>> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    durationSec: 30,
    winThreshold: 0.35,
    verySimilarCount: 10,
    similarCount: 40,
    genericCount: 202,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    durationSec: 30,
    winThreshold: 0.5,
    verySimilarCount: 50,
    similarCount: 100,
    genericCount: 102,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    durationSec: 30,
    winThreshold: 0.65,
    verySimilarCount: 55,
    similarCount: 130,
    genericCount: 67,
  },
};

type RawMorphologyRow = readonly [
  string,
  string,
  readonly ShapeTag[],
  PromptTier,
];

const RAW_CLUSTER_CATALOG: Readonly<Record<VisualClusterId, readonly RawMorphologyRow[]>> = {
  twin_wheels_and_loops: [
    ['bicycle', 'Bicycle', ['looped', 'spoked', 'shafted'], 'easy'],
    ['tricycle', 'Tricycle', ['looped', 'spoked', 'shafted'], 'medium'],
    ['unicycle', 'Unicycle', ['looped', 'spoked', 'shafted'], 'medium'],
    ['penny_farthing', 'Penny farthing', ['looped', 'spoked'], 'hard'],
    ['tandem_bicycle', 'Tandem bicycle', ['looped', 'spoked', 'layered'], 'hard'],
    ['exercise_bike', 'Exercise bike', ['looped', 'legged', 'shafted'], 'hard'],
    ['motorbike', 'Motorbike', ['looped', 'coiled', 'boxed'], 'medium'],
    ['snowplow', 'Snowplow', ['looped', 'boxed', 'winged'], 'hard'],
    ['vespa_scooter', 'Vespa scooter', ['looped', 'domed', 'coiled'], 'hard'],
    ['kick_scooter', 'Kick scooter', ['looped', 'shafted'], 'easy'],
    ['wheelchair', 'Wheelchair', ['looped', 'spoked', 'legged'], 'medium'],
    ['baby_stroller', 'Baby stroller', ['looped', 'domed', 'vessel'], 'medium'],
    ['wheelbarrow', 'Wheelbarrow', ['looped', 'vessel', 'shafted'], 'medium'],
    ['shopping_cart', 'Shopping cart', ['looped', 'layered', 'boxed'], 'hard'],
    ['lawnmower', 'Lawnmower', ['looped', 'shafted', 'boxed'], 'hard'],
    ['rickshaw', 'Rickshaw', ['looped', 'domed', 'shafted'], 'hard'],
    ['chariot', 'Chariot', ['looped', 'vessel', 'spoked'], 'hard'],
    ['golf_cart', 'Golf cart', ['looped', 'boxed', 'domed'], 'hard'],
    ['go_kart', 'Go-kart', ['looped', 'boxed'], 'medium'],
    ['tractor', 'Tractor', ['looped', 'boxed', 'spoked'], 'easy'],
    ['skateboard', 'Skateboard', ['looped', 'layered'], 'easy'],
    ['rollerskates', 'Rollerskates', ['looped', 'legged', 'layered'], 'medium'],
    ['stagecoach', 'Stagecoach', ['looped', 'boxed', 'spoked'], 'hard'],
    ['eyeglasses', 'Eyeglasses', ['looped', 'hinged'], 'none'],
    ['sunglasses', 'Sunglasses', ['looped', 'boxed'], 'none'],
    ['ski_goggles', 'Ski goggles', ['looped', 'coiled'], 'none'],
    ['binoculars', 'Binoculars', ['looped', 'boxed'], 'easy'],
    ['scissors', 'Scissors', ['looped', 'hinged', 'spired'], 'easy'],
    ['pliers', 'Pliers', ['hinged', 'shafted', 'coiled'], 'medium'],
    ['garden_shears', 'Garden shears', ['hinged', 'shafted', 'spired'], 'hard'],
    ['barbell', 'Barbell', ['looped', 'shafted'], 'none'],
    ['dumbbell', 'Dumbbell', ['looped', 'shafted'], 'none'],
    ['soccer_ball', 'Soccer ball', ['looped', 'layered'], 'none'],
    ['cassette_tape', 'Cassette tape', ['looped', 'boxed'], 'medium'],
    ['film_projector', 'Film projector', ['looped', 'boxed', 'legged'], 'hard'],
    ['film_reel', 'Film reel', ['looped', 'spoked'], 'medium'],
    ['boombox', 'Boombox', ['looped', 'boxed'], 'medium'],
    ['cannon', 'Cannon', ['looped', 'shafted'], 'medium'],
    ['catapult', 'Catapult', ['looped', 'hinged', 'boxed'], 'hard'],
    ['red_wagon', 'Red wagon', ['looped', 'vessel', 'shafted'], 'easy'],
    ['hot_dog_cart', 'Hot dog cart', ['looped', 'domed', 'boxed'], 'hard'],
    ['popcorn_cart', 'Popcorn cart', ['looped', 'boxed', 'spoked'], 'hard'],
    ['segway', 'Segway', ['looped', 'shafted'], 'medium'],
    ['snowmobile', 'Snowmobile', ['coiled', 'boxed', 'winged'], 'hard'],
    ['atv_quad', 'ATV quad', ['looped', 'boxed'], 'hard'],
    ['hand_truck', 'Hand truck', ['looped', 'shafted'], 'hard'],
    ['luggage_trolley', 'Luggage trolley', ['looped', 'boxed', 'shafted'], 'hard'],
    ['cable_car', 'Cable car', ['looped', 'boxed'], 'medium'],
    ['mine_cart', 'Mine cart', ['looped', 'vessel', 'boxed'], 'medium'],
    ['forklift', 'Forklift', ['looped', 'layered', 'boxed'], 'hard'],
    ['bulldozer', 'Bulldozer', ['looped', 'boxed', 'layered'], 'hard'],
    ['steamroller', 'Steamroller', ['looped', 'boxed'], 'hard'],
    ['excavator', 'Excavator', ['looped', 'hinged', 'boxed'], 'hard'],
    ['cement_mixer', 'Cement mixer', ['looped', 'vessel', 'boxed'], 'hard'],
    ['ambulance', 'Ambulance', ['looped', 'boxed'], 'easy'],
    ['firetruck', 'Firetruck', ['looped', 'layered', 'boxed'], 'medium'],
    ['school_bus', 'School bus', ['looped', 'boxed', 'layered'], 'easy'],
    ['pickup_truck', 'Pickup truck', ['looped', 'boxed'], 'medium'],
    ['police_car', 'Police car', ['looped', 'boxed'], 'medium'],
    ['monster_truck', 'Monster truck', ['looped', 'boxed', 'spoked'], 'medium'],
  ],
  arthropod_and_radial: [
    ['octopus', 'Octopus', ['spoked', 'coiled', 'domed'], 'easy'],
    ['squid', 'Squid', ['spoked', 'spired', 'coiled'], 'medium'],
    ['cuttlefish', 'Cuttlefish', ['spoked', 'winged', 'coiled'], 'hard'],
    ['jellyfish', 'Jellyfish', ['domed', 'spoked', 'coiled'], 'easy'],
    ['sea_anemone', 'Sea anemone', ['spoked', 'vessel', 'coiled'], 'hard'],
    ['starfish', 'Starfish', ['spoked', 'spired'], 'easy'],
    ['sea_urchin', 'Sea urchin', ['spoked', 'looped'], 'medium'],
    ['sand_dollar', 'Sand dollar', ['looped', 'spoked'], 'none'],
    ['crab', 'Crab', ['spoked', 'hinged', 'looped'], 'easy'],
    ['hermit_crab', 'Hermit crab', ['coiled', 'legged', 'spired'], 'hard'],
    ['lobster', 'Lobster', ['hinged', 'legged', 'layered'], 'medium'],
    ['shrimp', 'Shrimp', ['coiled', 'legged', 'layered'], 'medium'],
    ['horseshoe_crab', 'Horseshoe crab', ['domed', 'spired', 'legged'], 'hard'],
    ['scorpion', 'Scorpion', ['hinged', 'coiled', 'legged'], 'hard'],
    ['spider', 'Spider', ['spoked', 'legged', 'looped'], 'easy'],
    ['virus_microbe', 'Virus microbe', ['spoked', 'looped'], 'hard'],
    ['centipede', 'Centipede', ['legged', 'coiled', 'layered'], 'medium'],
    ['stag_beetle', 'Stag beetle', ['hinged', 'legged', 'domed'], 'hard'],
    ['ladybug', 'Ladybug', ['domed', 'legged', 'looped'], 'easy'],
    ['earwig', 'Earwig', ['hinged', 'legged', 'shafted'], 'hard'],
    ['ant', 'Ant', ['legged', 'looped'], 'easy'],
    ['praying_mantis', 'Praying mantis', ['hinged', 'legged', 'shafted'], 'hard'],
    ['grasshopper', 'Grasshopper', ['legged', 'winged', 'layered'], 'medium'],
    ['dragonfly', 'Dragonfly', ['winged', 'shafted'], 'medium'],
    ['mosquito', 'Mosquito', ['winged', 'legged', 'spired'], 'medium'],
    ['housefly', 'Housefly', ['winged', 'legged', 'looped'], 'none'],
    ['bee', 'Bee', ['winged', 'layered', 'looped'], 'easy'],
    ['wasp', 'Wasp', ['winged', 'spired', 'layered'], 'medium'],
    ['fireworks', 'Fireworks', ['spoked', 'spired'], 'medium'],
    ['caterpillar', 'Caterpillar', ['coiled', 'legged', 'layered'], 'easy'],
    ['trilobite', 'Trilobite', ['layered', 'domed', 'legged'], 'hard'],
    ['chandelier', 'Chandelier', ['spoked', 'layered', 'coiled'], 'hard'],
    ['candelabra', 'Candelabra', ['spoked', 'spired', 'shafted'], 'hard'],
    ['ceiling_fan', 'Ceiling fan', ['spoked', 'winged', 'looped'], 'medium'],
    ['desk_fan', 'Desk fan', ['spoked', 'looped'], 'medium'],
    ['pinwheel', 'Pinwheel', ['spoked', 'shafted'], 'easy'],
    ['palm_tree', 'Palm tree', ['spoked', 'shafted', 'coiled'], 'easy'],
    ['sunflower', 'Sunflower', ['spoked', 'looped', 'shafted'], 'easy'],
    ['dandelion', 'Dandelion', ['spoked', 'shafted', 'looped'], 'medium'],
    ['daisy_flower', 'Daisy flower', ['spoked', 'looped'], 'none'],
    ['rose_stem', 'Rose stem', ['coiled', 'shafted'], 'medium'],
    ['lotus_blossom', 'Lotus blossom', ['spoked', 'layered', 'domed'], 'medium'],
    ['venus_flytrap', 'Venus flytrap', ['hinged', 'vessel', 'spired'], 'hard'],
    ['cactus', 'Cactus', ['spoked', 'spired'], 'easy'],
    ['prickly_pear', 'Prickly pear', ['spoked', 'looped'], 'hard'],
    ['aloe_plant', 'Aloe plant', ['spoked', 'spired', 'vessel'], 'medium'],
    ['bonsai_tree', 'Bonsai tree', ['coiled', 'vessel', 'domed'], 'hard'],
    ['weeping_willow', 'Weeping willow', ['spoked', 'domed', 'shafted'], 'hard'],
    ['campfire', 'Campfire', ['spoked', 'spired', 'layered'], 'easy'],
    ['snowflake', 'Snowflake', ['spoked', 'layered', 'looped'], 'easy'],
    ['drone', 'Drone', ['spoked', 'winged', 'looped'], 'medium'],
    ['satellite', 'Satellite', ['winged', 'boxed', 'spoked'], 'medium'],
    ['ferris_wheel', 'Ferris wheel', ['spoked', 'looped', 'legged'], 'hard'],
    ['carousel', 'Carousel', ['domed', 'spoked', 'layered'], 'hard'],
    ['naval_mine', 'Naval mine', ['spoked', 'spired', 'looped'], 'hard'],
    ['ship_wheel', 'Ship wheel', ['spoked', 'looped'], 'medium'],
    ['spiderweb', 'Spiderweb', ['spoked', 'layered', 'looped'], 'easy'],
    ['dreamcatcher', 'Dreamcatcher', ['looped', 'spoked'], 'hard'],
    ['coat_rack', 'Coat rack', ['spoked', 'shafted', 'legged'], 'medium'],
    ['wind_chime', 'Wind chime', ['layered', 'shafted'], 'hard'],
  ],
  necked_instruments_and_long_tools: [
    ['guitar', 'Guitar', ['shafted', 'coiled'], 'easy'],
    ['shepherd_crook', 'Shepherd crook', ['shafted', 'coiled'], 'hard'],
    ['violin', 'Violin', ['shafted', 'coiled'], 'medium'],
    ['banjo', 'Banjo', ['shafted', 'looped'], 'medium'],
    ['sitar', 'Sitar', ['shafted', 'layered', 'domed'], 'hard'],
    ['harp', 'Harp', ['layered', 'coiled', 'spired'], 'medium'],
    ['lyre', 'Lyre', ['coiled', 'layered'], 'hard'],
    ['saxophone', 'Saxophone', ['coiled', 'vessel', 'shafted'], 'hard'],
    ['trumpet', 'Trumpet', ['shafted', 'layered', 'vessel'], 'medium'],
    ['trombone', 'Trombone', ['shafted', 'coiled'], 'hard'],
    ['french_horn', 'French horn', ['coiled', 'looped', 'vessel'], 'hard'],
    ['tuba', 'Tuba', ['coiled', 'vessel', 'layered'], 'hard'],
    ['clarinet', 'Clarinet', ['shafted', 'spired'], 'medium'],
    ['flute', 'Flute', ['shafted', 'layered'], 'none'],
    ['pan_flute', 'Pan flute', ['layered', 'shafted'], 'medium'],
    ['bagpipes', 'Bagpipes', ['spoked', 'vessel', 'shafted'], 'hard'],
    ['keytar', 'Keytar', ['shafted', 'layered', 'boxed'], 'hard'],
    ['microphone', 'Microphone', ['shafted', 'domed'], 'easy'],
    ['music_stand', 'Music stand', ['shafted', 'legged'], 'hard'],
    ['tuning_fork', 'Tuning fork', ['shafted', 'hinged'], 'medium'],
    ['rolling_pin', 'Rolling pin', ['shafted', 'boxed'], 'easy'],
    ['plunger', 'Plunger', ['shafted', 'domed'], 'easy'],
    ['metal_detector', 'Metal detector', ['shafted', 'looped'], 'hard'],
    ['pogo_stick', 'Pogo stick', ['shafted', 'layered'], 'hard'],
    ['magic_wand', 'Magic wand', ['shafted', 'spoked'], 'easy'],
    ['butterfly_net', 'Butterfly net', ['shafted', 'looped', 'vessel'], 'medium'],
    ['tennis_racket', 'Tennis racket', ['shafted', 'looped'], 'easy'],
    ['ping_pong_paddle', 'Ping pong paddle', ['shafted', 'looped'], 'none'],
    ['baseball_bat', 'Baseball bat', ['shafted', 'domed'], 'none'],
    ['cricket_bat', 'Cricket bat', ['shafted', 'boxed'], 'medium'],
    ['golf_club', 'Golf club', ['shafted', 'hinged'], 'easy'],
    ['hockey_stick', 'Hockey stick', ['shafted', 'hinged'], 'easy'],
    ['lacrosse_stick', 'Lacrosse stick', ['shafted', 'vessel'], 'hard'],
    ['fishing_rod', 'Fishing rod', ['shafted', 'coiled'], 'easy'],
    ['broom', 'Broom', ['shafted', 'spoked'], 'easy'],
    ['wet_mop', 'Wet mop', ['shafted', 'spoked'], 'medium'],
    ['shovel', 'Shovel', ['shafted', 'spired', 'vessel'], 'easy'],
    ['selfie_stick', 'Selfie stick', ['shafted', 'boxed'], 'medium'],
    ['leaf_rake', 'Leaf rake', ['shafted', 'spoked'], 'easy'],
    ['pitchfork', 'Pitchfork', ['shafted', 'spired'], 'medium'],
    ['pickaxe', 'Pickaxe', ['shafted', 'spired', 'coiled'], 'medium'],
    ['hammer', 'Hammer', ['shafted', 'hinged', 'boxed'], 'easy'],
    ['battle_axe', 'Battle axe', ['shafted', 'winged'], 'medium'],
    ['scythe', 'Scythe', ['shafted', 'coiled', 'spired'], 'hard'],
    ['spear', 'Spear', ['shafted', 'spired'], 'none'],
    ['trident', 'Trident', ['shafted', 'spired'], 'medium'],
    ['broad_sword', 'Broad sword', ['shafted', 'spired'], 'easy'],
    ['fencing_foil', 'Fencing foil', ['shafted', 'domed'], 'hard'],
    ['bow_and_arrow', 'Bow and arrow', ['coiled', 'shafted', 'spired'], 'easy'],
    ['crossbow', 'Crossbow', ['winged', 'shafted'], 'hard'],
    ['canoe_paddle', 'Canoe paddle', ['shafted', 'winged'], 'medium'],
    ['thermometer', 'Thermometer', ['shafted', 'looped'], 'easy'],
    ['syringe', 'Syringe', ['shafted', 'spired', 'layered'], 'medium'],
    ['magnifying_glass', 'Magnifying glass', ['shafted', 'looped'], 'easy'],
    ['frying_pan', 'Frying pan', ['shafted', 'vessel', 'looped'], 'easy'],
    ['soup_ladle', 'Soup ladle', ['shafted', 'vessel'], 'medium'],
    ['egg_whisk', 'Egg whisk', ['shafted', 'looped'], 'medium'],
    ['spatula', 'Spatula', ['shafted', 'boxed', 'layered'], 'easy'],
    ['chainsaw', 'Chainsaw', ['boxed', 'layered', 'looped'], 'hard'],
    ['jackhammer', 'Jackhammer', ['shafted', 'spired', 'boxed'], 'hard'],
  ],
  domed_canopy_and_tall_spires: [
    ['umbrella', 'Umbrella', ['domed', 'shafted', 'coiled'], 'easy'],
    ['parachute', 'Parachute', ['domed', 'spoked'], 'easy'],
    ['mushroom', 'Mushroom', ['domed', 'shafted'], 'easy'],
    ['hot_air_balloon', 'Hot air balloon', ['domed', 'vessel', 'looped'], 'hard'],
    ['blimp', 'Blimp', ['domed', 'winged', 'looped'], 'medium'],
    ['flying_saucer', 'Flying saucer', ['domed', 'looped'], 'easy'],
    ['table_lamp', 'Table lamp', ['domed', 'shafted'], 'easy'],
    ['traffic_cone', 'Traffic cone', ['spired', 'layered'], 'easy'],
    ['street_lamp', 'Street lamp', ['spired', 'coiled', 'shafted'], 'medium'],
    ['lava_lamp', 'Lava lamp', ['spired', 'vessel', 'domed'], 'hard'],
    ['lighthouse', 'Lighthouse', ['spired', 'layered'], 'easy'],
    ['windmill', 'Windmill', ['spired', 'winged', 'boxed'], 'easy'],
    ['water_tower', 'Water tower', ['domed', 'legged', 'spired'], 'hard'],
    ['radio_tower', 'Radio tower', ['spired', 'layered', 'legged'], 'medium'],
    ['eiffel_tower', 'Eiffel tower', ['spired', 'legged', 'layered'], 'medium'],
    ['obelisk', 'Obelisk', ['spired', 'boxed'], 'none'],
    ['oil_rig', 'Oil rig', ['spired', 'legged', 'boxed'], 'hard'],
    ['rocket', 'Rocket', ['spired', 'winged', 'looped'], 'easy'],
    ['space_shuttle', 'Space shuttle', ['spired', 'winged'], 'medium'],
    ['castle', 'Castle', ['spired', 'layered', 'boxed'], 'easy'],
    ['church_steeple', 'Church steeple', ['spired', 'boxed'], 'medium'],
    ['pagoda', 'Pagoda', ['layered', 'spired'], 'hard'],
    ['taj_mahal', 'Taj Mahal', ['domed', 'spired', 'boxed'], 'hard'],
    ['pyramid', 'Pyramid', ['spired', 'layered'], 'easy'],
    ['igloo', 'Igloo', ['domed', 'layered'], 'easy'],
    ['circus_tent', 'Circus tent', ['spired', 'layered'], 'medium'],
    ['camping_tent', 'Camping tent', ['spired', 'hinged', 'boxed'], 'none'],
    ['teepee', 'Teepee', ['spired', 'shafted'], 'medium'],
    ['gazebo', 'Gazebo', ['domed', 'layered', 'boxed'], 'hard'],
    ['treehouse', 'Treehouse', ['boxed', 'spoked', 'shafted'], 'hard'],
    ['gingerbread_house', 'Gingerbread house', ['boxed', 'layered', 'spired'], 'hard'],
    ['sailboat', 'Sailboat', ['spired', 'vessel', 'winged'], 'easy'],
    ['pirate_ship', 'Pirate ship', ['vessel', 'winged', 'layered'], 'hard'],
    ['viking_ship', 'Viking ship', ['vessel', 'coiled', 'layered'], 'hard'],
    ['cruise_ship', 'Cruise ship', ['vessel', 'layered', 'boxed'], 'hard'],
    ['aircraft_carrier', 'Aircraft carrier', ['vessel', 'boxed', 'winged'], 'hard'],
    ['submarine', 'Submarine', ['vessel', 'domed', 'looped'], 'medium'],
    ['ice_cream_cone', 'Ice cream cone', ['domed', 'spired'], 'easy'],
    ['popsicle', 'Popsicle', ['domed', 'shafted'], 'none'],
    ['cupcake', 'Cupcake', ['domed', 'vessel', 'layered'], 'easy'],
    ['birthday_cake', 'Birthday cake', ['layered', 'spired'], 'easy'],
    ['wedding_cake', 'Wedding cake', ['layered', 'domed'], 'medium'],
    ['pineapple', 'Pineapple', ['layered', 'spoked', 'looped'], 'easy'],
    ['pine_tree', 'Pine tree', ['spired', 'layered'], 'none'],
    ['oak_tree', 'Oak tree', ['domed', 'shafted'], 'none'],
    ['volcano', 'Volcano', ['spired', 'spoked'], 'easy'],
    ['tornado', 'Tornado', ['coiled', 'spired'], 'easy'],
    ['fountain', 'Fountain', ['layered', 'vessel', 'coiled'], 'hard'],
    ['wishing_well', 'Wishing well', ['vessel', 'domed', 'boxed'], 'hard'],
    ['trophy', 'Trophy', ['vessel', 'looped'], 'easy'],
    ['wine_glass', 'Wine glass', ['vessel', 'shafted'], 'none'],
    ['hourglass', 'Hourglass', ['vessel', 'hinged', 'spired'], 'easy'],
    ['liberty_bell', 'Liberty bell', ['domed', 'coiled'], 'medium'],
    ['crown', 'Crown', ['spired', 'looped'], 'easy'],
    ['wizard_hat', 'Wizard hat', ['spired', 'coiled'], 'medium'],
    ['top_hat', 'Top hat', ['boxed', 'domed'], 'none'],
    ['cowboy_hat', 'Cowboy hat', ['domed', 'coiled'], 'easy'],
    ['chef_hat', 'Chef hat', ['domed', 'layered'], 'medium'],
    ['sombrero', 'Sombrero', ['domed', 'looped'], 'medium'],
    ['lightbulb', 'Lightbulb', ['domed', 'layered', 'looped'], 'easy'],
  ],
  birds_beaks_and_winged_fliers: [
    ['flamingo', 'Flamingo', ['coiled', 'legged'], 'easy'],
    ['swan', 'Swan', ['coiled', 'winged'], 'easy'],
    ['pelican', 'Pelican', ['vessel', 'winged', 'legged'], 'medium'],
    ['toucan', 'Toucan', ['coiled', 'winged'], 'medium'],
    ['parrot', 'Parrot', ['winged', 'coiled', 'layered'], 'medium'],
    ['peacock', 'Peacock', ['spoked', 'legged', 'looped'], 'hard'],
    ['ostrich', 'Ostrich', ['legged', 'shafted'], 'medium'],
    ['penguin', 'Penguin', ['domed', 'winged', 'legged'], 'easy'],
    ['owl', 'Owl', ['looped', 'winged'], 'easy'],
    ['bald_eagle', 'Bald eagle', ['winged', 'hinged', 'legged'], 'medium'],
    ['vulture', 'Vulture', ['winged', 'coiled'], 'hard'],
    ['hummingbird', 'Hummingbird', ['winged', 'spired'], 'hard'],
    ['woodpecker', 'Woodpecker', ['spired', 'winged'], 'hard'],
    ['rooster', 'Rooster', ['spoked', 'legged', 'coiled'], 'medium'],
    ['mallard_duck', 'Mallard duck', ['vessel', 'winged', 'coiled'], 'easy'],
    ['seagull', 'Seagull', ['winged', 'coiled'], 'none'],
    ['stork', 'Stork', ['legged', 'spired'], 'hard'],
    ['kiwi_bird', 'Kiwi bird', ['legged', 'spired'], 'hard'],
    ['turkey', 'Turkey', ['spoked', 'legged', 'looped'], 'medium'],
    ['cassowary', 'Cassowary', ['legged', 'domed', 'spired'], 'hard'],
    ['dodo_bird', 'Dodo bird', ['coiled', 'legged'], 'hard'],
    ['puffin', 'Puffin', ['winged', 'domed', 'legged'], 'hard'],
    ['albatross', 'Albatross', ['winged', 'shafted'], 'hard'],
    ['pterodactyl', 'Pterodactyl', ['winged', 'spired'], 'hard'],
    ['dragon', 'Dragon', ['winged', 'coiled', 'legged'], 'hard'],
    ['griffin', 'Griffin', ['winged', 'legged', 'coiled'], 'hard'],
    ['pegasus', 'Pegasus', ['winged', 'legged'], 'hard'],
    ['angel', 'Angel', ['winged', 'looped'], 'medium'],
    ['phoenix', 'Phoenix', ['winged', 'spoked', 'coiled'], 'hard'],
    ['bat', 'Bat', ['winged', 'spired'], 'easy'],
    ['butterfly', 'Butterfly', ['winged', 'looped'], 'easy'],
    ['luna_moth', 'Luna moth', ['winged', 'spoked', 'looped'], 'hard'],
    ['origami_crane', 'Origami crane', ['winged', 'spired'], 'hard'],
    ['feather_quill', 'Feather quill', ['shafted', 'layered'], 'medium'],
    ['bird_nest', 'Bird nest', ['vessel', 'looped'], 'medium'],
    ['airplane', 'Airplane', ['winged', 'spired'], 'easy'],
    ['biplane', 'Biplane', ['winged', 'layered', 'looped'], 'hard'],
    ['jet_fighter', 'Jet fighter', ['winged', 'spired'], 'medium'],
    ['seaplane', 'Seaplane', ['winged', 'vessel', 'looped'], 'hard'],
    ['hang_glider', 'Hang glider', ['winged', 'spired'], 'medium'],
    ['helicopter', 'Helicopter', ['winged', 'domed', 'shafted'], 'easy'],
    ['chinook_chopper', 'Chinook chopper', ['winged', 'boxed'], 'hard'],
    ['stealth_bomber', 'Stealth bomber', ['winged', 'spired'], 'hard'],
    ['boomerang', 'Boomerang', ['coiled', 'winged'], 'easy'],
    ['paper_airplane', 'Paper airplane', ['winged', 'spired'], 'easy'],
    ['diamond_kite', 'Diamond kite', ['spired', 'coiled'], 'easy'],
    ['paraglider', 'Paraglider', ['domed', 'winged', 'coiled'], 'hard'],
    ['weather_vane', 'Weather vane', ['spoked', 'spired', 'shafted'], 'hard'],
    ['windsock', 'Windsock', ['shafted', 'layered'], 'medium'],
    ['anchor', 'Anchor', ['coiled', 'shafted'], 'easy'],
    ['banana', 'Banana', ['coiled', 'spired'], 'none'],
    ['croissant', 'Croissant', ['coiled', 'layered'], 'medium'],
    ['canoe', 'Canoe', ['vessel', 'coiled'], 'easy'],
    ['flying_carpet', 'Flying carpet', ['coiled', 'boxed'], 'hard'],
    ['gondola_boat', 'Gondola boat', ['vessel', 'coiled'], 'hard'],
    ['hammock', 'Hammock', ['coiled', 'vessel'], 'medium'],
    ['crescent_moon', 'Crescent moon', ['coiled', 'spired'], 'none'],
    ['rainbow', 'Rainbow', ['coiled', 'layered'], 'none'],
    ['roller_coaster', 'Roller coaster', ['coiled', 'layered'], 'hard'],
    ['suspension_bridge', 'Suspension bridge', ['spired', 'coiled', 'layered'], 'hard'],
  ],
  appliances_boxes_and_gadgets: [
    ['camera', 'Camera', ['boxed', 'looped'], 'easy'],
    ['polaroid_camera', 'Polaroid camera', ['boxed', 'layered'], 'hard'],
    ['film_camcorder', 'Film camcorder', ['boxed', 'looped'], 'hard'],
    ['television', 'Television', ['boxed', 'spoked'], 'easy'],
    ['arcade_cabinet', 'Arcade cabinet', ['boxed', 'spired'], 'hard'],
    ['pinball_machine', 'Pinball machine', ['boxed', 'legged'], 'hard'],
    ['slot_machine', 'Slot machine', ['boxed', 'shafted'], 'hard'],
    ['jukebox', 'Jukebox', ['domed', 'boxed', 'layered'], 'hard'],
    ['gumball_machine', 'Gumball machine', ['looped', 'vessel'], 'medium'],
    ['vending_machine', 'Vending machine', ['boxed', 'layered'], 'hard'],
    ['atm_machine', 'ATM machine', ['boxed', 'layered'], 'hard'],
    ['cash_register', 'Cash register', ['boxed', 'layered'], 'hard'],
    ['washing_machine', 'Washing machine', ['boxed', 'looped'], 'medium'],
    ['microwave', 'Microwave', ['boxed', 'hinged', 'looped'], 'medium'],
    ['toaster', 'Toaster', ['boxed', 'layered'], 'easy'],
    ['waffle_iron', 'Waffle iron', ['hinged', 'layered', 'boxed'], 'hard'],
    ['blender', 'Blender', ['vessel', 'boxed', 'domed'], 'medium'],
    ['stand_mixer', 'Stand mixer', ['hinged', 'vessel', 'domed'], 'hard'],
    ['espresso_machine', 'Espresso machine', ['boxed', 'vessel'], 'hard'],
    ['teapot', 'Teapot', ['vessel', 'coiled', 'domed'], 'easy'],
    ['coffee_grinder', 'Coffee grinder', ['boxed', 'shafted'], 'hard'],
    ['refrigerator', 'Refrigerator', ['boxed', 'hinged', 'layered'], 'easy'],
    ['kitchen_stove', 'Kitchen stove', ['boxed', 'looped'], 'medium'],
    ['cast_iron_radiator', 'Cast iron radiator', ['boxed', 'layered'], 'hard'],
    ['typewriter', 'Typewriter', ['boxed', 'layered'], 'hard'],
    ['laptop', 'Laptop', ['boxed', 'hinged', 'layered'], 'easy'],
    ['desktop_monitor', 'Desktop monitor', ['boxed', 'shafted'], 'none'],
    ['computer_keyboard', 'Computer keyboard', ['boxed', 'layered'], 'medium'],
    ['calculator', 'Calculator', ['boxed', 'layered'], 'easy'],
    ['abacus', 'Abacus', ['boxed', 'layered', 'looped'], 'hard'],
    ['handheld_console', 'Handheld console', ['boxed', 'looped'], 'medium'],
    ['walkie_talkie', 'Walkie talkie', ['boxed', 'shafted'], 'medium'],
    ['rotary_phone', 'Rotary phone', ['looped', 'coiled'], 'hard'],
    ['transistor_radio', 'Transistor radio', ['boxed', 'shafted'], 'medium'],
    ['gramophone', 'Gramophone', ['vessel', 'boxed', 'coiled'], 'hard'],
    ['accordion', 'Accordion', ['boxed', 'layered'], 'hard'],
    ['grand_piano', 'Grand piano', ['legged', 'layered', 'boxed'], 'hard'],
    ['drum_kit', 'Drum kit', ['looped', 'legged'], 'hard'],
    ['xylophone', 'Xylophone', ['layered', 'shafted'], 'medium'],
    ['metronome', 'Metronome', ['spired', 'shafted'], 'hard'],
    ['treasure_chest', 'Treasure chest', ['boxed', 'domed'], 'easy'],
    ['briefcase', 'Briefcase', ['boxed', 'looped'], 'none'],
    ['rolling_suitcase', 'Rolling suitcase', ['boxed', 'looped'], 'medium'],
    ['backpack', 'Backpack', ['domed', 'looped'], 'easy'],
    ['mailbox', 'Mailbox', ['domed', 'shafted'], 'easy'],
    ['fire_hydrant', 'Fire hydrant', ['domed', 'boxed'], 'easy'],
    ['fire_extinguisher', 'Fire extinguisher', ['vessel', 'hinged', 'shafted'], 'medium'],
    ['gas_pump', 'Gas pump', ['boxed', 'coiled'], 'hard'],
    ['parking_meter', 'Parking meter', ['domed', 'shafted'], 'medium'],
    ['traffic_light', 'Traffic light', ['boxed', 'looped'], 'easy'],
    ['safe_vault', 'Safe vault', ['boxed', 'spoked', 'looped'], 'medium'],
    ['birdhouse', 'Birdhouse', ['boxed', 'spired'], 'easy'],
    ['birdcage', 'Birdcage', ['domed', 'layered'], 'medium'],
    ['aquarium', 'Aquarium', ['boxed', 'vessel', 'coiled'], 'medium'],
    ['cuckoo_clock', 'Cuckoo clock', ['boxed', 'spired'], 'hard'],
    ['grandfather_clock', 'Grandfather clock', ['boxed', 'spired'], 'hard'],
    ['alarm_clock', 'Alarm clock', ['looped', 'domed'], 'easy'],
    ['pocket_watch', 'Pocket watch', ['looped', 'coiled'], 'medium'],
    ['microscope', 'Microscope', ['coiled', 'shafted'], 'hard'],
    ['sewing_machine', 'Sewing machine', ['coiled', 'boxed'], 'hard'],
  ],
  quadrupeds_dinosaurs_and_beasts: [
    ['giraffe', 'Giraffe', ['legged', 'shafted'], 'easy'],
    ['elephant', 'Elephant', ['legged', 'coiled'], 'easy'],
    ['woolly_mammoth', 'Woolly mammoth', ['legged', 'coiled', 'spired'], 'hard'],
    ['rhinoceros', 'Rhinoceros', ['legged', 'spired'], 'medium'],
    ['hippopotamus', 'Hippopotamus', ['legged', 'domed'], 'medium'],
    ['camel', 'Camel', ['legged', 'domed'], 'easy'],
    ['llama', 'Llama', ['legged', 'shafted'], 'medium'],
    ['kangaroo', 'Kangaroo', ['legged', 'coiled'], 'easy'],
    ['koala', 'Koala', ['looped', 'legged'], 'medium'],
    ['panda', 'Panda', ['looped', 'legged'], 'easy'],
    ['bear', 'Bear', ['legged', 'domed', 'looped'], 'easy'],
    ['lion', 'Lion', ['spoked', 'legged', 'looped'], 'easy'],
    ['tiger', 'Tiger', ['layered', 'legged'], 'medium'],
    ['howling_wolf', 'Howling wolf', ['legged', 'spired'], 'medium'],
    ['fox', 'Fox', ['legged', 'spired'], 'easy'],
    ['zebra', 'Zebra', ['layered', 'legged'], 'medium'],
    ['horse', 'Horse', ['legged', 'coiled'], 'medium'],
    ['unicorn', 'Unicorn', ['legged', 'spired'], 'easy'],
    ['centaur', 'Centaur', ['legged', 'shafted'], 'hard'],
    ['donkey', 'Donkey', ['legged', 'spired'], 'medium'],
    ['dairy_cow', 'Dairy cow', ['legged', 'boxed'], 'easy'],
    ['charging_bull', 'Charging bull', ['legged', 'coiled'], 'hard'],
    ['bison', 'Bison', ['legged', 'domed', 'coiled'], 'hard'],
    ['moose', 'Moose', ['legged', 'spoked', 'spired'], 'medium'],
    ['reindeer', 'Reindeer', ['legged', 'spoked', 'spired'], 'medium'],
    ['mountain_goat', 'Mountain goat', ['legged', 'spired'], 'hard'],
    ['bighorn_sheep', 'Bighorn sheep', ['legged', 'coiled'], 'hard'],
    ['pig', 'Pig', ['legged', 'coiled'], 'easy'],
    ['wild_boar', 'Wild boar', ['legged', 'spired'], 'hard'],
    ['squirrel', 'Squirrel', ['coiled', 'legged'], 'easy'],
    ['raccoon', 'Raccoon', ['layered', 'legged'], 'medium'],
    ['beaver', 'Beaver', ['legged', 'winged', 'layered'], 'medium'],
    ['river_otter', 'River otter', ['coiled', 'legged'], 'hard'],
    ['platypus', 'Platypus', ['vessel', 'legged', 'winged'], 'hard'],
    ['hedgehog', 'Hedgehog', ['spoked', 'domed', 'spired'], 'easy'],
    ['porcupine', 'Porcupine', ['spoked', 'spired'], 'hard'],
    ['armadillo', 'Armadillo', ['layered', 'domed', 'coiled'], 'hard'],
    ['anteater', 'Anteater', ['coiled', 'legged'], 'hard'],
    ['sloth', 'Sloth', ['coiled', 'legged'], 'medium'],
    ['monkey', 'Monkey', ['coiled', 'legged'], 'easy'],
    ['gorilla', 'Gorilla', ['domed', 'legged', 'boxed'], 'medium'],
    ['rabbit', 'Rabbit', ['looped', 'spired'], 'easy'],
    ['dachshund', 'Dachshund', ['shafted', 'legged'], 'medium'],
    ['poodle', 'Poodle', ['looped', 'legged'], 'hard'],
    ['house_cat', 'House cat', ['spired', 'coiled'], 'none'],
    ['field_mouse', 'Field mouse', ['coiled', 'spired'], 'none'],
    ['frog', 'Frog', ['legged', 'looped'], 'easy'],
    ['salamander', 'Salamander', ['coiled', 'legged'], 'hard'],
    ['chameleon', 'Chameleon', ['coiled', 'legged'], 'hard'],
    ['iguana', 'Iguana', ['spoked', 'legged', 'coiled'], 'hard'],
    ['crocodile', 'Crocodile', ['layered', 'hinged', 'spired'], 'easy'],
    ['tortoise', 'Tortoise', ['domed', 'legged'], 'medium'],
    ['trex', 'T-Rex', ['legged', 'hinged', 'spired'], 'medium'],
    ['triceratops', 'Triceratops', ['spired', 'legged'], 'hard'],
    ['stegosaurus', 'Stegosaurus', ['layered', 'legged'], 'hard'],
    ['brontosaurus', 'Brontosaurus', ['coiled', 'legged'], 'medium'],
    ['ankylosaurus', 'Ankylosaurus', ['spoked', 'domed', 'legged'], 'hard'],
    ['saber_tooth_cat', 'Saber-tooth cat', ['hinged', 'legged', 'spired'], 'hard'],
    ['rocking_horse', 'Rocking horse', ['coiled', 'legged'], 'hard'],
    ['trojan_horse', 'Trojan horse', ['looped', 'legged'], 'hard'],
  ],
  aquatic_serpentine_and_coiled: [
    ['hammerhead_shark', 'Hammerhead shark', ['winged', 'shafted'], 'hard'],
    ['shark', 'Shark', ['winged', 'spired'], 'easy'],
    ['dolphin', 'Dolphin', ['coiled', 'winged'], 'easy'],
    ['periscope', 'Periscope', ['shafted', 'hinged', 'looped'], 'medium'],
    ['whale', 'Whale', ['domed', 'winged', 'coiled'], 'easy'],
    ['narwhal', 'Narwhal', ['spired', 'winged'], 'medium'],
    ['manatee', 'Manatee', ['domed', 'winged', 'coiled'], 'hard'],
    ['walrus', 'Walrus', ['spired', 'domed'], 'medium'],
    ['sea_lion', 'Sea lion', ['coiled', 'winged'], 'medium'],
    ['sea_turtle', 'Sea turtle', ['domed', 'winged', 'layered'], 'easy'],
    ['stingray', 'Stingray', ['winged', 'coiled'], 'medium'],
    ['ocean_wave', 'Ocean wave', ['coiled', 'spired'], 'medium'],
    ['anglerfish', 'Anglerfish', ['hinged', 'looped'], 'hard'],
    ['pufferfish', 'Pufferfish', ['spoked', 'looped'], 'easy'],
    ['swordfish', 'Swordfish', ['spired', 'winged'], 'medium'],
    ['flying_fish', 'Flying fish', ['winged', 'layered'], 'hard'],
    ['clownfish', 'Clownfish', ['layered', 'winged'], 'none'],
    ['koi_fish', 'Koi fish', ['coiled', 'winged'], 'medium'],
    ['piranha', 'Piranha', ['hinged', 'winged', 'spired'], 'hard'],
    ['goldfish_bowl', 'Goldfish bowl', ['vessel', 'looped'], 'medium'],
    ['seahorse', 'Seahorse', ['coiled', 'layered'], 'medium'],
    ['leafy_seadragon', 'Leafy seadragon', ['coiled', 'spoked'], 'hard'],
    ['moray_eel', 'Moray eel', ['coiled', 'hinged'], 'hard'],
    ['oarfish', 'Oarfish', ['coiled', 'shafted'], 'hard'],
    ['nautilus_shell', 'Nautilus shell', ['coiled', 'layered'], 'hard'],
    ['conch_shell', 'Conch shell', ['coiled', 'spired'], 'medium'],
    ['clam_pearl', 'Clam with pearl', ['hinged', 'looped'], 'medium'],
    ['snail', 'Snail', ['coiled', 'domed'], 'easy'],
    ['cobra', 'Cobra', ['coiled', 'domed'], 'medium'],
    ['rattlesnake', 'Rattlesnake', ['coiled', 'layered'], 'medium'],
    ['earthworm', 'Earthworm', ['coiled', 'layered'], 'none'],
    ['mermaid', 'Mermaid', ['coiled', 'winged'], 'hard'],
    ['loch_ness_monster', 'Loch Ness monster', ['coiled', 'domed'], 'hard'],
    ['message_in_bottle', 'Message in bottle', ['vessel', 'shafted'], 'hard'],
    ['lifebuoy', 'Lifebuoy', ['looped', 'layered'], 'easy'],
    ['swim_fins', 'Swim fins', ['winged', 'layered'], 'medium'],
    ['snorkel_mask', 'Snorkel mask', ['looped', 'coiled'], 'medium'],
    ['diving_helmet', 'Diving helmet', ['domed', 'looped'], 'hard'],
    ['surfboard', 'Surfboard', ['spired', 'shafted'], 'none'],
    ['windsurfer', 'Windsurfer', ['spired', 'winged'], 'hard'],
    ['jet_ski', 'Jet ski', ['vessel', 'coiled'], 'hard'],
    ['water_skis', 'Water skis', ['shafted', 'layered'], 'medium'],
    ['fishing_hook', 'Fishing hook', ['coiled', 'spired'], 'none'],
    ['fish_skeleton', 'Fish skeleton', ['layered', 'spoked'], 'medium'],
    ['pretzel', 'Pretzel', ['coiled', 'looped'], 'easy'],
    ['cinnamon_roll', 'Cinnamon roll', ['coiled', 'looped'], 'medium'],
    ['garden_hose', 'Garden hose', ['coiled', 'looped'], 'medium'],
    ['extension_cord', 'Extension cord', ['coiled', 'boxed'], 'hard'],
    ['stethoscope', 'Stethoscope', ['coiled', 'looped'], 'medium'],
    ['lasso_rope', 'Lasso rope', ['looped', 'coiled'], 'medium'],
    ['coil_spring', 'Coil spring', ['coiled', 'layered'], 'none'],
    ['dna_helix', 'DNA helix', ['coiled', 'layered'], 'medium'],
    ['whirlpool', 'Whirlpool', ['coiled', 'vessel'], 'hard'],
    ['water_slide', 'Water slide', ['coiled', 'legged'], 'hard'],
    ['diving_board', 'Diving board', ['shafted', 'layered'], 'medium'],
    ['corkscrew', 'Corkscrew', ['coiled', 'shafted'], 'hard'],
    ['headphones', 'Headphones', ['coiled', 'looped'], 'easy'],
    ['earbuds', 'Earbuds', ['coiled', 'shafted'], 'medium'],
    ['paper_clip', 'Paper clip', ['coiled', 'looped'], 'none'],
    ['spiral_staircase', 'Spiral staircase', ['coiled', 'layered'], 'hard'],
  ],
  tableware_food_and_produce: [
    ['pizza_slice', 'Pizza slice', ['spired', 'looped'], 'easy'],
    ['hamburger', 'Hamburger', ['domed', 'layered'], 'easy'],
    ['hot_dog', 'Hot dog', ['domed', 'shafted'], 'easy'],
    ['taco', 'Taco', ['domed', 'vessel'], 'easy'],
    ['burrito', 'Burrito', ['shafted', 'layered'], 'none'],
    ['club_sandwich', 'Club sandwich', ['boxed', 'layered'], 'medium'],
    ['french_fries', 'French fries', ['vessel', 'spoked', 'boxed'], 'easy'],
    ['onion_rings', 'Onion rings', ['looped', 'layered'], 'none'],
    ['drumstick', 'Fried drumstick', ['shafted', 'domed'], 'none'],
    ['t_bone_steak', 'T-bone steak', ['looped', 'shafted'], 'medium'],
    ['sushi', 'Sushi', ['boxed', 'layered'], 'medium'],
    ['bento_box', 'Bento box', ['boxed', 'layered'], 'hard'],
    ['ramen_bowl', 'Ramen bowl', ['vessel', 'coiled'], 'hard'],
    ['dumpling', 'Dumpling', ['domed', 'layered'], 'medium'],
    ['fortune_cookie', 'Fortune cookie', ['hinged', 'coiled'], 'medium'],
    ['donut', 'Donut', ['looped', 'domed'], 'none'],
    ['pancake_stack', 'Pancake stack', ['layered', 'domed'], 'easy'],
    ['belgian_waffle', 'Belgian waffle', ['boxed', 'layered'], 'medium'],
    ['gingerbread_man', 'Gingerbread man', ['legged', 'looped'], 'easy'],
    ['candy_cane', 'Candy cane', ['coiled', 'shafted'], 'easy'],
    ['lollipop', 'Lollipop', ['looped', 'shafted'], 'none'],
    ['wrapped_candy', 'Wrapped candy', ['looped', 'winged'], 'none'],
    ['chocolate_bar', 'Chocolate bar', ['boxed', 'layered'], 'none'],
    ['popcorn_bucket', 'Popcorn bucket', ['vessel', 'layered'], 'medium'],
    ['soda_can', 'Soda can', ['vessel', 'looped'], 'none'],
    ['milk_carton', 'Milk carton', ['boxed', 'spired'], 'easy'],
    ['juice_box', 'Juice box', ['boxed', 'shafted'], 'medium'],
    ['coffee_mug', 'Coffee mug', ['vessel', 'looped'], 'none'],
    ['teacup_saucer', 'Teacup and saucer', ['vessel', 'looped'], 'medium'],
    ['thermos_flask', 'Thermos flask', ['vessel', 'domed'], 'medium'],
    ['martini_glass', 'Martini glass', ['spired', 'vessel'], 'easy'],
    ['beer_stein', 'Beer stein', ['vessel', 'hinged', 'boxed'], 'hard'],
    ['baby_bottle', 'Baby bottle', ['vessel', 'spired'], 'medium'],
    ['salt_shaker', 'Salt shaker', ['vessel', 'domed'], 'none'],
    ['pepper_mill', 'Pepper mill', ['shafted', 'domed'], 'hard'],
    ['ketchup_bottle', 'Ketchup bottle', ['vessel', 'spired'], 'medium'],
    ['honey_jar', 'Honey jar', ['vessel', 'layered'], 'medium'],
    ['fried_egg', 'Fried egg', ['looped', 'coiled'], 'none'],
    ['cracked_egg', 'Cracked egg', ['domed', 'spired'], 'easy'],
    ['cheese_wedge', 'Cheese wedge', ['spired', 'looped'], 'easy'],
    ['bread_loaf', 'Bread loaf', ['domed', 'boxed'], 'none'],
    ['baguette', 'Baguette', ['shafted', 'layered'], 'none'],
    ['apple', 'Apple', ['looped', 'domed'], 'none'],
    ['pear', 'Pear', ['domed', 'looped'], 'none'],
    ['strawberry', 'Strawberry', ['spired', 'spoked'], 'easy'],
    ['cherries', 'Cherries', ['looped', 'shafted'], 'easy'],
    ['watermelon_slice', 'Watermelon slice', ['domed', 'spired'], 'easy'],
    ['grape_bunch', 'Grape bunch', ['looped', 'layered'], 'easy'],
    ['lemon_half', 'Lemon half', ['looped', 'spoked'], 'none'],
    ['avocado', 'Avocado', ['looped', 'domed'], 'easy'],
    ['corn_cob', 'Corn cob', ['layered', 'shafted'], 'medium'],
    ['carrot', 'Carrot', ['spired', 'spoked'], 'easy'],
    ['broccoli', 'Broccoli', ['domed', 'spoked', 'shafted'], 'easy'],
    ['chili_pepper', 'Chili pepper', ['coiled', 'spired'], 'easy'],
    ['garlic_bulb', 'Garlic bulb', ['domed', 'spired'], 'medium'],
    ['acorn', 'Acorn', ['domed', 'spired'], 'easy'],
    ['pumpkin', 'Pumpkin', ['looped', 'layered'], 'easy'],
    ['peanut', 'Peanut', ['looped', 'layered'], 'none'],
    ['artichoke', 'Artichoke', ['layered', 'spired'], 'hard'],
    ['coconut_drink', 'Coconut drink', ['looped', 'shafted'], 'medium'],
  ],
  workshop_apparel_and_props: [
    ['swiss_army_knife', 'Swiss army knife', ['hinged', 'spoked', 'boxed'], 'hard'],
    ['compass', 'Compass', ['looped', 'spired'], 'easy'],
    ['sextant', 'Sextant', ['spired', 'hinged', 'looped'], 'hard'],
    ['telescope', 'Telescope', ['shafted', 'legged'], 'easy'],
    ['padlock', 'Padlock', ['looped', 'boxed'], 'easy'],
    ['skeleton_key', 'Skeleton key', ['looped', 'shafted'], 'easy'],
    ['door_hinge', 'Door hinge', ['boxed', 'hinged', 'looped'], 'none'],
    ['wrench', 'Wrench', ['shafted', 'hinged'], 'easy'],
    ['crowbar', 'Crowbar', ['shafted', 'coiled'], 'medium'],
    ['calipers', 'Calipers', ['hinged', 'spired'], 'hard'],
    ['c_clamp', 'C-clamp', ['coiled', 'hinged'], 'hard'],
    ['hand_saw', 'Hand saw', ['layered', 'boxed'], 'easy'],
    ['circular_saw', 'Circular saw', ['spoked', 'looped'], 'hard'],
    ['power_drill', 'Power drill', ['hinged', 'spired', 'shafted'], 'medium'],
    ['screwdriver', 'Screwdriver', ['shafted', 'spired'], 'none'],
    ['paint_roller', 'Paint roller', ['shafted', 'boxed'], 'medium'],
    ['paintbrush', 'Paintbrush', ['shafted', 'spired'], 'none'],
    ['stapler', 'Stapler', ['hinged', 'boxed', 'layered'], 'medium'],
    ['tape_dispenser', 'Tape dispenser', ['looped', 'boxed'], 'hard'],
    ['anvil', 'Anvil', ['spired', 'boxed'], 'medium'],
    ['horseshoe', 'Horseshoe', ['coiled', 'looped'], 'none'],
    ['horseshoe_magnet', 'Horseshoe magnet', ['coiled', 'boxed'], 'easy'],
    ['gear_cog', 'Gear cog', ['spoked', 'looped'], 'easy'],
    ['chain_links', 'Chain links', ['looped', 'layered'], 'medium'],
    ['nut_and_bolt', 'Nut and bolt', ['layered', 'shafted'], 'medium'],
    ['bear_trap', 'Bear trap', ['hinged', 'spired', 'looped'], 'hard'],
    ['mouse_trap', 'Mouse trap', ['hinged', 'boxed', 'coiled'], 'hard'],
    ['guillotine', 'Guillotine', ['boxed', 'spired'], 'hard'],
    ['balance_scale', 'Balance scale', ['hinged', 'vessel', 'shafted'], 'hard'],
    ['desk_globe', 'Desk globe', ['looped', 'coiled'], 'medium'],
    ['lantern', 'Lantern', ['vessel', 'looped'], 'easy'],
    ['candlestick', 'Candlestick', ['spired', 'shafted'], 'easy'],
    ['matchbox', 'Matchbox', ['boxed', 'shafted'], 'medium'],
    ['flip_lighter', 'Flip lighter', ['boxed', 'hinged', 'coiled'], 'medium'],
    ['ladder', 'Ladder', ['layered', 'shafted'], 'easy'],
    ['step_stool', 'Step stool', ['layered', 'legged'], 'medium'],
    ['park_bench', 'Park bench', ['layered', 'legged'], 'medium'],
    ['rocking_chair', 'Rocking chair', ['coiled', 'legged'], 'hard'],
    ['swivel_chair', 'Swivel chair', ['looped', 'legged'], 'hard'],
    ['clawfoot_tub', 'Clawfoot tub', ['vessel', 'legged', 'coiled'], 'hard'],
    ['sink_faucet', 'Sink faucet', ['coiled', 'vessel'], 'medium'],
    ['coat_hanger', 'Coat hanger', ['spired', 'coiled'], 'none'],
    ['clothespin', 'Clothespin', ['hinged', 'shafted'], 'medium'],
    ['safety_pin', 'Safety pin', ['coiled', 'hinged'], 'medium'],
    ['thread_spool', 'Thread spool', ['layered', 'shafted'], 'medium'],
    ['zipper', 'Zipper', ['layered', 'hinged'], 'medium'],
    ['bowtie', 'Bowtie', ['winged', 'hinged', 'looped'], 'easy'],
    ['necktie', 'Necktie', ['spired', 'shafted'], 'none'],
    ['sneaker', 'Sneaker', ['layered', 'coiled'], 'easy'],
    ['cowboy_boot', 'Cowboy boot', ['legged', 'spoked'], 'medium'],
    ['high_heel', 'High heel', ['spired', 'coiled'], 'medium'],
    ['flip_flops', 'Flip flops', ['looped', 'hinged'], 'none'],
    ['winter_mitten', 'Winter mitten', ['domed', 'hinged', 'coiled'], 'none'],
    ['baseball_glove', 'Baseball glove', ['spoked', 'vessel', 'legged'], 'medium'],
    ['knight_helmet', 'Knight helmet', ['domed', 'hinged', 'layered'], 'hard'],
    ['gas_mask', 'Gas mask', ['looped', 'vessel'], 'hard'],
    ['astronaut', 'Astronaut', ['domed', 'legged'], 'hard'],
    ['scarecrow', 'Scarecrow', ['spoked', 'legged'], 'hard'],
    ['snowman', 'Snowman', ['looped', 'layered'], 'easy'],
    ['jack_o_lantern', 'Jack-o-lantern', ['looped', 'hinged'], 'easy'],
  ],
};

function expandCatalog(): SketchWord[] {
  const list: SketchWord[] = [];
  const clusterEntries = Object.entries(RAW_CLUSTER_CATALOG) as Array<[
    VisualClusterId,
    readonly RawMorphologyRow[],
  ]>;
  for (const [cluster, rows] of clusterEntries) {
    for (const [id, label, shapeTags, promptTier] of rows) {
      list.push({ id, label, cluster, shapeTags, promptTier });
    }
  }
  return list;
}

export const VISUAL_CATALOG: readonly SketchWord[] = expandCatalog();

export const WORD_BY_ID: Readonly<Record<string, SketchWord>> = Object.fromEntries(
  VISUAL_CATALOG.map((word) => [word.id, word]),
);

export function hashStringSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function countSharedShapeTags(
  a: readonly ShapeTag[],
  bSet: ReadonlySet<ShapeTag>,
): number {
  let count = 0;
  for (const tag of a) {
    if (bSet.has(tag)) count += 1;
  }
  return count;
}

/**
 * Builds a dynamic 255-option pool centered on the target word's silhouette:
 * - Easy:   1 target + 10 very similar + 40 similar + 202 generic + 2 abstentions = 255
 * - Medium: 1 target + 50 very similar + 100 similar + 102 generic + 2 abstentions = 255
 * - Hard:   1 target + 55 very similar + 130 similar + 67 generic + 2 abstentions = 255
 * Sorts all 255 option keys strictly alphabetically so target order never leaks.
 */
export function composeTargetOptionPool(
  target: SketchWord,
  difficulty: DifficultyId,
  rng?: () => number,
): PoolComposition {
  const spec = DIFFICULTY_SPECS[difficulty];
  const rand =
    rng ?? createSeededRng(hashStringSeed(`${target.id}:${difficulty}`));
  const targetTags = new Set<ShapeTag>(target.shapeTags);

  const sameCluster: SketchWord[] = [];
  const overlapByCount = new Map<number, SketchWord[]>();
  const genericZeroOverlap: SketchWord[] = [];

  for (const word of VISUAL_CATALOG) {
    if (word.id === target.id) continue;
    if (word.cluster === target.cluster) {
      sameCluster.push(word);
      continue;
    }
    const shared = countSharedShapeTags(word.shapeTags, targetTags);
    if (shared > 0) {
      const group = overlapByCount.get(shared);
      if (group) group.push(word);
      else overlapByCount.set(shared, [word]);
    } else {
      genericZeroOverlap.push(word);
    }
  }

  const shuffledTwins = shuffleWithRng(sameCluster, rand);
  const rankedSimilar: SketchWord[] = [];
  const overlapCountsDesc = [...overlapByCount.keys()].sort((a, b) => b - a);
  for (const score of overlapCountsDesc) {
    const bucket = overlapByCount.get(score) ?? [];
    rankedSimilar.push(...shuffleWithRng(bucket, rand));
  }
  const shuffledGeneric = shuffleWithRng(genericZeroOverlap, rand);

  const verySimilarIds = shuffledTwins
    .slice(0, spec.verySimilarCount)
    .map((w) => w.id);
  const similarIds = rankedSimilar
    .slice(0, spec.similarCount)
    .map((w) => w.id);
  const genericIds = shuffledGeneric
    .slice(0, spec.genericCount)
    .map((w) => w.id);

  const nounIds = [
    target.id,
    ...verySimilarIds,
    ...similarIds,
    ...genericIds,
  ];

  const optionKeys = [
    ...nounIds,
    UNFINISHED_LINES_KEY,
    RANDOM_SCRIBBLE_KEY,
  ].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    target,
    difficulty,
    verySimilarIds,
    similarIds,
    genericIds,
    nounIds,
    optionKeys,
  };
}
