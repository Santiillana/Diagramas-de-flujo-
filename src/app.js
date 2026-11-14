import { initNavigation } from "./ui/navigation.js";
import { initPreferences } from "./ui/preferences.js";
import { initContentViews } from "./ui/content-view.js";
import { initSimulator } from "./ui/simulator.js";
import { initSimulatorPanels } from "./ui/simulator-panels.js";
import { initLab } from "./ui/lab.js";
import { initBuilder } from "./ui/builder.js";
import { initSymbolGuide } from "./ui/symbol-guide.js";

initNavigation();
initPreferences();
initSymbolGuide();
initContentViews();
initSimulator();
initSimulatorPanels();
initLab();
initBuilder();
