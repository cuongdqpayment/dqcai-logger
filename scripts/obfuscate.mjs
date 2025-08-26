// scripts/obfuscate.mjs (Alternative with createRequire)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);
const { glob } = require('glob');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  sourceMap: false,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.5,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  target: 'node'
};

async function obfuscateFiles() {
  try {
    console.log('🔒 Starting code obfuscation...');
    
    const distDir = path.resolve(__dirname, '../dist');
    
    if (!fs.existsSync(distDir)) {
      console.error('❌ Dist directory not found. Please run build first.');
      process.exit(1);
    }

    const jsFiles = await new Promise((resolve, reject) => {
      glob(path.join(distDir, '**/*.{js,cjs}'), (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });

    console.log(`📁 Found ${jsFiles.length} JavaScript files to obfuscate`);

    for (const filePath of jsFiles) {
      try {
        console.log(`🔧 Processing: ${path.relative(distDir, filePath)}`);
        
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        if (!sourceCode.trim()) continue;

        const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, {
          ...obfuscationOptions,
          inputFileName: path.basename(filePath)
        });

        fs.writeFileSync(filePath, obfuscated.getObfuscatedCode(), 'utf8');
        console.log(`✅ Obfuscated: ${path.relative(distDir, filePath)}`);
        
      } catch (error) {
        console.error(`❌ Failed to obfuscate ${filePath}:`, error.message);
      }
    }

    console.log('\n🎉 Obfuscation complete!');
    
  } catch (error) {
    console.error('❌ Obfuscation failed:', error);
    process.exit(1);
  }
}

obfuscateFiles();