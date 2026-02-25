import path from "path";
import { app, ipcMain, shell } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

// Update scanner path
const pathToScanner = isProd
  ? path.join(
      process.resourcesPath,
      "ZZZ-Scanner-Tesseract/ZZZ-Scanner-Tesseract.exe"
    )
  : path.join(__dirname, "../ZZZ-Scanner-Tesseract/ZZZ-Scanner-Tesseract.exe");

// Update output path
const pathToScanOutput = isProd
  ? path.join(
      process.resourcesPath,
      "ZZZ-Scanner-Tesseract/_internal/scan_output"
    )
  : path.join(__dirname, "../ZZZ-Scanner-Tesseract/_internal/scan_output");

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}
let mainWindow;
(async () => {
  await app.whenReady();

  mainWindow = createWindow("main", {
    width: 1000,
    height: 750,
    autoHideMenuBar: true,
    icon: path.join(
      __dirname,
      "../renderer/public/images",
      "ZZZ-Scanner-Icon.png"
    ),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});
//input expected in form { discScan: number, pageLoad: number, keepImages: boolean }
ipcMain.on("start-scan", (event, arg) => {
  console.log("Received start-scan event with args: ", arg);
  console.log("Scanner path:", pathToScanner);
  console.log("Path exists:", fs.existsSync(pathToScanner));
  const { discScan, pageLoad, keepImages } = arg;
  //run the scanner exe with the provided arguments in order of pageLoad, discScan, keepImages
  const scannerProcess = require("child_process").spawn(pathToScanner, [
    pageLoad,
    discScan,
    keepImages ? "1" : "0",
  ]);

  //Wait for then watch the log file for changes so we can respond to scanner events
  setTimeout(() => {
    const logFilePath = path.join(pathToScanOutput, "log.txt");
    let lastLine = "";

    console.log("Watching log file: ", logFilePath);
    fs.watch(logFilePath, (eventType) => {
      if (eventType === "change") {
        fs.readFile(logFilePath, "utf8", (err, data) => {
          if (err) {
            console.error("Error reading log file:", err);
            return;
          }

          const lines = data.split("\n").filter(line => line.trim() !== "");
          const newLastLine = lines[lines.length - 1].trim();
          //console.log("New last line: ", newLastLine);

          if (newLastLine !== lastLine) {
            lastLine = newLastLine;

            // check last 3 lines in case new log lines were added after the trigger
            const recentLines = lines.slice(-3).join("\n");

            if (recentLines.includes("CRITICAL")) {
              console.log("Scan error: ", lastLine);
              event.reply("scan-error", { message: lastLine });
              mainWindow.show();
              mainWindow.focus();
            } else if (recentLines.includes("Writing scan data to file")) {
              console.log("Scan complete: ", lastLine);

              // parse failed discs from log for display in UI
              const failedDiscs = lines
                .filter((line) => line.includes("ERROR") && line.includes("failed validation"))
                .map((line) => {
                  const set = line.match(/Set: ([^|]+)/)?.[1]?.trim() ?? "Unknown";
                  const partition = line.match(/Partition: ([^|]+)/)?.[1]?.trim() ?? "?";
                  const mainStat = line.match(/Main Stat: ([^|]+)/)?.[1]?.trim() ?? "?";
                  const level = line.match(/Level: ([^|]+)/)?.[1]?.trim() ?? "?";
                  const reason = line.match(/skipping: ([^|]+)/)?.[1]?.trim() ?? "Unknown error";
                  return { set, partition, mainStat, level, reason };
                });

              event.reply("scan-complete", { message: lastLine, failedDiscs });
              mainWindow.show();
              mainWindow.focus();
              shell.showItemInFolder(pathToScanOutput + "/scan_data.json");
            }
          }
        });
      }
    });
  }, 3000); //wait 3 seconds for the scanner to create the log file
});
