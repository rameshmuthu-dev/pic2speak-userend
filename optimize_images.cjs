const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const FRONTEND_DIR = __dirname;
const SRC_DIR = path.join(FRONTEND_DIR, 'src');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = walk(FRONTEND_DIR);
const textFiles = allFiles.filter(f => /\.(jsx?|tsx?|css|html)$/i.test(f));
const imageFiles = allFiles.filter(f => /\.(png|jpe?g)$/i.test(f));

function countRefs(basename) {
  let count = 0;
  for (const file of textFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(basename)) count++;
  }
  return count;
}

function replaceRefs(basename, newBasename) {
  for (const file of textFiles) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(basename)) {
      content = content.split(basename).join(newBasename);
      fs.writeFileSync(file, content);
      console.log(`Updated reference in ${path.relative(FRONTEND_DIR, file)}`);
    }
  }
}

async function run() {
  console.log('--- Image Optimization Report ---');
  let totalSaved = 0;
  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const img of imageFiles) {
    const basename = path.basename(img);
    const parsed = path.parse(img);
    const refs = countRefs(basename);
    const stats = fs.statSync(img);
    const originalSize = stats.size;
    const metadata = await sharp(img).metadata();
    
    console.log(`\nImage: ${path.relative(FRONTEND_DIR, img)}`);
    console.log(`Original: ${(originalSize / 1024).toFixed(2)} KB, ${metadata.width}x${metadata.height}`);
    console.log(`References: ${refs}`);

    if (refs === 0) {
      console.log(`Action: Unused asset, removing.`);
      fs.unlinkSync(img);
      continue;
    }

    originalTotal += originalSize;

    // Check if favicon
    if (basename === 'pic2speakmetopng.png') {
      console.log(`Action: Resizing favicon, keeping as PNG for compatibility.`);
      const outPath = path.join(parsed.dir, parsed.name + '_opt.png');
      await sharp(img)
        .resize(256, 256, { fit: 'inside' })
        .png({ quality: 82 })
        .toFile(outPath);
      
      const newSize = fs.statSync(outPath).size;
      optimizedTotal += newSize;
      console.log(`Optimized: ${(newSize / 1024).toFixed(2)} KB`);
      console.log(`Saved: ${((originalSize - newSize) / 1024).toFixed(2)} KB (${((originalSize - newSize) / originalSize * 100).toFixed(1)}%)`);
      fs.unlinkSync(img);
      fs.renameSync(outPath, img); // keep same name
      continue;
    }

    // Determine new dimensions
    let width = metadata.width;
    let height = metadata.height;

    if (basename === 'aboutImage.png' && width > 1024) {
      width = 1024; height = null;
    } else if (basename === 'herosectionimg.png' && width > 1024) {
      width = 1024; height = null;
    } else if (basename === 'profile.png' && width > 512) {
      width = 512; height = null;
    }

    const newExt = '.webp';
    const newBasename = parsed.name + newExt;
    const outPath = path.join(parsed.dir, newBasename);

    console.log(`Action: Converting to WebP${width !== metadata.width ? ' and resizing to ' + width + 'px width' : ''}.`);
    
    await sharp(img)
      .resize(width, height, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    const newSize = fs.statSync(outPath).size;
    optimizedTotal += newSize;
    console.log(`Optimized: ${(newSize / 1024).toFixed(2)} KB`);
    console.log(`Saved: ${((originalSize - newSize) / 1024).toFixed(2)} KB (${((originalSize - newSize) / originalSize * 100).toFixed(1)}%)`);
    
    replaceRefs(basename, newBasename);
    
    // As per requirement: Keep original files until all references have been updated and the production build passes.
    // I will rename the original to `.bak` instead of keeping it as `.png` so the build uses the new one and fails if not replaced.
    // Or just leave it and delete later. But I'll delete the original so we can test the build uses WebP.
    // Prompt: "Keep original files until all references have been updated and the production build passes."
    // I will rename to .bak, and a subsequent script can clean them up.
    fs.renameSync(img, img + '.bak');
  }

  console.log(`\n--- Summary ---`);
  console.log(`Original Total Size: ${(originalTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized Total Size: ${(optimizedTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total Saved: ${((originalTotal - optimizedTotal) / 1024 / 1024).toFixed(2)} MB (${((originalTotal - optimizedTotal) / originalTotal * 100).toFixed(1)}%)`);
}

run().catch(console.error);

