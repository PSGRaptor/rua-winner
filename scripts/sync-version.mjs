// scripts/sync-version.mjs
// Sync all app version fields to the root package.json version.
// Usage: `node scripts/sync-version.mjs`

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const paths = {
    rootPkg: path.join(ROOT, "package.json"),
    webPkg: path.join(ROOT, "apps", "web", "package.json"),
    desktopPkg: path.join(ROOT, "apps", "desktop", "package.json"),
    tauriConf: path.join(ROOT, "apps", "desktop", "src-tauri", "tauri.conf.json"),
    cargoTauri: path.join(ROOT, "apps", "desktop", "src-tauri", "Cargo.toml"),
    cargoAlt: path.join(ROOT, "apps", "desktop", "Cargo.toml"),
};

function readJson(p) {
    const s = fs.readFileSync(p, "utf8");
    return { obj: JSON.parse(s), raw: s };
}

function writeJsonIfChanged(p, obj, originalRaw) {
    const next = JSON.stringify(obj, null, 2) + "\n";
    if (next !== originalRaw) {
        fs.writeFileSync(p, next, "utf8");
        return true;
    }
    return false;
}

function fileExists(p) {
    try {
        fs.accessSync(p, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

function updateTomlVersion(tomlRaw, newVersion) {
    const lines = tomlRaw.split(/\r?\n/);
    let inPackage = false;
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^\s*\[package\]\s*$/.test(line)) {
            inPackage = true;
            continue;
        }
        if (inPackage && /^\s*\[.+\]\s*$/.test(line)) {
            // next section started
            inPackage = false;
        }
        if (inPackage && /^\s*version\s*=\s*".*"\s*$/.test(line)) {
            const next = line.replace(/version\s*=\s*".*"/, `version = "${newVersion}"`);
            if (next !== line) {
                lines[i] = next;
                changed = true;
            }
            break; // updated first version in [package]
        }
    }
    return { raw: lines.join("\n") + (tomlRaw.endsWith("\n") ? "" : "\n"), changed };
}

function sync() {
    // 1) Read root version (source of truth)
    const { obj: rootObj } = readJson(paths.rootPkg);
    const newVersion = rootObj.version;
    if (!newVersion || typeof newVersion !== "string") {
        console.error("Root package.json has no valid 'version'.");
        process.exit(1);
    }

    let touched = [];

    // 2) apps/web/package.json
    if (fileExists(paths.webPkg)) {
        const { obj, raw } = readJson(paths.webPkg);
        if (obj.version !== newVersion) obj.version = newVersion;
        if (writeJsonIfChanged(paths.webPkg, obj, raw)) touched.push(paths.webPkg);
    }

    // 3) apps/desktop/package.json
    if (fileExists(paths.desktopPkg)) {
        const { obj, raw } = readJson(paths.desktopPkg);
        if (obj.version !== newVersion) obj.version = newVersion;
        if (writeJsonIfChanged(paths.desktopPkg, obj, raw)) touched.push(paths.desktopPkg);
    }

    // 4) apps/desktop/src-tauri/tauri.conf.json -> package.version
    if (fileExists(paths.tauriConf)) {
        const { obj, raw } = readJson(paths.tauriConf);
        obj.package = obj.package || {};
        if (obj.package.version !== newVersion) obj.package.version = newVersion;
        if (writeJsonIfChanged(paths.tauriConf, obj, raw)) touched.push(paths.tauriConf);
    }

    // 5) Cargo.toml (src-tauri)
    if (fileExists(paths.cargoTauri)) {
        const raw = fs.readFileSync(paths.cargoTauri, "utf8");
        const { raw: next, changed } = updateTomlVersion(raw, newVersion);
        if (changed) {
            fs.writeFileSync(paths.cargoTauri, next, "utf8");
            touched.push(paths.cargoTauri);
        }
    }

    // 6) Cargo.toml (apps/desktop) if present
    if (fileExists(paths.cargoAlt)) {
        const raw = fs.readFileSync(paths.cargoAlt, "utf8");
        const { raw: next, changed } = updateTomlVersion(raw, newVersion);
        if (changed) {
            fs.writeFileSync(paths.cargoAlt, next, "utf8");
            touched.push(paths.cargoAlt);
        }
    }

    if (touched.length) {
        console.log("Version sync complete:", JSON.stringify({ version: newVersion, files: touched }, null, 2));
    } else {
        console.log("Version sync: no changes needed.");
    }
}

sync();
