import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { createPost, slugify } from './post-service.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

function mimeFromName(filename) {
  const extension = path.extname(filename).toLowerCase();
  return {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
  }[extension];
}

async function loadImage(filename) {
  const name = filename.trim();
  if (!name) return null;
  const mimeType = mimeFromName(name);
  if (!mimeType) throw new Error(`Formato de imagen no permitido: ${name}`);
  const data = await fsp.readFile(path.resolve(process.cwd(), name));
  return { name: path.basename(name), mimeType, base64: data.toString('base64') };
}

async function main() {
  console.log('\n🚀 Creador de posts de SolarisPKN Labs\n');
  console.log('Consejo: para una experiencia visual, ejecutá abrir-editor-posts.cmd\n');

  const title = (await question('📝 Título en español: ')).trim();
  const requestedSlug = (await question('🔑 Slug (vacío = automático): ')).trim();
  const description = (await question('📄 Descripción corta (ES): ')).trim();
  const tags = await question('🏷️ Etiquetas separadas por comas: ');
  const category = await question('📂 Categoría: ');
  const englishEnabled = (await question('🌍 ¿Publicar también en inglés? (y/n): ')).trim().toLowerCase() === 'y';

  let titleEn = '';
  let descriptionEn = '';
  if (englishEnabled) {
    titleEn = await question('📝 Título en inglés: ');
    descriptionEn = await question('📄 Descripción corta (EN): ');
  }

  const heroName = await question('🖼️ Ruta local de la portada (opcional): ');
  const galleryNames = (await question('📸 Rutas adicionales, separadas por comas (opcional): '))
    .split(',').map((value) => value.trim()).filter(Boolean);
  const slug = slugify(requestedSlug || title);
  const hero = await loadImage(heroName);
  const gallery = await Promise.all(galleryNames.map(loadImage));

  const contentEs = `> ${description}\n\nEscribí acá el contenido en español. Podés usar **Markdown**, listas, enlaces y bloques de código.\n\n## Primer apartado\n\nDesarrollá la idea desde acá.\n`;
  const contentEn = `> ${descriptionEn}\n\nWrite the English content here. You can use **Markdown**, lists, links, and code blocks.\n\n## First section\n\nDevelop the idea from here.\n`;

  const result = await createPost({
    slug,
    date: new Date().toISOString().slice(0, 10),
    category,
    tags,
    spanish: { title, description, content: contentEs },
    english: { enabled: englishEnabled, title: titleEn, description: descriptionEn, content: contentEn },
    hero,
    gallery,
  });

  console.log('\n🎉 Post creado sin sobrescribir archivos existentes.');
  for (const url of result.urls) console.log(`🔗 ${url}`);
  for (const file of result.files) console.log(`✅ ${file}`);
}

main()
  .catch((error) => {
    console.error('\n❌', error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
