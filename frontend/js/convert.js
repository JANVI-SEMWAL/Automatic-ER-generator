const apiUrl = "http://localhost:5000";

let activeTabKey = 'sql2er';
const SQL_KEYWORDS = [
  'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL',
  'ON', 'UPDATE', 'DELETE', 'CONSTRAINT', 'INDEX', 'AUTO_INCREMENT', 'INT', 'VARCHAR',
  'BOOLEAN', 'DATE', 'TIMESTAMP', 'DECIMAL', 'CHAR', 'TEXT', 'ALTER'
];
const downloadPdfBtn = document.getElementById('downloadPDF');
const downloadImageBtn = document.getElementById('downloadImage');

window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  fetch(`${apiUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(u => {
      if (u && u.username) {
        const welcome = document.getElementById('welcomeName');
        if (welcome) welcome.textContent = `Hi, ${u.username}`;
      }
    })
    .catch(() => {});

  const last = localStorage.getItem('activeTab') || 'sql2er';
  activateTab(last);
  requestAnimationFrame(() => positionSlider(last));

  updateSqlKeywords('');
  renderErRuleTable([]);
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

function activateTab(key) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const activePane = document.getElementById(`tab-${key}`);
  if (activePane) activePane.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const currentBtn = document.querySelector(`.tab-btn[data-tab="${key}"]`);
  if (currentBtn) currentBtn.classList.add('active');

  activeTabKey = key;
  localStorage.setItem('activeTab', key);
  positionSlider(key);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

function positionSlider(key) {
  const btn = document.querySelector(`.tab-btn[data-tab="${key}"]`);
  const slider = document.querySelector('.tab-slider span');
  const rail = document.querySelector('.tab-slider');
  if (!btn || !slider || !rail) return;
  const rBtn = btn.getBoundingClientRect();
  const rRail = rail.getBoundingClientRect();
  slider.style.left = `${rBtn.left - rRail.left}px`;
  slider.style.width = `${rBtn.width}px`;
}

window.addEventListener('resize', () => positionSlider(activeTabKey));

document.getElementById('convertToER').addEventListener('click', async () => {
  const sql = document.getElementById('sqlInput').value;
  if (!sql.trim()) {
    alert('Please enter SQL statements');
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/api/convert/toER`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ sql }),
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('erOutput').textContent = JSON.stringify(data.er, null, 2);
      updateSqlKeywords(sql);
      renderErRuleTable(data.er || []);

      if (data.mermaid) {
        const visualDiv = document.getElementById('visualER');
        visualDiv.innerHTML = `<div class="mermaid">${data.mermaid}</div>`;
        if (typeof mermaid !== 'undefined') {
          try {
            mermaid.initialize({ startOnLoad: true, theme: 'default' });
            mermaid.init(undefined, visualDiv.querySelector('.mermaid'));
          } catch (err) {
            console.error('Mermaid initialization error:', err);
            // Retry after a short delay
            setTimeout(() => {
              try {
                mermaid.init(undefined, visualDiv.querySelector('.mermaid'));
              } catch (e) {
                console.error('Mermaid retry failed:', e);
              }
            }, 500);
          }
        }

        if (data.chen) {
          const chenDiv = document.getElementById('visualChen');
          chenDiv.innerHTML = `<div class="mermaid">${data.chen}</div>`;
          if (typeof mermaid !== 'undefined') {
            try {
              mermaid.init(undefined, chenDiv.querySelector('.mermaid'));
            } catch (err) {
              console.error('Mermaid Chen initialization error:', err);
              setTimeout(() => {
                try {
                  mermaid.init(undefined, chenDiv.querySelector('.mermaid'));
                } catch (e) {
                  console.error('Mermaid Chen retry failed:', e);
                }
              }, 500);
            }
          }
        }

        if (downloadPdfBtn) {
          downloadPdfBtn.style.display = 'block';
          downloadPdfBtn.onclick = () => {
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.textContent = 'Generating PDF...';
            downloadPDF(data.mermaid, 'er').finally(() => {
              downloadPdfBtn.disabled = false;
              downloadPdfBtn.textContent = 'Download PDF';
            });
          };
        }
        if (downloadImageBtn) {
          downloadImageBtn.style.display = 'block';
          downloadImageBtn.onclick = () => downloadPNG('er');
        }
        
        // Store mermaid and chen diagrams for later use
        window.currentMermaidER = data.mermaid;
        window.currentChenDiagram = data.chen;
        
        // Show download buttons for Attributes View (Chen diagram)
        const chenPdfBtn = document.getElementById('downloadChenPDF');
        const chenPngBtn = document.getElementById('downloadChenPNG');
        
        if (chenPdfBtn && data.chen) {
          chenPdfBtn.style.display = 'block';
          chenPdfBtn.onclick = () => {
            chenPdfBtn.disabled = true;
            chenPdfBtn.textContent = 'Generating PDF...';
            downloadPDF(data.chen, 'attributes').finally(() => {
              chenPdfBtn.disabled = false;
              chenPdfBtn.textContent = 'Download Attributes PDF';
            });
          };
        }
        
        if (chenPngBtn && data.chen) {
          chenPngBtn.style.display = 'block';
          chenPngBtn.onclick = () => downloadPNG('chen');
        }
      }
    } else {
      document.getElementById('erOutput').textContent = `Error: ${data.message}${data.error ? ' - ' + data.error : ''}`;
      document.getElementById('visualER').innerHTML = '';
      document.getElementById('visualChen').innerHTML = '';
      if (downloadPdfBtn) downloadPdfBtn.style.display = 'none';
      if (downloadImageBtn) downloadImageBtn.style.display = 'none';
      const chenPdfBtn = document.getElementById('downloadChenPDF');
      const chenPngBtn = document.getElementById('downloadChenPNG');
      if (chenPdfBtn) chenPdfBtn.style.display = 'none';
      if (chenPngBtn) chenPngBtn.style.display = 'none';
      updateSqlKeywords('');
      renderErRuleTable([]);
    }
  } catch (error) {
    document.getElementById('erOutput').textContent = `Error: ${error.message}`;
    if (downloadPdfBtn) downloadPdfBtn.style.display = 'none';
    if (downloadImageBtn) downloadImageBtn.style.display = 'none';
    const chenPdfBtn = document.getElementById('downloadChenPDF');
    const chenPngBtn = document.getElementById('downloadChenPNG');
    if (chenPdfBtn) chenPdfBtn.style.display = 'none';
    if (chenPngBtn) chenPngBtn.style.display = 'none';
    document.getElementById('visualER').innerHTML = '';
    document.getElementById('visualChen').innerHTML = '';
    updateSqlKeywords('');
    renderErRuleTable([]);
  }
});

