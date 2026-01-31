// Support multiple possible module shapes for the parser across versions
let Parser;
try {
  const ddlModule = require('@yued/sql-ddl-to-json-schema');
  Parser = ddlModule.Parser || (ddlModule.default && ddlModule.default.Parser) || ddlModule;
} catch (_) {
  try {
    const ddlLegacy = require('sql-ddl-to-json-schema');
    Parser = ddlLegacy.Parser || (ddlLegacy.default && ddlLegacy.default.Parser) || ddlLegacy;
  } catch (e) {
    // Will be handled at runtime if Parser remains undefined
  }
}
const puppeteer = require('puppeteer');

// Helpers to normalize parser outputs across versions
function toTypeString(type) {
  if (typeof type === 'string') return type;
  if (!type) return '';
  if (typeof type === 'object') {
    const pieces = [type.type, type.datatype, type.dataType, type.name];
    return pieces.filter(Boolean).join(' ') || JSON.stringify(type);
  }
  return String(type);
}


function normalizeToTables(schema) {
  if (!schema) return [];
  if (schema.tables && Array.isArray(schema.tables)) {
    return schema.tables.map(t => {
      const name = t.name || t.tableName || (t.table && t.table.name);
      const columns = (t.columns || t.column || (t.table && t.table.columns) || []).map(c => ({
        name: c.name || c.columnName || (c.column && c.column.name),
        type: toTypeString(c.type || c.datatype || (c.definition && c.definition.dataType) || (c.column && c.column.type))
      }));
      const fks = extractForeignKeysFromStatement(t) || [];
      return { name, columns, foreignKeys: fks };
    });
  }
  if (Array.isArray(schema)) {
    const tables = [];
    schema.forEach(stmt => {
      const name = stmt.name || stmt.tableName || (stmt.table && stmt.table.name);
      const cols = (stmt.columns || stmt.column || (stmt.definition && stmt.definition.columns) || (stmt.table && stmt.table.columns) || [])
        .map(c => ({
          name: c.name || c.columnName || (c.column && c.column.name),
          type: toTypeString(c.type || c.datatype || (c.definition && c.definition.dataType) || (c.column && c.column.type))
        }));
      const fks = extractForeignKeysFromStatement(stmt) || [];
      if (name && cols.length) tables.push({ name, columns: cols, foreignKeys: fks });
    });
    return tables;
  }
  return [];
}


function extractForeignKeysFromStatement(stmt) {
  const fks = [];
  const pushFk = (from, toTable, toColumn) => {
    if (from && toTable) fks.push({ from, toTable, toColumn });
  };
  const columns = stmt.columns || stmt.column || (stmt.definition && stmt.definition.columns) || (stmt.table && stmt.table.columns) || [];
  columns.forEach(c => {
    const from = c.name || c.columnName;
    const ref = c.references || c.reference || c.foreign || (c.definition && (c.definition.references || c.definition.reference));
    if (ref) {
      const toTable = ref.table || ref.tableName || (ref.reference && (ref.reference.table || ref.reference.tableName));
      const toColumn = (ref.column || ref.columnName || (Array.isArray(ref.columns) && ref.columns[0])) || undefined;
      pushFk(from, toTable, toColumn);
    }
  });
  const constraints = stmt.constraints || stmt.constraint || stmt.foreignKeys || [];
  (constraints || []).forEach(k => {
    const from = (k.columns && k.columns[0]) || k.column || k.columnName || k.from;
    const ref = k.references || k.reference || k.ref || {};
    const toTable = ref.table || ref.tableName || k.toTable;
    const toColumn = (ref.columns && ref.columns[0]) || ref.column || k.toColumn;
    pushFk(from, toTable, toColumn);
  });
  return fks;
}


