// ===== Session Check =====
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login?redirect=/dashboard';
    return false;
  }

  try {
    const response = await fetch('/api/auth/verify-session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data.valid) {
      localStorage.removeItem('authToken');
      window.location.href = '/login?redirect=/dashboard';
      return false;
    }

    return data.user;
  } catch {
    return false;
  }
}

// ===== Load Dashboard =====
async function loadDashboard() {
  const user = await checkAuth();
  if (!user) return;

  // Update user info
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = user.fullName || 'Student';

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    // Update stats
    const totalPurchases = document.getElementById('totalPurchases');
    const totalDownloads = document.getElementById('totalDownloads');
    const totalSpent = document.getElementById('totalSpent');
    const activeTokens = document.getElementById('activeTokens');

    if (totalPurchases) totalPurchases.textContent = data.totalPurchases || 0;
    if (totalDownloads) totalDownloads.textContent = data.totalDownloads || 0;
    if (totalSpent) totalSpent.textContent = `₹${data.totalSpent || 0}`;
    if (activeTokens) activeTokens.textContent = data.activeTokens || 0;

    // Update recent purchases
    const list = document.getElementById('recentPurchases');
    if (list) {
      if (data.recentPurchases && data.recentPurchases.length > 0) {
        list.innerHTML = data.recentPurchases.map(p => `
          <div class="purchase-item">
            <div>
              <strong>${p.postTitle}</strong>
              <span class="badge">${p.postClass || ''} ${p.postSubject || ''}</span>
            </div>
            <div>
              <span class="price">₹${p.amount}</span>
              <span class="date">${new Date(p.purchasedAt).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('');
      } else {
        list.innerHTML = '<p class="empty">No purchases yet. <a href="/browse">Browse notes →</a></p>';
      }
    }

  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

// ===== Logout =====
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  window.location.href = '/login';
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', loadDashboard);