<template>
  <div>
    <!-- Tabs (sticky under main header) -->
    <div class="sticky z-30" :style="{ top: 'var(--app-header-height)' }">
      <nav class="flex items-center border-b cf-bg-secondary cf-border-primary">
        <button 
          @click="activeTab = 'personal'" 
          :class="['cf-tab', activeTab === 'personal' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'personal' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_personal') }}
        </button>
        <button 
          @click="activeTab = 'collective'" 
          :class="['cf-tab', activeTab === 'collective' ? 'cf-tab--active' : 'cf-tab--inactive']"
          :style="activeTab === 'collective' ? 'text-shadow: var(--active-tab-text-shadow);' : ''">
          {{ $t('divers.prices_tab_collective') }}
        </button>
      </nav>
    </div>

    <!-- Personal Tab -->
    <div v-if="activeTab === 'personal'" class="px-8 py-6 max-w-480 mx-auto">
      <!-- Filters and Pagination Controls -->
      <div class="bg-secondary border-2 border-wakfu-gray rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search by name -->
          <div class="relative" ref="searchDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_search_name') }}</label>
            <input
              v-model="searchNamePersonal"
              @input="onSearchInputPersonal"
              @focus="showAutocompletePersonal = true"
              type="text"
              :placeholder="$t('divers.prices_search_placeholder')"
              class="cf-input w-full rounded px-3 py-2"
            />
            
            <div v-if="showAutocompletePersonal && autocompleteItemsPersonal.length > 0" 
              class="cf-dropdown">
              <div class="p-1">
                <button
                  v-for="item in autocompleteItemsPersonal"
                  :key="item.id"
                  @click="selectItemPersonal(item)"
                  class="cf-autocomplete-item">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                  <span class="text-slate-400 text-sm ml-2">
                    ({{ $t('divers.prices_col_level') }} {{ item.level }})
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Filter by rarity -->
          <div class="relative" ref="rarityDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_rarity') }}</label>
            <button
              @click="isRarityDropdownOpenPersonal = !isRarityDropdownOpenPersonal"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getRarityDisplayTextPersonal() }}</span>
              <span>{{ isRarityDropdownOpenPersonal ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isRarityDropdownOpenPersonal" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                  <button 
                    @click="toggleAllRaritiesPersonal(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllRaritiesPersonal(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="r in 8" 
                  :key="r-1"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterRaritiesPersonal.includes(r-1)"
                    @change="toggleRarityPersonal(r-1)"
                    class="custom-checkbox-small"
                  />
                  <span :class="getRarityClass(r-1)">
                    {{ getRarityName(r-1) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Filter by level -->
          <div>
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_level') }}</label>
            <div class="flex gap-2">
              <input
                v-model.number="filterLevelMinPersonal"
                @input="validateLevelMinPersonal"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_min')"
                class="cf-input w-full rounded px-3 py-2"
              />
              <input
                v-model.number="filterLevelMaxPersonal"
                @input="validateLevelMaxPersonal"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_max')"
                class="cf-input w-full rounded px-3 py-2"
              />
            </div>
          </div>
          
          <!-- Filter by instances -->
          <div class="relative" ref="instancesDropdownRefPersonal">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenPersonal = !isInstancesDropdownOpenPersonal"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getInstancesDisplayTextPersonal() }}</span>
              <span>{{ isInstancesDropdownOpenPersonal ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenPersonal" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="instanceSearchPersonal"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                  <button 
                    @click="toggleAllInstancesPersonal(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesPersonal(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstancesListPersonal" 
                  :key="inst.id"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterInstancesPersonal.includes(inst.id)"
                    @change="toggleInstancePersonal(inst.id)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ $t("instances." + inst.id) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Items per page selector -->
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium cf-text-secondary">{{ $t('divers.prices_per_page') }}</label>
          <select
            v-model.number="itemsPerPagePersonal"
            class="cf-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
        </div>
      </div>
      
      <!-- Table -->
      <div class="cf-card">
        <div class="overflow-x-auto">
          <table class="w-full table-fixed">
            <colgroup>
              <col style="width:45%" />
              <col style="width:15%" />
              <col style="width:25%" />
              <col style="width:15%" />
            </colgroup>
            <thead class="font-bold truncate text-slate-100">
              <tr>
                <th @click="sortByPersonal('name')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_name') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnPersonal === 'name' ? (sortDirectionPersonal === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByPersonal('level')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_level') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnPersonal === 'level' ? (sortDirectionPersonal === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByPersonal('instances')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_instances') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnPersonal === 'instances' ? (sortDirectionPersonal === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByPersonal('price')" :class="['cf-table-header','cf-table-header--hover','text-right']">
                  <div class="flex items-center justify-end gap-2">
                    {{ $t('divers.prices_col_price') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnPersonal === 'price' ? (sortDirectionPersonal === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in paginatedItemsPersonal" 
                :key="item.id"
                class="cf-table-row-hover">
                <td class="px-4 py-3">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-200">{{ item.level }}</td>
                <td class="px-4 py-3 cf-text-secondary">
                  <span v-if="item.instances && item.instances.length > 0" class="text-sm">
                    {{ item.instances.join(', ') }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-4 py-3 text-right text-kamas">
                  <input
                    type="number"
                    :value="item.price"
                    @blur="updatePricePersonal(item.id, $event.target.value)"
                    :placeholder="'—'"
                    class="cf-input text-right w-32 bg-transparent border-none focus:bg-slate-700 focus:border-slate-500"
                    min="0"
                    max="1000000000"
                    step="1"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Footer with pagination -->
        <div class="px-4 py-3 border-t border-wakfu-gray text-slate-100 flex items-center justify-between">
          <p :class="['text-sm']">
            {{ $t('divers.prices_showing') }} {{ startItemPersonal }} - {{ endItemPersonal }} {{ $t('divers.prices_of') }} {{ filteredAndSortedItemsPersonal.length }} {{ $t('divers.prices_items') }}
          </p>
          
          <div class="flex items-center gap-2">
            <button 
              @click="clearAllPersonalPrices"
              class="cf-pag-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
              🗑️ {{ $t('divers.prices_clear_personal') }}
            </button>
            
            <button @click="currentPagePersonal = 1" :disabled="currentPagePersonal === 1" :class="['cf-pag-btn', currentPagePersonal === 1 ? 'opacity-50 cursor-not-allowed' : '']">««</button>
            <button @click="currentPagePersonal--" :disabled="currentPagePersonal === 1" :class="['cf-pag-btn', currentPagePersonal === 1 ? 'opacity-50 cursor-not-allowed' : '']">‹</button>
            
            <span class="px-4 text-sm text-slate-200">
              {{ $t('divers.prices_page') }} {{ currentPagePersonal }} / {{ totalPagesPersonal }}
            </span>
            
            <button @click="currentPagePersonal++" :disabled="currentPagePersonal === totalPagesPersonal" :class="['cf-pag-btn', currentPagePersonal === totalPagesPersonal ? 'opacity-50 cursor-not-allowed' : '']">›</button>
            <button @click="currentPagePersonal = totalPagesPersonal" :disabled="currentPagePersonal === totalPagesPersonal" :class="['cf-pag-btn', currentPagePersonal === totalPagesPersonal ? 'opacity-50 cursor-not-allowed' : '']">»»</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Collective Tab -->
    <div v-if="activeTab === 'collective'" class="px-8 py-6 max-w-480 mx-auto">
      <!-- Filters and Pagination Controls -->
      <div class="bg-secondary border-2 border-wakfu-gray rounded-lg p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search by name -->
          <div class="relative" ref="searchDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_search_name') }}</label>
            <input
              v-model="searchNameCollective"
              @input="onSearchInputCollective"
              @focus="showAutocompleteCollective = true"
              type="text"
              :placeholder="$t('divers.prices_search_placeholder')"
              class="cf-input w-full rounded px-3 py-2"
            />
            
            <div v-if="showAutocompleteCollective && autocompleteItemsCollective.length > 0" 
              class="cf-dropdown">
              <div class="p-1">
                <button
                  v-for="item in autocompleteItemsCollective"
                  :key="item.id"
                  @click="selectItemCollective(item)"
                  class="cf-autocomplete-item">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                  <span class="text-slate-400 text-sm ml-2">
                    ({{ $t('divers.prices_col_level') }} {{ item.level }})
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Filter by rarity -->
          <div class="relative" ref="rarityDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_rarity') }}</label>
            <button
              @click="isRarityDropdownOpenCollective = !isRarityDropdownOpenCollective"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getRarityDisplayTextCollective() }}</span>
              <span>{{ isRarityDropdownOpenCollective ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isRarityDropdownOpenCollective" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                  <button 
                    @click="toggleAllRaritiesCollective(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllRaritiesCollective(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="r in 8" 
                  :key="r-1"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterRaritiesCollective.includes(r-1)"
                    @change="toggleRarityCollective(r-1)"
                    class="custom-checkbox-small"
                  />
                  <span :class="getRarityClass(r-1)">
                    {{ getRarityName(r-1) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Filter by level -->
          <div>
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_level') }}</label>
            <div class="flex gap-2">
              <input
                v-model.number="filterLevelMinCollective"
                @input="validateLevelMinCollective"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_min')"
                class="cf-input w-full rounded px-3 py-2"
              />
              <input
                v-model.number="filterLevelMaxCollective"
                @input="validateLevelMaxCollective"
                type="number"
                min="1"
                max="245"
                :placeholder="$t('divers.prices_max')"
                class="cf-input w-full rounded px-3 py-2"
              />
            </div>
          </div>
          
          <!-- Filter by instances -->
          <div class="relative" ref="instancesDropdownRefCollective">
            <label class="block text-sm font-medium mb-2 cf-text-secondary">{{ $t('divers.prices_filter_instances') }}</label>
            <button
              @click="isInstancesDropdownOpenCollective = !isInstancesDropdownOpenCollective"
              class="cf-select min-w-40 w-auto text-left flex items-center justify-between font-mono">
              <span>{{ getInstancesDisplayTextCollective() }}</span>
              <span>{{ isInstancesDropdownOpenCollective ? '▲' : '▼' }}</span>
            </button>
            
            <div v-if="isInstancesDropdownOpenCollective" 
              class="cf-dropdown">
              <div class="p-2 space-y-1">
                <input
                  v-model="instanceSearchCollective"
                  type="text"
                  :placeholder="$t('divers.search_placeholder') || 'Rechercher...'"
                  class="cf-input w-full px-3 py-1.5 mb-2 text-sm"
                  @click.stop
                />
                <div class="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                  <button 
                    @click="toggleAllInstancesCollective(true)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_all') }}
                  </button>
                  <button 
                    @click="toggleAllInstancesCollective(false)"
                    class="cf-dropdown-action">
                    {{ $t('divers.level_ranges_toggle_none') }}
                  </button>
                </div>
                
                <label 
                  v-for="inst in filteredInstancesListCollective" 
                  :key="inst.id"
                  class="cf-dropdown-item">
                  <input
                    type="checkbox"
                    :checked="filterInstancesCollective.includes(inst.id)"
                    @change="toggleInstanceCollective(inst.id)"
                    class="custom-checkbox-small"
                  />
                  <span class="text-slate-200">
                    {{ $t("instances." + inst.id) }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Items per page selector -->
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium cf-text-secondary">{{ $t('divers.prices_per_page') }}</label>
          <select
            v-model.number="itemsPerPageCollective"
            class="cf-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
        </div>
      </div>
      
      <!-- Table -->
      <div class="cf-card">
        <div class="overflow-x-auto">
          <table class="w-full table-fixed">
            <colgroup>
              <col style="width:45%" />
              <col style="width:15%" />
              <col style="width:25%" />
              <col style="width:15%" />
            </colgroup>
            <thead class="font-bold truncate text-slate-100">
              <tr>
                <th @click="sortByCollective('name')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_name') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnCollective === 'name' ? (sortDirectionCollective === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByCollective('level')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_level') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnCollective === 'level' ? (sortDirectionCollective === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByCollective('instances')" :class="['cf-table-header','cf-table-header--hover']">
                  <div class="flex items-center gap-2">
                    {{ $t('divers.prices_col_instances') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnCollective === 'instances' ? (sortDirectionCollective === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
                <th @click="sortByCollective('price')" :class="['cf-table-header','cf-table-header--hover','text-right']">
                  <div class="flex items-center justify-end gap-2">
                    {{ $t('divers.prices_col_price') }}
                    <span class="inline-block w-3 text-center">{{ sortColumnCollective === 'price' ? (sortDirectionCollective === 'asc' ? '▲' : '▼') : '' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in paginatedItemsCollective" 
                :key="item.id"
                class="cf-table-row-hover">
                <td class="px-4 py-3">
                  <span :class="['font-bold', getRarityClass(item.rarity)]">
                    {{ item.name }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-200">{{ item.level }}</td>
                <td class="px-4 py-3 cf-text-secondary">
                  <span v-if="item.instances && item.instances.length > 0" class="text-sm">
                    {{ item.instances.join(', ') }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-4 py-3 text-right text-kamas">
                  <input
                    type="number"
                    :value="item.price"
                    @blur="updatePriceCollective(item.id, $event.target.value)"
                    :placeholder="'—'"
                    class="cf-input text-right w-32 bg-transparent border-none focus:bg-slate-700 focus:border-slate-500"
                    min="0"
                    max="1000000000"
                    step="1"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Footer with pagination -->
        <div class="px-4 py-3 border-t border-wakfu-gray text-slate-100 flex items-center justify-between">
          <p :class="['text-sm']">
            {{ $t('divers.prices_showing') }} {{ startItemCollective }} - {{ endItemCollective }} {{ $t('divers.prices_of') }} {{ filteredAndSortedItemsCollective.length }} {{ $t('divers.prices_items') }}
          </p>
          
          <div class="flex items-center gap-2">
            <!-- Debug buttons for Gun DB inspection -->
            <button 
              @click="inspectGunDB"
              class="cf-pag-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
              🔍 Inspect DB
            </button>
            <button 
              @click="inspectRawPrices"
              class="cf-pag-btn bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs">
              📊 Raw Prices
            </button>
            <button 
              @click="testConnectivity"
              class="cf-pag-btn bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs">
              🔗 Test Conn
            </button>
            <button 
              @click="clearAllPrices"
              class="cf-pag-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
              🗑️ Clear All
            </button>
            <button 
              @click="inspectLocalStorage"
              class="cf-pag-btn bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 text-xs">
              🔍 LS Inspect
            </button>
            <button 
              @click="switchToPureP2P"
              class="cf-pag-btn bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 text-xs">
              🔄 Local Only
            </button>
            <button 
              @click="switchToHybridP2P"
              class="cf-pag-btn bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs">
              🔄 Local + P2P
            </button>
            <button 
              @click="switchToOnlineOnly"
              class="cf-pag-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
              🔄 Online Only
            </button>
            
            <button @click="currentPageCollective = 1" :disabled="currentPageCollective === 1" :class="['cf-pag-btn', currentPageCollective === 1 ? 'opacity-50 cursor-not-allowed' : '']">««</button>
            <button @click="currentPageCollective--" :disabled="currentPageCollective === 1" :class="['cf-pag-btn', currentPageCollective === 1 ? 'opacity-50 cursor-not-allowed' : '']">‹</button>
            
            <span class="px-4 text-sm text-slate-200">
              {{ $t('divers.prices_page') }} {{ currentPageCollective }} / {{ totalPagesCollective }}
            </span>
            
            <button @click="currentPageCollective++" :disabled="currentPageCollective === totalPagesCollective" :class="['cf-pag-btn', currentPageCollective === totalPagesCollective ? 'opacity-50 cursor-not-allowed' : '']">›</button>
            <button @click="currentPageCollective = totalPagesCollective" :disabled="currentPageCollective === totalPagesCollective" :class="['cf-pag-btn', currentPageCollective === totalPagesCollective ? 'opacity-50 cursor-not-allowed' : '']">»»</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, shallowRef } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { LS_KEYS } from '@/constants/localStorageKeys'
import { useClickOutside } from '@/composables/useClickOutside'
import { getRarityClass } from '@/utils/itemHelpers'
import { formatNumber } from '@/utils/formatters'
import { useJsonStore } from '@/stores/useJsonStore'
import { useP2PStore } from '@/stores/useP2PStore'
import { usePersonalPricesStore } from '@/stores/usePersonalPricesStore'
import { useAppStore } from '@/stores/useAppStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const jsonStore = useJsonStore()
const p2pStore = useP2PStore()
const personalPricesStore = usePersonalPricesStore()
const appStore = useAppStore()

// Cache pour les traductions des items et instances (optimisation)
const itemTranslationCache = new Map()
const instanceTranslationCache = new Map()

function getCachedItemName(itemId) {
  if (!itemTranslationCache.has(itemId)) {
    itemTranslationCache.set(itemId, t("items." + itemId) || `Item #${itemId}`)
  }
  return itemTranslationCache.get(itemId)
}

function getCachedInstanceName(instanceId) {
  if (!instanceTranslationCache.has(instanceId)) {
    instanceTranslationCache.set(instanceId, t("instances." + instanceId))
  }
  return instanceTranslationCache.get(instanceId)
}
// stores already initialized above

// Active tab state
const activeTab = useLocalStorage(LS_KEYS.PRICES_ACTIVE_TAB, 'personal')

// ========================================
// PERSONAL TAB STATE
// ========================================

// Filters with localStorage persistence (PERSONAL)
const searchNamePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SEARCH_NAME, '')
const filterRaritiesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_RARITIES, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMinPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_LEVEL_MIN, '')
const filterLevelMaxPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_LEVEL_MAX, '')
const sortColumnPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SORT_COLUMN, 'name')
const sortDirectionPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_SORT_DIRECTION, 'asc')
const currentPagePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_PAGE, 1)
const itemsPerPagePersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_PER_PAGE, 25)

// Search autocomplete (PERSONAL)
const showAutocompletePersonal = ref(false)
const { elementRef: searchDropdownRefPersonal } = useClickOutside(() => {
  showAutocompletePersonal.value = false
})

// Rarity dropdown (PERSONAL)
const isRarityDropdownOpenPersonal = ref(false)
const { elementRef: rarityDropdownRefPersonal } = useClickOutside(() => {
  isRarityDropdownOpenPersonal.value = false
})

// Instances filter (PERSONAL)
const filterInstancesPersonal = useLocalStorage(LS_KEYS.PRICES_PERSONAL_INSTANCES, null, { deep: true })

// Instances dropdown (PERSONAL)
const isInstancesDropdownOpenPersonal = ref(false)
const { elementRef: instancesDropdownRefPersonal } = useClickOutside(() => {
  isInstancesDropdownOpenPersonal.value = false
})
const instanceSearchPersonal = ref('')

// ========================================
// COLLECTIVE TAB STATE
// ========================================

// Filters with localStorage persistence (COLLECTIVE)
const searchNameCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SEARCH_NAME, '')
const filterRaritiesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_RARITIES, [0, 1, 2, 3, 4, 5, 6, 7], { deep: true })
const filterLevelMinCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_LEVEL_MIN, '')
const filterLevelMaxCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_LEVEL_MAX, '')
const sortColumnCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SORT_COLUMN, 'name')
const sortDirectionCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_SORT_DIRECTION, 'asc')
const currentPageCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_PAGE, 1)
const itemsPerPageCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_PER_PAGE, 25)

// Search autocomplete (COLLECTIVE)
const showAutocompleteCollective = ref(false)
const { elementRef: searchDropdownRefCollective } = useClickOutside(() => {
  showAutocompleteCollective.value = false
})

// Rarity dropdown (COLLECTIVE)
const isRarityDropdownOpenCollective = ref(false)
const { elementRef: rarityDropdownRefCollective } = useClickOutside(() => {
  isRarityDropdownOpenCollective.value = false
})

// Instances filter (COLLECTIVE)
const filterInstancesCollective = useLocalStorage(LS_KEYS.PRICES_COLLECTIVE_INSTANCES, null, { deep: true })

// Instances dropdown (COLLECTIVE)
const isInstancesDropdownOpenCollective = ref(false)
const { elementRef: instancesDropdownRefCollective } = useClickOutside(() => {
  isInstancesDropdownOpenCollective.value = false
})
const instanceSearchCollective = ref('')

// ========================================
// SHARED COMPUTED
// ========================================

// Get all instances for the filter
const allInstancesList = computed(() => {
  const instances = jsonStore.rawInstances || []
  return instances.map(inst => ({
    id: inst.id,
    name: getCachedInstanceName(inst.id)
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// Filtered instances based on search (PERSONAL)
const filteredInstancesListPersonal = computed(() => {
  if (!instanceSearchPersonal.value) return allInstancesList.value
  
  const search = instanceSearchPersonal.value.toLowerCase()
  return allInstancesList.value.filter(inst => 
    inst.name.toLowerCase().includes(search)
  )
})

// Filtered instances based on search (COLLECTIVE)
const filteredInstancesListCollective = computed(() => {
  if (!instanceSearchCollective.value) return allInstancesList.value
  
  const search = instanceSearchCollective.value.toLowerCase()
  return allInstancesList.value.filter(inst => 
    inst.name.toLowerCase().includes(search)
  )
})

// Initialize with all instances if never saved (PERSONAL)
watch(allInstancesList, (newList) => {
  if (filterInstancesPersonal.value === null && newList.length > 0) {
    filterInstancesPersonal.value = newList.map(i => i.id)
  }
}, { immediate: true })

// Initialize with all instances if never saved (COLLECTIVE)
watch(allInstancesList, (newList) => {
  if (filterInstancesCollective.value === null && newList.length > 0) {
    filterInstancesCollective.value = newList.map(i => i.id)
  }
}, { immediate: true })

// ========================================
// PERSONAL TAB COMPUTED
// ========================================

// Get all items with names, prices, and instances (PERSONAL)
const allItemsPersonal = computed(() => {
  const items = jsonStore.rawItems || []
  const currentServer = appStore.config.server
  const priceMap = personalPricesStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      instanceIds: instanceIds,
      instances: instanceNames
    }
  })
})

// Autocomplete suggestions (PERSONAL)
const autocompleteItemsPersonal = computed(() => {
  if (!searchNamePersonal.value || searchNamePersonal.value.length < 2) return []
  
  const search = searchNamePersonal.value.toLowerCase()
  return allItemsPersonal.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// Filter and sort items (PERSONAL)
const filteredAndSortedItemsPersonal = computed(() => {
  let result = [...allItemsPersonal.value]
  
  // Filter by name
  if (searchNamePersonal.value) {
    const search = searchNamePersonal.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(search))
  }
  
  // Filter by rarity
  if (filterRaritiesPersonal.value.length === 0) {
    result = []
  } else if (filterRaritiesPersonal.value.length < 8) {
    result = result.filter(item => filterRaritiesPersonal.value.includes(item.rarity))
  }
  
  // Filter by level
  if (filterLevelMinPersonal.value !== '' && filterLevelMinPersonal.value != null) {
    result = result.filter(item => item.level >= filterLevelMinPersonal.value)
  }
  if (filterLevelMaxPersonal.value !== '' && filterLevelMaxPersonal.value != null) {
    result = result.filter(item => item.level <= filterLevelMaxPersonal.value)
  }
  
  // Filter by instances
  const fi = filterInstancesPersonal.value || []
  if (fi.length === 0) {
    result = []
  } else if (fi.length < allInstancesList.value.length) {
    result = result.filter(item => {
      return item.instanceIds.some(instId => fi.includes(instId))
    })
  }
  
  // Sort
  result.sort((a, b) => {
    let aVal = a[sortColumnPersonal.value]
    let bVal = b[sortColumnPersonal.value]
    
    if (sortColumnPersonal.value === 'instances') {
      aVal = a.instanceIds?.length || 0
      bVal = b.instanceIds?.length || 0
    } else if (sortColumnPersonal.value === 'price') {
      aVal = aVal ?? -1
      bVal = bVal ?? -1
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirectionPersonal.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirectionPersonal.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// Pagination computed properties (PERSONAL)
const totalPagesPersonal = computed(() => {
  return Math.ceil(filteredAndSortedItemsPersonal.value.length / itemsPerPagePersonal.value)
})

const paginatedItemsPersonal = computed(() => {
  const start = (currentPagePersonal.value - 1) * itemsPerPagePersonal.value
  const end = start + itemsPerPagePersonal.value
  return filteredAndSortedItemsPersonal.value.slice(start, end)
})

const startItemPersonal = computed(() => {
  if (filteredAndSortedItemsPersonal.value.length === 0) return 0
  return (currentPagePersonal.value - 1) * itemsPerPagePersonal.value + 1
})

const endItemPersonal = computed(() => {
  const end = currentPagePersonal.value * itemsPerPagePersonal.value
  return Math.min(end, filteredAndSortedItemsPersonal.value.length)
})

// Reset to page 1 when filters change (PERSONAL)
watch([searchNamePersonal, filterRaritiesPersonal, filterLevelMinPersonal, filterLevelMaxPersonal, filterInstancesPersonal, itemsPerPagePersonal], () => {
  currentPagePersonal.value = 1
})

// ========================================
// COLLECTIVE TAB COMPUTED
// ========================================

// Get all items with names, prices, and instances (COLLECTIVE)
const allItemsCollective = computed(() => {
  const items = jsonStore.rawItems || []
  const currentServer = appStore.config.server
  const priceMap = p2pStore.prices[currentServer] || {}
  const itemInstances = jsonStore.itemToInstancesMap
  
  return items.map(item => {
    const instanceIds = itemInstances[item.id] || []
    const instanceNames = instanceIds
      .map(id => getCachedInstanceName(id))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      id: item.id,
      name: getCachedItemName(item.id),
      rarity: item.rarity || 0,
      level: item.level || 0,
      price: priceMap[item.id]?.price || null,
      instanceIds: instanceIds,
      instances: instanceNames
    }
  })
})

// Autocomplete suggestions (COLLECTIVE)
const autocompleteItemsCollective = computed(() => {
  if (!searchNameCollective.value || searchNameCollective.value.length < 2) return []
  
  const search = searchNameCollective.value.toLowerCase()
  return allItemsCollective.value
    .filter(item => item.name.toLowerCase().includes(search))
    .slice(0, 10)
})

// Filter and sort items (COLLECTIVE)
const filteredAndSortedItemsCollective = computed(() => {
  let result = [...allItemsCollective.value]
  
  // Filter by name
  if (searchNameCollective.value) {
    const search = searchNameCollective.value.toLowerCase()
    result = result.filter(item => item.name.toLowerCase().includes(search))
  }
  
  // Filter by rarity
  if (filterRaritiesCollective.value.length === 0) {
    result = []
  } else if (filterRaritiesCollective.value.length < 8) {
    result = result.filter(item => filterRaritiesCollective.value.includes(item.rarity))
  }
  
  // Filter by level
  if (filterLevelMinCollective.value !== '' && filterLevelMinCollective.value != null) {
    result = result.filter(item => item.level >= filterLevelMinCollective.value)
  }
  if (filterLevelMaxCollective.value !== '' && filterLevelMaxCollective.value != null) {
    result = result.filter(item => item.level <= filterLevelMaxCollective.value)
  }
  
  // Filter by instances
  const fi = filterInstancesCollective.value || []
  if (fi.length === 0) {
    result = []
  } else if (fi.length < allInstancesList.value.length) {
    result = result.filter(item => {
      return item.instanceIds.some(instId => fi.includes(instId))
    })
  }
  
  // Sort
  result.sort((a, b) => {
    let aVal = a[sortColumnCollective.value]
    let bVal = b[sortColumnCollective.value]
    
    if (sortColumnCollective.value === 'instances') {
      aVal = a.instanceIds?.length || 0
      bVal = b.instanceIds?.length || 0
    } else if (sortColumnCollective.value === 'price') {
      aVal = aVal ?? -1
      bVal = bVal ?? -1
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirectionCollective.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirectionCollective.value === 'asc' ? 1 : -1
    return 0
  })
  
  return result
})

// Pagination computed properties (COLLECTIVE)
const totalPagesCollective = computed(() => {
  return Math.ceil(filteredAndSortedItemsCollective.value.length / itemsPerPageCollective.value)
})

const paginatedItemsCollective = computed(() => {
  const start = (currentPageCollective.value - 1) * itemsPerPageCollective.value
  const end = start + itemsPerPageCollective.value
  return filteredAndSortedItemsCollective.value.slice(start, end)
})

const startItemCollective = computed(() => {
  if (filteredAndSortedItemsCollective.value.length === 0) return 0
  return (currentPageCollective.value - 1) * itemsPerPageCollective.value + 1
})

const endItemCollective = computed(() => {
  const end = currentPageCollective.value * itemsPerPageCollective.value
  return Math.min(end, filteredAndSortedItemsCollective.value.length)
})

// Reset to page 1 when filters change (COLLECTIVE)
watch([searchNameCollective, filterRaritiesCollective, filterLevelMinCollective, filterLevelMaxCollective, filterInstancesCollective, itemsPerPageCollective], () => {
  currentPageCollective.value = 1
})

// ========================================
// PERSONAL TAB FUNCTIONS
// ========================================

// Search helpers (PERSONAL)
function onSearchInputPersonal() {
  showAutocompletePersonal.value = searchNamePersonal.value.length >= 2
}

function selectItemPersonal(item) {
  searchNamePersonal.value = item.name
  showAutocompletePersonal.value = false
}

// Rarity filter helpers (PERSONAL)
function toggleRarityPersonal(rarity) {
  const index = filterRaritiesPersonal.value.indexOf(rarity)
  if (index === -1) {
    filterRaritiesPersonal.value.push(rarity)
  } else {
    filterRaritiesPersonal.value.splice(index, 1)
  }
}

function toggleAllRaritiesPersonal(selectAll) {
  filterRaritiesPersonal.value = selectAll ? [0, 1, 2, 3, 4, 5, 6, 7] : []
  isRarityDropdownOpenPersonal.value = false
}

function getRarityDisplayTextPersonal() {
  const count = filterRaritiesPersonal.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === 8) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/8`
}

// Instance filter helpers (PERSONAL)
function toggleInstancePersonal(instanceId) {
  const arr = filterInstancesPersonal.value || []
  const index = arr.indexOf(instanceId)
  if (index === -1) {
    arr.push(instanceId)
  } else {
    arr.splice(index, 1)
  }
  filterInstancesPersonal.value = arr
}

function toggleAllInstancesPersonal(selectAll) {
  filterInstancesPersonal.value = selectAll ? allInstancesList.value.map(i => i.id) : []
}

function getInstancesDisplayTextPersonal() {
  const arr = filterInstancesPersonal.value || []
  const count = arr.length
  const total = allInstancesList.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === total) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/${total}`
}

// Level validation helpers (PERSONAL)
function validateLevelMinPersonal(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMinPersonal.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMinPersonal.value = 1
    } else if (num > 245) {
      filterLevelMinPersonal.value = 245
    } else {
      filterLevelMinPersonal.value = num
    }
  }
}

function validateLevelMaxPersonal(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMaxPersonal.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMaxPersonal.value = 1
    } else if (num > 245) {
      filterLevelMaxPersonal.value = 245
    } else {
      filterLevelMaxPersonal.value = num
    }
  }
}

function sortByPersonal(column) {
  if (sortColumnPersonal.value === column) {
    sortDirectionPersonal.value = sortDirectionPersonal.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumnPersonal.value = column
    sortDirectionPersonal.value = 'asc'
  }
}

// Personal price update function
function updatePricePersonal(itemId, newPrice) {
  const price = newPrice === '' ? null : parseInt(newPrice)
  if (isNaN(price) && price !== null) return
  personalPricesStore.updatePrice(appStore.config.server, itemId, price)
}

// Clear all personal prices
function clearAllPersonalPrices() {
  if (confirm('⚠️ ' + t('divers.prices_clear_personal_confirm'))) {
    personalPricesStore.clearServer(appStore.config.server)
  }
}

// ========================================
// COLLECTIVE TAB FUNCTIONS
// ========================================

// Search helpers (COLLECTIVE)
function onSearchInputCollective() {
  showAutocompleteCollective.value = searchNameCollective.value.length >= 2
}

function selectItemCollective(item) {
  searchNameCollective.value = item.name
  showAutocompleteCollective.value = false
}

// Rarity filter helpers (COLLECTIVE)
function toggleRarityCollective(rarity) {
  const index = filterRaritiesCollective.value.indexOf(rarity)
  if (index === -1) {
    filterRaritiesCollective.value.push(rarity)
  } else {
    filterRaritiesCollective.value.splice(index, 1)
  }
}

function toggleAllRaritiesCollective(selectAll) {
  filterRaritiesCollective.value = selectAll ? [0, 1, 2, 3, 4, 5, 6, 7] : []
  isRarityDropdownOpenCollective.value = false
}

function getRarityDisplayTextCollective() {
  const count = filterRaritiesCollective.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === 8) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/8`
}

// Instance filter helpers (COLLECTIVE)
function toggleInstanceCollective(instanceId) {
  const arr = filterInstancesCollective.value || []
  const index = arr.indexOf(instanceId)
  if (index === -1) {
    arr.push(instanceId)
  } else {
    arr.splice(index, 1)
  }
  filterInstancesCollective.value = arr
}

function toggleAllInstancesCollective(selectAll) {
  filterInstancesCollective.value = selectAll ? allInstancesList.value.map(i => i.id) : []
}

function getInstancesDisplayTextCollective() {
  const arr = filterInstancesCollective.value || []
  const count = arr.length
  const total = allInstancesList.value.length
  if (count === 0) return t('divers.level_ranges_none')
  if (count === total) return t('divers.level_ranges_all')
  return `${count.toString().padStart(2, ' ')}/${total}`
}

// Level validation helpers (COLLECTIVE)
function validateLevelMinCollective(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMinCollective.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMinCollective.value = 1
    } else if (num > 245) {
      filterLevelMinCollective.value = 245
    } else {
      filterLevelMinCollective.value = num
    }
  }
}

function validateLevelMaxCollective(event) {
  const value = event.target.value
  if (value === '') {
    filterLevelMaxCollective.value = ''
    return
  }
  const num = parseInt(value)
  if (!isNaN(num)) {
    if (num < 1) {
      filterLevelMaxCollective.value = 1
    } else if (num > 245) {
      filterLevelMaxCollective.value = 245
    } else {
      filterLevelMaxCollective.value = num
    }
  }
}

function sortByCollective(column) {
  if (sortColumnCollective.value === column) {
    sortDirectionCollective.value = sortDirectionCollective.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumnCollective.value = column
    sortDirectionCollective.value = 'asc'
  }
}

// P2P price update function (COLLECTIVE)
function updatePriceCollective(itemId, newPrice) {
  if (!p2pStore.isInitialized) {
    console.warn('⚠️ P2P store not initialized yet, skipping price update')
    return
  }
  const price = newPrice === '' ? null : parseInt(newPrice)
  if (isNaN(price) && price !== null) return
  p2pStore.updatePrice(appStore.config.server, itemId, price)
}

// ========================================
// SHARED FUNCTIONS
// ========================================

function getRarityName(rarity) {
  const names = {
    0: t('divers.rarity_common'),
    1: t('divers.rarity_unusual'),
    2: t('divers.rarity_rare'),
    3: t('divers.rarity_mythical'),
    4: t('divers.rarity_legendary'),
    5: t('divers.rarity_relic'),
    6: t('divers.rarity_souvenir'),
    7: t('divers.rarity_epic')
  }
  return names[rarity] || t('divers.rarity_common')
}

// Debug function for Gun DB inspection
function inspectGunDB() {
  console.log('🔍 Inspecting Gun.js Database from PricesView...')
  p2pStore.inspectLocalDB()
}

// Debug function for raw prices inspection
function inspectRawPrices() {
  console.log('📊 Inspecting Raw Prices from PricesView...')
  p2pStore.inspectRawPrices()
}

// Debug function for connectivity test
function testConnectivity() {
  console.log('🔗 Testing Gun connectivity from PricesView...')
  p2pStore.testConnectivity()
}

// Debug function to clear all prices
function clearAllPrices() {
  if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données de prix ? Cette action est irréversible.')) {
    console.log('🗑️ Clearing all prices from PricesView...')
    p2pStore.clearAllPrices()
  }
}

// Debug function to inspect localStorage
function inspectLocalStorage() {
  console.log('🔍 Inspecting localStorage from PricesView...')
  p2pStore.inspectLocalStorage()
}

// Switch to pure P2P mode
function switchToPureP2P() {
  console.log('🔄 Switching to pure P2P mode...')
  p2pStore.switchToPureP2P()
}

// Switch to hybrid P2P mode
function switchToHybridP2P() {
  console.log('🔄 Switching to hybrid P2P mode...')
  p2pStore.switchToHybridP2P()
}

// Switch to online-only mode
function switchToOnlineOnly() {
  console.log('🔄 Switching to online-only mode...')
  p2pStore.switchToOnlineOnly()
}
</script>