// File upload handler
const fileUpload = document.getElementById('fileUpload');
const clearFileBtn = document.getElementById('clearFile');

if (fileUpload) {
  fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const erInput = document.getElementById('erInput');
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      // Read JSON file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          erInput.value = content;
          clearFileBtn.style.display = 'inline-block';
        } catch (error) {
          alert('Error reading JSON file: ' + error.message);
        }
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      // For images, we'll need to process them (OCR or manual input)
      alert('Image upload detected. Please note: Image processing requires manual input. Please describe the ER diagram structure in JSON format in the text area.');
      if (clearFileBtn) clearFileBtn.style.display = 'inline-block';
    }
  });
}

if (clearFileBtn) {
  clearFileBtn.addEventListener('click', () => {
    fileUpload.value = '';
    clearFileBtn.style.display = 'none';
    document.getElementById('erInput').value = '';
  });
}

document.getElementById('convertToSQL').addEventListener('click', async () => {
  const erText = document.getElementById('erInput').value;
  if (!erText.trim()) {
    alert('Please enter ER diagram data or upload a JSON file');
    return;
  }

  try {
    const res = await fetch(`${apiUrl}/api/convert/toSQL`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ er: erText }),
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('sqlOutput').textContent = data.sql || data.message;
      
      // Show download buttons for table diagram
      const er2sqlSection = document.getElementById('tab-er2sql');
      let pdfBtn = er2sqlSection.querySelector('#downloadPDFTable');
      let pngBtn = er2sqlSection.querySelector('#downloadImageTable');
      
      if (!pdfBtn) {
        pdfBtn = document.createElement('button');
        pdfBtn.id = 'downloadPDFTable';
        pdfBtn.textContent = 'Download PDF';
        pdfBtn.className = 'btn';
        pdfBtn.style.background = 'linear-gradient(135deg, #10b981, #22c55e)';
        er2sqlSection.querySelector('.download-actions-table')?.appendChild(pdfBtn) || 
        er2sqlSection.appendChild(pdfBtn);
      }
      
      if (!pngBtn) {
        pngBtn = document.createElement('button');
        pngBtn.id = 'downloadImageTable';
        pngBtn.textContent = 'Download PNG';
        pngBtn.className = 'btn';
        pngBtn.style.background = 'linear-gradient(135deg, #3b82f6, #60a5fa)';
        er2sqlSection.querySelector('.download-actions-table')?.appendChild(pngBtn) || 
        er2sqlSection.appendChild(pngBtn);
      }
      
      pdfBtn.onclick = () => downloadTablePDF(data.sql);
      pngBtn.onclick = () => downloadTablePNG(data.sql);
    } else {
      document.getElementById('sqlOutput').textContent = `Error: ${data.message}`;
    }
  } catch (error) {
    document.getElementById('sqlOutput').textContent = `Error: ${error.message}`;
  }
});

