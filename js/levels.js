// js/levels.js
// Levels, Paths, Waves, and Endless configurations for Science Tower Defense

const GAME_WIDTH = 900;
const GAME_HEIGHT = 550;

const LEVEL_DATA = [
    // ===================== LEVEL 1: THE LAB =====================
    {
        id: 0,
        name: "Level 1: The Laboratory",
        description: "Defeat basic misconceptions inside the Physics Lab. Keep science clean!",
        theme: "lab",
        bgColor: "#0f111a",
        pathColor: "#22273a",
        accentColor: "#00ffff",
        waypoints: [
            { x: -20, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 280 },
            { x: 420, y: 280 },
            { x: 420, y: 120 },
            { x: 650, y: 120 },
            { x: 650, y: 390 },
            { x: 820, y: 390 },
            { x: 820, y: 230 },
            { x: 920, y: 230 }
        ],
        buildSpots: [
            { x: 80,  y: 55  }, { x: 310, y: 55  }, { x: 310, y: 200 },
            { x: 110, y: 350 }, { x: 530, y: 55  }, { x: 530, y: 200 },
            { x: 530, y: 350 }, { x: 760, y: 55  }, { x: 760, y: 470 },
            { x: 870, y: 130 }, { x: 110, y: 200 }, { x: 420, y: 390 }
        ],
        waves: [
            [{ type: "flatearth", count: 7, delay: 1500 }],
            [{ type: "flatearth", count: 9, delay: 1200 }, { type: "phlogiston", count: 4, delay: 1400 }],
            [{ type: "phlogiston", count: 10, delay: 900 }, { type: "spontaneous", count: 5, delay: 1800 }],
            [{ type: "flatearth", count: 12, delay: 900 }, { type: "spontaneous", count: 8, delay: 1300 }],
            [{ type: "phlogiston", count: 12, delay: 700 }, { type: "geocentric", count: 5, delay: 1500 }],
            [{ type: "flatearth", count: 15, delay: 700 }, { type: "phlogiston", count: 12, delay: 600 }, { type: "spontaneous", count: 10, delay: 900 }]
        ],
        scenery: [
            { type: "beaker", x: 90, y: 190, r: 22, color: "rgba(0,255,255,0.15)" },
            { type: "beaker", x: 540, y: 300, r: 18, color: "rgba(255,0,255,0.12)" },
            { type: "atoms", x: 430, y: 400 }
        ]
    },

    // ===================== LEVEL 2: PRIMORDIAL SWAMP =====================
    {
        id: 1,
        name: "Level 2: Primordial Swamp",
        description: "Spontaneous generation myths rise from the murk. Push them back!",
        theme: "swamp",
        bgColor: "#080e07",
        pathColor: "#1a2b14",
        accentColor: "#44ff88",
        waypoints: [
            { x: -20, y: 450 },
            { x: 150, y: 450 },
            { x: 150, y: 320 },
            { x: 380, y: 320 },
            { x: 380, y: 120 },
            { x: 580, y: 120 },
            { x: 580, y: 380 },
            { x: 750, y: 380 },
            { x: 750, y: 200 },
            { x: 920, y: 200 }
        ],
        buildSpots: [
            { x: 80,  y: 380 }, { x: 80,  y: 510 }, { x: 260, y: 240 },
            { x: 260, y: 420 }, { x: 480, y: 55  }, { x: 480, y: 220 },
            { x: 480, y: 460 }, { x: 670, y: 460 }, { x: 670, y: 120 },
            { x: 840, y: 130 }, { x: 840, y: 300 }, { x: 380, y: 440 }
        ],
        waves: [
            [{ type: "spontaneous", count: 8, delay: 1400 }],
            [{ type: "spontaneous", count: 10, delay: 1100 }, { type: "flatearth", count: 6, delay: 1200 }],
            [{ type: "flatearth", count: 12, delay: 900 }, { type: "phlogiston", count: 6, delay: 1100 }],
            [{ type: "spontaneous", count: 14, delay: 800 }, { type: "alchemy", count: 4, delay: 2000 }],
            [{ type: "phlogiston", count: 12, delay: 700 }, { type: "alchemy", count: 7, delay: 1600 }, { type: "geocentric", count: 5, delay: 1400 }],
            [{ type: "spontaneous", count: 15, delay: 600 }, { type: "alchemy", count: 10, delay: 1200 }, { type: "geocentric", count: 8, delay: 1000 }],
            [{ type: "flatearth", count: 18, delay: 600 }, { type: "phlogiston", count: 14, delay: 600 }, { type: "alchemy", count: 12, delay: 900 }, { type: "spontaneous", count: 16, delay: 700 }]
        ],
        scenery: [
            { type: "tree", x: 480, y: 250, r: 30 },
            { type: "tree", x: 280, y: 420, r: 35 },
            { type: "dna", x: 680, y: 300 }
        ]
    },

    // ===================== LEVEL 3: VOLCANIC RIFT =====================
    {
        id: 2,
        name: "Level 3: Volcanic Rift",
        description: "Phlogiston theories erupt from the magma. Extinguish them with real chemistry!",
        theme: "volcanic",
        bgColor: "#120501",
        pathColor: "#2d1008",
        accentColor: "#ff6600",
        waypoints: [
            { x: -20, y: 200 },
            { x: 130, y: 200 },
            { x: 130, y: 420 },
            { x: 320, y: 420 },
            { x: 320, y: 120 },
            { x: 520, y: 120 },
            { x: 520, y: 300 },
            { x: 700, y: 300 },
            { x: 700, y: 460 },
            { x: 870, y: 460 },
            { x: 870, y: 260 },
            { x: 920, y: 260 }
        ],
        buildSpots: [
            { x: 60,  y: 120 }, { x: 220, y: 120 }, { x: 220, y: 500 },
            { x: 420, y: 55  }, { x: 420, y: 220 }, { x: 420, y: 500 },
            { x: 610, y: 200 }, { x: 610, y: 400 }, { x: 780, y: 200 },
            { x: 780, y: 380 }, { x: 870, y: 380 }, { x: 130, y: 310 }
        ],
        waves: [
            [{ type: "phlogiston", count: 10, delay: 1200 }],
            [{ type: "phlogiston", count: 12, delay: 1000 }, { type: "spontaneous", count: 7, delay: 1300 }],
            [{ type: "flatearth", count: 14, delay: 900 }, { type: "phlogiston", count: 10, delay: 800 }],
            [{ type: "alchemy", count: 8, delay: 1400 }, { type: "perpetual", count: 6, delay: 1500 }, { type: "phlogiston", count: 12, delay: 700 }],
            [{ type: "geocentric", count: 8, delay: 1100 }, { type: "alchemy", count: 10, delay: 1100 }, { type: "perpetual", count: 8, delay: 1200 }],
            [{ type: "phlogiston", count: 16, delay: 600 }, { type: "alchemy", count: 12, delay: 900 }, { type: "geocentric", count: 10, delay: 1000 }],
            [{ type: "flatearth", count: 20, delay: 500 }, { type: "phlogiston", count: 18, delay: 500 }, { type: "perpetual", count: 12, delay: 800 }, { type: "alchemy", count: 14, delay: 800 }]
        ],
        scenery: [
            { type: "beaker", x: 430, y: 400, r: 28, color: "rgba(255,80,0,0.18)" },
            { type: "atoms", x: 720, y: 180 }
        ]
    },

    // ===================== LEVEL 4: FROZEN TUNDRA =====================
    {
        id: 3,
        name: "Level 4: Frozen Tundra",
        description: "Caloric theory freezes science in its tracks. Melt it with thermodynamics!",
        theme: "tundra",
        bgColor: "#07101a",
        pathColor: "#1a2d3d",
        accentColor: "#88ddff",
        waypoints: [
            { x: 920, y: 80  },
            { x: 760, y: 80  },
            { x: 760, y: 260 },
            { x: 560, y: 260 },
            { x: 560, y: 460 },
            { x: 340, y: 460 },
            { x: 340, y: 300 },
            { x: 160, y: 300 },
            { x: 160, y: 140 },
            { x: -20, y: 140 }
        ],
        buildSpots: [
            { x: 860, y: 175 }, { x: 650, y: 175 }, { x: 650, y: 360 },
            { x: 450, y: 360 }, { x: 450, y: 510 }, { x: 240, y: 510 },
            { x: 240, y: 380 }, { x: 80,  y: 380 }, { x: 80,  y: 220 },
            { x: 270, y: 200 }, { x: 860, y: 180 }, { x: 560, y: 100 }
        ],
        waves: [
            [{ type: "caloric", count: 8, delay: 1400 }],
            [{ type: "caloric", count: 10, delay: 1200 }, { type: "phlogiston", count: 7, delay: 1100 }],
            [{ type: "flatearth", count: 12, delay: 900 }, { type: "caloric", count: 10, delay: 1000 }, { type: "spontaneous", count: 6, delay: 1300 }],
            [{ type: "caloric", count: 14, delay: 800 }, { type: "geocentric", count: 8, delay: 1100 }, { type: "perpetual", count: 7, delay: 1300 }],
            [{ type: "alchemy", count: 10, delay: 1000 }, { type: "caloric", count: 14, delay: 700 }, { type: "miasma", count: 5, delay: 1800 }],
            [{ type: "phlogiston", count: 16, delay: 600 }, { type: "caloric", count: 16, delay: 700 }, { type: "miasma", count: 8, delay: 1400 }],
            [{ type: "flatearth", count: 20, delay: 500 }, { type: "caloric", count: 18, delay: 600 }, { type: "miasma", count: 12, delay: 1000 }, { type: "geocentric", count: 12, delay: 800 }]
        ],
        scenery: [
            { type: "beaker", x: 400, y: 170, r: 24, color: "rgba(136,221,255,0.15)" },
            { type: "atoms", x: 200, y: 430 }
        ]
    },

    // ===================== LEVEL 5: GEOCENTRIC OBSERVATORY (MINI-BOSS) =====================
    {
        id: 4,
        name: "Level 5: Geocentric Observatory",
        description: "The Earth does NOT sit at the centre! Defeat the Geocentric Guardian!",
        theme: "observatory",
        bgColor: "#090514",
        pathColor: "#1a0f2a",
        accentColor: "#ffcc00",
        waypoints: [
            { x: -20, y: 275 },
            { x: 120, y: 275 },
            { x: 120, y: 100 },
            { x: 320, y: 100 },
            { x: 320, y: 450 },
            { x: 520, y: 450 },
            { x: 520, y: 160 },
            { x: 700, y: 160 },
            { x: 700, y: 400 },
            { x: 850, y: 400 },
            { x: 850, y: 200 },
            { x: 920, y: 200 }
        ],
        buildSpots: [
            { x: 60,  y: 175 }, { x: 220, y: 175 }, { x: 220, y: 370 },
            { x: 420, y: 55  }, { x: 420, y: 275 }, { x: 420, y: 510 },
            { x: 610, y: 300 }, { x: 610, y: 60  }, { x: 790, y: 60  },
            { x: 790, y: 280 }, { x: 790, y: 490 }, { x: 60,  y: 370 }
        ],
        waves: [
            [{ type: "geocentric", count: 12, delay: 1200 }],
            [{ type: "geocentric", count: 14, delay: 1000 }, { type: "flatearth", count: 10, delay: 900 }],
            [{ type: "phlogiston", count: 14, delay: 800 }, { type: "geocentric", count: 12, delay: 900 }, { type: "spontaneous", count: 10, delay: 1000 }],
            [{ type: "alchemy", count: 12, delay: 900 }, { type: "caloric", count: 10, delay: 1000 }, { type: "perpetual", count: 8, delay: 1100 }],
            [{ type: "geocentric", count: 18, delay: 700 }, { type: "miasma", count: 8, delay: 1300 }, { type: "caloric", count: 14, delay: 800 }],
            [{ type: "flatearth", count: 22, delay: 600 }, { type: "geocentric", count: 20, delay: 700 }, { type: "phlogiston", count: 16, delay: 700 }, { type: "alchemy", count: 12, delay: 900 }],
            [{ type: "geocentric", count: 25, delay: 600 }, { type: "caloric", count: 18, delay: 700 }, { type: "miasma", count: 12, delay: 1000 }, { type: "boss_geo", count: 1, delay: 5000 }]
        ],
        scenery: [
            { type: "blackhole", x: 450, y: 275 },
            { type: "atoms", x: 200, y: 430 }
        ]
    },

    // ===================== LEVEL 6: ALCHEMIST'S WORKSHOP =====================
    {
        id: 5,
        name: "Level 6: Alchemist's Workshop",
        description: "Turn lead myths into golden science — the alchemists won't give up without a fight.",
        theme: "alchemy",
        bgColor: "#100c04",
        pathColor: "#2a1f08",
        accentColor: "#ffaa00",
        waypoints: [
            { x: -20, y: 480 },
            { x: 180, y: 480 },
            { x: 180, y: 340 },
            { x: 60,  y: 340 },
            { x: 60,  y: 160 },
            { x: 280, y: 160 },
            { x: 280, y: 60  },
            { x: 520, y: 60  },
            { x: 520, y: 300 },
            { x: 720, y: 300 },
            { x: 720, y: 100 },
            { x: 920, y: 100 }
        ],
        buildSpots: [
            { x: 280, y: 420 }, { x: 280, y: 260 }, { x: 160, y: 250 },
            { x: 160, y: 80  }, { x: 390, y: 80  }, { x: 390, y: 200 },
            { x: 620, y: 180 }, { x: 620, y: 400 }, { x: 820, y: 200 },
            { x: 820, y: 400 }, { x: 60,  y: 450 }, { x: 520, y: 430 }
        ],
        waves: [
            [{ type: "alchemy", count: 10, delay: 1300 }],
            [{ type: "alchemy", count: 12, delay: 1100 }, { type: "phlogiston", count: 8, delay: 1000 }],
            [{ type: "alchemy", count: 14, delay: 900 }, { type: "flatearth", count: 12, delay: 800 }, { type: "spontaneous", count: 8, delay: 1100 }],
            [{ type: "caloric", count: 12, delay: 900 }, { type: "alchemy", count: 16, delay: 800 }, { type: "miasma", count: 6, delay: 1400 }],
            [{ type: "perpetual", count: 14, delay: 800 }, { type: "alchemy", count: 18, delay: 700 }, { type: "geocentric", count: 10, delay: 1000 }],
            [{ type: "alchemy", count: 20, delay: 600 }, { type: "caloric", count: 16, delay: 700 }, { type: "aether", count: 6, delay: 1600 }],
            [{ type: "flatearth", count: 22, delay: 500 }, { type: "alchemy", count: 20, delay: 600 }, { type: "miasma", count: 14, delay: 900 }],
            [{ type: "alchemy", count: 25, delay: 500 }, { type: "phlogiston", count: 20, delay: 500 }, { type: "aether", count: 10, delay: 1200 }, { type: "caloric", count: 18, delay: 600 }]
        ],
        scenery: [
            { type: "beaker", x: 300, y: 450, r: 26, color: "rgba(255,170,0,0.18)" },
            { type: "beaker", x: 680, y: 200, r: 22, color: "rgba(255,100,0,0.15)" }
        ]
    },

    // ===================== LEVEL 7: AETHER HEIGHTS =====================
    {
        id: 6,
        name: "Level 7: Aether Heights",
        description: "The luminiferous aether must not fill the void — defeat these ethereal errors!",
        theme: "aether",
        bgColor: "#07090f",
        pathColor: "#13182b",
        accentColor: "#aa88ff",
        waypoints: [
            { x: 920, y: 480 },
            { x: 750, y: 480 },
            { x: 750, y: 360 },
            { x: 550, y: 360 },
            { x: 550, y: 480 },
            { x: 350, y: 480 },
            { x: 350, y: 260 },
            { x: 180, y: 260 },
            { x: 180, y: 80  },
            { x: 400, y: 80  },
            { x: 400, y: 160 },
            { x: -20, y: 160 }
        ],
        buildSpots: [
            { x: 850, y: 380 }, { x: 640, y: 260 }, { x: 640, y: 460 },
            { x: 450, y: 380 }, { x: 450, y: 510 }, { x: 240, y: 380 },
            { x: 240, y: 160 }, { x: 80,  y: 160 }, { x: 500, y: 160 },
            { x: 500, y: 60  }, { x: 280, y: 60  }, { x: 750, y: 260 }
        ],
        waves: [
            [{ type: "aether", count: 8, delay: 1500 }],
            [{ type: "aether", count: 12, delay: 1200 }, { type: "spontaneous", count: 8, delay: 1100 }],
            [{ type: "aether", count: 14, delay: 1000 }, { type: "phlogiston", count: 12, delay: 900 }, { type: "flatearth", count: 10, delay: 800 }],
            [{ type: "aether", count: 16, delay: 800 }, { type: "alchemy", count: 12, delay: 900 }, { type: "caloric", count: 10, delay: 1000 }],
            [{ type: "miasma", count: 10, delay: 1100 }, { type: "aether", count: 18, delay: 700 }, { type: "geocentric", count: 12, delay: 900 }],
            [{ type: "aether", count: 20, delay: 600 }, { type: "caloric", count: 16, delay: 700 }, { type: "perpetual", count: 14, delay: 800 }],
            [{ type: "vitalism", count: 8, delay: 1200 }, { type: "aether", count: 22, delay: 600 }, { type: "miasma", count: 14, delay: 900 }],
            [{ type: "aether", count: 25, delay: 500 }, { type: "vitalism", count: 12, delay: 1000 }, { type: "alchemy", count: 20, delay: 600 }, { type: "caloric", count: 18, delay: 600 }]
        ],
        scenery: [
            { type: "blackhole", x: 550, y: 420 },
            { type: "atoms", x: 300, y: 140 }
        ]
    },

    // ===================== LEVEL 8: PLAGUE MARSH =====================
    {
        id: 7,
        name: "Level 8: Plague Marsh",
        description: "Miasma theory claims bad air spreads disease. Stamp it out with germ theory!",
        theme: "marsh",
        bgColor: "#060c06",
        pathColor: "#0e200c",
        accentColor: "#66ff44",
        waypoints: [
            { x: -20, y: 80  },
            { x: 200, y: 80  },
            { x: 200, y: 220 },
            { x: 80,  y: 220 },
            { x: 80,  y: 420 },
            { x: 320, y: 420 },
            { x: 320, y: 300 },
            { x: 520, y: 300 },
            { x: 520, y: 80  },
            { x: 720, y: 80  },
            { x: 720, y: 340 },
            { x: 870, y: 340 },
            { x: 870, y: 480 },
            { x: 920, y: 480 }
        ],
        buildSpots: [
            { x: 300, y: 55  }, { x: 300, y: 165 }, { x: 165, y: 320 },
            { x: 165, y: 490 }, { x: 420, y: 340 }, { x: 420, y: 490 },
            { x: 620, y: 190 }, { x: 620, y: 400 }, { x: 820, y: 190 },
            { x: 780, y: 430 }, { x: 60,  y: 130 }, { x: 440, y: 165 }
        ],
        waves: [
            [{ type: "miasma", count: 10, delay: 1300 }],
            [{ type: "miasma", count: 14, delay: 1100 }, { type: "spontaneous", count: 8, delay: 1100 }],
            [{ type: "miasma", count: 16, delay: 900 }, { type: "phlogiston", count: 12, delay: 800 }, { type: "caloric", count: 8, delay: 1100 }],
            [{ type: "miasma", count: 18, delay: 800 }, { type: "humours", count: 6, delay: 1500 }, { type: "alchemy", count: 12, delay: 900 }],
            [{ type: "humours", count: 10, delay: 1200 }, { type: "miasma", count: 20, delay: 700 }, { type: "aether", count: 10, delay: 1100 }],
            [{ type: "miasma", count: 22, delay: 600 }, { type: "humours", count: 14, delay: 1000 }, { type: "caloric", count: 16, delay: 700 }, { type: "vitalism", count: 8, delay: 1300 }],
            [{ type: "flatearth", count: 24, delay: 500 }, { type: "miasma", count: 24, delay: 500 }, { type: "humours", count: 18, delay: 800 }, { type: "aether", count: 14, delay: 800 }],
            [{ type: "miasma", count: 28, delay: 450 }, { type: "humours", count: 20, delay: 700 }, { type: "vitalism", count: 14, delay: 1000 }, { type: "alchemy", count: 20, delay: 600 }]
        ],
        scenery: [
            { type: "tree", x: 620, y: 490, r: 32 },
            { type: "tree", x: 400, y: 190, r: 28 },
            { type: "dna", x: 760, y: 200 }
        ]
    },

    // ===================== LEVEL 9: TECTONIC FAULT =====================
    {
        id: 8,
        name: "Level 9: Tectonic Fault",
        description: "Continental drift once called a fantasy — now the fault lines crack with misconceptions!",
        theme: "tectonic",
        bgColor: "#0d0a06",
        pathColor: "#231a0d",
        accentColor: "#cc8844",
        waypoints: [
            { x: -20, y: 300 },
            { x: 100, y: 300 },
            { x: 100, y: 80  },
            { x: 300, y: 80  },
            { x: 300, y: 200 },
            { x: 480, y: 200 },
            { x: 480, y: 460 },
            { x: 660, y: 460 },
            { x: 660, y: 160 },
            { x: 800, y: 160 },
            { x: 800, y: 400 },
            { x: 920, y: 400 }
        ],
        buildSpots: [
            { x: 60,  y: 190 }, { x: 200, y: 165 }, { x: 200, y: 300 },
            { x: 380, y: 130 }, { x: 380, y: 340 }, { x: 580, y: 100 },
            { x: 580, y: 340 }, { x: 760, y: 280 }, { x: 760, y: 60  },
            { x: 880, y: 280 }, { x: 660, y: 60  }, { x: 480, y: 60  }
        ],
        waves: [
            [{ type: "perpetual", count: 10, delay: 1300 }, { type: "alchemy", count: 8, delay: 1200 }],
            [{ type: "geocentric", count: 12, delay: 1100 }, { type: "caloric", count: 10, delay: 1000 }, { type: "flatearth", count: 12, delay: 900 }],
            [{ type: "miasma", count: 12, delay: 1000 }, { type: "humours", count: 8, delay: 1200 }, { type: "phlogiston", count: 14, delay: 800 }],
            [{ type: "vitalism", count: 10, delay: 1100 }, { type: "aether", count: 12, delay: 1000 }, { type: "alchemy", count: 16, delay: 800 }],
            [{ type: "caloric", count: 18, delay: 700 }, { type: "humours", count: 14, delay: 900 }, { type: "geocentric", count: 14, delay: 900 }],
            [{ type: "miasma", count: 22, delay: 600 }, { type: "vitalism", count: 16, delay: 800 }, { type: "perpetual", count: 18, delay: 700 }],
            [{ type: "aether", count: 20, delay: 600 }, { type: "caloric", count: 20, delay: 600 }, { type: "humours", count: 18, delay: 800 }, { type: "alchemy", count: 18, delay: 700 }],
            [{ type: "geocentric", count: 24, delay: 500 }, { type: "miasma", count: 24, delay: 500 }, { type: "vitalism", count: 20, delay: 700 }, { type: "creationist", count: 6, delay: 1800 }]
        ],
        scenery: [
            { type: "beaker", x: 360, y: 400, r: 26, color: "rgba(200,120,60,0.16)" },
            { type: "atoms", x: 680, y: 310 }
        ]
    },

    // ===================== LEVEL 10: PHLOGISTON FORGE (MINI-BOSS) =====================
    {
        id: 9,
        name: "Level 10: Phlogiston Forge",
        description: "The forge of false chemistry! Face the Phlogiston Juggernaut!",
        theme: "forge",
        bgColor: "#0e0602",
        pathColor: "#261209",
        accentColor: "#ff4400",
        waypoints: [
            { x: -20, y: 80  },
            { x: 150, y: 80  },
            { x: 150, y: 260 },
            { x: 40,  y: 260 },
            { x: 40,  y: 460 },
            { x: 260, y: 460 },
            { x: 260, y: 340 },
            { x: 460, y: 340 },
            { x: 460, y: 100 },
            { x: 640, y: 100 },
            { x: 640, y: 280 },
            { x: 820, y: 280 },
            { x: 820, y: 460 },
            { x: 920, y: 460 }
        ],
        buildSpots: [
            { x: 250, y: 60  }, { x: 250, y: 175 }, { x: 140, y: 370 },
            { x: 360, y: 370 }, { x: 360, y: 510 }, { x: 560, y: 220 },
            { x: 560, y: 430 }, { x: 730, y: 185 }, { x: 730, y: 380 },
            { x: 870, y: 185 }, { x: 60,  y: 160 }, { x: 460, y: 460 }
        ],
        waves: [
            [{ type: "phlogiston", count: 14, delay: 1200 }, { type: "alchemy", count: 10, delay: 1100 }],
            [{ type: "phlogiston", count: 18, delay: 1000 }, { type: "caloric", count: 12, delay: 900 }, { type: "flatearth", count: 14, delay: 800 }],
            [{ type: "miasma", count: 14, delay: 900 }, { type: "humours", count: 10, delay: 1100 }, { type: "phlogiston", count: 18, delay: 700 }],
            [{ type: "vitalism", count: 12, delay: 1000 }, { type: "aether", count: 14, delay: 900 }, { type: "phlogiston", count: 20, delay: 700 }],
            [{ type: "creationist", count: 8, delay: 1400 }, { type: "phlogiston", count: 22, delay: 600 }, { type: "caloric", count: 18, delay: 700 }],
            [{ type: "phlogiston", count: 24, delay: 600 }, { type: "miasma", count: 20, delay: 700 }, { type: "humours", count: 18, delay: 800 }, { type: "aether", count: 16, delay: 800 }],
            [{ type: "vitalism", count: 18, delay: 700 }, { type: "creationist", count: 12, delay: 1200 }, { type: "phlogiston", count: 26, delay: 500 }, { type: "geocentric", count: 20, delay: 600 }],
            [{ type: "phlogiston", count: 30, delay: 500 }, { type: "caloric", count: 24, delay: 500 }, { type: "miasma", count: 22, delay: 600 }, { type: "creationist", count: 16, delay: 1000 }],
            [{ type: "phlogiston", count: 35, delay: 450 }, { type: "aether", count: 24, delay: 600 }, { type: "humours", count: 22, delay: 700 }, { type: "vitalism", count: 20, delay: 700 }, { type: "boss_phlog", count: 1, delay: 5000 }]
        ],
        scenery: [
            { type: "beaker", x: 550, y: 60, r: 30, color: "rgba(255,68,0,0.2)" },
            { type: "atoms", x: 130, y: 380 }
        ]
    },

    // ===================== LEVEL 11: CRYSTAL CAVERNS =====================
    {
        id: 10,
        name: "Level 11: Crystal Caverns",
        description: "Crystalline misconceptions grow in the dark. Shine the light of science!",
        theme: "cavern",
        bgColor: "#060b10",
        pathColor: "#0f1d2b",
        accentColor: "#44ccff",
        waypoints: [
            { x: 920, y: 130 },
            { x: 780, y: 130 },
            { x: 780, y: 320 },
            { x: 600, y: 320 },
            { x: 600, y: 80  },
            { x: 400, y: 80  },
            { x: 400, y: 240 },
            { x: 200, y: 240 },
            { x: 200, y: 450 },
            { x: 420, y: 450 },
            { x: 420, y: 370 },
            { x: 650, y: 370 },
            { x: 650, y: 490 },
            { x: -20, y: 490 }
        ],
        buildSpots: [
            { x: 880, y: 240 }, { x: 690, y: 220 }, { x: 690, y: 430 },
            { x: 500, y: 175 }, { x: 500, y: 430 }, { x: 300, y: 145 },
            { x: 300, y: 360 }, { x: 100, y: 360 }, { x: 100, y: 510 },
            { x: 520, y: 510 }, { x: 780, y: 440 }, { x: 200, y: 60  }
        ],
        waves: [
            [{ type: "humours", count: 12, delay: 1300 }, { type: "miasma", count: 10, delay: 1100 }],
            [{ type: "creationist", count: 8, delay: 1400 }, { type: "humours", count: 14, delay: 1100 }, { type: "aether", count: 10, delay: 1000 }],
            [{ type: "vitalism", count: 12, delay: 1100 }, { type: "creationist", count: 10, delay: 1300 }, { type: "caloric", count: 14, delay: 900 }],
            [{ type: "homunculus", count: 5, delay: 2000 }, { type: "humours", count: 18, delay: 800 }, { type: "miasma", count: 16, delay: 800 }],
            [{ type: "homunculus", count: 8, delay: 1600 }, { type: "creationist", count: 14, delay: 1100 }, { type: "vitalism", count: 16, delay: 900 }, { type: "aether", count: 16, delay: 800 }],
            [{ type: "humours", count: 22, delay: 600 }, { type: "caloric", count: 20, delay: 700 }, { type: "homunculus", count: 10, delay: 1400 }, { type: "geocentric", count: 18, delay: 700 }],
            [{ type: "creationist", count: 20, delay: 700 }, { type: "vitalism", count: 20, delay: 700 }, { type: "miasma", count: 22, delay: 600 }, { type: "homunculus", count: 12, delay: 1200 }],
            [{ type: "flatearth", count: 28, delay: 450 }, { type: "humours", count: 26, delay: 500 }, { type: "homunculus", count: 16, delay: 1000 }, { type: "creationist", count: 22, delay: 700 }],
            [{ type: "aether", count: 28, delay: 500 }, { type: "vitalism", count: 24, delay: 600 }, { type: "homunculus", count: 18, delay: 900 }, { type: "caloric", count: 24, delay: 500 }]
        ],
        scenery: [
            { type: "atoms", x: 480, y: 160 },
            { type: "beaker", x: 320, y: 490, r: 26, color: "rgba(68,204,255,0.15)" }
        ]
    },

    // ===================== LEVEL 12: STORMFRONT =====================
    {
        id: 11,
        name: "Level 12: Stormfront",
        description: "Electric myths crackle through the storm. Ground them with Faraday's truth!",
        theme: "storm",
        bgColor: "#050810",
        pathColor: "#0e1528",
        accentColor: "#ffff44",
        waypoints: [
            { x: -20, y: 200 },
            { x: 120, y: 200 },
            { x: 120, y: 460 },
            { x: 300, y: 460 },
            { x: 300, y: 300 },
            { x: 480, y: 300 },
            { x: 480, y: 80  },
            { x: 680, y: 80  },
            { x: 680, y: 320 },
            { x: 820, y: 320 },
            { x: 820, y: 100 },
            { x: 920, y: 100 }
        ],
        buildSpots: [
            { x: 220, y: 130 }, { x: 220, y: 370 }, { x: 60,  y: 370 },
            { x: 390, y: 390 }, { x: 390, y: 510 }, { x: 380, y: 185 },
            { x: 580, y: 185 }, { x: 580, y: 400 }, { x: 760, y: 210 },
            { x: 760, y: 430 }, { x: 880, y: 215 }, { x: 680, y: 470 }
        ],
        waves: [
            [{ type: "aether", count: 14, delay: 1200 }, { type: "caloric", count: 12, delay: 1100 }],
            [{ type: "miasma", count: 16, delay: 1000 }, { type: "humours", count: 12, delay: 1000 }, { type: "aether", count: 14, delay: 900 }],
            [{ type: "vitalism", count: 14, delay: 1000 }, { type: "creationist", count: 12, delay: 1100 }, { type: "perpetual", count: 16, delay: 800 }],
            [{ type: "homunculus", count: 10, delay: 1400 }, { type: "aether", count: 20, delay: 700 }, { type: "geocentric", count: 16, delay: 800 }],
            [{ type: "caloric", count: 22, delay: 600 }, { type: "humours", count: 20, delay: 700 }, { type: "vitalism", count: 18, delay: 800 }, { type: "homunculus", count: 12, delay: 1200 }],
            [{ type: "creationist", count: 22, delay: 600 }, { type: "miasma", count: 24, delay: 600 }, { type: "aether", count: 22, delay: 600 }, { type: "homunculus", count: 14, delay: 1100 }],
            [{ type: "golem", count: 4, delay: 2500 }, { type: "humours", count: 26, delay: 500 }, { type: "vitalism", count: 24, delay: 600 }, { type: "caloric", count: 24, delay: 600 }],
            [{ type: "golem", count: 6, delay: 2000 }, { type: "creationist", count: 26, delay: 500 }, { type: "miasma", count: 26, delay: 500 }, { type: "aether", count: 24, delay: 600 }],
            [{ type: "golem", count: 8, delay: 1800 }, { type: "homunculus", count: 22, delay: 800 }, { type: "humours", count: 28, delay: 450 }, { type: "vitalism", count: 24, delay: 600 }]
        ],
        scenery: [
            { type: "blackhole", x: 500, y: 190 },
            { type: "atoms", x: 700, y: 200 }
        ]
    },

    // ===================== LEVEL 13: TOXIC WASTES =====================
    {
        id: 12,
        name: "Level 13: Toxic Wastes",
        description: "Miasma and humours run amok in the toxic dump. Purify the science!",
        theme: "toxic",
        bgColor: "#060b03",
        pathColor: "#0f1e07",
        accentColor: "#88ff00",
        waypoints: [
            { x: 920, y: 400 },
            { x: 840, y: 400 },
            { x: 840, y: 80  },
            { x: 640, y: 80  },
            { x: 640, y: 260 },
            { x: 460, y: 260 },
            { x: 460, y: 460 },
            { x: 260, y: 460 },
            { x: 260, y: 300 },
            { x: 100, y: 300 },
            { x: 100, y: 100 },
            { x: -20, y: 100 }
        ],
        buildSpots: [
            { x: 880, y: 240 }, { x: 740, y: 175 }, { x: 740, y: 480 },
            { x: 550, y: 175 }, { x: 550, y: 360 }, { x: 360, y: 360 },
            { x: 360, y: 510 }, { x: 160, y: 200 }, { x: 160, y: 400 },
            { x: 60,  y: 200 }, { x: 460, y: 100 }, { x: 260, y: 175 }
        ],
        waves: [
            [{ type: "miasma", count: 16, delay: 1100 }, { type: "humours", count: 14, delay: 1000 }],
            [{ type: "creationist", count: 12, delay: 1100 }, { type: "vitalism", count: 14, delay: 1000 }, { type: "miasma", count: 18, delay: 800 }],
            [{ type: "homunculus", count: 10, delay: 1400 }, { type: "golem", count: 5, delay: 2200 }, { type: "humours", count: 20, delay: 700 }],
            [{ type: "aether", count: 20, delay: 700 }, { type: "caloric", count: 20, delay: 700 }, { type: "creationist", count: 16, delay: 900 }, { type: "miasma", count: 22, delay: 600 }],
            [{ type: "golem", count: 8, delay: 1800 }, { type: "vitalism", count: 22, delay: 700 }, { type: "homunculus", count: 16, delay: 1000 }, { type: "humours", count: 24, delay: 600 }],
            [{ type: "creationist", count: 26, delay: 500 }, { type: "miasma", count: 28, delay: 500 }, { type: "golem", count: 10, delay: 1600 }, { type: "aether", count: 24, delay: 600 }],
            [{ type: "homunculus", count: 22, delay: 800 }, { type: "golem", count: 12, delay: 1500 }, { type: "vitalism", count: 26, delay: 600 }, { type: "caloric", count: 26, delay: 600 }],
            [{ type: "humours", count: 30, delay: 450 }, { type: "creationist", count: 28, delay: 500 }, { type: "golem", count: 14, delay: 1400 }, { type: "homunculus", count: 24, delay: 700 }],
            [{ type: "miasma", count: 32, delay: 400 }, { type: "vitalism", count: 28, delay: 500 }, { type: "golem", count: 16, delay: 1200 }, { type: "aether", count: 28, delay: 500 }]
        ],
        scenery: [
            { type: "tree", x: 540, y: 380, r: 30 },
            { type: "dna", x: 180, y: 200 },
            { type: "beaker", x: 700, y: 390, r: 24, color: "rgba(136,255,0,0.14)" }
        ]
    },

    // ===================== LEVEL 14: STELLAR NURSERY =====================
    {
        id: 13,
        name: "Level 14: Stellar Nursery",
        description: "Stars don't birth from myth — defeat the cosmic creationist swarms!",
        theme: "stellar",
        bgColor: "#060410",
        pathColor: "#130b26",
        accentColor: "#dd88ff",
        waypoints: [
            { x: -20, y: 350 },
            { x: 80,  y: 350 },
            { x: 80,  y: 80  },
            { x: 280, y: 80  },
            { x: 280, y: 200 },
            { x: 460, y: 200 },
            { x: 460, y: 440 },
            { x: 640, y: 440 },
            { x: 640, y: 150 },
            { x: 800, y: 150 },
            { x: 800, y: 350 },
            { x: 920, y: 350 }
        ],
        buildSpots: [
            { x: 180, y: 175 }, { x: 180, y: 440 }, { x: 60,  y: 220 },
            { x: 360, y: 130 }, { x: 360, y: 320 }, { x: 550, y: 100 },
            { x: 550, y: 330 }, { x: 720, y: 60  }, { x: 720, y: 290 },
            { x: 880, y: 240 }, { x: 460, y: 60  }, { x: 640, y: 520 }
        ],
        waves: [
            [{ type: "creationist", count: 14, delay: 1200 }, { type: "vitalism", count: 12, delay: 1100 }],
            [{ type: "homunculus", count: 10, delay: 1400 }, { type: "creationist", count: 16, delay: 1000 }, { type: "aether", count: 14, delay: 900 }],
            [{ type: "golem", count: 6, delay: 2000 }, { type: "humours", count: 20, delay: 700 }, { type: "miasma", count: 18, delay: 800 }],
            [{ type: "vitalism", count: 22, delay: 700 }, { type: "creationist", count: 20, delay: 700 }, { type: "golem", count: 8, delay: 1700 }, { type: "caloric", count: 18, delay: 800 }],
            [{ type: "homunculus", count: 18, delay: 900 }, { type: "golem", count: 10, delay: 1500 }, { type: "aether", count: 22, delay: 600 }, { type: "humours", count: 24, delay: 600 }],
            [{ type: "creationist", count: 28, delay: 500 }, { type: "vitalism", count: 26, delay: 600 }, { type: "golem", count: 12, delay: 1400 }, { type: "miasma", count: 26, delay: 600 }],
            [{ type: "homunculus", count: 24, delay: 700 }, { type: "golem", count: 14, delay: 1300 }, { type: "caloric", count: 28, delay: 500 }, { type: "aether", count: 26, delay: 600 }],
            [{ type: "creationist", count: 30, delay: 500 }, { type: "humours", count: 30, delay: 450 }, { type: "vitalism", count: 28, delay: 500 }, { type: "golem", count: 16, delay: 1200 }],
            [{ type: "miasma", count: 32, delay: 400 }, { type: "homunculus", count: 28, delay: 600 }, { type: "golem", count: 18, delay: 1100 }, { type: "creationist", count: 32, delay: 400 }]
        ],
        scenery: [
            { type: "blackhole", x: 420, y: 320 },
            { type: "atoms", x: 750, y: 240 }
        ]
    },

    // ===================== LEVEL 15: TWIN SPIRES (TWO MINI-BOSSES) =====================
    {
        id: 14,
        name: "Level 15: Twin Spires of Delusion",
        description: "The Aether Spectre and Miasma Colossus rise together. Face them both!",
        theme: "twin_spires",
        bgColor: "#07050f",
        pathColor: "#150d28",
        accentColor: "#ff44aa",
        waypoints: [
            { x: -20, y: 480 },
            { x: 100, y: 480 },
            { x: 100, y: 340 },
            { x: 240, y: 340 },
            { x: 240, y: 100 },
            { x: 420, y: 100 },
            { x: 420, y: 280 },
            { x: 580, y: 280 },
            { x: 580, y: 460 },
            { x: 730, y: 460 },
            { x: 730, y: 140 },
            { x: 860, y: 140 },
            { x: 860, y: 360 },
            { x: 920, y: 360 }
        ],
        buildSpots: [
            { x: 60,  y: 240 }, { x: 170, y: 440 }, { x: 170, y: 220 },
            { x: 330, y: 215 }, { x: 330, y: 440 }, { x: 500, y: 185 },
            { x: 500, y: 390 }, { x: 660, y: 380 }, { x: 660, y: 60  },
            { x: 800, y: 60  }, { x: 800, y: 260 }, { x: 880, y: 470 },
            { x: 420, y: 420 }, { x: 730, y: 280 }
        ],
        waves: [
            [{ type: "aether", count: 16, delay: 1100 }, { type: "miasma", count: 14, delay: 1100 }],
            [{ type: "humours", count: 16, delay: 1000 }, { type: "vitalism", count: 14, delay: 1000 }, { type: "aether", count: 18, delay: 800 }],
            [{ type: "creationist", count: 18, delay: 900 }, { type: "golem", count: 8, delay: 1700 }, { type: "miasma", count: 22, delay: 700 }],
            [{ type: "homunculus", count: 16, delay: 1000 }, { type: "aether", count: 22, delay: 700 }, { type: "humours", count: 24, delay: 600 }, { type: "caloric", count: 20, delay: 700 }],
            [{ type: "golem", count: 12, delay: 1500 }, { type: "vitalism", count: 24, delay: 700 }, { type: "creationist", count: 22, delay: 700 }, { type: "miasma", count: 26, delay: 600 }],
            [{ type: "homunculus", count: 22, delay: 800 }, { type: "golem", count: 14, delay: 1300 }, { type: "aether", count: 26, delay: 600 }, { type: "humours", count: 28, delay: 500 }],
            [{ type: "creationist", count: 30, delay: 500 }, { type: "vitalism", count: 28, delay: 600 }, { type: "golem", count: 16, delay: 1200 }, { type: "caloric", count: 28, delay: 500 }],
            [{ type: "miasma", count: 32, delay: 450 }, { type: "homunculus", count: 26, delay: 700 }, { type: "golem", count: 18, delay: 1100 }, { type: "aether", count: 30, delay: 500 }],
            [{ type: "humours", count: 34, delay: 400 }, { type: "creationist", count: 32, delay: 450 }, { type: "vitalism", count: 30, delay: 500 }, { type: "golem", count: 20, delay: 1000 }],
            [{ type: "aether", count: 36, delay: 400 }, { type: "miasma", count: 34, delay: 400 }, { type: "homunculus", count: 28, delay: 600 }, { type: "golem", count: 22, delay: 1000 }, { type: "boss_aether", count: 1, delay: 5000 }, { type: "boss_miasma", count: 1, delay: 8000 }]
        ],
        scenery: [
            { type: "blackhole", x: 300, y: 200 },
            { type: "blackhole", x: 660, y: 380 },
            { type: "atoms", x: 490, y: 490 }
        ]
    },

    // ===================== LEVEL 16: DEEP OCEAN TRENCH =====================
    {
        id: 15,
        name: "Level 16: Deep Ocean Trench",
        description: "Depth myths and ancient sea monsters block the trench. Drain them!",
        theme: "ocean",
        bgColor: "#020810",
        pathColor: "#051526",
        accentColor: "#0088ff",
        waypoints: [
            { x: -20, y: 100 },
            { x: 140, y: 100 },
            { x: 140, y: 300 },
            { x: 320, y: 300 },
            { x: 320, y: 480 },
            { x: 500, y: 480 },
            { x: 500, y: 180 },
            { x: 680, y: 180 },
            { x: 680, y: 400 },
            { x: 820, y: 400 },
            { x: 820, y: 220 },
            { x: 920, y: 220 }
        ],
        buildSpots: [
            { x: 60,  y: 200 }, { x: 240, y: 200 }, { x: 240, y: 390 },
            { x: 410, y: 390 }, { x: 410, y: 80  }, { x: 590, y: 80  },
            { x: 590, y: 310 }, { x: 770, y: 100 }, { x: 770, y: 310 },
            { x: 880, y: 320 }, { x: 140, y: 420 }, { x: 500, y: 360 }
        ],
        waves: [
            [{ type: "humours", count: 18, delay: 1100 }, { type: "miasma", count: 16, delay: 1000 }],
            [{ type: "vitalism", count: 18, delay: 1000 }, { type: "aether", count: 16, delay: 900 }, { type: "creationist", count: 14, delay: 1000 }],
            [{ type: "golem", count: 10, delay: 1600 }, { type: "homunculus", count: 18, delay: 900 }, { type: "humours", count: 24, delay: 600 }],
            [{ type: "caloric", count: 24, delay: 600 }, { type: "vitalism", count: 24, delay: 700 }, { type: "golem", count: 12, delay: 1400 }, { type: "miasma", count: 26, delay: 600 }],
            [{ type: "creationist", count: 28, delay: 500 }, { type: "golem", count: 14, delay: 1300 }, { type: "aether", count: 26, delay: 600 }, { type: "homunculus", count: 22, delay: 800 }],
            [{ type: "humours", count: 32, delay: 450 }, { type: "vitalism", count: 30, delay: 500 }, { type: "golem", count: 16, delay: 1200 }, { type: "caloric", count: 28, delay: 550 }],
            [{ type: "miasma", count: 34, delay: 400 }, { type: "creationist", count: 32, delay: 450 }, { type: "homunculus", count: 26, delay: 700 }, { type: "golem", count: 18, delay: 1100 }],
            [{ type: "aether", count: 34, delay: 400 }, { type: "vitalism", count: 32, delay: 450 }, { type: "golem", count: 20, delay: 1000 }, { type: "humours", count: 34, delay: 400 }],
            [{ type: "creationist", count: 36, delay: 400 }, { type: "miasma", count: 36, delay: 400 }, { type: "golem", count: 22, delay: 950 }, { type: "homunculus", count: 28, delay: 600 }],
            [{ type: "golem", count: 26, delay: 900 }, { type: "humours", count: 38, delay: 380 }, { type: "vitalism", count: 34, delay: 400 }, { type: "aether", count: 36, delay: 400 }]
        ],
        scenery: [
            { type: "dna", x: 320, y: 400 },
            { type: "atoms", x: 680, y: 300 }
        ]
    },

    // ===================== LEVEL 17: MAGNETIC ANOMALY =====================
    {
        id: 16,
        name: "Level 17: Magnetic Anomaly",
        description: "Magnetic monopoles and pseudoscience distort the field lines. Correct the poles!",
        theme: "magnetic",
        bgColor: "#050a0f",
        pathColor: "#0c1a26",
        accentColor: "#ff2288",
        waypoints: [
            { x: 920, y: 270 },
            { x: 800, y: 270 },
            { x: 800, y: 80  },
            { x: 620, y: 80  },
            { x: 620, y: 460 },
            { x: 440, y: 460 },
            { x: 440, y: 180 },
            { x: 260, y: 180 },
            { x: 260, y: 420 },
            { x: 100, y: 420 },
            { x: 100, y: 160 },
            { x: -20, y: 160 }
        ],
        buildSpots: [
            { x: 880, y: 390 }, { x: 710, y: 175 }, { x: 710, y: 375 },
            { x: 530, y: 100 }, { x: 530, y: 360 }, { x: 340, y: 100 },
            { x: 340, y: 310 }, { x: 160, y: 310 }, { x: 160, y: 60  },
            { x: 60,  y: 290 }, { x: 440, y: 60  }, { x: 620, y: 280 }
        ],
        waves: [
            [{ type: "golem", count: 12, delay: 1500 }, { type: "homunculus", count: 16, delay: 900 }],
            [{ type: "vitalism", count: 22, delay: 700 }, { type: "creationist", count: 20, delay: 700 }, { type: "golem", count: 14, delay: 1300 }],
            [{ type: "aether", count: 26, delay: 600 }, { type: "miasma", count: 24, delay: 600 }, { type: "homunculus", count: 22, delay: 800 }, { type: "golem", count: 16, delay: 1200 }],
            [{ type: "humours", count: 30, delay: 500 }, { type: "caloric", count: 28, delay: 550 }, { type: "vitalism", count: 28, delay: 600 }, { type: "golem", count: 18, delay: 1100 }],
            [{ type: "creationist", count: 32, delay: 450 }, { type: "golem", count: 20, delay: 1000 }, { type: "aether", count: 30, delay: 500 }, { type: "homunculus", count: 26, delay: 700 }],
            [{ type: "miasma", count: 34, delay: 400 }, { type: "vitalism", count: 32, delay: 450 }, { type: "golem", count: 22, delay: 950 }, { type: "humours", count: 34, delay: 400 }],
            [{ type: "caloric", count: 36, delay: 400 }, { type: "creationist", count: 34, delay: 400 }, { type: "golem", count: 24, delay: 900 }, { type: "homunculus", count: 28, delay: 600 }],
            [{ type: "aether", count: 36, delay: 380 }, { type: "miasma", count: 36, delay: 380 }, { type: "golem", count: 26, delay: 850 }, { type: "vitalism", count: 34, delay: 400 }],
            [{ type: "humours", count: 38, delay: 370 }, { type: "creationist", count: 38, delay: 370 }, { type: "golem", count: 28, delay: 800 }, { type: "homunculus", count: 32, delay: 550 }],
            [{ type: "golem", count: 32, delay: 800 }, { type: "vitalism", count: 38, delay: 370 }, { type: "aether", count: 38, delay: 370 }, { type: "miasma", count: 38, delay: 370 }]
        ],
        scenery: [
            { type: "blackhole", x: 460, y: 320 },
            { type: "beaker", x: 770, y: 420, r: 26, color: "rgba(255,34,136,0.15)" }
        ]
    },

    // ===================== LEVEL 18: RADIATION ZONE =====================
    {
        id: 17,
        name: "Level 18: Radiation Zone",
        description: "Vitalist myths saturate the radioactive wastes. Neutralise them!",
        theme: "radiation",
        bgColor: "#060a04",
        pathColor: "#111e0a",
        accentColor: "#aaff00",
        waypoints: [
            { x: -20, y: 460 },
            { x: 80,  y: 460 },
            { x: 80,  y: 100 },
            { x: 240, y: 100 },
            { x: 240, y: 340 },
            { x: 440, y: 340 },
            { x: 440, y: 80  },
            { x: 620, y: 80  },
            { x: 620, y: 260 },
            { x: 780, y: 260 },
            { x: 780, y: 480 },
            { x: 920, y: 480 }
        ],
        buildSpots: [
            { x: 160, y: 200 }, { x: 160, y: 430 }, { x: 60,  y: 290 },
            { x: 340, y: 220 }, { x: 340, y: 430 }, { x: 540, y: 185 },
            { x: 540, y: 440 }, { x: 700, y: 175 }, { x: 700, y: 370 },
            { x: 870, y: 380 }, { x: 440, y: 460 }, { x: 240, y: 480 }
        ],
        waves: [
            [{ type: "vitalism", count: 20, delay: 1000 }, { type: "homunculus", count: 16, delay: 900 }],
            [{ type: "golem", count: 14, delay: 1300 }, { type: "creationist", count: 24, delay: 600 }, { type: "vitalism", count: 24, delay: 700 }],
            [{ type: "aether", count: 28, delay: 600 }, { type: "miasma", count: 26, delay: 600 }, { type: "golem", count: 16, delay: 1200 }, { type: "homunculus", count: 22, delay: 800 }],
            [{ type: "humours", count: 32, delay: 450 }, { type: "caloric", count: 30, delay: 500 }, { type: "vitalism", count: 30, delay: 500 }, { type: "golem", count: 18, delay: 1100 }],
            [{ type: "creationist", count: 34, delay: 420 }, { type: "golem", count: 20, delay: 1000 }, { type: "aether", count: 32, delay: 450 }, { type: "homunculus", count: 28, delay: 650 }],
            [{ type: "miasma", count: 36, delay: 400 }, { type: "vitalism", count: 34, delay: 420 }, { type: "golem", count: 22, delay: 950 }, { type: "humours", count: 36, delay: 400 }],
            [{ type: "caloric", count: 38, delay: 380 }, { type: "creationist", count: 36, delay: 400 }, { type: "golem", count: 24, delay: 900 }, { type: "homunculus", count: 32, delay: 550 }],
            [{ type: "aether", count: 38, delay: 370 }, { type: "miasma", count: 38, delay: 370 }, { type: "golem", count: 26, delay: 850 }, { type: "vitalism", count: 36, delay: 400 }],
            [{ type: "humours", count: 40, delay: 360 }, { type: "creationist", count: 40, delay: 360 }, { type: "golem", count: 28, delay: 800 }, { type: "homunculus", count: 34, delay: 520 }],
            [{ type: "golem", count: 34, delay: 780 }, { type: "vitalism", count: 40, delay: 360 }, { type: "aether", count: 40, delay: 360 }, { type: "miasma", count: 40, delay: 360 }, { type: "caloric", count: 36, delay: 380 }]
        ],
        scenery: [
            { type: "atoms", x: 300, y: 460 },
            { type: "dna", x: 640, y: 360 }
        ]
    },

    // ===================== LEVEL 19: THE SINGULARITY'S EDGE =====================
    {
        id: 18,
        name: "Level 19: The Singularity's Edge",
        description: "Reality frays at the edge of the singularity. Last line before heat death!",
        theme: "singularity",
        bgColor: "#050310",
        pathColor: "#0f0822",
        accentColor: "#ff00ff",
        waypoints: [
            { x: 920, y: 80  },
            { x: 820, y: 80  },
            { x: 820, y: 300 },
            { x: 680, y: 300 },
            { x: 680, y: 480 },
            { x: 480, y: 480 },
            { x: 480, y: 280 },
            { x: 300, y: 280 },
            { x: 300, y: 480 },
            { x: 140, y: 480 },
            { x: 140, y: 140 },
            { x: 300, y: 140 },
            { x: 300, y: -20 }
        ],
        buildSpots: [
            { x: 880, y: 200 }, { x: 740, y: 200 }, { x: 740, y: 400 },
            { x: 570, y: 380 }, { x: 570, y: 60  }, { x: 380, y: 180 },
            { x: 380, y: 390 }, { x: 220, y: 60  }, { x: 220, y: 290 },
            { x: 60,  y: 310 }, { x: 480, y: 60  }, { x: 680, y: 60  }
        ],
        waves: [
            [{ type: "golem", count: 16, delay: 1200 }, { type: "homunculus", count: 22, delay: 800 }, { type: "vitalism", count: 24, delay: 700 }],
            [{ type: "creationist", count: 30, delay: 500 }, { type: "golem", count: 18, delay: 1100 }, { type: "aether", count: 28, delay: 600 }, { type: "miasma", count: 28, delay: 600 }],
            [{ type: "humours", count: 34, delay: 420 }, { type: "caloric", count: 32, delay: 450 }, { type: "golem", count: 20, delay: 1000 }, { type: "homunculus", count: 28, delay: 650 }],
            [{ type: "vitalism", count: 36, delay: 400 }, { type: "creationist", count: 34, delay: 420 }, { type: "golem", count: 22, delay: 950 }, { type: "aether", count: 34, delay: 420 }],
            [{ type: "miasma", count: 38, delay: 380 }, { type: "golem", count: 24, delay: 900 }, { type: "humours", count: 38, delay: 380 }, { type: "homunculus", count: 32, delay: 550 }],
            [{ type: "caloric", count: 40, delay: 360 }, { type: "vitalism", count: 38, delay: 380 }, { type: "golem", count: 26, delay: 860 }, { type: "creationist", count: 38, delay: 380 }],
            [{ type: "aether", count: 42, delay: 350 }, { type: "miasma", count: 40, delay: 360 }, { type: "golem", count: 28, delay: 820 }, { type: "homunculus", count: 34, delay: 520 }],
            [{ type: "humours", count: 42, delay: 350 }, { type: "creationist", count: 42, delay: 350 }, { type: "golem", count: 30, delay: 800 }, { type: "vitalism", count: 40, delay: 360 }],
            [{ type: "golem", count: 34, delay: 780 }, { type: "aether", count: 44, delay: 340 }, { type: "miasma", count: 42, delay: 350 }, { type: "caloric", count: 40, delay: 360 }],
            [{ type: "creationist", count: 46, delay: 330 }, { type: "homunculus", count: 38, delay: 500 }, { type: "golem", count: 38, delay: 760 }, { type: "vitalism", count: 44, delay: 340 }, { type: "aether", count: 44, delay: 340 }]
        ],
        scenery: [
            { type: "blackhole", x: 450, y: 380 },
            { type: "blackhole", x: 700, y: 180 },
            { type: "atoms", x: 200, y: 200 }
        ]
    },

    // ===================== LEVEL 20: HEAT DEATH OF THE UNIVERSE (FINAL BOSS) =====================
    {
        id: 19,
        name: "Level 20: Heat Death of the Universe",
        description: "Entropy reigns supreme. The Entropy Colossus rises to end all science. FINAL STAND!",
        theme: "heat_death",
        bgColor: "#020104",
        pathColor: "#0c0618",
        accentColor: "#ff6600",
        waypoints: [
            { x: -20, y: 275 },
            { x: 80,  y: 275 },
            { x: 80,  y: 80  },
            { x: 240, y: 80  },
            { x: 240, y: 200 },
            { x: 400, y: 200 },
            { x: 400, y: 460 },
            { x: 560, y: 460 },
            { x: 560, y: 340 },
            { x: 700, y: 340 },
            { x: 700, y: 80  },
            { x: 840, y: 80  },
            { x: 840, y: 420 },
            { x: 920, y: 420 }
        ],
        buildSpots: [
            { x: 160, y: 185 }, { x: 160, y: 370 }, { x: 60,  y: 370 },
            { x: 310, y: 310 }, { x: 310, y: 100 }, { x: 480, y: 100 },
            { x: 480, y: 360 }, { x: 650, y: 240 }, { x: 650, y: 460 },
            { x: 790, y: 230 }, { x: 880, y: 290 }, { x: 560, y: 100 },
            { x: 400, y: 60  }, { x: 840, y: 510 }
        ],
        waves: [
            [{ type: "golem", count: 18, delay: 1200 }, { type: "homunculus", count: 24, delay: 800 }, { type: "vitalism", count: 26, delay: 700 }, { type: "creationist", count: 22, delay: 750 }],
            [{ type: "aether", count: 32, delay: 450 }, { type: "miasma", count: 30, delay: 500 }, { type: "golem", count: 20, delay: 1100 }, { type: "caloric", count: 28, delay: 550 }],
            [{ type: "humours", count: 36, delay: 400 }, { type: "vitalism", count: 34, delay: 420 }, { type: "golem", count: 22, delay: 1000 }, { type: "homunculus", count: 30, delay: 600 }],
            [{ type: "creationist", count: 38, delay: 380 }, { type: "aether", count: 36, delay: 400 }, { type: "golem", count: 24, delay: 960 }, { type: "miasma", count: 36, delay: 400 }],
            [{ type: "caloric", count: 40, delay: 360 }, { type: "humours", count: 40, delay: 360 }, { type: "golem", count: 26, delay: 920 }, { type: "vitalism", count: 38, delay: 380 }],
            [{ type: "creationist", count: 42, delay: 350 }, { type: "miasma", count: 42, delay: 350 }, { type: "golem", count: 28, delay: 880 }, { type: "homunculus", count: 36, delay: 500 }, { type: "aether", count: 40, delay: 360 }],
            [{ type: "humours", count: 44, delay: 340 }, { type: "vitalism", count: 44, delay: 340 }, { type: "golem", count: 30, delay: 840 }, { type: "caloric", count: 42, delay: 350 }],
            [{ type: "aether", count: 46, delay: 330 }, { type: "miasma", count: 46, delay: 330 }, { type: "golem", count: 34, delay: 800 }, { type: "creationist", count: 44, delay: 340 }, { type: "homunculus", count: 40, delay: 480 }],
            [{ type: "vitalism", count: 48, delay: 320 }, { type: "humours", count: 48, delay: 320 }, { type: "golem", count: 38, delay: 760 }, { type: "caloric", count: 46, delay: 330 }, { type: "homunculus", count: 44, delay: 460 }],
            [{ type: "flatearth", count: 20, delay: 400 }, { type: "phlogiston", count: 20, delay: 400 }, { type: "spontaneous", count: 20, delay: 400 }, { type: "geocentric", count: 20, delay: 400 }, { type: "miasma", count: 20, delay: 400 }, { type: "aether", count: 20, delay: 400 }, { type: "golem", count: 20, delay: 600 }, { type: "homunculus", count: 20, delay: 500 }],
            [{ type: "creationist", count: 50, delay: 310 }, { type: "vitalism", count: 50, delay: 310 }, { type: "golem", count: 42, delay: 740 }, { type: "aether", count: 48, delay: 320 }, { type: "miasma", count: 48, delay: 320 }, { type: "homunculus", count: 46, delay: 450 }, { type: "boss_entropy", count: 1, delay: 10000 }]
        ],
        scenery: [
            { type: "blackhole", x: 200, y: 350 },
            { type: "blackhole", x: 700, y: 200 },
            { type: "blackhole", x: 450, y: 100 },
            { type: "atoms", x: 550, y: 300 }
        ]
    }
];

