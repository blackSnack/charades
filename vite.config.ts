import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
import {fileURLToPath,URL} from "node:url";
import {readFileSync} from "node:fs";
const version=JSON.parse(readFileSync(new URL("./package.json",import.meta.url),"utf8")).version;
export default defineConfig({
 base:"/charades/",
 define:{__APP_VERSION__:JSON.stringify(version)},
 resolve:{alias:{"@":fileURLToPath(new URL("./src",import.meta.url))}},
 build:{rollupOptions:{output:{onlyExplicitManualChunks:true,manualChunks(id){if(id.includes("/node_modules/metal-fx/"))return "vfx-metal";if(id.includes("/node_modules/@kongyo2/cards-css/"))return "vfx-foil"}}}},
 plugins:[react(),tailwindcss(),VitePWA({registerType:"prompt",includeAssets:["icon.svg"],manifest:{id:"./",name:"你比划我猜 · Party Deck",short_name:"比划我猜",lang:"zh-CN",start_url:"./",scope:"./",display:"standalone",background_color:"#FFF4DE",theme_color:"#FFF4DE",icons:[{src:"icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]},workbox:{clientsClaim:true,globPatterns:["**/*.{js,css,html,svg,png,woff2}"],globIgnores:["**/question-bank/**","**/VfxLab-*","**/vfx-metal-*","**/vfx-foil-*"],runtimeCaching:[{urlPattern:({url,sameOrigin})=>sameOrigin&&/\/assets\/(?:VfxLab|vfx-metal|vfx-foil)-[^/]+\.(?:js|css)$/.test(url.pathname),handler:"CacheFirst",options:{cacheName:"party-deck-vfx-v1",expiration:{maxEntries:12,maxAgeSeconds:2592000},cacheableResponse:{statuses:[200]}}}],navigateFallback:"index.html",cleanupOutdatedCaches:true}})]
});
