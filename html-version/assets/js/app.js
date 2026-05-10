// Theme Management
const themeToggle = () => {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  if (isDark) {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};

// Initialize theme from localStorage
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (!savedTheme) {
    // Use system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
};

// Sidebar Management
const toggleSidebar = () => {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
};

const closeSidebar = () => {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.remove('active');
  }
};

// Active link management
const setActiveLink = () => {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-nav-item');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || currentPath.includes(href)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

// Format currency
const formatCurrency = (amount, currency = 'KES') => {
  return `${currency} ${Number(amount).toLocaleString()}`;
};

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format date with time
const formatDateTime = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Create chart (basic bar chart)
const createBarChart = (containerId, data, labels, colors) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxValue = Math.max(...data);
  const height = 200;
  const width = container.clientWidth;
  const barWidth = width / data.length;
  const padding = 40;

  let svg = `<svg width="${width}" height="${height}" style="overflow: visible;">`;
  
  // Y-axis line
  svg += `<line x1="${padding}" y1="20" x2="${padding}" y2="180" stroke="var(--border)" stroke-width="1"/>`;
  
  // X-axis line
  svg += `<line x1="${padding}" y1="180" x2="${width}" y2="180" stroke="var(--border)" stroke-width="1"/>`;

  // Bars
  data.forEach((value, index) => {
    const barHeight = (value / maxValue) * 150;
    const x = padding + index * barWidth + barWidth / 4;
    const y = 180 - barHeight;
    
    svg += `<rect x="${x}" y="${y}" width="${barWidth / 2}" height="${barHeight}" fill="${colors[index] || 'var(--primary)'}" rx="4"/>`;
    
    // Label
    svg += `<text x="${x + barWidth / 4}" y="195" text-anchor="middle" font-size="12" fill="var(--muted-foreground)">${labels[index]}</text>`;
  });

  svg += `</svg>`;
  container.innerHTML = svg;
};

// Toast notification
const showToast = (message, type = 'info', duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background-color: var(--${type === 'success' ? 'success' : type === 'error' ? 'destructive' : 'info'});
    color: white;
    border-radius: var(--radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideInLeft 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInLeft 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Modal management
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
  }
};

// Generic details modal — for buttons that previously did nothing
const showDetails = (title, bodyHtml, actions) => {
  let modal = document.getElementById('__detailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = '__detailsModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:200;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
      <div style="background:var(--card);border-radius:0.75rem;max-width:640px;width:100%;max-height:85vh;overflow:auto;border:1px solid var(--border);box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid var(--border);">
          <h3 id="__detailsTitle" style="font-size:1rem;font-weight:700;margin:0;"></h3>
          <button onclick="document.getElementById('__detailsModal').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:var(--muted-foreground);">✕</button>
        </div>
        <div id="__detailsBody" style="padding:1.25rem;font-size:0.9375rem;color:var(--foreground);"></div>
        <div id="__detailsActions" style="padding:0.75rem 1.25rem;border-top:1px solid var(--border);display:flex;gap:0.5rem;justify-content:flex-end;"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }
  document.getElementById('__detailsTitle').textContent = title;
  document.getElementById('__detailsBody').innerHTML = bodyHtml;
  const actionsEl = document.getElementById('__detailsActions');
  actionsEl.innerHTML = '';
  (actions || [{ label: 'Close', primary: false, onClick: 'document.getElementById(\'__detailsModal\').style.display=\'none\'' }]).forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.primary ? 'btn-primary' : 'btn-outline');
    b.textContent = a.label;
    b.setAttribute('onclick', a.onClick || "document.getElementById('__detailsModal').style.display='none'");
    actionsEl.appendChild(b);
  });
  modal.style.display = 'flex';
};

// Trigger a mock file download (used by Download PDF / Backup buttons)
const downloadMockFile = (filename, content, mime = 'text/plain') => {
  const blob = new Blob([content || `M-Chama mock export — ${filename}\nGenerated: ${new Date().toISOString()}`], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`${filename} downloaded`, 'success');
};


// Form validation
const validateForm = (formId) => {
  const form = document.getElementById(formId);
  if (!form) return true;

  const inputs = form.querySelectorAll('[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      const group = input.closest('.form-group');
      if (group) {
        let error = group.querySelector('.form-error');
        if (!error) {
          error = document.createElement('div');
          error.className = 'form-error';
          error.textContent = 'This field is required';
          group.appendChild(error);
        }
      }
    } else {
      const group = input.closest('.form-group');
      if (group) {
        const error = group.querySelector('.form-error');
        if (error) error.remove();
      }
    }
  });

  return isValid;
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setActiveLink();
  
  // Close sidebar on mobile when clicking outside
  if (window.innerWidth < 768) {
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.querySelector('.sidebar-toggle');
      if (sidebar && !sidebar.contains(e.target) && !toggleBtn?.contains(e.target)) {
        closeSidebar();
      }
    });
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});
