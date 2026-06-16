const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PNG } = require("pngjs");
const { default: pixelmatch } = require("pixelmatch");

// --- Configuration ---
const FOLDER_ORIGINAL = "./svg"; // The base truth SVGs
const FOLDER_MODIFIED_A = "./usvg"; // First modified version
const FOLDER_MODIFIED_B = "./build/picosvg/clipped"; // Second modified version
const DIFF_FOLDER = "./diffs"; // Where visual diffs are saved

// Tolerance for pixel matching (0 = exact match, 1 = everything matches)
const PIXEL_THRESHOLD = 0.1;

// Helper to clear the current terminal line and write progress
function updateProgress(text) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(text);
}

// Helper to rasterize an SVG to a specific width/height
async function rasterizeSvg(filePath, width, height) {
    return sharp(filePath)
        .resize(width, height, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .raw()
        .toBuffer();
}

// Helper to perform the diff and save if bad
async function compareAndSaveDiff(
    originalRaw,
    modifiedRaw,
    width,
    height,
    file,
    suffix,
) {
    const diffBuffer = Buffer.alloc(width * height * 4);
    const mismatchedPixels = pixelmatch(
        originalRaw,
        modifiedRaw,
        diffBuffer,
        width,
        height,
        {
            threshold: PIXEL_THRESHOLD,
        },
    );

    if (mismatchedPixels > 0) {
        console.error(
            `ERROR: "${file}" differs in ${suffix} by ${mismatchedPixels} pixels`,
        );

        const diffPng = new PNG({ width, height });
        diffBuffer.copy(diffPng.data);

        // Save as PNG with suffix (e.g., icon_diff_A.png, icon_diff_B.png)
        const diffFileName = file.replace(".svg", `_diff_${suffix}.png`);
        const diffFilePath = path.join(DIFF_FOLDER, diffFileName);
        fs.writeFileSync(diffFilePath, PNG.sync.write(diffPng));

        return true; // Indicates an error was found
    }
    return false;
}

async function diffSvgs() {
    if (!fs.existsSync(DIFF_FOLDER)) {
        fs.mkdirSync(DIFF_FOLDER, { recursive: true });
    }

    const files = fs.readdirSync(FOLDER_ORIGINAL).filter((file) =>
        file.endsWith(".svg")
    );
    const totalFiles = files.length;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progressText = `Progress: ${
            i + 1
        }/${totalFiles} | Processing: ${file}`;
        updateProgress(progressText);

        const fileOrig = path.join(FOLDER_ORIGINAL, file);
        const fileA = path.join(FOLDER_MODIFIED_A, file);
        const fileB = path.join(FOLDER_MODIFIED_B, file);

        // Check for missing files
        let hasError = false;
        if (!fs.existsSync(fileA)) {
            console.error(`\nERROR: "${file}" missing in Modified A`);
            hasError = true;
        }
        if (!fs.existsSync(fileB)) {
            console.error(`\nERROR: "${file}" missing in Modified B`);
            hasError = true;
        }
        if (hasError) {
            errorCount++;
            continue;
        }

        try {
            // 1. Get max dimensions across all 3 versions
            const metaOrig = await sharp(fileOrig).metadata();
            const metaA = await sharp(fileA).metadata();
            const metaB = await sharp(fileB).metadata();

            const width = Math.max(metaOrig.width, metaA.width, metaB.width);
            const height = Math.max(
                metaOrig.height,
                metaA.height,
                metaB.height,
            );

            // 2. Rasterize all 3 versions
            const rawOrig = await rasterizeSvg(fileOrig, width, height);
            const rawA = await rasterizeSvg(fileA, width, height);
            const rawB = await rasterizeSvg(fileB, width, height);

            // 3. Diff Original vs A
            const diffA = await compareAndSaveDiff(
                rawOrig,
                rawA,
                width,
                height,
                file,
                "A",
            );
            if (diffA) errorCount++;

            // 4. Diff Original vs B
            const diffB = await compareAndSaveDiff(
                rawOrig,
                rawB,
                width,
                height,
                file,
                "B",
            );
            if (diffB) errorCount++;
        } catch (err) {
            console.error(
                `\nERROR: Failed to process "${file}" - ${err.message}`,
            );
            errorCount++;
        }
    }

    // Clear the progress line completely when done
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);

    if (errorCount === 0) {
        console.log(`✅ All ${totalFiles} SVGs visually match the original.`);
    } else {
        console.log(
            `❌ Finished with ${errorCount} visual difference(s) found. Check the ${DIFF_FOLDER} directory.`,
        );
    }
}

diffSvgs();
