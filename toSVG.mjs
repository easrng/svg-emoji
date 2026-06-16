import renderSvg from "lottie-to-svg";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { unzipSync } from "node:zlib";
import { JSDOM } from "jsdom";
import { optimize } from "svgo";
import { execSync } from "node:child_process";

/**
 * Parses an SVG string, inlines <use href="#..."> elements (strictly no other attributes),
 * runs SVGO, and returns the optimized SVG string.
 *
 * @param {string} svgString - The input SVG string.
 * @returns {string} - The optimized SVG string with inlined references.
 */
function inlineSvgUse(svgString) {
  const dom = new JSDOM(svgString, { contentType: "image/svg+xml" });
  const document = dom.window.document;

  // Loop until all <use> elements are resolved (handles nested <use> cases)
  let useElements;
  while ((useElements = document.querySelectorAll("use")).length > 0) {
    const use = useElements[0];

    // Strictly enforce that "href" is the ONLY attribute
    for (const attr of use.attributes) {
      if (attr.name !== "href") {
        throw new Error(
          `Invalid attribute "${attr.name}" on <use>. Only "href" is allowed.`,
        );
      }
    }

    const href = use.getAttribute("href");
    if (!href || !href.startsWith("#")) {
      throw new Error(
        `<use> element must have an href attribute starting with "#". Got: "${href}"`,
      );
    }

    const id = href.slice(1);
    const target = document.getElementById(id);

    if (!target) {
      throw new Error(`Target element with id="${id}" not found in the SVG.`);
    }

    // Basic copypaste: clone the target and replace the <use> element
    const clone = target.cloneNode(true);
    use.replaceWith(clone);
  }

  /*const badClipPaths = document.querySelectorAll(
    `clipPath > rect[width="512"][height="512"][x="0"][y="0"], clipPath > path[d="M0,0 L512,0 L512,512 L0,512z"], clipPath > path[d="M0,0 L1024,0 L1024,512 L0,512z"]`,
  );
  for (const badClipPath of badClipPaths) {
    for (
      const ele of document.querySelectorAll(
        `[clip-path="url(#${badClipPath.parentElement.id})"]`,
      )
    ) {
      ele.removeAttribute("clip-path");
    }
  }*/

  for (const ele of document.querySelectorAll(`[style="display: none;"]`)) {
    ele.remove();
  }

  // JSDOM wraps the SVG in an HTML document, so we extract just the <svg> element
  const svgElement = document.querySelector("svg");
  if (!svgElement) {
    throw new Error("No <svg> element found in the provided string.");
  }

  const inlinedSvgString = svgElement.outerHTML;
  return inlinedSvgString;

  // Run SVGO to clean up the resulting SVG (e.g., removing duplicate IDs created by cloning)
  const result = optimize(inlinedSvgString);

  return result.data;
}
mkdirSync("svg", { recursive: true });
mkdirSync("usvg", { recursive: true });
for (const file of readdirSync("stickers")) {
  let name;
  try {
    name = "emoji_u" +
      [...(file.replace(/_\w/, "\uFE0F")).match(/\p{RGI_Emoji}/v)[0]].map(
        (e) => e.codePointAt(0).toString(16),
      ).join("_") + ".svg";
  } catch (e) {
    console.error(file);
    throw e;
  }
  if (existsSync("svg/" + name)) {
    continue;
  }
  console.log(file);
  const svgStr = inlineSvgUse(
    await renderSvg(
      JSON.parse(unzipSync(readFileSync("stickers/" + file)).toString()),
    ),
  );
  writeFileSync(
    "svg/" + name,
    svgStr,
  );
  execSync(`~/.cargo/bin/usvg --quiet svg/${name} usvg/${name}`, {
    shell: false,
    stdio: "inherit",
  });
}