async function downloadPDF(mermaidCode, type = 'er') {
  try {
    if (!mermaidCode || !mermaidCode.trim()) {
      alert('No diagram data available. Please convert SQL first.');
      return;
    }
    
    const res = await fetch(`${apiUrl}/api/convert/downloadPDF`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ mermaid: mermaidCode, type }),
    });

    if (res.ok) {
      const blob = await res.blob();
      
      // Check if response is actually a PDF
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        alert(`Error: ${errorData.message || 'Failed to generate PDF'}\n\nDetails: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'er' ? 'er-diagram.pdf' : 
                   type === 'attributes' ? 'attributes-diagram.pdf' : 
                   'table-diagram.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const data = await res.json();
      alert(`Error: ${data.message || 'Failed to generate PDF'}\n\nDetails: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('PDF download error:', error);
    alert(`Error: ${error.message || 'Failed to download PDF'}\n\nMake sure the backend server is running and Puppeteer is installed.`);
  }
}

function updateSqlKeywords(sql) {
  const container = document.getElementById('sqlKeywordsList');
  if (!container) return;
  const unique = new Set();
  (sql.toUpperCase().match(/\b[A-Z_]+\b/g) || []).forEach(word => {
    if (SQL_KEYWORDS.includes(word)) unique.add(word);
  });
  if (!unique.size) {
    container.innerHTML = '<span class="keyword-pill muted">No keywords detected yet</span>';
    return;
  }
  container.innerHTML = Array.from(unique)
    .sort()
    .map(keyword => `<span class="keyword-pill">${keyword}</span>`)
    .join('');
}

function renderErRuleTable(tables) {
  const body = document.getElementById('erRuleRows');
  if (!body) return;
  const context = buildErContext(Array.isArray(tables) ? tables : []);
  const rows = ER_RULE_DEFINITIONS.map(rule => {
    const detected = rule.compute(context);
    const hasValue = detected && detected.trim().length > 0;
    const safeDetected = hasValue ? detected : 'Not detected in this SQL';
    const cls = hasValue ? 'rule-detected' : 'rule-empty';
    return `
      <tr>
        <td>${rule.component}</td>
        <td>${rule.symbol}</td>
        <td>${rule.detail}</td>
        <td class="${cls}">${safeDetected}</td>
      </tr>
    `;
  }).join('');
  body.innerHTML = rows;
}

