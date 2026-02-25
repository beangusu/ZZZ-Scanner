import React from "react";
import Head from "next/head";

import crtStyles from "../styles/crt.module.css";
import { TerminalOutput } from "../components/terminalOutput";
import { SettingsDrawer } from "../components/settingsDrawer";
import { ShinyButton } from "../components/shinyButton";
import { useAtom } from "jotai";
import { pageLoadAtom, discScanAtom, keepImagesAtom } from "../atoms";

interface FailedDisc {
  set: string;
  partition: string;
  mainStat: string;
  level: string;
  reason: string;
}

function TextArt({ label, text }) {
  return (
    <pre aria-label={label} className=" font-mono overflow-auto whitespace-pre">
      {text}
    </pre>
  );
}

export default function HomePage() {
  const ZZZ =
    " ________  ________  ________     \n|\\_____  \\|\\_____  \\|\\_____  \\    \n \\|___/  /|\\|___/  /|\\|___/  /|   \n     /  / /    /  / /    /  / /   \n    /  /_/__  /  /_/__  /  /_/__  \n   |\\________\\\\________\\\\________\\\n    \\|_______|\\|_______|\\|_______|";
  const [pageLoad, setPageLoad] = useAtom(pageLoadAtom);
  const [discScan, setDiscScan] = useAtom(discScanAtom);
  const [keepImages] = useAtom(keepImagesAtom);
  const [finalLine, setFinalLine] = React.useState("");
  const [failedDiscs, setFailedDiscs] = React.useState<FailedDisc[]>([]);
  const [scanComplete, setScanComplete] = React.useState(false);

  React.useEffect(() => {
    window.ipc.on("scan-error", (event: { message: string }) => {
      console.log("Scan Error event: ", event);
      setFinalLine(event.message);
      setScanComplete(false);
      setFailedDiscs([]);
    });
    window.ipc.on("scan-complete", (event: { message: string; failedDiscs: FailedDisc[] }) => {
      console.log("Scan complete event: ", event);
      setFinalLine("Scan Complete.");
      setScanComplete(true);
      setFailedDiscs(event.failedDiscs ?? []);
    });
  }, []);

  const handleStartScan = () => {
    console.log("Starting Scan...");
    setScanComplete(false);
    setFailedDiscs([]);
    setFinalLine("");
    window.ipc.send("start-scan", { discScan, pageLoad, keepImages });
  };

  return (
    <React.Fragment>
      <Head>
        <title>ZZZ Disk Drive Scanner</title>
      </Head>
      <div className="flex flex-col w-full h-full items-center justify-center text-2xl text-center">
        <div className={crtStyles.crt}></div>
        <SettingsDrawer />
        <TextArt label={"ZZZ"} text={ZZZ} />
        <span className="text-4xl font-DOS my-4">Scanner</span>
        <ShinyButton text={"Start Scan"} onClick={handleStartScan} />

        {/* failed discs panel; only shown after a completed scan with failures */}
        {scanComplete && failedDiscs.length > 0 && (
          <div className="mt-6 w-full max-w-2xl px-4">
            <span className="font-DOS text-sm text-yellow-400">
              ⚠ {failedDiscs.length} disc{failedDiscs.length > 1 ? "s" : ""} could not be scanned. Refer to the log in scan_output/ for details:
            </span>
            <div className="mt-2 max-h-40 overflow-y-auto border border-yellow-400 border-opacity-40 rounded">
              {failedDiscs.map((disc, i) => (
                <div
                  key={i}
                  className="font-DOS text-xs text-left px-3 py-1 border-b border-white border-opacity-10 last:border-0"
                >
                  <span className="text-yellow-300">
                    [{disc.partition}] {disc.set}
                  </span>
                  <span className="text-gray-400">
                    {" "}— {disc.mainStat}, Lv.{disc.level}
                  </span>
                </div>
              ))}
            </div>
            <span className="font-DOS text-xs text-gray-400 mt-2 block">
              Scan images have been kept in scan_input/ for reference
            </span>
          </div>
        )}

        {scanComplete && failedDiscs.length === 0 && (
          <span className="font-DOS text-sm text-green-400 mt-4">
            ✓ All discs scanned successfully
          </span>
        )}

        <footer className="fixed bottom-0 left-0 p-6 text-xs text-left w-full">
          <TerminalOutput finalLine={finalLine} />
        </footer>
      </div>
    </React.Fragment>
  );
}
