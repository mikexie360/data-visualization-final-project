<template>
  <div class="min-h-screen surface-ground text-color">
    <nav class="navbar shadow-1">
      <div class="nav-container">
        <div class="nav-brand">
          <i class="pi pi-sitemap"></i>
          <span class="font-semibold">Dota 2 TI 2025 Visualization</span>
        </div>
        
        <!-- Hamburger menu button for mobile -->
        <button 
          class="hamburger-menu"
          @click="toggleMobileMenu"
          :class="{ active: isMobileMenuOpen }"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <!-- Desktop navigation -->
        <div class="nav-links desktop-nav">
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
          
          <router-link 
            to="/teams" 
            class="nav-link"
            :class="{ active: $route.path === '/teams' }"
          >
            <i class="pi pi-users"></i>
            <span>Team Stats</span>
          </router-link>
        </div>
        
        <!-- Mobile navigation overlay -->
        <div 
          class="mobile-nav-overlay"
          :class="{ active: isMobileMenuOpen }"
          @click="closeMobileMenu"
        ></div>
        
        <!-- Mobile navigation menu -->
        <div 
          class="mobile-nav"
          :class="{ active: isMobileMenuOpen }"
        >
          <router-link 
            to="/" 
            class="mobile-nav-link"
            :class="{ active: $route.path === '/' }"
            @click="closeMobileMenu"
          >
            <i class="pi pi-table"></i>
            <span>Probability Heat Map</span>
          </router-link>
          
          <router-link 
            to="/sim" 
            class="mobile-nav-link"
            :class="{ active: $route.path === '/sim' }"
            @click="closeMobileMenu"
          >
            <i class="pi pi-play"></i>
            <span>Simulator</span>
          </router-link>
          
          <router-link 
            to="/teams" 
            class="mobile-nav-link"
            :class="{ active: $route.path === '/teams' }"
            @click="closeMobileMenu"
          >
            <i class="pi pi-users"></i>
            <span>Team Stats</span>
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
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<style>
.surface-ground { background: var(--p-surface-100); }

.navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  position: relative;
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
  z-index: 998;
}

/* Hamburger menu button */
.hamburger-menu {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1002;
}

.hamburger-menu span {
  width: 100%;
  height: 3px;
  background: #374151;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger-menu.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger-menu.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-menu.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Desktop navigation */
.desktop-nav {
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

/* Mobile navigation overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-nav-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* Mobile navigation menu */
.mobile-nav {
  position: fixed;
  top: 0;
  right: -300px;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: right 0.3s ease;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
}

.mobile-nav.active {
  right: 0;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: #6b7280;
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  font-weight: 500;
}

.mobile-nav-link:hover {
  background: #f9fafb;
  color: #374151;
}

.mobile-nav-link.active {
  background: #e5e7eb;
  color: #1f2937;
  font-weight: 600;
}

.mobile-nav-link i {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.mobile-nav-link span {
  font-size: 1rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .hamburger-menu {
    display: flex;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .nav-brand span {
    font-size: 1rem;
  }
}

@media (min-width: 769px) {
  .mobile-nav-overlay,
  .mobile-nav {
    display: none;
  }
}
</style>