function buildErContext(tables) {
  const entities = tables.map(t => t.name).filter(Boolean);
  const allColumns = tables.flatMap(t => (t.columns || []).map(col => ({
    table: t.name,
    name: col.name,
    type: stringifyType(col.type)
  })));
  const primaryKeys = allColumns.filter(col => /primary\s+key/i.test(col.type) || /\bpk\b/i.test(col.type));
  const multiValued = allColumns.filter(col => /\b(set|json|array|list)\b/i.test(col.type));
  const derived = allColumns.filter(col => {
    if (!col.name) return false;
    return /\b(age|total|count|balance|duration)\b/i.test(col.name);
  });

  const compositeGroupsMap = new Map();
  allColumns.forEach(col => {
    if (!col.name) return;
    const parts = col.name.split('_');
    if (parts.length > 1) {
      const key = parts[0];
      if (!compositeGroupsMap.has(key)) compositeGroupsMap.set(key, new Set());
      compositeGroupsMap.get(key).add(col.name);
    }
  });
  const compositeGroups = Array.from(compositeGroupsMap.entries())
    .filter(([, set]) => set.size > 1)
    .map(([name, set]) => ({ name, parts: Array.from(set) }));

  const relationshipsRaw = tables.flatMap(t => (t.foreignKeys || []).map(fk => ({
    fromTable: t.name,
    from: fk.from,
    toTable: fk.toTable,
    toColumn: fk.toColumn
  })));
  const relationships = relationshipsRaw.map(rel => {
    const left = rel.fromTable && rel.from ? `${rel.fromTable}.${rel.from}` : rel.fromTable;
    const right = rel.toTable && rel.toColumn ? `${rel.toTable}.${rel.toColumn}` : rel.toTable;
    if (left && right) return `${left} -> ${right}`;
    return left || right || '';
  }).filter(Boolean);

  const weakEntities = tables.filter(t => {
    const pkCount = (t.columns || []).filter(col => /primary\s+key/i.test(stringifyType(col.type))).length;
    const fkCount = (t.foreignKeys || []).length;
    return pkCount === 0 && fkCount > 0;
  }).map(t => t.name);

  const weakRelationships = relationshipsRaw
    .filter(rel => weakEntities.includes(rel.fromTable))
    .map(rel => `${rel.fromTable}.${rel.from} -> ${rel.toTable}`);

  return {
    entities,
    attributes: allColumns,
    primaryKeys,
    multiValued,
    derived,
    compositeGroups,
    relationships,
    weakEntities,
    weakRelationships
  };
}

const ER_RULE_DEFINITIONS = [
  {
    component: 'Entity Set',
    symbol: 'Rectangle',
    detail: 'Represents a major object, concept, or thing (e.g., Student, Course, Department).',
    compute: (ctx) => ctx.entities.length ? ctx.entities.join(', ') : ''
  },
  {
    component: 'Weak Entity Set',
    symbol: 'Double Rectangle',
    detail: 'An entity that cannot be uniquely identified by its own attributes alone. It depends on a Strong Entity (or Owner Entity) for its existence and primary key (e.g., a "Dependent" entity relying on the "Employee" entity\'s key).',
    compute: (ctx) => ctx.weakEntities.length ? ctx.weakEntities.join(', ') : ''
  },
  {
    component: 'Attribute',
    symbol: 'Ellipse (Oval)',
    detail: 'Represents a property or characteristic of an entity or a relationship (e.g., Name, Address, Age).',
    compute: (ctx) => ctx.attributes.length ? `${ctx.attributes.length} total attributes` : ''
  },
  {
    component: 'Key Attribute (Primary Key)',
    symbol: 'Underlined Ellipse',
    detail: 'An attribute (or set of attributes) whose value is unique for every entity instance and serves as the primary identifier (e.g., Student ID, Social Security Number).',
    compute: (ctx) => ctx.primaryKeys.length ? ctx.primaryKeys.map(pk => `${pk.table}.${pk.name}`).join(', ') : ''
  },
  {
    component: 'Multivalued Attribute',
    symbol: 'Double Ellipse',
    detail: 'An attribute that can hold more than one value for a single entity instance (e.g., a Student entity having multiple Phone Numbers or Skills).',
    compute: (ctx) => ctx.multiValued.length ? ctx.multiValued.map(attr => `${attr.table}.${attr.name}`).join(', ') : ''
  },
  {
    component: 'Derived Attribute',
    symbol: 'Dashed Ellipse',
    detail: 'An attribute whose value can be calculated or derived from other attributes in the database (e.g., Age derived from Date of Birth).',
    compute: (ctx) => ctx.derived.length ? ctx.derived.map(attr => `${attr.table}.${attr.name}`).join(', ') : ''
  },
  {
    component: 'Composite Attribute',
    symbol: 'Ellipse branching to other ellipses',
    detail: 'An attribute that can be broken down into smaller, more meaningful simple attributes (e.g., Address composed of Street, City, Zip Code).',
    compute: (ctx) => ctx.compositeGroups.length ? ctx.compositeGroups.map(group => `${group.name} -> ${group.parts.join(', ')}`).join(' | ') : ''
  },
  {
    component: 'Relationship Set',
    symbol: 'Diamond',
    detail: 'Represents an association or interaction between two or more entities (e.g., Works_For, Enrolls_In, Teaches).',
    compute: (ctx) => ctx.relationships.length ? ctx.relationships.join(' | ') : ''
  },
  {
    component: 'Weak (Identifying) Relationship',
    symbol: 'Double Diamond',
    detail: 'The relationship that exists between a Weak Entity and its Owner (Strong) Entity.',
    compute: (ctx) => ctx.weakRelationships.length ? ctx.weakRelationships.join(' | ') : ''
  },
  {
    component: 'Connecting Lines',
    symbol: 'Solid Lines',
    detail: 'Links entities to relationships, and attributes to entities.',
    compute: (ctx) => ctx.relationships.length ? `${ctx.relationships.length} relationship link(s)` : ''
  }
];

