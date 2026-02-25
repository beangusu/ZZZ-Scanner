import { Icon } from "@iconify/react";
import React from "react";
import { useAtom } from "jotai";
import Drawer from "react-modern-drawer";

import { discScanAtom, pageLoadAtom, keepImagesAtom } from "../atoms";

//Drawer Styles
import "react-modern-drawer/dist/index.css";
//CRT Styles
import crtStyles from "../styles/crt.module.css";

export function SettingsDrawer() {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);

  const [discScanSpeed, setDiscScanSpeed] = useAtom(discScanAtom);
  const handleDiscScanSpeedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDiscScanSpeed(parseFloat(event.target.value));
  };

  const [pageLoadSpeed, setPageLoadSpeed] = useAtom(pageLoadAtom);
  const handlePageLoadSpeedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageLoadSpeed(parseInt(event.target.value));
  };

  const [keepImages, setKeepImages] = useAtom(keepImagesAtom);

  return (
    <>
      <button onClick={toggleSettings}>
        <Icon
          icon="eos-icons:rotating-gear"
          width={32}
          height={32}
          className=" animate-spin ease-in fixed top-0 right-0 m-4"
          style={{ animationDuration: "15s" }}
        ></Icon>
      </button>
      <Drawer
        open={isSettingsOpen}
        onClose={toggleSettings}
        direction="right"
        className="settingsDrawer"
        customIdSuffix="settings"
        overlayOpacity={0}
        size={300}
      >
        <div className={crtStyles.crt}></div>
        <div className="w-full h-full bg-background flex flex-col items-center border-l-2 border-white bg-black">
          <span className="text-xl font-DOS my-6">Settings</span>
          <span className=" text-base font-DOS my-0">Disc Scan Speed</span>
          <input
            type="range"
            min="0.25"
            max="1"
            defaultValue="0.25"
            className="range m-4 max-w-[200px] w-full"
            step="0.25"
            onChange={handleDiscScanSpeedChange}
          />
          <div className="flex w-full justify-between px-2 text-xs max-w-[250px] mb-8">
            <span>0.25s</span>
            <span>0.5s</span>
            <span>0.75s</span>
            <span>1s</span>
          </div>
          <span className=" text-base font-DOS my-0">Page Load Speed</span>
          <input
            type="range"
            min="1"
            max="5"
            defaultValue="2"
            className="range m-4 max-w-[200px] w-full"
            step="1"
            onChange={handlePageLoadSpeedChange}
          />
          <div className="flex w-full justify-between px-2 text-xs max-w-[200px] mb-8">
            <span>1s</span>
            <span>2s</span>
            <span>3s</span>
            <span>4s</span>
            <span>5s</span>
          </div>

          {/* debug mode toggle */}
          <div className="flex flex-col items-center mt-4 px-4 w-full">
            <div className="w-full border-t border-white border-opacity-20 mb-4" />
            <span className="text-base font-DOS mb-3">Debug</span>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
                checked={keepImages}
                onChange={(e) => setKeepImages(e.target.checked)}
              />
              <span className="text-xs font-DOS text-gray-300 text-left">
                Keep Scan Images
              </span>
            </label>
            {keepImages && (
              <span className="text-xs font-DOS text-yellow-400 mt-2 text-center px-2">
                Scan images will be saved to scan_input/ after scanning
              </span>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
}
