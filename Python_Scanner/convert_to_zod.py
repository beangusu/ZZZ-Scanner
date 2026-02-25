import json
import os
import re

# maps the scanner's stat names to ZOOD key format based on libs/zzz/consts/src/disc.ts in frzyc/genshin-optimizer
MAIN_STAT_MAP = {
    "HP":                   "hp",
    "ATK":                  "atk",       # slot 2 only (flat)
    "DEF":                  "def_",
    "HP%":                  "hp_",
    "ATK%":                 "atk_",      # slot 4/5/6 (percentage)
    "DEF%":                 "def_",
    "CRIT Rate":            "crit_",
    "CRIT DMG":             "crit_dmg_",
    "Anomaly Proficiency":  "anomProf",
    "Anomaly Mastery":      "anomMas_",
    "PEN Ratio":            "pen_",
    "Energy Regen":         "enerRegen_",
    "Impact":               "impact_",
    "Electric DMG Bonus":   "electric_dmg_",
    "Fire DMG Bonus":       "fire_dmg_",
    "Ice DMG Bonus":        "ice_dmg_",
    "Physical DMG Bonus":   "physical_dmg_",
    "Ether DMG Bonus":      "ether_dmg_",
}

# slot 4/5/6 ATK/HP/DEF main stats are always percentage variants
PERCENTAGE_MAIN_STAT_SLOTS = {"4", "5", "6"}
FLAT_TO_PERCENT_MAIN_STAT = {
    "atk": "atk_",
    "hp":  "hp_",
    "def": "def_",
}

# sub stats; flat vs percent variants
SUBSTAT_MAP_FLAT = {
    "HP":                   "hp",
    "ATK":                  "atk",
    "DEF":                  "def",
    "CRIT Rate":            "crit_",
    "CRIT DMG":             "crit_dmg_",
    "Anomaly Proficiency":  "anomProf",
    "PEN":                  "pen",
}

SUBSTAT_MAP_PERCENT = {
    "HP":   "hp_",
    "ATK":  "atk_",
    "DEF":  "def_",
}

SET_NAME_MAP = {
    "Astral Voice":         "AstralVoice",
    "Branch & Blade Song":  "BranchBladeSong",
    "Chaos Jazz":           "ChaosJazz",
    "Chaotic Metal":        "ChaoticMetal",
    "Dawn's Bloom":         "DawnsBloom",
    "Fanged Metal":         "FangedMetal",
    "Freedom Blues":        "FreedomBlues",
    "Hormone Punk":         "HormonePunk",
    "Inferno Metal":        "InfernoMetal",
    "King of the Summit":   "KingOfTheSummit",
    "Moonlight Lullaby":    "MoonlightLullaby",
    "Phaethon's Melody":    "PhaethonsMelody",
    "Polar Metal":          "PolarMetal",
    "Proto Punk":           "ProtoPunk",
    "Puffer Electro":       "PufferElectro",
    "Shadow Harmony":       "ShadowHarmony",
    "Shining Aria":         "ShiningAria",
    "Shockstar Disco":      "ShockstarDisco",
    "Soul Rock":            "SoulRock",
    "Swing Jazz":           "SwingJazz",
    "Thunder Metal":        "ThunderMetal",
    "White Water Ballad":   "WhiteWaterBallad",
    "Woodpecker Electro":   "WoodpeckerElectro",
    "Yunkui Tales":         "YunkuiTales",
}


def get_substat_key(stat_name, stat_value):
    """
    Given a raw stat name (eg: 'HP%', 'ATK') and its value (eg: '6%', '57.0'),
    return the ZOD key string.
    """
    is_percent = "%" in stat_name or "%" in str(stat_value)
    base_name = stat_name.replace("%", "").strip()

    if is_percent and base_name in SUBSTAT_MAP_PERCENT:
        return SUBSTAT_MAP_PERCENT[base_name]
    if base_name in SUBSTAT_MAP_FLAT:
        return SUBSTAT_MAP_FLAT[base_name]

    print(f"  Warning: Unknown substat '{stat_name}', skipping")
    return None


def get_upgrades(stat_name):
    """
    Extracts the +N upgrade count from stat names like 'HP+1', 'ATK+3'.
    Returns 1 for unranked (1 initial roll), +1 for each rank-up.
    """
    match = re.search(r'\+(\d+)', stat_name)
    if match:
        return int(match.group(1)) + 1  # +1 for the initial roll
    return 1  # unranked = just the initial roll


def convert(input_path, output_path):
    with open(input_path, "r") as f:
        scan_data = json.load(f)

    zod_discs = []

    for disc in scan_data:
        set_name = disc.get("set_name", "")
        set_key = SET_NAME_MAP.get(set_name)
        if not set_key:
            print(f"  Warning: Unknown set name '{set_name}', skipping disc")
            continue

        slot_key = str(disc.get("partition_number", ""))
        rarity = disc.get("drive_rarity", "S")
        level = int(disc.get("drive_current_level", 0))
        main_stat = disc.get("drive_base_stat", "")
        main_stat_key = MAIN_STAT_MAP.get(main_stat)
        if not main_stat_key:
            print(f"  Warning: Unknown main stat '{main_stat}', skipping disc")
            continue

        # slots 4/5/6 ATK/HP/DEF main stats are always percentage variants
        if slot_key in PERCENTAGE_MAIN_STAT_SLOTS and main_stat_key in FLAT_TO_PERCENT_MAIN_STAT:
            main_stat_key = FLAT_TO_PERCENT_MAIN_STAT[main_stat_key]

        substats = []
        for stat_name, stat_value in disc.get("random_stats", []):
            upgrades = get_upgrades(stat_name)
            # strip the +N and % from the name before looking up the key
            clean_name = re.sub(r'\+\d+', '', stat_name).strip()
            key = get_substat_key(clean_name, stat_value)
            if key:
                substats.append({"key": key, "upgrades": upgrades})

        zod_discs.append({
            "setKey": set_key,
            "slotKey": slot_key,
            "level": level,
            "rarity": rarity,
            "mainStatKey": main_stat_key,
            "substats": substats,
        })

    zod_output = {
        "format": "ZOOD",
        "version": 1,
        "source": "ZZZ-Scanner",
        "discs": zod_discs,
    }

    with open(output_path, "w") as f:
        json.dump(zod_output, f, indent=2)

    print(f"Converted {len(zod_discs)} discs to ZOD format -> {output_path}")


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join("scan_output", "scan_data.json")
    output_path = os.path.join("scan_output", "scan_data_ZOD.json")
    convert(input_path, output_path)
