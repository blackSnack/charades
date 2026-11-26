import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
import {fileURLToPath,URL} from "node:url";
export default defineConfig({
 base:"/charades/",
 resolve:{alias:{"@":fileURLToPath(new URL("./src",import.meta.url))}},
 build:{rollupOptions:{output:{manualChunks(id){if(id.includes("/node_modules/canvas-confetti/"))return "vfx-particles"}}}},
 plugins:[react(),tailwindcss(),VitePWA({registerType:"prompt",includeAssets:["icon.svg"],manifest:{id:"./",name:"你比划我猜 · Party Deck",short_name:"比划我猜",lang:"zh-CN",start_url:"./",scope:"./",display:"standalone",background_color:"#FFF4DE",theme_color:"#FFF4DE",icons:[{src:"icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]},workbox:{globPatterns:["**/*.{js,css,html,svg,png,woff2}"],globIgnores:["**/question-bank/**","**/VfxLab-*","**/vfx-particles-*"],runtimeCaching:[{urlPattern:({url,sameOrigin})=>sameOrigin&&/\/assets\/(?:VfxLab|vfx-particles)-[^/]+\.(?:js|css)$/.test(url.pathname),handler:"CacheFirst",options:{cacheName:"party-deck-vfx-v1",expiration:{maxEntries:12,maxAgeSeconds:2592000},cacheableResponse:{statuses:[200]}}}],navigateFallback:"index.html",cleanupOutdatedCaches:true}})]
});