function extractForeignKeysFromSql(sql) {
  const tableToFks = {};
  const tableRe = /CREATE\s+TABLE\s+[`"]?(\w+)[`"]?\s*\(([\s\S]*?)\)\s*;/gi;
  let m;
  while ((m = tableRe.exec(sql)) !== null) {
    const tableName = m[1];
    const body = m[2];
    const fks = [];
    const fkRe = /FOREIGN\s+KEY\s*\(([^\)]+)\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*\(([^\)]+)\)/gi;
    let fk;
    while ((fk = fkRe.exec(body)) !== null) {
      const fromCol = fk[1].split(',')[0].replace(/[`"\s]/g, '');
      const toTable = fk[2];
      const toCol = fk[3].split(',')[0].replace(/[`"\s]/g, '');
      fks.push({ from: fromCol, toTable, toColumn: toCol });
    }
    if (fks.length) tableToFks[tableName.toLowerCase()] = fks;
  }
  return tableToFks;
}


function sanitizeName(name) {
  if (!name) return 'unnamed';
  return String(name).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}


function generateMermaidER(tables) {
  if (!tables || tables.length === 0) return 'erDiagram\n';
  
  let mermaid = 'erDiagram\n';
  
  const mapToMermaidType = (raw) => {
    const t = toTypeString(raw).toLowerCase();
    if (t.includes('int')) return 'INT';
    if (t.includes('number')) return 'INT';
    if (t.includes('char') || t.includes('text') || t.includes('string')) return 'string';
    if (t.includes('bool')) return 'boolean';
    if (t.includes('date') || t.includes('time')) return 'datetime';
    if (t.includes('decimal') || t.includes('numeric') || t.match(/\bdouble|float\b/)) return 'float';
    return 'string';
  };
  
  const sanitizedTables = tables.map(t => ({
    ...t,
    sanitizedName: sanitizeName(t.name),
    originalName: t.name
  }));
  
  sanitizedTables.forEach(table => {
    const tableName = table.sanitizedName;
    mermaid += `    ${tableName} {\n`;
    table.columns.forEach(col => {
      const typeStr = toTypeString(col.type).toLowerCase();
      const mType = mapToMermaidType(typeStr);
      let attribute = sanitizeName(col.name) || 'column';
      
      const isPK = typeStr.includes('primary key') || typeStr.includes('auto_increment') || 
                   typeStr.includes('autoincrement') || col.name.toLowerCase().includes('id') && 
                   (typeStr.includes('int') || typeStr.includes('serial'));
      
      if (isPK) {
        attribute = `${mType} ${attribute} PK`;
      } else {
        attribute = `${mType} ${attribute}`;
      }
      
      mermaid += `        ${attribute}\n`;
    });
    mermaid += '    }\n';
  });
  
  sanitizedTables.forEach(src => {
    (src.foreignKeys || []).forEach(fk => {
      const tgt = sanitizedTables.find(t => {
        if (!t.originalName || !fk.toTable) return false;
        return t.originalName.toLowerCase() === String(fk.toTable).toLowerCase();
      });
      if (tgt && src.sanitizedName && tgt.sanitizedName) {
        // Use proper Mermaid ER relationship syntax: }o--|| for one-to-many
        const relName = sanitizeName(fk.from || 'references');
        mermaid += `    ${src.sanitizedName} }o--|| ${tgt.sanitizedName} : "${relName}"\n`;
      }
    });
  });
  
  return mermaid;
}

// Chen-style attributes-as-ovals using Mermaid flowchart
function generateChenMermaid(tables) {
  let m = 'graph TD\n';
  m += '  classDef entity fill:#eef,stroke:#36f,stroke-width:2px;\n';
  m += '  classDef attr fill:#fff,stroke:#999,stroke-width:1.5px;\n';
  m += '  classDef pk fill:#fff,stroke:#090,stroke-width:2px;\n';
  tables.forEach((t, ti) => {
    const entityId = `E${ti}`;
    m += `  ${entityId}["${t.name}"]:::entity\n`;
    (t.columns || []).forEach((c, ci) => {
      const name = c.name || 'attr';
      const typeStr = toTypeString(c.type).toLowerCase();
      const attrId = `${entityId}_A${ci}`;
      // Circles using (( )) ; mark PK with class pk
      m += `  ${attrId}(("${name}")):::attr\n`;
      m += `  ${entityId} --- ${attrId}\n`;
      if (typeStr.includes('primary key')) {
        m += `  class ${attrId} pk;\n`;
      }
    });
  });
  return m;
}

// Function to escape HTML special characters
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Function to generate PDF from Mermaid diagram
async function generatePDF(mermaidCode, diagramType = 'er') {
  let browser;
  try {
    // Try to find Chrome executable
    const launchOptions = { 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    
    // Try to find Chrome executable
    // Puppeteer should automatically find Chrome if installed via 'npx puppeteer browsers install chrome'
    // But we'll also check for system Chrome as fallback
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    // Check Puppeteer cache location first
    const puppeteerCache = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
    if (fs.existsSync(puppeteerCache)) {
      // Find chrome.exe in the cache directory
      const findChrome = (dir) => {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              const result = findChrome(fullPath);
              if (result) return result;
            } else if (file === 'chrome.exe') {
              return fullPath;
            }
          }
        } catch (e) {
          // Ignore errors
        }
        return null;
      };
      const chromePath = findChrome(puppeteerCache);
      if (chromePath) {
        launchOptions.executablePath = chromePath;
      }
    }
    
    // Fallback to system Chrome if not found in cache
    if (!launchOptions.executablePath) {
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          launchOptions.executablePath = chromePath;
          break;
        }
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // Escape the Mermaid code properly
    const escapedCode = escapeHtml(mermaidCode);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            padding: 20px;
          }
          .mermaid { 
            text-align: center; 
            min-height: 400px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          h1 {
            text-align: center;
            color: #2563eb;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <h1>${diagramType === 'er' ? 'Entity Relationship Diagram' : 'Database Schema Diagram'}</h1>
        <div class="mermaid">
          ${escapedCode}
        </div>
        <script>
          mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            er: {
              entityPadding: 15,
              fill: '#fff2cc',
              fontSize: 12
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for Mermaid to render with multiple attempts
    let attempts = 0;
    const maxAttempts = 15;
    while (attempts < maxAttempts) {
      try {
        await page.waitForSelector('.mermaid svg', { timeout: 5000 });
        // Additional wait to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      } catch (e) {
        attempts++;
        if (attempts >= maxAttempts) {
          // Try to get any error message from the page
          const errorMsg = await page.evaluate(() => {
            const errorEl = document.querySelector('.mermaid .error');
            return errorEl ? errorEl.textContent : 'Mermaid diagram did not render in time';
          }).catch(() => 'Mermaid diagram did not render in time');
          throw new Error(errorMsg);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      preferCSSPageSize: true
    });
    
    await browser.close();
    return pdf;
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    throw error;
  }
}

exports.toER = async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ message: 'No SQL input' });

    if (!Parser) {
      return res.status(500).json({ message: 'Parser not available', error: 'DDL parser module could not be loaded' });
    }
    const parser = new Parser('mysql');
    const fed = parser.feed(sql);
    const raw = typeof fed.toCompactJson === 'function' ? fed.toCompactJson() : (typeof fed.toJsonSchema === 'function' ? fed.toJsonSchema() : fed);
    const tables = normalizeToTables(raw);
    // Enrich with FK info parsed directly from SQL as fallback
    const fkByTable = extractForeignKeysFromSql(sql);
    tables.forEach(t => {
      const extra = fkByTable[(t.name || '').toLowerCase()];
      if (extra && (!t.foreignKeys || !t.foreignKeys.length)) {
        t.foreignKeys = extra;
      }
    });
    
    // Generate Mermaid ER diagram
    const mermaidDiagram = generateMermaidER(tables);
    const chenDiagram = generateChenMermaid(tables);
    
    res.json({ 
      er: tables,
      mermaid: mermaidDiagram,
      chen: chenDiagram,
      visual: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Error parsing SQL', error: err.message });
  }
};

exports.toSQL = async (req, res) => {
  try {
    const { er } = req.body;
    if (!er) return res.status(400).json({ message: 'No ER input' });

    let erData = typeof er === 'string' ? JSON.parse(er) : er;
    let sql = '';

    erData.forEach((table) => {
      sql += `CREATE TABLE ${table.name} (\n`;
      table.columns.forEach((col, i) => {
        sql += `  ${col.name} ${col.type}${i < table.columns.length - 1 ? ',' : ''}\n`;
      });
      sql += `);\n\n`;
    });

    res.json({ sql });
  } catch (err) {
    res.status(500).json({ message: 'Error converting ER', error: err.message });
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const { mermaid, type = 'er' } = req.body;
    if (!mermaid) return res.status(400).json({ message: 'No Mermaid diagram provided' });

    const pdf = await generatePDF(mermaid, type);
    
    const filename = type === 'er' ? 'er-diagram.pdf' : 
                     type === 'attributes' ? 'attributes-diagram.pdf' : 
                     'table-diagram.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ 
      message: 'Error generating PDF', 
      error: err.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.downloadTablePDF = async (req, res) => {
  try {
    const { html, sql } = req.body;
    if (!html && !sql) return res.status(400).json({ message: 'No content provided' });

    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();
      
      const content = html || `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; }
            h1 { color: #2563eb; }
            pre { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Database Schema - SQL</h1>
          <pre>${(sql || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
        </html>
      `;
      
      await page.setContent(content, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="table-schema.pdf"');
      res.send(pdf);
    } catch (error) {
      if (browser) await browser.close();
      throw error;
    }
  } catch (err) {
    console.error('Table PDF generation error:', err);
    res.status(500).json({ 
      message: 'Error generating table PDF', 
      error: err.message || 'Unknown error occurred'
    });
  }
};
