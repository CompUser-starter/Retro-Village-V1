#!/usr/bin/env node
// Retro Kənd — Android APK builder (Java 25 friendly).
// Run: double-click apk.bat   (or: node scripts/android-apk.mjs)
//
// Steps: packages -> web build -> Java -> android project -> Gradle 9.1 -> SDK path -> icon -> APK

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeAndroidIcons } from "./android-icons.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANDROID = path.join(ROOT, "android");
const IS_WIN = process.platform === "win32";
const GRADLE_VERSION = "9.1.0"; // first Gradle that runs on Java 25
const MIN_COMPILE_SDK = 36; // Capacitor 8 template

const step = (n, msg) => console.log(`\n[${n}/8] ${msg}`);
const info = (msg) => console.log(`      ${msg}`);
function fail(msg) {
  console.error(`\n[XƏTA] ${msg}\n`);
  process.exit(1);
}
const run = (cmd, args = [], opts = {}) =>
  spawnSync(cmd, args, { stdio: "inherit", shell: true, cwd: ROOT, ...opts }).status === 0;
const readText = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
};
const readJson = (p) => {
  try {
    return JSON.parse(readText(p) ?? "");
  } catch {
    return null;
  }
};
const major = (v) => Number(/(\d+)/.exec(String(v ?? ""))?.[1] ?? 0);
const cmpVersion = (a, b) => {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};
const listDirs = (base) => {
  try {
    return fs
      .readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(base, d.name));
  } catch {
    return [];
  }
};

/** Capacitor CLI straight from node_modules (avoids "could not determine executable to run"). */
function cap(args) {
  const bin = path.join(ROOT, "node_modules", "@capacitor", "cli", "bin", "capacitor");
  if (fs.existsSync(bin)) return run("node", [`"${bin}"`, ...args]);
  return run("npx", ["--no-install", "cap", ...args]);
}

/* ---------------- 1. packages ---------------- */
step(1, "Node.js və paketlər…");
if (!fs.existsSync(path.join(ROOT, "package.json"))) fail("package.json tapılmadı. apk.bat layihə qovluğunda olmalıdır.");
info(`Node.js ${process.versions.node}`);
if (major(process.versions.node) < 22) {
  fail(`Node.js 22 və ya daha yeni lazımdır (sizdə ${process.versions.node}).
       nodejs.org → LTS versiyasını quraşdırın, sonra apk.bat-ı yenidən açın.`);
}
const hasPkg = (name) => fs.existsSync(path.join(ROOT, "node_modules", ...name.split("/"), "package.json"));
if (!hasPkg("@capacitor/android") || !hasPkg("@capacitor/cli") || !hasPkg("vite")) {
  info("npm install…");
  if (!run("npm", ["install"])) fail("npm install alınmadı.");
}
const capMajor = major(readJson(path.join(ROOT, "node_modules", "@capacitor", "android", "package.json"))?.version);
const cliMajor = major(readJson(path.join(ROOT, "node_modules", "@capacitor", "cli", "package.json"))?.version);
if (cliMajor !== capMajor) {
  info(`Capacitor CLI ${cliMajor} → ${capMajor}…`);
  if (!run("npm", ["install", `@capacitor/cli@${capMajor}`, `@capacitor/core@${capMajor}`])) fail("Capacitor yenilənmədi.");
}

/* ---------------- 2. web build ---------------- */
step(2, "Oyun yığılır…");
if (!run("npm", ["run", "build"])) fail("npm run build alınmadı.");

/* ---------------- 3. Java ---------------- */
step(3, "Java axtarılır…");
const javaExe = (home) => path.join(home, "bin", IS_WIN ? "java.exe" : "java");
function jdkMajor(home) {
  const m = /JAVA_VERSION="(\d+)(?:\.(\d+))?/.exec(readText(path.join(home, "release")) ?? "");
  if (!m) return 0;
  return Number(m[1]) === 1 ? Number(m[2] ?? 0) : Number(m[1]);
}
const candidates = [process.env.JAVA_HOME];
if (IS_WIN) {
  for (const pf of [process.env.ProgramFiles, "C:\\Program Files"].filter(Boolean)) {
    candidates.push(path.join(pf, "Android", "Android Studio", "jbr"));
    for (const v of ["Eclipse Adoptium", "Java", "Microsoft", "Zulu", "Amazon Corretto"]) candidates.push(...listDirs(path.join(pf, v)));
  }
  if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, "Programs", "Android Studio", "jbr"));
} else if (process.platform === "darwin") {
  candidates.push("/Applications/Android Studio.app/Contents/jbr/Contents/Home");
  for (const d of listDirs("/Library/Java/JavaVirtualMachines")) candidates.push(path.join(d, "Contents", "Home"));
} else {
  candidates.push(...listDirs("/usr/lib/jvm"), "/opt/android-studio/jbr");
}
candidates.push(...listDirs(path.join(os.homedir(), ".jdks")));

const seen = new Set();
const jdks = [];
for (const home of candidates) {
  if (!home || !fs.existsSync(javaExe(home))) continue;
  const key = path.resolve(home).toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  jdks.push({ home, major: jdkMajor(home) });
}
jdks.forEach((j) => info(`tapıldı: Java ${j.major || "?"}  ${j.home}`));
// Prefer Java 25 (Android Studio's own), otherwise the newest Java 21+.
const usable = jdks.filter((j) => j.major >= 21).sort((a, b) => (b.major === 25) - (a.major === 25) || b.major - a.major);
const jdk = usable[0];
if (!jdk) fail("Java 21+ tapılmadı. Android Studio quraşdırılmalıdır (öz Java-sını gətirir).");
info(`istifadə olunur: Java ${jdk.major}`);

