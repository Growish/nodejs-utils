import { loggerCloud } from "../src/index.js";

const tag = "cloudCTRL";
loggerCloud.info("Questo è un test per la modalità cloud!", { tag });
loggerCloud.error("Questo è un test per la modalità cloud!", { tag });
loggerCloud.debug("Questo è un test per la modalità cloud!", { tag });