import { logger } from "../src/index.js";

const tag = "localCTRL";
logger.info("Questo è un test di retrocompatibilità!", { tag });
logger.error("Questo è un test di retrocompatibilità!", { tag });
logger.debug("Questo è un test di retrocompatibilità!", { tag });