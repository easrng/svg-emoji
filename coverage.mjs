import { execSync } from "node:child_process";
import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import emojisArr from "@unicode/unicode-17.0.0/Sequence_Property/RGI_Emoji/index.js";
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
    const needed = [...emojis.difference(covered)];
    console.log(
        `${covered.size} / ${emojis.size} emojis are supported`, /*\nmissing:`,
        needed.map((e) => "\n - " + e).join(""),*/
    );
    let i = 0;
    for (const emoji of needed) {
        console.log(emoji, Math.floor(((i++) / needed.length) * 100));
        const name = "emoji_u" + [...emoji].map((e) =>
            e.codePointAt(0).toString(16).padStart(4, "0")
        ).join("_") + ".svg";
        if (existsSync(`noto/${name}`)) {
            execSync(`~/.cargo/bin/usvg --quiet noto/${name} usvg/${name}`, {
                shell: false,
                stdio: "inherit",
            });
        } else {
            const notoname = "emoji_u" + [...emoji].filter((e) =>
                e !== "\ufe0f"
            ).map((e) => e.codePointAt(0).toString(16).padStart(4, "0")).join(
                "_",
            ) + ".svg";

            execSync(
                `~/.cargo/bin/usvg --quiet noto/${notoname} usvg/${name}`,
                {
                    shell: false,
                    stdio: "inherit",
                },
            );
            execSync(
                `~/.cargo/bin/usvg --quiet noto/${notoname} usvg/${notoname}`,
                {
                    shell: false,
                    stdio: "inherit",
                },
            );
        }
    }
}
