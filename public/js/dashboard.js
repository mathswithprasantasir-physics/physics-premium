// public/js/dashboard.js

// ===== সেশন চেক =====
async function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html?redirect=/dashboard/';
    return false;
  }

  try {
    const response = await fetch('/api/auth/verify-session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data.valid) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html?redirect=/dashboard/';
      return false;
    }

    return data.user;
  } catch {
    return false;
  }
}

// ===== ড্যাশবোর্ড লোড =====
async function loadDashboard() {
  const user = await checkAuth();
  if (!user) return;

  document.getElementById('userName').textContent = user.fullName || 'Student';
  document.getElementById('userEmail').textContent = user.email;

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/dashboard/index', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    document.getElementById('totalPurchases').textContent = data.totalPurchases || 0;
    document.getElementById('totalDownloads').textContent = data.totalDownloads || 0;
    document.getElementById('totalSpent').textContent = `₹${data.totalSpent || 0}`;
    document.getElementById('activeTokens').textContent = data.activeTokens || 0;

    const list = document.getElementById('recentPurchases');
    if (data.recentPurchases && data.recentPurchases.length > 0) {
      list.innerHTML = data.recentPurchases.map(p => `
        <div class="purchase-item">
          <div>
            <strong>${p.postTitle}</strong>
            <span class="badge">${p.postClass} • ${p.postSubject}</span>
          </div>
          <div>
            <span class="price">₹${p.amount}</span>
            <span class="date">${new Date(p.purchasedAt).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p class="empty">No purchases yet. <a href="/browse.html">Browse notes →</a></p>';
    }

  } catch (error) {
    console.error('Dashboard load error:', error);
  }
}

// ===== Logout =====
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', loadDashboard);