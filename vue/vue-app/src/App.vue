<template>
  <div class="min-h-screen surface-ground text-color">
    <nav class="navbar shadow-1">
      <div class="nav-container">
        <div class="nav-brand">
          <i class="pi pi-sitemap"></i>
          <span class="font-semibold">Dota 2 TI 2025 Visualization</span>
        </div>
        
        <div class="nav-links">
          <router-link 
            to="/" 
            class="nav-link"
            :class="{ active: $route.path === '/' }"
          >
            <i class="pi pi-table"></i>
            <span>Probability Heat Map</span>
          </router-link>
          
          <router-link 
            to="/sim" 
            class="nav-link"
            :class="{ active: $route.path === '/sim' }"
          >
            <i class="pi pi-play"></i>
            <span>Simulator</span>
          </router-link>
        </div>
      </div>
    </nav>

    <div class="p-4">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed for this approach
</script>

<style>
.surface-ground { background: var(--p-surface-100); }

.navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: #374151;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-link.active {
  background: #e5e7eb;
  color: #1f2937;
  font-weight: 600;
}

.nav-link i {
  font-size: 1rem;
}

.nav-link span {
  font-size: 0.9rem;
}
</style>
