import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
import {fileURLToPath,URL} from "node:url";
export default defineConfig({
 base:"/charades/",
 resolve:{alias:{"@":fileURLToPath(new URL("./src",import.meta.url))}},
 plugins:[react(),tailwindcss(),VitePWA({registerType:"prompt",includeAssets:["icon.svg"],manifest:{id:"./",name:"你比划我猜 · Party Deck",short_name:"比划我猜",lang:"zh-CN",start_url:"./",scope:"./",display:"standalone",background_color:"#FFF4DE",theme_color:"#FFF4DE",icons:[{src:"icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]},workbox:{globPatterns:["**/*.{js,css,html,svg,png,woff2}"],globIgnores:["**/question-bank/**"],navigateFallback:"index.html",cleanupOutdatedCaches:true}})]
});
