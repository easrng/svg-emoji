import emojisArr from "@unicode/unicode-17.0.0/Sequence_Property/RGI_Emoji/index.js";
import { readdirSync } from "node:fs";
const emojis = new Set(emojisArr);
const covered = new Set(
    readdirSync("usvg").map((e) =>
        String.fromCodePoint(
            ...e.replace(/^emoji_u|\.svg$/g, "").split("_").map((e) =>
                parseInt(e, 16)
            ),
        )
    ),
);
if (!emojis.isSupersetOf(covered)) {
    console.log("non-rgi emojis:", covered.difference(emojis));
}
if (!covered.isSupersetOf(emojis)) {
    console.log(
        `${covered.size} / ${emojis.size} emojis are supported\nmissing:`,
        [...emojis.difference(covered)].map((e) => "\n - " + e).join(""),
    );
}