const env = { ...process.env, JAVA_HOME: jdk.home };
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === "path") ?? "PATH";
env[pathKey] = path.join(jdk.home, "bin") + path.delimiter + (process.env[pathKey] ?? "");
const gradlew = IS_WIN ? "gradlew.bat" : "./gradlew";

/* ---------------- 4. android project ---------------- */
step(4, "Android layihəsi…");
if (fs.existsSync(ANDROID)) {
  const sdk = Number(/compileSdkVersion\s*=\s*(\d+)/.exec(readText(path.join(ANDROID, "variables.gradle")) ?? "")?.[1] ?? 0);
  if (sdk && sdk < MIN_COMPILE_SDK) {
    info(`köhnə şablon (compileSdk ${sdk}) — yenidən yaradılır`);
    spawnSync(gradlew, ["--stop"], { cwd: ANDROID, env, shell: true, stdio: "ignore" });
    try {
      fs.rmSync(ANDROID, { recursive: true, force: true });
    } catch {
      fail("android qovluğu silinmədi. Android Studio-nu bağlayıb yenidən cəhd edin.");
    }
  }
}
if (!fs.existsSync(ANDROID) && !cap(["add", "android"])) fail("Android layihəsi yaradılmadı.");
if (!cap(["sync", "android"])) fail("cap sync alınmadı.");

/* ---------------- 5. Gradle 9.1 (Java 25) ---------------- */
step(5, "Gradle versiyası…");
const wrapperFile = path.join(ANDROID, "gradle", "wrapper", "gradle-wrapper.properties");
const wrapper = readText(wrapperFile);
if (wrapper) {
  const current = /gradle-(\d+(?:\.\d+)*)-(?:all|bin)\.zip/.exec(wrapper)?.[1] ?? "0";
  if (cmpVersion(current, GRADLE_VERSION) < 0) {
    fs.writeFileSync(
      wrapperFile,
      wrapper.replace(/distributionUrl=.*/, `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`)
    );
    info(`Gradle ${current} → ${GRADLE_VERSION}`);
    spawnSync(gradlew, ["--stop"], { cwd: ANDROID, env, shell: true, stdio: "ignore" });
  } else info(`Gradle ${current}`);
}

/* ---------------- 6. Android SDK ---------------- */
step(6, "Android SDK…");
const localProps = path.join(ANDROID, "local.properties");
if (!/sdk\.dir=/.test(readText(localProps) ?? "")) {
  const sdkCands = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];
  if (IS_WIN && process.env.LOCALAPPDATA) sdkCands.push(path.join(process.env.LOCALAPPDATA, "Android", "Sdk"));
  if (process.platform === "darwin") sdkCands.push(path.join(os.homedir(), "Library", "Android", "sdk"));
  sdkCands.push(path.join(os.homedir(), "Android", "Sdk"));
  const sdk = sdkCands.find((p) => p && fs.existsSync(p));
  if (!sdk) fail("Android SDK tapılmadı. Android Studio-nu bir dəfə açıb ilk quraşdırmanı bitirin.");
  fs.writeFileSync(localProps, `sdk.dir=${IS_WIN ? sdk.replace(/\\/g, "\\\\").replace(/:/g, "\\:") : sdk}\n`);
  info(`sdk.dir = ${sdk}`);
} else info("hazırdır");

/* ---------------- 7. portrait + icon (no downloads) ---------------- */
step(7, "Portret rejimi və ikon…");
const manifestFile = path.join(ANDROID, "app", "src", "main", "AndroidManifest.xml");
const manifest = readText(manifestFile);
if (manifest && !manifest.includes("screenOrientation")) {
  fs.writeFileSync(
    manifestFile,
    manifest.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"')
  );
}
const icon = path.join(ROOT, "public", "icon-512.png");
const res = path.join(ANDROID, "app", "src", "main", "res");
if (fs.existsSync(icon) && fs.existsSync(res)) {
  try {
    const bg = writeAndroidIcons(res, icon);
    info(`ikon hazırdır (5 ölçü, dairəvi + adaptiv, fon ${bg})`);
  } catch (e) {
    // never block the build because of the icon
    info(`ikon yaradılmadı (${e.message}) — standart ikon qalır`);
  }
}

/* ---------------- 8. APK ---------------- */
step(8, "APK yığılır (ilk dəfə 5–15 dəqiqə)…");
if (!IS_WIN) {
  try {
    fs.chmodSync(path.join(ANDROID, "gradlew"), 0o755);
  } catch {
    /* ignore */
  }
}
const ok = spawnSync(gradlew, ["assembleDebug"], { cwd: ANDROID, env, shell: true, stdio: "inherit" }).status === 0;
if (!ok) fail('APK yığılmadı. Yuxarıdakı "What went wrong" hissəsinin şəklini göndərin.');

const apk = path.join(ANDROID, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (!fs.existsSync(apk)) fail("APK faylı tapılmadı.");
const out = path.join(ROOT, "RetroKend.apk");
fs.copyFileSync(apk, out);
console.log(`\n✔ HAZIRDIR!  ${out}`);
console.log("  Bu faylı telefona göndərin və açıb quraşdırın.\n");
