<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gray-950 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium">Generate Metadata</h2>
          <p class="text-sm text-gray-400 mt-1">Upload images to generate Adobe Stock metadata powered by AI</p>
        </div>

        <!-- Mode Toggle -->
        <div class="inline-flex bg-white/10 rounded-lg p-0.5">
          <button
            @click="mode = 'single'"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            :class="mode === 'single' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'"
          >
            Single
          </button>
          <button
            @click="mode = 'batch'"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            :class="mode === 'batch' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'"
          >
            Batch
          </button>
        </div>
      </div>
    </div>

    <!-- Single Mode -->
    <div v-if="mode === 'single'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column -->
      <div class="space-y-5">
        <!-- Upload Area -->
        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Upload Image</h3>

          <div
            v-if="!imagePreview"
            class="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all"
            :class="{ 'cursor-pointer': !compressing, 'opacity-50 cursor-wait': compressing }"
            @click="!compressing && $refs.fileInput.click()"
            @dragover.prevent
            @drop.prevent="!compressing && handleDrop($event)"
          >
            <div v-if="compressing" class="flex flex-col items-center">
              <svg class="animate-spin h-10 w-10 text-gray-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-sm text-gray-500">Compressing image...</p>
            </div>
            <template v-else>
              <PhotoIcon class="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p class="text-sm text-gray-500 mb-1">
                <span class="text-gray-900 font-medium">Click to upload</span> or drag and drop
              </p>
              <p class="text-xs text-gray-400">PNG, JPG, WEBP, SVG, EPS, AI up to 5MB</p>
            </template>
            <input ref="fileInput" type="file" accept="image/*,.eps,.ai,.svg" @change="handleFileSelect" class="hidden" :disabled="compressing" />
          </div>

          <div v-else class="relative">
            <div class="relative rounded-xl overflow-hidden border border-gray-100">
              <img :src="imagePreview" alt="Preview" class="w-full h-64 object-cover" />
              <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p class="text-white text-sm font-medium truncate">{{ selectedFile?.name }}</p>
                <p class="text-white/70 text-xs mt-0.5">{{ formatFileSize(selectedFile?.size) }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="clearFile"
              class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all"
              title="Remove image"
            >
              <XMarkIcon class="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <!-- Settings -->
        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Settings</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">
                AI Provider <span class="text-gray-400">(Optional)</span>
              </label>
              <select v-model="selectedProvider" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors" @change="onProviderChange">
                <option value="">Default provider</option>
                <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                  {{ provider.name }}
                </option>
              </select>
            </div>

            <div v-if="selectedProvider">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">
                Model <span class="text-gray-400">(Optional)</span>
              </label>
              <select v-model="selectedModel" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors">
                <option value="">Default model</option>
                <option v-for="model in availableModels" :key="model.id" :value="model.id">
                  {{ model.name }}{{ model.is_default ? ' (default)' : '' }}
                </option>
              </select>
              <p v-if="availableModels.length === 0" class="text-xs text-gray-400 mt-1">Using default model for this provider</p>
            </div>

            <div v-if="creditsInfo" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-xs text-gray-400">Available Credits</p>
                <p class="text-sm font-semibold text-gray-900">{{ creditsInfo.currentCredit || 0 }}</p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white capitalize">{{ creditsInfo.accountType }}</span>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          type="button"
          @click="handleGenerate"
          :disabled="!selectedFile || loading"
          class="w-full py-3 px-6 rounded-xl font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating... (1-3 min)</span>
          </div>
          <div v-else class="flex items-center justify-center">
            <SparklesIcon class="w-4 h-4 mr-2" />
            <span>Generate Metadata</span>
          </div>
        </button>
      </div>

      <!-- Right Column: Results -->
      <div class="space-y-5">
        <!-- Empty State -->
        <div v-if="!result && !loading" class="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-24">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <SparklesIcon class="w-8 h-8 text-gray-300" />
            </div>
            <p class="text-sm text-gray-500">Upload an image to generate metadata</p>
            <p class="text-xs text-gray-400 mt-1">AI will analyze your image and generate title, keywords, and more</p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-24">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-900">AI is analyzing your image...</p>
            <p class="text-xs text-gray-400 mt-1">This may take 1-3 minutes</p>
          </div>
        </div>

        <!-- Success Result -->
        <div v-if="result && result.metadata && !loading" class="space-y-5">
          <div class="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            <!-- Title -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-400">Title</label>
                <button @click="copyToClipboard(result.metadata.title)" class="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  <ClipboardIcon class="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
              <p class="text-sm font-medium text-gray-900 leading-relaxed">{{ result.metadata.title }}</p>
            </div>

            <!-- Description -->
            <div v-if="result.metadata.description">
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-400">Description</label>
                <button @click="copyToClipboard(result.metadata.description)" class="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  <ClipboardIcon class="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
              <p class="text-sm text-gray-700 leading-relaxed">{{ result.metadata.description }}</p>
            </div>

            <!-- SEO Score -->
            <div class="p-4 bg-gray-50 rounded-xl">
              <div class="flex items-center justify-between mb-3">
                <label class="text-xs font-medium text-gray-400">SEO Score</label>
                <span class="text-lg font-bold" :class="getSeoScoreTextClass(calculateSeoScore(result.metadata))">{{ calculateSeoScore(result.metadata) }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="getSeoScoreColor(calculateSeoScore(result.metadata))"
                  :style="{ width: `${calculateSeoScore(result.metadata)}%` }"
                ></div>
              </div>
            </div>

            <!-- Categories -->
            <div v-if="result.metadata.categories?.length">
              <label class="text-xs font-medium text-gray-400 block mb-2">Categories</label>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="cat in result.metadata.categories" :key="cat" class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                  {{ cat }}
                </span>
              </div>
            </div>

            <!-- Keywords -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-gray-400">Keywords ({{ result.metadata.keywords?.length || 0 }})</label>
                <button @click="copyKeywords" class="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  <ClipboardIcon class="w-3.5 h-3.5" />
                  Copy all
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="keyword in result.metadata.keywords" :key="keyword" class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer transition-colors" @click="copyToClipboard(keyword)">
                  {{ keyword }}
                </span>
              </div>
            </div>

            <!-- Image Details -->
            <div>
              <label class="text-xs font-medium text-gray-400 block mb-2">Image Details</label>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div class="flex justify-between py-1.5 border-b border-gray-50">
                  <span class="text-gray-400">Orientation</span>
                  <span class="font-medium text-gray-900 capitalize">{{ result.metadata.orientation || '-' }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-gray-50">
                  <span class="text-gray-400">Type</span>
                  <span class="font-medium text-gray-900 capitalize">{{ result.metadata.imageType || '-' }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-gray-50">
                  <span class="text-gray-400">People</span>
                  <span class="font-medium text-gray-900">{{ result.metadata.peopleCount ?? '-' }}</span>
                </div>
                <div class="flex justify-between py-1.5 border-b border-gray-50">
                  <span class="text-gray-400">Commercial</span>
                  <span class="font-medium text-gray-900 capitalize">{{ result.metadata.commercialViability || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Dominant Colors -->
            <div v-if="result.metadata.dominantColors?.length">
              <label class="text-xs font-medium text-gray-400 block mb-2">Dominant Colors</label>
              <div class="flex gap-2">
                <div
                  v-for="color in result.metadata.dominantColors"
                  :key="color"
                  class="w-8 h-8 rounded-lg border border-gray-200"
                  :style="{ backgroundColor: color }"
                  :title="color"
                ></div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="resetForm" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
              <PhotoIcon class="w-4 h-4" />
              Generate Another
            </button>
            <div class="relative">
              <button @click="showBatchExportMenu = !showBatchExportMenu" class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                <ArrowDownTrayIcon class="w-4 h-4" /> Export
              </button>
              <div v-if="showBatchExportMenu" class="absolute bottom-full mb-1 right-0 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-40 py-1.5" @mouseleave="showBatchExportMenu = false">
                <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Export to Platform</div>
                <div v-for="p in batchPlatforms" :key="p.id" class="px-1">
                  <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleSingleExport(p.id, 'csv')">
                    <span class="text-xs text-gray-700">{{ p.name }}</span>
                    <span class="text-xs text-gray-400">CSV</span>
                  </div>
                  <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleSingleExport(p.id, 'xlsx')">
                    <span class="text-xs text-gray-700">{{ p.name }}</span>
                    <span class="text-xs text-gray-400">Excel</span>
                  </div>
                </div>
              </div>
            </div>
            <router-link to="/user/generations" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-center flex items-center justify-center gap-2 transition-colors">
              View History
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </router-link>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="result && !result.metadata && !loading" class="bg-white rounded-xl border border-rose-100 p-8 text-center">
          <XCircleIcon class="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <p class="text-sm font-medium text-gray-900 mb-2">Generation Failed</p>
          <p class="text-xs text-gray-500 mb-4">{{ result.errorMessage || 'An error occurred' }}</p>
          <button @click="handleGenerate" class="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">Try Again</button>
        </div>
      </div>
    </div>

    <!-- Batch Mode -->
    <div v-if="mode === 'batch'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-1 space-y-5">
        <!-- Upload -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Upload Images</h3>

          <div
            v-if="batchFiles.length === 0"
            class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer"
            @click="$refs.batchFileInput.click()"
            @dragover.prevent
            @drop.prevent="handleBatchDrop"
          >
            <PhotoIcon class="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p class="text-sm text-gray-500 mb-1"><span class="text-gray-900 font-medium">Click to upload</span></p>
            <p class="text-xs text-gray-400">PNG, JPG, WEBP, SVG, EPS, AI up to 5MB each</p>
            <input ref="batchFileInput" type="file" accept="image/*,.eps,.ai,.svg" multiple @change="handleBatchFileSelect" class="hidden" />
          </div>

          <div v-else>
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs text-gray-400">{{ batchFiles.length }} image{{ batchFiles.length !== 1 ? 's' : '' }}</p>
              <button @click="clearBatchFiles" class="text-xs text-gray-400 hover:text-gray-900 transition-colors" :disabled="batchLoading">Clear all</button>
            </div>

            <div v-if="!batchLoading"
              class="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer mb-3"
              @click="$refs.batchFileInput.click()"
              @dragover.prevent
              @drop.prevent="handleBatchDrop"
            >
              <p class="text-xs text-gray-400">+ Add more</p>
              <input ref="batchFileInput" type="file" accept="image/*,.eps,.ai,.svg" multiple @change="handleBatchFileSelect" class="hidden" />
            </div>

            <div class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              <div v-for="(file, index) in batchFiles" :key="index" class="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                <div class="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 relative" :class="{ 'bg-gray-100': !file.preview }">
                  <img v-if="file.preview" :src="file.preview" :alt="file.name" class="w-full h-full object-cover" :class="{ 'opacity-50': compressingFiles.has(index) }" />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div v-if="compressingFiles.has(index)" class="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-gray-900 truncate">{{ file.name }}</p>
                  <p class="text-xs text-gray-400">
                    <template v-if="compressingFiles.has(index)">
                      <span class="text-amber-600">Compressing...</span>
                    </template>
                    <template v-else>
                      {{ formatFileSize(file.size) }}
                    </template>
                  </p>
                </div>
                <button v-if="!batchLoading && !compressingFiles.has(index)" @click.stop="removeBatchFile(index)" class="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all">
                  <XMarkIcon class="w-3.5 h-3.5 text-gray-400 hover:text-gray-900" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Settings</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">AI Provider <span class="text-gray-400">(Optional)</span></label>
              <select v-model="selectedProvider" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors" @change="onProviderChange">
                <option value="">Default provider</option>
                <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
              </select>
            </div>
            <div v-if="selectedProvider">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">
                Model <span class="text-gray-400">(Optional)</span>
              </label>
              <select v-model="selectedModel" class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors">
                <option value="">Default model</option>
                <option v-for="model in availableModels" :key="model.id" :value="model.id">
                  {{ model.name }}{{ model.is_default ? ' (default)' : '' }}
                </option>
              </select>
              <p v-if="availableModels.length === 0" class="text-xs text-gray-400 mt-1">Using default model for this provider</p>
            </div>
            <div v-if="creditsInfo" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-xs text-gray-400">Available Credits</p>
                <p class="text-sm font-semibold text-gray-900">{{ creditsInfo.currentCredit || 0 }}</p>
              </div>
              <span class="text-xs text-gray-400">{{ batchFiles.length }} credit{{ batchFiles.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          v-if="batchResults.length < batchFiles.length"
          type="button"
          @click="handleBatchGenerate"
          :disabled="batchFiles.length === 0 || batchLoading"
          class="w-full py-3 px-6 rounded-xl font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div v-if="batchLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ batchProgress }}/{{ batchFiles.length }} done</span>
          </div>
          <div v-else class="flex items-center justify-center">
            <SparklesIcon class="w-4 h-4 mr-2" />
            <span>Generate for {{ batchFiles.length }} Image{{ batchFiles.length !== 1 ? 's' : '' }}</span>
          </div>
        </button>
      </div>

      <!-- Right Column: Queue & Results -->
      <div class="lg:col-span-2">
        <div v-if="batchFiles.length === 0 && !batchLoading" class="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-24">
          <div class="text-center">
            <PhotoIcon class="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p class="text-sm text-gray-400">Upload images to see processing queue</p>
          </div>
        </div>

        <div v-else class="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">
              {{ batchLoading ? 'Processing' : 'Results' }} <span class="text-gray-400 ml-1">({{ batchResults.length }}/{{ batchFiles.length }})</span>
            </h3>
            <div v-if="batchResults.length === batchFiles.length && batchFiles.length > 0" class="flex items-center gap-2">
              <button @click="resetBatchForm" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <PhotoIcon class="w-3.5 h-3.5 mr-1.5" /> New Batch
              </button>
              <div class="relative">
                <button @click="showBatchExportMenu = !showBatchExportMenu" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  <ArrowDownTrayIcon class="w-3.5 h-3.5 mr-1.5" /> Export All
                </button>
                <div v-if="showBatchExportMenu" class="absolute right-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-40 py-1.5" @mouseleave="showBatchExportMenu = false">
                  <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Export to Platform</div>
                  <div v-for="p in batchPlatforms" :key="p.id" class="px-1">
                    <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleBatchExport(p.id, 'csv')">
                      <span class="text-xs text-gray-700">{{ p.name }}</span>
                      <span class="text-xs text-gray-400">CSV</span>
                    </div>
                    <div class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer" @click="handleBatchExport(p.id, 'xlsx')">
                      <span class="text-xs text-gray-700">{{ p.name }}</span>
                      <span class="text-xs text-gray-400">Excel</span>
                    </div>
                  </div>
                </div>
              </div>
              <router-link to="/user/generations" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                View History
                <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </router-link>
            </div>
          </div>

          <!-- Delay Countdown Banner -->
          <div v-if="delayCountdown > 0" class="mx-4 mt-3 mb-1 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 animate-fadeIn">
            <div class="relative w-10 h-10 flex-shrink-0">
              <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#fde68a" stroke-width="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"
                  :stroke-dasharray="94.25"
                  :stroke-dashoffset="94.25 - (94.25 * delayCountdown / (delaySeconds || 10))"
                  class="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-700">{{ delayCountdown }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-amber-800">Waiting before next image</p>
              <p class="text-xs text-amber-600 mt-0.5">{{ delayCountdown }} second{{ delayCountdown !== 1 ? 's' : '' }} remaining — processing will resume automatically</p>
            </div>
            <div class="w-full max-w-[120px]">
              <div class="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                <div class="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-linear" :style="{ width: `${(delayCountdown / (delaySeconds || 10)) * 100}%` }"></div>
              </div>
            </div>
          </div>

          <div class="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar" :class="{ 'mt-2': delayCountdown > 0 }">
            <div v-for="(file, index) in batchFiles" :key="index" class="group">
              <div
                class="flex items-center gap-4 p-4"
                :class="{ 'cursor-pointer hover:bg-gray-50/50': batchResults[index]?.success }"
                @click="batchResults[index]?.success && (displayResultIndex = displayResultIndex === index ? -1 : index)"
              >
                <!-- Status Icon -->
                <div class="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center"
                  :class="{
                    'bg-gray-100 text-gray-400': getImageStatus(index) === 'queue',
                    'bg-violet-100 text-violet-600': getImageStatus(index) === 'loading',
                    'bg-amber-100 text-amber-600': getImageStatus(index) === 'delaying',
                    'bg-emerald-100 text-emerald-600': getImageStatus(index) === 'done',
                    'bg-rose-100 text-rose-600': getImageStatus(index) === 'error'
                  }"
                >
                  <svg v-if="getImageStatus(index) === 'queue'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.25.707l2.829 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
                  <svg v-else-if="getImageStatus(index) === 'loading'" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span v-else-if="getImageStatus(index) === 'delaying'" class="text-xs font-bold">{{ delayCountdown }}</span>
                  <CheckCircleIcon v-else-if="getImageStatus(index) === 'done'" class="w-4 h-4" />
                  <XCircleIcon v-else class="w-4 h-4" />
                </div>

                <!-- Thumbnail -->
                <div class="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100" :class="{ 'bg-gray-100': !file.preview }">
                  <img v-if="file.preview" :src="file.preview" :alt="file.name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    <template v-if="getImageStatus(index) === 'delaying'">
                      <span class="text-amber-600 font-medium">Waiting {{ delayCountdown }}s before processing...</span>
                    </template>
                    <template v-else>
                      {{ formatFileSize(file.size) }}
                    </template>
                  </p>
                </div>

                <!-- Expand Arrow -->
                <svg v-if="batchResults[index]?.success"
                  class="w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200"
                  :class="{ 'rotate-180': displayResultIndex === index }"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <!-- Delay Countdown Bar -->
              <div v-if="getImageStatus(index) === 'delaying'" class="px-4 pb-2 ml-12">
                <div class="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-linear"
                    :style="{ width: `${(delayCountdown / (delaySeconds || 10)) * 100}%` }"
                  ></div>
                </div>
              </div>

              <!-- Metadata (Collapsible) -->
              <div v-if="displayResultIndex === index && batchResults[index]?.success" class="px-4 pb-4 ml-16 animate-fadeIn">
                <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                  <!-- SEO Score -->
                  <div class="p-3 bg-white rounded-lg border border-gray-100">
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-xs font-medium text-gray-400">SEO Score</label>
                      <span class="text-lg font-bold" :class="getSeoScoreTextClass(calculateSeoScore(batchResults[index].metadata))">{{ calculateSeoScore(batchResults[index].metadata) }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                        :class="getSeoScoreColor(calculateSeoScore(batchResults[index].metadata))"
                        :style="{ width: `${calculateSeoScore(batchResults[index].metadata)}%` }"></div>
                    </div>
                  </div>

                  <!-- Title -->
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="text-xs font-medium text-gray-400">Title</label>
                      <button @click.stop="copyToClipboard(batchResults[index].metadata.title)" class="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <ClipboardIcon class="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <p class="text-sm font-medium text-gray-900">{{ batchResults[index].metadata.title }}</p>
                  </div>

                  <!-- Keywords -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-xs font-medium text-gray-400">Keywords ({{ batchResults[index].metadata.keywords?.length || 0 }})</label>
                      <button @click.stop="copyKeywordsFromResult(batchResults[index])" class="text-xs text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <ClipboardIcon class="w-3.5 h-3.5" /> Copy all
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="keyword in batchResults[index].metadata.keywords.slice(0, 8)" :key="keyword" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700">{{ keyword }}</span>
                      <span v-if="batchResults[index].metadata.keywords.length > 8" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500">+{{ batchResults[index].metadata.keywords.length - 8 }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error -->
              <div v-if="getImageStatus(index) === 'error'" class="px-4 pb-4 ml-16">
                <div class="bg-rose-50 rounded-lg p-3">
                  <p class="text-xs text-rose-600">{{ batchResults[index]?.errorMessage || 'Generation failed' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Advanced Options Panel -->
    <transition name="panel-slide">
      <div
        v-if="showAdvanced"
        class="fixed top-4 right-4 bottom-4 w-72 bg-gray-950 rounded-2xl border border-white/10 shadow-2xl z-30 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-white">Advanced Options</h3>
              <p class="text-xs text-gray-500 mt-0.5">Single &amp; batch mode</p>
            </div>
          </div>
          <button @click="showAdvanced = false" class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <XMarkIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 px-5 py-5 space-y-6 overflow-y-auto custom-scrollbar-dark">
          <!-- Keyword Count -->
          <div>
            <label class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-300">Keyword Count</span>
              <span class="text-xs text-gray-600">10-50</span>
            </label>
            <input v-model.number="keywordCount" type="number" min="10" max="50" placeholder="Auto (typically 30-50)" class="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors" />
          </div>

          <!-- Negative Keywords -->
          <div>
            <label class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-300">Negative Keywords</span>
              <span class="text-xs text-gray-600">Optional</span>
            </label>
            <input v-model="negativeKeywordsText" type="text" placeholder="word1, word2, word3" class="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors" />
            <p class="text-xs text-gray-600 mt-1.5">Excluded from generated keywords</p>
          </div>

          <!-- Delay -->
          <div>
            <label class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-gray-300">Delay Between Images</span>
              <span class="text-xs text-gray-600">0-30s</span>
            </label>
            <div class="flex items-center gap-3">
              <input v-model.number="delaySeconds" type="range" min="0" max="30" step="1" class="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md" />
              <div class="w-12 text-center">
                <span class="text-sm font-semibold text-white">{{ delaySeconds }}</span>
                <span class="text-xs text-gray-600 ml-0.5">s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-white/5">
          <p class="text-xs text-gray-600 text-center">Settings apply to all generation modes</p>
        </div>
      </div>
    </transition>

    <!-- Draggable Toggle Button -->
    <div
      v-if="!showAdvanced"
      class="fixed z-30 select-none"
      :style="{ top: fabY + 'px', left: fabX + 'px' }"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
    >
      <button
        @click="onFabClick"
        class="flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95 transition-all select-none"
        :class="{ 'cursor-grabbing': dragging, 'cursor-grab': !dragging }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Advanced
      </button>
    </div>

    <!-- Toast -->
    <transition name="slide-up">
      <div v-if="copied" class="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50">
        <CheckCircleIcon class="w-5 h-5 text-emerald-400 mr-2" />
        <span class="text-sm">Copied to clipboard!</span>
      </div>
    </transition>

    <!-- Credit Modal -->
    <transition name="slide-up">
      <div v-if="showCreditModal" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" @click="showCreditModal = false">
        <div class="bg-white rounded-xl max-w-lg w-full p-6" @click.stop>
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-base font-semibold text-gray-900">
                {{ creditModalType === 'subscribe' ? 'Subscribe to Continue' : 'Add Credits' }}
              </h3>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ creditModalType === 'subscribe' ? 'Your credits are empty. Choose a plan to get started.' : 'Your credits are empty. Choose a package to add credits.' }}
              </p>
            </div>
            <button @click="showCreditModal = false" class="text-gray-400 hover:text-gray-600">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div v-if="availablePackages.length === 0" class="text-center py-8 text-gray-400">
            <p class="text-sm">No packages available</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="pkg in availablePackages"
              :key="pkg.id"
              class="border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors cursor-pointer"
              @click="selectedPackage = pkg"
              :class="selectedPackage?.id === pkg.id ? 'border-gray-900 bg-gray-50' : ''"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ pkg.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ pkg.creditAmount }} credits · {{ pkg.durationDays }} days</p>
                  <p v-if="pkg.description" class="text-xs text-gray-400 mt-1">{{ pkg.description }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(pkg.priceAmount || pkg.price) }}</p>
                  <p class="text-xs text-gray-400 mt-0.5 capitalize">{{ pkg.packageType || pkg.type }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5">
            <button
              @click="selectedPackage && handlePurchase(selectedPackage.id)"
              :disabled="!selectedPackage || purchasing"
              class="w-full py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ purchasing ? 'Processing...' : (creditModalType === 'subscribe' ? 'Subscribe Now' : 'Add Credits') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhotoIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import { userService } from '../../services/userService'
import { publicService } from '../../services/publicService'
import { getPlatforms, exportGenerations } from '../../services/exportService'

const router = useRouter()
const selectedFile = ref(null)
const imagePreview = ref(null)
const selectedProvider = ref('')
const selectedModel = ref('')
const loading = ref(false)
const result = ref(null)
const providers = ref([])
const availableModels = ref([])
const creditsInfo = ref(null)
const copied = ref(false)
const compressing = ref(false) // Single mode compression indicator
const showCreditModal = ref(false)
const creditModalType = ref('') // 'subscribe' or 'add-credit'
const purchasing = ref(false)
const availablePackages = ref([])
const selectedPackage = ref(null)

// Batch state
const mode = ref('single')
const batchFiles = ref([])
const batchLoading = ref(false)
const batchResults = ref([])
const currentlyProcessing = ref(null)
const imageStatus = ref({})
const displayResultIndex = ref(-1)
const compressingFiles = ref(new Set())
const delayCountdown = ref(0)
const delayTargetIndex = ref(-1)
let countdownInterval = null

const batchProgress = computed(() => {
  return Object.values(imageStatus.value).filter(s => s === 'done' || s === 'error').length
})

// Advanced options
const showAdvanced = ref(false)
const keywordCount = ref(null)
const negativeKeywordsText = ref('')
const delaySeconds = ref(10)
const showBatchExportMenu = ref(false)
const batchPlatforms = getPlatforms()

// Draggable FAB state
const fabX = ref(window.innerWidth - 160)
const fabY = ref(100)
const dragging = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const hasDragged = ref(false)

const onDragStart = (e) => {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  dragOffsetX.value = clientX - fabX.value
  dragOffsetY.value = clientY - fabY.value
  dragging.value = true
  hasDragged.value = false

  const onMove = (ev) => {
    if (!dragging.value) return
    const cx = ev.touches ? ev.touches[0].clientX : ev.clientX
    const cy = ev.touches ? ev.touches[0].clientY : ev.clientY
    const newX = Math.max(0, Math.min(window.innerWidth - 80, cx - dragOffsetX.value))
    const newY = Math.max(0, Math.min(window.innerHeight - 80, cy - dragOffsetY.value))
    if (Math.abs(newX - fabX.value) > 3 || Math.abs(newY - fabY.value) > 3) {
      hasDragged.value = true
    }
    fabX.value = newX
    fabY.value = newY
  }

  const onEnd = () => {
    dragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onEnd)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onEnd)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

const onFabClick = () => {
  if (hasDragged.value) {
    hasDragged.value = false
    return
  }
  showAdvanced.value = true
}

const VECTOR_TYPES = new Set(['image/svg+xml', 'application/postscript', 'application/pdf'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'eps', 'ai'])

const isVectorFile = (file) => {
  if (!file) return false
  if (VECTOR_TYPES.has(file.type)) return true
  const ext = (file.name || '').split('.').pop().toLowerCase()
  return ['eps', 'ai', 'svg'].includes(ext)
}

const isValidImageType = (file) => {
  if (!file) return false
  if (file.type && ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/postscript', 'application/pdf'].includes(file.type)) return true
  const ext = (file.name || '').split('.').pop().toLowerCase()
  if (IMAGE_EXTENSIONS.has(ext)) return true
  console.warn('[Single] Unknown file type:', file.type, 'ext:', ext)
  return false
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  console.log('[Single] File selected:', file?.name, 'type:', file?.type, 'size:', file?.size)
  if (file) processFile(file)
  event.target.value = ''
}

const handleDrop = (event) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const processFile = async (file) => {
  if (!isValidImageType(file)) {
    alert('Please upload a valid file (PNG, JPG, WEBP, SVG, EPS, AI)')
    return
  }

  const maxSize = isVectorFile(file) ? 5 * 1024 * 1024 : 20 * 1024 * 1024
  if (file.size > maxSize) {
    alert(`File size must be less than ${isVectorFile(file) ? '5MB' : '20MB'}`)
    return
  }

  if (isVectorFile(file)) {
    selectedFile.value = file
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onload = (e) => { imagePreview.value = e.target.result }
      reader.readAsDataURL(file)
    } else {
      imagePreview.value = null
    }
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = async (e) => {
    imagePreview.value = e.target.result

    if (file.size >= 2 * 1024 * 1024) {
      compressing.value = true
      const compressedFile = await compressImage(file)
      compressing.value = false

      if (compressedFile) {
        selectedFile.value = compressedFile
        const reader2 = new FileReader()
        reader2.onload = (e2) => { imagePreview.value = e2.target.result }
        reader2.readAsDataURL(compressedFile)
      }
    }
  }
  reader.readAsDataURL(file)
}

const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) => {
  return new Promise((resolve) => {
    if (file.size < 2 * 1024 * 1024) {
      resolve(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }))
          } else {
            resolve(null)
          }
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

const clearFile = () => {
  if (imagePreview.value && imagePreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  selectedFile.value = null
  imagePreview.value = null
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

onMounted(async () => {
  try {
    const [providersData, credits] = await Promise.all([
      publicService.getPublicProviders(),
      userService.getCredits()
    ])
    providers.value = providersData
    creditsInfo.value = credits
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

// Watch mode changes
watch(mode, (newMode) => {
  if (newMode === 'single') {
    batchFiles.value.forEach(f => {
      if (f.preview && f.preview.startsWith('blob:')) URL.revokeObjectURL(f.preview)
    })
    batchFiles.value = []
    batchLoading.value = false
    batchResults.value = []
    currentlyProcessing.value = null
    displayResultIndex.value = -1
    imageStatus.value = {}
  } else {
    result.value = null
  }
})

const onProviderChange = () => {
  selectedModel.value = ''
  availableModels.value = []
  if (selectedProvider.value) {
    loadModels(selectedProvider.value)
  }
}

const loadModels = async (providerId) => {
  try {
    const models = await userService.getProviderModels(providerId)
    availableModels.value = models
  } catch (error) {
    console.error('Failed to load models:', error)
    availableModels.value = []
  }
}

onMounted(async () => {
  try {
    const [providersData, credits] = await Promise.all([
      publicService.getPublicProviders(),
      userService.getCredits()
    ])
    providers.value = providersData
    creditsInfo.value = credits
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})

const handleGenerate = async () => {
  if (!selectedFile.value) return

  const credits = (creditsInfo.value?.currentCredit || 0)
  const hasDuration = creditsInfo.value?.hasDuration || false
  if (credits <= 0 && !hasDuration) {
    await openAddCreditModal()
    return
  }

  loading.value = true
  result.value = null

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    if (selectedProvider.value) formData.append('providerId', selectedProvider.value)
    if (selectedModel.value) formData.append('modelId', selectedModel.value)
    if (keywordCount.value && keywordCount.value >= 10 && keywordCount.value <= 50) {
      formData.append('keywordCount', keywordCount.value)
    }
    if (negativeKeywordsText.value.trim()) {
      const negKw = negativeKeywordsText.value.split(',').map(w => w.trim()).filter(Boolean)
      if (negKw.length > 0) formData.append('negativeKeywords', JSON.stringify(negKw))
    }

    const response = await userService.generateFromImage(formData)
    result.value = response
    const creditUsed = response?.creditUsed || 1
    const oldHasDuration = creditsInfo.value?.hasDuration
    if (creditsInfo.value) {
      creditsInfo.value.currentCredit = Math.max(0, (creditsInfo.value.currentCredit || 0) - creditUsed)
    }
    userService.getCredits().then(c => {
      creditsInfo.value = { ...c, hasDuration: c.hasDuration ?? oldHasDuration }
    }).catch(() => {})
  } catch (error) {
    console.error('Generation failed:', error)
    const errMsg = error.response?.data?.error || error.message || 'Unknown error occurred'
    if (errMsg.toLowerCase().includes('insufficient credit')) {
      await openAddCreditModal()
      return
    }
    result.value = {
      status: 'failed',
      errorMessage: errMsg
    }
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  clearFile()
  result.value = null
  keywordCount.value = null
  negativeKeywordsText.value = ''
  delaySeconds.value = 10
}

// Batch functions
const handleBatchFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  await addBatchFiles(files)
}

const handleBatchDrop = async (event) => {
  const files = Array.from(event.dataTransfer.files)
  await addBatchFiles(files)
}

const addBatchFiles = async (files) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/postscript', 'application/pdf']

  const wasComplete = !batchLoading.value && batchFiles.value.length > 0 && batchFiles.value.every((_, i) => {
    const s = imageStatus.value[i]
    return s === 'done' || s === 'error'
  })

  for (const file of files) {
    if (!validTypes.includes(file.type) && !isValidImageType(file)) {
      alert(`Skipping ${file.name}: Invalid file type`)
      continue
    }
    const maxSize = isVectorFile(file) ? 5 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Skipping ${file.name}: File too large (>${maxSize / 1024 / 1024}MB)`)
      continue
    }

    const newIndex = batchFiles.value.length
    
    let preview = null
    if (file.type === 'image/svg+xml') {
      preview = URL.createObjectURL(file)
    }
    
    batchFiles.value.push({ file, preview, name: file.name, size: file.size })
    imageStatus.value[newIndex] = 'queue'

    if (!isVectorFile(file)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        batchFiles.value[newIndex].preview = e.target.result
      }
      reader.readAsDataURL(file)

      if (file.size >= 2 * 1024 * 1024) {
        compressingFiles.value.add(newIndex)
        const compressedFile = await compressImage(file)
        compressingFiles.value.delete(newIndex)
        
        if (compressedFile) {
          batchFiles.value[newIndex] = { 
            file: compressedFile, 
            preview: null,
            name: compressedFile.name, 
            size: compressedFile.size 
          }
          const reader2 = new FileReader()
          reader2.onload = (e) => {
            batchFiles.value[newIndex].preview = e.target.result
          }
          reader2.readAsDataURL(compressedFile)
        }
      }
    }
  }

  if (wasComplete) {
    handleBatchGenerate(true)
  }
}

const removeBatchFile = (index) => {
  const file = batchFiles.value[index]
  if (file.preview && file.preview.startsWith('blob:')) {
    URL.revokeObjectURL(file.preview)
  }
  batchFiles.value.splice(index, 1)
}

const clearBatchFiles = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  delayCountdown.value = 0
  delayTargetIndex.value = -1
  batchFiles.value.forEach(f => {
    if (f.preview && f.preview.startsWith('blob:')) URL.revokeObjectURL(f.preview)
  })
  batchFiles.value = []
  batchLoading.value = false
  batchResults.value = []
  currentlyProcessing.value = null
  displayResultIndex.value = -1
  imageStatus.value = {}
  compressingFiles.value.clear()
}

const handleBatchGenerate = async (unprocessedOnly = false) => {
  if (batchFiles.value.length === 0) return

  const ci = creditsInfo.value || {}
  const credits = ci.currentCredit ?? 0
  const hasDuration = ci.hasDuration ?? false
  if (credits <= 0 && !hasDuration) {
    await openAddCreditModal()
    return
  }

  let indicesToProcess
  if (unprocessedOnly) {
    indicesToProcess = []
    batchFiles.value.forEach((_, index) => {
      const status = imageStatus.value[index]
      if (status !== 'done') {
        indicesToProcess.push(index)
      }
    })
    if (indicesToProcess.length === 0) return
  } else {
    indicesToProcess = batchFiles.value.map((_, i) => i)
    batchResults.value = []
    displayResultIndex.value = -1
    imageStatus.value = {}
    batchFiles.value.forEach((_, index) => {
      imageStatus.value[index] = 'queue'
    })
  }

  batchLoading.value = true
  currentlyProcessing.value = null

  const files = indicesToProcess.map(i => batchFiles.value[i].file)

  indicesToProcess.forEach(i => {
    if (imageStatus.value[i] !== 'done') {
      imageStatus.value[i] = 'queue'
    }
  })

  const firstIndex = indicesToProcess[0]
  imageStatus.value[firstIndex] = 'loading'
  currentlyProcessing.value = batchFiles.value[firstIndex].name

  const batchOptions = {}
  if (keywordCount.value && keywordCount.value >= 10 && keywordCount.value <= 50) {
    batchOptions.keywordCount = keywordCount.value
  }
  if (negativeKeywordsText.value.trim()) {
    const negKw = negativeKeywordsText.value.split(',').map(w => w.trim()).filter(Boolean)
    if (negKw.length > 0) batchOptions.negativeKeywords = negKw
  }
  if (delaySeconds.value > 0) {
    batchOptions.delayMs = delaySeconds.value * 1000
  }

  userService.batchGenerateFromImagesStream(
    files,
    selectedProvider.value || undefined,
    selectedModel.value || undefined,
    batchOptions,

    (data) => {
      const streamIndex = data.index
      const originalIndex = indicesToProcess[streamIndex]

      if (data.success) {
        imageStatus.value[originalIndex] = 'done'
        const creditUsed = data.data?.creditUsed || 1
        if (creditsInfo.value) {
          creditsInfo.value.currentCredit = Math.max(0, (creditsInfo.value.currentCredit || 0) - creditUsed)
        }
        batchResults.value.push({
          filename: data.filename,
          success: true,
          ...data.data,
          creditUsed: data.data?.creditUsed || 1,
          provider: data.data?.provider,
          model: data.data?.model,
          metadata: data.data?.metadata || data.data,
        })
        displayResultIndex.value = originalIndex
      } else {
        imageStatus.value[originalIndex] = 'error'
        batchResults.value.push({
          filename: data.filename,
          success: false,
          errorMessage: data.error || 'Generation failed'
        })
      }

      const nextStreamIndex = streamIndex + 1
      if (nextStreamIndex >= indicesToProcess.length) {
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
        }
        delayCountdown.value = 0
        batchLoading.value = false
        currentlyProcessing.value = null
        const oldHasDuration = creditsInfo.value?.hasDuration
        userService.getCredits().then(credits => {
          creditsInfo.value = { ...credits, hasDuration: credits.hasDuration ?? oldHasDuration }
        }).catch(() => {})
        return
      }

      const ri = creditsInfo.value || {}
      const remainingCredits = ri.currentCredit ?? 0
      const hasDuration = ri.hasDuration ?? false
      if (remainingCredits <= 0 && !hasDuration) {
        openAddCreditModal()
        indicesToProcess.slice(nextStreamIndex).forEach(i => {
          if (imageStatus.value[i] === 'queue' || imageStatus.value[i] === 'delaying') {
            imageStatus.value[i] = 'error'
          }
        })
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
        }
        delayCountdown.value = 0
        batchLoading.value = false
        currentlyProcessing.value = null
        return
      }

      const nextOriginalIndex = indicesToProcess[nextStreamIndex]
      const delay = delaySeconds.value > 0 ? delaySeconds.value : 0
      if (delay > 0) {
        startDelayCountdown(delay, nextOriginalIndex)
      } else {
        imageStatus.value[nextOriginalIndex] = 'loading'
        currentlyProcessing.value = batchFiles.value[nextOriginalIndex].name
      }
    },

    () => {
      batchLoading.value = false
      currentlyProcessing.value = null
      const oldHasDuration = creditsInfo.value?.hasDuration
      userService.getCredits().then(credits => {
        creditsInfo.value = { ...credits, hasDuration: credits.hasDuration ?? oldHasDuration }
      }).catch(err => console.warn('[Batch] Failed to refresh credits:', err))
    },

    (error) => {
      console.error('[Batch] Error:', error)
      batchLoading.value = false
      currentlyProcessing.value = null
      indicesToProcess.forEach(i => {
        if (imageStatus.value[i] === 'queue' || imageStatus.value[i] === 'loading' || imageStatus.value[i] === 'delaying') {
          imageStatus.value[i] = 'error'
        }
      })
      const errMsg = error.message || ''
      if (errMsg.toLowerCase().includes('insufficient credit')) {
        openAddCreditModal()
        return
      }
      alert('Batch generation failed: ' + errMsg)
    }
  )
}

const startDelayCountdown = (seconds, nextIndex) => {
  if (countdownInterval) clearInterval(countdownInterval)
  delayCountdown.value = seconds
  delayTargetIndex.value = nextIndex
  imageStatus.value[nextIndex] = 'delaying'

  countdownInterval = setInterval(() => {
    delayCountdown.value--
    if (delayCountdown.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      delayTargetIndex.value = -1
      imageStatus.value[nextIndex] = 'loading'
      currentlyProcessing.value = batchFiles.value[nextIndex].name
    }
  }, 1000)
}

const resetBatchForm = () => {
  clearBatchFiles()
  keywordCount.value = null
  negativeKeywordsText.value = ''
  delaySeconds.value = 10
}

const handleBatchExport = (platformId, format) => {
  const successfulResults = batchResults.value.filter(r => r.success && r.metadata)
  if (successfulResults.length === 0) return
  const exportData = successfulResults.map(r => ({
    inputFilename: r.filename || '',
    title: r.metadata.title || '',
    description: r.metadata.description || '',
    keywords: r.metadata.keywords || [],
    categories: r.metadata.categories || [],
    orientation: r.metadata.orientation || '',
    imageType: r.metadata.imageType || '',
    peopleCount: r.metadata.peopleCount,
    commercialViability: r.metadata.commercialViability || '',
    dominantColors: r.metadata.dominantColors || [],
  }))
  exportGenerations(exportData, platformId, format)
  showBatchExportMenu.value = false
}

const handleSingleExport = (platformId, format) => {
  if (!result.value?.metadata) return
  const exportData = [{
    inputFilename: selectedFile.value?.name || '',
    title: result.value.metadata.title || '',
    description: result.value.metadata.description || '',
    keywords: result.value.metadata.keywords || [],
    categories: result.value.metadata.categories || [],
    orientation: result.value.metadata.orientation || '',
    imageType: result.value.metadata.imageType || '',
    peopleCount: result.value.metadata.peopleCount,
    commercialViability: result.value.metadata.commercialViability || '',
    dominantColors: result.value.metadata.dominantColors || [],
  }]
  exportGenerations(exportData, platformId, format)
  showBatchExportMenu.value = false
}

const getImageStatus = (index) => {
  return imageStatus.value[index] || 'queue'
}

const copyToClipboard = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const copyKeywords = async () => {
  if (!result.value?.metadata?.keywords) return
  const keywordsText = result.value.metadata.keywords.join(', ')
  await copyToClipboard(keywordsText)
}

const copyKeywordsFromResult = async (result) => {
  if (!result?.metadata?.keywords) return
  const keywordsText = result.metadata.keywords.join(', ')
  await copyToClipboard(keywordsText)
}

const calculateSeoScore = (metadata) => {
  if (!metadata) return 0
  const keywordCount = metadata.keywords?.length || 0
  const titleLength = metadata.title?.length || 0
  let score = 0
  score += Math.min(70, keywordCount * 1.5)
  score += Math.min(30, titleLength * 0.5)
  return Math.min(100, Math.floor(score))
}

const getSeoScoreColor = (score) => {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-violet-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

const getSeoScoreTextClass = (score) => {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-violet-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

const openSubscribeModal = async () => {
  creditModalType.value = 'subscribe'
  try {
    availablePackages.value = await userService.getPackages()
  } catch (error) {
    console.error('Failed to load packages:', error)
  }
  showCreditModal.value = true
}

const openAddCreditModal = async () => {
  creditModalType.value = 'add-credit'
  try {
    availablePackages.value = await userService.getPackages()
  } catch (error) {
    console.error('Failed to load packages:', error)
  }
  showCreditModal.value = true
}

const handlePurchase = async (packageId) => {
  purchasing.value = true
  try {
    await userService.createOrder(packageId)
    showCreditModal.value = false
    router.push('/user/orders')
  } catch (error) {
    console.error('Failed to create order:', error)
    alert('Failed to create order. Please try again.')
  } finally {
    purchasing.value = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(40px);
  opacity: 0;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.custom-scrollbar-dark::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar-dark::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}
.custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
</style>