class LevelManager {
    static drawScenery(ctx, level) {
        if (!level.scenery) return;

        level.scenery.forEach(s => {
            ctx.save();
            if (s.type === "beaker") {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fillStyle = s.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s.x - 10, s.y - 20);
                ctx.lineTo(s.x + 10, s.y - 20);
                ctx.moveTo(s.x - 7, s.y - 20);
                ctx.lineTo(s.x - 7, s.y - 5);
                ctx.lineTo(s.x - s.r, s.y + s.r);
                ctx.lineTo(s.x + s.r, s.y + s.r);
                ctx.lineTo(s.x + 7, s.y - 5);
                ctx.lineTo(s.x + 7, s.y - 20);
                ctx.stroke();
                ctx.fill();
            }
            else if (s.type === "tree") {
                ctx.fillStyle = "rgba(10, 45, 20, 0.35)";
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "rgba(15, 60, 30, 0.4)";
                ctx.beginPath();
                ctx.arc(s.x + 10, s.y - 5, s.r * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (s.type === "dna") {
                ctx.strokeStyle = "rgba(0, 255, 100, 0.12)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let px = -40; px < 40; px += 2) {
                    const waveY1 = Math.sin(px * 0.1) * 15;
                    const waveY2 = Math.sin(px * 0.1 + Math.PI) * 15;
                    if (px === -40) {
                        ctx.moveTo(s.x + px, s.y + waveY1);
                    } else {
                        ctx.lineTo(s.x + px, s.y + waveY1);
                    }
                    if (px % 12 === 0) {
                        ctx.moveTo(s.x + px, s.y + waveY1);
                        ctx.lineTo(s.x + px, s.y + waveY2);
                    }
                }
                ctx.stroke();
            }
            else if (s.type === "blackhole") {
                const t = Date.now() * 0.0025;
                ctx.strokeStyle = level.accentColor ? level.accentColor + "44" : "rgba(191, 85, 236, 0.25)";
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 20;
                ctx.shadowColor = level.accentColor || "#bf55ec";

                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                        const r = (50 - angle * 3.5) + Math.sin(t + angle) * 3;
                        if (r <= 0) break;
                        const px = s.x + Math.cos(angle + t + k * (Math.PI / 1.5)) * r;
                        const py = s.y + Math.sin(angle + t + k * (Math.PI / 1.5)) * r;
                        if (angle === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                }

                ctx.fillStyle = "rgba(0,0,0,0.85)";
                ctx.beginPath();
                ctx.arc(s.x, s.y, 16, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (s.type === "atoms") {
                const t = Date.now() * 0.001;
                ctx.strokeStyle = level.accentColor ? level.accentColor + "26" : "rgba(0, 255, 255, 0.15)";
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.ellipse(s.x, s.y, 40, 15, Math.PI / 4 + t, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(s.x, s.y, 40, 15, -Math.PI / 4 + t * 0.8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 0, 150, 0.25)";
                ctx.beginPath();
                ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    static drawPath(ctx, path, pathColor, accentColor) {
        if (!path || path.length < 2) return;

        ctx.save();
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = 36;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        path.forEach((wp, index) => {
            if (index === 0) ctx.moveTo(wp.x, wp.y);
            else ctx.lineTo(wp.x, wp.y);
        });
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 32;
        ctx.stroke();

        ctx.strokeStyle = accentColor + "22";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 12]);
        ctx.stroke();
        ctx.restore();
    }

    // Ominous rift where enemies pour onto the map — marks the spawn direction.
    static drawSpawnPortal(ctx, p) {
        const t = performance.now() / 1000;
        const R = 26;
        ctx.save();
        ctx.translate(p.x, p.y);

        const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, R * 1.9);
        glow.addColorStop(0, "rgba(170, 30, 90, 0.55)");
        glow.addColorStop(0.5, "rgba(120, 20, 140, 0.30)");
        glow.addColorStop(1, "rgba(60, 10, 80, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1a0820";
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const a = t * 1.6 + (i * Math.PI * 2 / 3);
            ctx.strokeStyle = `rgba(255, 80, 160, ${0.7 - i * 0.15})`;
            ctx.beginPath();
            ctx.arc(0, 0, R * (0.55 + i * 0.18), a, a + Math.PI * 1.1);
            ctx.stroke();
        }

        const pulse = 0.6 + 0.4 * Math.sin(t * 4);
        ctx.fillStyle = `rgba(255, 120, 200, ${0.5 + 0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 6 + 3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 70, 150, 0.9)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // The defended base/lab at the path end. `ratio` (lives/maxLives) drives its
    // condition — shield fades, cracks then flames appear, rubble at 0. `flash`
    // (0..1) tints it red right after a leak.
    static drawBase(ctx, p, ratio, accentColor, flash) {
        const t = performance.now() / 1000;
        const accent = accentColor || "#00ffff";
        ctx.save();
        ctx.translate(p.x, p.y);

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(0, 26, 34, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (ratio <= 0) {
            ctx.fillStyle = "#3a3330";
            ctx.beginPath();
            ctx.moveTo(-30, 24);
            ctx.lineTo(-18, 2); ctx.lineTo(-4, 18); ctx.lineTo(8, -2);
            ctx.lineTo(20, 16); ctx.lineTo(30, 24);
            ctx.closePath();
            ctx.fill();
            for (let i = 0; i < 3; i++) {
                const sy = -((t * 14 + i * 16) % 48);
                ctx.fillStyle = `rgba(80,80,80,${0.3 - i * 0.08})`;
                ctx.beginPath();
                ctx.arc(-8 + i * 10, sy, 7 + i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            return;
        }

        // Platform + building
        ctx.fillStyle = "#2b2f3a";
        ctx.fillRect(-30, 14, 60, 14);
        ctx.fillStyle = "#3a4150";
        ctx.fillRect(-30, 14, 60, 4);
        ctx.fillStyle = "#444b59";
        ctx.fillRect(-22, -10, 44, 26);

        // Accent dome + highlight
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(0, -10, 22, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.arc(-6, -12, 8, Math.PI, 0);
        ctx.fill();

        // Antenna + pulsing beacon
        ctx.strokeStyle = "#9aa3b2";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(0, -40);
        ctx.stroke();
        const beacon = 0.5 + 0.5 * Math.sin(t * 3);
        ctx.fillStyle = `rgba(255,80,80,${0.5 + 0.5 * beacon})`;
        ctx.beginPath();
        ctx.arc(0, -42, 3, 0, Math.PI * 2);
        ctx.fill();

        // Door + windows
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-4, 2, 8, 14);
        ctx.globalAlpha = 0.6;
        ctx.fillRect(-16, -2, 6, 6);
        ctx.fillRect(10, -2, 6, 6);
        ctx.globalAlpha = 1;

        // Damage: cracks then flames as the base weakens
        if (ratio < 0.6) {
            ctx.strokeStyle = "rgba(20,15,15,0.8)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-10, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8);
            ctx.moveTo(12, -6); ctx.lineTo(6, 4);
            ctx.stroke();
        }
        if (ratio < 0.3) {
            for (let i = 0; i < 3; i++) {
                const fx = -14 + i * 14;
                const fh = 8 + 4 * Math.sin(t * 8 + i);
                ctx.fillStyle = i % 2 ? "#ff7a18" : "#ffcc33";
                ctx.beginPath();
                ctx.moveTo(fx - 4, -8);
                ctx.quadraticCurveTo(fx, -8 - fh, fx + 4, -8);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Shield bubble (fades with health)
        ctx.strokeStyle = `rgba(120, 200, 255, ${0.15 + 0.45 * ratio})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -2, 40, 0, Math.PI * 2);
        ctx.stroke();

        // Hit flash
        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 40, 40, ${0.45 * flash})`;
            ctx.beginPath();
            ctx.arc(0, -2, 42, 0, Math.PI * 2);
            ctx.fill();
        }

        // Integrity bar above
        const bw = 50, bh = 5;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(-bw / 2 - 1, -56, bw + 2, bh + 2);
        ctx.fillStyle = "#ff2a3a";
        ctx.fillRect(-bw / 2, -55, bw, bh);
        ctx.fillStyle = "#33ff88";
        ctx.fillRect(-bw / 2, -55, bw * ratio, bh);

        ctx.restore();
    }

    static generateEndlessWave(waveNumber) {
        const wave = [];
        const baseCount = 8 + Math.floor(waveNumber * 2);

        const allTypes = [
            "flatearth", "phlogiston", "spontaneous", "alchemy", "perpetual",
            "geocentric", "miasma", "caloric", "aether", "vitalism",
            "humours", "creationist", "homunculus", "golem"
        ];

        if (waveNumber === 1) {
            wave.push({ type: "flatearth", count: baseCount, delay: 1500 });
        } else if (waveNumber === 2) {
            wave.push({ type: "flatearth", count: Math.ceil(baseCount * 0.8), delay: 1200 });
            wave.push({ type: "phlogiston", count: 6, delay: 1000 });
        } else if (waveNumber === 3) {
            wave.push({ type: "spontaneous", count: 8, delay: 1400 });
            wave.push({ type: "phlogiston", count: baseCount, delay: 800 });
            wave.push({ type: "caloric", count: 6, delay: 1100 });
        } else {
            const selectedTypes = [];
            const delay = Math.max(300, 1400 - waveNumber * 40);

            if (waveNumber >= 4)  selectedTypes.push("flatearth", "phlogiston");
            if (waveNumber >= 5)  selectedTypes.push("geocentric");
            if (waveNumber >= 6)  selectedTypes.push("spontaneous", "caloric");
            if (waveNumber >= 8)  selectedTypes.push("perpetual", "miasma");
            if (waveNumber >= 10) selectedTypes.push("alchemy", "aether");
            if (waveNumber >= 12) selectedTypes.push("vitalism", "humours");
            if (waveNumber >= 14) selectedTypes.push("creationist");
            if (waveNumber >= 16) selectedTypes.push("homunculus");
            if (waveNumber >= 18) selectedTypes.push("golem");

            selectedTypes.forEach(t => {
                const isTough = ["golem", "homunculus", "creationist", "perpetual", "geocentric", "alchemy"].includes(t);
                const proportion = isTough ? 0.35 : 0.65;
                const count = Math.ceil(baseCount * proportion);
                wave.push({ type: t, count: count, delay: delay });
            });
        }

        return wave;
    }
}

// Make globally available
window.GAME_WIDTH = GAME_WIDTH;
window.GAME_HEIGHT = GAME_HEIGHT;
window.LEVEL_DATA = LEVEL_DATA;
window.LevelManager = LevelManager;