function stringifyType(type) {
  if (!type) return '';
  if (typeof type === 'string') return type;
  if (typeof type === 'object') {
    return Object.values(type)
      .filter(Boolean)
      .map(val => (typeof val === 'string' ? val : ''))
      .join(' ');
  }
  return String(type);
}

function downloadPNG(type = 'er') {
  // For ER diagram (SQL to ER conversion)
  let svg;
  let diagramName = 'er-diagram';
  
  if (type === 'er') {
    svg = document.querySelector('#visualER svg');
    diagramName = 'er-diagram';
    if (!svg) {
      alert('No ER diagram to download. Please convert SQL first.');
      return;
    }
  } else if (type === 'chen') {
    svg = document.querySelector('#visualChen svg');
    diagramName = 'attributes-diagram';
    if (!svg) {
      alert('No attributes diagram to download. Please convert SQL first.');
      return;
    }
  } else {
    svg = document.querySelector('#visualChen svg');
    diagramName = 'diagram';
    if (!svg) {
      alert('No diagram to download. Please convert SQL first.');
      return;
    }
  }
  
  const box = svg.getBoundingClientRect();
  const baseWidth = Math.max(Math.ceil(box.width), 800);
  const baseHeight = Math.max(Math.ceil(box.height), 500);
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = baseWidth + 100;
    canvas.height = baseHeight + 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const offsetX = (canvas.width - baseWidth) / 2;
    const offsetY = (canvas.height - baseHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, baseWidth, baseHeight);
    canvas.toBlob(blob => {
      if (!blob) {
        alert('Could not export image');
        return;
      }
      const link = document.createElement('a');
      link.download = diagramName + '.png';
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 'image/png', 1);
  };
  image.onerror = () => alert('Could not prepare the diagram image.');
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}

async function downloadTablePDF(sql) {
  try {
    // Create a formatted HTML representation for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 40px;
            background: white;
          }
          h1 {
            color: #2563eb;
            margin-bottom: 20px;
          }
          pre {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            overflow-x: auto;
            font-size: 12px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>Database Schema - SQL</h1>
        <pre>${sql.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `;
    
    // Use the backend PDF generation service
    const res = await fetch(`${apiUrl}/api/convert/downloadTablePDF`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ html, sql }),
    });
    
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table-schema.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // Fallback to text file
      const blob = new Blob([sql], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table-schema.sql';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    // Fallback to text file on error
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-schema.sql';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

function downloadTablePNG(sql) {
  // Create a canvas with the SQL text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#000000';
  ctx.font = '14px monospace';
  ctx.textBaseline = 'top';
  
  const lines = sql.split('\n');
  const lineHeight = 20;
  const padding = 20;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, padding, padding + (index * lineHeight));
  });
  
  canvas.toBlob(blob => {
    if (!blob) {
      alert('Could not export image');
      return;
    }
    const link = document.createElement('a');
    link.download = 'table-schema.png';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 'image/png', 1);
}
